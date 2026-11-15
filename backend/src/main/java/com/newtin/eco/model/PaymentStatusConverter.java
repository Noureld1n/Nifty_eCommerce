package com.newtin.eco.model;

import com.newtin.eco.enums.PaymentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Locale;

@Converter
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {
    @Override
    public String convertToDatabaseColumn(PaymentStatus status) {
        if (status == null) return null;
        return switch (status) {
            case PARTIALLY_REFUNDED -> "Partially_Refunded";
            default -> Character.toUpperCase(status.name().charAt(0))
                    + status.name().substring(1).toLowerCase(Locale.ROOT);
        };
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String value) {
        return value == null ? null : PaymentStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }
}
