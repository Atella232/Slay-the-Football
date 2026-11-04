import { describe, expect, it } from 'vitest'
import { C } from '../engine/registry'
import type { EffectOp, RunOp } from '../engine/model/types'
import { cardText, plainText } from '../engine/text/cardText'
import { M, act, matchWith, setHand } from '../test/kit'
import { Ctx } from '../engine/match/ctx'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walkOps(ops: EffectOp[], f: (o: EffectOp) => void) {
  for (const o of ops) {
    f(o)
    if (o.op === 'if') {
      walkOps(o.then, f)
      if (o.else) walkOps(o.else, f)
    }
    if (o.op === 'repeat') walkOps(o.ops, f)
    if (o.op === 'spendRes') walkOps(o.then, f)
    if (o.op === 'pick' && o.then) walkOps(o.then, f)
    if (o.op === 'choose') o.options.forEach(x => walkOps(x.ops, f))
  }
}

function allOps(): EffectOp[] {
  const out: EffectOp[] = []
  const push = (ops?: EffectOp[]) => ops && walkOps(ops, o => out.push(o))
  const c = C()
  for (const d of Object.values(c.cards)) {
    push(d.ops)
    push(d.up.ops)
    d.hooks?.forEach(h => push(h.ops))
    d.up.hooks?.forEach(h => push(h.ops))
    d.inHand?.forEach(h => push(h.ops))
  }
  for (const t of Object.values(c.trofeos)) {
    t.hooks?.forEach(h => push(h.ops))
    if (t.counter) push(t.counter.ops)
  }
  for (const r of Object.values(c.rivals)) {
    r.hooks?.forEach(h => push(h.ops))
    const ais = [r.ai, ...(r.phases ?? []).map(p => p.ai)]
    for (const ai of ais) for (const mv of Object.values(ai.moves)) for (const p of mv.parts) if (p.k === 'presion' || p.k === 'buff') push(p.ops)
    r.phases?.forEach(p => push(p.onEnter))
  }
  for (const x of Object.values(c.consumibles)) push(x.ops)
  for (const x of Object.values(c.charlas)) push(x.ops)
  for (const cl of Object.values(c.clubs)) cl.passive.hooks.forEach(h => push(h.ops))
  return out
}

function allRunOps(): RunOp[] {
  const out: RunOp[] = []
  const push = (ops?: RunOp[]) => {
    for (const o of ops ?? []) {
      out.push(o)
      if (o.op === 'random') o.options.forEach(x => push(x.ops))
    }
  }
  for (const e of Object.values(C().events)) e.options.forEach(o => push(o.ops))
  for (const t of Object.values(C().trofeos)) push(t.onPickup)
  for (const x of Object.values(C().consumibles)) push(x.runOps)
  return out
}

describe('integridad del contenido', () => {
  it('todas las referencias a cartas, trofeos, handlers y rivales existen', () => {
    const c = C()
    for (const o of allOps()) {
      if (o.op === 'addCard') expect(c.cards[o.def], o.def).toBeTruthy()
      if (o.op === 'custom') expect(c.handlers[o.h], o.h).toBeTruthy()
    }
    for (const o of allRunOps()) {
      if (o.op === 'addCard') expect(c.cards[o.def], o.def).toBeTruthy()
      if (o.op === 'trofeo' && o.id) expect(c.trofeos[o.id], o.id).toBeTruthy()
      if (o.op === 'consumible' && o.id) expect(c.consumibles[o.id], o.id).toBeTruthy()
      if (o.op === 'startMatch' && o.rival) expect(c.rivals[o.rival], o.rival).toBeTruthy()
    }
    for (const cl of Object.values(c.clubs)) {
      for (const s of cl.starter) expect(c.cards[s], s).toBeTruthy()
      expect(c.trofeos[cl.starterTrofeo], cl.starterTrofeo).toBeTruthy()
    }
  })

  it('cada rival tiene movimientos válidos y como máximo una Ocasión por intención', () => {
    for (const r of Object.values(C().rivals)) {
      const ais = [r.ai, ...(r.phases ?? []).map(p => p.ai)]
      for (const ai of ais) {
        for (const p of ai.pick) expect(ai.moves[p.move], `${r.id}:${p.move}`).toBeTruthy()
        for (const o of ai.opening ?? []) expect(ai.moves[o], `${r.id}:${o}`).toBeTruthy()
        for (const mv of Object.values(ai.moves)) {
          expect(mv.parts.length).toBeLessThanOrEqual(3)
          expect(mv.parts.filter(p => p.k === 'ocasion').length).toBeLessThanOrEqual(1)
        }
      }
      expect(r.segments.length).toBeGreaterThanOrEqual(r.meta ?? 2)
    }
  })

  it('cada acto tiene rivales de Liga (fáciles y normales), Copa y Final', () => {
    for (const act of [1, 2, 3] as const) {
      const rs = Object.values(C().rivals).filter(r => r.act === act)
      expect(rs.filter(r => r.tier === 'liga' && r.easy).length).toBeGreaterThanOrEqual(2)
      expect(rs.filter(r => r.tier === 'liga' && !r.easy).length).toBeGreaterThanOrEqual(3)
      expect(rs.filter(r => r.tier === 'copa').length).toBeGreaterThanOrEqual(3)
      expect(rs.filter(r => r.tier === 'final' && !r.crest).length + rs.filter(r => r.tier === 'final' && r.crest).length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('cada carta se juega sin errores', () => {
  const ids = Object.keys(C().cards)
  for (const id of ids) {
    for (const up of [false, true]) {
      it(`${id}${up ? '+' : ''}`, () => {
        const d = C().cards[id]
        let run = matchWith({ deck: Array(15).fill('neu.disparo'), club: d.club === 'neutral' ? 'athletic' : d.club })
        const m = M(run)
        m.player.energy = 9
        m.player.res = { garra: 5, posesion: 5, momentum: 3 }
        m.rival.defensa = 200
        m.rival.segs = [200, 200, 200]
        const uids = setHand(run, [id, 'neu.despeje', 'neu.disparo'], up)
        const text = plainText(cardText(d, up, new Ctx(run)))
        expect(text).not.toMatch(/undefined|NaN|\?|\[object/)
        expect(text.length).toBeGreaterThan(3)
        const ctx = new Ctx(run)
        void ctx
        const playable = (d.kw ?? []).includes('injugable') || (d.type === 'estado' && d.ops.length === 0)
        if (playable || (d.playIf && d.playIf.k === 'played')) return
        run = act(run, { t: 'play', uid: uids[0] })
        let guard = 0
        while (M(run).pending && guard++ < 5) {
          const p = M(run).pending!
          if (p.kind === 'choose') run = act(run, { t: 'resolve', pick: [0] })
          else {
            const cands = M(run).piles[p.from!]
            run = act(run, { t: 'resolve', pick: cands.slice(0, Math.max(p.min, Math.min(1, p.max))) })
          }
        }
        expect(M(run).pending).toBeNull()
        expect(M(run).limbo.length).toBe(0)
      })
    }
  }
})

describe('textos', () => {
  it('ningún nombre real aparece fuera de content/clubs ni de las finales de content/rivals', () => {
    const banned = ['Messi', 'Iniesta', 'Xavi', 'Zidane', 'Ronaldo', 'Benzema', 'Iribar', 'Zarra', 'Aduriz', 'Bernabéu', 'Camp Nou', 'San Mamés']
    const root = join(__dirname, '..')
    const files: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts')) files.push(p)
      }
    }
    walk(root)
    for (const f of files) {
      if (f.includes(join('content', 'clubs')) || f.includes(join('content', 'rivals'))) continue
      const src = readFileSync(f, 'utf8')
      for (const b of banned) expect(src.includes(b), `${b} en ${f}`).toBe(false)
    }
  })
})
