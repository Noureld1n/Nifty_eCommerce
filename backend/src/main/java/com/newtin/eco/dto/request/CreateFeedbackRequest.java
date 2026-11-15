package com.newtin.eco.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFeedbackRequest(
        @NotBlank @Size(max = 2000) String text,
        Boolean satisfied
) {}