import type { ClubDef } from '../../../engine/model/types'
import { D, E, RES, add, hasRes, mul, resOf } from '../../dsl'

export const BARCELONA: ClubDef = {
  id: 'barcelona',
  name: 'FC Barcelona',
  short: 'FCB',
  motto: 'Més que un club',
  forma: 70,
  res: 'posesion',
  resName: 'Posesión',
  resMax: 8,
  resText: 'Ganas Posesión con cada Táctica. Al llegar a 6: +1 Energía, robas 1 y vuelves a 2 (una vez por turno). Con 4 o más, las Ocasiones rivales pierden 2.',
  starter: [
    'neu.disparo', 'neu.disparo', 'neu.disparo', 'neu.disparo',
    'neu.despeje', 'neu.despeje', 'neu.despeje', 'neu.despeje',
    'bar.pase_corto', 'bar.tiki_taka',
  ],
  starterTrofeo: 'tro.la_masia',
  passive: {
    name: 'Ritmo de Posesión',
    text: '+1 Posesión por cada Táctica jugada. Al llegar a 6: +1 Energía, robas 1 y vuelves a 2 (una vez por turno). Con 4+ de Posesión, las Ocasiones rivales tienen −2.',
    hooks: [
      { on: 'cardPlayed', f: { type: 'tactica' }, ops: [RES('posesion', 1)] },
      {
        on: 'resGained', f: { res: 'posesion' }, when: hasRes('posesion', 6), limit: { per: 'turn', n: 1 },
        ops: [E(1), D(1), RES('posesion', add(2, mul(resOf('posesion'), -1)))],
      },
    ],
    mods: [{ stat: 'ocasionIn', add: -2, when: hasRes('posesion', 4) }],
  },
  colors: { primary: '#a50044', secondary: '#004d98', accent: '#edbb00' },
  unlock: 'Gana la Final del acto 1 con el Athletic.',
}
