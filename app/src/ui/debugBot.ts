import type { Action, RunState } from '../engine/model/types'
import { legalActions } from '../engine/api'
import { greedyBot } from '../sim/bots/greedy'
import { seedRng } from '../engine/core/rng'

const rng = seedRng('ui-debug-bot')

export function greedyDecide(run: RunState): Action {
  return greedyBot.decide(run, legalActions(run), rng)
}
