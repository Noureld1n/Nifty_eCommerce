import { useCallback, useState } from 'react'
import { adminOrderApi } from '../../api/adminCommerceApi'
import { Alert, Button, Field, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'
import './AdminCommerce.css'

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']
const SHIPMENT_STATUSES = ['PENDING', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED']
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))
const pretty = (value) => value ? value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'
const addressText = (address) => address ? [address.street, address.city, address.state, address.zipcode, address.countryCode].filter(Boolean).join(', ') : '—'
const dateInput = (value) => value ? value.slice(0, 16) : ''

export default function AdminOrdersPage() {
  useTitle('Orders')
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const fetcher = useCallback(() => adminOrderApi.list({
    status: statusFilter, paymentStatus: paymentFilter, page, size: 12,
  }), [statusFilter, paymentFilter, page])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const list = normalizePage(data)
  const [selectedId, setSelectedId] = useState(null)
  const [orderStatus, setOrderStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [shipment, setShipment] = useState({ status: 'PENDING', trackingNumber: '', carrier: '', expectedDeliveryAt: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedOrder = list.items.find((order) => String(order.id) === String(selectedId))

  function selectOrder(order) {
    setSelectedId(order.id)
    setOrderStatus(order.status)
    setPaymentStatus(order.paymentStatus)
    setShipment({
      status: order.shipment?.status ?? 'PENDING',
      trackingNumber: order.shipment?.trackingNumber ?? '',
      carrier: order.shipment?.carrier ?? '',
      expectedDeliveryAt: dateInput(order.shipment?.expectedDeliveryAt),
    })
    setError('')
    setMessage('')
  }

  async function mutate(action, success) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      reload()
      setMessage(success)
    } catch (requestError) {
      setError(requestError.fieldErrors
        ? Object.values(requestError.fieldErrors).join(' ')
        : requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Orders</h1><p>Review customer orders and update fulfillment, payment, and shipment statuses.</p></div></div>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {loadError && <Alert tone="error" action={<Button small variant="ghost" onClick={reload}>Try again</Button>}>{loadError}</Alert>}

      <div className="toolbar">
        <label className="admin-select"><span>Order status</span>
          <select value={statusFilter} onChange={(event) => { setPage(0); setStatusFilter(event.target.value) }}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
          </select>
        </label>
        <label className="admin-select"><span>Payment status</span>
          <select value={paymentFilter} onChange={(event) => { setPage(0); setPaymentFilter(event.target.value) }}>
            <option value="">All payment statuses</option>
            {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
          </select>
        </label>
      </div>

      <div className="table-wrap" aria-busy={loading}>
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th><th /></tr></thead>
          <tbody>
            {list.items.map((order) => (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td><strong>{order.customerName}</strong><small>{order.customerEmail}</small></td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{money(order.totalPrice)}</td>
                <td><span className={`badge ${order.status === 'CANCELLED' ? 'badge--off' : 'badge--ok'}`}>{pretty(order.status)}</span></td>
                <td>{pretty(order.paymentStatus)}</td>
                <td><Button small variant="ghost" onClick={() => selectOrder(order)}>{String(selectedId) === String(order.id) ? 'Selected' : 'Manage'}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && list.items.length === 0 && <div className="empty"><strong>No orders found</strong>Orders matching these filters will appear here.</div>}
      </div>
      <Pager page={list.page} totalPages={list.totalPages} onPage={setPage} />

      {selectedOrder && (
        <section className="section" aria-labelledby="selected-order-title">
          <div className="section__intro"><h2 id="selected-order-title">Order #{selectedOrder.id}</h2><p>{selectedOrder.customerName} · {selectedOrder.customerEmail}</p></div>
          <div className="section__body admin-panel">
            <div className="admin-detail">
              <div className="admin-panel__head"><strong>Order items</strong><strong>{money(selectedOrder.totalPrice)} {selectedOrder.currencyCode}</strong></div>
              <div className="admin-detail__items">
                {(selectedOrder.items ?? []).map((item) => (
                  <div className="admin-detail__line" key={item.id}>
                    <span><strong>{item.productName}</strong><small>{item.variantDescription || 'Standard variant'}</small></span>
                    <span>× {item.quantity}</span><span>{money(item.priceAtPurchase)} each</span>
                    <strong>{money(Number(item.quantity) * Number(item.priceAtPurchase))}</strong>
                  </div>
                ))}
              </div>
              <div className="facts">
                <div><dt>Ship to</dt><dd>{addressText(selectedOrder.shippingAddress)}</dd></div>
                <div><dt>Bill to</dt><dd>{addressText(selectedOrder.billingAddress)}</dd></div>
              </div>
            </div>

            <div className="admin-detail">
              <h3>Order status</h3>
              <div className="admin-inline-form">
                <label className="admin-select"><span>Set status</span>
                  <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}>
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                  </select>
                </label>
                <Button small loading={busy} disabled={orderStatus === selectedOrder.status}
                  onClick={() => mutate(() => adminOrderApi.setStatus(selectedOrder.id, orderStatus), 'Order status updated.')}>Update status</Button>
              </div>
              <h3>Payment status</h3>
              <div className="admin-inline-form">
                <label className="admin-select"><span>Set payment status</span>
                  <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
                    {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                  </select>
                </label>
                <Button small variant="ghost" loading={busy} disabled={paymentStatus === selectedOrder.paymentStatus}
                  onClick={() => mutate(() => adminOrderApi.setPaymentStatus(selectedOrder.id, paymentStatus), 'Payment status updated.')}>Update payment</Button>
              </div>
            </div>

            <form className="admin-detail admin-form" onSubmit={(event) => {
              event.preventDefault()
              mutate(() => adminOrderApi.updateShipment(selectedOrder.id, {
                status: shipment.status,
                trackingNumber: shipment.trackingNumber.trim() || null,
                carrier: shipment.carrier.trim() || null,
                expectedDeliveryAt: shipment.expectedDeliveryAt
                  ? shipment.expectedDeliveryAt.length === 16 ? `${shipment.expectedDeliveryAt}:00` : shipment.expectedDeliveryAt
                  : null,
              }), 'Shipment updated.')
            }}>
              <h3>Shipment</h3>
              <div className="admin-form__row">
                <label className="field"><span>Shipment status</span>
                  <select value={shipment.status} onChange={(event) => setShipment((value) => ({ ...value, status: event.target.value }))}>
                    {SHIPMENT_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                  </select>
                </label>
                <Field label="Carrier" maxLength={100} value={shipment.carrier} onChange={(event) => setShipment((value) => ({ ...value, carrier: event.target.value }))} />
              </div>
              <div className="admin-form__row">
                <Field label="Tracking number" maxLength={150} value={shipment.trackingNumber} onChange={(event) => setShipment((value) => ({ ...value, trackingNumber: event.target.value }))} />
                <Field label="Expected delivery" type="datetime-local" value={shipment.expectedDeliveryAt} onChange={(event) => setShipment((value) => ({ ...value, expectedDeliveryAt: event.target.value }))} />
              </div>
              <div className="admin-form__actions">
                <Button type="submit" loading={busy}>Save shipment</Button>
                {selectedOrder.shipment?.delivered && <span className="badge badge--ok">Delivered {formatDate(selectedOrder.shipment.actualDeliveryAt)}</span>}
              </div>
            </form>
          </div>
        </section>
      )}
    </>
  )
}
