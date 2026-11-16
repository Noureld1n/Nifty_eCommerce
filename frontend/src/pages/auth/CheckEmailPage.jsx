import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthCard from '../../components/AuthCard'
import { Alert, Button, Field } from '../../components/ui'

const COOLDOWN_S = 45

export default function CheckEmailPage() {
  const location = useLocation()
  const known = location.state?.email || ''
  const [email, setEmail] = useState(known)
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ tone: '', text: '' })

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function resend() {
    if (!email.trim()) { setMsg({ tone: 'error', text: 'Enter your email first.' }); return }
    setBusy(true)
    try {
      const res = await authApi.resendVerification(email.trim())
      setMsg({ tone: 'success', text: res?.message || 'We sent a new email.' })
      setCooldown(COOLDOWN_S)
    } catch (err) {
      setMsg({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Check your inbox"
      subtitle={known ? <>We sent a confirmation link to <strong>{known}</strong>. It expires in 24 hours.</> : 'Open the confirmation link we emailed you. It expires in 24 hours.'}
      footer={<>Confirmed already? <Link to="/login">Log in</Link></>}
    >
      <div className="state-mark state-mark--wait" aria-hidden="true">✉</div>
      {msg.text && <Alert tone={msg.tone}>{msg.text}</Alert>}
      {!known && <Field label="Your email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      <Button variant="ghost" full loading={busy} disabled={cooldown > 0} onClick={resend}>
        {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend the email'}
      </Button>
      <p className="hint">Can't find it? Check your spam folder.</p>
      {import.meta.env.DEV && (
        <p className="hint">
          Local development: read the email in Mailpit at{' '}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer">localhost:8025</a>.
        </p>
      )}
    </AuthCard>
  )
}
