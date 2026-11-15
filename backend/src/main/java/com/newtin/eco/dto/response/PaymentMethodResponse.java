package com.newtin.eco.dto.response;

import com.newtin.eco.enums.CardBrand;
import com.newtin.eco.enums.PaymentProvider;
import com.newtin.eco.model.PaymentMethod;
import java.time.LocalDateTime;
import java.time.YearMonth;

// providerToken is intentionally absent: it never leaves the server
public record PaymentMethodResponse(Long id, PaymentProvider provider, CardBrand cardBrand, String last4,
                                    Integer expiryMonth, Integer expiryYear, boolean expired,
                                    boolean defaultMethod, LocalDateTime createdAt) {
    public static PaymentMethodResponse from(PaymentMethod p) {
        boolean expired = p.getExpiryYear() != null && p.getExpiryMonth() != null
                && YearMonth.now().isAfter(YearMonth.of(p.getExpiryYear(), p.getExpiryMonth()));
        return new PaymentMethodResponse(p.getId(), p.getProvider(), p.getCardBrand(), p.getLast4(),
                p.getExpiryMonth(), p.getExpiryYear(), expired, p.isDefaultMethod(), p.getCreatedAt());
    }
}