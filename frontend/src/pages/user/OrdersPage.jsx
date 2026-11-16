import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderApi } from '../../api/customerCommerceApi'
import { Alert, Button, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'
import './CommercePages.css'

const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))
const pretty = (value) => value ? value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'

export default function OrdersPage() {
  useTitle('Your orders')
  const [page, setPage] = useState(0)
  const fetcher = useCallback(() => orderApi.list(page, 10), [page])
  const { data, loading, error, reload } = useFetch(fetcher)
  const orders = normalizePage(data)

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Your orders</h1>
          <p>See what you’ve ordered and follow its delivery progress.</p>
        </div>
      </div>
      {error && <Alert tone="error" action={<Button variant="ghost" small onClick={reload}>Try again</Button>}>{error}</Alert>}
      {!loading && !error && !orders.items.length && (
        <div className="empty"><strong>No orders yet</strong>Your placed orders will appear here.<p><Link className="btn btn--primary btn--small" to="/shop">Explore the shop</Link></p></div>
      )}
      <div className="order-list" aria-busy={loading}>
        {orders.items.map((order) => (
          <article className="order-card" key={order.id}>
            <header className="order-card__header">
              <div><span className="hint">Order</span><strong>#{order.id}</strong></div>
              <span className={`badge ${order.status === 'CANCELLED' ? 'badge--off' : 'badge--ok'}`}>{pretty(order.status)}</span>
            </header>
            <div className="order-card__facts">
              <span><small>Placed</small>{formatDate(order.createdAt)}</span>
              <span><small>Items</small>{order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}</span>
              <span><small>Total</small><strong>{money(order.totalPrice)}</strong></span>
              <span><small>Shipment</small>{pretty(order.shipment?.status)}</span>
            </div>
            <div className="order-card__footer">
              <span className="hint">Payment: {pretty(order.paymentStatus)}</span>
              <Link className="btn btn--ghost btn--small" to={`/account/orders/${order.id}`}>View order</Link>
            </div>
          </article>
        ))}
      </div>
      <Pager page={orders.page} totalPages={orders.totalPages} onPage={setPage} />
    </>
  )
}
