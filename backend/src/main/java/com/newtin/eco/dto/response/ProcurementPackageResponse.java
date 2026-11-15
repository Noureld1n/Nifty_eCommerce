package com.newtin.eco.dto.response;

import com.newtin.eco.model.ProcurementPackage;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProcurementPackageResponse(
        Long id,
        Long providerId,
        String providerName,
        Long accountableId,
        String accountableName,
        BigDecimal totalCost,
        LocalDateTime purchaseDate,
        String referenceNumber,
        String notes,
        List<Line> items
) {
    public record Line(Long variantItemId, Integer quantity, BigDecimal unitCost,
                       BigDecimal lineTotal, String notes) {}

    public static ProcurementPackageResponse from(ProcurementPackage procurementPackage) {
        return new ProcurementPackageResponse(
                procurementPackage.getId(),
                procurementPackage.getProvider().getId(),
                procurementPackage.getProvider().getName(),
                procurementPackage.getAccountable().getId(),
                procurementPackage.getAccountable().getName(),
                procurementPackage.getTotalCost(),
                procurementPackage.getPurchaseDate(),
                procurementPackage.getReferenceNumber(),
                procurementPackage.getNotes(),
                procurementPackage.getItems().stream()
                        .map(item -> new Line(item.getVariantItem().getId(), item.getQuantity(),
                                item.getUnitCost(),
                                item.getUnitCost().multiply(BigDecimal.valueOf(item.getQuantity())),
                                item.getNotes()))
                        .toList()
        );
    }
}
