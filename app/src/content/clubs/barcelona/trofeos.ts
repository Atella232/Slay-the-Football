import type { TrofeoDef } from '../../../engine/model/types'

export const BARCELONA_TROFEOS: TrofeoDef[] = [
  {
    id: 'tro.la_masia', name: 'La Masia', tier: 'inicial', club: 'barcelona', icon: 'masia',
    text: 'Robas 2 cartas extra en el primer turno de cada partido.',
    mods: [{ stat: 'firstTurnDraw', add: 2 }],
  },
]
