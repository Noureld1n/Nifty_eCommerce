package com.newtin.eco.dto.response;

import com.newtin.eco.enums.ProductType;

import java.math.BigDecimal;
import java.util.List;

public record VariantResponse(
        Long variantItemId,
        ProductType productType,
        boolean active,
        int stockQuantity,
        String additionalDescription,
        boolean defaultVariant,
        BigDecimal priceAdjustment,
        String size,
        String color,
        String material,
        BigDecimal volumeMl,
        String sizeLabel,
        String formulation,
        List<ProductImageResponse> images,
        BigDecimal regularPrice,
        BigDecimal currentPrice,
        AppliedPromotionResponse promotion
) {}
