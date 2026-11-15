package com.newtin.eco.dto.response;

import com.newtin.eco.enums.DiscountType;

import java.math.BigDecimal;

public record AppliedPromotionResponse(
        Long id,
        String name,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal originalPrice,
        BigDecimal discountedPrice
) {}
