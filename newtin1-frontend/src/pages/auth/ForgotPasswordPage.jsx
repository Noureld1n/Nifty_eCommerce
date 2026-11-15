import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthCard from '../../components/AuthCard'
import { Alert, Button, Field } from '../../components/ui'
import { useForm } from '../../hooks/useForm'
import { validate, validators } from '../../lib/validation'

export default function ForgotPasswordPage() {
  const { values, setErrors, bind } = useForm({ email: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const found = validate(values, { email: validators.email })
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const res = await authApi.forgotPassword(values.email.trim())
      setDone(res?.message || 'If the account exists, a reset email was sent.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send a link that works for 30 minutes."
      footer={<>Remembered it? <Link to="/login">Log in</Link></>}
    >
      {done ? (
        <>
          <div className="state-mark state-mark--wait" aria-hidden="true">✉</div>
          <Alert tone="success">{done}</Alert>
          {import.meta.env.DEV && (
            <p className="hint">Local development: read the email in Mailpit at <a href="http://localhost:8025" target="_blank" rel="noreferrer">localhost:8025</a>.</p>
          )}
        </>
      ) : (
        <>
          {error && <Alert tone="error">{error}</Alert>}
          <form className="form" onSubmit={onSubmit} noValidate>
            <Field label="Email" type="email" autoComplete="email" inputMode="email" autoFocus {...bind('email')} />
            <Button type="submit" full loading={busy}>Send reset link</Button>
          </form>
        </>
      )}
    </AuthCard>
  )
}
