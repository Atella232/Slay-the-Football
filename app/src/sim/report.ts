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
      const key = `${m.tier}`
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
  return {
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
  return lines.join('\n')
}
