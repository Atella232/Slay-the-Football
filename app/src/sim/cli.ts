import { installContent } from '../content/index'
import { simulateRun, type SimResult } from './runSim'
import { randomBot } from './bots/random'
import { greedyBot } from './bots/greedy'
import { heurBot } from './bots/heur'
import type { Bot } from './bots/types'
import type { ClubId } from '../engine/model/types'
import { buildReport, formatReport } from './report'

installContent()

const args = process.argv.slice(2)
function arg(name: string, def: string): string {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}
const smoke = args.includes('--smoke')
const bots: Record<string, Bot> = { random: randomBot, greedy: greedyBot, heur: heurBot }
const clubs: ClubId[] = arg('club', 'all') === 'all' ? ['athletic', 'barcelona', 'madrid'] : [arg('club', 'athletic') as ClubId]
const runs = Number(arg('runs', smoke ? '25' : '200'))
const exig = Number(arg('exig', '0'))
const botNames = smoke ? ['random', 'greedy'] : [arg('bot', 'greedy')]
const seedBase = arg('seed', 'sim')

let failed = false
for (const botName of botNames) {
  const bot = bots[botName]
  if (!bot) throw new Error(`Bot desconocido: ${botName}`)
  for (const club of clubs) {
    const results: SimResult[] = []
    const n = smoke && botName === 'greedy' ? Math.ceil(runs / 5) : runs
    const t0 = Date.now()
    for (let i = 0; i < n; i++) {
      const r = simulateRun({ seed: `${seedBase}-${club}-${i}`, club, exig, bot, checkEvery: smoke ? 1 : 50 })
      results.push(r)
      if (r.errors.length) {
        failed = true
        console.error(`[${botName}/${club}] ${r.seed}: ${r.errors.slice(0, 3).join(' | ')}`)
      }
    }
    const rep = buildReport(results)
    console.log(formatReport(`${club} · bot ${botName} · Exigencia ${exig} · ${((Date.now() - t0) / 1000).toFixed(1)} s`, rep))
    console.log('')
  }
}
if (failed) {
  console.error('Simulación con errores')
  process.exit(1)
}
