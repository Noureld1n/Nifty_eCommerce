import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthCard from '../../components/AuthCard'
import { Alert, Button, Field, PasswordRules } from '../../components/ui'
import { useForm } from '../../hooks/useForm'
import { validate, validators } from '../../lib/validation'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { values, setErrors, bind } = useForm({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [emailTaken, setEmailTaken] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setEmailTaken(false)

    const found = validate(values, {
      firstName: validators.required('First name'),
      lastName: validators.required('Last name'),
      email: validators.email,
      phone: validators.phone,
      password: validators.password,
      confirm: validators.match(values.password),
    })
    setErrors(found)
    if (Object.keys(found).length) return

    const email = values.email.trim().toLowerCase()
    setBusy(true)
    try {
      await authApi.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email,
        phone: values.phone.trim(),
        password: values.password,
      })
      navigate('/check-email', { replace: true, state: { email } })
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors)
      setError(err.fieldErrors ? 'Fix the highlighted fields and try again.' : err.message)
      setEmailTaken(err.status === 409 && /email/i.test(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      wide
      title="Create your account"
      subtitle="We'll email you a link to confirm your address before you can log in."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      {error && (
        <Alert tone="error" action={emailTaken && <Link to="/login">Go to log in</Link>}>{error}</Alert>
      )}
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="form__row">
          <Field label="First name" autoComplete="given-name" autoFocus {...bind('firstName')} />
          <Field label="Last name" autoComplete="family-name" {...bind('lastName')} />
        </div>
        <Field label="Email" type="email" autoComplete="email" inputMode="email" {...bind('email')} />
        <Field label="Phone" optional type="tel" autoComplete="tel" inputMode="tel" hint="Digits only, optionally starting with +" {...bind('phone')} />
        <Field label="Password" type="password" autoComplete="new-password" {...bind('password')}>
          <PasswordRules value={values.password} />
        </Field>
        <Field label="Confirm password" type="password" autoComplete="new-password" {...bind('confirm')} />
        <Button type="submit" full loading={busy}>Create account</Button>
      </form>
    </AuthCard>
  )
}
