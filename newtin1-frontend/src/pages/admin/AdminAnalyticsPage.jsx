import { useCallback, useState } from 'react'
import { adminAnalyticsApi } from '../../api/adminCommerceApi'
import { Alert } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import './AdminAnalyticsPage.css'

const money = (value) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
}).format(Number(value ?? 0))

const number = (value) => new Intl.NumberFormat().format(Number(value ?? 0))

function Metric({ label, value, note, tone = 'leaf' }) {
  return (
    <article className={`analytics-metric analytics-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  )
}

function chartDate(period, range) {
  if (range === 'DAY') {
    const [date, hour] = period.split(' ')
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day, Number(hour.slice(0, 2)))
  }
  if (range === 'MONTH') {
    const [year, month, day] = period.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

function periodLabel(period, range) {
  const date = chartDate(period, range)
  const options = range === 'DAY'
    ? { hour: 'numeric' }
    : range === 'MONTH'
      ? { day: 'numeric', month: 'short' }
      : { month: 'short' }
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

function periodWindowLabel(points, range) {
  if (!points.length) return ''
  const options = range === 'DAY'
    ? { month: 'short', day: 'numeric', hour: 'numeric' }
    : range === 'MONTH'
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'short', year: 'numeric' }
  const format = (period) => new Intl.DateTimeFormat(undefined, options).format(chartDate(period, range))
  return `${format(points[0].period)} – ${format(points[points.length - 1].period)}`
}

function FinanceChart({ points, range }) {
  const width = 780
  const height = 270
  const pad = { top: 24, right: 24, bottom: 42, left: 74 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom
  const maximum = Math.max(1, ...points.flatMap((point) => [Number(point.sales), Number(point.procurementCost)]))
  const x = (index) => pad.left + (points.length <= 1 ? plotWidth / 2 : (index * plotWidth) / (points.length - 1))
  const y = (value) => pad.top + plotHeight - (Number(value) / maximum) * plotHeight
  const salesPoints = points.map((point, index) => `${x(index)},${y(point.sales)}`).join(' ')
  const costPoints = points.map((point, index) => `${x(index)},${y(point.procurementCost)}`).join(' ')
  const labelInterval = range === 'DAY' ? 4 : range === 'MONTH' ? 5 : 2
  const rangeLabel = range === 'DAY' ? 'the past 24 hours' : range === 'MONTH' ? 'the past 30 days' : 'the past 12 months'

  return (
    <div className="analytics-chart" role="img" aria-label={`Paid sales and procurement spend in Egyptian pounds for ${rangeLabel}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const value = maximum * step
          const lineY = y(value)
          return (
            <g key={step}>
              <line x1={pad.left} x2={width - pad.right} y1={lineY} y2={lineY} className="analytics-chart__grid" />
              <text x={pad.left - 10} y={lineY + 4} textAnchor="end" className="analytics-chart__axis">{money(value)}</text>
            </g>
          )
        })}
        <polyline points={salesPoints} className="analytics-chart__line analytics-chart__line--sales" />
        <polyline points={costPoints} className="analytics-chart__line analytics-chart__line--cost" />
        {points.map((point, index) => (
          <g key={point.period}>
            <circle cx={x(index)} cy={y(point.sales)} r="4" className="analytics-chart__dot analytics-chart__dot--sales">
              <title>{periodLabel(point.period, range)}: paid sales {money(point.sales)}</title>
            </circle>
            <circle cx={x(index)} cy={y(point.procurementCost)} r="4" className="analytics-chart__dot analytics-chart__dot--cost">
              <title>{periodLabel(point.period, range)}: procurement {money(point.procurementCost)}</title>
            </circle>
            {(index % labelInterval === 0 || index === points.length - 1) && (
              <text x={x(index)} y={height - 13} textAnchor="middle" className="analytics-chart__axis">
                {periodLabel(point.period, range)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

function ProviderChart({ providers }) {
  const maximum = Math.max(1, ...providers.map((provider) => provider.sellableUnits))
  const highest = providers[0]
  return (
    <div className="analytics-provider-list">
      {highest && highest.sellableUnits > 0 && (
        <div className="analytics-provider-highlight">
          <span className="analytics-provider-highlight__icon" aria-hidden="true">✦</span>
          <div><small>Most sellable stock</small><strong>{highest.providerName}</strong></div>
          <b>{number(highest.sellableUnits)} units</b>
        </div>
      )}
      {providers.map((provider) => (
        <article className="analytics-provider" key={provider.providerId}>
          <div className="analytics-provider__heading">
            <strong>{provider.providerName}</strong>
            <span>{number(provider.sellableUnits)} units · {money(provider.sellableCost)} cost</span>
          </div>
          <div className="analytics-provider__track" aria-label={`${provider.sellableUnits} sellable units`}>
            <span style={{ width: `${(provider.sellableUnits / maximum) * 100}%` }} />
          </div>
          <div className="analytics-provider__meta">
            <span>{number(provider.sellableVariants)} variants available</span>
            <span>{money(provider.sellableRetailValue)} retail value</span>
          </div>
        </article>
      ))}
      {providers.length === 0 && <p className="analytics-empty">No supplier receipts yet. Record a stock receipt to see supplier inventory.</p>}
    </div>
  )
}

function ProviderSalesChart({ providers }) {
  const maximum = Math.max(1, ...providers.map((provider) => provider.unitsSold))
  const highest = providers[0]

  return (
    <div className="analytics-provider-sales" aria-label="Providers ranked by total completed units sold across their products">
      {highest && (
        <div className="analytics-provider-highlight">
          <span className="analytics-provider-highlight__icon" aria-hidden="true">✦</span>
          <div><small>Top-selling provider</small><strong>{highest.providerName}</strong></div>
          <b>{number(highest.unitsSold)} sold</b>
        </div>
      )}
      {providers.map((provider, index) => (
        <article className="analytics-provider-sale" key={provider.providerName}>
          <span className="analytics-provider-sale__rank">{String(index + 1).padStart(2, '0')}</span>
          <div className="analytics-provider-sale__details">
            <div className="analytics-provider-sale__heading">
              <strong>{provider.providerName}</strong>
              <span>{number(provider.productsSold)} products sold</span>
            </div>
            <div
              className="analytics-provider-sale__track"
              role="img"
              aria-label={`${number(provider.unitsSold)} total units sold`}
            >
              <span style={{ width: `${(provider.unitsSold / maximum) * 100}%` }} />
            </div>
          </div>
          <b>{number(provider.unitsSold)} sold</b>
        </article>
      ))}
      {providers.length === 0 && <p className="analytics-empty">Completed sales for received products will appear here.</p>}
    </div>
  )
}

function InventoryChart({ items }) {
  const maxUnits = Math.max(1, ...items.map((item) => item.units))
  return (
    <div className="analytics-inventory-list">
      {items.map((item) => (
        <div className="analytics-inventory" key={item.productType}>
          <div><strong>{item.productType.toLowerCase()}</strong><span>{number(item.units)} units · {money(item.retailValue)}</span></div>
          <div className="analytics-inventory__track"><span style={{ width: `${(item.units / maxUnits) * 100}%` }} /></div>
        </div>
      ))}
      {items.length === 0 && <p className="analytics-empty">No active catalog inventory is available.</p>}
    </div>
  )
}

function OrderStatusChart({ statuses }) {
  const maximum = Math.max(1, ...statuses.map((status) => status.count))
  return (
    <div className="analytics-status-list">
      {statuses.map((status) => (
        <div className="analytics-status" key={status.status}>
          <span>{status.status}</span><div className="analytics-status__track"><i style={{ width: `${(status.count / maximum) * 100}%` }} /></div><b>{number(status.count)}</b>
        </div>
      ))}
      {statuses.length === 0 && <p className="analytics-empty">Orders will appear here as customers check out.</p>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  useTitle('Business overview')
  const [salesRange, setSalesRange] = useState('YEAR')
  const [salesOffset, setSalesOffset] = useState(0)
  const fetchDashboard = useCallback(
    () => adminAnalyticsApi.dashboard(salesRange, salesOffset),
    [salesRange, salesOffset],
  )
  const state = useFetch(fetchDashboard)
  const dashboard = state.data
  const summary = dashboard?.summary

  if (state.loading && !dashboard) return <p className="hint">Loading business overview…</p>

  return (
    <div className="analytics-page">
      <header className="analytics-hero">
        <div>
          <span className="analytics-kicker">Newtin · Admin intelligence</span>
          <h1>Business overview</h1>
          <p>Sales, purchasing, inventory, and supplier performance in one place.</p>
        </div>
        <div className="analytics-hero__stamp"><span>LIVE</span><strong>Store pulse</strong><small>Updated just now</small></div>
      </header>

      {state.error && <Alert tone="error">{state.error}</Alert>}
      {!dashboard && state.error && <p className="analytics-empty">The overview could not be loaded.</p>}
      {dashboard && <>
        <section className="analytics-metrics" aria-label="Key business metrics">
          <Metric label="Paid sales" value={money(summary.salesRevenue)} note={`${number(summary.paidOrders)} paid orders`} tone="leaf" />
          <Metric label="Procurement spend" value={money(summary.procurementSpend)} note="All recorded receipts" tone="blue" />
          <Metric label="Estimated gross profit" value={money(summary.grossProfit)} note={`${money(summary.costOfGoodsSold)} estimated cost of goods sold`} tone="ink" />
          <Metric label="Sellable inventory" value={number(summary.inventoryUnits)} note={`${money(summary.inventoryRetailValue)} potential retail value`} tone="mint" />
        </section>

        <section className="analytics-section analytics-finance">
          <div className="analytics-section__head">
            <div>
              <span className="analytics-kicker">Money flow</span>
              <h2>Sales & purchasing</h2>
              <p>
                {salesRange === 'DAY' ? '24 hours, hour by hour' : salesRange === 'MONTH' ? '30 days, day by day' : '12 months, month by month'}
                {dashboard.salesOffset === 0 ? ' · Current period' : ` · ${periodWindowLabel(dashboard.salesAndPurchasing, dashboard.salesRange)}`}
              </p>
            </div>
            <div className="analytics-finance__controls">
              <div className="analytics-period-nav" role="group" aria-label="Navigate sales and purchasing periods">
                <button
                  type="button"
                  className="analytics-period-nav__button"
                  aria-label="Show previous period"
                  disabled={salesOffset >= 1200}
                  onClick={() => setSalesOffset((offset) => Math.min(1200, offset + 1))}
                >
                  ‹ <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="analytics-period-nav__button"
                  aria-label="Show next period"
                  disabled={salesOffset === 0}
                  onClick={() => setSalesOffset((offset) => Math.max(0, offset - 1))}
                >
                  <span>Next</span> ›
                </button>
              </div>
              <div className="analytics-range" role="group" aria-label="Sales and purchasing chart range">
                {['DAY', 'MONTH', 'YEAR'].map((range) => (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={salesRange === range}
                    className={salesRange === range ? 'analytics-range__button is-active' : 'analytics-range__button'}
                    onClick={() => {
                      setSalesRange(range)
                      setSalesOffset(0)
                    }}
                  >
                    {range === 'DAY' ? 'Day' : range === 'MONTH' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
              <div className="analytics-legend"><span><i className="analytics-legend__sales" />Paid sales</span><span><i className="analytics-legend__cost" />Procurement</span></div>
            </div>
          </div>
          <div
            className="analytics-chart-transition"
            key={`${dashboard.salesRange}-${dashboard.salesOffset}`}
          >
            <FinanceChart points={dashboard.salesAndPurchasing} range={dashboard.salesRange} />
          </div>
          <p className="analytics-note">Procurement is cash outflow when stock is received; gross profit uses the estimated acquisition cost of items in paid orders. Each range is a rolling period ending now.</p>
        </section>

        <div className="analytics-grid">
          <section className="analytics-section">
            <div className="analytics-section__head">
              <div><span className="analytics-kicker">Supplier performance</span><h2>Sellable stock by provider</h2><p>Available units and their purchase cost basis.</p></div>
            </div>
            <ProviderChart providers={dashboard.providers} />
            <p className="analytics-note">Supplier stock is estimated from FIFO receipt lots and capped at current variant stock; units without receipt history are not attributed to a provider.</p>
          </section>

          <section className="analytics-section">
            <div className="analytics-section__head">
              <div><span className="analytics-kicker">What can sell now</span><h2>Inventory mix</h2><p>Active stock by product family.</p></div>
            </div>
            <InventoryChart items={dashboard.inventoryByType} />
            <div className="analytics-inventory-summary">
              <span><b>{number(summary.lowStockVariants)}</b> low-stock variants</span>
              <span><b>{number(summary.outOfStockVariants)}</b> out of stock</span>
              <span><b>{money(summary.inventoryCost)}</b> stock cost basis</span>
            </div>
          </section>
        </div>

        <section className="analytics-section">
          <div className="analytics-section__head">
            <div><span className="analytics-kicker">Supplier performance</span><h2>Best-selling providers</h2><p>Ranked by total units sold across each provider’s products, attributed by receipt-lot FIFO.</p></div>
          </div>
          <ProviderSalesChart providers={dashboard.providerSales} />
        </section>

        <div className="analytics-grid analytics-grid--bottom">
          <section className="analytics-section">
            <div className="analytics-section__head"><div><span className="analytics-kicker">Fulfillment</span><h2>Order flow</h2><p>{number(summary.totalOrders)} orders across every status.</p></div></div>
            <OrderStatusChart statuses={dashboard.ordersByStatus} />
          </section>
          <section className="analytics-section">
            <div className="analytics-section__head"><div><span className="analytics-kicker">Customer demand</span><h2>Best sellers</h2><p>Ranked by paid sales revenue.</p></div></div>
            {dashboard.topProducts.length > 0 ? (
              <ol className="analytics-best-sellers">
                {dashboard.topProducts.map((item, index) => (
                  <li key={item.productName}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.productName}</strong><small>{number(item.unitsSold)} sold</small><b>{money(item.salesRevenue)}</b></li>
                ))}
              </ol>
            ) : <p className="analytics-empty">Paid sales will appear here after the first completed customer payment.</p>}
          </section>
        </div>
        <footer className="analytics-disclaimer">
          <span>ℹ</span><p>Revenue includes completed payments only. Gross profit and stock cost are estimates based on recorded procurement costs; prices and stock totals are shown in EGP.</p>
        </footer>
      </>}
    </div>
  )
}
