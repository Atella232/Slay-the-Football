import type { TrofeoDef } from '../../engine/model/types'
import { RIVAL, SELF } from '../dsl'

/** Modificadores del reto diario: trofeos especiales que nunca salen en las tiradas. */
export const DAILY_MODS: TrofeoDef[] = [
  { id: 'tro.mod_lluvia', name: 'Lluvia torrencial', tier: 'especial', icon: 'fatiga', text: 'Reto diario: en cada partido, tú y el rival empezáis con Fatiga 1.', hooks: [{ on: 'matchStart', ops: [SELF('fatiga', 1), RIVAL('fatiga', 1)] }] },
  { id: 'tro.mod_total', name: 'Fútbol total', tier: 'especial', icon: 'balon', text: 'Reto diario: las Defensas rivales son un 15% menores, pero sus Ocasiones tienen +2.', runMods: [{ stat: 'segmentPct', n: -15 }], mods: [{ stat: 'ocasionIn', add: 2 }] },
  { id: 'tro.mod_rebajas', name: 'Rebajas de enero', tier: 'especial', icon: 'oro', text: 'Reto diario: el Mercado es un 30% más barato.', runMods: [{ stat: 'shopPct', n: -30 }] },
  { id: 'tro.mod_cantera', name: 'Noche de cantera', tier: 'especial', icon: 'escudo', text: 'Reto diario: empiezas con 2 Canteranos Prometedores en el mazo.', onPickup: [{ op: 'addCard', def: 'neu.canterano' }, { op: 'addCard', def: 'neu.canterano' }] },
  { id: 'tro.mod_tension', name: 'Máxima tensión', tier: 'especial', icon: 'confianza', text: 'Reto diario: tú y el rival empezáis cada partido con 2 de Confianza.', hooks: [{ on: 'matchStart', ops: [SELF('confianza', 2), RIVAL('confianza', 2)] }] },
  { id: 'tro.mod_austeridad', name: 'Austeridad', tier: 'especial', icon: 'hucha', text: 'Reto diario: empiezas sin oro, pero ganas un 30% más.', onPickup: [{ op: 'gold', n: -999 }], runMods: [{ stat: 'goldPct', n: 30 }] },
]
