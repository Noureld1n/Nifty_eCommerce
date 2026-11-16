import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogApi } from '../../api/catalogApi'
import { wishlistApi } from '../../api/customerCommerceApi'
import { useAuth } from '../../auth/useAuth'
import { Alert, Button, Field, Pager } from '../../components/ui'
import HeartIcon from '../../components/HeartIcon'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { normalizePage } from '../../lib/format'
import './ShopPage.css'

const TYPES = [
  { value: '', label: 'All product types' },
  { value: 'CLOTHING', label: 'Clothing' },
  { value: 'ACCESSORY', label: 'Accessories' },
  { value: 'SKINCARE', label: 'Skincare' },
]

function categoryOptions(categories) {
  const children = new Map()
  for (const category of categories) {
    const parentId = category.parentCategoryId ?? null
    children.set(parentId, [...(children.get(parentId) ?? []), category])
  }
  const ordered = []
  function visit(parentId, depth) {
    for (const category of children.get(parentId) ?? []) {
      ordered.push({ ...category, depth })
      visit(category.id, depth + 1)
    }
  }
  visit(null, 0)
  return ordered
}

function productImage(product) {
  const variants = product.variants ?? []
  const preferred = variants.find((variant) => variant.defaultVariant) ?? variants[0]
  const images = preferred?.images ?? []
  return images.find((image) => image.main) ?? images[0] ?? null
}

function priceFor(product) {
  const variants = (product.variants ?? []).filter((variant) => variant.active)
  return variants.reduce((lowest, variant) => {
    if (!lowest || Number(variant.currentPrice) < Number(lowest.currentPrice)) return variant
    return lowest
  }, null)
}

function money(value) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))
}

function OfferCards({ promotions, error, loading }) {
  return (
    <section className="shop-offers" id="offers" aria-labelledby="offers-title">
      <div className="shop-offers__heading">
        <div>
          <span className="shop-kicker">A little something extra</span>
          <h2 id="offers-title">Current offers</h2>
        </div>
        <span className="shop-offers__spark" aria-hidden="true">✳</span>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {!error && loading && <p className="shop-muted">Finding current offers…</p>}
      {!error && !loading && promotions.length === 0 && (
        <p className="shop-muted">No active offers right now. Check back soon.</p>
      )}
      {promotions.length > 0 && (
        <div className="shop-offers__grid">
          {promotions.slice(0, 3).map((promotion) => (
            <article className="shop-offer" key={promotion.id}>
              <span className="shop-offer__tag">
                {promotion.discountType === 'PERCENTAGE'
                  ? `${Number(promotion.discountValue)}% off`
                  : `${money(promotion.discountValue)} off`}
              </span>
              <h3>{promotion.name}</h3>
              {promotion.description && <p>{promotion.description}</p>}
              <span className="shop-offer__scope">
                {promotion.productIds?.length || promotion.categoryIds?.length
                  ? 'Selected products'
                  : 'Across the store'}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ProductCard({ product, isCustomer, isWishlisted, wishlistBusy, onToggleWishlist }) {
  const image = productImage(product)
  const variant = priceFor(product)
  const onSale = variant && Number(variant.currentPrice) < Number(variant.regularPrice)
  return (
    <article className="shop-card">
      <div className="shop-card__visual">
        <Link to={`/shop/products/${product.id}`} className="shop-card__image" aria-label={`View ${product.name}`}>
          {image
            ? <img src={image.imageUrl} alt={image.altText || product.name} loading="lazy" />
            : <span className="shop-card__placeholder" aria-hidden="true"><span>Nifty</span></span>}
          {onSale && <span className="shop-card__sale">Offer</span>}
        </Link>
        {isCustomer && (
          <button
            className={`shop-card__wishlist ${isWishlisted ? 'is-active' : ''}`}
            type="button"
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
            disabled={wishlistBusy}
            onClick={() => onToggleWishlist(product)}
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        )}
      </div>
      <div className="shop-card__body">
        <div className="shop-card__meta">
          <span>{product.categoryName || product.type?.toLowerCase()}</span>
          {variant?.stockQuantity > 0 && variant.stockQuantity <= 5 && (
            <span className="shop-card__limited">Only a few left</span>
          )}
        </div>
        <h3><Link to={`/shop/products/${product.id}`}>{product.name}</Link></h3>
        {product.description && <p className="shop-card__description">{product.description}</p>}
        <div className="shop-card__price">
          {variant
            ? <>
                <strong>{money(variant.currentPrice)}</strong>
                {onSale && <del>{money(variant.regularPrice)}</del>}
              </>
            : <span className="shop-muted">Price unavailable</span>}
        </div>
      </div>
    </article>
  )
}

export default function ShopPage() {
  useTitle('Shop')
  const { user } = useAuth()
  const isCustomer = user?.role === 'ROLE_CUSTOMER'
  const [searchParams, setSearchParams] = useSearchParams()
  const [categoryId, setCategoryId] = useState(() => searchParams.get('categoryId') ?? '')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const productsFetcher = useCallback(
    () => catalogApi.products({ categoryId, type, page, size: 12 }),
    [categoryId, type, page],
  )
  const categoriesFetcher = useCallback(() => catalogApi.categories(), [])
  const promotionsFetcher = useCallback(() => catalogApi.promotions(), [])
  const wishlistFetcher = useCallback(() => isCustomer ? wishlistApi.list() : Promise.resolve([]), [isCustomer])
  const productsState = useFetch(productsFetcher)
  const categoriesState = useFetch(categoriesFetcher)
  const promotionsState = useFetch(promotionsFetcher)
  const wishlistState = useFetch(wishlistFetcher)
  const [wishlistBusyId, setWishlistBusyId] = useState(null)
  const [wishlistError, setWishlistError] = useState('')
  const [wishlistOverrides, setWishlistOverrides] = useState({})
  const products = normalizePage(productsState.data)
  const categories = useMemo(
    () => Array.isArray(categoriesState.data) ? categoriesState.data : [],
    [categoriesState.data],
  )
  const promotions = normalizePage(promotionsState.data).items
  const wishlistedProductIds = useMemo(
    () => new Set((Array.isArray(wishlistState.data) ? wishlistState.data : []).map((item) => String(item.productId))),
    [wishlistState.data],
  )
  useEffect(() => {
    setWishlistOverrides({})
  }, [wishlistState.data])
  const orderedCategories = useMemo(() => categoryOptions(categories), [categories])
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query
      ? products.items.filter((product) => `${product.name} ${product.description ?? ''} ${product.categoryName ?? ''}`.toLowerCase().includes(query))
      : products.items
  }, [products.items, search])

  useEffect(() => {
    const urlCategoryId = searchParams.get('categoryId') ?? ''
    setCategoryId((current) => current === urlCategoryId ? current : urlCategoryId)
    setPage(0)
  }, [searchParams])

  function updateCategory(value) {
    setCategoryId(value)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set('categoryId', value)
      else next.delete('categoryId')
      return next
    })
    setPage(0)
  }

  function updateType(value) {
    setType(value)
    setPage(0)
  }

  async function toggleWishlist(product) {
    const productId = String(product.id)
    const isWishlisted = wishlistOverrides[productId] ?? wishlistedProductIds.has(productId)
    setWishlistBusyId(productId)
    setWishlistError('')
    try {
      if (isWishlisted) await wishlistApi.remove(product.id)
      else await wishlistApi.add(product.id)
      setWishlistOverrides((overrides) => ({ ...overrides, [productId]: !isWishlisted }))
    } catch (requestError) {
      setWishlistError(requestError.message)
    } finally {
      setWishlistBusyId(null)
    }
  }

  return (
    <>
      <section className="shop-hero">
        <div className="shop-hero__copy">
          <span className="shop-kicker">Welcome to Nifty</span>
          <h1>Find your new<br /><em>everyday favorite.</em></h1>
          <p>Thoughtful pieces for your wardrobe, your routine, and everything in between.</p>
          <a className="btn btn--primary" href="#collection">Explore the collection</a>
        </div>
        <div className="shop-hero__art" aria-hidden="true">
          <span className="shop-hero__orb shop-hero__orb--leaf" />
          <span className="shop-hero__orb shop-hero__orb--sky" />
          <span className="shop-hero__art-mark"><span>N</span></span>
          <span className="shop-hero__caption">A brighter kind<br />of everyday</span>
        </div>
      </section>

      <OfferCards promotions={promotions} error={promotionsState.error} loading={promotionsState.loading} />

      <section className="shop-collection" id="collection" aria-labelledby="collection-title">
        <div className="shop-collection__heading">
          <div>
            <span className="shop-kicker">Made for your rhythm</span>
            <h2 id="collection-title">Explore the collection</h2>
          </div>
          <span className="shop-collection__count">
            {products.total} {products.total === 1 ? 'piece' : 'pieces'}
          </span>
        </div>

        <div className="shop-toolbar">
          <label className="shop-select">
            <span>Category</span>
            <select value={categoryId} onChange={(event) => updateCategory(event.target.value)}>
              <option value="">All categories</option>
              {orderedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {'— '.repeat(category.depth)}{category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="shop-select">
            <span>Type</span>
            <select value={type} onChange={(event) => updateType(event.target.value)}>
              {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Field label="Search this page" type="search" placeholder="Product or category" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        {categoriesState.error && <Alert tone="error">Categories could not be loaded: {categoriesState.error}</Alert>}
        {productsState.error && (
          <Alert tone="error" action={<Button variant="ghost" small onClick={productsState.reload}>Try again</Button>}>
            {productsState.error}
          </Alert>
        )}
        {isCustomer && wishlistState.error && (
          <Alert tone="error" action={<Button variant="ghost" small onClick={wishlistState.reload}>Try again</Button>}>
            Wishlist status could not be loaded: {wishlistState.error}
          </Alert>
        )}
        {wishlistError && <Alert tone="error">{wishlistError}</Alert>}
        <div className="shop-grid" aria-busy={productsState.loading}>
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isCustomer={isCustomer}
              isWishlisted={wishlistOverrides[String(product.id)] ?? wishlistedProductIds.has(String(product.id))}
              wishlistBusy={wishlistBusyId === String(product.id) || (wishlistState.loading && !wishlistState.data) || Boolean(wishlistState.error)}
              onToggleWishlist={toggleWishlist}
            />
          ))}
        </div>
        {!productsState.loading && !productsState.error && visibleProducts.length === 0 && (
          <div className="empty">
            <strong>{search ? 'No matching pieces' : 'Nothing here just yet'}</strong>
            {search ? 'Try a different search.' : 'Try another category or check back soon.'}
          </div>
        )}
        <Pager page={products.page} totalPages={products.totalPages} onPage={setPage} />
      </section>
    </>
  )
}
