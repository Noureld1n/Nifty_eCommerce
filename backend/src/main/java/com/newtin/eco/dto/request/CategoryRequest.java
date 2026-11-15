package com.newtin.eco.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @Positive Long parentCategoryId
) {}
