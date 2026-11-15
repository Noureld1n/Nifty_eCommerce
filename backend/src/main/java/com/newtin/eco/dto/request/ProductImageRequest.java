package com.newtin.eco.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProductImageRequest(
        @NotBlank @Size(max = 2048) String imageUrl,
        @Size(max = 255) String altText,
        @PositiveOrZero Integer displayOrder,
        Boolean main
) {}
