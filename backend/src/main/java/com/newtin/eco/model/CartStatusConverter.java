package com.newtin.eco.model;

import com.newtin.eco.enums.CartStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;

@Converter
public class CartStatusConverter implements AttributeConverter<CartStatus, String> {
    @Override
    public String convertToDatabaseColumn(CartStatus status) {
        return status == null ? null : titleCase(status.name());
    }

    @Override
    public CartStatus convertToEntityAttribute(String value) {
        return value == null ? null : CartStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private String titleCase(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
