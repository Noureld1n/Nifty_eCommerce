package com.newtin.eco.dto.response;

import com.newtin.eco.model.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long variantItemId,
        Integer quantity,
        BigDecimal priceAtPurchase,
        String productName,
        String variantDescription
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(item.getId(), item.getVariantItem().getId(), item.getQuantity(),
                item.getPriceAtPurchase(), item.getProductNameAtPurchase(),
                item.getVariantDescriptionAtPurchase());
    }
}
