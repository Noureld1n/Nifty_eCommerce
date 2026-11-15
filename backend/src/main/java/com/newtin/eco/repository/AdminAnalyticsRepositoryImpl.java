package com.newtin.eco.repository;

import com.newtin.eco.dto.response.AdminAnalyticsResponse;
import com.newtin.eco.enums.AnalyticsRange;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class AdminAnalyticsRepositoryImpl implements AdminAnalyticsRepository {
    private static final DateTimeFormatter HOUR_KEY = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00");
    private static final DateTimeFormatter DAY_KEY = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final String CATALOG_VARIANTS = """
            WITH catalog_variants AS (
                SELECT p.product_id, p.product_name, p.product_type, p.is_active AS product_active,
                       vi.variant_item_id, vi.is_active AS variant_active, vi.stock_quantity,
                       p.base_price + cv.price_adjustment AS retail_price
                FROM product p
                JOIN clothing_variant cv ON cv.product_id = p.product_id
                JOIN variant_item vi ON vi.variant_item_id = cv.variant_item_id
                UNION ALL
                SELECT p.product_id, p.product_name, p.product_type, p.is_active,
                       vi.variant_item_id, vi.is_active, vi.stock_quantity,
                       p.base_price + av.price_adjustment
                FROM product p
                JOIN accessory_variant av ON av.product_id = p.product_id
                JOIN variant_item vi ON vi.variant_item_id = av.variant_item_id
                UNION ALL
                SELECT p.product_id, p.product_name, p.product_type, p.is_active,
                       vi.variant_item_id, vi.is_active, vi.stock_quantity,
                       p.base_price + sv.price_adjustment
                FROM product p
                JOIN skincare_variant sv ON sv.product_id = p.product_id
                JOIN variant_item vi ON vi.variant_item_id = sv.variant_item_id
            )
            """;

    private final JdbcTemplate jdbc;

    @Override
    public AdminAnalyticsResponse dashboard(AnalyticsRange range, int offset) {
        if (range == null) throw new IllegalArgumentException("Analytics range is required");

        var summary = jdbc.queryForObject(CATALOG_VARIANTS + """
                , purchase_cost AS (
                    SELECT variant_item_id, SUM(quantity) AS units_received,
                           SUM(quantity * unit_cost) AS total_cost
                    FROM procurement_package_item
                    GROUP BY variant_item_id
                ),
                paid_sales AS (
                    SELECT oi.variant_item_id, SUM(oi.quantity) AS units_sold,
                           SUM(oi.quantity * oi.price_at_purchase) AS revenue
                    FROM order_item oi
                    JOIN sys_order o ON o.order_id = oi.order_id
                    WHERE o.order_status <> 'Cancelled' AND o.payment_status = 'Completed'
                    GROUP BY oi.variant_item_id
                ),
                total_sales AS (
                    SELECT COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue,
                           COALESCE(SUM(oi.quantity), 0) AS units,
                           COUNT(DISTINCT o.order_id) AS orders
                    FROM sys_order o
                    JOIN order_item oi ON oi.order_id = o.order_id
                    WHERE o.order_status <> 'Cancelled' AND o.payment_status = 'Completed'
                ),
                total_inventory AS (
                    SELECT
                        COALESCE(SUM(cv.stock_quantity), 0) AS units,
                        COALESCE(SUM(cv.stock_quantity * COALESCE(pc.total_cost / NULLIF(pc.units_received, 0), 0)), 0) AS cost,
                        COALESCE(SUM(cv.stock_quantity * cv.retail_price), 0) AS retail,
                        COALESCE(SUM(CASE WHEN cv.stock_quantity BETWEEN 1 AND 5 THEN 1 ELSE 0 END), 0) AS low_stock,
                        COALESCE(SUM(CASE WHEN cv.stock_quantity = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock
                    FROM catalog_variants cv
                    LEFT JOIN purchase_cost pc ON pc.variant_item_id = cv.variant_item_id
                    WHERE cv.product_active = TRUE AND cv.variant_active = TRUE
                ),
                total_procurement AS (
                    SELECT COALESCE(SUM(total_cost), 0) AS amount FROM procurement_package
                ),
                sold_cost AS (
                    SELECT COALESCE(SUM(ps.units_sold * pc.total_cost / NULLIF(pc.units_received, 0)), 0) AS amount
                    FROM paid_sales ps
                    LEFT JOIN purchase_cost pc ON pc.variant_item_id = ps.variant_item_id
                ),
                order_counts AS (
                    SELECT COUNT(*) AS amount FROM sys_order
                )
                SELECT ts.revenue AS sales_revenue,
                       tp.amount AS procurement_spend,
                       sc.amount AS cost_of_goods_sold,
                       ts.revenue - sc.amount AS gross_profit,
                       ti.cost AS inventory_cost,
                       ti.retail AS inventory_retail,
                       ti.units AS inventory_units,
                       ts.units AS units_sold,
                       ts.orders AS paid_orders,
                       oc.amount AS total_orders,
                       ti.low_stock AS low_stock_variants,
                       ti.out_of_stock AS out_of_stock_variants
                FROM total_sales ts
                CROSS JOIN total_procurement tp
                CROSS JOIN sold_cost sc
                CROSS JOIN total_inventory ti
                CROSS JOIN order_counts oc
                """, (rs, row) -> summary(rs));

        ChartWindow window = chartWindow(range, offset);
        Map<String, MonthlyValues> chartValues = new HashMap<>();
        jdbc.query("""
                SELECT DATE_FORMAT(creation_date, ?) AS period_key,
                       SUM(oi.quantity * oi.price_at_purchase) AS amount
                FROM sys_order o
                JOIN order_item oi ON oi.order_id = o.order_id
                WHERE o.order_status <> 'Cancelled' AND o.payment_status = 'Completed'
                  AND o.creation_date >= ? AND o.creation_date < ?
                GROUP BY period_key
                """, (org.springframework.jdbc.core.RowCallbackHandler) rs ->
                        chartValues.computeIfAbsent(rs.getString("period_key"),
                                ignored -> new MonthlyValues()).sales = rs.getBigDecimal("amount"),
                window.dateFormat(), window.start(), window.end());
        jdbc.query("""
                SELECT DATE_FORMAT(purchase_date, ?) AS period_key,
                       SUM(total_cost) AS amount
                FROM procurement_package
                WHERE purchase_date >= ? AND purchase_date < ?
                GROUP BY period_key
                """, (org.springframework.jdbc.core.RowCallbackHandler) rs ->
                        chartValues.computeIfAbsent(rs.getString("period_key"),
                                ignored -> new MonthlyValues()).procurement = rs.getBigDecimal("amount"),
                window.dateFormat(), window.start(), window.end());
        List<AdminAnalyticsResponse.ChartPoint> salesAndPurchasing = new ArrayList<>();
        for (String period : window.periods()) {
            MonthlyValues values = chartValues.getOrDefault(period, new MonthlyValues());
            salesAndPurchasing.add(new AdminAnalyticsResponse.ChartPoint(period,
                    zero(values.sales), zero(values.procurement)));
        }

        List<AdminAnalyticsResponse.OrderStatusCount> statuses = jdbc.query("""
                SELECT order_status, COUNT(*) AS status_count
                FROM sys_order
                GROUP BY order_status
                ORDER BY FIELD(order_status, 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
                """, (rs, row) -> new AdminAnalyticsResponse.OrderStatusCount(
                rs.getString("order_status"), rs.getLong("status_count")));

        List<AdminAnalyticsResponse.InventoryType> inventoryByType = jdbc.query(CATALOG_VARIANTS + """
                SELECT cv.product_type, SUM(cv.stock_quantity) AS units,
                       SUM(cv.stock_quantity * cv.retail_price) AS retail_value
                FROM catalog_variants cv
                WHERE cv.product_active = TRUE AND cv.variant_active = TRUE
                GROUP BY cv.product_type
                ORDER BY cv.product_type
                """, (rs, row) -> new AdminAnalyticsResponse.InventoryType(
                rs.getString("product_type"), rs.getLong("units"), zero(rs.getBigDecimal("retail_value"))));

        List<AdminAnalyticsResponse.ProviderStock> providers = providerStock();
        List<AdminAnalyticsResponse.ProviderSales> providerSales = jdbc.query(CATALOG_VARIANTS + """
                , paid_sales AS (
                    SELECT oi.variant_item_id, SUM(oi.quantity) AS units_sold
                    FROM order_item oi
                    JOIN sys_order o ON o.order_id = oi.order_id
                    WHERE o.order_status <> 'Cancelled' AND o.payment_status = 'Completed'
                    GROUP BY oi.variant_item_id
                ),
                receipt_lots AS (
                    SELECT pp.provider_id, p.provider_name, cv.product_id, cv.product_name,
                           cv.product_type, pi.variant_item_id, pi.quantity,
                           pp.purchase_date, pp.package_id, pi.package_item_id,
                           SUM(pi.quantity) OVER (
                               PARTITION BY pi.variant_item_id
                               ORDER BY pp.purchase_date, pp.package_id, pi.package_item_id
                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                           ) AS received_to_date,
                           COALESCE(ps.units_sold, 0) AS units_sold
                    FROM procurement_package_item pi
                    JOIN procurement_package pp ON pp.package_id = pi.package_id
                    JOIN provider p ON p.provider_id = pp.provider_id
                    JOIN catalog_variants cv ON cv.variant_item_id = pi.variant_item_id
                    LEFT JOIN paid_sales ps ON ps.variant_item_id = pi.variant_item_id
                    WHERE cv.product_active = TRUE AND cv.variant_active = TRUE
                ),
                provider_sales AS (
                    SELECT provider_id, provider_name, product_id, product_name, product_type,
                           LEAST(quantity, GREATEST(0, units_sold - (received_to_date - quantity)))
                               AS attributed_units_sold
                    FROM receipt_lots
                )
                SELECT provider_name, SUM(attributed_units_sold) AS units_sold,
                       COUNT(DISTINCT CASE WHEN attributed_units_sold > 0 THEN product_id END) AS products_sold
                FROM provider_sales
                GROUP BY provider_id, provider_name
                HAVING SUM(attributed_units_sold) > 0
                ORDER BY units_sold DESC, provider_name
                """, (rs, row) -> new AdminAnalyticsResponse.ProviderSales(
                rs.getString("provider_name"), rs.getLong("units_sold"), rs.getLong("products_sold")));
        List<AdminAnalyticsResponse.TopProduct> topProducts = jdbc.query("""
                SELECT oi.product_name_at_purchase, SUM(oi.quantity) AS units_sold,
                       SUM(oi.quantity * oi.price_at_purchase) AS sales_revenue
                FROM order_item oi
                JOIN sys_order o ON o.order_id = oi.order_id
                WHERE o.order_status <> 'Cancelled' AND o.payment_status = 'Completed'
                GROUP BY oi.product_name_at_purchase
                ORDER BY sales_revenue DESC, units_sold DESC
                LIMIT 8
                """, (rs, row) -> new AdminAnalyticsResponse.TopProduct(
                rs.getString("product_name_at_purchase"), rs.getLong("units_sold"),
                zero(rs.getBigDecimal("sales_revenue"))));

        return new AdminAnalyticsResponse(summary, range.name(), offset, salesAndPurchasing, statuses,
                inventoryByType, providers, providerSales, topProducts);
    }

    private ChartWindow chartWindow(AnalyticsRange range, int offset) {
        LocalDateTime now = LocalDateTime.now();
        return switch (range) {
            case DAY -> {
                LocalDateTime windowEnd = now.minusDays(offset);
                LocalDateTime start = windowEnd.truncatedTo(ChronoUnit.HOURS).minusHours(23);
                List<String> periods = new ArrayList<>();
                for (int hour = 0; hour < 24; hour++) {
                    periods.add(start.plusHours(hour).format(HOUR_KEY));
                }
                yield new ChartWindow(start, windowEnd.plusNanos(1), "%Y-%m-%d %H:00", periods);
            }
            case MONTH -> {
                LocalDateTime windowEnd = now.minusDays(30L * offset);
                LocalDate start = windowEnd.toLocalDate().minusDays(29);
                List<String> periods = new ArrayList<>();
                for (int day = 0; day < 30; day++) {
                    periods.add(start.plusDays(day).format(DAY_KEY));
                }
                yield new ChartWindow(start.atStartOfDay(), windowEnd.plusNanos(1), "%Y-%m-%d", periods);
            }
            case YEAR -> {
                LocalDateTime windowEnd = now.minusMonths(12L * offset);
                YearMonth currentMonth = YearMonth.from(windowEnd);
                YearMonth start = currentMonth.minusMonths(11);
                List<String> periods = new ArrayList<>();
                for (int month = 0; month < 12; month++) {
                    periods.add(start.plusMonths(month).format(MONTH_KEY));
                }
                yield new ChartWindow(start.atDay(1).atStartOfDay(),
                        windowEnd.plusNanos(1), "%Y-%m", periods);
            }
        };
    }

    private record ChartWindow(
            LocalDateTime start,
            LocalDateTime end,
            String dateFormat,
            List<String> periods
    ) {}

    private List<AdminAnalyticsResponse.ProviderStock> providerStock() {
        return jdbc.query("""
                WITH catalog_variants AS (
                    SELECT p.product_id, p.product_name, p.is_active AS product_active,
                           vi.variant_item_id, vi.is_active AS variant_active, vi.stock_quantity,
                           p.base_price + cv.price_adjustment AS retail_price
                    FROM product p
                    JOIN clothing_variant cv ON cv.product_id = p.product_id
                    JOIN variant_item vi ON vi.variant_item_id = cv.variant_item_id
                    UNION ALL
                    SELECT p.product_id, p.product_name, p.is_active,
                           vi.variant_item_id, vi.is_active, vi.stock_quantity,
                           p.base_price + av.price_adjustment
                    FROM product p
                    JOIN accessory_variant av ON av.product_id = p.product_id
                    JOIN variant_item vi ON vi.variant_item_id = av.variant_item_id
                    UNION ALL
                    SELECT p.product_id, p.product_name, p.is_active,
                           vi.variant_item_id, vi.is_active, vi.stock_quantity,
                           p.base_price + sv.price_adjustment
                    FROM product p
                    JOIN skincare_variant sv ON sv.product_id = p.product_id
                    JOIN variant_item vi ON vi.variant_item_id = sv.variant_item_id
                ),
                sold AS (
                    SELECT oi.variant_item_id, SUM(oi.quantity) AS units_sold
                    FROM order_item oi
                    JOIN sys_order o ON o.order_id = oi.order_id
                    WHERE o.order_status <> 'Cancelled'
                    GROUP BY oi.variant_item_id
                ),
                receipt_lots AS (
                    SELECT pp.provider_id, p.provider_name, pi.variant_item_id,
                           pi.quantity, pi.unit_cost, cv.stock_quantity, cv.retail_price,
                           pp.purchase_date, pp.package_id, pi.package_item_id,
                           SUM(pi.quantity) OVER (
                               PARTITION BY pi.variant_item_id
                               ORDER BY pp.purchase_date, pp.package_id, pi.package_item_id
                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                           ) AS received_to_date,
                           COALESCE(s.units_sold, 0) AS units_sold
                    FROM procurement_package_item pi
                    JOIN procurement_package pp ON pp.package_id = pi.package_id
                    JOIN provider p ON p.provider_id = pp.provider_id
                    JOIN catalog_variants cv ON cv.variant_item_id = pi.variant_item_id
                    LEFT JOIN sold s ON s.variant_item_id = pi.variant_item_id
                    WHERE cv.product_active = TRUE AND cv.variant_active = TRUE
                ),
                fifo_remaining AS (
                    SELECT *,
                           GREATEST(0, quantity - GREATEST(0, LEAST(quantity,
                               units_sold - (received_to_date - quantity)))) AS units_after_sales
                    FROM receipt_lots
                ),
                stock_capped AS (
                    SELECT *,
                           SUM(units_after_sales) OVER (
                               PARTITION BY variant_item_id
                               ORDER BY purchase_date DESC, package_id DESC, package_item_id DESC
                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                           ) AS remaining_from_newest
                    FROM fifo_remaining
                ),
                provider_inventory AS (
                    SELECT provider_id, provider_name, variant_item_id, quantity, unit_cost,
                           LEAST(units_after_sales, GREATEST(0,
                               stock_quantity - (remaining_from_newest - units_after_sales))) AS sellable_quantity,
                           retail_price
                    FROM stock_capped
                ),
                received_totals AS (
                    SELECT pp.provider_id, SUM(pi.quantity) AS units_received,
                           SUM(pi.quantity * pi.unit_cost) AS acquisition_cost
                    FROM procurement_package_item pi
                    JOIN procurement_package pp ON pp.package_id = pi.package_id
                    GROUP BY pp.provider_id
                ),
                available_totals AS (
                    SELECT provider_id, provider_name,
                           SUM(sellable_quantity) AS sellable_units,
                           SUM(sellable_quantity * unit_cost) AS sellable_cost,
                           SUM(sellable_quantity * retail_price) AS sellable_retail,
                           COUNT(DISTINCT CASE WHEN sellable_quantity > 0 THEN variant_item_id END) AS sellable_variants
                    FROM provider_inventory
                    GROUP BY provider_id, provider_name
                )
                SELECT p.provider_id, p.provider_name,
                       COALESCE(rt.units_received, 0) AS units_received,
                       COALESCE(rt.acquisition_cost, 0) AS acquisition_cost,
                       COALESCE(at.sellable_units, 0) AS sellable_units,
                       COALESCE(at.sellable_cost, 0) AS sellable_cost,
                       COALESCE(at.sellable_retail, 0) AS sellable_retail,
                       COALESCE(at.sellable_variants, 0) AS sellable_variants
                FROM provider p
                LEFT JOIN received_totals rt ON rt.provider_id = p.provider_id
                LEFT JOIN available_totals at ON at.provider_id = p.provider_id
                WHERE p.provider_name LIKE '[DEMO] %' OR rt.provider_id IS NOT NULL
                ORDER BY sellable_units DESC, sellable_cost DESC, p.provider_name
                """, (rs, row) -> new AdminAnalyticsResponse.ProviderStock(
                rs.getLong("provider_id"), rs.getString("provider_name"),
                rs.getLong("units_received"), zero(rs.getBigDecimal("acquisition_cost")),
                rs.getLong("sellable_units"), zero(rs.getBigDecimal("sellable_cost")),
                zero(rs.getBigDecimal("sellable_retail")), rs.getLong("sellable_variants")));
    }

    private static AdminAnalyticsResponse.Summary summary(ResultSet rs) throws SQLException {
        return new AdminAnalyticsResponse.Summary(
                zero(rs.getBigDecimal("sales_revenue")),
                zero(rs.getBigDecimal("procurement_spend")),
                zero(rs.getBigDecimal("cost_of_goods_sold")),
                zero(rs.getBigDecimal("gross_profit")),
                zero(rs.getBigDecimal("inventory_cost")),
                zero(rs.getBigDecimal("inventory_retail")),
                rs.getLong("inventory_units"),
                rs.getLong("units_sold"),
                rs.getLong("paid_orders"),
                rs.getLong("total_orders"),
                rs.getLong("low_stock_variants"),
                rs.getLong("out_of_stock_variants"));
    }

    private static BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static final class MonthlyValues {
        private BigDecimal sales;
        private BigDecimal procurement;
    }
}
