import type { Ctx } from '../match/ctx'
import type {
  Act,
  CardInst,
  ClubId,
  DeckPickPurpose,
  RunEnd,
  ShopState,
  EventDef,
  MapNode,
  RewardItem,
  RunOp,
  RunState,
  RunStream,
  Screen,
  ShopItem,
  Tier,
} from '../model/types'
import { seedRng, pick, rand, randInt, sample, weighted } from '../core/rng'
import { C, cardDef, clubDef, consumibleDef, trofeoDef } from '../registry'
import { assert, EngineError } from '../core/assert'
import { generateMap, reachable, FINAL_ID } from './map/generate'
import { createMatch } from '../match/flow'
import { heal, loseForma } from '../match/combat'
import { hasRunMod, runMod } from '../match/modifiers'
import { CARD_ODDS, bossTrofeos, cardPool, rollCards, rollConsumible, rollTrofeo } from './pools'

export const SAVE_VERSION = 1
export const STRIKE_LIMIT = 3
export const BASE_SLOTS = 3

const STREAMS: RunStream[] = ['map', 'rivals', 'rewards', 'cardRewards', 'shop', 'events', 'treasure', 'charlas', 'consumibles', 'misc']

export interface NewRunOpts {
  seed: string
  club: ClubId
  exig?: number
  daily?: boolean
  clubLevel?: number
}

export function newRun(opts: NewRunOpts): RunState {
  const club = clubDef(opts.club)
  const exig = opts.exig ?? 0
  const rng = {} as Record<RunStream, ReturnType<typeof seedRng>>
  for (const s of STREAMS) rng[s] = seedRng(opts.seed, s)
  let uid = 1
  const deck: CardInst[] = club.starter.map(def => ({ uid: uid++, def, up: false }))
  let formaMax = club.forma
  if (exig >= 14) formaMax -= 5
  const run: RunState = {
    v: SAVE_VERSION,
    contentV: C().version,
    seed: opts.seed,
    club: opts.club,
    exig,
    daily: !!opts.daily,
    clubLevel: opts.clubLevel ?? 10,
    act: 1,
    map: { act: 1, nodes: [], current: null, visited: [], finalRival: '' },
    forma: formaMax,
    formaMax,
    gold: 99,
    deck,
    trofeos: [],
    consumibles: new Array(exig >= 11 ? BASE_SLOTS - 1 : BASE_SLOTS).fill(null),
    strikes: 0,
    nextUid: uid,
    removeCount: 0,
    rng,
    screen: { k: 'map' },
    stats: {
      floors: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      grandesWon: 0,
      finalsWon: 0,
      penaltiesPlayed: 0,
      comebacks: 0,
      goldEarned: 0,
      cardsPicked: [],
      trofeosPicked: [],
      maxDamageTurn: 0,
      perfectMatches: 0,
    },
    seenRivals: [],
    seenEvents: [],
    lastRivals: [],
    rareBonus: 0,
    log: [],
  }
  if (exig >= 6) run.deck.push({ uid: run.nextUid++, def: 'est.nervios', up: false })
  setupAct(run, 1)
  // trofeo inicial del club
  run.trofeos.push({ id: club.starterTrofeo, ctr: 0 })
  return run
}

function finalsFor(run: RunState, act: Act): string[] {
  return Object.values(C().rivals)
    .filter(r => r.act === act && r.tier === 'final' && r.crest !== run.club)
    .map(r => r.id)
}

export function setupAct(run: RunState, act: Act): void {
  run.act = act
  // la directiva renueva su confianza tras cada ascenso
  if (act > 1) run.strikes = 0
  const nodes = generateMap(act, run.exig, run.rng.map)
  const finals = finalsFor(run, act)
  const finalRival = pick(run.rng.rivals, finals)
  run.map = { act, nodes, current: null, visited: [], finalRival }
  run.screen = { k: 'map' }
}

// ───────────────────────── Mapa ─────────────────────────

export function reachableNodes(run: RunState): string[] {
  return reachable(run.map.nodes, run.map.current)
}

function easyCount(run: RunState): number {
  return run.act === 1 ? 3 : 2
}

function pickRival(run: RunState, tier: 'liga' | 'copa'): string {
  const all = Object.values(C().rivals).filter(r => r.act === run.act && r.tier === tier)
  const ligaPlayed = run.map.visited
    .map(id => run.map.nodes.find(n => n.id === id))
    .filter(n => n && n.type === 'partido').length
  let pool = all
  if (tier === 'liga') {
    const wantEasy = ligaPlayed <= easyCount(run)
    const filtered = all.filter(r => !!r.easy === wantEasy)
    if (filtered.length) pool = filtered
    const fresh = pool.filter(r => !run.lastRivals.includes(r.id))
    if (fresh.length) pool = fresh
  } else {
    const fresh = pool.filter(r => !run.seenRivals.includes(r.id))
    if (fresh.length) pool = fresh
  }
  const r = pick(run.rng.rivals, pool)
  return r.id
}

export function enterNode(ctx: Ctx, id: string): void {
  const run = ctx.run
  assert(run.screen.k === 'map', 'No estás en el mapa')
  assert(reachableNodes(run).includes(id), 'Nodo no alcanzable')
  const node = run.map.nodes.find(n => n.id === id) as MapNode
  run.map.current = id
  run.map.visited.push(id)
  run.stats.floors += 1
  switch (node.type) {
    case 'partido':
      return startRunMatch(ctx, pickRival(run, 'liga'), 'liga', id)
    case 'grande':
      return startRunMatch(ctx, pickRival(run, 'copa'), 'copa', id)
    case 'final':
      return startRunMatch(ctx, run.map.finalRival, 'final', id)
    case 'concentracion':
      run.screen = { k: 'rest', done: false }
      break
    case 'mercado':
      run.screen = { k: 'shop', s: makeShop(run) }
      break
    case 'evento':
      run.screen = { k: 'event', e: { id: pickEvent(run), done: false } }
      break
    case 'vitrina': {
      const trofeo = rollTrofeo(run, run.rng.treasure)
      const gold = 20 + randInt(run.rng.treasure, 21)
      run.screen = { k: 'treasure', trofeo, gold, taken: false }
      break
    }
  }
  ctx.emit({ e: 'screen', k: run.screen.k })
}

export function startRunMatch(ctx: Ctx, rivalId: string, tier: Tier, nodeId: string): void {
  const run = ctx.run
  if (!run.seenRivals.includes(rivalId)) run.seenRivals.push(rivalId)
  run.lastRivals = [...run.lastRivals, rivalId].slice(-2)
  createMatch(ctx, rivalId, tier, nodeId)
  if (ctx.run.screen.k === 'match' && ctx.run.screen.m.phase === 'ended') afterMatch(ctx)
}

// ───────────────────────── Resultado de partido ─────────────────────────

function goldFor(run: RunState, tier: Tier): number {
  const rng = run.rng.rewards
  const base = run.act === 1 ? 16 : run.act === 2 ? 24 : 32
  const span = run.act === 1 ? 10 : run.act === 2 ? 10 : 12
  let g = base + randInt(rng, span + 1)
  if (tier === 'copa') g += 22
  if (tier === 'final') g += 90
  g = Math.floor((g * (100 + runMod(run, 'goldPct'))) / 100)
  return g
}

export function strikeLimit(run: RunState): number {
  return run.exig >= 10 ? 2 : STRIKE_LIMIT
}

export function afterMatch(ctx: Ctx): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'match', 'No hay partido')
  const m = scr.m
  const result = m.result
  assert(result, 'Partido sin resultado')
  run.stats.matches += 1
  run.stats.goalsFor += m.score.f
  run.stats.goalsAgainst += m.score.a
  if (m.pens) run.stats.penaltiesPlayed += 1
  if (run.forma <= 0) {
    endRun(ctx, 'lesionado')
    return
  }
  const tier = m.tier
  if (result === 'victoria') {
    run.stats.wins += 1
    if (m.score.a === 0) run.stats.cleanSheets += 1
    if (m.score.a === 0 && m.stats.formaLost === 0) run.stats.perfectMatches += 1
    if (m.stats.maxDeficit > 0) run.stats.comebacks += 1
    // Crisis se va con la victoria
    const crisis = run.deck.findIndex(c => c.def === 'est.crisis')
    if (crisis >= 0) run.deck.splice(crisis, 1)
    const healWin = runMod(run, 'healAfterWin')
    if (healWin > 0) heal(ctx, healWin)
    if (tier === 'final') run.stats.finalsWon += 1
    if (tier === 'copa') run.stats.grandesWon += 1
    run.screen = { k: 'reward', r: buildRewards(run, tier, 'victoria') }
  } else if (result === 'empate') {
    run.stats.draws += 1
    run.screen = { k: 'reward', r: buildRewards(run, tier, 'empate') }
  } else {
    run.stats.losses += 1
    if (tier === 'final') {
      endRun(ctx, 'eliminado')
      return
    }
    if (tier !== 'amistoso') {
      run.strikes += 1
      loseForma(ctx, Math.ceil(run.formaMax * 0.1))
      if (run.exig >= 8) {
        run.formaMax = Math.max(1, run.formaMax - 3)
        run.forma = Math.min(run.forma, run.formaMax)
      }
      run.deck.push({ uid: run.nextUid++, def: 'est.crisis', up: false })
      if (run.forma <= 0) {
        endRun(ctx, 'lesionado')
        return
      }
      if (run.strikes >= strikeLimit(run)) {
        endRun(ctx, 'destituido')
        return
      }
    }
    run.screen = { k: 'reward', r: { title: 'Derrota', items: [], after: 'map' } }
  }
  ctx.emit({ e: 'screen', k: run.screen.k })
}

function buildRewards(run: RunState, tier: Tier, result: 'victoria' | 'empate') {
  const items: RewardItem[] = []
  const gold = goldFor(run, tier)
  const choices = Math.max(1, 3 + runMod(run, 'cardChoices'))
  if (result === 'empate') {
    items.push({ kind: 'gold', gold: Math.floor(gold / 2), taken: false })
    items.push({ kind: 'cards', cards: rollCards(run, run.rng.cardRewards, Math.max(1, choices - 1), CARD_ODDS.liga), taken: false })
    return { title: 'Empate', items, after: 'map' as const }
  }
  items.push({ kind: 'gold', gold, taken: false })
  if (tier === 'final') {
    items.push({
      kind: 'cards',
      cards: rollCards(run, run.rng.cardRewards, choices, CARD_ODDS.copa, { forceRarity: ['rara', 'rara', 'leyenda'] }),
      taken: false,
    })
    const boss = bossTrofeos(run, run.rng.rewards)
    if (boss.length) items.push({ kind: 'trofeoChoice', trofeos: boss, taken: false })
    return { title: '¡Campeones!', items, after: 'actEnd' as const }
  }
  items.push({ kind: 'cards', cards: rollCards(run, run.rng.cardRewards, choices, tier === 'copa' ? CARD_ODDS.copa : CARD_ODDS.liga), taken: false })
  if (tier === 'copa') {
    const t = rollTrofeo(run, run.rng.rewards)
    if (t) items.push({ kind: 'trofeo', trofeo: t, taken: false })
  }
  const potChance = tier === 'copa' ? 0.5 : 0.4
  if (rand(run.rng.consumibles) < potChance) items.push({ kind: 'consumible', consumible: rollConsumible(run.rng.consumibles), taken: false })
  return { title: 'Victoria', items, after: 'map' as const }
}

export function takeReward(ctx: Ctx, i: number, choice?: number): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'reward', 'No hay recompensas')
  const it = scr.r.items[i]
  assert(it && !it.taken, 'Recompensa no disponible')
  switch (it.kind) {
    case 'gold':
      gainGold(ctx, it.gold ?? 0)
      it.taken = true
      break
    case 'cards': {
      const c = it.cards?.[choice ?? -1]
      assert(c, 'Elige una carta')
      addCardToDeck(ctx, c.def, c.up)
      run.stats.cardsPicked.push(c.def)
      it.taken = true
      break
    }
    case 'trofeo':
      gainTrofeo(ctx, it.trofeo!)
      it.taken = true
      break
    case 'trofeoChoice': {
      const id = it.trofeos?.[choice ?? -1]
      assert(id, 'Elige un trofeo')
      gainTrofeo(ctx, id)
      it.taken = true
      break
    }
    case 'consumible': {
      const slot = run.consumibles.indexOf(null)
      assert(slot >= 0, 'No tienes huecos libres')
      run.consumibles[slot] = it.consumible!
      it.taken = true
      break
    }
  }
}

export function proceed(ctx: Ctx): void {
  const run = ctx.run
  const scr = run.screen
  switch (scr.k) {
    case 'reward': {
      // el oro se cobra siempre
      for (const it of scr.r.items) if (it.kind === 'gold' && !it.taken) {
        gainGold(ctx, it.gold ?? 0)
        it.taken = true
      }
      if (scr.r.after === 'actEnd') {
        if (run.act === 3) return endRun(ctx, 'campeon')
        const missing = run.formaMax - run.forma
        const pct = Math.max(0, 60 + runMod(run, 'actHealPct') - (run.exig >= 5 ? 15 : 0))
        const healed = Math.floor((missing * pct) / 100)
        heal(ctx, healed)
        run.screen = { k: 'actEnd', healed }
      } else run.screen = { k: 'map' }
      break
    }
    case 'actEnd':
      setupAct(run, (run.act + 1) as Act)
      break
    case 'shop':
    case 'rest':
    case 'treasure':
      run.screen = { k: 'map' }
      break
    case 'event':
      assert(scr.e.done, 'Elige una opción del evento')
      run.screen = { k: 'map' }
      break
    default:
      throw new EngineError(`No se puede avanzar desde ${scr.k}`)
  }
  ctx.emit({ e: 'screen', k: run.screen.k })
}

export function endRun(ctx: Ctx, outcome: RunEnd): void {
  ctx.run.screen = { k: 'ended', outcome }
  ctx.emit({ e: 'screen', k: 'ended' })
}

// ───────────────────────── Economía y mazo ─────────────────────────

export function gainGold(ctx: Ctx, n: number): void {
  ctx.run.gold += n
  if (n > 0) ctx.run.stats.goldEarned += n
  ctx.emit({ e: 'gold', n })
}

export function addCardToDeck(ctx: Ctx, def: string, up = false): void {
  cardDef(def)
  ctx.run.deck.push({ uid: ctx.run.nextUid++, def, up })
  ctx.emit({ e: 'cardAdded', def })
}

export function gainTrofeo(ctx: Ctx, id: string): void {
  const run = ctx.run
  const d = trofeoDef(id)
  if (run.trofeos.some(t => t.id === id)) return
  run.trofeos.push({ id, ctr: 0 })
  run.stats.trofeosPicked.push(id)
  for (const rm of d.runMods ?? []) {
    if (rm.stat === 'consumibleSlots') {
      if (rm.n > 0) for (let i = 0; i < rm.n; i++) run.consumibles.push(null)
      else run.consumibles.splice(run.consumibles.length + rm.n, -rm.n)
    }
    if (rm.stat === 'formaMax') {
      run.formaMax = Math.max(1, run.formaMax + rm.n)
      run.forma = Math.max(1, Math.min(run.formaMax, run.forma + Math.max(0, rm.n)))
    }
  }
  if (d.onPickup) execRunOps(ctx, d.onPickup)
  ctx.emit({ e: 'trofeoProc', id })
}

// ───────────────────────── Tienda ─────────────────────────

function priceFor(run: RunState, base: number): number {
  let pct = 100 + runMod(run, 'shopPct')
  if (run.exig >= 12) pct += 10
  const jitter = 0.9 + rand(run.rng.shop) * 0.2
  return Math.max(1, Math.round((base * pct * jitter) / 100))
}

export function removePrice(run: RunState): number {
  return 75 + 25 * run.removeCount + runMod(run, 'removeCostAdd')
}

export function makeShop(run: RunState): ShopState {
  const rng = run.rng.shop
  const items: ShopItem[] = []
  const cardPrices = { comun: 50, poco: 75, rara: 145, leyenda: 200 } as Record<string, number>
  const own = [
    ...sample(rng, cardPool(run, { club: 'own', rarity: 'comun' }), 2),
    ...sample(rng, cardPool(run, { club: 'own', rarity: 'poco' }), 2),
    ...sample(rng, cardPool(run, { club: 'own', rarity: 'rara' }), 1),
  ]
  const neu = [
    ...sample(rng, cardPool(run, { club: 'neutral', rarity: weighted(rng, [{ item: 'comun' as const, w: 1 }, { item: 'poco' as const, w: 1 }]) }), 1),
    ...sample(rng, cardPool(run, { club: 'neutral', rarity: 'rara' }), 1),
  ]
  for (const d of [...own, ...neu]) items.push({ kind: 'card', id: d.id, price: priceFor(run, cardPrices[d.rarity] ?? 60), sold: false })
  // una carta rebajada
  const cards = items.filter(i => i.kind === 'card')
  if (cards.length) {
    const sale = pick(rng, cards)
    sale.price = Math.max(1, Math.floor(sale.price / 2))
  }
  const trofeoPrices: Record<string, number> = { comun: 100, poco: 150, rara: 250, tienda: 160, club: 160 }
  const t1 = rollTrofeo(run, rng)
  const t2 = rollTrofeo(run, rng)
  const shopPool = Object.values(C().trofeos).filter(t => t.tier === 'tienda' && !run.trofeos.some(o => o.id === t.id))
  const t3 = shopPool.length ? pick(rng, shopPool).id : null
  for (const t of [t1, t2, t3]) {
    if (!t || items.some(i => i.id === t)) continue
    items.push({ kind: 'trofeo', id: t, price: priceFor(run, trofeoPrices[trofeoDef(t).tier] ?? 150), sold: false })
  }
  if (!hasRunMod(run, 'noConsumibleShop')) {
    for (let k = 0; k < 3; k++) {
      const c = rollConsumible(rng)
      const rp = { comun: 45, poco: 65, rara: 85 }[consumibleDef(c).rarity]
      items.push({ kind: 'consumible', id: c, price: priceFor(run, rp), sold: false })
    }
  }
  return { items, removePrice: removePrice(run), removeUsed: false }
}

export function buy(ctx: Ctx, i: number): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'shop', 'No estás en el mercado')
  const it = scr.s.items[i]
  assert(it && !it.sold, 'Artículo no disponible')
  assert(run.gold >= it.price, 'No tienes oro suficiente')
  if (it.kind === 'consumible') assert(run.consumibles.includes(null), 'No tienes huecos libres')
  run.gold -= it.price
  it.sold = true
  if (it.kind === 'card') {
    addCardToDeck(ctx, it.id, !!it.up)
    run.stats.cardsPicked.push(it.id)
  } else if (it.kind === 'trofeo') gainTrofeo(ctx, it.id)
  else run.consumibles[run.consumibles.indexOf(null)] = it.id
  ctx.emit({ e: 'gold', n: -it.price })
}

export function removeService(ctx: Ctx): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'shop', 'No estás en el mercado')
  assert(!scr.s.removeUsed, 'Ya usaste este servicio')
  assert(run.gold >= scr.s.removePrice, 'No tienes oro suficiente')
  run.gold -= scr.s.removePrice
  scr.s.removeUsed = true
  run.removeCount += 1
  run.screen = { k: 'deckPick', p: { purpose: 'remove', n: 1, back: scr } }
}

// ───────────────────────── Descanso ─────────────────────────

export function restHealAmount(run: RunState): number {
  const pct = (run.exig >= 5 ? 30 : 35) + runMod(run, 'restHealPct')
  return Math.floor((run.formaMax * pct) / 100)
}

export function rest(ctx: Ctx, o: 'heal' | 'entrenar'): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'rest' && !scr.done, 'No puedes descansar ahora')
  const both = hasRunMod(run, 'restUpgradeAndHeal')
  if (o === 'heal') {
    assert(!hasRunMod(run, 'noRest'), 'No puedes descansar')
    heal(ctx, restHealAmount(run))
    if (both && upgradable(run).length) {
      run.screen = { k: 'deckPick', p: { purpose: 'upgrade', n: 1, back: { k: 'rest', done: true } } }
      return
    }
    run.screen = { k: 'rest', done: true }
  } else {
    assert(upgradable(run).length > 0, 'No hay cartas que mejorar')
    if (both && !hasRunMod(run, 'noRest')) heal(ctx, restHealAmount(run))
    run.screen = { k: 'deckPick', p: { purpose: 'upgrade', n: 1, back: { k: 'rest', done: true } } }
  }
}

export function upgradable(run: RunState): CardInst[] {
  return run.deck.filter(c => !c.up && cardDef(c.def).type !== 'estado' && Object.keys(cardDef(c.def).up).length > 0)
}

// ───────────────────────── Selección de mazo / cartas ─────────────────────────

export function deckPickCandidates(run: RunState, purpose: DeckPickPurpose): CardInst[] {
  switch (purpose) {
    case 'upgrade': return upgradable(run)
    case 'remove': return run.deck.slice()
    case 'transform': return run.deck.filter(c => cardDef(c.def).rarity !== 'especial')
    case 'duplicate': return run.deck.filter(c => cardDef(c.def).type !== 'estado')
  }
}

export function resolveDeckPick(ctx: Ctx, uids: number[]): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'deckPick', 'No hay selección de mazo')
  const p = scr.p
  const cands = deckPickCandidates(run, p.purpose)
  const n = Math.min(p.n, cands.length)
  const uniq = Array.from(new Set(uids))
  assert(uniq.length === n, `Elige ${n} carta(s)`)
  for (const uid of uniq) assert(cands.some(c => c.uid === uid), 'Carta no elegible')
  for (const uid of uniq) {
    const idx = run.deck.findIndex(c => c.uid === uid)
    const inst = run.deck[idx]
    switch (p.purpose) {
      case 'remove':
        run.deck.splice(idx, 1)
        break
      case 'upgrade':
        inst.up = true
        break
      case 'transform': {
        const d = cardDef(inst.def)
        const pool = cardPool(run, { club: 'any' }).filter(x => x.id !== d.id && x.rarity !== 'leyenda')
        const nd = pick(run.rng.misc, pool)
        run.deck[idx] = { uid: run.nextUid++, def: nd.id, up: false }
        break
      }
      case 'duplicate':
        run.deck.push({ uid: run.nextUid++, def: inst.def, up: inst.up })
        break
    }
  }
  run.screen = p.back
  if (p.then?.length) execRunOps(ctx, p.then)
}

export function resolveCardChoice(ctx: Ctx, i: number): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'cardChoice', 'No hay elección de carta')
  if (i >= 0) {
    const c = scr.c.cards[i]
    assert(c, 'Carta no válida')
    addCardToDeck(ctx, c.def, c.up)
    run.stats.cardsPicked.push(c.def)
  }
  run.screen = scr.c.back
  if (scr.c.then?.length) execRunOps(ctx, scr.c.then)
}

// ───────────────────────── Eventos ─────────────────────────

function pickEvent(run: RunState): string {
  const all = Object.values(C().events).filter(e => e.acts.includes(run.act))
  let pool = all.filter(e => !run.seenEvents.includes(e.id))
  if (pool.length === 0) pool = all
  const e = pick(run.rng.events, pool)
  run.seenEvents.push(e.id)
  return e.id
}

export function optionAvailable(run: RunState, ev: EventDef, i: number): boolean {
  const o = ev.options[i]
  if (!o) return false
  const r = o.requires
  if (!r) return true
  if (r.gold !== undefined && run.gold < r.gold) return false
  if (r.forma !== undefined && run.forma <= r.forma) return false
  if (r.club && r.club !== run.club) return false
  if (r.deckType && !run.deck.some(c => cardDef(c.def).type === r.deckType)) return false
  return true
}

export function chooseEvent(ctx: Ctx, i: number): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'event' && !scr.e.done, 'No hay evento activo')
  const ev = C().events[scr.e.id]
  assert(optionAvailable(run, ev, i), 'Opción no disponible')
  scr.e.done = true
  scr.e.resultText = ev.options[i].text
  execRunOps(ctx, ev.options[i].ops)
}

/** Ejecuta ops de run; las que requieren elección cambian de pantalla y devuelven el control. */
export function execRunOps(ctx: Ctx, ops: RunOp[]): void {
  const run = ctx.run
  const queue = ops.slice()
  while (queue.length) {
    const op = queue.shift()!
    switch (op.op) {
      case 'gold':
        if (op.n >= 0) gainGold(ctx, op.n)
        else {
          run.gold = Math.max(0, run.gold + op.n)
          ctx.emit({ e: 'gold', n: op.n })
        }
        break
      case 'heal':
        heal(ctx, op.n)
        break
      case 'healPct':
        heal(ctx, Math.floor((run.formaMax * op.n) / 100))
        break
      case 'loseForma':
        run.forma = Math.max(1, run.forma - op.n)
        ctx.emit({ e: 'forma', n: -op.n })
        break
      case 'formaMax':
        run.formaMax = Math.max(1, run.formaMax + op.n)
        if (op.n > 0) run.forma += op.n
        run.forma = Math.min(run.forma, run.formaMax)
        break
      case 'addCard':
        addCardToDeck(ctx, op.def, !!op.upgraded)
        break
      case 'trofeo': {
        const id = op.id ?? rollTrofeo(run, run.rng.events, op.tier)
        if (id) gainTrofeo(ctx, id)
        break
      }
      case 'consumible': {
        const slot = run.consumibles.indexOf(null)
        if (slot >= 0) run.consumibles[slot] = op.id ?? rollConsumible(run.rng.consumibles)
        break
      }
      case 'random': {
        const o = weighted(run.rng.events, op.options.map(x => ({ item: x, w: x.w })))
        if (run.screen.k === 'event') run.screen.e.resultText = o.text
        queue.unshift(...o.ops)
        break
      }
      case 'deckPick': {
        const back: Screen = run.screen
        if (deckPickCandidates(run, op.purpose).length === 0) break
        run.screen = { k: 'deckPick', p: { purpose: op.purpose, n: op.n, back, then: queue.slice() } }
        return
      }
      case 'addCardChoice': {
        const back: Screen = run.screen
        const pool = cardPool(run, op.pool)
        const cards = sample(run.rng.events, pool, op.n).map(d => ({ def: d.id, up: false }))
        if (!cards.length) break
        run.screen = { k: 'cardChoice', c: { cards, back, then: queue.slice() } }
        return
      }
      case 'startMatch': {
        const rival = op.rival ?? pickRival(run, op.tier === 'copa' ? 'copa' : 'liga')
        startRunMatch(ctx, rival, op.tier, `${run.map.current ?? 'ev'}-ev`)
        return
      }
    }
  }
}

// ───────────────────────── Vitrina ─────────────────────────

export function takeTreasure(ctx: Ctx): void {
  const run = ctx.run
  const scr = run.screen
  assert(scr.k === 'treasure' && !scr.taken, 'Nada que recoger')
  if (scr.trofeo) gainTrofeo(ctx, scr.trofeo)
  gainGold(ctx, scr.gold)
  scr.taken = true
}

export { FINAL_ID }
