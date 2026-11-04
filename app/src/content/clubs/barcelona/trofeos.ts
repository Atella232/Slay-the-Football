import type { TrofeoDef } from '../../../engine/model/types'
import { RES, hasRes } from '../../dsl'

export const BARCELONA_TROFEOS: TrofeoDef[] = [
  {
    id: 'tro.la_masia', name: 'La Masia', tier: 'inicial', club: 'barcelona', icon: 'masia',
    text: 'Robas 2 cartas extra en el primer turno de cada partido.',
    mods: [{ stat: 'firstTurnDraw', add: 2 }],
  },
  {
    id: 'tro.rondo_calentamiento', name: 'Rondo de Calentamiento', tier: 'club', club: 'barcelona', icon: 'balon',
    text: 'Empiezas cada partido con 3 de Posesión.',
    flavor: 'Antes del pitido inicial, el balón ya es nuestro.',
    hooks: [{ on: 'matchStart', ops: [RES('posesion', 3)] }],
  },
  {
    id: 'tro.metronomo', name: 'Metrónomo', tier: 'club', club: 'barcelona', icon: 'reloj',
    text: 'Mientras tengas 4+ de Posesión, los Ataques rivales tienen −3.',
    flavor: 'Quien marca el ritmo decide cuándo se sufre.',
    mods: [{ stat: 'ataqueIn', add: -3, when: hasRes('posesion', 4) }],
  },
]
