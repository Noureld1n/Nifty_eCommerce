import { useState } from 'react'
import { userApi } from '../../api/authApi'
import { useAuth } from '../../auth/useAuth'
import { Alert, Avatar, Button, Field } from '../../components/ui'
import { useForm } from '../../hooks/useForm'
import { useTitle } from '../../hooks/useTitle'
import { formatDate } from '../../lib/format'
import { validate, validators } from '../../lib/validation'

export default function ProfilePage() {
  useTitle('Profile')
  const { user, setUser } = useAuth()
  const { values, setErrors, bind } = useForm({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? '',
    image: user.image ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty =
    values.firstName.trim() !== user.firstName ||
    values.lastName.trim() !== user.lastName ||
    values.phone.trim() !== (user.phone ?? '') ||
    values.image.trim() !== (user.image ?? '')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    const found = validate(values, {
      firstName: validators.required('First name'),
      lastName: validators.required('Last name'),
      phone: validators.phone,
      image: (v) => (!v.trim() || /^https?:\/\//i.test(v.trim()) ? '' : 'Use a link that starts with http:// or https://'),
    })
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      const updated = await userApi.updateProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        image: values.image.trim(),
      })
      setUser(updated)
      setSaved(true)
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors)
      setError(err.fieldErrors ? 'Fix the highlighted fields and try again.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <Avatar user={user} size="4.25rem" />
        <div className="page-head__text">
          <h1>Hi, {user.firstName}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <dl className="facts">
        <div><dt>Member since</dt><dd>{formatDate(user.registerDate)}</dd></div>
        <div><dt>Email</dt><dd><span className="badge badge--ok">Verified</span></dd></div>
        <div><dt>Account</dt><dd>Customer</dd></div>
      </dl>

      <section className="section" aria-labelledby="profile-h">
        <div className="section__intro">
          <h2 id="profile-h">Your details</h2>
          <p>Shown on your orders and used when we contact you about them.</p>
        </div>
        <form className="section__body" onSubmit={onSubmit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          {saved && <Alert tone="success">Profile saved.</Alert>}
          <div className="form__row">
            <Field label="First name" autoComplete="given-name" {...bind('firstName')} />
            <Field label="Last name" autoComplete="family-name" {...bind('lastName')} />
          </div>
          <Field label="Phone" optional type="tel" autoComplete="tel" {...bind('phone')} />
          <Field label="Photo link" optional type="url" hint="A public image address (https://…)" {...bind('image')} />
          <div><Button type="submit" loading={busy} disabled={!dirty}>Save changes</Button></div>
        </form>
      </section>
    </>
  )
}
