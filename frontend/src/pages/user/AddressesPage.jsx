import { useCallback, useState } from 'react'
import { addressApi } from '../../api/customerCommerceApi'
import { Alert, Button, Field } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import './AddressesPage.css'

const EMPTY = { street: '', city: '', state: '', zipcode: '', countryCode: 'EG', addressType: 'HOME' }
const TYPES = [
  { value: 'HOME', label: 'Home' },
  { value: 'WORK', label: 'Work' },
  { value: 'OTHER', label: 'Other' },
]

function formatAddress(address) {
  return [address.street, address.city, address.state, address.zipcode, address.countryCode]
    .filter(Boolean).join(', ')
}

export default function AddressesPage() {
  useTitle('Addresses')
  const fetcher = useCallback(() => addressApi.list(), [])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const addresses = Array.isArray(data) ? data : []
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function edit(address) {
    setEditingId(address.id)
    setForm({
      street: address.street ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      zipcode: address.zipcode ?? '',
      countryCode: address.countryCode ?? 'EG',
      addressType: address.addressType ?? 'OTHER',
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
    setError('')
    setMessage('')
    setBusy(true)
    const body = {
      ...form,
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim() || null,
      zipcode: form.zipcode.trim() || null,
      countryCode: form.countryCode.trim().toUpperCase() || 'EG',
    }
    try {
      if (editingId) {
        await addressApi.update(editingId, body)
        setMessage('Address updated.')
      } else {
        await addressApi.create(body)
        setMessage('Address saved.')
      }
      reset()
      reload()
    } catch (requestError) {
      setError(requestError.fieldErrors
        ? Object.values(requestError.fieldErrors).join(' ')
        : requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function runAction(id, action, successMessage) {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await action(id)
      setMessage(successMessage)
      reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Your addresses</h1>
          <p>Manage the delivery addresses you can use at checkout.</p>
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <section className="section" aria-labelledby="address-list-title">
        <div className="section__intro">
          <h2 id="address-list-title">Saved addresses</h2>
          <p>Your default address is selected first at checkout.</p>
        </div>
        <div className="address-list" aria-busy={loading}>
          {!loading && !loadError && addresses.length === 0 && (
            <div className="empty"><strong>No saved addresses</strong>Add one below to place an order.</div>
          )}
          {loadError && <Alert tone="error" action={<Button variant="ghost" small onClick={reload}>Try again</Button>}>{loadError}</Alert>}
          {addresses.map((address) => (
            <article className="address-card" key={address.id}>
              <div>
                <header className="address-card__heading">
                  <strong>{address.addressType?.toLowerCase()}</strong>
                  {address.defaultAddress && <span className="badge badge--ok">Default</span>}
                </header>
                <p>{formatAddress(address)}</p>
              </div>
              <div className="address-card__actions">
                {!address.defaultAddress && (
                  <Button small variant="ghost" loading={busyId === address.id}
                    onClick={() => runAction(address.id, addressApi.setDefault, 'Default address updated.')}>
                    Make default
                  </Button>
                )}
                <Button small variant="quiet" onClick={() => edit(address)}>Edit</Button>
                <Button small variant="danger" loading={busyId === address.id}
                  onClick={() => runAction(address.id, addressApi.remove, 'Address removed.')}>
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="address-form-title">
        <div className="section__intro">
          <h2 id="address-form-title">{editingId ? 'Edit address' : 'Add an address'}</h2>
          <p>Enter the address exactly as it should appear on a delivery label.</p>
        </div>
        <form className="section__body address-form" onSubmit={submit}>
          <Field label="Street address" required maxLength={255} autoComplete="street-address"
            value={form.street} onChange={(event) => change('street', event.target.value)} />
          <div className="form__row">
            <Field label="City" required maxLength={100} autoComplete="address-level2"
              value={form.city} onChange={(event) => change('city', event.target.value)} />
            <Field label="State / region" optional maxLength={100} autoComplete="address-level1"
              value={form.state} onChange={(event) => change('state', event.target.value)} />
          </div>
          <div className="form__row">
            <Field label="Postal code" optional maxLength={20} autoComplete="postal-code"
              value={form.zipcode} onChange={(event) => change('zipcode', event.target.value)} />
            <Field label="Country code" hint="Two letters, for example EG" maxLength={2}
              value={form.countryCode} onChange={(event) => change('countryCode', event.target.value)} />
          </div>
          <label className="field">
            <span>Address type</span>
            <select value={form.addressType} onChange={(event) => change('addressType', event.target.value)}>
              {TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <div className="address-form__actions">
            <Button type="submit" loading={busy}>{editingId ? 'Save changes' : 'Save address'}</Button>
            {editingId && <Button type="button" variant="ghost" onClick={reset}>Cancel edit</Button>}
          </div>
        </form>
      </section>
    </>
  )
}
