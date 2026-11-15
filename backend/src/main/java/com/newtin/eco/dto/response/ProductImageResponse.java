package com.newtin.eco.dto.response;

import com.newtin.eco.model.ProductImage;

import java.time.LocalDateTime;

public record ProductImageResponse(Long id, Long variantItemId, String imageUrl, String altText,
                                   Integer displayOrder, boolean main, LocalDateTime createdAt) {
    public static ProductImageResponse from(ProductImage image) {
        return new ProductImageResponse(image.getId(), image.getVariantItem().getId(),
                image.getImageUrl(), image.getAltText(), image.getDisplayOrder(),
                image.isMain(), image.getCreatedAt());
    }
}
