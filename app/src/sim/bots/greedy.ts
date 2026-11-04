import type { Action, RunState } from '../../engine/model/types'
import type { Bot } from './types'
import { dispatch } from '../../engine/api'
import { Ctx } from '../../engine/match/ctx'
import { previewIntent } from '../../engine/match/rival'
import { runPolicy } from './policy'
import { rand } from '../../engine/core/rng'

/** Valoración de un estado de partido desde el punto de vista del jugador. */
export function evalMatch(run: RunState): number {
  const scr = run.screen
  if (scr.k !== 'match') return run.screen.k === 'ended' ? -1e6 : 0
  const m = scr.m
  if (m.phase === 'ended') {
    if (m.result === 'victoria') return 1e5 + run.forma * 10
    if (m.result === 'empate') return 2e4 + run.forma * 10
    return -1e5
  }
  const ctx = new Ctx(run)
  let s = 0
  s += (m.score.f - m.score.a) * 3000
  const seg = m.rival.segs[m.rival.seg] ?? 1
  s += ((seg - m.rival.defensa) / seg) * 900
  s -= m.rival.repliegue * 4
  s += run.forma * 12
  // amenaza del turno rival
  if (m.phase === 'player') {
    const parts = previewIntent(ctx)
    let block = m.player.block
    for (const p of parts) {
      if (p.k === 'ocasion' && !p.cancelled) {
        if (block >= (p.n ?? 0)) {
          s += 2200
          block -= p.n ?? 0
        } else {
          s -= m.score.a + 1 >= m.meta ? 50000 : 2400
        }
      }
    }
    for (const p of parts) {
      if (p.k === 'ataque') {
        const total = (p.n ?? 0) * (p.hits ?? 1)
        const taken = Math.max(0, total - block)
        block = Math.max(0, block - total)
        s -= taken * 12
      }
    }
  }
  for (const r of Object.values(m.player.res)) s += r * 15
  for (const st of m.player.st) {
    if (st.id === 'confianza' || st.id === 'solidez') s += st.n * 40
  }
  for (const st of m.rival.st) {
    if (st.id === 'desorganizado' || st.id === 'fatiga') s += st.n * 30
    if (st.id === 'confianza') s -= st.n * 40
  }
  s += m.piles.sistemas.length * 60
  return s
}

export const greedyBot: Bot = {
  name: 'greedy',
  decide(state, legal, rng) {
    const scr = state.screen
    if (scr.k !== 'match') return runPolicy(state, legal, rng)
    const m = scr.m
    if (m.phase === 'ended') return { t: 'proceed' }
    if (m.phase === 'charla') return legal[Math.floor(rand(rng) * legal.length)]
    if (m.phase === 'penalties') {
      const tell = m.pens?.tell ?? 'C'
      if (m.pens?.next === 'player') {
        const opts = (['L', 'C', 'R'] as const).filter(d => d !== tell)
        return { t: 'penalty', dir: opts[Math.floor(rand(rng) * 2)] }
      }
      return { t: 'penalty', dir: tell }
    }
    let best: Action = legal.find(a => a.t === 'endTurn') ?? legal[0]
    const endScore = legal.some(a => a.t === 'endTurn') ? evalMatch(state) : -Infinity
    let bs = endScore + 1
    for (const a of legal) {
      if (a.t === 'endTurn' || a.t === 'cambio') continue
      if (a.t === 'consumible') continue
      const r = dispatch(state, a)
      if (r.error) continue
      const v = evalMatch(r.state)
      if (v > bs) {
        bs = v
        best = a
      }
    }
    // cambios: soltar estados injugables
    if (best.t === 'endTurn') {
      const est = legal.find(a => a.t === 'cambio' && scr.m.cards[a.uid] && scr.m.cards[a.uid].def.startsWith('est.'))
      if (est) return est
      // consumibles en partidos importantes o si el rival va a marcar el gol decisivo
      const cons = legal.find(a => a.t === 'consumible')
      if (cons && (m.tier !== 'liga' || evalMatch(state) < -20000)) return cons
    }
    return best
  },
}
