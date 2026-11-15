import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { cartApi } from '../api/customerCommerceApi'
import Logo from '../components/Logo'
import { Avatar, Button } from '../components/ui'
import { roleLabel } from '../lib/format'
import { ADMIN_LINKS, CUSTOMER_LINKS } from './navigationLinks'
import './AppNavigation.css'

const GUEST_LINKS = { primary: [{ to: '/shop', label: 'Shop', end: true, icon: 'shop' }], menus: [] }
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))

function ChevronIcon() {
  return (
    <svg className="app-nav__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.2" fill="currentColor" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" />
    </svg>
  )
}

function PrimaryLinkIcon({ name }) {
  if (name === 'shop') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9h16l-1.3 11H5.3L4 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 9a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'wishlist') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'orders') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return null
}

function CartDrawer({ open, onClose, triggerRef }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    let active = true
    const trigger = triggerRef.current
    setLoading(true)
    setError('')
    cartApi.get()
      .then((result) => { if (active) setCart(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      active = false
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      trigger?.focus()
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  const items = cart?.items ?? []
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <div
      className="cart-drawer__backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <header className="cart-drawer__header">
          <div>
            <h2 id="cart-drawer-title">Your cart</h2>
            <p>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
          </div>
          <button ref={closeButtonRef} className="cart-drawer__close" type="button" aria-label="Close cart" onClick={onClose}>×</button>
        </header>

        <div className="cart-drawer__body">
          {loading && <p className="cart-drawer__message">Loading your cart…</p>}
          {error && <p className="cart-drawer__message cart-drawer__message--error" role="alert">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <div className="cart-drawer__empty">
              <p>Your cart is empty.</p>
              <Link to="/shop" onClick={onClose}>Explore the shop</Link>
            </div>
          )}
          {!loading && !error && items.map((item) => (
            <article className="cart-drawer__item" key={item.variantItemId}>
              <Link className="cart-drawer__image" to={`/shop/products/${item.productId}`} onClick={onClose} aria-label={`View ${item.productName}`}>
                <span aria-hidden="true">N</span>
                {item.imageUrl && <img src={item.imageUrl} alt="" onError={(event) => { event.currentTarget.hidden = true }} />}
              </Link>
              <div className="cart-drawer__item-info">
                <Link to={`/shop/products/${item.productId}`} onClick={onClose}>{item.productName}</Link>
                {item.variantDescription && <span>{item.variantDescription}</span>}
                <span>Qty {item.quantity} · {money(item.unitPrice)} each</span>
              </div>
              <strong>{money(item.subtotal)}</strong>
            </article>
          ))}
        </div>

        {!loading && !error && items.length > 0 && (
          <footer className="cart-drawer__footer">
            <div><span>Subtotal</span><strong>{money(cart.total)}</strong></div>
            <Link className="btn btn--primary btn--full" to="/account/cart" onClick={onClose}>View cart &amp; checkout</Link>
            <Link className="cart-drawer__continue" to="/shop" onClick={onClose}>Continue shopping</Link>
          </footer>
        )}
      </aside>
    </div>
  )
}

export default function AppNavigation({ links }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [cartOpen, setCartOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const menuRefs = useRef([])
  const cartButtonRef = useRef(null)
  const navLinks = links ?? (user?.role === 'ROLE_ADMIN' ? ADMIN_LINKS : user?.role === 'ROLE_CUSTOMER' ? CUSTOMER_LINKS : GUEST_LINKS)

  useEffect(() => {
    menuRefs.current.forEach((menu) => {
      if (menu) menu.open = false
    })
  }, [pathname])

  const closeCart = useCallback(() => setCartOpen(false), [])

  async function signOut() {
    setLeaving(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="app-nav">
        <div className="app-nav__wrap">
          <Link to="/shop" className="app-nav__brand" aria-label="Newtin shop">
            <Logo size={36} wordmark speed="paused" />
          </Link>
          <nav className="app-nav__sections" aria-label="Main navigation">
            <div className="app-nav__primary">
              {navLinks.primary.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}>
                  {link.icon && <PrimaryLinkIcon name={link.icon} />}
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
            {user?.role === 'ROLE_CUSTOMER' && (
              <button
                ref={cartButtonRef}
                className="app-nav__cart"
                type="button"
                aria-label="Open shopping cart"
                aria-expanded={cartOpen}
                onClick={() => setCartOpen(true)}
              >
                <CartIcon />
                <span>Cart</span>
              </button>
            )}
            {navLinks.menus.length > 0 && (
              <div className="app-nav__menus">
                {navLinks.menus.map((menu, index) => {
                  const active = menu.items.some(({ to }) => pathname === to || pathname.startsWith(`${to}/`))
                  return (
                    <details
                      className="app-nav-menu"
                      key={menu.label}
                      ref={(element) => { menuRefs.current[index] = element }}
                    >
                      <summary className={active ? 'active' : ''}>
                        {menu.label}
                        <ChevronIcon />
                      </summary>
                      <div className="app-nav-menu__panel">
                        {menu.items.map((item) => (
                          <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </nav>
          <div className="app-nav__actions">
            {user ? (
              <div className="app-nav__user">
                <Avatar user={user} size="2.25rem" />
                <div className="app-nav__who">
                  <strong>{user.firstName} {user.lastName}</strong>
                  <span>{roleLabel(user.role)}</span>
                </div>
                <Button variant="ghost" small loading={leaving} onClick={signOut}>Log out</Button>
              </div>
            ) : (
              <Link className="btn btn--primary btn--small" to="/login">Log in</Link>
            )}
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onClose={closeCart} triggerRef={cartButtonRef} />
    </>
  )
}
