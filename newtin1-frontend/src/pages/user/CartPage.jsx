import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addressApi, cartApi } from '../../api/customerCommerceApi'
import { Alert, Button } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import './CommercePages.css'

const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))
const addressLabel = (address) => [address.street, address.city, address.state, address.zipcode, address.countryCode].filter(Boolean).join(', ')

export default function CartPage() {
  useTitle('Your cart')
  const navigate = useNavigate()
  const cartFetcher = useCallback(() => cartApi.get(), [])
  const addressFetcher = useCallback(() => addressApi.list(), [])
  const cartState = useFetch(cartFetcher)
  const addressState = useFetch(addressFetcher)
  const cart = cartState.data
  const addresses = Array.isArray(addressState.data) ? addressState.data : []
  const [shippingId, setShippingId] = useState('')
  const [billingSame, setBillingSame] = useState(true)
  const [billingId, setBillingId] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const defaultAddress = addresses.find((address) => address.defaultAddress) ?? addresses[0]
  const chosenShippingId = shippingId || String(defaultAddress?.id ?? '')

  async function updateQuantity(item, quantity) {
    if (quantity < 1 || quantity > item.availableStock) return
    setBusyId(item.variantItemId)
    setError('')
    try {
      await cartApi.setQuantity(item.variantItemId, quantity)
      cartState.reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  async function removeItem(item) {
    setBusyId(item.variantItemId)
    setError('')
    try {
      await cartApi.remove(item.variantItemId)
      cartState.reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  async function abandon() {
    setBusyId('cart')
    setError('')
    try {
      await cartApi.abandon()
      cartState.reload()
      setNotice('Your cart has been cleared.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  async function checkout() {
    setError('')
    setNotice('')
    if (!chosenShippingId) {
      setError('Add a delivery address before placing your order.')
      return
    }
    setCheckoutBusy(true)
    try {
      const order = await cartApi.checkout(
        Number(chosenShippingId),
        billingSame ? null : billingId ? Number(billingId) : null,
      )
      navigate(`/account/orders/${order.id}`, {
        replace: true,
        state: { message: 'Your order has been placed. Payment is not processed online.' },
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCheckoutBusy(false)
    }
  }

  if (cartState.loading && !cart) {
    return <><div className="page-head"><div className="page-head__text"><h1>Your cart</h1></div></div><p className="hint">Loading your cart…</p></>
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Your cart</h1>
          <p>Review your items before placing your order.</p>
        </div>
        <Link className="btn btn--ghost btn--small" to="/shop">Continue shopping</Link>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {cartState.error && <Alert tone="error" action={<Button variant="ghost" small onClick={cartState.reload}>Try again</Button>}>{cartState.error}</Alert>}
      {addressState.error && <Alert tone="error">Addresses could not be loaded: {addressState.error}</Alert>}

      {!cartState.error && !cartState.loading && !cart?.items?.length && (
        <div className="empty"><strong>Your cart is empty</strong>Find something you love in the shop.<p><Link className="btn btn--primary btn--small" to="/shop">Browse the shop</Link></p></div>
      )}
      {cart?.items?.length > 0 && (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.variantItemId}>
                <Link className="cart-item__image" to={`/shop/products/${item.productId}`} aria-label={`View ${item.productName}`}>
                  <span className="cart-item__mark" aria-hidden="true">N</span>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true }}
                    />
                  )}
                </Link>
                <div className="cart-item__info">
                  <h2><Link to={`/shop/products/${item.productId}`}>{item.productName}</Link></h2>
                  {item.variantDescription && <p>{item.variantDescription}</p>}
                  {item.promotion && <span className="badge badge--ok">{item.promotion.name}</span>}
                  <div className="cart-item__price">
                    <strong>{money(item.unitPrice)}</strong>
                    {Number(item.unitPrice) < Number(item.regularUnitPrice) && <del>{money(item.regularUnitPrice)}</del>}
                    <span>each</span>
                  </div>
                  {item.quantity > item.availableStock && <span className="cart-item__warning">Only {item.availableStock} available. Adjust the quantity to continue.</span>}
                  {item.availableStock === 0 && <span className="cart-item__warning">Currently out of stock.</span>}
                </div>
                <div className="cart-item__controls">
                  <div className="cart-quantity" aria-label={`Quantity for ${item.productName}`}>
                    <Button small variant="ghost" disabled={item.quantity <= 1 || busyId === item.variantItemId}
                      aria-label="Decrease quantity" onClick={() => updateQuantity(item, item.quantity - 1)}>−</Button>
                    <span>{item.quantity}</span>
                    <Button small variant="ghost" disabled={item.quantity >= item.availableStock || busyId === item.variantItemId}
                      aria-label="Increase quantity" onClick={() => updateQuantity(item, item.quantity + 1)}>+</Button>
                  </div>
                  <strong>{money(item.subtotal)}</strong>
                  <Button small variant="quiet" loading={busyId === item.variantItemId} onClick={() => removeItem(item)}>Remove</Button>
                </div>
              </article>
            ))}
            <Button small variant="quiet" loading={busyId === 'cart'} onClick={abandon}>Clear cart</Button>
          </section>

          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div className="cart-summary__line"><span>Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</span><strong>{money(cart.total)}</strong></div>
            <div className="cart-summary__line"><span>Shipping</span><span>Calculated separately</span></div>
            <div className="cart-summary__total"><span>Total</span><strong>{money(cart.total)}</strong></div>
            <p className="hint">Final prices are confirmed when your order is placed. Online payment is not available yet.</p>

            {addresses.length === 0 ? (
              <div className="cart-summary__address-prompt">
                <Alert tone="info">Add an address to continue to checkout.</Alert>
                <Link className="btn btn--ghost btn--small" to="/account/addresses">Add delivery address</Link>
              </div>
            ) : (
              <div className="cart-summary__addresses">
                <label className="field">
                  <span>Delivery address</span>
                  <select value={chosenShippingId} onChange={(event) => setShippingId(event.target.value)}>
                    {addresses.map((address) => <option key={address.id} value={address.id}>{address.addressType} · {addressLabel(address)}</option>)}
                  </select>
                </label>
                <label className="cart-same-address">
                  <input type="checkbox" checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />
                  <span>Use delivery address for billing</span>
                </label>
                {!billingSame && (
                  <label className="field">
                    <span>Billing address</span>
                    <select value={billingId || chosenShippingId} onChange={(event) => setBillingId(event.target.value)}>
                      {addresses.map((address) => <option key={address.id} value={address.id}>{address.addressType} · {addressLabel(address)}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}
            <Button full loading={checkoutBusy} disabled={!addresses.length || cart.items.some((item) => item.quantity > item.availableStock)}
              onClick={checkout}>Place order</Button>
          </aside>
        </div>
      )}
    </>
  )
}
