import type { Ctx } from './ctx'
import type { IntentPart, MoveDef, RivalAiDef } from '../model/types'
import { rivalDef } from '../registry'
import { evalCond } from '../ops/values'
import { weighted } from '../core/rng'
import { ataqueValue, ocasionValue, repliegueValue } from './modifiers'
import { newTask } from './ctx'

export function currentAi(ctx: Ctx): RivalAiDef {
  const r = ctx.m.rival
  const d = rivalDef(r.def)
  if (r.aiPhase > 0 && d.phases && d.phases[r.aiPhase - 1]) return d.phases[r.aiPhase - 1].ai
  return d.ai
}

const PART_ORDER: Record<IntentPart['k'], number> = {
  repliegue: 0,
  buff: 1,
  ocasion: 2,
  ataque: 3,
  presion: 4,
}

export function orderedParts(move: MoveDef): IntentPart[] {
  return move.parts.slice().sort((a, b) => PART_ORDER[a.k] - PART_ORDER[b.k])
}

export function chooseIntent(ctx: Ctx): void {
  const m = ctx.m
  const r = m.rival
  const ai = currentAi(ctx)
  let id: string | null = null
  const step = r.history.length
  if (ai.opening && step < ai.opening.length) id = ai.opening[step]
  if (!id) {
    const maxRep = ai.maxRepeat ?? 2
    const probe = newTask([], { kind: 'rival', id: r.def })
    const behind = m.score.a < m.score.f
    const ahead = m.score.a > m.score.f
    let options = ai.pick
      .filter(p => !p.when || evalCond(ctx, p.when, probe))
      .filter(p => {
        if (r.history.length < maxRep) return true
        const tail = r.history.slice(-maxRep)
        return !tail.every(h => h === p.move)
      })
      .map(p => {
        const mv = ai.moves[p.move]
        let w = p.w
        if (behind && mv.parts.some(x => x.k === 'ocasion')) w *= 2
        if (ahead && mv.parts.some(x => x.k === 'repliegue')) w *= 1.5
        return { item: p.move, w }
      })
    if (options.length === 0) options = ai.pick.map(p => ({ item: p.move, w: p.w }))
    id = weighted(m.rng, options)
  }
  const mv = ai.moves[id]
  if (!mv) throw new Error(`Movimiento ${id} no existe en ${r.def}`)
  r.intentId = id
  r.intent = { name: mv.name, parts: orderedParts(mv) }
  r.cancelledOcasion = false
  ctx.emit({ e: 'intent', name: mv.name })
}

export interface IntentPreview {
  k: IntentPart['k']
  n?: number
  hits?: number
  text?: string
  cancelled?: boolean
}

/** Números finales que se muestran en la UI (misma tubería que la resolución). */
export function previewIntent(ctx: Ctx): IntentPreview[] {
  const m = ctx.m
  const it = m.rival.intent
  if (!it) return []
  return it.parts.map(p => {
    switch (p.k) {
      case 'ocasion': return { k: p.k, n: ocasionValue(ctx, p.n), cancelled: m.rival.cancelledOcasion }
      case 'ataque': return { k: p.k, n: ataqueValue(ctx, p.n), hits: p.hits ?? 1 }
      case 'repliegue': return { k: p.k, n: repliegueValue(ctx, p.n) }
      case 'presion': return { k: p.k, text: p.text }
      case 'buff': return { k: p.k, text: p.text }
    }
  })
}
