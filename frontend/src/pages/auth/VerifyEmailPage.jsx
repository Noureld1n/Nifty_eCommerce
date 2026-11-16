import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthCard from '../../components/AuthCard'
import { Alert, Button, Field } from '../../components/ui'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState(token ? 'loading' : 'error')
  const [reason, setReason] = useState(token ? '' : 'This link is missing its token.')
  const started = useRef(false)

  // The token is single-use, so guard against React StrictMode running this effect twice in dev.
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    authApi.verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch((err) => { setReason(err.message); setStatus('error') })
  }, [token])

  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState('')

  async function resend(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await authApi.resendVerification(email.trim())
      setSent(res?.message || 'We sent a new link.')
    } catch (err) {
      setSent(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') {
    return (
      <AuthCard title="Confirming your email…">
        <div className="state-mark state-mark--wait" aria-hidden="true"><span className="spinner" /></div>
      </AuthCard>
    )
  }

  if (status === 'ok') {
    return (
      <AuthCard title="Email confirmed" subtitle="Your account is ready. Log in to start.">
        <div className="state-mark" aria-hidden="true">✓</div>
        <Link className="btn btn--primary btn--full" to="/login">Log in</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="This link didn't work" subtitle="Links expire after 24 hours and work only once. Request a new one below.">
      <div className="state-mark state-mark--error" aria-hidden="true">!</div>
      {reason && <Alert tone="error">{reason}</Alert>}
      {sent ? <Alert tone="success">{sent}</Alert> : (
        <form className="form" onSubmit={resend} noValidate>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" full loading={busy} disabled={!email.includes('@')}>Send a new link</Button>
        </form>
      )}
      <p className="hint">Already confirmed? <Link to="/login">Log in</Link></p>
    </AuthCard>
  )
}
