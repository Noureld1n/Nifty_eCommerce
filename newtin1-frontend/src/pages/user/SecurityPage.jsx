import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../../api/authApi'
import { useAuth } from '../../auth/useAuth'
import { Alert, Button, Field, PasswordRules } from '../../components/ui'
import { useForm } from '../../hooks/useForm'
import { useTitle } from '../../hooks/useTitle'
import { validate, validators } from '../../lib/validation'

export default function SecurityPage() {
  useTitle('Security')
  const { logout, setNotice } = useAuth()
  const navigate = useNavigate()
  const { values, setErrors, bind } = useForm({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const found = validate(values, {
      current: validators.required('Current password'),
      next: (v) => validators.password(v) || (v === values.current ? 'Choose a password you have not used here before' : ''),
      confirm: validators.match(values.next),
    })
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      await userApi.changePassword(values.current, values.next)
      // The backend ends every session when the password changes, so we sign in again.
      await logout()
      setNotice('Password changed. Log in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err.fieldErrors) setErrors({ next: err.fieldErrors.newPassword, current: err.fieldErrors.currentPassword })
      else setError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Security</h1><p>Keep your account safe.</p></div></div>
      <section className="section" aria-labelledby="pw-h">
        <div className="section__intro">
          <h2 id="pw-h">Change password</h2>
          <p>After you change it, every device is logged out, including this one.</p>
        </div>
        <form className="section__body" onSubmit={onSubmit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Current password" type="password" autoComplete="current-password" {...bind('current')} />
          <Field label="New password" type="password" autoComplete="new-password" {...bind('next')}>
            <PasswordRules value={values.next} />
          </Field>
          <Field label="Confirm new password" type="password" autoComplete="new-password" {...bind('confirm')} />
          <div><Button type="submit" loading={busy}>Change password</Button></div>
        </form>
      </section>
    </>
  )
}
