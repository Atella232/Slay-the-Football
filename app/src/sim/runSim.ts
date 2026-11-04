import type { Action, ClubId, RunState } from '../engine/model/types'
import type { Bot } from './bots/types'
import { dispatch, legalActions, newRun } from '../engine/api'
import { seedRng } from '../engine/core/rng'
import { checkInvariants } from './invariants'

export interface SimResult {
  seed: string
  club: ClubId
  outcome: string
  act: number
  floors: number
  actions: number
  stats: RunState['stats']
  errors: string[]
  matchLog: { rival: string; act: number; tier: string; result: string; turns: number; f: number; a: number; prorroga: boolean; pens: boolean; formaLost: number }[]
  final: RunState
}

export function simulateRun(opts: { seed: string; club: ClubId; exig?: number; bot: Bot; maxActions?: number; checkEvery?: number }): SimResult {
  let state = newRun({ seed: opts.seed, club: opts.club, exig: opts.exig ?? 0 })
  const rng = seedRng(opts.seed, 'bot', opts.bot.name)
  const errors: string[] = []
  const matchLog: SimResult['matchLog'] = []
  const max = opts.maxActions ?? 20000
  let n = 0
  const check = opts.checkEvery ?? 1
  while (state.screen.k !== 'ended' && n < max) {
    const legal = legalActions(state)
    if (legal.length === 0) {
      errors.push(`Sin acciones en ${state.screen.k}`)
      break
    }
    const a: Action = opts.bot.decide(state, legal, rng)
    const before = state.screen
    const res = dispatch(state, a, { inPlace: true })
    if (res.error) {
      errors.push(`Acción ${JSON.stringify(a)} rechazada: ${res.error}`)
      break
    }
    state = res.state
    if (before.k === 'match' && before.m.phase === 'ended' && a.t === 'proceed') {
      const m = before.m
      matchLog.push({ rival: m.rival.def, act: before.k === 'match' ? Number(m.rival.def[1]) : 0, tier: m.tier, result: m.result ?? '?', turns: m.turn, f: m.score.f, a: m.score.a, prorroga: m.prorroga, pens: !!m.pens, formaLost: m.stats.formaLost })
    }
    n++
    if (check && n % check === 0) {
      const errs = checkInvariants(state)
      if (errs.length) {
        errors.push(...errs.map(e => `[acción ${n} ${JSON.stringify(a)}] ${e}`))
        break
      }
    }
  }
  if (n >= max) errors.push('Límite de acciones alcanzado')
  const outcome = state.screen.k === 'ended' ? state.screen.outcome : 'incompleta'
  return { seed: opts.seed, club: opts.club, outcome, act: state.act, floors: state.stats.floors, actions: n, stats: state.stats, errors, matchLog, final: state }
}
