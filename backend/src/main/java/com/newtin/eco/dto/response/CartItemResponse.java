package com.newtin.eco.dto.response;

import java.math.BigDecimal;

public record CartItemResponse(
        Long variantItemId,
        Long productId,
        String productName,
        String imageUrl,
        String variantDescription,
        Integer quantity,
        Integer availableStock,
        BigDecimal regularUnitPrice,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        AppliedPromotionResponse promotion
) {}
