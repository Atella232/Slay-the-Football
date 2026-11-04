import type { TrofeoDef } from '../../../engine/model/types'
import { RES, SELF } from '../../dsl'

export const MADRID_TROFEOS: TrofeoDef[] = [
  {
    id: 'tro.decimocuarta', name: 'La Decimocuarta', tier: 'inicial', club: 'madrid', icon: 'copa',
    text: 'Empiezas cada partido con 1 de Momentum y 1 de Confianza.',
    hooks: [{ on: 'matchStart', ops: [RES('momentum', 1), SELF('confianza', 1)] }],
  },
]
