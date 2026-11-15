package com.newtin.eco.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record VariantRequest(
        @Size(max = 30) String size,
        @Size(max = 60) String color,
        @Size(max = 120) String material,
        @DecimalMin(value = "0.01", inclusive = true) BigDecimal volumeMl,
        @Size(max = 40) String sizeLabel,
        @Size(max = 120) String formulation,
        BigDecimal priceAdjustment,
        @Size(max = 1000) String additionalDescription,
        Boolean makeDefault
) {}
