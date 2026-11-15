package com.newtin.eco.dto.response;

import com.newtin.eco.enums.DiscountType;
import com.newtin.eco.model.Promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public record PromotionResponse(
        Long id,
        String name,
        String description,
        DiscountType discountType,
        BigDecimal discountValue,
        LocalDateTime startDate,
        LocalDateTime endDate,
        boolean active,
        boolean currentlyEffective,
        Set<Long> categoryIds,
        Set<Long> productIds
) {
    public static PromotionResponse from(Promotion promotion, LocalDateTime now) {
        return new PromotionResponse(promotion.getId(), promotion.getName(), promotion.getDescription(),
                promotion.getDiscountType(), promotion.getDiscountValue(), promotion.getStartDate(),
                promotion.getEndDate(), promotion.isActive(),
                promotion.isActive() && !promotion.getStartDate().isAfter(now) && promotion.getEndDate().isAfter(now),
                promotion.getCategories().stream().map(category -> category.getId())
                        .collect(java.util.stream.Collectors.toUnmodifiableSet()),
                promotion.getProducts().stream().map(product -> product.getId())
                        .collect(java.util.stream.Collectors.toUnmodifiableSet()));
    }
}
