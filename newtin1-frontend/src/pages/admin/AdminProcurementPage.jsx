import { useCallback, useMemo, useState } from 'react'
import { adminCatalogApi, adminProcurementApi } from '../../api/adminCommerceApi'
import { Alert, Button, Field, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'
import './AdminCommerce.css'

const EMPTY_PERSON = { name: '', email: '', phone: '' }
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EGP' }).format(Number(value ?? 0))

export default function AdminProcurementPage() {
  useTitle('Procurement')
  const providersFetcher = useCallback(() => adminProcurementApi.providers(), [])
  const accountablesFetcher = useCallback(() => adminProcurementApi.accountables(), [])
  const productFetcher = useCallback(() => adminCatalogApi.products({ active: true, page: 0, size: 100 }), [])
  const [packagePage, setPackagePage] = useState(0)
  const packageFetcher = useCallback(() => adminProcurementApi.packages(packagePage, 10), [packagePage])
  const providersState = useFetch(providersFetcher)
  const accountablesState = useFetch(accountablesFetcher)
  const productsState = useFetch(productFetcher)
  const packagesState = useFetch(packageFetcher)
  const providers = Array.isArray(providersState.data) ? providersState.data : []
  const accountables = Array.isArray(accountablesState.data) ? accountablesState.data : []
  const products = normalizePage(productsState.data).items
  const packageList = normalizePage(packagesState.data)
  const variants = useMemo(() => products.flatMap((product) =>
    (product.variants ?? []).filter((variant) => variant.active).map((variant) => ({
      ...variant, productId: product.id, productName: product.name, productType: product.type,
    }))), [products])

  const [providerForm, setProviderForm] = useState(EMPTY_PERSON)
  const [accountableForm, setAccountableForm] = useState(EMPTY_PERSON)
  const [providerEditId, setProviderEditId] = useState(null)
  const [accountableEditId, setAccountableEditId] = useState(null)
  const [receipt, setReceipt] = useState({ providerId: '', accountableId: '', purchaseDate: '', referenceNumber: '', notes: '' })
  const [lineForm, setLineForm] = useState({ variantItemId: '', quantity: '1', unitCost: '0', notes: '' })
  const [lines, setLines] = useState([])
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function reportError(requestError) {
    setMessage('')
    setError(requestError.fieldErrors
      ? Object.values(requestError.fieldErrors).join(' ')
      : requestError.message)
  }

  function editPerson(kind, person) {
    if (kind === 'provider') {
      setProviderEditId(person.id)
      setProviderForm({ name: person.name, email: person.email ?? '', phone: person.phone ?? '' })
    } else {
      setAccountableEditId(person.id)
      setAccountableForm({ name: person.name, email: person.email ?? '', phone: person.phone ?? '' })
    }
    setError('')
    setMessage('')
  }

  async function savePerson(event, kind) {
    event.preventDefault()
    const isProvider = kind === 'provider'
    const form = isProvider ? providerForm : accountableForm
    const id = isProvider ? providerEditId : accountableEditId
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const body = { name: form.name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null }
      if (isProvider) {
        if (id) await adminProcurementApi.updateProvider(id, body)
        else await adminProcurementApi.createProvider(body)
        providersState.reload()
        setProviderForm(EMPTY_PERSON)
        setProviderEditId(null)
      } else {
        if (id) await adminProcurementApi.updateAccountable(id, body)
        else await adminProcurementApi.createAccountable(body)
        accountablesState.reload()
        setAccountableForm(EMPTY_PERSON)
        setAccountableEditId(null)
      }
      setMessage(`${isProvider ? 'Provider' : 'Accountable'} ${id ? 'updated' : 'created'}.`)
    } catch (requestError) {
      reportError(requestError)
    } finally {
      setBusy(false)
    }
  }

  async function togglePerson(kind, person) {
    setBusyId(`${kind}-${person.id}`)
    setError('')
    setMessage('')
    try {
      if (kind === 'provider') {
        await adminProcurementApi.setProviderActive(person.id, !person.active)
        providersState.reload()
      } else {
        await adminProcurementApi.setAccountableActive(person.id, !person.active)
        accountablesState.reload()
      }
      setMessage(`${kind === 'provider' ? 'Provider' : 'Accountable'} ${person.active ? 'deactivated' : 'activated'}.`)
    } catch (requestError) {
      reportError(requestError)
    } finally {
      setBusyId(null)
    }
  }

  function addLine(event) {
    event.preventDefault()
    const variant = variants.find((item) => String(item.variantItemId) === String(lineForm.variantItemId))
    if (!variant) {
      setError('Choose a product variant before adding a receipt line.')
      return
    }
    if (Number(lineForm.quantity) < 1 || Number(lineForm.unitCost) < 0) {
      setError('Quantity must be positive and unit cost cannot be negative.')
      return
    }
    if (lines.some((line) => String(line.variantItemId) === String(variant.variantItemId))) {
      setError('Each variant can appear only once in a procurement package.')
      return
    }
    setError('')
    setLines((current) => [...current, {
      variantItemId: variant.variantItemId,
      label: `${variant.productName} · ${variantLabel(variant)}`,
      quantity: Number(lineForm.quantity),
      unitCost: Number(lineForm.unitCost),
      notes: lineForm.notes.trim() || null,
    }])
    setLineForm({ variantItemId: '', quantity: '1', unitCost: '0', notes: '' })
  }

  async function receive() {
    if (!lines.length) {
      setError('Add at least one product variant to receive stock.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await adminProcurementApi.receivePackage({
        providerId: Number(receipt.providerId),
        accountableId: Number(receipt.accountableId),
        purchaseDate: receipt.purchaseDate ? receipt.purchaseDate.length === 16 ? `${receipt.purchaseDate}:00` : receipt.purchaseDate : null,
        referenceNumber: receipt.referenceNumber.trim() || null,
        notes: receipt.notes.trim() || null,
        items: lines.map(({ variantItemId, quantity, unitCost, notes }) => ({ variantItemId, quantity, unitCost, notes })),
      })
      setLines([])
      setReceipt({ providerId: '', accountableId: '', purchaseDate: '', referenceNumber: '', notes: '' })
      packagesState.reload()
      productsState.reload()
      setMessage('Stock receipt saved and inventory updated.')
    } catch (requestError) {
      reportError(requestError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Procurement</h1><p>Manage suppliers and stock receipts. Receiving a package increases variant inventory.</p></div></div>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <section className="section" aria-labelledby="providers-title">
        <div className="section__intro"><h2 id="providers-title">Providers</h2><p>Suppliers used for incoming stock.</p></div>
        <div className="section__body admin-panel">
          <form className="admin-inline-form" onSubmit={(event) => savePerson(event, 'provider')}>
            <Field label="Name" required value={providerForm.name} onChange={(event) => setProviderForm((form) => ({ ...form, name: event.target.value }))} />
            <Field label="Email" type="email" value={providerForm.email} onChange={(event) => setProviderForm((form) => ({ ...form, email: event.target.value }))} />
            <Field label="Phone" type="tel" value={providerForm.phone} onChange={(event) => setProviderForm((form) => ({ ...form, phone: event.target.value }))} />
            <div className="admin-form__actions"><Button type="submit" small loading={busy}>{providerEditId ? 'Save provider' : 'Add provider'}</Button>{providerEditId && <Button type="button" small variant="ghost" onClick={() => { setProviderEditId(null); setProviderForm(EMPTY_PERSON) }}>Cancel</Button>}</div>
          </form>
          <div className="table-wrap">
            <table className="admin-table"><thead><tr><th>Name</th><th>Email / phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{providers.map((provider) => <tr key={provider.id}>
                <td>{provider.name}</td><td>{provider.email || '—'}<small>{provider.phone || '—'}</small></td>
                <td><span className={`badge ${provider.active ? 'badge--ok' : 'badge--off'}`}>{provider.active ? 'Active' : 'Inactive'}</span></td>
                <td><div className="admin-table__actions"><Button small variant="quiet" onClick={() => editPerson('provider', provider)}>Edit</Button><Button small variant={provider.active ? 'ghost' : 'primary'} loading={busyId === `provider-${provider.id}`} onClick={() => togglePerson('provider', provider)}>{provider.active ? 'Deactivate' : 'Activate'}</Button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
          {providersState.error && <Alert tone="error">{providersState.error}</Alert>}
        </div>
      </section>

      <section className="section" aria-labelledby="accountables-title">
        <div className="section__intro"><h2 id="accountables-title">Accountables</h2><p>Staff members responsible for receiving stock.</p></div>
        <div className="section__body admin-panel">
          <form className="admin-inline-form" onSubmit={(event) => savePerson(event, 'accountable')}>
            <Field label="Name" required value={accountableForm.name} onChange={(event) => setAccountableForm((form) => ({ ...form, name: event.target.value }))} />
            <Field label="Email" type="email" value={accountableForm.email} onChange={(event) => setAccountableForm((form) => ({ ...form, email: event.target.value }))} />
            <Field label="Phone" type="tel" value={accountableForm.phone} onChange={(event) => setAccountableForm((form) => ({ ...form, phone: event.target.value }))} />
            <div className="admin-form__actions"><Button type="submit" small loading={busy}>{accountableEditId ? 'Save accountable' : 'Add accountable'}</Button>{accountableEditId && <Button type="button" small variant="ghost" onClick={() => { setAccountableEditId(null); setAccountableForm(EMPTY_PERSON) }}>Cancel</Button>}</div>
          </form>
          <div className="table-wrap">
            <table className="admin-table"><thead><tr><th>Name</th><th>Email / phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{accountables.map((accountable) => <tr key={accountable.id}>
                <td>{accountable.name}</td><td>{accountable.email || '—'}<small>{accountable.phone || '—'}</small></td>
                <td><span className={`badge ${accountable.active ? 'badge--ok' : 'badge--off'}`}>{accountable.active ? 'Active' : 'Inactive'}</span></td>
                <td><div className="admin-table__actions"><Button small variant="quiet" onClick={() => editPerson('accountable', accountable)}>Edit</Button><Button small variant={accountable.active ? 'ghost' : 'primary'} loading={busyId === `accountable-${accountable.id}`} onClick={() => togglePerson('accountable', accountable)}>{accountable.active ? 'Deactivate' : 'Activate'}</Button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
          {accountablesState.error && <Alert tone="error">{accountablesState.error}</Alert>}
        </div>
      </section>

      <section className="section" aria-labelledby="receipt-title">
        <div className="section__intro"><h2 id="receipt-title">Receive stock</h2><p>Record a procurement package and add its quantities to inventory.</p></div>
        <div className="section__body admin-form">
          <div className="admin-form__row">
            <label className="field"><span>Provider</span><select required value={receipt.providerId} onChange={(event) => setReceipt((value) => ({ ...value, providerId: event.target.value }))}>
              <option value="">Select provider</option>{providers.filter((provider) => provider.active).map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </select></label>
            <label className="field"><span>Accountable</span><select required value={receipt.accountableId} onChange={(event) => setReceipt((value) => ({ ...value, accountableId: event.target.value }))}>
              <option value="">Select accountable</option>{accountables.filter((person) => person.active).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select></label>
          </div>
          <div className="admin-form__row">
            <Field label="Purchase date" type="datetime-local" value={receipt.purchaseDate} onChange={(event) => setReceipt((value) => ({ ...value, purchaseDate: event.target.value }))} />
            <Field label="Reference number" maxLength={100} value={receipt.referenceNumber} onChange={(event) => setReceipt((value) => ({ ...value, referenceNumber: event.target.value }))} />
          </div>

          <form className="admin-detail admin-form" onSubmit={addLine}>
            <h3>Add package item</h3>
            <label className="field"><span>Product variant</span><select required value={lineForm.variantItemId} onChange={(event) => setLineForm((value) => ({ ...value, variantItemId: event.target.value }))}>
              <option value="">Select a variant</option>
              {variants.map((variant) => <option key={variant.variantItemId} value={variant.variantItemId}>
                {variant.productName} · {variantLabel(variant)} · Stock {variant.stockQuantity}
              </option>)}
            </select></label>
            <div className="admin-form__row">
              <Field label="Quantity" type="number" min="1" required value={lineForm.quantity} onChange={(event) => setLineForm((value) => ({ ...value, quantity: event.target.value }))} />
              <Field label="Unit cost (EGP)" type="number" min="0" step="0.01" required value={lineForm.unitCost} onChange={(event) => setLineForm((value) => ({ ...value, unitCost: event.target.value }))} />
            </div>
            <Field label="Line notes" value={lineForm.notes} onChange={(event) => setLineForm((value) => ({ ...value, notes: event.target.value }))} />
            <Button type="submit" small variant="ghost">Add item to package</Button>
          </form>

          {lines.length > 0 && (
            <div className="admin-detail">
              <strong>Package items</strong>
              {lines.map((line) => <div className="admin-detail__line" key={line.variantItemId}>
                <span>{line.label}</span><span>× {line.quantity}</span><span>{money(line.unitCost)} each</span>
                <Button small variant="quiet" onClick={() => setLines((items) => items.filter((item) => item.variantItemId !== line.variantItemId))}>Remove</Button>
              </div>)}
              <strong>Total cost: {money(lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0))}</strong>
            </div>
          )}
          <Field label="Package notes" as="textarea" value={receipt.notes} onChange={(event) => setReceipt((value) => ({ ...value, notes: event.target.value }))} />
          <Button type="button" loading={busy} disabled={!lines.length} onClick={receive}>Receive package</Button>
          {productsState.error && <Alert tone="error">Product variants could not be loaded: {productsState.error}</Alert>}
        </div>
      </section>

      <section className="section" aria-labelledby="packages-title">
        <div className="section__intro"><h2 id="packages-title">Received packages</h2><p>Recent procurement history.</p></div>
        <div className="section__body admin-panel" aria-busy={packagesState.loading}>
          {packagesState.error && <Alert tone="error">{packagesState.error}</Alert>}
          {packageList.items.map((pkg) => (
            <article className="admin-detail" key={pkg.id}>
              <div className="admin-panel__head">
                <div><strong>{pkg.referenceNumber || `Package #${pkg.id}`}</strong><small className="admin-muted">{formatDate(pkg.purchaseDate)} · {pkg.providerName} · Received by {pkg.accountableName}</small></div>
                <strong>{money(pkg.totalCost)}</strong>
              </div>
              <div className="admin-detail__items">
                {pkg.items?.map((item) => <div className="admin-detail__line" key={item.variantItemId}>
                  <span>Variant #{item.variantItemId}</span><span>× {item.quantity}</span><span>{money(item.unitCost)} each</span><strong>{money(item.lineTotal)}</strong>
                </div>)}
              </div>
              {pkg.notes && <p className="admin-muted">{pkg.notes}</p>}
            </article>
          ))}
          {!packagesState.loading && !packageList.items.length && <div className="empty"><strong>No stock receipts yet</strong>Received packages will be listed here.</div>}
          <Pager page={packageList.page} totalPages={packageList.totalPages} onPage={setPackagePage} />
        </div>
      </section>
    </>
  )
}

function variantLabel(variant) {
  return [variant.size, variant.color, variant.material, variant.sizeLabel,
    variant.volumeMl ? `${variant.volumeMl} ml` : '', variant.formulation,
    variant.additionalDescription].filter(Boolean).join(' · ') || 'Standard'
}
