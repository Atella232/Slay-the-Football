import type { Ctx } from './ctx'
import type { EffectOp } from '../model/types'
import { cardDef, consumibleDef } from '../registry'
import { EngineError, assert } from '../core/assert'
import { baseCostOf, costOf, drawCards, kwOf, opsOf, playability } from './cards'
import { applyPick, drain, enqueueOps, pickCandidates } from './queue'
import { fire } from './hooks'
import { applyCharla, endPlayerTurn } from './flow'
import { penaltyKick } from './penalties'
import { ended } from './combat'

export function playCard(ctx: Ctx, uid: number): void {
  const m = ctx.m
  const p = playability(ctx, uid)
  if (!p.ok) throw new EngineError(`No se puede jugar: ${p.reason}`)
  const inst = m.cards[uid]
  const d = cardDef(inst.def)
  const base = baseCostOf(inst)
  let cost = costOf(ctx, uid)
  let x: number | undefined
  if (base === 'X') {
    x = m.player.energy
    cost = x
  } else if (!inst.free) {
    const fi = m.player.freeNext.findIndex(f => !f.type || f.type === d.type)
    if (fi >= 0 && base + (inst.tmpCost ?? 0) > 0) {
      const f = m.player.freeNext[fi]
      f.n -= 1
      if (f.n <= 0) m.player.freeNext.splice(fi, 1)
    }
  }
  m.player.energy -= cost
  m.turnCtr.energySpent += cost
  ctx.emit({ e: 'energy', n: m.player.energy })
  // a limbo mientras se resuelve
  m.piles.hand.splice(m.piles.hand.indexOf(uid), 1)
  m.limbo.push(uid)
  ctx.emit({ e: 'play', uid, def: inst.def })
  let ops: EffectOp[] = opsOf(inst).slice()
  const twice = m.player.playTwice.indexOf(d.type)
  if (twice >= 0) {
    m.player.playTwice.splice(twice, 1)
    ops = [...ops, ...ops]
  }
  ops.push({ op: '_finishPlay', uid })
  enqueueOps(ctx, ops, { kind: 'card', id: inst.def, uid }, {}, x)
  drain(ctx)
}

export function resolvePending(ctx: Ctx, pick: number[]): void {
  const m = ctx.m
  const pend = m.pending
  assert(pend, 'No hay ninguna elección pendiente')
  if (pend.kind === 'choose') {
    const i = pick[0]
    const opt = pend.options?.[i]
    assert(opt, 'Opción no válida')
    m.pending = null
    const task = m.queue[0]
    task.ops.splice(task.i, 0, ...opt.ops)
    drain(ctx)
    return
  }
  const cands = pickCandidates(ctx, pend.from!, { f: pend.f })
  const uniq = Array.from(new Set(pick))
  assert(uniq.length >= pend.min && uniq.length <= pend.max, `Debes elegir entre ${pend.min} y ${pend.max} cartas`)
  for (const uid of uniq) assert(cands.includes(uid), 'Carta no elegible')
  m.pending = null
  applyPick(ctx, pend.act!, uniq)
  const task = m.queue[0]
  if (task) task.bind.picked = uniq.length
  drain(ctx)
}

export function cambio(ctx: Ctx, uid: number): void {
  const m = ctx.m
  assert(m.phase === 'player' && !m.pending, 'No puedes hacer cambios ahora')
  assert(m.player.cambios > 0, 'No te quedan cambios')
  assert(m.piles.hand.includes(uid), 'La carta no está en tu mano')
  m.player.cambios -= 1
  m.stats.cambiosUsed += 1
  const inst = m.cards[uid]
  const idx = m.piles.hand.indexOf(uid)
  m.piles.hand.splice(idx, 1)
  if (kwOf(inst).includes('efimera')) {
    m.piles.agotadas.push(uid)
    ctx.emit({ e: 'exhaust', uid })
  } else {
    inst.tmpCost = 0
    m.piles.discard.push(uid)
  }
  ctx.emit({ e: 'cambio', uid })
  drawCards(ctx, 1)
  fire(ctx, 'cambio', { type: cardDef(inst.def).type })
  drain(ctx)
}

export function consumeItem(ctx: Ctx, slot: number): void {
  const run = ctx.run
  const id = run.consumibles[slot]
  assert(id, 'Hueco vacío')
  const d = consumibleDef(id)
  if (ctx.inMatch) {
    const m = ctx.m
    assert(m.phase === 'player' && !m.pending, 'No puedes usarlo ahora')
    assert(d.ops && d.ops.length > 0, 'Este consumible no se usa en partido')
    run.consumibles[slot] = null
    ctx.log(`Usas ${d.name}.`)
    enqueueOps(ctx, d.ops, { kind: 'consumible', id })
    drain(ctx)
    return
  }
  throw new EngineError('Consumible fuera de partido no soportado aquí')
}

export function endTurn(ctx: Ctx): void {
  const m = ctx.m
  assert(m.phase === 'player' && !m.pending, 'No puedes terminar el turno ahora')
  endPlayerTurn(ctx)
}

export function chooseCharla(ctx: Ctx, i: number): void {
  const m = ctx.m
  assert(m.phase === 'charla', 'No es el descanso')
  applyCharla(ctx, i)
}

export function kickPenalty(ctx: Ctx, dir: 'L' | 'C' | 'R'): void {
  const m = ctx.m
  assert(m.phase === 'penalties', 'No hay penaltis')
  penaltyKick(ctx, dir)
}

export { ended }
