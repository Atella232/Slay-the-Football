import type { Action, RunState } from '../../engine/model/types'
import type { RngState } from '../../engine/core/rng'
import { pick, rand } from '../../engine/core/rng'
import { C, cardDef } from '../../engine/registry'
import { optionAvailable } from '../../engine/run/run'

const RARITY_SCORE: Record<string, number> = { inicial: 0, comun: 3, poco: 5, rara: 8, leyenda: 10, especial: 2 }

export function cardScore(run: RunState, def: string, up: boolean): number {
  const d = cardDef(def)
  let s = RARITY_SCORE[d.rarity] ?? 1
  if (d.club === run.club) s += 1.5
  if (up) s += 1
  if (d.type === 'sistema') s += 0.5
  if (d.type === 'estado') s -= 20
  // tamaño de mazo
  if (run.deck.length > 22) s -= (run.deck.length - 22) * 0.4
  return s
}

/** Decisiones fuera de partido compartidas por los bots. */
export function runPolicy(state: RunState, legal: Action[], rng: RngState): Action {
  const scr = state.screen
  switch (scr.k) {
    case 'map': {
      const nodes = legal.filter(a => a.t === 'node') as { t: 'node'; id: string }[]
      const pct = state.forma / state.formaMax
      const score = (id: string) => {
        const n = state.map.nodes.find(x => x.id === id)!
        switch (n.type) {
          case 'grande': return pct > 0.7 ? 6 : pct > 0.5 ? 2 : -4
          case 'concentracion': return pct < 0.5 ? 8 : 2
          case 'mercado': return state.gold >= 120 ? 6 : 1
          case 'evento': return 4
          case 'vitrina': return 7
          case 'partido': return 3
          default: return 0
        }
      }
      let best = nodes[0]
      let bs = -Infinity
      for (const a of nodes) {
        const s = score(a.id) + rand(rng)
        if (s > bs) {
          bs = s
          best = a
        }
      }
      return best
    }
    case 'reward': {
      for (const a of legal) {
        if (a.t !== 'take') continue
        const it = scr.r.items[a.i]
        if (it.kind === 'gold' || it.kind === 'trofeo' || it.kind === 'consumible') return a
      }
      const tro = legal.filter(a => a.t === 'take' && scr.r.items[a.i].kind === 'trofeoChoice')
      if (tro.length) return pick(rng, tro)
      const cards = legal.filter(a => a.t === 'take' && scr.r.items[a.i].kind === 'cards') as { t: 'take'; i: number; choice: number }[]
      if (cards.length) {
        let best: (typeof cards)[number] | null = null
        let bs = 4.5
        for (const a of cards) {
          const c = scr.r.items[a.i].cards![a.choice]
          const s = cardScore(state, c.def, c.up)
          if (s > bs) {
            bs = s
            best = a
          }
        }
        if (best) return best
      }
      return { t: 'proceed' }
    }
    case 'shop': {
      if (legal.some(a => a.t === 'removeService')) return { t: 'removeService' }
      const buys = legal.filter(a => a.t === 'buy') as { t: 'buy'; i: number }[]
      for (const a of buys) {
        const it = scr.s.items[a.i]
        if (it.kind === 'trofeo') return a
        if (it.kind === 'card' && cardScore(state, it.id, false) >= 7) return a
      }
      return { t: 'proceed' }
    }
    case 'deckPick': {
      const picks = legal.filter(a => a.t === 'deckPick') as { t: 'deckPick'; uids: number[] }[]
      if (scr.p.purpose === 'remove' || scr.p.purpose === 'transform') {
        const order = (uid: number) => {
          const c = state.deck.find(x => x.uid === uid)!
          const d = cardDef(c.def)
          if (d.type === 'estado') return 0
          if (d.id === 'neu.despeje') return 1
          if (d.id === 'neu.disparo') return 2
          return 10
        }
        return picks.slice().sort((a, b) => order(a.uids[0]) - order(b.uids[0]))[0]
      }
      if (scr.p.purpose === 'upgrade') {
        const order = (uid: number) => -cardScore(state, state.deck.find(x => x.uid === uid)!.def, false)
        return picks.slice().sort((a, b) => order(a.uids[0]) - order(b.uids[0]))[0]
      }
      return picks[0]
    }
    case 'cardChoice': {
      let best: Action = { t: 'cardChoice', i: -1 }
      let bs = 4
      scr.c.cards.forEach((c, i) => {
        const s = cardScore(state, c.def, c.up)
        if (s > bs) {
          bs = s
          best = { t: 'cardChoice', i }
        }
      })
      return best
    }
    case 'rest': {
      if (scr.done) return { t: 'proceed' }
      const pct = state.forma / state.formaMax
      if (pct < 0.6 && legal.some(a => a.t === 'rest' && a.o === 'heal')) return { t: 'rest', o: 'heal' }
      if (legal.some(a => a.t === 'rest' && a.o === 'entrenar')) return { t: 'rest', o: 'entrenar' }
      return legal[0]
    }
    case 'event': {
      if (scr.e.done) return { t: 'proceed' }
      const ev = C().events[scr.e.id]
      const opts = legal.filter(a => a.t === 'event' && optionAvailable(state, ev, a.i))
      return opts.length ? pick(rng, opts) : legal[0]
    }
    case 'treasure':
      return legal.find(a => a.t === 'take') ?? { t: 'proceed' }
    default:
      return legal.find(a => a.t === 'proceed') ?? legal[0]
  }
}
