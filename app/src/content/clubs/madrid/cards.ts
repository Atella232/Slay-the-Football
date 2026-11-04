import type { CardDef } from '../../../engine/model/types'
import { B, IF, P, RES, last } from '../../dsl'

export const MADRID_CARDS: CardDef[] = [
  {
    id: 'mad.galope', name: 'Galope por Banda', club: 'madrid', type: 'ataque', rarity: 'inicial', cost: 1,
    ops: [IF(last('tactica'), [P(10)], [P(7)])], up: { ops: [IF(last('tactica'), [P(13)], [P(9)])] },
    text: 'Genera {P} de Peligro. Si la carta anterior fue una Táctica, genera {P2} en su lugar.',
    art: { tpl: 'banda' },
  },
  {
    id: 'mad.transicion', name: 'Transición', club: 'madrid', type: 'tactica', rarity: 'inicial', cost: 1,
    ops: [B(4), { op: 'freeNext', type: 'ataque' }, RES('momentum', 1)],
    up: { ops: [B(7), { op: 'freeNext', type: 'ataque' }, RES('momentum', 1)] }, art: { tpl: 'contra' },
  },
]
