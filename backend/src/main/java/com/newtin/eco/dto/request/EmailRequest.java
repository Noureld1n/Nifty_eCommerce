package com.newtin.eco.dto.request;
import jakarta.validation.constraints.*;
public record EmailRequest(@NotBlank @Email String email) {}   // resend-verification, forgot-password