// REPL de texto para probar las reglas sin UI: npm run play:cli -- --club athletic --seed demo
import { createInterface } from 'node:readline/promises'
import { installContent } from '../../content/index'
import { dispatch, legalActions, newRun } from '../api'
import { renderState } from './textRender'
import type { Action, ClubId } from '../model/types'

installContent()
const args = process.argv.slice(2)
const get = (k: string, d: string) => {
  const i = args.indexOf(`--${k}`)
  return i >= 0 ? args[i + 1] : d
}
let state = newRun({ seed: get('seed', 'cli'), club: get('club', 'athletic') as ClubId })
const rl = createInterface({ input: process.stdin, output: process.stdout })

function show() {
  console.log(JSON.stringify(renderState(state), null, 2))
  const legal = legalActions(state)
  legal.forEach((a, i) => console.log(`  [${i}] ${JSON.stringify(a)}`))
  return legal
}

async function main() {
  for (;;) {
    const legal = show()
    if (state.screen.k === 'ended') break
    const line = (await rl.question('> ')).trim()
    if (line === 'q') break
    let a: Action | undefined
    if (/^\d+$/.test(line)) a = legal[Number(line)]
    else {
      try {
        a = JSON.parse(line)
      } catch {
        console.log('Escribe el número de una acción, un JSON de acción o q')
        continue
      }
    }
    if (!a) continue
    const r = dispatch(state, a)
    if (r.error) console.log(`✗ ${r.error}`)
    else state = r.state
  }
  rl.close()
}
void main()
