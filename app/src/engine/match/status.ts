import type { Ctx } from './ctx'
import type { Side, StatusId, StatusInst } from '../model/types'

export type StackKind = 'intensity' | 'duration' | 'counter' | 'flag'

export const STATUS_KIND: Record<StatusId, StackKind> = {
  confianza: 'intensity',
  solidez: 'intensity',
  fatiga: 'duration',
  desorganizado: 'duration',
  desconcentrado: 'duration',
  amarilla: 'counter',
  expulsion: 'flag',
  contragolpe: 'duration',
  reaccion: 'counter',
}

export function statusList(ctx: Ctx, side: Side): StatusInst[] {
  return side === 'player' ? ctx.m.player.st : ctx.m.rival.st
}

export function getStatus(ctx: Ctx, side: Side, id: StatusId): number {
  const s = statusList(ctx, side).find(x => x.id === id)
  return s ? s.n : 0
}

/** Ajusta un estado sin disparar hooks (uso interno). */
export function setStatusRaw(ctx: Ctx, side: Side, id: StatusId, n: number): void {
  const list = statusList(ctx, side)
  const idx = list.findIndex(x => x.id === id)
  if (n === 0) {
    if (idx >= 0) list.splice(idx, 1)
    return
  }
  if (idx >= 0) list[idx].n = n
  else list.push({ id, n, fresh: ctx.acting === side })
}

export function clampStatus(id: StatusId, n: number): number {
  const kind = STATUS_KIND[id]
  if (kind === 'intensity') return Math.max(-10, Math.min(20, n))
  if (kind === 'flag') return n > 0 ? 1 : 0
  if (id === 'contragolpe') return Math.min(1, Math.max(0, n))
  return Math.max(0, Math.min(99, n))
}

/** Decaimiento al final del turno propio del lado afectado. */
export function tickStatuses(ctx: Ctx, side: Side): void {
  const list = statusList(ctx, side)
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i]
    if (STATUS_KIND[s.id] !== 'duration') continue
    if (s.fresh) {
      s.fresh = false
      continue
    }
    s.n -= 1
    if (s.n <= 0) list.splice(i, 1)
  }
  for (const s of list) s.fresh = false
}
