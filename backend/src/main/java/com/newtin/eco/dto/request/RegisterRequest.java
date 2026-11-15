package com.newtin.eco.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(max = 255)
        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "invalid email address")
        String email,
        @NotBlank
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "password must be 8-72 characters with letters and digits")
        String password,
        @Pattern(regexp = "^$|^\\+?[0-9]{7,20}$", message = "invalid phone number") String phone
) {}