import type { ClubId, RunEnd, RunState } from '../model/types'
import { ACHIEVEMENTS, evaluateAchievements } from './achievements'

export const PROFILE_VERSION = 1
export const XP_LEVELS = [0, 150, 350, 600, 900, 1250, 1650, 2100, 2600, 3150]
export const MAX_EXIGENCIA = 15

export interface RunSummary {
  id: string
  seed: string
  club: ClubId
  exig: number
  daily: boolean
  outcome: RunEnd
  act: number
  floors: number
  score: number
  date: string
  goalsFor: number
  goalsAgainst: number
  wins: number
  deck: string[]
  trofeos: string[]
}

export interface Profile {
  v: number
  unlocked: ClubId[]
  clubXp: Record<ClubId, number>
  exigMax: Record<ClubId, number>
  history: RunSummary[]
  seenCards: string[]
  seenTrofeos: string[]
  seenRivals: string[]
  achievements: string[]
  tutorial: Record<string, boolean>
  totals: { runs: number; titles: number; goals: number; matches: number }
  daily: Record<string, number>
}

export function newProfile(): Profile {
  return {
    v: PROFILE_VERSION,
    unlocked: ['athletic'],
    clubXp: { athletic: 0, barcelona: 0, madrid: 0 },
    exigMax: { athletic: 0, barcelona: 0, madrid: 0 },
    history: [],
    seenCards: [],
    seenTrofeos: [],
    seenRivals: [],
    achievements: [],
    tutorial: {},
    totals: { runs: 0, titles: 0, goals: 0, matches: 0 },
    daily: {},
  }
}

export function clubLevel(xp: number): number {
  let lvl = 1
  for (let i = 0; i < XP_LEVELS.length; i++) if (xp >= XP_LEVELS[i]) lvl = i + 1
  return Math.min(10, lvl)
}

export function xpToNext(xp: number): { level: number; into: number; need: number } {
  const level = clubLevel(xp)
  if (level >= 10) return { level, into: 0, need: 0 }
  const base = XP_LEVELS[level - 1]
  return { level, into: xp - base, need: XP_LEVELS[level] - base }
}

export interface ScoreBreak {
  label: string
  pts: number
}

export function scoreBreakdown(run: RunState): { total: number; parts: ScoreBreak[] } {
  const s = run.stats
  const parts: ScoreBreak[] = [
    { label: 'Jornadas disputadas', pts: s.floors * 5 },
    { label: 'Goles a favor', pts: s.goalsFor * 3 },
    { label: 'Goles en contra', pts: -s.goalsAgainst },
    { label: 'Partidos Grandes ganados', pts: s.grandesWon * 25 },
    { label: 'Finales ganadas', pts: s.finalsWon * 100 },
    { label: 'Porterías a cero', pts: s.cleanSheets * 10 },
    { label: 'Remontadas', pts: s.comebacks * 15 },
  ]
  if (run.screen.k === 'ended' && run.screen.outcome === 'campeon') parts.push({ label: '¡Campeón de Europa!', pts: 250 })
  const sub = parts.reduce((a, p) => a + p.pts, 0)
  const mult = 1 + 0.1 * run.exig
  if (run.exig > 0) parts.push({ label: `Exigencia ${run.exig} (×${mult.toFixed(1)})`, pts: Math.round(sub * mult) - sub })
  return { total: Math.max(0, Math.round(sub * mult)), parts }
}

export interface RunEndResult {
  profile: Profile
  summary: RunSummary
  xpGained: number
  levelBefore: number
  levelAfter: number
  unlocks: string[]
}

export function applyRunEnd(p0: Profile, run: RunState, date: string): RunEndResult {
  const p: Profile = structuredClone(p0)
  const outcome: RunEnd = run.screen.k === 'ended' ? run.screen.outcome : 'abandono'
  const { total } = scoreBreakdown(run)
  const summary: RunSummary = {
    id: `${run.seed}-${run.club}-${date}`,
    seed: run.seed,
    club: run.club,
    exig: run.exig,
    daily: run.daily,
    outcome,
    act: run.act,
    floors: run.stats.floors,
    score: total,
    date,
    goalsFor: run.stats.goalsFor,
    goalsAgainst: run.stats.goalsAgainst,
    wins: run.stats.wins,
    deck: run.deck.map(c => c.def + (c.up ? '+' : '')),
    trofeos: run.trofeos.map(t => t.id),
  }
  p.history = [summary, ...p.history].slice(0, 50)
  p.totals.runs += 1
  p.totals.goals += run.stats.goalsFor
  p.totals.matches += run.stats.matches
  if (outcome === 'campeon') p.totals.titles += 1
  const unlocks: string[] = []
  const levelBefore = clubLevel(p.clubXp[run.club])
  const xpGained = outcome === 'abandono' ? Math.floor(total / 4) : total
  p.clubXp[run.club] += xpGained
  const levelAfter = clubLevel(p.clubXp[run.club])
  if (levelAfter > levelBefore) unlocks.push(`${run.club} sube a nivel ${levelAfter}: nuevas cartas en el sobre.`)
  // desbloqueo de clubes: ganar la Final del acto 1
  const passedAct1 = run.act >= 2 || outcome === 'campeon'
  if (passedAct1 && run.club === 'athletic' && !p.unlocked.includes('barcelona')) {
    p.unlocked.push('barcelona')
    unlocks.push('¡FC Barcelona desbloqueado!')
  }
  if (passedAct1 && run.club === 'barcelona' && !p.unlocked.includes('madrid')) {
    p.unlocked.push('madrid')
    unlocks.push('¡Real Madrid desbloqueado!')
  }
  if (outcome === 'campeon' && run.exig >= p.exigMax[run.club] && run.exig < MAX_EXIGENCIA && !run.daily) {
    p.exigMax[run.club] = run.exig + 1
    unlocks.push(`Exigencia ${run.exig + 1} desbloqueada para este club.`)
  }
  if (run.daily) {
    p.daily[date.slice(0, 10)] = Math.max(p.daily[date.slice(0, 10)] ?? 0, total)
  }
  const newAch = evaluateAchievements(run, p)
  for (const id of newAch) {
    p.achievements.push(id)
    const a = ACHIEVEMENTS.find(x => x.id === id)
    if (a) unlocks.push(`Logro: ${a.name}`)
  }
  for (const c of run.deck) if (!p.seenCards.includes(c.def)) p.seenCards.push(c.def)
  for (const t of run.trofeos) if (!p.seenTrofeos.includes(t.id)) p.seenTrofeos.push(t.id)
  for (const r of run.seenRivals) if (!p.seenRivals.includes(r)) p.seenRivals.push(r)
  return { profile: p, summary, xpGained, levelBefore, levelAfter, unlocks }
}

/** Marca como vistos cartas/trofeos/rivales durante la run (para el Álbum). */
export function markSeen(p0: Profile, kind: 'seenCards' | 'seenTrofeos' | 'seenRivals', ids: string[]): Profile {
  const add = ids.filter(id => !p0[kind].includes(id))
  if (!add.length) return p0
  return { ...p0, [kind]: [...p0[kind], ...add] }
}
