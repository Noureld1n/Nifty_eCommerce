package com.newtin.eco.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record ProcurementPackageRequest(
        @NotNull @Positive Long providerId,
        @NotNull @Positive Long accountableId,
        LocalDateTime purchaseDate,
        @Size(max = 100) String referenceNumber,
        String notes,
        @NotEmpty List<@Valid ProcurementLineRequest> items
) {}
