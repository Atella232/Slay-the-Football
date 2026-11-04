import type { Action, RunState } from '../../engine/model/types'
import type { RngState } from '../../engine/core/rng'

export interface Bot {
  name: string
  decide(state: RunState, legal: Action[], rng: RngState): Action
}
