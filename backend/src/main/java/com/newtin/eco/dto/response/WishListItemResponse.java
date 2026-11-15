package com.newtin.eco.dto.response;

import com.newtin.eco.enums.ProductType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WishListItemResponse(
        Long id,
        Long productId,
        String productName,
        ProductType productType,
        String imageUrl,
        BigDecimal basePrice,
        LocalDateTime addedAt
) {}
