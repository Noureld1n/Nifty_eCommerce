package com.newtin.eco.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminAnalyticsResponse(
        Summary summary,
        String salesRange,
        int salesOffset,
        List<ChartPoint> salesAndPurchasing,
        List<OrderStatusCount> ordersByStatus,
        List<InventoryType> inventoryByType,
        List<ProviderStock> providers,
        List<ProviderSales> providerSales,
        List<TopProduct> topProducts
) {
    public record Summary(
            BigDecimal salesRevenue,
            BigDecimal procurementSpend,
            BigDecimal costOfGoodsSold,
            BigDecimal grossProfit,
            BigDecimal inventoryCost,
            BigDecimal inventoryRetailValue,
            long inventoryUnits,
            long unitsSold,
            long paidOrders,
            long totalOrders,
            long lowStockVariants,
            long outOfStockVariants
    ) {}

    public record ChartPoint(String period, BigDecimal sales, BigDecimal procurementCost) {}
    public record OrderStatusCount(String status, long count) {}
    public record InventoryType(String productType, long units, BigDecimal retailValue) {}
    public record ProviderStock(
            long providerId,
            String providerName,
            long unitsReceived,
            BigDecimal acquisitionCost,
            long sellableUnits,
            BigDecimal sellableCost,
            BigDecimal sellableRetailValue,
            long sellableVariants
    ) {}
    public record ProviderSales(
            String providerName,
            long unitsSold,
            long productsSold
    ) {}
    public record TopProduct(String productName, long unitsSold, BigDecimal salesRevenue) {}
}
