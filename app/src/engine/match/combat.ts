import type { Ctx } from './ctx'
import type { CardType, MatchResult, Side, StatusId } from '../model/types'
import { C, clubDef } from '../registry'
import { fire } from './hooks'
import { ataqueValue, bloqueoValue, ocasionValue, peligroValue, repliegueValue } from './modifiers'
import { clampStatus, getStatus, setStatusRaw } from './status'
import { enqueueOps } from './queue'

// ───────────────────────── Fin de partido ─────────────────────────

export function endMatch(ctx: Ctx, result: MatchResult): void {
  const m = ctx.m
  if (m.phase === 'ended') return
  m.phase = 'ended'
  m.result = result
  m.queue = []
  m.pending = null
  ctx.emit({ e: 'matchEnd', result })
}

export function ended(ctx: Ctx): boolean {
  return !ctx.inMatch || ctx.m.phase === 'ended'
}

// ───────────────────────── Estados ─────────────────────────

export function addStatus(ctx: Ctx, side: Side, id: StatusId, n: number): void {
  if (n === 0 || ended(ctx)) return
  if (id === 'amarilla') {
    const cur = getStatus(ctx, side, 'amarilla') + n
    if (cur >= 2) {
      setStatusRaw(ctx, side, 'amarilla', 0)
      ctx.emit({ e: 'status', side, id: 'amarilla', n: 2 })
      expel(ctx, side)
      return
    }
    setStatusRaw(ctx, side, 'amarilla', cur)
    ctx.emit({ e: 'status', side, id, n: cur })
    fire(ctx, 'statusApplied', { status: id, who: side === 'player' ? 'self' : 'rival', n })
    return
  }
  const next = clampStatus(id, getStatus(ctx, side, id) + n)
  setStatusRaw(ctx, side, id, next)
  ctx.emit({ e: 'status', side, id, n: next })
  if (n > 0) fire(ctx, 'statusApplied', { status: id, who: side === 'player' ? 'self' : 'rival', n })
}

function expel(ctx: Ctx, side: Side): void {
  const m = ctx.m
  if (side === 'player') {
    setStatusRaw(ctx, 'player', 'expulsion', 1)
    ctx.emit({ e: 'status', side, id: 'expulsion', n: 1 })
    ctx.log('¡Roja! Juegas con uno menos: robas 1 carta menos por turno.')
    return
  }
  if (m.tier === 'copa' || m.tier === 'final') {
    m.rival.cancelledOcasion = true
    ctx.log('¡Bronca en el banquillo rival! Su próxima ocasión queda anulada.')
    ctx.emit({ e: 'status', side, id: 'amarilla', n: 0 })
    return
  }
  setStatusRaw(ctx, 'rival', 'expulsion', 1)
  const r = m.rival
  for (let i = r.seg; i < r.segs.length; i++) r.segs[i] = Math.max(1, Math.floor(r.segs[i] * 0.75))
  r.defensa = Math.min(r.defensa, Math.max(1, Math.floor(r.defensa * 0.75)))
  ctx.emit({ e: 'status', side, id: 'expulsion', n: 1 })
  ctx.log('¡Roja al rival! Su defensa se resiente.')
}

// ───────────────────────── Recursos de club ─────────────────────────

export function gainRes(ctx: Ctx, n: number, res = clubDef(ctx.run.club).res): void {
  if (ended(ctx)) return
  const m = ctx.m
  const club = clubDef(ctx.run.club)
  if (res !== club.res) return
  const cur = m.player.res[res] ?? 0
  const next = Math.max(0, Math.min(club.resMax, cur + n))
  if (next === cur) return
  m.player.res[res] = next
  ctx.emit({ e: 'res', res, n: next })
  if (next > cur) fire(ctx, 'resGained', { res, n: next - cur })
}

// ───────────────────────── Bloqueo ─────────────────────────

export function gainBlock(ctx: Ctx, base: number, type?: CardType): number {
  if (ended(ctx)) return 0
  const m = ctx.m
  const v = bloqueoValue(ctx, base, type)
  if (v <= 0) return 0
  m.player.block += v
  ctx.emit({ e: 'block', side: 'player', n: m.player.block })
  fire(ctx, 'blockGained', { n: v, type })
  return v
}

export function gainRepliegue(ctx: Ctx, base: number): void {
  if (ended(ctx)) return
  const m = ctx.m
  const v = repliegueValue(ctx, base)
  m.rival.repliegue += v
  ctx.emit({ e: 'block', side: 'rival', n: m.rival.repliegue })
}

// ───────────────────────── Peligro y goles ─────────────────────────

export function dealPeligro(ctx: Ctx, base: number, opts: { type?: CardType; doblete?: boolean } = {}): void {
  if (ended(ctx)) return
  const m = ctx.m
  let amount = peligroValue(ctx, base, opts.type)
  if (opts.type === 'ataque' && getStatus(ctx, 'player', 'contragolpe') > 0) {
    amount += 3
    setStatusRaw(ctx, 'player', 'contragolpe', 0)
    ctx.emit({ e: 'status', side: 'player', id: 'contragolpe', n: 0 })
  }
  m.stats.peligroTotal += amount
  const r = m.rival
  if (r.kickoffLock) {
    m.stats.peligroLost += amount
    ctx.emit({ e: 'peligro', n: amount, toRepliegue: 0, toDefensa: 0, lost: amount })
    return
  }
  const toRep = Math.min(r.repliegue, amount)
  r.repliegue -= toRep
  const rest = amount - toRep
  const toDef = Math.min(r.defensa, rest)
  r.defensa -= toDef
  const lost = rest - toDef
  m.stats.peligroLost += lost
  ctx.emit({ e: 'peligro', n: amount, toRepliegue: toRep, toDefensa: toDef, lost })
  if (amount > m.stats.bestTurnPeligro) m.stats.bestTurnPeligro = amount
  if (r.defensa <= 0) playerGoal(ctx, !!opts.doblete)
  fire(ctx, 'peligroDealt', { n: amount, type: opts.type })
}

function playerGoal(ctx: Ctx, doblete: boolean): void {
  const m = ctx.m
  const r = m.rival
  m.score.f += 1
  m.stats.goalsFor += 1
  m.turnCtr.goals += 1
  ctx.emit({ e: 'goal', side: 'player', f: m.score.f, a: m.score.a })
  ctx.log(`¡GOOOL! ${m.score.f}-${m.score.a}`)
  if (m.prorroga) {
    endMatch(ctx, 'victoria')
    return
  }
  if (m.score.f >= m.meta) {
    endMatch(ctx, 'victoria')
    return
  }
  r.seg = Math.min(r.seg + 1, r.segs.length - 1)
  r.defensa = r.segs[r.seg]
  r.repliegue = 0
  if (!doblete) {
    r.kickoffLock = true
    ctx.emit({ e: 'kickoffLock' })
  }
  // cambio de fase del rival
  const rd = C().rivals[r.def]
  if (rd?.phases) {
    const idx = rd.phases.findIndex(ph => ph.atGoalsConceded === m.score.f)
    if (idx >= 0 && r.aiPhase < idx + 1) {
      r.aiPhase = idx + 1
      r.history = []
      const ph = rd.phases[idx]
      ctx.emit({ e: 'rivalPhase', name: ph.name })
      ctx.log(`El rival cambia de plan: ${ph.name}`)
      if (ph.onEnter) enqueueOps(ctx, ph.onEnter, { kind: 'rival', id: rd.id })
    }
  }
  fire(ctx, 'goalScored', { n: m.score.f })
}

export function rivalGoal(ctx: Ctx): void {
  const m = ctx.m
  m.score.a += 1
  m.stats.goalsAgainst += 1
  ctx.emit({ e: 'goal', side: 'rival', f: m.score.f, a: m.score.a })
  ctx.log(`Gol del rival. ${m.score.f}-${m.score.a}`)
  m.stats.maxDeficit = Math.max(m.stats.maxDeficit, m.score.a - m.score.f)
  if (m.prorroga) {
    endMatch(ctx, 'derrota')
    return
  }
  if (m.score.a >= m.meta) {
    endMatch(ctx, 'derrota')
    return
  }
  addStatus(ctx, 'player', 'reaccion', 1)
  fire(ctx, 'goalConceded', { n: m.score.a })
}

// ───────────────────────── Forma ─────────────────────────

export function loseForma(ctx: Ctx, n: number): void {
  if (n <= 0) return
  const run = ctx.run
  run.forma = Math.max(0, run.forma - n)
  if (ctx.inMatch) {
    ctx.m.stats.formaLost += n
    fire(ctx, 'damageTaken', { n })
  }
  ctx.emit({ e: 'forma', n: -n })
  if (run.forma <= 0 && ctx.inMatch) endMatch(ctx, 'derrota')
}

export function heal(ctx: Ctx, n: number): void {
  if (n <= 0) return
  const run = ctx.run
  const before = run.forma
  run.forma = Math.min(run.formaMax, run.forma + n)
  if (run.forma > before) ctx.emit({ e: 'heal', n: run.forma - before })
}

// ───────────────────────── Acciones del rival ─────────────────────────

export function resolveOcasion(ctx: Ctx, base: number): void {
  if (ended(ctx)) return
  const m = ctx.m
  if (m.rival.cancelledOcasion) {
    ctx.log('La ocasión rival queda anulada.')
    ctx.emit({ e: 'ocasion', n: 0, saved: true })
    return
  }
  const v = ocasionValue(ctx, base)
  m.stats.ocasionesRival += 1
  if (m.player.block >= v) {
    m.player.block -= v
    m.stats.paradas += 1
    ctx.emit({ e: 'ocasion', n: v, saved: true })
    ctx.emit({ e: 'block', side: 'player', n: m.player.block })
    ctx.log(`¡Parada! Ocasión de ${v} detenida.`)
    addStatus(ctx, 'player', 'contragolpe', 1)
    fire(ctx, 'parada', { n: v })
  } else {
    ctx.emit({ e: 'ocasion', n: v, saved: false })
    rivalGoal(ctx)
  }
}

export function resolveAtaque(ctx: Ctx, base: number): void {
  if (ended(ctx)) return
  const m = ctx.m
  const v = ataqueValue(ctx, base)
  const blocked = Math.min(m.player.block, v)
  m.player.block -= blocked
  const dmg = v - blocked
  ctx.emit({ e: 'ataque', n: v, blocked, forma: dmg })
  if (blocked > 0) ctx.emit({ e: 'block', side: 'player', n: m.player.block })
  if (dmg > 0) loseForma(ctx, dmg)
}
