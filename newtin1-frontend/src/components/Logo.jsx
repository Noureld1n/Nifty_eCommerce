import { useId } from 'react'
import './Logo.css'

// A wide, almost round apple with a shallow dip at the top.
const APPLE =
  'M60 30 C52 22 36 22 25 32 C12 44 12 68 24 86 C33 99 44 108 53 106 C57 105 63 105 67 106 C76 108 87 99 96 86 C108 68 108 44 95 32 C84 22 68 22 60 30 Z'

// Yin-yang circle: centre (60,65), radius 54. The green half is the "S" shape on the left.
const GREEN_HALF = 'M60 11 A27 27 0 0 1 60 65 A27 27 0 0 0 60 119 A54 54 0 0 1 60 11 Z'

/**
 * Nifty mark: a black runner inside a round apple whose green and blue halves
 * spin like a yin-yang.
 *
 * speed: 'normal' | 'fast' | 'paused'
 * Each limb is two nested groups (upper + lower) that rotate around the shoulder/hip
 * and the elbow/knee, which is what reads as running.
 */
export default function Logo({ size = 96, speed = 'normal', wordmark = false, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const id = (name) => `${name}-${uid}`

  return (
    <span className={`logo ${wordmark ? 'logo--wordmark' : ''} ${className}`} data-speed={speed}>
      <svg className="logo__svg" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Nifty">
        <defs>
          <clipPath id={id('clip')}><path d={APPLE} /></clipPath>
          <linearGradient id={id('green')} gradientUnits="userSpaceOnUse" x1="6" y1="11" x2="114" y2="119">
            <stop offset="0" stopColor="#bdf3d4" />
            <stop offset="1" stopColor="#47c98c" />
          </linearGradient>
          <linearGradient id={id('blue')} gradientUnits="userSpaceOnUse" x1="6" y1="11" x2="114" y2="119">
            <stop offset="0" stopColor="#c6e6ff" />
            <stop offset="1" stopColor="#4aa6ec" />
          </linearGradient>
          <radialGradient id={id('shade')} cx="0.33" cy="0.27" r="0.95">
            <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#0b1a24" stopOpacity="0.28" />
          </radialGradient>
          <linearGradient id={id('sheen')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id('leaf')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d6f9e4" />
            <stop offset="1" stopColor="#4cc487" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse className="logo__shadow" cx="60" cy="116" rx="32" ry="3.4" />

        <g className="logo__apple">
          <g clipPath={`url(#${id('clip')})`}>
            {/* the spinning yin-yang */}
            <g className="logo__yin">
              <circle cx="60" cy="65" r="54" fill={`url(#${id('blue')})`} />
              <path d={GREEN_HALF} fill={`url(#${id('green')})`} />
              <circle cx="60" cy="38" r="8" fill={`url(#${id('blue')})`} />
              <circle cx="60" cy="92" r="8" fill={`url(#${id('green')})`} />
            </g>
            {/* volume + a light sweep that crosses the apple now and then */}
            <rect x="8" y="16" width="104" height="100" fill={`url(#${id('shade')})`} />
            <g className="logo__sheen">
              <rect x="-46" y="10" width="26" height="112" fill={`url(#${id('sheen')})`} transform="skewX(-18)" />
            </g>
          </g>

          <path className="logo__outline" d={APPLE} />
          <path className="logo__gloss" d="M26 44 C27 36 33 31 41 29" />

          {/* stem + leaf */}
          <path className="logo__outline logo__stem" d="M60 30 C60 22 62 15 69 10" />
          <path className="logo__leaf" d="M67 15 C71 5 85 5 92 10 C88 19 76 21 67 15 Z" fill={`url(#${id('leaf')})`} />
          <path className="logo__vein" d="M69 14 C76 11 83 10 90 10.5" />
          <path className="logo__spark" d="M33 48 Q33 53 38 53 Q33 53 33 58 Q33 53 28 53 Q33 53 33 48 Z" />
        </g>

        {/* wind streaks behind the runner */}
        <g className="logo__speed">
          <line x1="18" y1="50" x2="34" y2="50" />
          <line x1="14" y1="64" x2="34" y2="64" />
          <line x1="20" y1="78" x2="36" y2="78" />
        </g>

        {/* runner */}
        <g className="logo__runner">
          <g className="logo__body">
            {/* back arm + back leg, slightly lighter so the body reads in front */}
            <g className="limb limb--arm limb--back" style={{ transformOrigin: '63px 54px' }}>
              <line className="ink-line" x1="63" y1="54" x2="63" y2="64" />
              <g className="limb__lower" style={{ transformOrigin: '63px 64px' }}>
                <line className="ink-line" x1="63" y1="64" x2="63" y2="74" />
                <circle className="ink-fill" cx="63" cy="77" r="3.2" />
              </g>
            </g>
            <g className="limb limb--leg limb--back" style={{ transformOrigin: '58px 74px' }}>
              <line className="ink-line" x1="58" y1="74" x2="58" y2="87" />
              <g className="limb__lower" style={{ transformOrigin: '58px 87px' }}>
                <line className="ink-line" x1="58" y1="87" x2="58" y2="99" />
                <path className="shoe" d="M54.2 98 h6.4 l5.8 3.4 q2.2 1.4 .6 3.2 h-12.6 q-2 0-2-2 z" />
              </g>
            </g>

            <g className="torso">
              {/* tapered torso, shorts and waistband */}
              <path className="ink-fill ink-join" d="M57 49.5 Q63.5 46.5 69.5 50 L63.6 74 Q58.6 76 54.4 73.6 Z" />
              <path className="ink-fill ink-join" d="M52.8 70 L64.4 68.4 L65.2 78 L51.8 79 Z" />
              <path className="waist" d="M53 71.2 L64.6 69.8" />
              {/* head, eye, headband and its tails */}
              <circle className="ink-fill" cx="66.5" cy="39.5" r="7.4" />
              <circle className="eye" cx="69.4" cy="38.8" r="1.25" />
              <path className="band" d="M59.6 37.6 Q66 33.4 73.4 37.4" />
              <g className="tails" style={{ transformOrigin: '60px 37.6px' }}>
                <path className="tail" d="M60 37.6 Q54 35.4 47 37.6" />
                <path className="tail" d="M60 38 Q54.6 40.2 49 44.4" />
              </g>
            </g>

            {/* front leg + front arm */}
            <g className="limb limb--leg limb--front" style={{ transformOrigin: '58px 74px' }}>
              <line className="ink-line" x1="58" y1="74" x2="58" y2="87" />
              <g className="limb__lower" style={{ transformOrigin: '58px 87px' }}>
                <line className="ink-line" x1="58" y1="87" x2="58" y2="99" />
                <path className="shoe" d="M54.2 98 h6.4 l5.8 3.4 q2.2 1.4 .6 3.2 h-12.6 q-2 0-2-2 z" />
                <path className="sole" d="M54.2 103.6 h12.6" />
              </g>
            </g>
            <g className="limb limb--arm limb--front" style={{ transformOrigin: '63px 54px' }}>
              <line className="ink-line" x1="63" y1="54" x2="63" y2="64" />
              <g className="limb__lower" style={{ transformOrigin: '63px 64px' }}>
                <line className="ink-line" x1="63" y1="64" x2="63" y2="74" />
                <circle className="ink-fill" cx="63" cy="77" r="3.2" />
              </g>
            </g>
          </g>
        </g>
      </svg>
      {wordmark && <span className="logo__word">Nifty</span>}
    </span>
  )
}
