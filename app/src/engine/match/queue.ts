import type { Ctx } from './ctx'
import { newTask, ownerOf } from './ctx'
import type { CardFilter, EffectOp, PickAct, Source, Task } from '../model/types'
import { C, cardDef } from '../registry'
import { evalCond, evalV } from '../ops/values'
import { EngineError } from '../core/assert'
import {
  addStatus,
  dealPeligro,
  ended,
  gainBlock,
  gainRepliegue,
  gainRes,
  heal,
  loseForma,
} from './combat'
import {
  createCard,
  discardCard,
  drawCards,
  exhaustCard,
  kwOf,
  matchesFilter,
  moveCard,
} from './cards'
import { fire } from './hooks'

export function enqueueOps(ctx: Ctx, ops: EffectOp[], src: Source, bind: Record<string, number> = {}, x?: number): Task {
  const t = newTask(ops, src, bind, x)
  ctx.m.queue.push(t)
  return t
}

/** Ejecuta la cola hasta vaciarla, terminar el partido o quedar a la espera de una elección. */
export function drain(ctx: Ctx): void {
  if (!ctx.inMatch) return
  const m = ctx.m
  while (m.queue.length > 0 && !m.pending && m.phase !== 'ended') {
    const task = m.queue[0]
    if (task.i >= task.ops.length) {
      m.queue.shift()
      continue
    }
    const op = task.ops[task.i]
    task.i++
    ctx.spend()
    execOp(ctx, task, op)
    if (!ctx.inMatch) return
  }
}

function insert(task: Task, ops: EffectOp[]): void {
  task.ops.splice(task.i, 0, ...ops)
}

function srcType(ctx: Ctx, task: Task) {
  if (task.src.kind === 'card' && task.src.uid !== undefined && ctx.m.cards[task.src.uid]) {
    return cardDef(ctx.m.cards[task.src.uid].def).type
  }
  return undefined
}

export function pickCandidates(ctx: Ctx, from: 'hand' | 'draw' | 'discard', f: { f?: CardFilter }): number[] {
  const m = ctx.m
  return m.piles[from].filter(uid => {
    const inst = m.cards[uid]
    return matchesFilter(cardDef(inst.def), inst, f.f)
  })
}

export function applyPick(ctx: Ctx, act: PickAct, uids: number[]): void {
  const m = ctx.m
  for (const uid of uids) {
    const inst = m.cards[uid]
    switch (act) {
      case 'exhaust': exhaustCard(ctx, uid); break
      case 'discard': discardCard(ctx, uid); break
      case 'toHand': moveCard(ctx, uid, 'hand'); ctx.emit({ e: 'draw', uid }); break
      case 'toDrawTop': moveCard(ctx, uid, 'draw'); break
      case 'upgradeTmp': inst.tmpUp = true; break
      case 'freeTurn': inst.free = true; break
      case 'retain': inst.retain = true; break
    }
  }
}

function execOp(ctx: Ctx, task: Task, op: EffectOp): void {
  const m = ctx.m
  const owner = ownerOf(task.src)
  const V = (v: Parameters<typeof evalV>[1]) => evalV(ctx, v, task)
  switch (op.op) {
    case 'peligro': {
      const hits = op.hits !== undefined ? V(op.hits) : 1
      const base = V(op.n)
      const type = srcType(ctx, task)
      let doblete = false
      if (task.src.kind === 'card' && task.src.uid !== undefined && m.cards[task.src.uid]) {
        doblete = kwOf(m.cards[task.src.uid]).includes('doblete')
      }
      for (let h = 0; h < hits && !ended(ctx); h++) dealPeligro(ctx, base, { type, doblete })
      return
    }
    case 'bloqueo': {
      const n = V(op.n)
      if (owner === 'rival') gainRepliegue(ctx, n)
      else gainBlock(ctx, n, srcType(ctx, task))
      return
    }
    case 'draw': {
      const n = V(op.n)
      if (owner === 'rival') m.player.drawBonusNext -= n
      else drawCards(ctx, n)
      return
    }
    case 'energy': {
      const n = V(op.n)
      if (owner === 'rival') {
        m.player.energyBonusNext += n
        return
      }
      m.player.energy = Math.max(0, m.player.energy + n)
      ctx.emit({ e: 'energy', n: m.player.energy })
      return
    }
    case 'status': {
      const side = op.who === 'self' ? owner : owner === 'player' ? 'rival' : 'player'
      const prev = ctx.acting
      addStatus(ctx, side, op.id, V(op.n))
      ctx.acting = prev
      return
    }
    case 'res': {
      gainRes(ctx, V(op.n), op.res)
      return
    }
    case 'spendRes': {
      const have = m.player.res[op.res] ?? 0
      const spent = op.max === 'all' ? have : Math.min(have, op.max)
      if (spent > 0) {
        m.player.res[op.res] = have - spent
        ctx.emit({ e: 'res', res: op.res, n: have - spent })
      }
      task.bind.spent = spent
      insert(task, op.then)
      return
    }
    case 'pick': {
      const cands = pickCandidates(ctx, op.from, op)
      if (cands.length === 0) {
        task.bind.picked = 0
        return
      }
      if (cands.length <= op.min) {
        applyPick(ctx, op.act, cands)
        task.bind.picked = cands.length
        if (op.then) insert(task, op.then)
        return
      }
      m.pending = {
        kind: 'pick',
        from: op.from,
        min: op.min,
        max: Math.min(op.max, cands.length),
        f: op.f,
        act: op.act,
        prompt: pickPrompt(op.act, op.min, op.max),
        src: task.src,
      }
      // las ops "then" se insertan al resolver
      if (op.then) insert(task, op.then)
      return
    }
    case 'addCard': {
      const n = V(op.n)
      for (let k = 0; k < n; k++) createCard(ctx, op.def, op.to, !!op.upgraded)
      return
    }
    case 'freeNext': {
      m.player.freeNext.push({ type: op.type, n: op.n ?? 1 })
      return
    }
    case 'handCost': {
      for (const uid of m.piles.hand) {
        const inst = m.cards[uid]
        if (op.type && cardDef(inst.def).type !== op.type) continue
        inst.tmpCost = (inst.tmpCost ?? 0) + op.delta
      }
      return
    }
    case 'playTwice': {
      m.player.playTwice.push(op.type)
      return
    }
    case 'cancelOcasion': {
      if (m.rival.intent?.parts.some(p => p.k === 'ocasion')) {
        m.rival.cancelledOcasion = true
        ctx.log('Ocasión rival anulada.')
      }
      return
    }
    case 'reduceOcasion': {
      m.rival.ocasionMod += V(op.n)
      return
    }
    case 'reduceAtaque': {
      m.rival.ataqueMod += V(op.n)
      return
    }
    case 'clock': {
      const room = Math.max(0, 2 - m.added)
      const n = Math.min(room, op.n)
      if (n > 0) {
        m.added += n
        m.maxTurns += n
        ctx.log(`Tiempo añadido: +${n} turno${n > 1 ? 's' : ''}.`)
      }
      return
    }
    case 'repliegueRemove': {
      const n = op.n === 'all' ? m.rival.repliegue : V(op.n)
      m.rival.repliegue = Math.max(0, m.rival.repliegue - n)
      ctx.emit({ e: 'block', side: 'rival', n: m.rival.repliegue })
      return
    }
    case 'heal': {
      heal(ctx, V(op.n))
      return
    }
    case 'loseForma': {
      loseForma(ctx, V(op.n))
      return
    }
    case 'gold': {
      const n = V(op.n)
      ctx.run.gold += n
      ctx.emit({ e: 'gold', n })
      return
    }
    case 'cambios': {
      m.player.cambios = Math.max(0, m.player.cambios + V(op.n))
      return
    }
    case 'retainBlock': {
      m.player.retainBlock = Math.max(m.player.retainBlock, V(op.n))
      return
    }
    case 'exhaustSelf': {
      if (task.src.uid !== undefined) m.forceExhaust.push(task.src.uid)
      return
    }
    case 'if': {
      if (evalCond(ctx, op.c, task)) insert(task, op.then)
      else if (op.else) insert(task, op.else)
      return
    }
    case 'repeat': {
      const n = Math.max(0, Math.min(20, V(op.n)))
      const out: EffectOp[] = []
      for (let k = 0; k < n; k++) out.push(...op.ops)
      insert(task, out)
      return
    }
    case 'choose': {
      m.pending = {
        kind: 'choose',
        min: 1,
        max: 1,
        options: op.options,
        prompt: 'Elige una opción',
        src: task.src,
      }
      return
    }
    case 'custom': {
      const h = C().handlers[op.h]
      if (!h) throw new EngineError(`Handler desconocido: ${op.h}`)
      const res = h(ctx, task, op.args ?? {})
      if (res && res.length) insert(task, res)
      return
    }
    case '_finishPlay': {
      finishPlay(ctx, op.uid)
      return
    }
  }
}

function pickPrompt(act: string, min: number, max: number): string {
  const n = min === max ? `${max}` : `hasta ${max}`
  switch (act) {
    case 'exhaust': return `Elige ${n} carta${max > 1 ? 's' : ''} para agotar`
    case 'discard': return `Elige ${n} carta${max > 1 ? 's' : ''} para descartar`
    case 'toHand': return `Elige ${n} carta${max > 1 ? 's' : ''} para llevar a tu mano`
    case 'toDrawTop': return `Elige ${n} carta${max > 1 ? 's' : ''} para colocar encima del mazo`
    case 'upgradeTmp': return `Elige ${n} carta${max > 1 ? 's' : ''} para mejorar este partido`
    case 'freeTurn': return `Elige ${n} carta${max > 1 ? 's' : ''}: costará 0 este turno`
    case 'retain': return `Elige ${n} carta${max > 1 ? 's' : ''} para retener`
  }
  return 'Elige cartas'
}

export function finishPlay(ctx: Ctx, uid: number): void {
  const m = ctx.m
  const inst = m.cards[uid]
  if (!inst) return
  const d = cardDef(inst.def)
  const forced = m.forceExhaust.indexOf(uid)
  if (forced >= 0) m.forceExhaust.splice(forced, 1)
  if (m.limbo.includes(uid)) {
    if (d.type === 'sistema') {
      moveCard(ctx, uid, 'sistemas')
      ctx.emit({ e: 'toSistemas', uid })
    } else if (forced >= 0 || kwOf(inst).includes('agotar')) {
      exhaustCard(ctx, uid)
    } else {
      inst.tmpCost = 0
      inst.free = false
      moveCard(ctx, uid, 'discard')
      ctx.emit({ e: 'discard', uid })
    }
  }
  m.turnCtr.played += 1
  m.turnCtr.byType[d.type] += 1
  m.turnCtr.prev = m.turnCtr.last
  m.turnCtr.last = d.type
  m.stats.cardsPlayed += 1
  fire(ctx, 'cardPlayed', { type: d.type })
}
