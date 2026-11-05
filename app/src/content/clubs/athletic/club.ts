import type { ClubDef } from '../../../engine/model/types'
import { RES, phase } from '../../dsl'

export const ATHLETIC: ClubDef = {
  id: 'athletic',
  name: 'Athletic Club',
  short: 'ATH',
  motto: 'Leones con corazón de hierro',
  forma: 80,
  res: 'garra',
  resName: 'Garra',
  resMax: 10,
  resText: 'Ganas Garra al agotar cartas, al ganar 8+ de Bloqueo con una carta y con cada Parada. Tus mejores cartas la gastan.',
  starter: [
    'neu.disparo', 'neu.disparo', 'neu.disparo', 'neu.disparo',
    'neu.despeje', 'neu.despeje', 'neu.despeje', 'neu.despeje',
    'ath.bravura', 'ath.muro_rojiblanco',
  ],
  starterTrofeo: 'tro.sangre_leon',
  passive: {
    name: 'Corazón de León',
    text: '+1 Garra al agotar una carta, al ganar 8+ de Bloqueo de una vez y con cada Parada. En el tramo final, +1 Garra al inicio de cada turno.',
    hooks: [
      { on: 'cardExhausted', ops: [RES('garra', 1)] },
      { on: 'blockGained', f: { minN: 8 }, ops: [RES('garra', 1)] },
      { on: 'parada', ops: [RES('garra', 1)] },
      { on: 'turnStart', when: phase('tramoFinal'), ops: [RES('garra', 1)] },
    ],
  },
  colors: { primary: '#d4202c', secondary: '#ffffff', accent: '#1a1a1a' },
  unlock: 'Disponible desde el inicio.',
}
