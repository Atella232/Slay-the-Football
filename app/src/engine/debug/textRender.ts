import type { RunState } from '../model/types'
import { Ctx } from '../match/ctx'
import { C, cardDef, rivalDef, trofeoDef, consumibleDef } from '../registry'
import { costOf, nameOf, playability } from '../match/cards'
import { previewIntent } from '../match/rival'
import { cardText, plainText } from '../text/cardText'
import { minuteOf } from '../match/flow'
import { reachableNodes } from '../run/run'
import { legalActions } from '../api'

/** Resumen serializable del estado para automatización y tests. */
export function renderState(run: RunState): Record<string, unknown> {
  const ctx = new Ctx(run)
  const scr = run.screen
  const base: Record<string, unknown> = {
    screen: scr.k,
    club: run.club,
    act: run.act,
    forma: run.forma,
    formaMax: run.formaMax,
    gold: run.gold,
    strikes: run.strikes,
    deck: run.deck.length,
    trofeos: run.trofeos.map(t => trofeoDef(t.id).name),
    consumibles: run.consumibles.map(c => (c ? consumibleDef(c).name : null)),
    legal: legalActions(run).length,
  }
  switch (scr.k) {
    case 'map':
      base.map = { current: run.map.current, options: reachableNodes(run).map(id => run.map.nodes.find(n => n.id === id)?.type + ':' + id), final: rivalDef(run.map.finalRival).name }
      break
    case 'match': {
      const m = scr.m
      base.match = {
        rival: rivalDef(m.rival.def).name,
        tier: m.tier,
        score: `${m.score.f}-${m.score.a}`,
        meta: m.meta,
        turn: m.turn,
        minute: minuteOf(m),
        phase: m.phase,
        prorroga: m.prorroga,
        energy: m.player.energy,
        block: m.player.block,
        cambios: m.player.cambios,
        res: m.player.res,
        statuses: m.player.st.map(s => `${s.id}:${s.n}`),
        rivalDefensa: `${m.rival.defensa}/${m.rival.segs[m.rival.seg]}`,
        rivalRepliegue: m.rival.repliegue,
        rivalStatuses: m.rival.st.map(s => `${s.id}:${s.n}`),
        kickoffLock: m.rival.kickoffLock,
        intent: m.rival.intent ? { name: m.rival.intent.name, parts: previewIntent(ctx) } : null,
        hand: m.piles.hand.map(uid => ({
          uid,
          name: nameOf(m.cards[uid]),
          cost: costOf(ctx, uid),
          playable: playability(ctx, uid).ok,
          text: plainText(cardText(cardDef(m.cards[uid].def), m.cards[uid].up, ctx)),
        })),
        piles: { draw: m.piles.draw.length, discard: m.piles.discard.length, agotadas: m.piles.agotadas.length, sistemas: m.piles.sistemas.map(u => nameOf(m.cards[u])) },
        pending: m.pending ? { kind: m.pending.kind, prompt: m.pending.prompt, min: m.pending.min, max: m.pending.max } : null,
        charlas: m.phase === 'charla' ? (m.charlas ?? []).map(id => C().charlas[id].name) : undefined,
        pens: m.pens ? { kicks: m.pens.kicks.length, tell: m.pens.tell, next: m.pens.next } : undefined,
        result: m.result,
        log: m.log.slice(-6),
      }
      break
    }
    case 'reward':
      base.reward = scr.r.items.map(i => ({ kind: i.kind, taken: i.taken, gold: i.gold, cards: i.cards?.map(c => cardDef(c.def).name), trofeo: i.trofeo, trofeos: i.trofeos }))
      break
    case 'shop':
      base.shop = scr.s.items.map(i => ({ kind: i.kind, id: i.id, price: i.price, sold: i.sold }))
      break
    case 'event':
      base.event = { id: scr.e.id, done: scr.e.done }
      break
    case 'ended':
      base.outcome = scr.outcome
      break
    default:
      break
  }
  return base
}

export function renderText(run: RunState): string {
  return JSON.stringify(renderState(run))
}
