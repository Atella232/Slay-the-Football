import type { Action, GameEvent, RunState } from './model/types'
import type { Frame } from './match/ctx'
import { Ctx } from './match/ctx'
import { clone } from './core/clone'
import { EngineError } from './core/assert'
import { C, consumibleDef } from './registry'
import { cambio, chooseCharla, endTurn, kickPenalty, playCard, resolvePending, consumeItem } from './match/actions'
import { playability } from './match/cards'
import { pickCandidates } from './match/queue'
import {
  afterMatch,
  buy,
  chooseEvent,
  deckPickCandidates,
  endRun,
  enterNode,
  execRunOps,
  optionAvailable,
  proceed,
  reachableNodes,
  removeService,
  resolveCardChoice,
  resolveDeckPick,
  rest,
  takeReward,
  takeTreasure,
  upgradable,
} from './run/run'
import { hasRunMod } from './match/modifiers'

export interface DispatchResult {
  state: RunState
  events: GameEvent[]
  frames: Frame[] | null
  error?: string
}

export interface DispatchOpts {
  frames?: boolean
  /** Muta el estado de entrada (simulador). */
  inPlace?: boolean
}

export function dispatch(state: RunState, action: Action, opts: DispatchOpts = {}): DispatchResult {
  const work = opts.inPlace ? state : clone(state)
  const ctx = new Ctx(work, { frames: opts.frames })
  try {
    apply(ctx, action)
  } catch (err) {
    if (err instanceof EngineError) {
      return { state, events: [], frames: null, error: err.message }
    }
    throw err
  }
  return { state: work, events: ctx.events, frames: ctx.frames }
}

function apply(ctx: Ctx, a: Action): void {
  const run = ctx.run
  const scr = run.screen
  if (a.t === 'abandon') {
    endRun(ctx, 'abandono')
    return
  }
  if (a.t === 'dropConsumible') {
    if (!run.consumibles[a.slot]) throw new EngineError('Hueco vacío')
    run.consumibles[a.slot] = null
    return
  }
  if (scr.k === 'match') {
    const m = scr.m
    if (m.phase === 'ended') {
      if (a.t !== 'proceed') throw new EngineError('El partido ha terminado')
      afterMatch(ctx)
      return
    }
    switch (a.t) {
      case 'play': playCard(ctx, a.uid); break
      case 'endTurn': endTurn(ctx); break
      case 'cambio': cambio(ctx, a.uid); break
      case 'consumible': consumeItem(ctx, a.slot); break
      case 'resolve': resolvePending(ctx, a.pick); break
      case 'charla': chooseCharla(ctx, a.i); break
      case 'penalty': kickPenalty(ctx, a.dir); break
      default: throw new EngineError(`Acción ${a.t} no válida en partido`)
    }
    return
  }
  if (a.t === 'consumible') {
    const id = run.consumibles[a.slot]
    if (!id) throw new EngineError('Hueco vacío')
    const d = consumibleDef(id)
    if (!d.runOps) throw new EngineError('Sólo se puede usar en partido')
    run.consumibles[a.slot] = null
    execRunOps(ctx, d.runOps)
    return
  }
  switch (scr.k) {
    case 'map':
      if (a.t !== 'node') throw new EngineError('Elige un nodo del mapa')
      enterNode(ctx, a.id)
      return
    case 'reward':
      if (a.t === 'take') return takeReward(ctx, a.i, a.choice)
      if (a.t === 'proceed') return proceed(ctx)
      break
    case 'shop':
      if (a.t === 'buy') return buy(ctx, a.i)
      if (a.t === 'removeService') return removeService(ctx)
      if (a.t === 'proceed') return proceed(ctx)
      break
    case 'event':
      if (a.t === 'event') return chooseEvent(ctx, a.i)
      if (a.t === 'proceed') return proceed(ctx)
      break
    case 'rest':
      if (a.t === 'rest') return rest(ctx, a.o)
      if (a.t === 'proceed') return proceed(ctx)
      break
    case 'treasure':
      if (a.t === 'take') return takeTreasure(ctx)
      if (a.t === 'proceed') return proceed(ctx)
      break
    case 'deckPick':
      if (a.t === 'deckPick') return resolveDeckPick(ctx, a.uids)
      break
    case 'cardChoice':
      if (a.t === 'cardChoice') return resolveCardChoice(ctx, a.i)
      break
    case 'actEnd':
      if (a.t === 'proceed') return proceed(ctx)
      break
    case 'ended':
      throw new EngineError('La run ha terminado')
  }
  throw new EngineError(`Acción ${a.t} no válida en ${scr.k}`)
}

/** Acciones legales (para bots, tests y UI). Las elecciones combinatorias se simplifican. */
export function legalActions(state: RunState): Action[] {
  const out: Action[] = []
  const scr = state.screen
  const ctx = new Ctx(state)
  switch (scr.k) {
    case 'match': {
      const m = scr.m
      if (m.phase === 'ended') return [{ t: 'proceed' }]
      if (m.phase === 'charla') return (m.charlas ?? []).map((_, i) => ({ t: 'charla', i }) as Action)
      if (m.phase === 'penalties') return (['L', 'C', 'R'] as const).map(dir => ({ t: 'penalty', dir }) as Action)
      if (m.pending) {
        const p = m.pending
        if (p.kind === 'choose') return (p.options ?? []).map((_, i) => ({ t: 'resolve', pick: [i] }) as Action)
        const cands = pickCandidates(ctx, p.from!, { f: p.f })
        // opciones simples: cada carta individual, o el mínimo requerido
        if (p.min <= 1) for (const uid of cands) out.push({ t: 'resolve', pick: [uid] })
        if (p.min === 0) out.push({ t: 'resolve', pick: [] })
        if (p.min > 1) out.push({ t: 'resolve', pick: cands.slice(0, p.min) })
        return out
      }
      for (const uid of m.piles.hand) if (playability(ctx, uid).ok) out.push({ t: 'play', uid })
      if (m.player.cambios > 0) for (const uid of m.piles.hand) out.push({ t: 'cambio', uid })
      state.consumibles.forEach((id, slot) => {
        if (id && consumibleDef(id).ops?.length) out.push({ t: 'consumible', slot })
      })
      out.push({ t: 'endTurn' })
      return out
    }
    case 'map':
      return reachableNodes(state).map(id => ({ t: 'node', id }) as Action)
    case 'reward': {
      scr.r.items.forEach((it, i) => {
        if (it.taken) return
        if (it.kind === 'cards') it.cards?.forEach((_, c) => out.push({ t: 'take', i, choice: c }))
        else if (it.kind === 'trofeoChoice') it.trofeos?.forEach((_, c) => out.push({ t: 'take', i, choice: c }))
        else if (it.kind === 'consumible') {
          if (state.consumibles.includes(null)) out.push({ t: 'take', i })
        } else out.push({ t: 'take', i })
      })
      out.push({ t: 'proceed' })
      return out
    }
    case 'shop':
      scr.s.items.forEach((it, i) => {
        if (!it.sold && state.gold >= it.price && (it.kind !== 'consumible' || state.consumibles.includes(null))) out.push({ t: 'buy', i })
      })
      if (!scr.s.removeUsed && state.gold >= scr.s.removePrice) out.push({ t: 'removeService' })
      out.push({ t: 'proceed' })
      return out
    case 'event': {
      if (scr.e.done) return [{ t: 'proceed' }]
      const ev = C().events[scr.e.id]
      ev.options.forEach((_, i) => {
        if (optionAvailable(state, ev, i)) out.push({ t: 'event', i })
      })
      return out
    }
    case 'rest':
      if (scr.done) return [{ t: 'proceed' }]
      if (!hasRunMod(state, 'noRest')) out.push({ t: 'rest', o: 'heal' })
      if (upgradable(state).length) out.push({ t: 'rest', o: 'entrenar' })
      out.push({ t: 'proceed' })
      return out
    case 'treasure':
      if (!scr.taken) out.push({ t: 'take', i: 0 })
      out.push({ t: 'proceed' })
      return out
    case 'deckPick': {
      const cands = deckPickCandidates(state, scr.p.purpose)
      const n = Math.min(scr.p.n, cands.length)
      if (n === 1) for (const c of cands) out.push({ t: 'deckPick', uids: [c.uid] })
      else out.push({ t: 'deckPick', uids: cands.slice(0, n).map(c => c.uid) })
      return out
    }
    case 'cardChoice':
      scr.c.cards.forEach((_, i) => out.push({ t: 'cardChoice', i }))
      out.push({ t: 'cardChoice', i: -1 })
      return out
    case 'actEnd':
      return [{ t: 'proceed' }]
    case 'ended':
      return []
  }
}

export { newRun } from './run/run'
