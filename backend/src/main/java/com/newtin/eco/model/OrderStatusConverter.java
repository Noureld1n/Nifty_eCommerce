package com.newtin.eco.model;

import com.newtin.eco.enums.OrderStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Locale;

@Converter
public class OrderStatusConverter implements AttributeConverter<OrderStatus, String> {
    @Override
    public String convertToDatabaseColumn(OrderStatus status) {
        return status == null ? null : titleCase(status.name());
    }

    @Override
    public OrderStatus convertToEntityAttribute(String value) {
        return value == null ? null : OrderStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private String titleCase(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
