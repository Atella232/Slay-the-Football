import type { GameEvent } from '../../engine/model/types'

type Listener = (ev: GameEvent) => void
const listeners = new Set<Listener>()

export const fxBus = {
  on(l: Listener): () => void {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  emit(ev: GameEvent): void {
    for (const l of listeners) l(ev)
  },
}

/** Duración base (ms) de cada evento en la cola de animación. */
export function durationOf(ev: GameEvent): number {
  switch (ev.e) {
    case 'draw': return 85
    case 'play': return 260
    case 'discard': return 30
    case 'exhaust': return 200
    case 'toSistemas': return 280
    case 'cardCreated': return 220
    case 'shuffle': return 320
    case 'cambio': return 200
    case 'block': return 120
    case 'peligro': return 420
    case 'goal': return ev.side === 'player' ? 2300 : 1700
    case 'kickoffLock': return 250
    case 'ocasion': return 750
    case 'ataque': return 480
    case 'status': return 160
    case 'res': return 110
    case 'clock': return 200
    case 'halftime': return 700
    case 'prorroga': return 1500
    case 'rivalPhase': return 1300
    case 'rivalMove': return 650
    case 'rivalTurn': return 300
    case 'turnStart': return 200
    case 'trofeoProc': return 240
    case 'penalty': return 1500
    case 'matchEnd': return 1000
    case 'forma': return 180
    case 'heal': return 220
    default: return 0
  }
}
