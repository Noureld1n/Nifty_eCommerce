package com.newtin.eco.dto.request;

import com.newtin.eco.enums.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public record PromotionRequest(
        @NotBlank @Size(max = 150) String name,
        String description,
        @NotNull DiscountType discountType,
        @NotNull @DecimalMin(value = "0.01") BigDecimal discountValue,
        @NotNull LocalDateTime startDate,
        @NotNull LocalDateTime endDate,
        @Size(max = 200) Set<@Positive Long> categoryIds,
        @Size(max = 200) Set<@Positive Long> productIds
) {}
