package com.newtin.eco.dto.request;

import jakarta.validation.constraints.*;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Pattern(regexp = "^$|^\\+?[0-9]{7,20}$", message = "invalid phone number") String phone,
        @Size(max = 2048) String image
) {}
