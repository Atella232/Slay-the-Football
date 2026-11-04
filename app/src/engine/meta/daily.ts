import type { ClubId } from '../model/types'
import { hashString, sample, seedRng } from '../core/rng'

export const DAILY_MOD_IDS = ['tro.mod_lluvia', 'tro.mod_total', 'tro.mod_rebajas', 'tro.mod_cantera', 'tro.mod_tension', 'tro.mod_austeridad']

export interface DailyConfig {
  date: string
  seed: string
  club: ClubId
  mods: string[]
}

/** Configuración del reto diario a partir de la fecha UTC (AAAA-MM-DD). */
export function dailyConfig(date: string): DailyConfig {
  const day = hashString(date)
  const clubs: ClubId[] = ['athletic', 'barcelona', 'madrid']
  const rng = seedRng('daily', date)
  return {
    date,
    seed: `DIA-${date}`,
    club: clubs[day % 3],
    mods: sample(rng, DAILY_MOD_IDS, 2),
  }
}

export function todayUtc(now: Date): string {
  return now.toISOString().slice(0, 10)
}
