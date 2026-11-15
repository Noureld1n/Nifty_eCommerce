import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '../../api/customerCommerceApi'
import { Alert, Button } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate } from '../../lib/format'
import './CommercePages.css'

const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))
const pretty = (value) => value ? value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'
const addressText = (address) => address
  ? [address.street, address.city, address.state, address.zipcode, address.countryCode].filter(Boolean).join(', ')
  : 'No longer available'

export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const fetcher = useCallback(() => orderApi.get(id), [id])
  const { data: order, loading, error, reload } = useFetch(fetcher)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')
  useTitle(order ? `Order #${order.id}` : 'Order details')

  async function cancelOrder() {
    setBusy(true)
    setActionError('')
    setMessage('')
    try {
      await orderApi.cancel(order.id)
      setConfirmCancel(false)
      setMessage('Order cancelled. Reserved stock has been released.')
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading && (!order || String(order.id) !== id)) {
    return <><div className="page-head"><div className="page-head__text"><h1>Order details</h1></div></div><p className="hint">Loading order…</p></>
  }
  if (error || !order || String(order.id) !== id) {
    return (
      <>
        <div className="page-head"><div className="page-head__text"><h1>Order not found</h1><p>This order may no longer be available.</p></div></div>
        <Alert tone="error" action={<Button variant="ghost" small onClick={reload}>Try again</Button>}>{error || 'Order not found'}</Alert>
        <Link className="btn btn--ghost btn--small" to="/account/orders">Back to orders</Link>
      </>
    )
  }

  const shipment = order.shipment
  const canCancel = order.status === 'PENDING'

  return (
    <>
      <div className="page-head order-detail-head">
        <div className="page-head__text">
          <p className="hint"><Link to="/account/orders">Your orders</Link> / Order #{order.id}</p>
          <h1>Order #{order.id}</h1>
          <p>Placed {formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${order.status === 'CANCELLED' ? 'badge--off' : 'badge--ok'}`}>{pretty(order.status)}</span>
      </div>
      {message && <Alert tone="success">{message}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      <section className="section" aria-labelledby="order-items-title">
        <div className="section__intro"><h2 id="order-items-title">Items</h2><p>Prices shown are the prices recorded when the order was placed.</p></div>
        <div className="order-detail-items">
          {(order.items ?? []).map((item) => (
            <article className="order-detail-item" key={item.id}>
              <div><strong>{item.productName}</strong>{item.variantDescription && <p>{item.variantDescription}</p>}</div>
              <span>{item.quantity} × {money(item.priceAtPurchase)}</span>
              <strong>{money(Number(item.quantity) * Number(item.priceAtPurchase))}</strong>
            </article>
          ))}
          <div className="order-detail-total"><span>Total · {order.currencyCode}</span><strong>{money(order.totalPrice)}</strong></div>
        </div>
      </section>

      <section className="section" aria-labelledby="delivery-title">
        <div className="section__intro"><h2 id="delivery-title">Delivery & shipment</h2><p>Shipment details are updated as your order moves through fulfillment.</p></div>
        <div className="order-shipment">
          <dl className="facts">
            <div><dt>Order status</dt><dd>{pretty(order.status)}</dd></div>
            <div><dt>Shipment status</dt><dd>{pretty(shipment?.status)}</dd></div>
            <div><dt>Carrier</dt><dd>{shipment?.carrier || 'Not assigned yet'}</dd></div>
            <div><dt>Tracking number</dt><dd>{shipment?.trackingNumber || 'Not assigned yet'}</dd></div>
            <div><dt>Expected delivery</dt><dd>{formatDate(shipment?.expectedDeliveryAt)}</dd></div>
            <div><dt>Delivered</dt><dd>{shipment?.delivered ? formatDate(shipment.actualDeliveryAt) : 'Not delivered'}</dd></div>
          </dl>
          <div className="order-addresses">
            <div><h3>Ship to</h3><p>{addressText(order.shippingAddress)}</p></div>
            <div><h3>Bill to</h3><p>{addressText(order.billingAddress)}</p></div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="payment-title">
        <div className="section__intro"><h2 id="payment-title">Payment</h2><p>Online payment is not available yet.</p></div>
        <div className="order-payment">
          <span>Payment status</span><strong>{pretty(order.paymentStatus)}</strong>
        </div>
      </section>

      {canCancel && (
        <section className="order-cancel">
          {confirmCancel ? (
            <>
              <Alert tone="info">Cancel this order? This action cannot be undone.</Alert>
              <Button variant="danger" loading={busy} onClick={cancelOrder}>Confirm cancellation</Button>
              <Button variant="ghost" small onClick={() => setConfirmCancel(false)}>Keep order</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmCancel(true)}>Cancel order</Button>
          )}
        </section>
      )}
      <p><Button variant="quiet" small onClick={() => navigate('/account/orders')}>Back to your orders</Button></p>
    </>
  )
}
