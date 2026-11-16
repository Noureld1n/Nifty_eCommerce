import { useId, useState } from 'react'
import { PASSWORD_RE } from '../lib/validation'

export function Button({ variant = 'primary', small = false, loading = false, full = false, className = '', type = 'button', disabled, children, ...rest }) {
  const cls = ['btn', `btn--${variant}`, small && 'btn--small', full && 'btn--full', className].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}

export function Alert({ tone = 'info', children, action }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p>{children}</p>
      {action}
    </div>
  )
}

const EyeIcon = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

/** Labelled input. type="password" gets a show/hide toggle. as="textarea" renders a textarea. */
export function Field({ label, error, hint, optional = false, as = 'input', type = 'text', children, ...props }) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  const Tag = as
  const describedBy = error ? `${id}-msg` : hint ? `${id}-hint` : undefined
  return (
    <div className={`field ${error ? 'field--error' : ''} ${isPassword ? 'field--password' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span>optional</span>}
      </label>
      <div className="field__control">
        <Tag
          id={id}
          type={as === 'input' ? (isPassword && shown ? 'text' : type) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {isPassword && (
          <button type="button" className="field__toggle" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
            <EyeIcon off={shown} />
          </button>
        )}
      </div>
      {error ? <p id={`${id}-msg`} className="field__msg">{error}</p> : hint ? <p id={`${id}-hint`} className="field__hint">{hint}</p> : null}
      {children}
    </div>
  )
}

/** Live checklist that mirrors the backend password rule (8-72 chars, a letter, a digit). */
export function PasswordRules({ value }) {
  const rules = [
    ['8 or more characters', value.length >= 8 && value.length <= 72],
    ['A letter', /[A-Za-z]/.test(value)],
    ['A digit', /\d/.test(value)],
  ]
  return (
    <ul className="rules" aria-label="Password requirements" data-valid={PASSWORD_RE.test(value)}>
      {rules.map(([text, ok]) => (
        <li key={text} data-ok={ok}>{text}</li>
      ))}
    </ul>
  )
}

export function Avatar({ user, size = '2.5rem' }) {
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
  return (
    <span className="avatar" style={{ '--s': size }} aria-hidden="true">
      {user?.image ? <img src={user.image} alt="" /> : initials}
    </span>
  )
}

export function Pager({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  return (
    <nav className="pager" aria-label="Pagination">
      <span>Page {page + 1} of {totalPages}</span>
      <div>
        <Button variant="ghost" small disabled={page <= 0} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="ghost" small disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </nav>
  )
}
