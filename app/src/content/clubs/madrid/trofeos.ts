import type { TrofeoDef } from '../../../engine/model/types'
import { D, E, RES, SELF, hasRes, phase } from '../../dsl'

export const MADRID_TROFEOS: TrofeoDef[] = [
  {
    id: 'tro.decimocuarta', name: 'La Decimocuarta', tier: 'inicial', club: 'madrid', icon: 'copa',
    text: 'Empiezas cada partido con 1 de Momentum y 1 de Confianza.',
    hooks: [{ on: 'matchStart', ops: [RES('momentum', 1), SELF('confianza', 1)] }],
  },
  {
    id: 'tro.racha_imparable', name: 'Racha Imparable', tier: 'club', club: 'madrid', icon: 'momentum',
    text: 'Cuando tu Momentum llega a 5, ganas 1 de Energía (una vez por turno).',
    flavor: 'Cuando este equipo se embala, no hay quien lo pare.',
    hooks: [{ on: 'resGained', f: { res: 'momentum' }, when: hasRes('momentum', 5), limit: { per: 'turn', n: 1 }, ops: [E(1)] }],
  },
  {
    id: 'tro.minuto_93', name: 'Minuto 93', tier: 'club', club: 'madrid', icon: 'reloj',
    text: 'Al empezar el tramo final de cada partido, ganas 2 de Momentum y robas 2 cartas.',
    flavor: 'Lisboa enseñó que el partido dura lo que dure el árbitro.',
    hooks: [{ on: 'turnStart', when: phase('tramoFinal'), limit: { per: 'match', n: 1 }, ops: [RES('momentum', 2), D(2)] }],
  },
]
