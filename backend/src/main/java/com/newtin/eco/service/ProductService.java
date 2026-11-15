package com.newtin.eco.service;

import com.newtin.eco.dto.request.ProductRequest;
import com.newtin.eco.dto.request.CreateProductRequest;
import com.newtin.eco.dto.request.VariantRequest;
import com.newtin.eco.dto.response.ProductResponse;
import com.newtin.eco.dto.response.VariantResponse;
import com.newtin.eco.dto.response.AppliedPromotionResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.enums.ProductType;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.*;
import com.newtin.eco.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ClothingRepository clothingRepository;
    private final AccessoryRepository accessoryRepository;
    private final SkincareRepository skincareRepository;
    private final ClothingVariantRepository clothingVariantRepository;
    private final AccessoryVariantRepository accessoryVariantRepository;
    private final SkincareVariantRepository skincareVariantRepository;
    private final VariantItemRepository variantItemRepository;
    private final ProductImageRepository imageRepository;
    private final AdminActionLogService actionLogService;
    private final PromotionService promotionService;

    @Transactional(readOnly = true)
    public Page<ProductResponse> listPublic(Long categoryId, ProductType type, Pageable pageable) {
        return productRepository.findPublic(categoryId, type, pageable).map(product -> response(product, true));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> listAdmin(Long categoryId, ProductType type, Boolean active, Pageable pageable) {
        return productRepository.searchAdmin(categoryId, type, active, pageable).map(this::response);
    }

    @Transactional(readOnly = true)
    public ProductResponse getPublic(Long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .filter(product -> product.getCategory() == null || product.getCategory().isActive())
                .map(product -> response(product, true))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    @Transactional(readOnly = true)
    public ProductResponse getAdmin(Long id) {
        return response(findProduct(id));
    }

    @Transactional
    public ProductResponse create(Long adminId, CreateProductRequest createRequest) {
        ProductRequest request = createRequest.productFields();
        validateTypeDetails(request);
        Category category = categoryFor(request.categoryId());
        Product product = productRepository.saveAndFlush(Product.builder()
                .category(category)
                .type(request.type())
                .name(request.name().trim())
                .basePrice(request.basePrice())
                .description(trimToNull(request.description()))
                .details(trimToNull(request.details()))
                .build());
        saveTypeDetails(product, request);
        if (createRequest.variants() == null || createRequest.variants().isEmpty()) {
            createStandardVariant(product);
        } else {
            for (VariantRequest variant : createRequest.variants()) {
                addVariant(adminId, product.getId(), variant);
            }
        }
        actionLogService.log(adminId, AdminActionType.PRODUCT_CREATED, AuditEntityType.PRODUCT,
                product.getId(), "Product created", null, Map.of("name", product.getName(), "type", product.getType()));
        return response(findProduct(product.getId()));
    }

    @Transactional
    public ProductResponse update(Long adminId, Long id, ProductRequest request) {
        validateTypeDetails(request);
        Product product = findProduct(id);
        if (product.getType() != request.type())
            throw new BadRequestException("Product type cannot be changed after creation");
        product.setCategory(categoryFor(request.categoryId()));
        product.setName(request.name().trim());
        product.setBasePrice(request.basePrice());
        product.setDescription(trimToNull(request.description()));
        product.setDetails(trimToNull(request.details()));
        saveTypeDetails(product, request);
        actionLogService.log(adminId, AdminActionType.PRODUCT_UPDATED, AuditEntityType.PRODUCT,
                id, "Product updated", null, Map.of("name", product.getName()));
        return response(product);
    }

    @Transactional
    public ProductResponse setActive(Long adminId, Long id, boolean active) {
        Product product = findProduct(id);
        if (product.isActive() == active) return response(product);
        product.setActive(active);
        actionLogService.log(adminId,
                active ? AdminActionType.PRODUCT_ACTIVATED : AdminActionType.PRODUCT_DEACTIVATED,
                AuditEntityType.PRODUCT, id, active ? "Product activated" : "Product deactivated",
                null, Map.of("active", active));
        return response(product);
    }

    @Transactional(readOnly = true)
    public List<VariantResponse> listVariants(Long productId, boolean publicView) {
        Product product = publicView ? productRepository.findByIdAndActiveTrue(productId)
                .filter(p -> p.getCategory() == null || p.getCategory().isActive())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found")) : findProduct(productId);
        List<VariantResponse> results = variants(product, publicView);
        return publicView ? results.stream().filter(VariantResponse::active).toList() : results;
    }

    @Transactional
    public VariantResponse addVariant(Long adminId, Long productId, VariantRequest request) {
        Product product = findProduct(productId);
        validateVariant(product, request);
        boolean makeDefault = Boolean.TRUE.equals(request.makeDefault());
        return switch (product.getType()) {
            case CLOTHING -> addClothingVariant(adminId, product, request, makeDefault);
            case ACCESSORY -> addAccessoryVariant(adminId, product, request, makeDefault);
            case SKINCARE -> addSkincareVariant(adminId, product, request, makeDefault);
        };
    }

    @Transactional
    public VariantResponse updateVariant(Long adminId, Long productId, Long variantId, VariantRequest request) {
        Product product = findProduct(productId);
        validateVariant(product, request);
        switch (product.getType()) {
            case CLOTHING -> {
                ClothingVariant variant = clothingVariantRepository.findByVariantItemId(variantId)
                        .filter(value -> value.getClothing().getId().equals(productId))
                        .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
                variant.setSize(request.size().trim());
                variant.setColor(request.color().trim());
                variant.setPriceAdjustment(priceAdjustment(request));
                updateVariantItem(variant.getVariantItem(), request);
                logVariant(adminId, AdminActionType.VARIANT_UPDATED, variant.getVariantItem().getId());
                return toResponse(product, variant.getVariantItem(), variant.isDefaultVariant(),
                        variant.getPriceAdjustment(), variant.getSize(), variant.getColor(),
                        clothingRepository.findById(productId).orElseThrow().getMaterial(), null, null, null);
            }
            case ACCESSORY -> {
                AccessoryVariant variant = accessoryVariantRepository.findByVariantItemId(variantId)
                        .filter(value -> value.getAccessory().getId().equals(productId))
                        .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
                variant.setColor(trimToNull(request.color()));
                variant.setMaterial(trimToNull(request.material()));
                variant.setPriceAdjustment(priceAdjustment(request));
                updateVariantItem(variant.getVariantItem(), request);
                logVariant(adminId, AdminActionType.VARIANT_UPDATED, variant.getVariantItem().getId());
                return toResponse(product, variant.getVariantItem(), variant.isDefaultVariant(),
                        variant.getPriceAdjustment(), null, variant.getColor(), variant.getMaterial(),
                        null, null, null);
            }
            case SKINCARE -> {
                SkincareVariant variant = skincareVariantRepository.findByVariantItemId(variantId)
                        .filter(value -> value.getSkincare().getId().equals(productId))
                        .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
                variant.setVolumeMl(request.volumeMl());
                variant.setSizeLabel(trimToNull(request.sizeLabel()));
                variant.setFormulation(trimToNull(request.formulation()));
                variant.setPriceAdjustment(priceAdjustment(request));
                updateVariantItem(variant.getVariantItem(), request);
                logVariant(adminId, AdminActionType.VARIANT_UPDATED, variant.getVariantItem().getId());
                return toResponse(product, variant.getVariantItem(), variant.isDefaultVariant(),
                        variant.getPriceAdjustment(), null, null, null,
                        variant.getVolumeMl(), variant.getSizeLabel(), variant.getFormulation());
            }
        }
        throw new IllegalStateException("Unsupported product type");
    }

    @Transactional
    public VariantResponse setVariantActive(Long adminId, Long productId, Long variantId, boolean active) {
        Product product = findProduct(productId);
        VariantResponse response = variants(product).stream()
                .filter(variant -> variant.variantItemId().equals(variantId))
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
        VariantItem item = variantItemRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
        if (item.isActive() == active) return response;
        if (!active && response.defaultVariant()) {
            VariantResponse replacement = variants(product).stream()
                    .filter(variant -> !variant.variantItemId().equals(variantId) && variant.active())
                    .findFirst().orElseThrow(() -> new ConflictException(
                            "A product must retain an active default variant"));
            setDefaultVariant(adminId, productId, replacement.variantItemId());
        }
        item.setActive(active);
        logVariant(adminId, active ? AdminActionType.VARIANT_ACTIVATED : AdminActionType.VARIANT_DEACTIVATED, variantId);
        return new VariantResponse(response.variantItemId(), response.productType(), active,
                response.stockQuantity(), response.additionalDescription(), response.defaultVariant(),
                response.priceAdjustment(), response.size(), response.color(), response.material(),
                response.volumeMl(), response.sizeLabel(), response.formulation(), response.images(),
                response.regularPrice(), response.currentPrice(), response.promotion());
    }

    @Transactional
    public VariantResponse setDefaultVariant(Long adminId, Long productId, Long variantId) {
        Product product = findProduct(productId);
        switch (product.getType()) {
            case CLOTHING -> {
                ClothingVariant target = clothingVariantRepository.findByVariantItemId(variantId)
                        .filter(value -> value.getClothing().getId().equals(productId))
                        .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
                if (!target.getVariantItem().isActive())
                    throw new ConflictException("An inactive variant cannot be the default");
                var variants = clothingVariantRepository.findByClothingIdOrderByDefaultVariantDescIdAsc(productId);
                variants.forEach(variant -> variant.setDefaultVariant(false));
                clothingVariantRepository.flush();
                target.setDefaultVariant(true);
            }
            case ACCESSORY -> {
                AccessoryVariant target = accessoryVariantRepository.findByVariantItemId(variantId)
                        .filter(value -> value.getAccessory().getId().equals(productId))
                        .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
                if (!target.getVariantItem().isActive())
                    throw new ConflictException("An inactive variant cannot be the default");
                var variants = accessoryVariantRepository.findByAccessoryIdOrderByDefaultVariantDescIdAsc(productId);
                variants.forEach(variant -> variant.setDefaultVariant(false));
                accessoryVariantRepository.flush();
                target.setDefaultVariant(true);
            }
            case SKINCARE -> {
                SkincareVariant target = skincareVariantRepository.findByVariantItemId(variantId)
                        .filter(value -> value.getSkincare().getId().equals(productId))
                        .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
                if (!target.getVariantItem().isActive())
                    throw new ConflictException("An inactive variant cannot be the default");
                var variants = skincareVariantRepository.findBySkincareIdOrderByDefaultVariantDescIdAsc(productId);
                variants.forEach(variant -> variant.setDefaultVariant(false));
                skincareVariantRepository.flush();
                target.setDefaultVariant(true);
            }
        }
        logVariant(adminId, AdminActionType.VARIANT_UPDATED, variantId);
        return variants(product, false).stream().filter(variant -> variant.variantItemId().equals(variantId))
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
    }

    @Transactional(readOnly = true)
    public Long productIdForVariant(Long variantId) {
        return variantItemRepository.findProductId(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
    }

    private VariantResponse addClothingVariant(Long adminId, Product product, VariantRequest request, boolean makeDefault) {
        Clothing clothing = clothingRepository.findById(product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product subtype not found"));
        if (makeDefault) clearDefaults(product);
        boolean defaultForInsert = makeDefault
                || !clothingVariantRepository.existsByClothingIdAndDefaultVariantTrue(product.getId());
        VariantItem item = createVariantItem(request);
        ClothingVariant saved = clothingVariantRepository.saveAndFlush(ClothingVariant.builder()
                .clothing(clothing).variantItem(item).defaultVariant(defaultForInsert)
                .size(request.size().trim()).color(request.color().trim())
                .priceAdjustment(priceAdjustment(request)).build());
        logVariant(adminId, AdminActionType.VARIANT_CREATED, item.getId());
        return toResponse(product, item, saved.isDefaultVariant(), saved.getPriceAdjustment(), saved.getSize(), saved.getColor(),
                clothing.getMaterial(), null, null, null);
    }

    private VariantResponse addAccessoryVariant(Long adminId, Product product, VariantRequest request, boolean makeDefault) {
        Accessory accessory = accessoryRepository.findById(product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product subtype not found"));
        if (makeDefault) clearDefaults(product);
        boolean defaultForInsert = makeDefault
                || !accessoryVariantRepository.existsByAccessoryIdAndDefaultVariantTrue(product.getId());
        VariantItem item = createVariantItem(request);
        AccessoryVariant saved = accessoryVariantRepository.saveAndFlush(AccessoryVariant.builder()
                .accessory(accessory).variantItem(item).defaultVariant(defaultForInsert)
                .color(trimToNull(request.color())).material(trimToNull(request.material()))
                .priceAdjustment(priceAdjustment(request)).build());
        logVariant(adminId, AdminActionType.VARIANT_CREATED, item.getId());
        return toResponse(product, item, saved.isDefaultVariant(), saved.getPriceAdjustment(), null, saved.getColor(),
                saved.getMaterial(), null, null, null);
    }

    private VariantResponse addSkincareVariant(Long adminId, Product product, VariantRequest request, boolean makeDefault) {
        Skincare skincare = skincareRepository.findById(product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product subtype not found"));
        if (makeDefault) clearDefaults(product);
        boolean defaultForInsert = makeDefault
                || !skincareVariantRepository.existsBySkincareIdAndDefaultVariantTrue(product.getId());
        VariantItem item = createVariantItem(request);
        SkincareVariant saved = skincareVariantRepository.saveAndFlush(SkincareVariant.builder()
                .skincare(skincare).variantItem(item).defaultVariant(defaultForInsert)
                .volumeMl(request.volumeMl()).sizeLabel(trimToNull(request.sizeLabel()))
                .formulation(trimToNull(request.formulation()))
                .priceAdjustment(priceAdjustment(request)).build());
        logVariant(adminId, AdminActionType.VARIANT_CREATED, item.getId());
        return toResponse(product, item, saved.isDefaultVariant(), saved.getPriceAdjustment(), null, null, null,
                saved.getVolumeMl(), saved.getSizeLabel(), saved.getFormulation());
    }

    private List<VariantResponse> variants(Product product) {
        return variants(product, false);
    }

    private List<VariantResponse> variants(Product product, boolean publicView) {
        var candidates = promotionService.applicableForProducts(Set.of(product.getId()));
        List<VariantResponse> results = switch (product.getType()) {
            case CLOTHING -> clothingVariantRepository.findByClothingIdOrderByDefaultVariantDescIdAsc(product.getId())
                    .stream().map(v -> toResponse(product, v.getVariantItem(), v.isDefaultVariant(),
                            v.getPriceAdjustment(), v.getSize(), v.getColor(),
                            clothingRepository.findById(product.getId()).orElseThrow().getMaterial(),
                            null, null, null, candidates)).toList();
            case ACCESSORY -> accessoryVariantRepository.findByAccessoryIdOrderByDefaultVariantDescIdAsc(product.getId())
                    .stream().map(v -> toResponse(product, v.getVariantItem(), v.isDefaultVariant(),
                            v.getPriceAdjustment(), null, v.getColor(), v.getMaterial(), null, null, null,
                            candidates)).toList();
            case SKINCARE -> skincareVariantRepository.findBySkincareIdOrderByDefaultVariantDescIdAsc(product.getId())
                    .stream().map(v -> toResponse(product, v.getVariantItem(), v.isDefaultVariant(),
                            v.getPriceAdjustment(), null, null, null, v.getVolumeMl(), v.getSizeLabel(),
                            v.getFormulation(), candidates)).toList();
        };
        return results.stream().filter(variant -> !publicView || variant.active()).toList();
    }

    private VariantResponse toResponse(Product product, VariantItem item, boolean isDefault, BigDecimal adjustment,
                                       String size, String color, String material, BigDecimal volumeMl,
                                       String sizeLabel, String formulation) {
        return toResponse(product, item, isDefault, adjustment, size, color, material, volumeMl,
                sizeLabel, formulation, promotionService.applicableForProducts(Set.of(product.getId())));
    }

    private VariantResponse toResponse(Product product, VariantItem item, boolean isDefault, BigDecimal adjustment,
                                       String size, String color, String material, BigDecimal volumeMl,
                                       String sizeLabel, String formulation,
                                       List<com.newtin.eco.repository.PromotionRepository.ApplicablePromotion> promotions) {
        BigDecimal regularPrice = product.getBasePrice().add(adjustment);
        AppliedPromotionResponse promotion = promotionService.bestForPrice(product.getId(), regularPrice, promotions);
        return new VariantResponse(item.getId(), product.getType(), item.isActive(), item.getStockQuantity(),
                item.getAdditionalDescription(), isDefault, adjustment, size, color, material, volumeMl,
                sizeLabel, formulation, imageRepository.findByVariantItemIdOrderByDisplayOrderAscIdAsc(item.getId())
                .stream().map(com.newtin.eco.dto.response.ProductImageResponse::from).toList(),
                regularPrice, promotion == null ? regularPrice : promotion.discountedPrice(), promotion);
    }

    private ProductResponse response(Product product) {
        return response(product, false);
    }

    private ProductResponse response(Product product, boolean publicView) {
        Map<String, String> typeDetails = new HashMap<>();
        switch (product.getType()) {
            case CLOTHING -> {
                clothingRepository.findById(product.getId()).ifPresent(clothing -> {
                    typeDetails.put("clothingType", clothing.getClothingType());
                    put(typeDetails, "material", clothing.getMaterial());
                });
            }
            case ACCESSORY -> {
                accessoryRepository.findById(product.getId()).ifPresent(accessory -> {
                    typeDetails.put("accessoryType", accessory.getAccessoryType());
                    put(typeDetails, "material", accessory.getMaterial());
                });
            }
            case SKINCARE -> {
                skincareRepository.findById(product.getId()).ifPresent(skincare -> {
                    typeDetails.put("skincareType", skincare.getSkincareType());
                    put(typeDetails, "skinType", skincare.getSkinType());
                });
            }
        }
        return new ProductResponse(product.getId(), product.getCategory() == null ? null : product.getCategory().getId(),
                product.getCategory() == null ? null : product.getCategory().getName(), product.getType(),
                product.getName(), product.getBasePrice(), product.isActive(), product.getDescription(),
                product.getDetails(), Map.copyOf(typeDetails),
                variants(product, publicView),
                product.getCreatedAt(),
                product.getUpdatedAt());
    }

    private void saveTypeDetails(Product product, ProductRequest request) {
        switch (product.getType()) {
            case CLOTHING -> {
                Clothing clothing = clothingRepository.findById(product.getId())
                        .orElseGet(() -> Clothing.builder().product(product).build());
                clothing.setClothingType(request.clothingType().trim());
                clothing.setMaterial(trimToNull(request.material()));
                clothingRepository.save(clothing);
            }
            case ACCESSORY -> {
                Accessory accessory = accessoryRepository.findById(product.getId())
                        .orElseGet(() -> Accessory.builder().product(product).build());
                accessory.setAccessoryType(request.accessoryType().trim());
                accessory.setMaterial(trimToNull(request.material()));
                accessoryRepository.save(accessory);
            }
            case SKINCARE -> {
                Skincare skincare = skincareRepository.findById(product.getId())
                        .orElseGet(() -> Skincare.builder().product(product).build());
                skincare.setSkincareType(request.skincareType().trim());
                skincare.setSkinType(trimToNull(request.skinType()));
                skincareRepository.save(skincare);
            }
        }
    }

    private void createStandardVariant(Product product) {
        VariantRequest standard = new VariantRequest("Standard", "Standard", null, null,
                "Standard", null, BigDecimal.ZERO, null, true);
        switch (product.getType()) {
            case CLOTHING -> {
                Clothing clothing = clothingRepository.findById(product.getId()).orElseThrow();
                ClothingVariant variant = clothingVariantRepository.saveAndFlush(ClothingVariant.builder()
                        .clothing(clothing).variantItem(createVariantItem(standard))
                        .defaultVariant(true).size("Standard").color("Standard").build());
                variant.setDefaultVariant(true);
            }
            case ACCESSORY -> {
                Accessory accessory = accessoryRepository.findById(product.getId()).orElseThrow();
                AccessoryVariant variant = accessoryVariantRepository.saveAndFlush(AccessoryVariant.builder()
                        .accessory(accessory).variantItem(createVariantItem(standard))
                        .defaultVariant(true).build());
                variant.setDefaultVariant(true);
            }
            case SKINCARE -> {
                Skincare skincare = skincareRepository.findById(product.getId()).orElseThrow();
                SkincareVariant variant = skincareVariantRepository.saveAndFlush(SkincareVariant.builder()
                        .skincare(skincare).variantItem(createVariantItem(standard))
                        .defaultVariant(true).sizeLabel("Standard").build());
                variant.setDefaultVariant(true);
            }
        }
    }

    private VariantItem createVariantItem(VariantRequest request) {
        return variantItemRepository.saveAndFlush(VariantItem.builder()
                .active(true)
                .stockQuantity(0)
                .additionalDescription(trimToNull(request.additionalDescription()))
                .build());
    }

    private void updateVariantItem(VariantItem item, VariantRequest request) {
        item.setAdditionalDescription(trimToNull(request.additionalDescription()));
    }

    private void clearDefaults(Product product) {
        switch (product.getType()) {
            case CLOTHING -> clothingVariantRepository.findByClothingIdOrderByDefaultVariantDescIdAsc(product.getId())
                    .forEach(variant -> variant.setDefaultVariant(false));
            case ACCESSORY -> accessoryVariantRepository.findByAccessoryIdOrderByDefaultVariantDescIdAsc(product.getId())
                    .forEach(variant -> variant.setDefaultVariant(false));
            case SKINCARE -> skincareVariantRepository.findBySkincareIdOrderByDefaultVariantDescIdAsc(product.getId())
                    .forEach(variant -> variant.setDefaultVariant(false));
        }
    }

    private void validateTypeDetails(ProductRequest request) {
        switch (request.type()) {
            case CLOTHING -> {
                if (isBlank(request.clothingType()))
                    throw new BadRequestException("clothingType is required for clothing products");
            }
            case ACCESSORY -> {
                if (isBlank(request.accessoryType()))
                    throw new BadRequestException("accessoryType is required for accessory products");
            }
            case SKINCARE -> {
                if (isBlank(request.skincareType()))
                    throw new BadRequestException("skincareType is required for skincare products");
            }
        }
    }

    private void validateVariant(Product product, VariantRequest request) {
        if (priceAdjustment(request).add(product.getBasePrice()).signum() < 0)
            throw new BadRequestException("Variant price cannot be negative");
        switch (product.getType()) {
            case CLOTHING -> {
                if (isBlank(request.size()) || isBlank(request.color()))
                    throw new BadRequestException("size and color are required for clothing variants");
            }
            case ACCESSORY -> {
                if (isBlank(request.color()) && isBlank(request.material()))
                    throw new BadRequestException("color or material is required for accessory variants");
            }
            case SKINCARE -> {
                if (request.volumeMl() == null && isBlank(request.sizeLabel()) && isBlank(request.formulation()))
                    throw new BadRequestException("Provide a size, volume, or formulation for skincare variants");
            }
        }
    }

    private Category categoryFor(Long categoryId) {
        if (categoryId == null) return null;
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!category.isActive()) throw new ConflictException("Cannot assign an inactive category");
        return category;
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private BigDecimal priceAdjustment(VariantRequest request) {
        return request.priceAdjustment() == null ? BigDecimal.ZERO : request.priceAdjustment();
    }

    private void logVariant(Long adminId, AdminActionType action, Long id) {
        actionLogService.log(adminId, action, AuditEntityType.VARIANT_ITEM, id,
                "Product variant changed", null, null);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void put(Map<String, String> map, String key, String value) {
        if (value != null) map.put(key, value);
    }
}
