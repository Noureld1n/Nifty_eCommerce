import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthCard from '../../components/AuthCard'
import { Alert, Button, Field, PasswordRules } from '../../components/ui'
import { useForm } from '../../hooks/useForm'
import { validate, validators } from '../../lib/validation'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { values, setErrors, bind } = useForm({ password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [linkDead, setLinkDead] = useState(!token)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const found = validate(values, {
      password: validators.password,
      confirm: validators.match(values.password),
    })
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await authApi.resetPassword(token, values.password)
      navigate('/login', { replace: true, state: { message: 'Password updated. Log in with your new password.' } })
    } catch (err) {
      if (err.fieldErrors) setErrors({ password: err.fieldErrors.newPassword || err.fieldErrors.password })
      else setError(err.message)
      if (err.status === 400 && !err.fieldErrors) setLinkDead(true)
    } finally {
      setBusy(false)
    }
  }

  if (linkDead) {
    return (
      <AuthCard title="This link didn't work" subtitle="Reset links expire after 30 minutes and work only once.">
        <div className="state-mark state-mark--error" aria-hidden="true">!</div>
        {error && <Alert tone="error">{error}</Alert>}
        <Link className="btn btn--primary btn--full" to="/forgot-password">Request a new link</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password" subtitle="You'll be logged out everywhere and asked to log in again.">
      {error && <Alert tone="error">{error}</Alert>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <Field label="New password" type="password" autoComplete="new-password" autoFocus {...bind('password')}>
          <PasswordRules value={values.password} />
        </Field>
        <Field label="Confirm new password" type="password" autoComplete="new-password" {...bind('confirm')} />
        <Button type="submit" full loading={busy}>Save new password</Button>
      </form>
    </AuthCard>
  )
}
