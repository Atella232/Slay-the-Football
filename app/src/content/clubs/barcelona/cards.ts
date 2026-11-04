import type { CardDef } from '../../../engine/model/types'
import { D, P, RES } from '../../dsl'

export const BARCELONA_CARDS: CardDef[] = [
  {
    id: 'bar.pase_corto', name: 'Pase Corto', club: 'barcelona', type: 'ataque', rarity: 'inicial', cost: 1,
    ops: [P(5), RES('posesion', 1)], up: { ops: [P(8), RES('posesion', 1)] }, art: { tpl: 'triangulo' },
    flavor: 'El balón no se cansa.',
  },
  {
    id: 'bar.tiki_taka', name: 'Tiki-Taka', club: 'barcelona', type: 'tactica', rarity: 'inicial', cost: 1,
    ops: [D(2), { op: 'pick', from: 'hand', min: 1, max: 1, act: 'discard' }],
    up: { ops: [D(3), { op: 'pick', from: 'hand', min: 1, max: 1, act: 'discard' }] }, art: { tpl: 'tiki' },
  },
]
