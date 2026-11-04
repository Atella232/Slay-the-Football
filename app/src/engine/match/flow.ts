import type { Ctx } from './ctx'
import type { CardInst, EffectOp, MatchState, Pile, Tier } from '../model/types'
import { C, cardDef, rivalDef } from '../registry'
import { sample, seedRng, shuffle } from '../core/rng'
import { clone } from '../core/clone'
import { drawCards, discardCard, exhaustCard, kwOf } from './cards'
import { fire } from './hooks'
import { drain, enqueueOps } from './queue'
import { addStatus, endMatch, ended, gainRepliegue, resolveAtaque, resolveOcasion } from './combat'
import { playerStat, segmentScale } from './modifiers'
import { getStatus, setStatusRaw, tickStatuses } from './status'
import { chooseIntent } from './rival'
import { startPenalties } from './penalties'

export const BASE_ENERGY = 3
export const BASE_DRAW = 5
export const BASE_CAMBIOS = 3
export const REGULATION_TURNS = 8
export const HALFTIME_AFTER = 4
export const RETAIN_CAP = 15

export function minuteOf(m: MatchState): number {
  if (m.prorroga) return 90 + (m.turn - REGULATION_TURNS) * 15
  const t = m.turn
  if (t <= HALFTIME_AFTER) return 1 + (t - 1) * 11
  if (t <= REGULATION_TURNS) return 46 + (t - HALFTIME_AFTER - 1) * 11
  return 90
}

export function createMatch(ctx: Ctx, rivalId: string, tier: Tier, nodeId: string): void {
  const run = ctx.run
  const rd = rivalDef(rivalId)
  const scale = segmentScale(run, tier === 'amistoso' ? 'liga' : tier)
  const segs = rd.segments.map(s => Math.max(1, Math.floor((s * scale) / 100)))
  const rng = seedRng(run.seed, 'match', run.act, nodeId, run.stats.matches)
  const cards: Record<number, CardInst> = {}
  const draw: number[] = []
  for (const c of run.deck) {
    cards[c.uid] = { uid: c.uid, def: c.def, up: c.up }
    draw.push(c.uid)
  }
  shuffle(rng, draw)
  // las cartas Inicial van arriba (final del array = cima)
  const innate = draw.filter(uid => (cardDef(cards[uid].def).kw ?? []).includes('inicial'))
  const rest = draw.filter(uid => !innate.includes(uid))
  const piles: Record<Pile, number[]> = { draw: [...rest, ...innate], hand: [], discard: [], agotadas: [], sistemas: [] }
  const m: MatchState = {
    rival: {
      def: rd.id,
      seg: 0,
      segs,
      defensa: segs[0],
      repliegue: 0,
      st: (rd.rivalStatuses ?? []).map(s => ({ id: s.id, n: s.n, fresh: false })),
      intent: null,
      intentId: null,
      history: [],
      aiPhase: 0,
      kickoffLock: false,
      cancelledOcasion: false,
      ocasionMod: 0,
      ataqueMod: 0,
    },
    tier,
    meta: rd.meta ?? Math.min(segs.length, tier === 'liga' || tier === 'amistoso' ? 2 : 3),
    nodeId,
    turn: 0,
    maxTurns: REGULATION_TURNS,
    added: 0,
    prorroga: false,
    phase: 'player',
    score: { f: 0, a: 0 },
    player: {
      block: 0,
      energy: 0,
      cambios: BASE_CAMBIOS,
      st: [],
      res: { garra: 0, posesion: 0, momentum: 0 },
      freeNext: [],
      playTwice: [],
      retainBlock: 0,
      drawBonusNext: 0,
      energyBonusNext: 0,
    },
    cards,
    piles,
    limbo: [],
    forceExhaust: [],
    queue: [],
    pending: null,
    turnCtr: freshCounters(),
    hookUse: {},
    rng,
    pens: null,
    charlas: null,
    result: null,
    stats: {
      turns: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      paradas: 0,
      ocasionesRival: 0,
      formaLost: 0,
      cardsPlayed: 0,
      peligroTotal: 0,
      peligroLost: 0,
      energyUnused: 0,
      cambiosUsed: 0,
      maxDeficit: 0,
      bestTurnPeligro: 0,
    },
    log: [],
  }
  // Exigencia: rivales de liga con confianza, copa con repliegue inicial
  if (run.exig >= 7 && tier === 'liga') m.rival.st.push({ id: 'confianza', n: 1, fresh: false })
  run.screen = { k: 'match', m }
  m.player.cambios += Math.max(0, playerStat(ctx, 'cambios'))
  ctx.emit({ e: 'screen', k: 'match' })
  if (rd.startRepliegue) m.rival.repliegue = rd.startRepliegue
  if (run.exig >= 9 && tier === 'copa') m.rival.repliegue += 6
  ctx.log(`Empieza el partido contra ${rd.name}.`)
  chooseIntent(ctx)
  beginTurn(ctx, true)
}

function freshCounters(): MatchState['turnCtr'] {
  return {
    played: 0,
    byType: { ataque: 0, defensa: 0, tactica: 0, sistema: 0, estado: 0 },
    goals: 0,
    firstAttackDone: false,
    energySpent: 0,
  }
}

function resetTurnHookUse(m: MatchState): void {
  for (const k of Object.keys(m.hookUse)) if (k.startsWith('t:')) delete m.hookUse[k]
}

/** Inicio de turno del jugador. */
export function beginTurn(ctx: Ctx, first = false): void {
  const m = ctx.m
  ctx.acting = 'player'
  m.turn += 1
  m.stats.turns = m.turn
  m.turnCtr = freshCounters()
  resetTurnHookUse(m)
  ctx.emit({ e: 'clock', turn: m.turn, minute: minuteOf(m) })
  ctx.emit({ e: 'turnStart', turn: m.turn })
  // bloqueo: se pierde salvo retención
  const keep = m.player.retainBlock > 0 ? Math.min(m.player.retainBlock, Math.floor(m.player.block / 2), RETAIN_CAP) : 0
  m.player.block = keep
  ctx.emit({ e: 'block', side: 'player', n: keep })
  m.rival.kickoffLock = false
  // energía
  let energy = BASE_ENERGY + playerStat(ctx, 'energyPerTurn') + m.player.energyBonusNext
  if (first) energy += playerStat(ctx, 'firstTurnEnergy')
  m.player.energyBonusNext = 0
  m.player.energy = Math.max(0, energy)
  ctx.emit({ e: 'energy', n: m.player.energy })
  // robo
  let draw = BASE_DRAW + playerStat(ctx, 'drawPerTurn') + m.player.drawBonusNext
  if (first) draw += playerStat(ctx, 'firstTurnDraw')
  draw += getStatus(ctx, 'player', 'reaccion')
  if (getStatus(ctx, 'player', 'expulsion') > 0) draw -= 1
  setStatusRaw(ctx, 'player', 'reaccion', 0)
  m.player.drawBonusNext = 0
  if (first) {
    fire(ctx, 'matchStart', {})
    drain(ctx)
    if (ended(ctx)) return
  }
  drawCards(ctx, Math.max(0, draw))
  fire(ctx, 'turnStart', { n: m.turn })
  drain(ctx)
  if (ended(ctx)) return
  m.phase = 'player'
}

/** Fin del turno del jugador y turno completo del rival. */
export function endPlayerTurn(ctx: Ctx): void {
  const m = ctx.m
  m.stats.energyUnused += m.player.energy
  fire(ctx, 'turnEnd', { n: m.turn })
  drain(ctx)
  if (ended(ctx)) return
  // limpieza de mano
  for (const uid of m.piles.hand.slice()) {
    const inst = m.cards[uid]
    const kw = kwOf(inst)
    if (kw.includes('efimera')) exhaustCard(ctx, uid)
    else if (kw.includes('retener') || inst.retain) {
      inst.retain = false
      inst.tmpCost = 0
    } else discardCard(ctx, uid)
  }
  for (const uid of Object.keys(m.cards)) {
    const c = m.cards[Number(uid)]
    c.tmpCost = 0
    c.free = false
  }
  m.player.freeNext = []
  m.player.playTwice = []
  drain(ctx)
  if (ended(ctx)) return
  tickStatuses(ctx, 'player')
  rivalTurn(ctx)
}

function rivalTurn(ctx: Ctx): void {
  const m = ctx.m
  ctx.acting = 'rival'
  ctx.emit({ e: 'rivalTurn' })
  m.rival.repliegue = 0
  fire(ctx, 'rivalTurnStart', {})
  drain(ctx)
  if (ended(ctx)) return
  // Asedio: el rival que va perdiendo aprieta
  if (m.score.a < m.score.f) addStatus(ctx, 'rival', 'confianza', 1)
  const it = m.rival.intent
  if (it) {
    ctx.emit({ e: 'rivalMove', name: it.name })
    for (const part of it.parts) {
      if (ended(ctx)) return
      switch (part.k) {
        case 'repliegue':
          gainRepliegue(ctx, part.n)
          break
        case 'buff':
        case 'presion':
          enqueueOps(ctx, part.ops, { kind: 'rival', id: m.rival.def })
          drain(ctx)
          break
        case 'ocasion':
          resolveOcasion(ctx, part.n)
          break
        case 'ataque':
          for (let h = 0; h < (part.hits ?? 1) && !ended(ctx); h++) resolveAtaque(ctx, part.n)
          break
      }
    }
    if (it && m.rival.intentId) m.rival.history.push(m.rival.intentId)
  }
  if (ended(ctx)) return
  m.rival.cancelledOcasion = false
  m.rival.ocasionMod = 0
  m.rival.ataqueMod = 0
  fire(ctx, 'rivalTurnEnd', {})
  drain(ctx)
  if (ended(ctx)) return
  tickStatuses(ctx, 'rival')
  ctx.acting = 'player'
  afterRivalTurn(ctx)
}

function afterRivalTurn(ctx: Ctx): void {
  const m = ctx.m
  if (m.turn >= m.maxTurns) {
    const diff = m.score.f - m.score.a
    if (!m.prorroga) {
      if (diff > 0) return endMatch(ctx, 'victoria')
      if (diff < 0) return endMatch(ctx, 'derrota')
      if (m.tier === 'liga' || m.tier === 'amistoso') return endMatch(ctx, 'empate')
      // prórroga con gol de oro
      m.prorroga = true
      m.maxTurns += 2
      m.player.cambios += 1
      ctx.emit({ e: 'prorroga' })
      ctx.log('¡Prórroga! Gol de oro: el primero que marque gana.')
    } else {
      if (diff > 0) return endMatch(ctx, 'victoria')
      if (diff < 0) return endMatch(ctx, 'derrota')
      startPenalties(ctx)
      return
    }
  }
  chooseIntent(ctx)
  if (m.turn === HALFTIME_AFTER && !m.prorroga && m.charlas === null) {
    const pool = Object.keys(C().charlas)
    m.charlas = sample(m.rng, pool, 3)
    m.phase = 'charla'
    ctx.emit({ e: 'halftime' })
    fire(ctx, 'halftime', {})
    drain(ctx)
    return
  }
  beginTurn(ctx)
}

export function applyCharla(ctx: Ctx, i: number): void {
  const m = ctx.m
  const ids = m.charlas ?? []
  const id = ids[i]
  if (!id) throw new Error('Charla no válida')
  const ch = C().charlas[id]
  m.charlas = []
  ctx.log(`Charla en el descanso: ${ch.name}.`)
  // las ops de charla se aplican al empezar la segunda parte
  beginTurnWithCharla(ctx, ch.ops)
}

function beginTurnWithCharla(ctx: Ctx, ops: EffectOp[]): void {
  const m = ctx.m
  m.phase = 'player'
  beginTurn(ctx)
  if (ended(ctx)) return
  enqueueOps(ctx, clone(ops), { kind: 'charla', id: 'charla' })
  drain(ctx)
}
