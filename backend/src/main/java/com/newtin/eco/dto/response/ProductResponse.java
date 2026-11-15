package com.newtin.eco.dto.response;

import com.newtin.eco.enums.ProductType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ProductResponse(
        Long id,
        Long categoryId,
        String categoryName,
        ProductType type,
        String name,
        BigDecimal basePrice,
        boolean active,
        String description,
        String details,
        Map<String, String> typeDetails,
        List<VariantResponse> variants,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
