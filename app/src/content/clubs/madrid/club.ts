import type { ClubDef } from '../../../engine/model/types'
import { RES, behind, phase } from '../../dsl'

export const MADRID: ClubDef = {
  id: 'madrid',
  name: 'Real Madrid',
  short: 'RMA',
  motto: 'Hasta el final, vamos Real',
  forma: 74,
  res: 'momentum',
  resName: 'Momentum',
  resMax: 5,
  resText: 'Ganas Momentum al marcar, al jugar un Ataque justo después de una Táctica (una vez por turno) y con golpes de 15+ de Peligro. Si vas perdiendo o en el tramo final, +1 cada turno.',
  starter: [
    'neu.disparo', 'neu.disparo', 'neu.disparo', 'neu.disparo',
    'neu.despeje', 'neu.despeje', 'neu.despeje', 'neu.despeje',
    'mad.galope', 'mad.transicion',
  ],
  starterTrofeo: 'tro.decimocuarta',
  passive: {
    name: 'Espíritu de Remontada',
    text: '+1 Momentum al marcar, al jugar un Ataque tras una Táctica (una vez por turno) y con golpes de 15+ de Peligro. Si vas perdiendo o en el tramo final, +1 Momentum al inicio de cada turno.',
    hooks: [
      { on: 'goalScored', ops: [RES('momentum', 1)] },
      { on: 'cardPlayed', f: { type: 'ataque' }, when: { k: 'prevPlayed', type: 'tactica' }, limit: { per: 'turn', n: 1 }, ops: [RES('momentum', 1)] },
      { on: 'peligroDealt', f: { minN: 15 }, ops: [RES('momentum', 1)] },
      { on: 'turnStart', when: { k: 'or', c: [behind, phase('tramoFinal')] }, ops: [RES('momentum', 1)] },
    ],
  },
  colors: { primary: '#f4f4f4', secondary: '#1b2a63', accent: '#d4af37' },
  unlock: 'Gana la Final del acto 1 con el Barça.',
}
