import type { Ctx } from './ctx'
import type { PenaltyKick, Side } from '../model/types'
import { rand, randInt } from '../core/rng'
import { rivalDef } from '../registry'
import { endMatch } from './combat'
import { getStatus } from './status'

type Dir = 'L' | 'C' | 'R'
const DIRS: Dir[] = ['L', 'C', 'R']
export const MAX_PENALTY_ROUNDS = 20

function randomDir(ctx: Ctx): Dir {
  return DIRS[randInt(ctx.m.rng, 3)]
}

function otherDir(ctx: Ctx, not: Dir): Dir {
  const others = DIRS.filter(d => d !== not)
  return others[randInt(ctx.m.rng, 2)]
}

export function startPenalties(ctx: Ctx): void {
  const m = ctx.m
  m.phase = 'penalties'
  m.pens = { kicks: [], next: 'player', tell: randomDir(ctx), done: false }
  ctx.log('¡Penaltis! Elige dónde tirar. Fíjate en el portero.')
}

function goalsOf(kicks: PenaltyKick[], side: Side): number {
  return kicks.filter(k => k.side === side && k.goal).length
}

function kicksOf(kicks: PenaltyKick[], side: Side): number {
  return kicks.filter(k => k.side === side).length
}

function decided(kicks: PenaltyKick[]): Side | null {
  const pf = goalsOf(kicks, 'player')
  const pa = goalsOf(kicks, 'rival')
  const kf = kicksOf(kicks, 'player')
  const ka = kicksOf(kicks, 'rival')
  if (kf <= 5 && ka <= 5) {
    const remF = 5 - kf
    const remA = 5 - ka
    if (pf + remF < pa) return 'rival'
    if (pa + remA < pf) return 'player'
    if (kf === 5 && ka === 5 && pf !== pa) return pf > pa ? 'player' : 'rival'
    return null
  }
  // muerte súbita: tras cada par
  if (kf === ka && pf !== pa) return pf > pa ? 'player' : 'rival'
  return null
}

export function penaltyKick(ctx: Ctx, dir: Dir): void {
  const m = ctx.m
  const p = m.pens
  if (!p || p.done) throw new Error('No hay tanda de penaltis')
  const tells = rivalDef(m.rival.def).pens ?? { keeperTell: 0.65, shooterTell: 0.55 }
  let kick: PenaltyKick
  if (p.next === 'player') {
    // tú tiras: el portero tiende a tirarse hacia su pista
    const dive = rand(m.rng) < tells.keeperTell ? p.tell : otherDir(ctx, p.tell)
    const miss = Math.max(0, 0.08 - 0.02 * getStatus(ctx, 'player', 'confianza'))
    const goal = dive !== dir && rand(m.rng) >= miss
    kick = { side: 'player', dir, dive, goal }
    p.next = 'rival'
  } else {
    // tú paras: el lanzador tiende a tirar hacia su pista
    const shot = rand(m.rng) < tells.shooterTell ? p.tell : otherDir(ctx, p.tell)
    const bonus = Math.min(0.2, 0.05 * m.stats.paradas)
    let goal = shot !== dir
    if (goal && rand(m.rng) < bonus) goal = false
    if (goal && rand(m.rng) < 0.08) goal = false
    kick = { side: 'rival', dir: shot, dive: dir, goal }
    p.next = 'player'
  }
  p.kicks.push(kick)
  ctx.emit({ e: 'penalty', kick })
  p.tell = randomDir(ctx)
  const win = decided(p.kicks)
  if (win) {
    p.done = true
    endMatch(ctx, win === 'player' ? 'victoria' : 'derrota')
    return
  }
  if (p.kicks.length >= MAX_PENALTY_ROUNDS * 2) {
    p.done = true
    endMatch(ctx, m.stats.paradas >= m.stats.goalsAgainst ? 'victoria' : 'derrota')
  }
}

export function penaltyScore(kicks: PenaltyKick[]): { f: number; a: number } {
  return { f: goalsOf(kicks, 'player'), a: goalsOf(kicks, 'rival') }
}
