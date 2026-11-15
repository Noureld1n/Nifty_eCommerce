package com.newtin.eco.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CartCheckoutRequest(
        @NotNull @Positive Long shippingAddressId,
        @Positive Long billingAddressId
) {}
