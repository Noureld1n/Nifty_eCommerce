package com.newtin.eco.dto.request;

import com.newtin.eco.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePaymentStatusRequest(@NotNull PaymentStatus status) {}
