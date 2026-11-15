package com.newtin.eco.dto.request;

import com.newtin.eco.enums.ProductType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(
        @NotNull ProductType type,
        @Positive Long categoryId,
        @NotBlank @Size(max = 200) String name,
        @NotNull @DecimalMin("0.00") BigDecimal basePrice,
        @Size(max = 1000) String description,
        String details,
        @Size(max = 80) String clothingType,
        @Size(max = 80) String accessoryType,
        @Size(max = 80) String skincareType,
        @Size(max = 120) String material,
        @Size(max = 100) String skinType,
        List<@Valid VariantRequest> variants
) {
    public ProductRequest productFields() {
        return new ProductRequest(type, categoryId, name, basePrice, description, details,
                clothingType, accessoryType, skincareType, material, skinType);
    }
}
