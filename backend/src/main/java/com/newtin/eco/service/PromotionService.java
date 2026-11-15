package com.newtin.eco.service;

import com.newtin.eco.dto.request.PromotionRequest;
import com.newtin.eco.dto.response.AppliedPromotionResponse;
import com.newtin.eco.dto.response.PromotionResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.enums.DiscountType;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.Category;
import com.newtin.eco.model.Product;
import com.newtin.eco.model.Promotion;
import com.newtin.eco.repository.CategoryRepository;
import com.newtin.eco.repository.ProductRepository;
import com.newtin.eco.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AdminActionLogService actionLogService;

    @Transactional(readOnly = true)
    public Page<PromotionResponse> listCurrent(Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findCurrent(now, pageable)
                .map(promotion -> PromotionResponse.from(promotion, now));
    }

    @Transactional(readOnly = true)
    public Page<PromotionResponse> listAdmin(Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findAllWithTargets(pageable)
                .map(promotion -> PromotionResponse.from(promotion, now));
    }

    @Transactional(readOnly = true)
    public PromotionResponse getAdmin(Long id) {
        LocalDateTime now = LocalDateTime.now();
        return PromotionResponse.from(findWithTargets(id), now);
    }

    @Transactional
    public PromotionResponse create(Long adminId, PromotionRequest request) {
        validate(request);
        Promotion promotion = Promotion.builder().name(request.name().trim())
                .description(trimToNull(request.description()))
                .discountType(request.discountType()).discountValue(request.discountValue())
                .startDate(request.startDate()).endDate(request.endDate())
                .active(true).categories(resolveCategories(request.categoryIds()))
                .products(resolveProducts(request.productIds())).build();
        promotion = promotionRepository.saveAndFlush(promotion);
        actionLogService.log(adminId, AdminActionType.PROMOTION_CREATED, AuditEntityType.PROMOTION,
                promotion.getId(), "Promotion created", null, auditValues(promotion));
        return PromotionResponse.from(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse update(Long adminId, Long id, PromotionRequest request) {
        validate(request);
        Promotion promotion = findWithTargets(id);
        promotion.setName(request.name().trim());
        promotion.setDescription(trimToNull(request.description()));
        promotion.setDiscountType(request.discountType());
        promotion.setDiscountValue(request.discountValue());
        promotion.setStartDate(request.startDate());
        promotion.setEndDate(request.endDate());
        promotion.setCategories(resolveCategories(request.categoryIds()));
        promotion.setProducts(resolveProducts(request.productIds()));
        actionLogService.log(adminId, AdminActionType.PROMOTION_UPDATED, AuditEntityType.PROMOTION,
                id, "Promotion updated", null, auditValues(promotion));
        return PromotionResponse.from(promotion, LocalDateTime.now());
    }

    @Transactional
    public PromotionResponse setActive(Long adminId, Long id, boolean active) {
        Promotion promotion = findWithTargets(id);
        if (promotion.isActive() == active)
            return PromotionResponse.from(promotion, LocalDateTime.now());
        promotion.setActive(active);
        actionLogService.log(adminId,
                active ? AdminActionType.PROMOTION_ACTIVATED : AdminActionType.PROMOTION_DEACTIVATED,
                AuditEntityType.PROMOTION, id, active ? "Promotion activated" : "Promotion deactivated",
                null, Map.of("active", active));
        return PromotionResponse.from(promotion, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<PromotionRepository.ApplicablePromotion> applicableForProducts(Collection<Long> productIds) {
        return productIds.isEmpty() ? List.of()
                : promotionRepository.findApplicable(productIds, LocalDateTime.now());
    }

    public AppliedPromotionResponse bestForPrice(Long productId, BigDecimal regularPrice,
                                                  List<PromotionRepository.ApplicablePromotion> candidates) {
        AppliedPromotionResponse best = null;
        for (PromotionRepository.ApplicablePromotion candidate : candidates) {
            if (!candidate.getProductId().equals(productId)) continue;
            DiscountType type = DiscountType.valueOf(candidate.getDiscountType());
            BigDecimal discounted = discountedPrice(regularPrice, type, candidate.getDiscountValue());
            if (best == null || discounted.compareTo(best.discountedPrice()) < 0) {
                best = new AppliedPromotionResponse(candidate.getPromotionId(), candidate.getPromotionName(),
                        type, candidate.getDiscountValue(), regularPrice, discounted);
            }
        }
        return best;
    }

    public BigDecimal discountedPrice(BigDecimal price, DiscountType type, BigDecimal value) {
        BigDecimal discounted = switch (type) {
            case PERCENTAGE -> price.multiply(BigDecimal.ONE.subtract(value.movePointLeft(2)));
            case FIXED_AMOUNT -> price.subtract(value).max(BigDecimal.ZERO);
        };
        return discounted.setScale(2, RoundingMode.HALF_UP);
    }

    private void validate(PromotionRequest request) {
        if (!request.endDate().isAfter(request.startDate()))
            throw new BadRequestException("Promotion endDate must be after startDate");
        if (request.discountType() == DiscountType.PERCENTAGE
                && request.discountValue().compareTo(new BigDecimal("100")) > 0)
            throw new BadRequestException("Percentage discounts cannot exceed 100");
        if (request.discountValue().signum() <= 0)
            throw new BadRequestException("Discount value must be greater than zero");
    }

    private Set<Category> resolveCategories(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<Category> found = categoryRepository.findAllById(ids);
        if (found.size() != ids.size())
            throw new ResourceNotFoundException("One or more categories were not found");
        return new HashSet<>(found);
    }

    private Set<Product> resolveProducts(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<Product> found = productRepository.findAllById(ids);
        if (found.size() != ids.size())
            throw new ResourceNotFoundException("One or more products were not found");
        return new HashSet<>(found);
    }

    private Promotion findWithTargets(Long id) {
        return promotionRepository.findWithTargets(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found"));
    }

    private Map<String, Object> auditValues(Promotion promotion) {
        Map<String, Object> values = new HashMap<>();
        values.put("name", promotion.getName());
        values.put("discountType", promotion.getDiscountType());
        values.put("discountValue", promotion.getDiscountValue());
        values.put("startDate", promotion.getStartDate());
        values.put("endDate", promotion.getEndDate());
        values.put("categoryIds", promotion.getCategories().stream().map(Category::getId).toList());
        values.put("productIds", promotion.getProducts().stream().map(Product::getId).toList());
        return values;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
