package com.newtin.eco.dto.request;

import com.newtin.eco.enums.AddressType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank @Size(max = 255) String street,
        @NotBlank @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 20) String zipcode,
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "countryCode must be a two-letter code")
        String countryCode,
        @NotNull AddressType addressType
) {}
