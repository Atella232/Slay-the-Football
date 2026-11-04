import type { RunState } from '../engine/model/types'
import { legalActions } from '../engine/api'

export function checkInvariants(run: RunState): string[] {
  const errs: string[] = []
  if (run.forma < 0 || run.forma > run.formaMax) errs.push(`Forma fuera de rango ${run.forma}/${run.formaMax}`)
  if (run.gold < 0) errs.push(`Oro negativo ${run.gold}`)
  const scr = run.screen
  if (scr.k === 'match') {
    const m = scr.m
    const seen = new Map<number, number>()
    for (const pile of Object.values(m.piles)) for (const uid of pile) seen.set(uid, (seen.get(uid) ?? 0) + 1)
    for (const uid of m.limbo) seen.set(uid, (seen.get(uid) ?? 0) + 1)
    for (const uid of Object.keys(m.cards)) {
      const c = seen.get(Number(uid)) ?? 0
      if (c !== 1) errs.push(`Carta ${uid} aparece ${c} veces`)
    }
    if (m.player.energy < 0) errs.push('Energía negativa')
    if (m.score.f > m.meta || m.score.a > m.meta) errs.push(`Marcador fuera de meta ${m.score.f}-${m.score.a}`)
    if (m.turn > 8 + 2 + 2) errs.push(`Turno excesivo ${m.turn}`)
    if (m.phase === 'player' && !m.pending && m.queue.some(t => t.i < t.ops.length)) errs.push('Cola pendiente en reposo')
    if (m.phase !== 'ended' && m.limbo.length > 0 && !m.pending) errs.push('Cartas en limbo en reposo')
  }
  if (scr.k !== 'ended' && legalActions(run).length === 0) errs.push(`Sin acciones legales en ${scr.k}`)
  const json = JSON.stringify(run)
  if (JSON.stringify(JSON.parse(json)) !== json) errs.push('Serialización no estable')
  return errs
}
