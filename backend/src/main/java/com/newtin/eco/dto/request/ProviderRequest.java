package com.newtin.eco.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProviderRequest(
        @NotBlank @Size(max = 200) String name,
        @Email @Size(max = 255) String email,
        @Pattern(regexp = "^$|^\\+?[0-9]{7,20}$") @Size(max = 30) String phone
) {}
