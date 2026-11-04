import type { Ctx } from '../match/ctx'
import { ownerOf } from '../match/ctx'
import type { CmpOp, Cond, MatchPhaseName, Side, Task, V } from '../model/types'
import { getStatus } from '../match/status'

export function cmp(a: number, op: CmpOp, b: number): boolean {
  switch (op) {
    case '<': return a < b
    case '<=': return a <= b
    case '=': return a === b
    case '>=': return a >= b
    case '>': return a > b
  }
}

function sideOf(owner: Side, who: 'self' | 'rival'): Side {
  if (who === 'self') return owner
  return owner === 'player' ? 'rival' : 'player'
}

export function evalV(ctx: Ctx, v: V, task?: Task): number {
  if (typeof v === 'number') return v
  const m = ctx.m
  const owner: Side = task ? ownerOf(task.src) : 'player'
  switch (v.k) {
    case 'res': return m.player.res[v.res] ?? 0
    case 'bound': return task?.bind[v.name] ?? 0
    case 'count': {
      const ids = m.piles[v.pile]
      if (!v.type) return ids.length
      let n = 0
      for (const uid of ids) if (ctx.cardType(uid) === v.type) n++
      return n
    }
    case 'turn': return m.turn
    case 'scoreDiff': return owner === 'player' ? m.score.f - m.score.a : m.score.a - m.score.f
    case 'goalsFor': return owner === 'player' ? m.score.f : m.score.a
    case 'played': return v.type ? m.turnCtr.byType[v.type] : m.turnCtr.played
    case 'block': return owner === 'player' ? m.player.block : m.rival.repliegue
    case 'status': return getStatus(ctx, sideOf(owner, v.who), v.id)
    case 'x': return task?.x ?? 0
    case 'add': return evalV(ctx, v.a, task) + evalV(ctx, v.b, task)
    case 'mul': return evalV(ctx, v.a, task) * evalV(ctx, v.b, task)
    case 'min': return Math.min(evalV(ctx, v.a, task), evalV(ctx, v.b, task))
    case 'max': return Math.max(evalV(ctx, v.a, task), evalV(ctx, v.b, task))
  }
}

export function matchPhase(ctx: Ctx): MatchPhaseName[] {
  const m = ctx.m
  const out: MatchPhaseName[] = []
  if (m.prorroga) {
    out.push('prorroga', 'tramoFinal')
    return out
  }
  out.push(m.turn <= 4 ? 'primera' : 'segunda')
  if (m.turn >= m.maxTurns - 1) out.push('tramoFinal')
  return out
}

export function evalCond(ctx: Ctx, c: Cond, task?: Task): boolean {
  const m = ctx.m
  const owner: Side = task ? ownerOf(task.src) : 'player'
  switch (c.k) {
    case 'phase': return matchPhase(ctx).includes(c.is)
    case 'scoreDiff': {
      const d = owner === 'player' ? m.score.f - m.score.a : m.score.a - m.score.f
      return cmp(d, c.op, c.n)
    }
    case 'res': return cmp(m.player.res[c.res] ?? 0, c.op, c.n)
    case 'intentHas': {
      const it = m.rival.intent
      if (!it) return false
      if (c.part === 'ocasion' && m.rival.cancelledOcasion) return false
      return it.parts.some(p => p.k === c.part)
    }
    case 'lastPlayed': return m.turnCtr.last === c.type
    case 'prevPlayed': return m.turnCtr.prev === c.type
    case 'status': return cmp(getStatus(ctx, sideOf(owner, c.who), c.id), c.op, c.n)
    case 'block': return cmp(owner === 'player' ? m.player.block : m.rival.repliegue, c.op, c.n)
    case 'formaPct': return cmp(Math.floor((ctx.run.forma * 100) / Math.max(1, ctx.run.formaMax)), c.op, c.n)
    case 'played': return cmp(c.type ? m.turnCtr.byType[c.type] : m.turnCtr.played, c.op, c.n)
    case 'handSize': return cmp(m.piles.hand.length, c.op, c.n)
    case 'rivalSegmentPct': {
      const seg = m.rival.segs[m.rival.seg] ?? 1
      return cmp(Math.floor((m.rival.defensa * 100) / Math.max(1, seg)), c.op, c.n)
    }
    case 'firstTurn': return m.turn === 1
    case 'tier': return m.tier === c.is
    case 'and': return c.c.every(x => evalCond(ctx, x, task))
    case 'or': return c.c.some(x => evalCond(ctx, x, task))
    case 'not': return !evalCond(ctx, c.c, task)
  }
}
