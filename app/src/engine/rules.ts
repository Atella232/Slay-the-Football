// Perillas globales de balance. El simulador las barre; el contenido mantiene números relativos.
import type { Act, Tier } from './model/types'

type PerAct = [number, number, number]

export const RULES = {
  /** Multiplicador de la Defensa de cada segmento por tipo de partido y acto. */
  segMult: {
    liga: [1.2, 1.35, 1.45],
    copa: [0.95, 1.2, 1.45],
    final: [0.9, 1.35, 1.6],
    amistoso: [1.1, 1.1, 1.1],
  } as Record<Tier, PerAct>,
  /** Suma plana a cada Ocasión rival. */
  ocasionAdd: {
    liga: [1, 1, 2],
    copa: [0, 2, 4],
    final: [0, 3, 5],
    amistoso: [0, 0, 0],
  } as Record<Tier, PerAct>,
  /** Suma plana a cada golpe de Ataque rival. */
  ataqueAdd: {
    liga: [0, 0, 1],
    copa: [-1, 2, 4],
    final: [-2, 2, 4],
    amistoso: [0, 0, 0],
  } as Record<Tier, PerAct>,
}

export function segMult(tier: Tier, act: Act): number {
  return RULES.segMult[tier][act - 1]
}

export function ocasionAdd(tier: Tier, act: Act): number {
  return RULES.ocasionAdd[tier][act - 1]
}

export function ataqueAdd(tier: Tier, act: Act): number {
  return RULES.ataqueAdd[tier][act - 1]
}
