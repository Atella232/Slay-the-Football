import type { SimResult } from './runSim'

export interface Report {
  runs: number
  outcomes: Record<string, number>
  winrate: number
  reachAct2: number
  reachAct3: number
  tiers: Record<string, { n: number; w: number; d: number; l: number; turns: number; prorroga: number; pens: number; gf: number; ga: number; forma: number }>
  errors: number
  avgActions: number
  cards: { id: string; n: number; winWith: number; delta: number }[]
}

export function buildReport(results: SimResult[]): Report {
  const outcomes: Record<string, number> = {}
  const tiers: Report['tiers'] = {}
  let errors = 0
  let actions = 0
  let act2 = 0
  let act3 = 0
  for (const r of results) {
    outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1
    if (r.errors.length) errors++
    actions += r.actions
    if (r.act >= 2) act2++
    if (r.act >= 3) act3++
    for (const m of r.matchLog) {
      const key = m.tier === 'amistoso' ? m.tier : `${m.tier} a${m.act}`
      const t = (tiers[key] ??= { n: 0, w: 0, d: 0, l: 0, turns: 0, prorroga: 0, pens: 0, gf: 0, ga: 0, forma: 0 })
      t.n++
      if (m.result === 'victoria') t.w++
      else if (m.result === 'empate') t.d++
      else t.l++
      t.turns += m.turns
      if (m.prorroga) t.prorroga++
      if (m.pens) t.pens++
      t.gf += m.f
      t.ga += m.a
      t.forma += m.formaLost
    }
  }
  const n = results.length || 1
  // impacto por carta: % de campeón con la carta en el mazo final frente a sin ella
  const champ = (r: SimResult) => (r.outcome === 'campeon' ? 1 : 0)
  // se mide sobre el mazo al empezar el acto 2 y sólo en las runs que llegan ahí (menos sesgo de supervivencia)
  const base = results.filter(r => r.deckAct2)
  const byCard = new Map<string, { n: number; w: number }>()
  for (const r of base) {
    const defs = new Set(r.deckAct2!)
    for (const d of defs) {
      const e = byCard.get(d) ?? { n: 0, w: 0 }
      e.n++
      e.w += champ(r)
      byCard.set(d, e)
    }
  }
  const totalW = base.reduce((a, r) => a + champ(r), 0)
  const cards = [...byCard.entries()]
    .filter(([, e]) => e.n >= Math.max(5, base.length * 0.08) && e.n < base.length)
    .map(([id, e]) => {
      const without = base.length - e.n
      const winWithout = without > 0 ? (totalW - e.w) / without : 0
      return { id, n: e.n, winWith: e.w / e.n, delta: e.w / e.n - winWithout }
    })
    .sort((a, b) => b.delta - a.delta)
  return {
    cards,
    runs: results.length,
    outcomes,
    winrate: (outcomes.campeon ?? 0) / n,
    reachAct2: act2 / n,
    reachAct3: act3 / n,
    tiers,
    errors,
    avgActions: actions / n,
  }
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`

export function formatReport(title: string, r: Report): string {
  const lines: string[] = []
  lines.push(`## ${title}`)
  lines.push(`Runs: ${r.runs} · Campeón: ${pct(r.winrate)} · Llega al acto 2: ${pct(r.reachAct2)} · Llega al acto 3: ${pct(r.reachAct3)} · Errores: ${r.errors}`)
  lines.push(`Finales de run: ${Object.entries(r.outcomes).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  lines.push('')
  lines.push('| Tipo | Partidos | V | E | D | Turnos | Prórroga | Penaltis | GF | GC | Forma perdida |')
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
  for (const [k, t] of Object.entries(r.tiers)) {
    const n = t.n || 1
    lines.push(`| ${k} | ${t.n} | ${pct(t.w / n)} | ${pct(t.d / n)} | ${pct(t.l / n)} | ${(t.turns / n).toFixed(2)} | ${pct(t.prorroga / n)} | ${pct(t.pens / n)} | ${(t.gf / n).toFixed(2)} | ${(t.ga / n).toFixed(2)} | ${(t.forma / n).toFixed(1)} |`)
  }
  const top = r.cards.slice(0, 8)
  if (top.length) {
    lines.push('')
    lines.push('Cartas con más impacto (mazo al llegar al acto 2; diferencia de % de campeón con/sin):')
    for (const c of top) lines.push(`- ${c.id}: ${c.n} mazos, ${pct(c.winWith)} con, ${c.delta >= 0 ? '+' : ''}${(c.delta * 100).toFixed(1)} pp${c.delta > 0.06 ? '  ⚠' : ''}`)
  }
  return lines.join('\n')
}
