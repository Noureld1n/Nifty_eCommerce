import Logo from './Logo'

/** Shown while we find out whether the browser still holds a valid session cookie. */
export default function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <Logo size={96} speed="fast" />
      <span className="splash__text">Loading…</span>
    </div>
  )
}
