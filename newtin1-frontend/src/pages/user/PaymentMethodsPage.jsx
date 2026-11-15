import { useCallback, useId, useState } from 'react'
import { userApi } from '../../api/authApi'
import { Alert, Button, Field } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import './PaymentMethodsPage.css'

const PROVIDERS = ['PAYMOB', 'STRIPE', 'PAYPAL']
const BRANDS = ['VISA', 'MASTERCARD', 'MEEZA', 'AMEX', 'OTHER']
const EMPTY = { provider: 'PAYMOB', providerToken: '', cardBrand: 'VISA', last4: '', expiryMonth: '', expiryYear: '', makeDefault: false }

const isDefault = (m) => Boolean(m.isDefault ?? m.default ?? m.defaultMethod)
const isExpired = (m) => {
  if (typeof m.expired === 'boolean') return m.expired
  const now = new Date()
  return m.expiryYear < now.getFullYear() || (m.expiryYear === now.getFullYear() && m.expiryMonth < now.getMonth() + 1)
}

function Select({ label, value, onChange, options }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        <select id={id} value={value} onChange={onChange}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
      </div>
    </div>
  )
}

export default function PaymentMethodsPage() {
  useTitle('Payment methods')
  const fetcher = useCallback(() => userApi.listPaymentMethods(), [])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const methods = Array.isArray(data) ? data : data?.content ?? []

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [actionError, setActionError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function check() {
    const e = {}
    const year = new Date().getFullYear()
    if (!form.providerToken.trim()) e.providerToken = 'Required'
    if (!/^\d{4}$/.test(form.last4)) e.last4 = 'Exactly 4 digits'
    const m = Number(form.expiryMonth)
    if (!Number.isInteger(m) || m < 1 || m > 12) e.expiryMonth = '1 to 12'
    const y = Number(form.expiryYear)
    if (!Number.isInteger(y) || y < year || y > year + 30) e.expiryYear = `${year} or later`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onAdd(ev) {
    ev.preventDefault()
    setFormError('')
    if (!check()) return
    setBusy(true)
    try {
      await userApi.addPaymentMethod({
        ...form,
        providerToken: form.providerToken.trim(),
        expiryMonth: Number(form.expiryMonth),
        expiryYear: Number(form.expiryYear),
      })
      setForm(EMPTY)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function run(id, fn) {
    setActionError('')
    setRowBusy(id)
    try { await fn(id); setConfirmId(null); reload() } catch (err) { setActionError(err.message) } finally { setRowBusy(null) }
  }

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Payment methods</h1><p>We only keep a secure token from the payment provider, never your full card number.</p></div></div>

      <section className="section" aria-labelledby="pm-h">
        <div className="section__intro"><h2 id="pm-h">Saved methods</h2><p>The default one is used first at checkout.</p></div>
        <div>
          {loadError && <Alert tone="error">{loadError}</Alert>}
          {actionError && <Alert tone="error">{actionError}</Alert>}
          {!loadError && !loading && methods.length === 0 && (
            <div className="empty"><strong>No payment methods yet</strong>Add one below.</div>
          )}
          <div className="pm-grid" aria-busy={loading}>
            {methods.map((m) => (
              <article key={m.id} className={`pm-card ${isDefault(m) ? 'pm-card--default' : ''}`}>
                <div className="pm-card__top">
                  <span className="pm-card__brand">{m.cardBrand}</span>
                  <span className="pm-card__badges">
                    {isDefault(m) && <span className="badge badge--ok">Default</span>}
                    {isExpired(m) && <span className="badge badge--off">Expired</span>}
                  </span>
                </div>
                <div className="pm-card__num">•••• •••• •••• {m.last4}</div>
                <div className="pm-card__meta">
                  <span>Expires {String(m.expiryMonth).padStart(2, '0')}/{m.expiryYear}</span>
                  <span>{m.provider}</span>
                </div>
                <div className="pm-card__actions">
                  {!isDefault(m) && !isExpired(m) && (
                    <Button small variant="ghost" loading={rowBusy === m.id} onClick={() => run(m.id, userApi.makeDefaultPaymentMethod)}>Make default</Button>
                  )}
                  {confirmId === m.id ? (
                    <>
                      <Button small variant="danger" loading={rowBusy === m.id} onClick={() => run(m.id, userApi.removePaymentMethod)}>Confirm remove</Button>
                      <Button small variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <Button small variant="ghost" onClick={() => setConfirmId(m.id)}>Remove</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="add-h">
        <div className="section__intro">
          <h2 id="add-h">Add a method</h2>
          <p>The token comes from the payment provider's checkout widget. Until a gateway is connected, paste a test token.</p>
        </div>
        <form className="section__body pm-form" onSubmit={onAdd} noValidate>
          {formError && <div className="full"><Alert tone="error">{formError}</Alert></div>}
          <Select label="Provider" value={form.provider} onChange={set('provider')} options={PROVIDERS} />
          <Select label="Card brand" value={form.cardBrand} onChange={set('cardBrand')} options={BRANDS} />
          <div className="full"><Field label="Provider token" value={form.providerToken} onChange={set('providerToken')} error={errors.providerToken} autoComplete="off" /></div>
          <Field label="Last 4 digits" inputMode="numeric" maxLength={4} value={form.last4} onChange={set('last4')} error={errors.last4} autoComplete="off" />
          <div />
          <Field label="Expiry month" inputMode="numeric" maxLength={2} placeholder="MM" value={form.expiryMonth} onChange={set('expiryMonth')} error={errors.expiryMonth} />
          <Field label="Expiry year" inputMode="numeric" maxLength={4} placeholder="YYYY" value={form.expiryYear} onChange={set('expiryYear')} error={errors.expiryYear} />
          <label className="pm-check full"><input type="checkbox" checked={form.makeDefault} onChange={set('makeDefault')} /> Use as my default method</label>
          <div className="full"><Button type="submit" loading={busy}>Save payment method</Button></div>
        </form>
      </section>
    </>
  )
}
