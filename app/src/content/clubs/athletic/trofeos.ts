import type { TrofeoDef } from '../../../engine/model/types'
import { B, D } from '../../dsl'

export const ATHLETIC_TROFEOS: TrofeoDef[] = [
  {
    id: 'tro.sangre_leon', name: 'Sangre de León', tier: 'inicial', club: 'athletic', icon: 'leon',
    text: 'Al ganar un partido, recuperas 6 de Forma.',
    runMods: [{ stat: 'healAfterWin', n: 6 }],
  },
  {
    id: 'tro.txapela', name: 'Txapela de Hierro', tier: 'club', club: 'athletic', icon: 'txapela',
    text: 'La primera vez que ganas Bloqueo cada turno, ganas 3 más.',
    hooks: [{ on: 'blockGained', limit: { per: 'turn', n: 1 }, ops: [B(3)] }],
  },
  {
    id: 'tro.plan_lezama', name: 'Plan de Lezama', tier: 'club', club: 'athletic', icon: 'libreta',
    text: 'La primera vez que agotas una carta cada turno, robas 1.',
    hooks: [{ on: 'cardExhausted', limit: { per: 'turn', n: 1 }, ops: [D(1)] }],
  },
]
