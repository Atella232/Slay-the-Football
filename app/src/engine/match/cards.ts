import type { Ctx } from './ctx'
import type { CardDef, CardFilter, CardInst, EffectOp, HookDef, Keyword, ModifierDef, Pile } from '../model/types'
import { cardDef } from '../registry'
import { evalCond } from '../ops/values'
import { fire } from './hooks'
import { rand } from '../core/rng'

export const HAND_MAX = 10
export const PILES: Pile[] = ['draw', 'hand', 'discard', 'agotadas', 'sistemas']

export function isUp(inst: CardInst): boolean {
  return inst.up || !!inst.tmpUp
}

export function opsOf(inst: CardInst): EffectOp[] {
  const d = cardDef(inst.def)
  return isUp(inst) && d.up.ops ? d.up.ops : d.ops
}

export function kwOf(inst: CardInst): Keyword[] {
  const d = cardDef(inst.def)
  return (isUp(inst) && d.up.kw ? d.up.kw : d.kw) ?? []
}

export function hooksOf(inst: CardInst): HookDef[] {
  const d = cardDef(inst.def)
  return (isUp(inst) && d.up.hooks ? d.up.hooks : d.hooks) ?? []
}

export function modsOf(inst: CardInst): ModifierDef[] {
  const d = cardDef(inst.def)
  return (isUp(inst) && d.up.mods ? d.up.mods : d.mods) ?? []
}

export function baseCostOf(inst: CardInst): number | 'X' {
  const d = cardDef(inst.def)
  return isUp(inst) && d.up.cost !== undefined ? d.up.cost : d.cost
}

export function nameOf(inst: CardInst): string {
  const d = cardDef(inst.def)
  const base = isUp(inst) && d.up.name ? d.up.name : d.name
  return isUp(inst) ? `${base}+` : base
}

export function matchesFilter(d: CardDef, inst: CardInst, f?: CardFilter): boolean {
  if (!f) return true
  if (f.type && d.type !== f.type) return false
  if (f.notType && d.type === f.notType) return false
  if (f.club && d.club !== f.club) return false
  if (f.upgraded !== undefined && isUp(inst) !== f.upgraded) return false
  if (f.maxCost !== undefined) {
    const c = baseCostOf(inst)
    if (c === 'X' || c > f.maxCost) return false
  }
  return true
}

/** Coste efectivo actual (sin X: devuelve la energía disponible). */
export function costOf(ctx: Ctx, uid: number): number {
  const m = ctx.m
  const inst = ctx.inst(uid)
  const base = baseCostOf(inst)
  if (base === 'X') return m.player.energy
  if (inst.free) return 0
  const d = cardDef(inst.def)
  if (m.player.freeNext.some(f => !f.type || f.type === d.type)) return 0
  return Math.max(0, base + (inst.tmpCost ?? 0))
}

export function playability(ctx: Ctx, uid: number): { ok: boolean; reason?: string } {
  const m = ctx.m
  if (m.phase !== 'player') return { ok: false, reason: 'No es tu turno' }
  if (m.pending) return { ok: false, reason: 'Hay una elección pendiente' }
  if (!m.piles.hand.includes(uid)) return { ok: false, reason: 'La carta no está en tu mano' }
  const inst = ctx.inst(uid)
  const d = cardDef(inst.def)
  if (kwOf(inst).includes('injugable') || d.type === 'estado' && d.ops.length === 0) return { ok: false, reason: 'Injugable' }
  if (d.playIf && !evalCond(ctx, d.playIf)) return { ok: false, reason: 'No se cumple la condición' }
  const cost = costOf(ctx, uid)
  if (baseCostOf(inst) !== 'X' && cost > m.player.energy) return { ok: false, reason: 'Energía insuficiente' }
  return { ok: true }
}

export function pileOf(ctx: Ctx, uid: number): Pile | 'limbo' | null {
  const m = ctx.m
  for (const p of PILES) if (m.piles[p].includes(uid)) return p
  if (m.limbo.includes(uid)) return 'limbo'
  return null
}

export function detach(ctx: Ctx, uid: number): void {
  const m = ctx.m
  for (const p of PILES) {
    const i = m.piles[p].indexOf(uid)
    if (i >= 0) {
      m.piles[p].splice(i, 1)
      return
    }
  }
  const li = m.limbo.indexOf(uid)
  if (li >= 0) m.limbo.splice(li, 1)
}

export function moveCard(ctx: Ctx, uid: number, to: Pile, top = true): void {
  detach(ctx, uid)
  const arr = ctx.m.piles[to]
  if (to === 'draw' && !top) arr.unshift(uid)
  else arr.push(uid)
}

export function discardCard(ctx: Ctx, uid: number): void {
  const inst = ctx.inst(uid)
  inst.tmpCost = 0
  inst.retain = false
  moveCard(ctx, uid, 'discard')
  ctx.emit({ e: 'discard', uid })
}

export function exhaustCard(ctx: Ctx, uid: number): void {
  const inst = ctx.inst(uid)
  inst.tmpCost = 0
  moveCard(ctx, uid, 'agotadas')
  ctx.emit({ e: 'exhaust', uid })
  fire(ctx, 'cardExhausted', { type: cardDef(inst.def).type })
}

function reshuffle(ctx: Ctx): void {
  const m = ctx.m
  if (m.piles.discard.length === 0) return
  const moved = m.piles.discard.splice(0, m.piles.discard.length)
  // barajar con el RNG del partido
  for (let i = moved.length - 1; i > 0; i--) {
    const j = Math.floor(randFloat(ctx) * (i + 1))
    const t = moved[i]
    moved[i] = moved[j]
    moved[j] = t
  }
  m.piles.draw.unshift(...moved)
  ctx.emit({ e: 'shuffle' })
  fire(ctx, 'shuffle', {})
}

function randFloat(ctx: Ctx): number {
  return rand(ctx.m.rng)
}

export function drawCards(ctx: Ctx, n: number): number {
  const m = ctx.m
  let drawn = 0
  for (let k = 0; k < n; k++) {
    if (m.piles.hand.length >= HAND_MAX) break
    if (m.piles.draw.length === 0) reshuffle(ctx)
    const uid = m.piles.draw.pop()
    if (uid === undefined) break
    m.piles.hand.push(uid)
    drawn++
    ctx.emit({ e: 'draw', uid })
  }
  return drawn
}

export function createCard(ctx: Ctx, def: string, to: Pile, up = false): number {
  const m = ctx.m
  cardDef(def)
  const uid = ctx.run.nextUid++
  m.cards[uid] = { uid, def, up }
  let dest = to
  if (to === 'hand' && m.piles.hand.length >= HAND_MAX) dest = 'discard'
  if (dest === 'draw') {
    // posición aleatoria en el mazo de robo
    const pos = Math.floor(randFloat(ctx) * (m.piles.draw.length + 1))
    m.piles.draw.splice(pos, 0, uid)
  } else m.piles[dest].push(uid)
  ctx.emit({ e: 'cardCreated', uid, to: dest })
  return uid
}
