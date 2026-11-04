import type { Bot } from './types'
import { pick, rand } from '../../engine/core/rng'

/** Bot aleatorio para fuzzing: prefiere jugar cartas antes de terminar turno. */
export const randomBot: Bot = {
  name: 'random',
  decide(_state, legal, rng) {
    const plays = legal.filter(a => a.t === 'play')
    if (plays.length && rand(rng) < 0.8) return pick(rng, plays)
    const nonEnd = legal.filter(a => a.t !== 'endTurn' && a.t !== 'cambio' && a.t !== 'abandon')
    if (nonEnd.length && rand(rng) < 0.7) return pick(rng, nonEnd)
    return pick(rng, legal)
  },
}
