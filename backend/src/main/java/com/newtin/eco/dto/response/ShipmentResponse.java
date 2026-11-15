package com.newtin.eco.dto.response;

import com.newtin.eco.enums.ShipmentStatus;
import com.newtin.eco.model.Shipment;

import java.time.LocalDateTime;

public record ShipmentResponse(
        Long id,
        boolean delivered,
        String trackingNumber,
        String carrier,
        LocalDateTime expectedDeliveryAt,
        LocalDateTime actualDeliveryAt,
        ShipmentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ShipmentResponse from(Shipment shipment) {
        return shipment == null ? null : new ShipmentResponse(shipment.getId(), shipment.isDelivered(),
                shipment.getTrackingNumber(), shipment.getCarrier(), shipment.getExpectedDeliveryAt(),
                shipment.getActualDeliveryAt(), shipment.getStatus(), shipment.getCreatedAt(),
                shipment.getUpdatedAt());
    }
}
