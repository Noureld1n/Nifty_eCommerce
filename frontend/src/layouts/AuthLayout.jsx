import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import './AuthLayout.css'

// The runner sprints in once per page load, then settles into a steady jog.
let hasArrived = false

// A running track seen from above: concentric lanes, with a few runners orbiting.
const LANES = Array.from({ length: 9 }, (_, i) => 190 + i * 46)
const RUNNERS = [
  { lane: 1, angle: 20, tone: 'leaf', dur: 38 },
  { lane: 3, angle: 200, tone: 'sky', dur: 52 },
  { lane: 5, angle: 110, tone: 'leaf', dur: 66 },
  { lane: 7, angle: 300, tone: 'sky', dur: 80 },
]

function Track() {
  return (
    <svg className="auth__track" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="trk-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c6f6dc" />
          <stop offset="1" stopColor="#4fcb92" />
        </linearGradient>
        <linearGradient id="trk-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cdeaff" />
          <stop offset="1" stopColor="#4fa9ee" />
        </linearGradient>
      </defs>
      {LANES.map((r, i) => (
        <circle key={r} className={`lane lane--${i % 2 ? 'dash' : 'solid'}`} r={r} />
      ))}
      {RUNNERS.map((d) => (
        <g key={d.lane} className="orbit" style={{ '--dur': `${d.dur}s`, transform: `rotate(${d.angle}deg)` }}>
          <g className="orbit__spin" style={{ animationDuration: `${d.dur}s` }}>
            <circle className="runner-dot" cx={LANES[d.lane] + 23} cy="0" r="9" fill={`url(#trk-${d.tone})`} />
          </g>
        </g>
      ))}
    </svg>
  )
}

/**
 * Background: a soft two-tone sky, a running track seen from above, and a little grain.
 * The runner stands on top of the card, so the card's top edge is the ground.
 */
export default function AuthLayout() {
  const { pathname } = useLocation()
  const [arriving, setArriving] = useState(!hasArrived)

  useEffect(() => {
    if (!arriving) return undefined
    hasArrived = true
    const t = setTimeout(() => setArriving(false), 1100)
    return () => clearTimeout(t)
  }, [arriving])

  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true">
        <span className="auth__blob auth__blob--leaf" />
        <span className="auth__blob auth__blob--sky" />
        <Track />
        <span className="auth__grain" />
      </div>

      <header className="auth__top">
        <Link to="/" className="auth__brand" aria-label="Nifty home">
          <Logo size={46} wordmark />
        </Link>
      </header>

      <main className="auth__stage">
        <div className={`auth__runner ${arriving ? 'is-arriving' : ''}`}>
          <Logo size={176} speed={arriving ? 'fast' : 'normal'} />
        </div>
        <div className="auth__page" key={pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}