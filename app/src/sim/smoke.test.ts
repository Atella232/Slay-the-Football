import { describe, expect, it } from 'vitest'
import { simulateRun } from './runSim'
import { randomBot } from './bots/random'
import { greedyBot } from './bots/greedy'
import { dispatch, legalActions, newRun } from '../engine/api'
import type { Action } from '../engine/model/types'
import { seedRng } from '../engine/core/rng'

describe('simulación', () => {
  for (const club of ['athletic', 'barcelona', 'madrid'] as const) {
    it(`20 runs aleatorias de ${club} sin violar invariantes`, () => {
      for (let i = 0; i < 20; i++) {
        const r = simulateRun({ seed: `smoke-${club}-${i}`, club, bot: randomBot })
        expect(r.errors, r.seed).toEqual([])
        expect(r.outcome).not.toBe('incompleta')
      }
    })
  }

  it('runs con bot greedy terminan', () => {
    for (let i = 0; i < 4; i++) {
      const r = simulateRun({ seed: `greedy-${i}`, club: 'athletic', bot: greedyBot, checkEvery: 25 })
      expect(r.errors, r.seed).toEqual([])
    }
  })

  it('replay: misma semilla y mismas acciones dan el mismo estado', () => {
    const play = () => {
      let s = newRun({ seed: 'replay', club: 'athletic' })
      const rng = seedRng('bot-replay')
      const actions: Action[] = []
      for (let i = 0; i < 400 && s.screen.k !== 'ended'; i++) {
        const a = randomBot.decide(s, legalActions(s), rng)
        actions.push(a)
        s = dispatch(s, a).state
      }
      return { s, actions }
    }
    const a = play()
    const b = play()
    expect(JSON.stringify(a.s)).toBe(JSON.stringify(b.s))
    // y re-aplicando las acciones a partir de un JSON serializado
    let s = newRun({ seed: 'replay', club: 'athletic' })
    for (const act of a.actions) s = JSON.parse(JSON.stringify(dispatch(s, act).state))
    expect(JSON.stringify(s)).toBe(JSON.stringify(a.s))
  })
})
