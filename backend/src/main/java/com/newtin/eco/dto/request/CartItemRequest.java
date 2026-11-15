package com.newtin.eco.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CartItemRequest(
        @NotNull @Positive Long variantItemId,
        @NotNull @Positive Integer quantity
) {}
