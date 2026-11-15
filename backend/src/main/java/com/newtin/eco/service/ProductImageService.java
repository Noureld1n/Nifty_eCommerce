package com.newtin.eco.service;

import com.newtin.eco.dto.request.ProductImageRequest;
import com.newtin.eco.dto.response.ProductImageResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.ProductImage;
import com.newtin.eco.model.VariantItem;
import com.newtin.eco.repository.ProductImageRepository;
import com.newtin.eco.repository.VariantItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductImageService {
    private final ProductImageRepository imageRepository;
    private final VariantItemRepository variantItemRepository;
    private final ProductService productService;
    private final AdminActionLogService actionLogService;

    @Transactional(readOnly = true)
    public List<ProductImageResponse> list(Long productId, Long variantId) {
        requireVariant(productId, variantId);
        return imageRepository.findByVariantItemIdOrderByDisplayOrderAscIdAsc(variantId)
                .stream().map(ProductImageResponse::from).toList();
    }

    @Transactional
    public ProductImageResponse create(Long adminId, Long productId, Long variantId,
                                       ProductImageRequest request) {
        VariantItem variantItem = requireVariant(productId, variantId);
        boolean makeMain = Boolean.TRUE.equals(request.main())
                || !imageRepository.existsByVariantItemIdAndMainTrue(variantId);
        if (makeMain) imageRepository.clearMain(variantId);

        ProductImage image = imageRepository.saveAndFlush(ProductImage.builder()
                .variantItem(variantItem)
                .imageUrl(request.imageUrl().trim())
                .altText(trimToNull(request.altText()))
                .displayOrder(request.displayOrder() == null ? 0 : request.displayOrder())
                .main(makeMain)
                .build());
        actionLogService.log(adminId, AdminActionType.IMAGE_CREATED, AuditEntityType.PRODUCT_IMAGE,
                image.getId(), "Product image added", null, Map.of("variantItemId", variantId));
        return ProductImageResponse.from(image);
    }

    @Transactional
    public ProductImageResponse update(Long adminId, Long productId, Long variantId, Long imageId,
                                       ProductImageRequest request) {
        requireVariant(productId, variantId);
        ProductImage image = findImage(imageId, variantId);
        boolean requestedMain = request.main() == null ? image.isMain() : request.main();
        if (!requestedMain && image.isMain())
            throw new ConflictException("The main image cannot be unset; choose another main image first");
        if (requestedMain && !image.isMain()) imageRepository.clearMain(variantId);

        image.setImageUrl(request.imageUrl().trim());
        image.setAltText(trimToNull(request.altText()));
        image.setDisplayOrder(request.displayOrder() == null ? image.getDisplayOrder() : request.displayOrder());
        image.setMain(requestedMain);

        actionLogService.log(adminId, AdminActionType.IMAGE_UPDATED, AuditEntityType.PRODUCT_IMAGE,
                imageId, "Product image updated", null, Map.of("variantItemId", variantId));
        return ProductImageResponse.from(image);
    }

    @Transactional
    public void delete(Long adminId, Long productId, Long variantId, Long imageId) {
        requireVariant(productId, variantId);
        ProductImage image = findImage(imageId, variantId);
        boolean wasMain = image.isMain();
        imageRepository.delete(image);
        if (wasMain) {
            imageRepository.findByVariantItemIdOrderByDisplayOrderAscIdAsc(variantId).stream()
                    .findFirst().ifPresent(next -> {
                        next.setMain(true);
                        imageRepository.save(next);
                    });
        }
        actionLogService.log(adminId, AdminActionType.IMAGE_DELETED, AuditEntityType.PRODUCT_IMAGE,
                imageId, "Product image deleted", null, Map.of("variantItemId", variantId));
    }

    private VariantItem requireVariant(Long productId, Long variantId) {
        if (!productService.productIdForVariant(variantId).equals(productId))
            throw new ResourceNotFoundException("Product variant not found");
        return variantItemRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
    }

    private ProductImage findImage(Long imageId, Long variantId) {
        return imageRepository.findByIdAndVariantItemId(imageId, variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
