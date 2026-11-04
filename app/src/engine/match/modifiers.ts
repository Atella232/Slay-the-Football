import type { Ctx } from './ctx'
import type { CardType, ModifierDef, ModStat, RunModStat, RunState } from '../model/types'
import { C, cardDef, clubDef, trofeoDef } from '../registry'
import { evalCond, evalV } from '../ops/values'
import { getStatus } from './status'
import { ataqueAdd, ocasionAdd } from '../rules'

interface ModAcc {
  add: number
  pct: number
}

function playerMods(ctx: Ctx): ModifierDef[] {
  const out: ModifierDef[] = []
  const club = clubDef(ctx.run.club)
  if (club.passive.mods) out.push(...club.passive.mods)
  for (const t of ctx.run.trofeos) {
    const d = trofeoDef(t.id)
    if (d.mods) out.push(...d.mods)
  }
  if (ctx.inMatch) {
    for (const uid of ctx.m.piles.sistemas) {
      const inst = ctx.inst(uid)
      const d = cardDef(inst.def)
      const mods = inst.up && d.up.mods ? d.up.mods : d.mods
      if (mods) out.push(...mods)
    }
  }
  return out
}

function rivalMods(ctx: Ctx): ModifierDef[] {
  const d = C().rivals[ctx.m.rival.def]
  return d?.mods ?? []
}

function accumulate(ctx: Ctx, mods: ModifierDef[], stat: ModStat, type?: CardType): ModAcc {
  const acc: ModAcc = { add: 0, pct: 0 }
  for (const md of mods) {
    if (md.stat !== stat) continue
    if (md.type && md.type !== type) continue
    if (md.when && !evalCond(ctx, md.when)) continue
    if (md.add !== undefined) acc.add += evalV(ctx, md.add)
    if (md.pct !== undefined) acc.pct += md.pct
  }
  return acc
}

export function playerStat(ctx: Ctx, stat: ModStat): number {
  return accumulate(ctx, playerMods(ctx), stat).add
}

function finish(base: number, acc: ModAcc, mult: number): number {
  const v = Math.floor(((base + acc.add) * mult * (100 + acc.pct)) / 100)
  return Math.max(0, v)
}

/** Peligro generado por el jugador en una instancia. */
export function peligroValue(ctx: Ctx, base: number, type?: CardType): number {
  const acc = accumulate(ctx, playerMods(ctx), 'peligro', type)
  acc.add += getStatus(ctx, 'player', 'confianza')
  let mult = 1
  if (getStatus(ctx, 'player', 'fatiga') > 0) mult *= 0.75
  if (getStatus(ctx, 'rival', 'desorganizado') > 0) mult *= 1.5
  return finish(base, acc, mult)
}

/** Bloqueo ganado por el jugador en una instancia. */
export function bloqueoValue(ctx: Ctx, base: number, type?: CardType): number {
  const acc = accumulate(ctx, playerMods(ctx), 'bloqueo', type)
  acc.add += getStatus(ctx, 'player', 'solidez')
  let mult = 1
  if (getStatus(ctx, 'player', 'desconcentrado') > 0) mult *= 0.75
  return finish(base, acc, mult)
}

function rivalCommon(ctx: Ctx, stat: ModStat): ModAcc {
  const a = accumulate(ctx, rivalMods(ctx), stat)
  const b = accumulate(ctx, playerMods(ctx), stat)
  return { add: a.add + b.add, pct: a.pct + b.pct + exigenciaRivalPct(ctx, stat) }
}

export function ocasionValue(ctx: Ctx, base: number): number {
  const m = ctx.m
  const acc = rivalCommon(ctx, 'ocasionIn')
  acc.add += getStatus(ctx, 'rival', 'confianza') - m.rival.ocasionMod + ocasionAdd(m.tier, ctx.run.act)
  let mult = 1
  if (getStatus(ctx, 'rival', 'fatiga') > 0) mult *= 0.75
  if (m.prorroga) mult *= 1.25
  return Math.max(1, finish(base, acc, mult))
}

export function ataqueValue(ctx: Ctx, base: number): number {
  const m = ctx.m
  const acc = rivalCommon(ctx, 'ataqueIn')
  acc.add += getStatus(ctx, 'rival', 'confianza') - m.rival.ataqueMod + ataqueAdd(m.tier, ctx.run.act)
  let mult = 1
  if (getStatus(ctx, 'rival', 'fatiga') > 0) mult *= 0.75
  if (getStatus(ctx, 'player', 'desorganizado') > 0) mult *= 1.5
  if (m.prorroga) mult *= 1.25
  return finish(base, acc, mult)
}

export function repliegueValue(ctx: Ctx, base: number): number {
  const m = ctx.m
  const acc = rivalCommon(ctx, 'repliegueIn')
  acc.add += getStatus(ctx, 'rival', 'solidez')
  let mult = 1
  if (getStatus(ctx, 'rival', 'desconcentrado') > 0) mult *= 0.75
  if (m.prorroga) mult *= 1.25
  return finish(base, acc, mult)
}

// ───────────── Exigencia (dificultad) aplicada al rival ─────────────

export function exigenciaRivalPct(ctx: Ctx, stat: ModStat): number {
  const e = ctx.run.exig
  const tier = ctx.m.tier
  let pct = 0
  if (stat === 'ocasionIn' || stat === 'ataqueIn') {
    if (tier === 'final' && e >= 4) pct += 10
  }
  return pct
}

export function segmentScale(run: RunState, tier: string): number {
  const e = run.exig
  let pct = 100
  if (tier === 'liga' && e >= 2) pct += 10
  if (tier === 'copa' && e >= 3) pct += 10
  if (tier === 'final' && e >= 13) pct += 10
  pct += runMod(run, 'segmentPct')
  return pct
}

// ───────────── Modificadores de run (trofeos) ─────────────

export function runMod(run: RunState, stat: RunModStat): number {
  let n = 0
  for (const t of run.trofeos) {
    const d = trofeoDef(t.id)
    for (const rm of d.runMods ?? []) if (rm.stat === stat) n += rm.n
  }
  return n
}

export function hasRunMod(run: RunState, stat: RunModStat): boolean {
  return run.trofeos.some(t => (trofeoDef(t.id).runMods ?? []).some(r => r.stat === stat))
}
