package com.newtin.eco.dto.request;

import com.newtin.eco.enums.ShipmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record UpdateShipmentRequest(
        @NotNull ShipmentStatus status,
        @Size(max = 150) String trackingNumber,
        @Size(max = 100) String carrier,
        LocalDateTime expectedDeliveryAt
) {}
