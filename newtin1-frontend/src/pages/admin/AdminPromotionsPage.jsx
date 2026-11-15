import { useCallback, useState } from 'react'
import { adminCatalogApi, adminPromotionApi } from '../../api/adminCommerceApi'
import { Alert, Button, Field, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'
import './AdminCommerce.css'

const EMPTY = {
  name: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
  startDate: '', endDate: '', categoryIds: '', productIds: '',
}
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))

function parseIds(value) {
  const values = value.split(',').map((item) => item.trim()).filter(Boolean)
  if (values.some((item) => !/^\d+$/.test(item))) throw new Error('Target IDs must be positive numbers separated by commas.')
  return [...new Set(values.map(Number))]
}

function dateInput(value) {
  return value ? value.slice(0, 16) : ''
}

export default function AdminPromotionsPage() {
  useTitle('Promotions')
  const [page, setPage] = useState(0)
  const fetcher = useCallback(() => adminPromotionApi.list(page, 12), [page])
  const categoryFetcher = useCallback(() => adminCatalogApi.categories(), [])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const categoriesState = useFetch(categoryFetcher)
  const list = normalizePage(data)
  const categories = Array.isArray(categoriesState.data) ? categoriesState.data : []
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function edit(promotion) {
    setEditingId(promotion.id)
    setForm({
      name: promotion.name ?? '',
      description: promotion.description ?? '',
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: dateInput(promotion.startDate),
      endDate: dateInput(promotion.endDate),
      categoryIds: [...(promotion.categoryIds ?? [])].join(', '),
      productIds: [...(promotion.productIds ?? [])].join(', '),
    })
    setError('')
    setMessage('')
  }

  function reset() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startDate: form.startDate.length === 16 ? `${form.startDate}:00` : form.startDate,
        endDate: form.endDate.length === 16 ? `${form.endDate}:00` : form.endDate,
        categoryIds: parseIds(form.categoryIds),
        productIds: parseIds(form.productIds),
      }
      if (editingId) await adminPromotionApi.update(editingId, body)
      else await adminPromotionApi.create(body)
      reset()
      reload()
      setMessage(editingId ? 'Promotion updated.' : 'Promotion created.')
    } catch (requestError) {
      setError(requestError.fieldErrors
        ? Object.values(requestError.fieldErrors).join(' ')
        : requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(promotion) {
    setBusyId(promotion.id)
    setError('')
    setMessage('')
    try {
      await adminPromotionApi.setActive(promotion.id, !promotion.active)
      reload()
      setMessage(`Promotion ${promotion.active ? 'deactivated' : 'activated'}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Promotions</h1><p>Create and manage discounts for products and categories.</p></div></div>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {loadError && <Alert tone="error" action={<Button small variant="ghost" onClick={reload}>Try again</Button>}>{loadError}</Alert>}

      <section className="section" aria-labelledby="promotion-form-title">
        <div className="section__intro"><h2 id="promotion-form-title">{editingId ? 'Edit promotion' : 'Create promotion'}</h2><p>No targets means the discount applies across the store. Category and product IDs are comma-separated.</p></div>
        <form className="section__body admin-form" onSubmit={submit}>
          <Field label="Promotion name" required maxLength={150} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
          <Field label="Description" optional as="textarea" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
          <div className="admin-form__row">
            <label className="field"><span>Discount type</span>
              <select value={form.discountType} onChange={(event) => setForm((value) => ({ ...value, discountType: event.target.value }))}>
                <option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount (EGP)</option>
              </select>
            </label>
            <Field label={form.discountType === 'PERCENTAGE' ? 'Percent off' : 'Amount off (EGP)'} type="number" required min="0.01" step="0.01" value={form.discountValue}
              onChange={(event) => setForm((value) => ({ ...value, discountValue: event.target.value }))} />
          </div>
          <div className="admin-form__row">
            <Field label="Starts" type="datetime-local" required value={form.startDate} onChange={(event) => setForm((value) => ({ ...value, startDate: event.target.value }))} />
            <Field label="Ends" type="datetime-local" required value={form.endDate} onChange={(event) => setForm((value) => ({ ...value, endDate: event.target.value }))} />
          </div>
          <Field label="Category IDs" optional hint={categories.length ? `Available: ${categories.map((category) => `${category.name} (${category.id})`).join(', ')}` : 'Comma-separated IDs'}
            value={form.categoryIds} onChange={(event) => setForm((value) => ({ ...value, categoryIds: event.target.value }))} />
          <Field label="Product IDs" optional hint="Comma-separated product IDs; leave both target fields blank to apply store-wide."
            value={form.productIds} onChange={(event) => setForm((value) => ({ ...value, productIds: event.target.value }))} />
          <div className="admin-form__actions">
            <Button type="submit" loading={busy}>{editingId ? 'Save promotion' : 'Create promotion'}</Button>
            {editingId && <Button type="button" variant="ghost" onClick={reset}>Cancel edit</Button>}
          </div>
        </form>
      </section>

      <section className="section" aria-labelledby="promotions-list-title">
        <div className="section__intro"><h2 id="promotions-list-title">All promotions</h2><p>{list.total} total, newest first.</p></div>
        <div className="section__body admin-panel" aria-busy={loading}>
          {list.items.map((promotion) => (
            <article className="admin-detail" key={promotion.id}>
              <div className="admin-panel__head">
                <div>
                  <strong>{promotion.name}</strong>
                  <small className="admin-muted">{promotion.discountType === 'PERCENTAGE'
                    ? `${promotion.discountValue}% off`
                    : `${money(promotion.discountValue)} off`}
                    {' · '}{promotion.currentlyEffective ? 'Currently effective' : promotion.active ? 'Scheduled / expired' : 'Inactive'}
                  </small>
                </div>
                <span className={`badge ${promotion.currentlyEffective ? 'badge--ok' : promotion.active ? '' : 'badge--off'}`}>
                  {promotion.currentlyEffective ? 'Effective' : promotion.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {promotion.description && <p>{promotion.description}</p>}
              <div className="admin-muted">{formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}</div>
              <div className="admin-muted">Categories: {promotion.categoryIds?.join(', ') || 'All'} · Products: {promotion.productIds?.join(', ') || 'All'}</div>
              <div className="admin-inline-actions">
                <Button small variant="ghost" onClick={() => edit(promotion)}>Edit</Button>
                <Button small variant={promotion.active ? 'ghost' : 'primary'} loading={busyId === promotion.id} onClick={() => toggle(promotion)}>
                  {promotion.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </article>
          ))}
          {!loading && !list.items.length && <div className="empty"><strong>No promotions</strong>Create a promotion above to make an offer available.</div>}
          <Pager page={list.page} totalPages={list.totalPages} onPage={setPage} />
        </div>
      </section>
    </>
  )
}
