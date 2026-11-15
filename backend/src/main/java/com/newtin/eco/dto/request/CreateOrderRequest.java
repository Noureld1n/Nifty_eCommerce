package com.newtin.eco.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreateOrderRequest(
        @NotNull @Positive Long shippingAddressId,
        @Positive Long billingAddressId,
        @NotEmpty List<@Valid OrderLineRequest> items
) {}
