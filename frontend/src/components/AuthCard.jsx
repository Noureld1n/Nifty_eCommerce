import { useTitle } from '../hooks/useTitle'

export default function AuthCard({ title, subtitle, wide = false, footer, children }) {
  useTitle(title)
  return (
    <section className={`auth-card ${wide ? 'auth-card--wide' : ''}`} aria-labelledby="auth-title">
      <h1 id="auth-title">{title}</h1>
      {subtitle && <p className="auth-card__sub">{subtitle}</p>}
      <div className="auth-card__body">{children}</div>
      {footer && <p className="auth-card__foot">{footer}</p>}
    </section>
  )
}
