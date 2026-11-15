import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { adminAnalyticsApi } from '../../api/adminCommerceApi';
import { useApiResource } from '../../hooks/useApiResource';
import { formatMoney, prettyStatus } from '../../lib/commerce';
import { useAppTheme } from '../../ThemeProvider';
import { AdminFrame, AdminMetric } from './AdminCommon';
import { Card, EmptyState, ErrorState, PageTitle } from '../ui';

const RANGES = [
  { value: 'DAY', label: 'Day' },
  { value: 'MONTH', label: 'Month' },
  { value: 'YEAR', label: 'Year' },
] as const;

type SalesRange = (typeof RANGES)[number]['value'];

function isRange(value: string): value is SalesRange {
  return value === 'DAY' || value === 'MONTH' || value === 'YEAR';
}

function periodLabel(period: string, range: SalesRange) {
  if (range === 'DAY') {
    const time = period.match(/(?:T|\s)(\d{2}):/);
    return time ? time[1] : period;
  }
  if (range === 'MONTH') {
    const day = period.match(/^\d{4}-\d{2}-(\d{2})/);
    return day ? String(Number(day[1])) : period;
  }
  const monthMatch = period.match(/^\d{4}-(\d{2})/);
  const month = monthMatch ? Number(monthMatch[1]) : NaN;
  return Number.isFinite(month) && month > 0
    ? new Date(2000, month - 1).toLocaleString(undefined, { month: 'short' })
    : period;
}

function axisLabel(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  });
}

/**
 * Rounds the top of the axis up to a "nice" number so the grid lines land on
 * clean values (0, 2k, 4k, 6k ...) instead of 2.1k, 4.2k, 6.2k ...
 */
function niceScale(maximum: number, targetTicks = 4) {
  if (!(maximum > 0)) {
    return { max: 4, step: 1 };
  }
  const rawStep = maximum / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const niceResidual =
    residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10;
  const step = niceResidual * magnitude;
  return { max: step * Math.ceil(maximum / step), step };
}

const CHART_HEIGHT = 196;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 30;
const PLOT_LEFT = 44;
const PLOT_RIGHT_PADDING = 14;

function FinanceChart({
  points,
  range,
}: {
  points: {
    period: string;
    sales: number;
    procurementCost: number;
  }[];
  range: SalesRange;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // The chart always fits the card, so it is sized from the card itself (not
  // the window) and never needs horizontal scrolling.
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    setMeasuredWidth((previous) => (previous === next ? previous : next));
  }, []);

  if (!points.length) {
    return (
      <EmptyState
        title="No activity in this period"
        description="Sales and receipts will appear here when available."
      />
    );
  }

  const chartPoints = points.map((point) => ({
    ...point,
    sales: Number.isFinite(Number(point.sales)) ? Number(point.sales) : 0,
    procurementCost: Number.isFinite(Number(point.procurementCost))
      ? Number(point.procurementCost)
      : 0,
  }));
  const maximum = Math.max(
    0,
    ...chartPoints.flatMap((point) => [point.sales, point.procurementCost]),
  );
  const { max: scaleMaximum, step } = niceScale(maximum);
  const tickValues = Array.from(
    { length: Math.round(scaleMaximum / step) + 1 },
    (_, index) => index * step,
  );

  const chartWidth = Math.max(0, measuredWidth);
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const plotLeft = PLOT_LEFT;
  const plotRight = chartWidth - PLOT_RIGHT_PADDING;
  const plotWidth = Math.max(1, plotRight - plotLeft);
  const lastIndex = chartPoints.length - 1;
  const xFor = (index: number) =>
    chartPoints.length === 1
      ? plotLeft + plotWidth / 2
      : plotLeft + (index / lastIndex) * plotWidth;
  const yFor = (value: number) =>
    PLOT_TOP + (1 - value / scaleMaximum) * plotHeight;
  const salesLine = chartPoints
    .map((point, index) => `${xFor(index)},${yFor(point.sales)}`)
    .join(' ');
  const procurementLine = chartPoints
    .map((point, index) => `${xFor(index)},${yFor(point.procurementCost)}`)
    .join(' ');
  // Labels are counted back from the newest point, so the last label is
  // always shown and never collides with its neighbour.
  const labelInterval = Math.max(1, Math.ceil(chartPoints.length / 8));
  // With many points, dots would crowd the lines: only mark the latest one.
  const showAllMarkers = chartPoints.length <= 16;

  return (
    <View style={styles.chart}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.leafDeep }]} />
          <Text style={styles.muted}>Paid sales</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.skyDeep }]} />
          <Text style={styles.muted}>Procurement</Text>
        </View>
      </View>
      <View onLayout={onLayout} style={styles.chartCanvas}>
        {chartWidth > 0 ? (
          <Svg
            width={chartWidth}
            height={CHART_HEIGHT}
            accessibilityLabel="Paid sales and procurement chart"
          >
            {tickValues.map((tick) => {
              const y = yFor(tick);
              return (
                <Line
                  key={`grid-${tick}`}
                  x1={plotLeft}
                  x2={plotRight}
                  y1={y}
                  y2={y}
                  stroke={theme.colors.line}
                  strokeWidth={1}
                />
              );
            })}
            {tickValues.map((tick) => (
              <SvgText
                key={`axis-${tick}`}
                x={plotLeft - 7}
                y={yFor(tick) + 3}
                fill={theme.colors.muted}
                fontSize={9}
                textAnchor="end"
              >
                {axisLabel(tick)}
              </SvgText>
            ))}
            <Polyline
              points={salesLine}
              fill="none"
              stroke={theme.colors.leafDeep}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={procurementLine}
              fill="none"
              stroke={theme.colors.skyDeep}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chartPoints.map((point, index) =>
              showAllMarkers || index === lastIndex ? (
                <Circle
                  key={`sales-${point.period}`}
                  cx={xFor(index)}
                  cy={yFor(point.sales)}
                  r={3}
                  fill={theme.colors.leafDeep}
                />
              ) : null,
            )}
            {chartPoints.map((point, index) =>
              showAllMarkers || index === lastIndex ? (
                <Circle
                  key={`procurement-${point.period}`}
                  cx={xFor(index)}
                  cy={yFor(point.procurementCost)}
                  r={3}
                  fill={theme.colors.skyDeep}
                />
              ) : null,
            )}
            {chartPoints.map((point, index) =>
              (lastIndex - index) % labelInterval === 0 ? (
                <SvgText
                  key={`period-${point.period}`}
                  x={xFor(index)}
                  y={CHART_HEIGHT - 7}
                  fill={theme.colors.muted}
                  fontSize={9}
                  textAnchor="middle"
                >
                  {periodLabel(point.period, range)}
                </SvgText>
              ) : null,
            )}
          </Svg>
        ) : null}
      </View>
      {maximum === 0 ? (
        <Text style={styles.chartEmptyMessage}>
          No sales or receipts recorded for this period.
        </Text>
      ) : null}
    </View>
  );
}

function ProgressItem({
  label,
  value,
  maximum,
  detail,
  color,
}: {
  label: string;
  value: number;
  maximum: number;
  detail: string;
  color?: string;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedColor = color ?? theme.colors.leafDeep;
  const width = maximum > 0 ? Math.min(100, (value / maximum) * 100) : 0;
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeading}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {label}
        </Text>
        <Text style={styles.progressValue}>{value.toLocaleString()}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.trackFill,
            { width: `${width}%`, backgroundColor: resolvedColor },
          ]}
        />
      </View>
      <Text style={styles.muted}>{detail}</Text>
    </View>
  );
}

export function AdminOverview() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [range, setRange] = useState<SalesRange>('YEAR');
  const [offset, setOffset] = useState(0);
  const loadDashboard = useCallback(
    () => adminAnalyticsApi.dashboard(range, offset),
    [range, offset],
  );
  const state = useApiResource(loadDashboard);
  const dashboard = state.data;
  const summary = dashboard?.summary;
  const rangeLabel =
    range === 'DAY' ? 'Past 24 hours' : range === 'MONTH' ? 'Past 30 days' : 'Past 12 months';

  return (
    <AdminFrame
      title="Business overview"
      subtitle="Sales, purchasing, inventory, and supplier performance in one place."
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.kicker}>NIFTY · ADMIN INTELLIGENCE</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Your store, at a glance.</Text>
        <Text style={styles.heroCopy}>
          Revenue, stock, and fulfilment — all in one place.
        </Text>
      </View>

      {state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : null}
      {!dashboard && state.loading ? (
        <Card>
          <Text style={styles.muted}>Loading business overview…</Text>
        </Card>
      ) : null}
      {summary && dashboard ? (
        <>
          <View style={styles.metricGrid}>
            <View style={styles.metricCell}>
              <AdminMetric
                label="Paid sales"
                value={formatMoney(summary.salesRevenue)}
                note={`${summary.paidOrders} paid orders`}
                tone="leaf"
              />
            </View>
            <View style={styles.metricCell}>
              <AdminMetric
                label="Procurement"
                value={formatMoney(summary.procurementSpend)}
                note="Recorded receipts"
                tone="blue"
              />
            </View>
            <View style={styles.metricCell}>
              <AdminMetric
                label="Gross profit"
                value={formatMoney(summary.grossProfit)}
                note={`${formatMoney(summary.costOfGoodsSold)} estimated cost`}
                tone="ink"
              />
            </View>
            <View style={styles.metricCell}>
              <AdminMetric
                label="Sellable stock"
                value={summary.inventoryUnits.toLocaleString()}
                note={`${formatMoney(summary.inventoryRetailValue)} retail value`}
                tone="mint"
              />
            </View>
          </View>

          <Card>
            <PageTitle
              title="Sales & purchasing"
              subtitle={`${rangeLabel} · ${offset === 0 ? 'current period' : `${offset} periods ago`}`}
            />
            <View style={styles.controlRow}>
              <View style={styles.rangeTabs}>
                {RANGES.map((item) => {
                  const selected = range === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        if (isRange(item.value)) {
                          setRange(item.value);
                        }
                        setOffset(0);
                      }}
                      style={[styles.rangeTab, selected && styles.rangeTabSelected]}
                    >
                      <Text
                        style={[
                          styles.rangeText,
                          selected && styles.rangeTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.periodNav}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show previous period"
                  accessibilityState={{ disabled: offset >= 1200 }}
                  disabled={offset >= 1200}
                  onPress={() => setOffset((value) => Math.min(1200, value + 1))}
                  style={[styles.periodButton, offset >= 1200 && styles.disabled]}
                >
                  <Text style={styles.periodButtonText}>‹</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show next period"
                  accessibilityState={{ disabled: offset === 0 }}
                  disabled={offset === 0}
                  onPress={() => setOffset((value) => Math.max(0, value - 1))}
                  style={[styles.periodButton, offset === 0 && styles.disabled]}
                >
                  <Text style={styles.periodButtonText}>›</Text>
                </Pressable>
              </View>
            </View>
            <FinanceChart points={dashboard.salesAndPurchasing} range={range} />
            <Text style={styles.note}>
              Revenue includes completed payments. Procurement is recorded stock
              spend; all values are in EGP.
            </Text>
          </Card>

          <Card>
            <PageTitle
              title="Inventory mix"
              subtitle={`${summary.lowStockVariants} low-stock · ${summary.outOfStockVariants} out of stock`}
            />
            {dashboard.inventoryByType.length ? (
              <View style={styles.progressList}>
                {dashboard.inventoryByType.map((item) => (
                  <ProgressItem
                    key={item.productType}
                    label={prettyStatus(item.productType)}
                    value={item.units}
                    maximum={Math.max(
                      1,
                      ...dashboard.inventoryByType.map((entry) => entry.units),
                    )}
                    detail={`${formatMoney(item.retailValue)} potential retail`}
                    color={theme.colors.leafDeep}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>No active catalog inventory is available.</Text>
            )}
            <View style={styles.stockSummary}>
              <Text style={styles.summaryPill}>
                Cost basis {formatMoney(summary.inventoryCost)}
              </Text>
              <Text style={styles.summaryPill}>
                {summary.outOfStockVariants} out of stock
              </Text>
            </View>
          </Card>

          <Card>
            <PageTitle
              title="Order flow"
              subtitle={`${summary.totalOrders.toLocaleString()} orders across all statuses`}
            />
            {dashboard.ordersByStatus.length ? (
              <View style={styles.progressList}>
                {dashboard.ordersByStatus.map((item, index) => (
                  <ProgressItem
                    key={item.status}
                    label={prettyStatus(item.status)}
                    value={item.count}
                    maximum={Math.max(
                      1,
                      ...dashboard.ordersByStatus.map((entry) => entry.count),
                    )}
                    detail={`${item.count.toLocaleString()} orders`}
                    color={
                      index % 2 === 0
                        ? theme.colors.skyDeep
                        : theme.colors.leafDeep
                    }
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>Orders will appear here as customers check out.</Text>
            )}
          </Card>

          <Card>
            <PageTitle
              title="Sellable stock by supplier"
              subtitle="Available units and their purchase cost basis."
            />
            {dashboard.providers.length ? (
              <View style={styles.progressList}>
                {dashboard.providers.map((provider, index) => (
                  <ProgressItem
                    key={provider.providerId}
                    label={provider.providerName}
                    value={provider.sellableUnits}
                    maximum={Math.max(
                      1,
                      ...dashboard.providers.map((item) => item.sellableUnits),
                    )}
                    detail={`${formatMoney(provider.sellableCost)} cost · ${formatMoney(provider.sellableRetailValue)} retail`}
                    color={
                      index % 2 === 0
                        ? theme.colors.leafDeep
                        : theme.colors.skyDeep
                    }
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>No supplier receipts yet.</Text>
            )}
          </Card>

          <Card>
            <PageTitle
              title="Best-selling suppliers"
              subtitle="Ranked by completed units sold across their products."
            />
            {dashboard.providerSales.length ? (
              <View style={styles.progressList}>
                {dashboard.providerSales.map((provider, index) => (
                  <ProgressItem
                    key={provider.providerName}
                    label={provider.providerName}
                    value={provider.unitsSold}
                    maximum={Math.max(
                      1,
                      ...dashboard.providerSales.map((item) => item.unitsSold),
                    )}
                    detail={`${provider.productsSold} products sold`}
                    color={
                      index % 2 === 0
                        ? theme.colors.skyDeep
                        : theme.colors.leafDeep
                    }
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>Completed sales will appear here.</Text>
            )}
          </Card>

          <Card>
            <PageTitle
              title="Top products"
              subtitle="Ranked by completed sales revenue."
            />
            {dashboard.topProducts.length ? (
              <View style={styles.rankedList}>
                {dashboard.topProducts.map((item, index) => (
                  <View key={item.productName} style={styles.rankedItem}>
                    <Text style={styles.rank}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <View style={styles.productDetails}>
                      <Text numberOfLines={1} style={styles.rowTitle}>
                        {item.productName}
                      </Text>
                      <Text style={styles.muted}>
                        {item.unitsSold} sold · {formatMoney(item.salesRevenue)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>Paid sales will appear here after the first completed payment.</Text>
            )}
          </Card>

          <Text style={styles.disclaimer}>
            Gross profit and stock cost are estimates based on recorded procurement costs.
          </Text>
        </>
      ) : null}
    </AdminFrame>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  hero: {
    padding: 20,
    gap: 7,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kicker: {
    color: theme.colors.leafDeep,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.successBackground,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    color: theme.colors.success,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: theme.colors.ink,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroCopy: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCell: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rangeTabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
  },
  rangeTab: {
    minHeight: 34,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  rangeTabSelected: {
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rangeText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  rangeTextSelected: {
    color: theme.colors.leafDeep,
  },
  periodNav: {
    flexDirection: 'row',
    gap: 6,
  },
  periodButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  periodButtonText: {
    color: theme.colors.ink,
    fontSize: 23,
    lineHeight: 26,
  },
  disabled: {
    opacity: 0.4,
  },
  chart: {
    gap: 10,
  },
  chartCanvas: {
    width: '100%',
    height: CHART_HEIGHT,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartEmptyMessage: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  progressList: {
    gap: 14,
  },
  progressItem: {
    gap: 6,
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressValue: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
  },
  trackFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  stockSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  summaryPill: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  rankedList: {
    gap: 4,
  },
  rankedItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  rank: {
    color: theme.colors.leafDeep,
    fontSize: 14,
    fontWeight: '800',
  },
  productDetails: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  note: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  disclaimer: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  });
}