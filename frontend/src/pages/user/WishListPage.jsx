import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { wishlistApi } from '../../api/customerCommerceApi'
import { Alert, Button } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import './WishListPage.css'

const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))

export default function WishListPage() {
  useTitle('Wishlist')
  const fetcher = useCallback(() => wishlistApi.list(), [])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const items = Array.isArray(data) ? data : []
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  async function remove(productId) {
    setBusyId(productId)
    setActionError('')
    try {
      await wishlistApi.remove(productId)
      reload()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Your wishlist</h1>
          <p>Keep the pieces you love close by.</p>
        </div>
      </div>
      {loadError && (
        <Alert tone="error" action={<Button variant="ghost" small onClick={reload}>Try again</Button>}>
          {loadError}
        </Alert>
      )}
      {actionError && <Alert tone="error">{actionError}</Alert>}
      {!loading && !loadError && items.length === 0 && (
        <div className="empty">
          <strong>Your wishlist is waiting</strong>
          Save a few favorites while exploring the shop.
          <p><Link className="btn btn--primary btn--small" to="/shop">Explore the shop</Link></p>
        </div>
      )}
      <div className="wishlist" aria-busy={loading}>
        {items.map((item) => (
          <article className="wishlist-item" key={item.id}>
            <Link className="wishlist-item__image" to={`/shop/products/${item.productId}`} aria-label={`View ${item.productName}`}>
              <span className="wishlist-item__mark" aria-hidden="true">{item.productType?.slice(0, 1) || 'N'}</span>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.hidden = true }}
                />
              )}
            </Link>
            <div className="wishlist-item__info">
              <span>{item.productType?.toLowerCase()}</span>
              <h2><Link to={`/shop/products/${item.productId}`}>{item.productName}</Link></h2>
              <strong>{money(item.basePrice)}</strong>
            </div>
            <div className="wishlist-item__actions">
              <Link className="btn btn--ghost btn--small" to={`/shop/products/${item.productId}`}>View item</Link>
              <Button variant="quiet" small loading={busyId === item.productId} onClick={() => remove(item.productId)}>
                Remove
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
