import { useEffect, useMemo, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import type { MatchState, RunState } from '../../engine/model/types'
import { clubDef, rivalDef } from '../../engine/registry'
import { fxBus } from '../store/fx'
import { commentaryFor } from '../commentary'

const W = 600
const H = 360

function formationPoints(f: string, side: 'L' | 'R'): [number, number][] {
  const lines = f.split('-').map(Number).filter(n => n > 0)
  const pts: [number, number][] = []
  const depth = lines.length
  lines.forEach((n, li) => {
    const x = 70 + (li * 200) / Math.max(1, depth - 1 || 1)
    for (let i = 0; i < n; i++) {
      const y = 40 + ((i + 0.5) * (H - 80)) / n
      pts.push([side === 'L' ? x : W - x, y])
    }
  })
  pts.push([side === 'L' ? 22 : W - 22, H / 2])
  return pts
}

export function Pitch({ run, m }: { run: RunState; m: MatchState }) {
  const club = clubDef(run.club)
  const rd = rivalDef(m.rival.def)
  const own = club.colors.primary.toLowerCase() === '#f4f4f4' ? '#ece8da' : club.colors.primary
  const ownLine = club.colors.secondary
  const ball = useAnimationControls()
  const net = useAnimationControls()
  const [line, setLine] = useState<string>(`¡Empieza el partido contra ${rd.name}!`)
  const ownPts = useMemo(() => formationPoints('4-4-2', 'L'), [])
  const rivPts = useMemo(() => formationPoints(rd.formation, 'R'), [rd.formation])
  useEffect(() => {
    void ball.start({ cx: W / 2, cy: H / 2, transition: { duration: 0 } })
    return fxBus.on(ev => {
      const c = commentaryFor(ev, rd.short)
      if (c) setLine(c)
      if (ev.e === 'peligro' && ev.n > 0) {
        const y = 120 + Math.random() * 120
        void ball.start({ cx: [W / 2 - 40, W - 90, W / 2 + 40], cy: [H / 2, y, H / 2 + 20], transition: { duration: 0.42, ease: 'easeOut' } })
      }
      if (ev.e === 'goal' && ev.side === 'player') {
        void ball.start({ cx: [W / 2, W - 8], cy: [H / 2, H / 2 + (Math.random() - 0.5) * 40], transition: { duration: 0.35, ease: 'easeIn' } }).then(() =>
          ball.start({ cx: W / 2, cy: H / 2, transition: { delay: 1.4, duration: 0.3 } }),
        )
        void net.start({ x: [0, 6, -2, 0], transition: { duration: 0.5, delay: 0.3 } })
      }
      if (ev.e === 'ocasion' && ev.n > 0) {
        if (ev.saved)
          void ball.start({ cx: [W / 2 + 60, 70, 180], cy: [H / 2, H / 2 - 30, 40], transition: { duration: 0.6, ease: 'easeOut' } })
        else void ball.start({ cx: [W / 2 + 60, 8], cy: [H / 2, H / 2 + 10], transition: { duration: 0.45, ease: 'easeIn' } })
      }
      if (ev.e === 'ataque') void ball.start({ cx: [W / 2 + 40, 160, W / 2], cy: [H / 2, H / 2 + 40, H / 2], transition: { duration: 0.45 } })
      if (ev.e === 'turnStart') void ball.start({ cx: W / 2, cy: H / 2, transition: { duration: 0.3 } })
    })
  }, [ball, net, rd.short])
  const chalk = 'rgba(242,239,227,.55)'
  return (
    <div className="pitch-wrap">
      <svg className="pitch" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id="mow" width="80" height={H} patternUnits="userSpaceOnUse">
            <rect width="40" height={H} fill="rgba(255,255,255,.03)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#mow)" />
        <g stroke={chalk} strokeWidth={2} fill="none">
          <rect x={8} y={8} width={W - 16} height={H - 16} />
          <line x1={W / 2} y1={8} x2={W / 2} y2={H - 8} />
          <circle cx={W / 2} cy={H / 2} r={46} />
          <rect x={8} y={H / 2 - 90} width={90} height={180} />
          <rect x={8} y={H / 2 - 40} width={32} height={80} />
          <rect x={W - 98} y={H / 2 - 90} width={90} height={180} />
          <rect x={W - 40} y={H / 2 - 40} width={32} height={80} />
        </g>
        <motion.g animate={net}>
          <rect x={W - 8} y={H / 2 - 28} width={8} height={56} fill="rgba(255,255,255,.15)" stroke="#fff" strokeWidth={2} />
        </motion.g>
        <rect x={0} y={H / 2 - 28} width={8} height={56} fill="rgba(255,255,255,.15)" stroke="#fff" strokeWidth={2} />
        {ownPts.map(([x, y], i) => (
          <circle key={`o${i}`} cx={x} cy={y} r={10} fill={own} stroke={ownLine} strokeWidth={2.5} opacity={0.92} />
        ))}
        {rivPts.map(([x, y], i) => (
          <g key={`x${i}`} stroke={rd.kit.primary === '#ffffff' || rd.kit.primary === '#f4f4f4' ? '#ffd0d0' : rd.kit.primary} strokeWidth={5} strokeLinecap="round" opacity={0.95}>
            <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} />
            <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} />
          </g>
        ))}
        {m.rival.repliegue > 0 && (
          <line x1={W - 120} y1={40} x2={W - 120} y2={H - 40} stroke="#58b2ff" strokeWidth={5} strokeDasharray="10 8" opacity={0.8} />
        )}
        {m.player.block > 0 && (
          <line x1={120} y1={40} x2={120} y2={H - 40} stroke="#58b2ff" strokeWidth={Math.min(12, 3 + m.player.block / 3)} strokeDasharray="14 6" opacity={0.75} />
        )}
        <motion.circle animate={ball} initial={{ cx: W / 2, cy: H / 2 }} r={9} fill="#fff" stroke="#111" strokeWidth={2} />
      </svg>
      <div className="commentary">{line}</div>
    </div>
  )
}
