import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { homeFor, useAuth } from '../../auth/useAuth'
import AuthCard from '../../components/AuthCard'
import { Alert, Button, Field } from '../../components/ui'
import { useForm } from '../../hooks/useForm'
import { validate, validators } from '../../lib/validation'

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

export default function LoginPage() {
  const { login, notice, setNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { values, setErrors, bind } = useForm({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const flash = location.state?.message

  // After a 429 the button stays locked and a live countdown shows when to try again.
  const [waitUntil, setWaitUntil] = useState(0)
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (!waitUntil) return undefined
    const tick = () => {
      const s = Math.ceil((waitUntil - Date.now()) / 1000)
      if (s <= 0) { setLeft(0); setWaitUntil(0); setError('') } else setLeft(s)
    }
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [waitUntil])

  async function onSubmit(e) {
    e.preventDefault()
    if (left > 0) return
    setNotice('')
    setError('')
    setUnverified(false)
    setResendMsg('')

    const found = validate(values, {
      email: (v) => (v.trim().includes('@') ? '' : 'Enter the email you registered with'),
      password: validators.required('Password'),
    })
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      const user = await login(values.email.trim().toLowerCase(), values.password)
      const from = location.state?.from
      const sameArea = from && from.startsWith('/admin') === (user.role === 'ROLE_ADMIN') && from !== '/'
      navigate(sameArea ? from : homeFor(user), { replace: true })
    } catch (err) {
      if (err.status === 429) setWaitUntil(Date.now() + err.retryAfter * 1000)
      setError(err.message)
      setUnverified(err.status === 403) // backend answers 403 only when the password was right but the email is unverified
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    try {
      const res = await authApi.resendVerification(values.email.trim())
      setResendMsg(res?.message || 'We sent a new verification email.')
    } catch (err) {
      setResendMsg(err.message)
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to keep your account and orders in one place."
      footer={<>New to Nifty? <Link to="/register">Create an account</Link></>}
    >
      {flash && <Alert tone="success">{flash}</Alert>}
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && (
        <Alert
          tone="error"
          action={unverified && !resendMsg && <Button variant="ghost" small onClick={resend}>Resend verification email</Button>}
        >
          {left > 0 ? <>Too many attempts. Try again in <strong>{clock(left)}</strong>.</> : error}
        </Alert>
      )}
      {resendMsg && <Alert tone="success">{resendMsg}</Alert>}

      <form className="form" onSubmit={onSubmit} noValidate>
        <Field label="Email" type="email" autoComplete="email" inputMode="email" autoFocus {...bind('email')} />
        <Field label="Password" type="password" autoComplete="current-password" {...bind('password')} />
        <div className="auth-card__links">
          <span />
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" full loading={busy} disabled={left > 0}>{left > 0 ? `Try again in ${clock(left)}` : 'Log in'}</Button>
      </form>
    </AuthCard>
  )
}