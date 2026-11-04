import { memo, useId, type ReactElement } from 'react'
import type { DiagramTpl } from '../../engine/model/types'
import { hashString } from '../../engine/core/rng'

// ───────────── Pizarra táctica procedural ─────────────
// Cada carta usa una plantilla + una semilla (hash del id) para variar el dibujo.

const W = 200
const H = 112

type Pt = [number, number]

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type R = () => number

/** Trazo de tiza: polilínea con pequeñas irregularidades y suavizado. */
function chalk(points: Pt[], r: R, wobble = 0.9): string {
  const pts: Pt[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const len = Math.hypot(x2 - x1, y2 - y1)
    const steps = Math.max(2, Math.round(len / 9))
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      pts.push([x1 + (x2 - x1) * t + (r() - 0.5) * wobble, y1 + (y2 - y1) * t + (r() - 0.5) * wobble])
    }
  }
  pts.push(points[points.length - 1])
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  const last = pts[pts.length - 1]
  d += ` L${last[0].toFixed(1)} ${last[1].toFixed(1)}`
  return d
}

function curve(a: Pt, b: Pt, bend: number): Pt[] {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const c: Pt = [mx - dy * bend, my + dx * bend]
  const out: Pt[] = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]])
  }
  return out
}

function wavy(a: Pt, b: Pt): Pt[] {
  const out: Pt[] = []
  const n = 10
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const off = Math.sin(t * Math.PI * 4) * 3 * (i === 0 || i === n ? 0 : 1)
    out.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off])
  }
  return out
}

interface Ctx {
  r: R
  own: string
  rival: string
  els: ReactElement[]
  k: number
}

function key(c: Ctx) {
  return c.k++
}

const CHALK = '#f3f1e7'

function line(c: Ctx, pts: Pt[], opts: { dash?: boolean; width?: number; color?: string; arrow?: boolean; opacity?: number } = {}) {
  const d = chalk(pts, c.r)
  const color = opts.color ?? CHALK
  const w = opts.width ?? 1.6
  c.els.push(<path key={key(c)} d={d} stroke={color} strokeOpacity={0.25 * (opts.opacity ?? 1)} strokeWidth={w + 1.6} fill="none" strokeLinecap="round" strokeDasharray={opts.dash ? '5 4' : undefined} />)
  c.els.push(<path key={key(c)} d={d} stroke={color} strokeOpacity={0.92 * (opts.opacity ?? 1)} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={opts.dash ? '5 4' : undefined} />)
  if (opts.arrow) {
    const b = pts[pts.length - 1]
    const a = pts[pts.length - 2]
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
    const s = 6
    const p1: Pt = [b[0] - s * Math.cos(ang - 0.45), b[1] - s * Math.sin(ang - 0.45)]
    const p2: Pt = [b[0] - s * Math.cos(ang + 0.45), b[1] - s * Math.sin(ang + 0.45)]
    c.els.push(<path key={key(c)} d={`M${p1[0]} ${p1[1]} L${b[0]} ${b[1]} L${p2[0]} ${p2[1]}`} stroke={color} strokeOpacity={0.95 * (opts.opacity ?? 1)} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />)
  }
}

function O(c: Ctx, p: Pt, label?: string) {
  c.els.push(<circle key={key(c)} cx={p[0]} cy={p[1]} r={5.2} fill={c.own} stroke={CHALK} strokeWidth={1.3} />)
  if (label) c.els.push(<text key={key(c)} x={p[0]} y={p[1] + 2.3} fontSize={6.5} textAnchor="middle" fill="#111" fontWeight={700}>{label}</text>)
}

function X(c: Ctx, p: Pt) {
  const s = 4.2
  line(c, [[p[0] - s, p[1] - s], [p[0] + s, p[1] + s]], { color: c.rival, width: 2 })
  line(c, [[p[0] + s, p[1] - s], [p[0] - s, p[1] + s]], { color: c.rival, width: 2 })
}

function ball(c: Ctx, p: Pt) {
  c.els.push(<circle key={key(c)} cx={p[0]} cy={p[1]} r={2.8} fill="#fff" stroke="#111" strokeWidth={0.8} />)
}

function goalRight(c: Ctx) {
  line(c, [[W - 6, 36], [W - 6, 76]], { width: 2.4 })
  line(c, [[W - 6, 36], [W - 1, 38]], { width: 1 })
  line(c, [[W - 6, 76], [W - 1, 74]], { width: 1 })
}

function goalLeft(c: Ctx) {
  line(c, [[6, 36], [6, 76]], { width: 2.4 })
}

function zone(c: Ctx, pts: Pt[], color = CHALK, id: string) {
  const d = 'M' + pts.map(p => `${p[0]} ${p[1]}`).join(' L') + ' Z'
  c.els.push(<path key={key(c)} d={d} fill={`url(#${id})`} stroke={color} strokeOpacity={0.5} strokeDasharray="3 3" strokeWidth={1} />)
}

/** Fondo: campo con líneas según la zona. */
function pitch(c: Ctx, area: 'attack' | 'defense' | 'mid' | 'full') {
  const o = 0.35
  if (area === 'attack') {
    line(c, [[W - 6, 6], [W - 6, H - 6]], { opacity: o })
    line(c, [[W - 6, 22], [W - 46, 22], [W - 46, H - 22], [W - 6, H - 22]], { opacity: o })
    line(c, [[W - 6, 40], [W - 20, 40], [W - 20, H - 40], [W - 6, H - 40]], { opacity: o })
    line(c, [[24, 6], [24, H - 6]], { opacity: o * 0.6 })
    goalRight(c)
  } else if (area === 'defense') {
    line(c, [[6, 6], [6, H - 6]], { opacity: o })
    line(c, [[6, 22], [46, 22], [46, H - 22], [6, H - 22]], { opacity: o })
    line(c, [[6, 40], [20, 40], [20, H - 40], [6, H - 40]], { opacity: o })
    goalLeft(c)
  } else if (area === 'mid') {
    line(c, [[W / 2, 6], [W / 2, H - 6]], { opacity: o })
    const circ: Pt[] = []
    for (let i = 0; i <= 24; i++) circ.push([W / 2 + Math.cos((i / 24) * Math.PI * 2) * 20, H / 2 + Math.sin((i / 24) * Math.PI * 2) * 20])
    line(c, circ, { opacity: o })
  } else {
    line(c, [[W / 2, 6], [W / 2, H - 6]], { opacity: o })
    line(c, [[6, 30], [30, 30], [30, H - 30], [6, H - 30]], { opacity: o })
    line(c, [[W - 6, 30], [W - 30, 30], [W - 30, H - 30], [W - 6, H - 30]], { opacity: o })
    goalLeft(c)
    goalRight(c)
  }
}

function jit(c: Ctx, p: Pt, j = 8): Pt {
  return [p[0] + (c.r() - 0.5) * j, p[1] + (c.r() - 0.5) * j]
}

type Tpl = (c: Ctx, hatch: string) => void

const TEMPLATES: Record<DiagramTpl, Tpl> = {
  disparo: c => {
    pitch(c, 'attack')
    const s = jit(c, [118, 40 + c.r() * 32], 10)
    X(c, jit(c, [160, 50]))
    X(c, jit(c, [150, 75]))
    O(c, s)
    ball(c, [s[0] + 6, s[1] + 3])
    line(c, curve([s[0] + 8, s[1] + 3], [W - 9, 44 + c.r() * 24], 0.12 * (c.r() > 0.5 ? 1 : -1)), { arrow: true, width: 2 })
  },
  cabezazo: c => {
    pitch(c, 'attack')
    const from: Pt = [130, 8]
    const head = jit(c, [W - 30, 52], 8)
    line(c, curve(from, head, -0.25), { dash: true, arrow: true })
    O(c, head)
    X(c, jit(c, [W - 36, 64]))
    X(c, jit(c, [W - 26, 40]))
    line(c, [[head[0] + 4, head[1]], [W - 9, head[1] + (c.r() - 0.5) * 16]], { arrow: true, width: 2 })
    ball(c, [head[0], head[1] - 7])
  },
  paseLargo: c => {
    pitch(c, 'full')
    const a = jit(c, [40, 70])
    const b = jit(c, [150, 30])
    O(c, a)
    O(c, b)
    X(c, jit(c, [100, 55]))
    X(c, jit(c, [125, 72]))
    ball(c, [a[0] + 6, a[1]])
    line(c, curve([a[0] + 6, a[1] - 3], [b[0] - 6, b[1]], -0.2), { dash: true, arrow: true })
  },
  triangulo: c => {
    pitch(c, 'mid')
    const a = jit(c, [70, 70])
    const b = jit(c, [105, 30])
    const d = jit(c, [140, 72])
    O(c, a)
    O(c, b)
    O(c, d)
    X(c, jit(c, [105, 60]))
    line(c, [a, b], { dash: true, arrow: true })
    line(c, [b, d], { dash: true, arrow: true })
    line(c, [d, [a[0] + 40, a[1] + 8]], { dash: true, arrow: true, opacity: 0.6 })
    ball(c, [a[0], a[1] - 7])
  },
  rondo: (c, hatch) => {
    pitch(c, 'mid')
    const cx = W / 2 + (c.r() - 0.5) * 20
    const cy = H / 2
    zone(c, [[cx - 38, cy - 34], [cx + 38, cy - 34], [cx + 38, cy + 34], [cx - 38, cy + 34]], CHALK, hatch)
    const n = 5
    const pts: Pt[] = []
    for (let i = 0; i < n; i++) pts.push([cx + Math.cos((i / n) * Math.PI * 2) * 30, cy + Math.sin((i / n) * Math.PI * 2) * 26])
    pts.forEach(p => O(c, p))
    X(c, [cx - 6, cy])
    X(c, [cx + 8, cy + 4])
    line(c, [pts[0], pts[2]], { dash: true, arrow: true })
    line(c, [pts[2], pts[4]], { dash: true, arrow: true, opacity: 0.6 })
  },
  regate: c => {
    pitch(c, 'attack')
    const a = jit(c, [70, 56])
    O(c, a)
    X(c, jit(c, [110, 52]))
    X(c, jit(c, [140, 62]))
    line(c, wavy([a[0] + 6, a[1]], [160, 50]), { arrow: true, width: 1.8 })
    ball(c, [a[0] + 7, a[1] + 4])
  },
  contra: c => {
    pitch(c, 'full')
    const a = jit(c, [30, 60])
    const b = jit(c, [80, 30])
    const d = jit(c, [80, 85])
    O(c, a)
    O(c, b)
    O(c, d)
    line(c, [[b[0] + 6, b[1]], [160, 38]], { arrow: true })
    line(c, [[d[0] + 6, d[1]], [165, 72]], { arrow: true })
    line(c, curve([a[0] + 6, a[1]], [130, 40], -0.15), { dash: true, arrow: true })
    X(c, jit(c, [150, 55]))
    ball(c, [a[0] + 7, a[1] - 3])
  },
  presion: (c, hatch) => {
    pitch(c, 'mid')
    const t = jit(c, [118, 56])
    X(c, t)
    zone(c, [[t[0] - 22, t[1] - 22], [t[0] + 22, t[1] - 22], [t[0] + 22, t[1] + 22], [t[0] - 22, t[1] + 22]], CHALK, hatch)
    const around: Pt[] = [[t[0] - 45, t[1] - 30], [t[0] - 48, t[1] + 26], [t[0] + 30, t[1] - 40]]
    around.forEach(p => {
      O(c, p)
      line(c, [p, [t[0] + (p[0] < t[0] ? -10 : 8), t[1] + (p[1] < t[1] ? -8 : 8)]], { arrow: true })
    })
    ball(c, [t[0] + 7, t[1] + 2])
  },
  lineaAlta: c => {
    pitch(c, 'mid')
    const x = 110 + (c.r() - 0.5) * 10
    const ys = [22, 44, 68, 90]
    ys.forEach(y => O(c, [x, y]))
    line(c, [[x - 2, 10], [x + 1, H - 10]], { dash: true, opacity: 0.7 })
    line(c, [[x - 30, 56], [x - 8, 56]], { arrow: true })
    X(c, jit(c, [x + 18, 50]))
    X(c, jit(c, [x + 24, 78]))
  },
  muro: c => {
    pitch(c, 'defense')
    const x = 40 + c.r() * 8
    for (let i = 0; i < 4; i++) O(c, [x, 36 + i * 12])
    X(c, jit(c, [110, 52]))
    ball(c, [104, 52])
    line(c, curve([100, 50], [x + 8, 44], 0.1), { dash: true, arrow: true, opacity: 0.6 })
  },
  despeje: c => {
    pitch(c, 'defense')
    const a = jit(c, [30, 56], 6)
    O(c, a)
    X(c, jit(c, [44, 40]))
    ball(c, [a[0] + 6, a[1] - 4])
    line(c, curve([a[0] + 7, a[1] - 6], [170, 12], -0.25), { arrow: true, width: 2 })
  },
  parada: c => {
    pitch(c, 'defense')
    const k = jit(c, [12, 50], 4)
    O(c, k, '1')
    X(c, jit(c, [70, 62]))
    line(c, [[64, 60], [16, 44]], { arrow: true, width: 2 })
    line(c, curve([k[0] + 4, k[1] - 6], [k[0] + 2, 30], 0.3), { arrow: true })
    ball(c, [20, 42])
  },
  corner: c => {
    pitch(c, 'attack')
    const corner: Pt = [W - 8, 8]
    O(c, [corner[0] - 4, corner[1] + 4])
    const runs: Pt[] = [jit(c, [W - 34, 46]), jit(c, [W - 28, 66]), jit(c, [W - 44, 58])]
    runs.forEach(p => O(c, p))
    X(c, jit(c, [W - 22, 54]))
    X(c, jit(c, [W - 34, 72]))
    line(c, curve([corner[0] - 8, corner[1] + 6], runs[0], 0.3), { dash: true, arrow: true })
    line(c, [[runs[2][0] - 14, runs[2][1] + 10], runs[2]], { arrow: true, opacity: 0.6 })
  },
  falta: c => {
    pitch(c, 'mid')
    const a = jit(c, [90, 60])
    const b = jit(c, [106, 52])
    O(c, a)
    X(c, b)
    line(c, [[a[0] + 5, a[1] - 2], [b[0] - 4, b[1] + 2]], { arrow: true, width: 2 })
    c.els.push(<rect key={key(c)} x={140} y={18} width={12} height={17} rx={1.5} fill="#f6d33c" stroke="#111" strokeWidth={0.8} transform={`rotate(${(c.r() - 0.5) * 30} 146 26)`} />)
  },
  cambio: c => {
    pitch(c, 'mid')
    const a: Pt = [W / 2 - 18, H - 14]
    const b: Pt = [W / 2 + 18, H - 14]
    O(c, a)
    O(c, b)
    line(c, curve([a[0], a[1] - 8], [a[0], 30], -0.3), { arrow: true })
    line(c, curve([b[0], 30], [b[0], b[1] - 8], -0.3), { arrow: true, dash: true })
    c.els.push(<rect key={key(c)} x={W / 2 - 9} y={12} width={18} height={12} rx={2} fill="#111" stroke={CHALK} strokeWidth={1} />)
    c.els.push(<text key={key(c)} x={W / 2} y={21} fontSize={8} textAnchor="middle" fill="#f6d33c" fontWeight={700}>{1 + Math.floor(c.r() * 23)}</text>)
  },
  banda: c => {
    pitch(c, 'full')
    const a = jit(c, [60, 100], 6)
    O(c, a)
    line(c, [[a[0] + 6, a[1]], [160, 100]], { arrow: true })
    X(c, jit(c, [120, 92]))
    line(c, curve([162, 98], [W - 20, 54], 0.25), { dash: true, arrow: true })
    O(c, jit(c, [W - 26, 56]))
    ball(c, [a[0] + 7, a[1] - 4])
  },
  desmarque: c => {
    pitch(c, 'attack')
    const a = jit(c, [90, 70])
    const b = jit(c, [120, 30])
    O(c, a)
    O(c, b)
    X(c, jit(c, [136, 44]))
    line(c, curve([b[0] + 5, b[1]], [168, 50], 0.2), { arrow: true })
    line(c, curve([a[0] + 5, a[1] - 3], [164, 52], -0.1), { dash: true, arrow: true })
    ball(c, [a[0] + 6, a[1] + 3])
  },
  autobus: (c, hatch) => {
    pitch(c, 'defense')
    zone(c, [[10, 20], [60, 20], [60, H - 20], [10, H - 20]], CHALK, hatch)
    const pos: Pt[] = [[30, 30], [30, 46], [30, 62], [30, 78], [50, 38], [50, 56], [50, 74], [16, 56]]
    pos.forEach(p => O(c, jit(c, p, 3)))
    X(c, jit(c, [100, 46]))
    X(c, jit(c, [110, 70]))
  },
  tiki: c => {
    pitch(c, 'mid')
    const pts: Pt[] = [jit(c, [50, 70]), jit(c, [80, 40]), jit(c, [110, 74]), jit(c, [140, 38]), jit(c, [165, 64])]
    pts.forEach(p => O(c, p))
    for (let i = 0; i < pts.length - 1; i++) line(c, [pts[i], pts[i + 1]], { dash: true, arrow: true })
    X(c, jit(c, [95, 58]))
    X(c, jit(c, [128, 58]))
    ball(c, [pts[0][0], pts[0][1] - 7])
  },
  remontada: c => {
    pitch(c, 'full')
    const ys = [26, 44, 62, 80]
    ys.forEach((y, i) => {
      const a: Pt = [40 + i * 6, y]
      O(c, a)
      line(c, [[a[0] + 6, a[1]], [a[0] + 70 + c.r() * 20, a[1] - 6 + i * 2]], { arrow: true, opacity: 0.9 })
    })
    c.els.push(<text key={key(c)} x={W - 40} y={26} fontSize={14} textAnchor="middle" fill={CHALK} fontFamily="Kalam, cursive" opacity={0.9}>90'</text>)
  },
  estado: c => {
    pitch(c, 'mid')
    const a = jit(c, [W / 2, H / 2], 6)
    O(c, a)
    line(c, [[a[0] - 16, a[1] - 16], [a[0] + 16, a[1] + 16]], { color: '#ff8a80', width: 2.4 })
    line(c, [[a[0] + 16, a[1] - 16], [a[0] - 16, a[1] + 16]], { color: '#ff8a80', width: 2.4 })
  },
  sistema: (c, hatch) => {
    pitch(c, 'full')
    const forms = [[4, 4, 2], [4, 3, 3], [3, 5, 2], [4, 2, 3, 1]]
    const f = forms[Math.floor(c.r() * forms.length)]
    const cols = f.length
    f.forEach((n, ci) => {
      for (let i = 0; i < n; i++) {
        const x = 30 + ci * (130 / cols)
        const y = 14 + ((i + 0.5) * (H - 28)) / n
        O(c, jit(c, [x, y], 3))
      }
    })
    O(c, [12, H / 2], '1')
    zone(c, [[W / 2 + 10, 20], [W - 14, 20], [W - 14, H - 20], [W / 2 + 10, H - 20]], CHALK, hatch)
  },
}

export const Diagram = memo(function Diagram({ tpl, seed, own, rival = '#ff8a80', className }: { tpl: DiagramTpl; seed: string; own: string; rival?: string; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const hatch = `h${uid}`
  const c: Ctx = { r: mulberry(hashString(seed)), own, rival, els: [], k: 0 }
  TEMPLATES[tpl](c, hatch)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={CHALK} strokeOpacity="0.18" strokeWidth="2" />
        </pattern>
      </defs>
      {c.els}
    </svg>
  )
})
