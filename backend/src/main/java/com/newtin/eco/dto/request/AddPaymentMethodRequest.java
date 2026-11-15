package com.newtin.eco.dto.request;

import com.newtin.eco.enums.CardBrand;
import com.newtin.eco.enums.PaymentProvider;
import jakarta.validation.constraints.*;

// There is deliberately no card number or CVV field. Only provider tokens are accepted.
public record AddPaymentMethodRequest(
        @NotNull PaymentProvider provider,
        @NotBlank @Size(max = 255) String providerToken,
        CardBrand cardBrand,
        @Pattern(regexp = "^\\d{4}$", message = "last4 must be 4 digits") String last4,
        @Min(1) @Max(12) Integer expiryMonth,
        @Min(2000) @Max(2200) Integer expiryYear,
        Boolean makeDefault
) {}