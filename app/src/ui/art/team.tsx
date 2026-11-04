import { memo, useId, type ReactElement } from 'react'
import type { ClubId, KitSpec } from '../../engine/model/types'
import athleticCrest from '../../assets/crests/athletic.svg'
import barcelonaCrest from '../../assets/crests/barcelona.svg'
import madridCrest from '../../assets/crests/madrid.svg'

export const CREST_URL: Record<ClubId, string> = {
  athletic: athleticCrest,
  barcelona: barcelonaCrest,
  madrid: madridCrest,
}

const SHIRT = 'M20 6 L12 9 L3 17 L9 26 L14 22 L14 58 L50 58 L50 22 L55 26 L61 17 L52 9 L44 6 C41 11 23 11 20 6 Z'

function patternEls(spec: KitSpec): ReactElement[] {
  const s = spec.secondary
  switch (spec.pattern) {
    case 'rayas':
      return [16, 26, 36, 46].map(x => <rect key={x} x={x} y={0} width={5} height={64} fill={s} />)
    case 'finas':
      return [14, 20, 26, 32, 38, 44, 50].map(x => <rect key={x} x={x} y={0} width={1.6} height={64} fill={s} />)
    case 'aros':
      return [16, 28, 40, 52].map(y => <rect key={y} x={0} y={y} width={64} height={6} fill={s} />)
    case 'mitades':
      return [<rect key="h" x={32} y={0} width={32} height={64} fill={s} />]
    case 'banda':
      return [<path key="b" d="M8 10 L22 6 L58 58 L44 62 Z" fill={s} />]
    case 'chevron':
      return [<path key="c" d="M10 22 L32 40 L54 22 L54 30 L32 48 L10 30 Z" fill={s} />]
    case 'cuartos':
      return [<rect key="a" x={32} y={0} width={32} height={32} fill={s} />, <rect key="b" x={0} y={32} width={32} height={32} fill={s} />]
    default:
      return []
  }
}

export const Kit = memo(function Kit({ spec, size = 48, number }: { spec: KitSpec; size?: number; number?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <defs>
        <clipPath id={`k${id}`}>
          <path d={SHIRT} />
        </clipPath>
      </defs>
      <g clipPath={`url(#k${id})`}>
        <rect x={0} y={0} width={64} height={64} fill={spec.primary} />
        {patternEls(spec)}
        <path d="M20 6 C23 11 41 11 44 6" stroke={spec.secondary} strokeWidth={3} fill="none" />
      </g>
      <path d={SHIRT} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth={1.5} strokeLinejoin="round" />
      {number !== undefined && (
        <text x={32} y={42} textAnchor="middle" fontSize={16} fontFamily="Oswald, sans-serif" fontWeight={700} fill={spec.secondary} stroke="rgba(0,0,0,.35)" strokeWidth={0.6}>
          {number}
        </text>
      )}
    </svg>
  )
})

const SHAPES: Record<KitSpec['crest'], string> = {
  escudo: 'M32 4 L56 10 L56 30 C56 46 46 56 32 61 C18 56 8 46 8 30 L8 10 Z',
  circulo: 'M32 4 A28 28 0 1 1 31.9 4 Z',
  rombo: 'M32 3 L60 32 L32 61 L4 32 Z',
  estandarte: 'M10 4 L54 4 L54 50 L32 60 L10 50 Z',
}

const EMBLEMS = [
  'M32 18 l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z',
  'M32 18 a10 10 0 1 0 .1 0z',
  'M22 34 l4-12 6 8 6-8 4 12z',
  'M26 20 h12 v4 h-3 v14 h-6 v-14 h-3z',
  'M20 32 q6-8 12 0 t12 0',
  'M24 22 h16 l-8 16z',
  'M32 18 l12 12-12 12-12-12z',
  'M22 24 h20 v4 h-20z M22 32 h20 v4 h-20z',
  'M26 20 a6 6 0 1 0 12 0 v14 a6 6 0 1 1-12 0z',
  'M20 36 l12-18 12 18z',
  'M24 20 v20 M32 20 v20 M40 20 v20',
  'M22 30 a10 10 0 0 1 20 0 a10 10 0 0 1-20 0z',
]

export const Crest = memo(function Crest({ spec, short, size = 48, club }: { spec?: KitSpec; short?: string; size?: number; club?: ClubId }) {
  if (club) return <img src={CREST_URL[club]} width={size} height={size} alt="" style={{ objectFit: 'contain' }} draggable={false} />
  if (!spec) return null
  const shape = SHAPES[spec.crest]
  const em = EMBLEMS[spec.emblem % EMBLEMS.length]
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <path d={shape} fill={spec.primary} stroke={spec.secondary} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={shape} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={1} transform="translate(32 32) scale(0.82) translate(-32 -32)" />
      <path d={em} fill="none" stroke={spec.secondary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -4)" />
      {short && (
        <text x={32} y={52} textAnchor="middle" fontSize={11} fontFamily="Oswald, sans-serif" fontWeight={700} fill={spec.secondary}>
          {short}
        </text>
      )}
    </svg>
  )
})
