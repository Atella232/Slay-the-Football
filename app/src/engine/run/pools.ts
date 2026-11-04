import type { Ctx } from '../match/ctx'
import type { CardDef, CardPoolSpec, Rarity, RunState, TrofeoTier } from '../model/types'
import type { RngState } from '../core/rng'
import { pick, rand, sample, weighted } from '../core/rng'
import { C } from '../registry'

export function cardPool(run: RunState, spec: CardPoolSpec = {}): CardDef[] {
  const club = spec.club ?? 'any'
  return Object.values(C().cards).filter(d => {
    if (d.rarity === 'inicial' || d.rarity === 'especial' || d.type === 'estado') return false
    if (d.unlock && d.unlock > run.clubLevel && d.club === run.club) return false
    if (club === 'own' && d.club !== run.club) return false
    if (club === 'neutral' && d.club !== 'neutral') return false
    if (club === 'any' && d.club !== 'neutral' && d.club !== run.club) return false
    if (spec.rarity && d.rarity !== spec.rarity) return false
    if (spec.type && d.type !== spec.type) return false
    return true
  })
}

export interface RarityOdds {
  comun: number
  poco: number
  rara: number
}

export const CARD_ODDS: Record<'liga' | 'copa' | 'tienda', RarityOdds> = {
  liga: { comun: 60, poco: 37, rara: 3 },
  copa: { comun: 50, poco: 40, rara: 10 },
  tienda: { comun: 50, poco: 37, rara: 13 },
}

export function rollRarity(run: RunState, rng: RngState, odds: RarityOdds): Rarity {
  const rareChance = Math.max(0, odds.rara + run.rareBonus)
  const r = rand(rng) * 100
  if (r < rareChance) {
    run.rareBonus = -2
    return 'rara'
  }
  run.rareBonus = Math.min(40, run.rareBonus + 1)
  return r < rareChance + odds.poco ? 'poco' : 'comun'
}

/** Genera n cartas distintas para una recompensa. */
export function rollCards(
  run: RunState,
  rng: RngState,
  n: number,
  odds: RarityOdds,
  opts: { forceRarity?: Rarity[]; ownShare?: number } = {},
): { def: string; up: boolean }[] {
  const out: { def: string; up: boolean }[] = []
  const used = new Set<string>()
  const ownShare = opts.ownShare ?? 0.7
  for (let i = 0; i < n; i++) {
    let rar: Rarity = opts.forceRarity ? pick(rng, opts.forceRarity) : rollRarity(run, rng, odds)
    const own = rand(rng) < ownShare
    let pool = cardPool(run, { club: own ? 'own' : 'neutral', rarity: rar }).filter(d => !used.has(d.id))
    if (pool.length === 0) pool = cardPool(run, { club: 'any', rarity: rar }).filter(d => !used.has(d.id))
    if (pool.length === 0) {
      rar = 'comun'
      pool = cardPool(run, { club: 'any', rarity: rar }).filter(d => !used.has(d.id))
    }
    if (pool.length === 0) break
    const d = pick(rng, pool)
    used.add(d.id)
    const upChance = run.act === 2 ? 0.12 : run.act === 3 ? 0.25 : 0
    out.push({ def: d.id, up: rar !== 'leyenda' && rand(rng) < upChance })
  }
  return out
}

export function trofeoPool(run: RunState, tier: TrofeoTier): string[] {
  const owned = new Set(run.trofeos.map(t => t.id))
  return Object.values(C().trofeos)
    .filter(t => t.tier === tier && !owned.has(t.id) && (!t.club || t.club === run.club))
    .map(t => t.id)
}

export function rollTrofeoTier(rng: RngState): TrofeoTier {
  return weighted<TrofeoTier>(rng, [
    { item: 'comun', w: 50 },
    { item: 'poco', w: 33 },
    { item: 'rara', w: 17 },
  ])
}

export function rollTrofeo(run: RunState, rng: RngState, tier?: TrofeoTier): string | null {
  const order: TrofeoTier[] = tier ? [tier] : [rollTrofeoTier(rng)]
  // incluye trofeos de club en la tirada (30% si quedan)
  const clubPool = trofeoPool(run, 'club')
  if (!tier && clubPool.length && rand(rng) < 0.2) return pick(rng, clubPool)
  for (const t of [...order, 'comun', 'poco', 'rara'] as TrofeoTier[]) {
    const pool = trofeoPool(run, t)
    if (pool.length) return pick(rng, pool)
  }
  return null
}

export function bossTrofeos(run: RunState, rng: RngState): string[] {
  return sample(rng, trofeoPool(run, 'jefe'), 3)
}

export function rollConsumible(rng: RngState): string {
  const all = Object.values(C().consumibles)
  const rar = weighted(rng, [
    { item: 'comun', w: 65 },
    { item: 'poco', w: 25 },
    { item: 'rara', w: 10 },
  ])
  const pool = all.filter(c => c.rarity === rar)
  return pick(rng, pool.length ? pool : all).id
}

export function slotsOf(ctx: Ctx | { run: RunState }): number {
  const run = ctx.run
  return run.consumibles.length
}
