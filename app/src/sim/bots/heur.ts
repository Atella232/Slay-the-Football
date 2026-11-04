import type { Action, RunState } from '../../engine/model/types'
import type { Bot } from './types'
import { dispatch, legalActions } from '../../engine/api'
import { evalMatch, greedyBot } from './greedy'
import { runPolicy } from './policy'

function inTurnCandidates(s: RunState): Action[] {
  return legalActions(s).filter(a => a.t === 'play' || a.t === 'resolve' || (a.t === 'consumible' && s.screen.k === 'match' && s.screen.m.tier !== 'liga'))
}

/** Completa el turno de forma voraz y devuelve la valoración final. */
function rollout(s0: RunState): number {
  let s = s0
  for (let guard = 0; guard < 12; guard++) {
    if (s.screen.k !== 'match' || s.screen.m.phase !== 'player') break
    const base = s.screen.m.pending ? -Infinity : evalMatch(s)
    let best: RunState | null = null
    let bv = base
    for (const a of inTurnCandidates(s)) {
      const r = dispatch(s, a)
      if (r.error) continue
      const v = evalMatch(r.state)
      if (v > bv) {
        bv = v
        best = r.state
      }
    }
    if (!best) break
    s = best
  }
  return evalMatch(s)
}

export const heurBot: Bot = {
  name: 'heur',
  decide(state, legal, rng) {
    const scr = state.screen
    if (scr.k !== 'match') return runPolicy(state, legal, rng)
    const m = scr.m
    if (m.phase !== 'player') return greedyBot.decide(state, legal, rng)
    let best: Action = legal.find(a => a.t === 'endTurn') ?? legal[0]
    let bv = m.pending ? -Infinity : evalMatch(state) + 1
    for (const a of legal) {
      if (a.t === 'endTurn' || a.t === 'cambio') continue
      if (a.t === 'consumible' && m.tier === 'liga' && evalMatch(state) > -20000) continue
      const r = dispatch(state, a)
      if (r.error) continue
      const v = rollout(r.state)
      if (v > bv) {
        bv = v
        best = a
      }
    }
    if (best.t === 'endTurn') {
      const est = legal.find(a => a.t === 'cambio' && m.cards[a.uid] && m.cards[a.uid].def.startsWith('est.'))
      if (est) return est
    }
    return best
  },
}
