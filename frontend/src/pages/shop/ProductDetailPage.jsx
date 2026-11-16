import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { catalogApi } from '../../api/catalogApi'
import { cartApi, reviewApi, wishlistApi } from '../../api/customerCommerceApi'
import { useAuth } from '../../auth/useAuth'
import { Alert, Button, Field, Pager } from '../../components/ui'
import HeartIcon from '../../components/HeartIcon'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { normalizePage } from '../../lib/format'
import './ShopPage.css'

const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))

function Rating({ value, count }) {
  const score = Number(value ?? 0)
  return (
    <span className="shop-rating" aria-label={`${score.toFixed(1)} out of 5 stars${count == null ? '' : `, ${count} reviews`}`}>
      <span aria-hidden="true">{'★'.repeat(Math.round(score))}{'☆'.repeat(5 - Math.round(score))}</span>
      <strong>{score.toFixed(1)}</strong>
      {count != null && <span>({count})</span>}
    </span>
  )
}

function ReviewRatingInput({ value, onChange }) {
  return (
    <fieldset className="shop-review-rating">
      <legend>Your rating</legend>
      <div className="shop-review-rating__stars">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label
            className={`shop-review-rating__star ${Number(value) >= rating ? 'is-filled' : ''}`}
            key={rating}
            title={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
          >
            <input
              type="radio"
              name="review-rating"
              value={rating}
              checked={Number(value) === rating}
              onChange={() => onChange(String(rating))}
            />
            <span aria-hidden="true">★</span>
            <span className="shop-review-rating__sr-only">{rating} {rating === 1 ? 'star' : 'stars'}</span>
          </label>
        ))}
        <strong>{value} / 5</strong>
      </div>
    </fieldset>
  )
}

function variantLabel(variant) {
  const details = [
    variant.size,
    variant.color,
    variant.material,
    variant.sizeLabel,
    variant.volumeMl ? `${variant.volumeMl} ml` : null,
    variant.formulation,
    variant.additionalDescription,
  ].filter(Boolean)
  return details.length ? details.join(' · ') : 'Standard'
}

function productDetails(product) {
  const fields = product.typeDetails ?? {}
  return Object.entries(fields).map(([key, value]) => ({
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()),
    value,
  }))
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isCustomer = user?.role === 'ROLE_CUSTOMER'
  const fetcher = useCallback(() => catalogApi.product(id), [id])
  const { data: product, loading, error, reload } = useFetch(fetcher)
  const [selectedId, setSelectedId] = useState(null)
  const [imageId, setImageId] = useState(null)
  const [reviewPage, setReviewPage] = useState(0)
  const reviewsFetcher = useCallback(() => reviewApi.listPublic(id, reviewPage, 5), [id, reviewPage])
  const summaryFetcher = useCallback(() => reviewApi.summary(id), [id])
  const mineFetcher = useCallback(() => isCustomer ? reviewApi.listMine() : Promise.resolve(null), [isCustomer])
  const wishlistFetcher = useCallback(() => isCustomer ? wishlistApi.list() : Promise.resolve([]), [isCustomer])
  const reviewsState = useFetch(reviewsFetcher)
  const summaryState = useFetch(summaryFetcher)
  const mineState = useFetch(mineFetcher)
  const wishlistState = useFetch(wishlistFetcher)
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [wishlistError, setWishlistError] = useState('')
  const [cartBusy, setCartBusy] = useState(false)
  const [cartError, setCartError] = useState('')
  const [reviewForm, setReviewForm] = useState({ title: '', text: '', rating: '5', recommended: '' })
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [confirmReviewDelete, setConfirmReviewDelete] = useState(false)
  useTitle(product?.name || 'Product')

  const currentProduct = product && String(product.id) === id ? product : null
  const variants = currentProduct?.variants ?? []
  const selected = variants.find((variant) => variant.variantItemId === selectedId)
    ?? variants.find((variant) => variant.defaultVariant)
    ?? variants[0]
  const images = useMemo(() => {
    const list = selected?.images ?? []
    return [...list].sort((a, b) => Number(b.main) - Number(a.main) || a.displayOrder - b.displayOrder)
  }, [selected])
  const image = images.find((item) => item.id === imageId) ?? images[0]
  const details = currentProduct ? productDetails(currentProduct) : []
  const reviewList = normalizePage(reviewsState.data)
  const myReviews = normalizePage(mineState.data).items
  const ownReview = myReviews.find((review) => String(review.productId) === id)
  const wishlist = Array.isArray(wishlistState.data) ? wishlistState.data : []
  const isWishlisted = wishlist.some((item) => String(item.productId) === id)

  useEffect(() => {
    setImageId(null)
  }, [selected?.variantItemId])
  useEffect(() => {
    setSelectedId(null)
  }, [id])
  useEffect(() => {
    setReviewForm(ownReview
      ? {
          title: ownReview.title ?? '',
          text: ownReview.text ?? '',
          rating: String(ownReview.rating),
          recommended: ownReview.recommended == null ? '' : String(ownReview.recommended),
        }
      : { title: '', text: '', rating: '5', recommended: '' })
    setReviewError('')
    setReviewMessage('')
    setConfirmReviewDelete(false)
    setReviewPage(0)
  }, [ownReview, id])

  if (loading && !currentProduct) {
    return <div className="shop-detail"><p className="shop-muted">Loading product…</p></div>
  }
  if (error || !currentProduct) {
    return (
      <div className="shop-detail">
        <p className="shop-breadcrumb"><Link to="/shop">Shop</Link><span aria-hidden="true">/</span> Product</p>
        <Alert tone="error" action={<Button variant="ghost" small onClick={reload}>Try again</Button>}>
          {error || 'Product not found'}
        </Alert>
      </div>
    )
  }

  async function toggleWishlist() {
    setWishlistBusy(true)
    setWishlistError('')
    try {
      if (isWishlisted) await wishlistApi.remove(currentProduct.id)
      else await wishlistApi.add(currentProduct.id)
      wishlistState.reload()
    } catch (requestError) {
      setWishlistError(requestError.message)
    } finally {
      setWishlistBusy(false)
    }
  }

  async function addSelectedToCart() {
    if (!selected) return
    setCartBusy(true)
    setCartError('')
    try {
      await cartApi.add(selected.variantItemId, 1)
      navigate('/account/cart')
    } catch (requestError) {
      setCartError(requestError.message)
      setCartBusy(false)
    }
  }

  async function submitReview(event) {
    event.preventDefault()
    setReviewError('')
    setReviewMessage('')
    if (!reviewForm.rating) {
      setReviewError('Choose a rating from 1 to 5.')
      return
    }
    setReviewBusy(true)
    try {
      const body = {
        title: reviewForm.title.trim() || null,
        text: reviewForm.text.trim() || null,
        rating: Number(reviewForm.rating),
        recommended: reviewForm.recommended === '' ? null : reviewForm.recommended === 'true',
      }
      if (ownReview) await reviewApi.update(ownReview.id, body)
      else await reviewApi.create(currentProduct.id, body)
      setReviewMessage(ownReview ? 'Your review has been updated.' : 'Thanks for sharing your review.')
      setConfirmReviewDelete(false)
      mineState.reload()
      reviewsState.reload()
      summaryState.reload()
    } catch (requestError) {
      setReviewError(requestError.message)
    } finally {
      setReviewBusy(false)
    }
  }

  async function deleteReview() {
    if (!ownReview) return
    setReviewBusy(true)
    setReviewError('')
    setReviewMessage('')
    try {
      await reviewApi.remove(ownReview.id)
      setReviewMessage('Your review has been removed.')
      setConfirmReviewDelete(false)
      mineState.reload()
      reviewsState.reload()
      summaryState.reload()
    } catch (requestError) {
      setReviewError(requestError.message)
    } finally {
      setReviewBusy(false)
    }
  }

  const onSale = selected && Number(selected.currentPrice) < Number(selected.regularPrice)
  const stockLabel = !selected
    ? 'Currently unavailable'
    : selected.stockQuantity > 0
      ? selected.stockQuantity <= 5 ? `Only ${selected.stockQuantity} left` : 'In stock'
      : 'Out of stock'

  return (
    <article className="shop-detail">
      <p className="shop-breadcrumb">
        <Link to="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        {currentProduct.categoryName && <><Link to={`/shop?categoryId=${currentProduct.categoryId}`}>{currentProduct.categoryName}</Link><span aria-hidden="true">/</span></>}
        <span>{currentProduct.name}</span>
      </p>

      <div className="shop-detail__layout">
        <div className="shop-detail__gallery">
          <div className="shop-detail__main-image" key={selected?.variantItemId}>
            {image
              ? <img src={image.imageUrl} alt={image.altText || currentProduct.name} />
              : <span className="shop-detail__placeholder" aria-hidden="true">Nifty</span>}
          </div>
          {images.length > 1 && (
            <div className="shop-detail__thumbs" aria-label="Product images">
              {images.map((item) => (
                <button
                  type="button"
                  className="shop-detail__thumb"
                  key={item.id}
                  aria-label={item.altText || `Show image ${item.displayOrder + 1}`}
                  aria-pressed={image?.id === item.id}
                  onClick={() => setImageId(item.id)}
                >
                  <img src={item.imageUrl} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="shop-detail__info">
          <span className="shop-detail__category">{currentProduct.categoryName || currentProduct.type?.toLowerCase()}</span>
          <h1>{currentProduct.name}</h1>
          <span className="shop-detail__type">{currentProduct.type?.toLowerCase()}</span>
          {summaryState.error
            ? <p className="shop-muted">Reviews are unavailable right now.</p>
            : summaryState.data?.reviewCount > 0
              ? <a className="shop-rating-link" href="#customer-reviews">
                  <Rating value={summaryState.data.averageRating} count={summaryState.data.reviewCount} />
                </a>
              : <span className="shop-muted">No reviews yet</span>}
          <div className="shop-detail__variant-summary">
            <div className="shop-detail__price">
              {selected
                ? <>
                    <strong>{money(selected.currentPrice)}</strong>
                    {onSale && <del>{money(selected.regularPrice)}</del>}
                  </>
                : <strong>Price unavailable</strong>}
            </div>
            {onSale && selected.promotion && (
              <p className="shop-detail__offer">
                {selected.promotion.name} · You save {money(Number(selected.regularPrice) - Number(selected.currentPrice))}
              </p>
            )}
          </div>
          {currentProduct.description && <p className="shop-detail__description">{currentProduct.description}</p>}

          {variants.length > 1 && (
            <fieldset className="shop-detail__variant-list">
              <legend>Choose an option</legend>
              {variants.map((variant) => (
                <label className="shop-detail__variant" key={variant.variantItemId}>
                  <span className="shop-detail__variant-label">
                    <input
                      type="radio"
                      name="product-variant"
                      value={variant.variantItemId}
                      checked={selected?.variantItemId === variant.variantItemId}
                      onChange={() => setSelectedId(variant.variantItemId)}
                    />
                    <span>{variantLabel(variant)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {selected && (
            <p className="shop-detail__stock">
              {stockLabel}
              {selected.additionalDescription && ` · ${selected.additionalDescription}`}
            </p>
          )}

          {details.length > 0 && (
            <dl className="shop-detail__facts">
              {details.map((item) => (
                <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
              ))}
            </dl>
          )}

          <div className="shop-detail__customer-actions">
            {isCustomer
              ? <>
                  <div className="shop-detail__primary-actions">
                    <Button disabled={!selected || selected.stockQuantity < 1} loading={cartBusy} onClick={addSelectedToCart}>
                      {selected?.stockQuantity ? 'Add to cart' : 'Out of stock'}
                    </Button>
                    <button
                      className={`shop-wishlist-button ${isWishlisted ? 'is-active' : ''}`}
                      type="button"
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-pressed={isWishlisted}
                      disabled={wishlistBusy || wishlistState.loading || Boolean(wishlistState.error)}
                      onClick={toggleWishlist}
                    >
                      <HeartIcon filled={isWishlisted} />
                    </button>
                  </div>
                  {cartError && <Alert tone="error">{cartError}</Alert>}
                </>
              : !user && <>
                  <Link className="btn btn--primary" to="/login" state={{ from: '/account/cart' }}>
                    Log in to add to cart
                  </Link>
                  <Link className="btn btn--ghost" to="/login" state={{ from: location.pathname }}>
                    Log in to save this piece
                  </Link>
                </>}
            {wishlistError && <Alert tone="error">{wishlistError}</Alert>}
            {isCustomer && wishlistState.error && <Alert tone="error">{wishlistState.error}</Alert>}
          </div>
        </div>
      </div>

      {currentProduct.details && (
        <section className="shop-detail__description-block">
          <h2>More about this piece</h2>
          <p>{currentProduct.details}</p>
        </section>
      )}

      <section className="shop-reviews" id="customer-reviews" aria-labelledby="reviews-title">
        <div className="shop-reviews__heading">
          <div>
            <span className="shop-kicker">From the community</span>
            <h2 id="reviews-title">Customer reviews</h2>
          </div>
          {summaryState.data?.reviewCount > 0 && (
            <Rating value={summaryState.data.averageRating} count={summaryState.data.reviewCount} />
          )}
        </div>

        {isCustomer && (
          <form className="shop-review-form" onSubmit={submitReview}>
            <div className="shop-review-form__heading">
              <h3>{ownReview ? 'Your review' : 'Share your thoughts'}</h3>
              {ownReview && <span className="badge badge--ok">Your review</span>}
            </div>
            {reviewError && <Alert tone="error">{reviewError}</Alert>}
            {reviewMessage && <Alert tone="success">{reviewMessage}</Alert>}
            {mineState.error && <Alert tone="error">{mineState.error}</Alert>}
            <ReviewRatingInput
              value={reviewForm.rating}
              onChange={(rating) => setReviewForm((form) => ({ ...form, rating }))}
            />
            <Field label="Title" optional maxLength={200} value={reviewForm.title}
              onChange={(event) => setReviewForm((form) => ({ ...form, title: event.target.value }))} />
            <Field label="Your review" optional as="textarea" maxLength={10000} value={reviewForm.text}
              onChange={(event) => setReviewForm((form) => ({ ...form, text: event.target.value }))}
              hint={`${reviewForm.text.length} / 10000`} />
            <label className="shop-select">
              <span>Would you recommend this product?</span>
              <select value={reviewForm.recommended} onChange={(event) => setReviewForm((form) => ({ ...form, recommended: event.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <div className="shop-review-form__actions">
              <Button type="submit" loading={reviewBusy || mineState.loading}>
                {ownReview ? 'Update review' : 'Submit review'}
              </Button>
              {ownReview && (
                confirmReviewDelete
                  ? <>
                      <Button type="button" variant="danger" loading={reviewBusy} onClick={deleteReview}>Confirm delete</Button>
                      <Button type="button" variant="ghost" small onClick={() => setConfirmReviewDelete(false)}>Keep review</Button>
                    </>
                  : <Button type="button" variant="ghost" small onClick={() => setConfirmReviewDelete(true)}>Delete review</Button>
              )}
            </div>
          </form>
        )}
        {!user && (
          <p className="shop-reviews__signin">
            <Link to="/login" state={{ from: location.pathname }}>Log in</Link> to share your review.
          </p>
        )}
        {user && !isCustomer && <p className="shop-muted">Customer accounts can submit product reviews.</p>}

        {reviewsState.error && <Alert tone="error">{reviewsState.error}</Alert>}
        {!reviewsState.error && !reviewsState.loading && reviewList.items.length === 0 && (
          <div className="empty"><strong>No reviews yet</strong>Be the first to share what you think.</div>
        )}
        <div className="shop-review-list" aria-busy={reviewsState.loading}>
          {reviewList.items.map((review) => (
            <article className="shop-review" key={review.id}>
              <header>
                <strong>{review.customerName}</strong>
                <Rating value={review.rating} />
                {review.recommended != null && (
                  <span className={`badge ${review.recommended ? 'badge--ok' : 'badge--off'}`}>
                    {review.recommended ? 'Recommends' : 'Does not recommend'}
                  </span>
                )}
              </header>
              {review.title && <h3>{review.title}</h3>}
              {review.text && <p>{review.text}</p>}
            </article>
          ))}
        </div>
        <Pager page={reviewList.page} totalPages={reviewList.totalPages} onPage={setReviewPage} />
      </section>
      <p><Link className="btn btn--ghost btn--small" to="/shop">Continue browsing</Link></p>
    </article>
  )
}
