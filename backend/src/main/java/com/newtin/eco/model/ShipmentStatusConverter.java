package com.newtin.eco.model;

import com.newtin.eco.enums.ShipmentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Locale;

@Converter
public class ShipmentStatusConverter implements AttributeConverter<ShipmentStatus, String> {
    @Override
    public String convertToDatabaseColumn(ShipmentStatus status) {
        if (status == null) return null;
        return switch (status) {
            case IN_TRANSIT -> "In_Transit";
            default -> Character.toUpperCase(status.name().charAt(0))
                    + status.name().substring(1).toLowerCase(Locale.ROOT);
        };
    }

    @Override
    public ShipmentStatus convertToEntityAttribute(String value) {
        return value == null ? null : ShipmentStatus.valueOf(value.toUpperCase(Locale.ROOT));
    }
}
