package com.newtin.eco.dto.request;

import jakarta.validation.constraints.*;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "password must be 8-72 characters with letters and digits")
        String newPassword
) {}