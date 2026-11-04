import type { Action, CardInst, ClubId, RunState, Tier } from '../engine/model/types'
import { dispatch, newRun } from '../engine/api'
import { Ctx } from '../engine/match/ctx'
import { createMatch } from '../engine/match/flow'

export function freshRun(club: ClubId = 'athletic', seed = 'test', exig = 0): RunState {
  return newRun({ seed, club, exig })
}

/**
 * Crea un partido controlado: mazo exacto (en orden de robo: el primero se roba primero),
 * rival concreto y sin trofeos salvo los indicados.
 */
export function matchWith(opts: {
  deck: string[]
  rival?: string
  tier?: Tier
  club?: ClubId
  trofeos?: string[]
  exig?: number
  seed?: string
}): RunState {
  const run = freshRun(opts.club ?? 'athletic', opts.seed ?? 'kit', opts.exig ?? 0)
  run.trofeos = (opts.trofeos ?? []).map(id => ({ id, ctr: 0 }))
  let uid = 1000
  run.deck = opts.deck.map(def => ({ uid: uid++, def, up: false }) as CardInst)
  run.nextUid = 5000
  const ctx = new Ctx(run)
  createMatch(ctx, opts.rival ?? 'r1.villarriba', opts.tier ?? 'liga', 'kit-node')
  // reordenar la mano/mazo de forma determinista: devolver todo al mazo en el orden pedido y robar 5
  const m = ctx.run.screen.k === 'match' ? ctx.run.screen.m : null
  if (!m) throw new Error('sin partido')
  return ctx.run
}

/** Deja la mano exactamente con estas cartas (por def), creando instancias nuevas. */
export function setHand(run: RunState, defs: string[], up = false): number[] {
  const scr = run.screen
  if (scr.k !== 'match') throw new Error('sin partido')
  const m = scr.m
  m.piles.draw.push(...m.piles.hand)
  m.piles.hand = []
  const uids: number[] = []
  for (const def of defs) {
    const uid = run.nextUid++
    m.cards[uid] = { uid, def, up }
    m.piles.hand.push(uid)
    uids.push(uid)
  }
  return uids
}

export function act(run: RunState, a: Action): RunState {
  const r = dispatch(run, a)
  if (r.error) throw new Error(`Acción ${JSON.stringify(a)}: ${r.error}`)
  return r.state
}

export function M(run: RunState) {
  const scr = run.screen
  if (scr.k !== 'match') throw new Error(`no hay partido (${scr.k})`)
  return scr.m
}
