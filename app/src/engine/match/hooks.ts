import type { Ctx } from './ctx'
import { newTask } from './ctx'
import type { EventFilter, HookDef, HookEvent, Source, Task } from '../model/types'
import { C, cardDef, clubDef, trofeoDef } from '../registry'
import { evalCond } from '../ops/values'
import { hooksOf } from './cards'

export interface HookPayload {
  type?: string
  res?: string
  n?: number
  who?: 'self' | 'rival'
  status?: string
}

function matches(f: EventFilter | undefined, p: HookPayload): boolean {
  if (!f) return true
  if (f.type && f.type !== p.type) return false
  if (f.res && f.res !== p.res) return false
  if (f.minN !== undefined && (p.n ?? 0) < f.minN) return false
  if (f.who && f.who !== p.who) return false
  if (f.status && f.status !== p.status) return false
  return true
}

function tryHook(ctx: Ctx, h: HookDef, idx: number, src: Source, p: HookPayload, out: Task[]): void {
  const m = ctx.m
  if (!matches(h.f, p)) return
  const probe = newTask([], src)
  if (h.when && !evalCond(ctx, h.when, probe)) return
  if (h.limit) {
    const key = `${h.limit.per === 'turn' ? 't' : 'm'}:${src.kind}:${src.id}:${src.uid ?? ''}:${idx}`
    const used = m.hookUse[key] ?? 0
    if (used >= h.limit.n) return
    m.hookUse[key] = used + 1
  }
  out.push(newTask(h.ops, src, p.n !== undefined ? { n: p.n } : {}))
}

/** Dispara un evento de hook: encola al final las tareas que coinciden. */
export function fire(ctx: Ctx, ev: HookEvent, p: HookPayload): void {
  if (!ctx.inMatch) return
  const m = ctx.m
  if (m.phase === 'ended') return
  const out: Task[] = []
  // 1. pasiva de club
  const club = clubDef(ctx.run.club)
  club.passive.hooks.forEach((h, i) => {
    if (h.on === ev) tryHook(ctx, h, i, { kind: 'club', id: club.id }, p, out)
  })
  // 2. trofeos (orden de adquisición)
  for (const t of ctx.run.trofeos) {
    const d = trofeoDef(t.id)
    d.hooks?.forEach((h, i) => {
      if (h.on === ev) tryHook(ctx, h, i, { kind: 'trofeo', id: d.id }, p, out)
    })
    if (d.counter && d.counter.on === ev && matches(d.counter.f, p)) {
      t.ctr += 1
      if (t.ctr >= d.counter.every) {
        t.ctr = 0
        out.push(newTask(d.counter.ops, { kind: 'trofeo', id: d.id }))
      }
    }
  }
  // 3. sistemas en juego
  for (const uid of m.piles.sistemas) {
    const inst = ctx.inst(uid)
    hooksOf(inst).forEach((h, i) => {
      if (h.on === ev) tryHook(ctx, h, i, { kind: 'card', id: inst.def, uid }, p, out)
    })
  }
  // 4. cartas en mano con efectos pasivos (estados)
  for (const uid of m.piles.hand) {
    const inst = ctx.inst(uid)
    cardDef(inst.def).inHand?.forEach((h, i) => {
      if (h.on === ev) tryHook(ctx, h, 100 + i, { kind: 'card', id: inst.def, uid }, p, out)
    })
  }
  // 5. rasgos del rival
  const rd = C().rivals[m.rival.def]
  rd?.hooks?.forEach((h, i) => {
    if (h.on === ev) tryHook(ctx, h, i, { kind: 'rival', id: rd.id }, p, out)
  })
  for (const t of out) {
    if (t.src.kind === 'trofeo') ctx.emit({ e: 'trofeoProc', id: t.src.id })
    m.queue.push(t)
  }
}
