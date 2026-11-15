package com.newtin.eco.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ProductReviewRequest(
        @Size(max = 200) String title,
        @Size(max = 10000) String text,
        @Min(1) @Max(5) Integer rating,
        Boolean recommended
) {}
