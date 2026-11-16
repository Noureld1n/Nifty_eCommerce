import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminCatalogApi } from '../../api/adminCommerceApi'
import { Alert, Button, Field, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { normalizePage } from '../../lib/format'
import './AdminCommerce.css'

const TYPES = ['CLOTHING', 'ACCESSORY', 'SKINCARE']
const EMPTY_CATEGORY = { name: '', parentCategoryId: '' }
const EMPTY_PRODUCT = {
  type: 'CLOTHING', categoryId: '', name: '', basePrice: '', description: '', details: '',
  clothingType: '', accessoryType: '', skincareType: '', material: '', skinType: '',
  size: '', color: '', volumeMl: '', sizeLabel: '', formulation: '', priceAdjustment: '0',
  additionalDescription: '',
}
const EMPTY_IMAGE = { imageUrl: '', altText: '', displayOrder: '0', main: false }
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))

function categoryName(id, categories) {
  return categories.find((category) => String(category.id) === String(id))?.name ?? 'No parent'
}

function variantLabel(variant) {
  return [variant.size, variant.color, variant.material, variant.sizeLabel,
    variant.volumeMl ? `${variant.volumeMl} ml` : '', variant.formulation,
    variant.additionalDescription].filter(Boolean).join(' · ') || 'Standard'
}

function productBody(form) {
  return {
    type: form.type,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    name: form.name.trim(),
    basePrice: Number(form.basePrice),
    description: form.description.trim() || null,
    details: form.details.trim() || null,
    clothingType: form.type === 'CLOTHING' ? form.clothingType.trim() : null,
    accessoryType: form.type === 'ACCESSORY' ? form.accessoryType.trim() : null,
    skincareType: form.type === 'SKINCARE' ? form.skincareType.trim() : null,
    material: form.material.trim() || null,
    skinType: form.type === 'SKINCARE' ? form.skinType.trim() || null : null,
  }
}

function firstVariant(form) {
  return {
    size: form.type === 'CLOTHING' ? form.size.trim() || null : null,
    color: form.type !== 'SKINCARE' ? form.color.trim() || null : null,
    material: form.type === 'ACCESSORY' ? form.material.trim() || null : null,
    volumeMl: form.type === 'SKINCARE' && form.volumeMl ? Number(form.volumeMl) : null,
    sizeLabel: form.type === 'SKINCARE' ? form.sizeLabel.trim() || null : null,
    formulation: form.type === 'SKINCARE' ? form.formulation.trim() || null : null,
    priceAdjustment: Number(form.priceAdjustment || 0),
    additionalDescription: form.additionalDescription.trim() || null,
    makeDefault: true,
  }
}

export default function AdminCatalogPage() {
  useTitle('Catalog management')
  const categoryFetcher = useCallback(() => adminCatalogApi.categories(), [])
  const [page, setPage] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const productFetcher = useCallback(() => adminCatalogApi.products({
    categoryId: categoryFilter, type: typeFilter, active: activeFilter, page, size: 12,
  }), [categoryFilter, typeFilter, activeFilter, page])
  const categoryState = useFetch(categoryFetcher)
  const productState = useFetch(productFetcher)
  const categories = useMemo(() => Array.isArray(categoryState.data) ? categoryState.data : [], [categoryState.data])
  const productsPage = normalizePage(productState.data)
  const products = productsPage.items

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY)
  const [editingCategory, setEditingCategory] = useState(null)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [variantForm, setVariantForm] = useState(null)
  const [imageForm, setImageForm] = useState(EMPTY_IMAGE)
  const [editingImageId, setEditingImageId] = useState(null)
  const [selectedImageVariant, setSelectedImageVariant] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedProduct = products.find((product) => String(product.id) === String(selectedProductId))
    ?? null
  const selectedVariant = selectedProduct?.variants?.find((variant) => String(variant.variantItemId) === String(selectedImageVariant))
    ?? selectedProduct?.variants?.[0]

  useEffect(() => {
    if (selectedProductId != null) {
      document.getElementById('variants-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedProductId])

  function notifySuccess(text) {
    setError('')
    setMessage(text)
  }

  function fail(requestError) {
    setMessage('')
    setError(requestError.fieldErrors
      ? Object.values(requestError.fieldErrors).join(' ')
      : requestError.message)
  }

  async function submitCategory(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const body = {
        name: categoryForm.name.trim(),
        parentCategoryId: categoryForm.parentCategoryId ? Number(categoryForm.parentCategoryId) : null,
      }
      if (editingCategory) await adminCatalogApi.updateCategory(editingCategory, body)
      else await adminCatalogApi.createCategory(body)
      setCategoryForm(EMPTY_CATEGORY)
      setEditingCategory(null)
      categoryState.reload()
      notifySuccess(editingCategory ? 'Category updated.' : 'Category created.')
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusy(false)
    }
  }

  async function toggleCategory(category) {
    setBusyId(`category-${category.id}`)
    try {
      await adminCatalogApi.setCategoryActive(category.id, !category.active)
      categoryState.reload()
      notifySuccess(`Category ${category.active ? 'deactivated' : 'activated'}.`)
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusyId(null)
    }
  }

  async function submitProduct(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (editingProduct) {
        await adminCatalogApi.updateProduct(editingProduct, productBody(productForm))
      } else {
        await adminCatalogApi.createProduct({ ...productBody(productForm), variants: [firstVariant(productForm)] })
      }
      const wasEditing = Boolean(editingProduct)
      setProductForm(EMPTY_PRODUCT)
      setEditingProduct(null)
      productState.reload()
      notifySuccess(wasEditing ? 'Product updated.' : 'Product created with its first variant. Use “Manage variants” in the product list to add more.')
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusy(false)
    }
  }

  function editProduct(product) {
    const typeDetails = product.typeDetails ?? {}
    const variant = product.variants?.find((item) => item.defaultVariant) ?? product.variants?.[0] ?? {}
    setEditingProduct(product.id)
    setSelectedProductId(product.id)
    setProductForm({
      ...EMPTY_PRODUCT,
      type: product.type,
      categoryId: product.categoryId ?? '',
      name: product.name ?? '',
      basePrice: product.basePrice ?? '',
      description: product.description ?? '',
      details: product.details ?? '',
      clothingType: typeDetails.clothingType ?? '',
      accessoryType: typeDetails.accessoryType ?? '',
      skincareType: typeDetails.skincareType ?? '',
      material: typeDetails.material ?? variant.material ?? '',
      skinType: typeDetails.skinType ?? '',
      size: variant.size ?? '',
      color: variant.color ?? '',
      volumeMl: variant.volumeMl ?? '',
      sizeLabel: variant.sizeLabel ?? '',
      formulation: variant.formulation ?? '',
      priceAdjustment: variant.priceAdjustment ?? '0',
      additionalDescription: variant.additionalDescription ?? '',
    })
    setError('')
    setMessage('')
  }

  async function toggleProduct(product) {
    setBusyId(`product-${product.id}`)
    try {
      await adminCatalogApi.setProductActive(product.id, !product.active)
      productState.reload()
      notifySuccess(`Product ${product.active ? 'deactivated' : 'activated'}.`)
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusyId(null)
    }
  }

  async function saveVariant(event) {
    event.preventDefault()
    if (!selectedProduct || !variantForm) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const body = {
        size: variantForm.size.trim() || null,
        color: variantForm.color.trim() || null,
        material: variantForm.material.trim() || null,
        volumeMl: variantForm.volumeMl ? Number(variantForm.volumeMl) : null,
        sizeLabel: variantForm.sizeLabel.trim() || null,
        formulation: variantForm.formulation.trim() || null,
        priceAdjustment: Number(variantForm.priceAdjustment || 0),
        additionalDescription: variantForm.additionalDescription.trim() || null,
        makeDefault: Boolean(variantForm.makeDefault),
      }
      if (variantForm.variantItemId) {
        await adminCatalogApi.updateVariant(selectedProduct.id, variantForm.variantItemId, body)
        notifySuccess('Variant updated.')
      } else {
        await adminCatalogApi.addVariant(selectedProduct.id, body)
        notifySuccess('Variant added.')
      }
      setVariantForm(null)
      productState.reload()
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusy(false)
    }
  }

  async function toggleVariant(variant) {
    setBusyId(`variant-${variant.variantItemId}`)
    try {
      await adminCatalogApi.setVariantActive(selectedProduct.id, variant.variantItemId, !variant.active)
      productState.reload()
      notifySuccess(`Variant ${variant.active ? 'deactivated' : 'activated'}.`)
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusyId(null)
    }
  }

  async function setDefaultVariant(variant) {
    setBusyId(`variant-${variant.variantItemId}`)
    try {
      await adminCatalogApi.setDefaultVariant(selectedProduct.id, variant.variantItemId)
      productState.reload()
      notifySuccess('Default variant updated.')
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusyId(null)
    }
  }

  async function submitImage(event) {
    event.preventDefault()
    if (!selectedProduct || !selectedVariant) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const body = {
        ...imageForm,
        imageUrl: imageForm.imageUrl.trim(),
        altText: imageForm.altText.trim() || null,
        displayOrder: Number(imageForm.displayOrder || 0),
      }
      if (editingImageId) {
        await adminCatalogApi.updateImage(selectedProduct.id, selectedVariant.variantItemId, editingImageId, body)
      } else {
        await adminCatalogApi.addImage(selectedProduct.id, selectedVariant.variantItemId, body)
      }
      const wasEditing = Boolean(editingImageId)
      setEditingImageId(null)
      setImageForm(EMPTY_IMAGE)
      productState.reload()
      notifySuccess(wasEditing ? 'Image updated.' : 'Image added.')
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusy(false)
    }
  }

  async function removeImage(variantId, imageId) {
    setBusyId(`image-${imageId}`)
    try {
      await adminCatalogApi.removeImage(selectedProduct.id, variantId, imageId)
      productState.reload()
      notifySuccess('Image removed.')
    } catch (requestError) {
      fail(requestError)
    } finally {
      setBusyId(null)
    }
  }

  const formField = (label, key, props = {}) => (
    <Field label={label} value={productForm[key]} onChange={(event) => setProductForm((form) => ({ ...form, [key]: event.target.value }))} {...props} />
  )

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Catalog management</h1><p>Manage categories, products, variants, and catalog images.</p></div></div>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {categoryState.error && <Alert tone="error">Categories could not be loaded: {categoryState.error}</Alert>}
      {productState.error && <Alert tone="error">Products could not be loaded: {productState.error}</Alert>}

      <div className="admin-catalog-layout">
        <section className="admin-panel" aria-labelledby="admin-categories-title">
          <div className="admin-panel__head"><h2 id="admin-categories-title">Categories</h2></div>
          <form className="admin-form" onSubmit={submitCategory}>
            <Field label="Category name" required maxLength={100} value={categoryForm.name}
              onChange={(event) => setCategoryForm((form) => ({ ...form, name: event.target.value }))} />
            <label className="field"><span>Parent category</span>
              <select value={categoryForm.parentCategoryId} onChange={(event) => setCategoryForm((form) => ({ ...form, parentCategoryId: event.target.value }))}>
                <option value="">No parent</option>
                {categories.filter((category) => category.id !== editingCategory).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <div className="admin-form__actions">
              <Button type="submit" small loading={busy}>{editingCategory ? 'Save category' : 'Add category'}</Button>
              {editingCategory && <Button type="button" small variant="ghost" onClick={() => { setEditingCategory(null); setCategoryForm(EMPTY_CATEGORY) }}>Cancel</Button>}
            </div>
          </form>
          <div className="admin-categories" aria-busy={categoryState.loading}>
            {categories.map((category) => (
              <article className="admin-category" key={category.id}>
                <div><strong>{category.name}</strong><small>{category.parentCategoryId ? `Under ${categoryName(category.parentCategoryId, categories)}` : 'Top level'} · {category.active ? 'Active' : 'Inactive'}</small></div>
                <div className="admin-table__actions">
                  <Button small variant="quiet" onClick={() => {
                    setEditingCategory(category.id)
                    setCategoryForm({ name: category.name, parentCategoryId: category.parentCategoryId ?? '' })
                  }}>Edit</Button>
                  <Button small variant={category.active ? 'ghost' : 'primary'} loading={busyId === `category-${category.id}`} onClick={() => toggleCategory(category)}>
                    {category.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="admin-products-title">
          <div className="admin-panel__head">
            <h2 id="admin-products-title">Products</h2>
            <Button small onClick={() => {
              setEditingProduct(null)
              setSelectedProductId(null)
              setProductForm(EMPTY_PRODUCT)
              document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>Add product</Button>
          </div>
          <div className="toolbar">
            <label className="admin-select"><span>Category</span>
              <select value={categoryFilter} onChange={(event) => { setPage(0); setCategoryFilter(event.target.value) }}>
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="admin-select"><span>Type</span>
              <select value={typeFilter} onChange={(event) => { setPage(0); setTypeFilter(event.target.value) }}>
                <option value="">All types</option>
                {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="admin-select"><span>Status</span>
              <select value={activeFilter} onChange={(event) => { setPage(0); setActiveFilter(event.target.value) }}>
                <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
              </select>
            </label>
          </div>

          <div className="admin-product-rows" aria-busy={productState.loading}>
            {products.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <div className="admin-product-row__main">
                  <button className="admin-product-title" type="button" onClick={() => { editProduct(product); setSelectedImageVariant('') }}>{product.name}</button>
                  <span className="admin-product-row__meta">{product.type} · {product.categoryName || 'Uncategorized'} · {money(product.basePrice)} · {product.variants?.length ?? 0} variants</span>
                </div>
                <div className="admin-product-row__controls">
                  <span className={`badge ${product.active ? 'badge--ok' : 'badge--off'}`}>{product.active ? 'Active' : 'Inactive'}</span>
                  <Button small variant="ghost" onClick={() => editProduct(product)}>Edit</Button>
                  <Button small variant="ghost" onClick={() => {
                    setSelectedProductId(product.id)
                    setSelectedImageVariant('')
                    setVariantForm(null)
                    setEditingImageId(null)
                  }}>Manage variants</Button>
                  <Button small variant={product.active ? 'ghost' : 'primary'} loading={busyId === `product-${product.id}`} onClick={() => toggleProduct(product)}>
                    {product.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!productState.loading && products.length === 0 && <div className="empty"><strong>No products found</strong>Create a product or change the filters.</div>}
          <Pager page={productsPage.page} totalPages={productsPage.totalPages} onPage={setPage} />

          <section className="section" id="product-form" aria-labelledby="product-form-title">
            <div className="section__intro"><h2 id="product-form-title">{editingProduct ? 'Edit product' : 'Create product'}</h2><p>Product type cannot be changed after creation. Prices are entered in EGP.</p></div>
            <form className="section__body admin-form" onSubmit={submitProduct}>
              <div className="admin-form__row">
                <label className="field"><span>Product type</span>
                  <select disabled={Boolean(editingProduct)} value={productForm.type} onChange={(event) => setProductForm({ ...EMPTY_PRODUCT, type: event.target.value })}>
                    {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="field"><span>Category</span>
                  <select value={productForm.categoryId} onChange={(event) => setProductForm((form) => ({ ...form, categoryId: event.target.value }))}>
                    <option value="">Uncategorized</option>
                    {categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
              </div>
              {formField('Product name', 'name', { required: true, maxLength: 200 })}
              {editingProduct
                ? formField('Base price (EGP)', 'basePrice', { required: true, type: 'number', min: '0', step: '0.01' })
                : <div className="admin-form__row">
                    {formField('Base price (EGP)', 'basePrice', { required: true, type: 'number', min: '0', step: '0.01' })}
                    {formField('First variant price adjustment', 'priceAdjustment', { type: 'number', step: '0.01' })}
                  </div>}
              {productForm.type === 'CLOTHING' && <>
                <div className="admin-form__row">{formField('Clothing type', 'clothingType', { required: true, maxLength: 80 })}{formField('Material', 'material', { maxLength: 120 })}</div>
                {!editingProduct && <div className="admin-form__row">{formField('First variant size', 'size', { required: true, maxLength: 30 })}{formField('First variant color', 'color', { required: true, maxLength: 60 })}</div>}
              </>}
              {productForm.type === 'ACCESSORY' && <>
                <div className="admin-form__row">{formField('Accessory type', 'accessoryType', { required: true, maxLength: 80 })}{formField('Material', 'material', { maxLength: 120 })}</div>
                {!editingProduct && formField('First variant color (or enter material above)', 'color', { maxLength: 60 })}
              </>}
              {productForm.type === 'SKINCARE' && <>
                <div className="admin-form__row">{formField('Skincare type', 'skincareType', { required: true, maxLength: 80 })}{formField('Skin type', 'skinType', { maxLength: 100 })}</div>
                {!editingProduct && <>
                  <div className="admin-form__row">{formField('First variant volume (ml)', 'volumeMl', { type: 'number', min: '0.01', step: '0.01' })}{formField('First variant size label', 'sizeLabel', { maxLength: 40 })}</div>
                  {formField('First variant formulation', 'formulation', { maxLength: 120 })}
                </>}
              </>}
              {!editingProduct && formField('First variant description', 'additionalDescription', { maxLength: 1000, optional: true })}
              {formField('Short description', 'description', { maxLength: 1000, optional: true })}
              {formField('Details', 'details', { as: 'textarea', optional: true })}
              <div className="admin-form__actions">
                <Button type="submit" loading={busy}>{editingProduct ? 'Save product' : 'Create product'}</Button>
                {editingProduct && <Button type="button" variant="ghost" onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setVariantForm(null) }}>Cancel edit</Button>}
              </div>
            </form>
          </section>

          {selectedProduct && (
            <section className="section" aria-labelledby="variants-title">
              <div className="section__intro"><h2 id="variants-title">Variants & images</h2><p>Manage options and images for {selectedProduct.name}.</p></div>
              <div className="section__body admin-panel">
                {selectedProduct.variants?.map((variant) => (
                  <article className="admin-detail" key={variant.variantItemId}>
                    <div className="admin-panel__head">
                      <div><strong>{variantLabel(variant)}</strong><small className="admin-muted">ID {variant.variantItemId} · {variant.stockQuantity} in stock · {money(variant.regularPrice)}</small></div>
                      <span className={`badge ${variant.active ? 'badge--ok' : 'badge--off'}`}>{variant.active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="admin-inline-actions">
                      {!variant.defaultVariant && <Button small variant="ghost" onClick={() => setDefaultVariant(variant)}>Make default</Button>}
                      <Button small variant="ghost" onClick={() => {
                        setVariantForm({
                          variantItemId: variant.variantItemId,
                          size: variant.size ?? '', color: variant.color ?? '', material: variant.material ?? '',
                          volumeMl: variant.volumeMl ?? '', sizeLabel: variant.sizeLabel ?? '',
                          formulation: variant.formulation ?? '', priceAdjustment: variant.priceAdjustment ?? 0,
                          additionalDescription: variant.additionalDescription ?? '',
                          makeDefault: variant.defaultVariant,
                        })
                      }}>Edit variant</Button>
                      <Button small variant={variant.active ? 'ghost' : 'primary'} loading={busyId === `variant-${variant.variantItemId}`} onClick={() => toggleVariant(variant)}>
                        {variant.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button small variant="quiet" onClick={() => setSelectedImageVariant(String(variant.variantItemId))}>Manage images</Button>
                    </div>
                    <div className="admin-image-list">
                      {(variant.images ?? []).map((image) => (
                        <div className="admin-image-card" key={image.id}>
                          <img src={image.imageUrl} alt={image.altText || ''} />
                          <small>{image.main ? 'Main image' : `Order ${image.displayOrder}`}</small>
                          <Button small variant="quiet" loading={busyId === `image-${image.id}`} onClick={() => {
                            setSelectedImageVariant(String(variant.variantItemId))
                            removeImage(variant.variantItemId, image.id)
                          }}>Remove</Button>
                          <Button small variant="ghost" onClick={() => {
                            setSelectedImageVariant(String(variant.variantItemId))
                            setEditingImageId(image.id)
                            setImageForm({
                              imageUrl: image.imageUrl,
                              altText: image.altText ?? '',
                              displayOrder: String(image.displayOrder ?? 0),
                              main: image.main,
                            })
                          }}>Edit</Button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}

                {variantForm ? (
                  <form className="admin-form" onSubmit={saveVariant}>
                    <h3>{variantForm.variantItemId ? 'Edit variant' : 'Add variant'}</h3>
                    <div className="admin-form__row">{formVariantField('Size', 'size')}{formVariantField('Color', 'color')}</div>
                    <div className="admin-form__row">{formVariantField('Material', 'material')}{formVariantField('Volume (ml)', 'volumeMl', 'number')}</div>
                    <div className="admin-form__row">{formVariantField('Size label', 'sizeLabel')}{formVariantField('Formulation', 'formulation')}</div>
                    <div className="admin-form__row">
                      <Field label="Price adjustment" type="number" step="0.01" value={variantForm.priceAdjustment}
                        onChange={(event) => setVariantForm((form) => ({ ...form, priceAdjustment: event.target.value }))} />
                      <Field label="Additional description" value={variantForm.additionalDescription}
                        onChange={(event) => setVariantForm((form) => ({ ...form, additionalDescription: event.target.value }))} />
                    </div>
                    <label className="admin-checkbox"><input type="checkbox" checked={variantForm.makeDefault}
                      onChange={(event) => setVariantForm((form) => ({ ...form, makeDefault: event.target.checked }))} /> Make default variant</label>
                    <div className="admin-form__actions"><Button type="submit" loading={busy}>Save variant</Button><Button type="button" variant="ghost" onClick={() => setVariantForm(null)}>Cancel</Button></div>
                  </form>
                ) : <Button small variant="ghost" onClick={() => setVariantForm({ size: '', color: '', material: '', volumeMl: '', sizeLabel: '', formulation: '', priceAdjustment: '0', additionalDescription: '', makeDefault: false })}>Add variant</Button>}

                {selectedImageVariant && selectedVariant && (
                  <form className="admin-form" onSubmit={submitImage}>
                    <h3>{editingImageId ? 'Edit image' : 'Images'} for variant {selectedVariant.variantItemId}</h3>
                    <Field label="Image URL" required maxLength={2048} type="url" value={imageForm.imageUrl}
                      onChange={(event) => setImageForm((form) => ({ ...form, imageUrl: event.target.value }))} />
                    <div className="admin-form__row">
                      <Field label="Alt text" maxLength={255} value={imageForm.altText} onChange={(event) => setImageForm((form) => ({ ...form, altText: event.target.value }))} />
                      <Field label="Display order" type="number" min="0" value={imageForm.displayOrder} onChange={(event) => setImageForm((form) => ({ ...form, displayOrder: event.target.value }))} />
                    </div>
                    <label className="admin-checkbox"><input type="checkbox" checked={imageForm.main}
                      onChange={(event) => setImageForm((form) => ({ ...form, main: event.target.checked }))} /> Set as main image</label>
                    <div className="admin-form__actions">
                      <Button type="submit" loading={busy}>{editingImageId ? 'Save image' : 'Add image'}</Button>
                      {editingImageId && <Button type="button" variant="ghost" onClick={() => { setEditingImageId(null); setImageForm(EMPTY_IMAGE) }}>Cancel edit</Button>}
                      <Button type="button" variant="ghost" onClick={() => { setSelectedImageVariant(''); setEditingImageId(null); setImageForm(EMPTY_IMAGE) }}>Close</Button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}
        </section>
      </div>
    </>
  )

  function formVariantField(label, key, type = 'text') {
    return <Field label={label} type={type} value={variantForm[key] ?? ''}
      onChange={(event) => setVariantForm((form) => ({ ...form, [key]: event.target.value }))} />
  }
}
