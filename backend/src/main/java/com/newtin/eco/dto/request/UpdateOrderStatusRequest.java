package com.newtin.eco.dto.request;

import com.newtin.eco.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {}
