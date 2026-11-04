import type { ConsumibleDef } from '../engine/model/types'
import { B, CUSTOM, D, E, HEAL, P, RIVAL, SELF } from './dsl'

export const CONSUMIBLES: ConsumibleDef[] = [
  { id: 'con.bebida', name: 'Bebida Energética', rarity: 'comun', icon: 'lata', text: 'Gana 2 de Energía.', ops: [E(2)] },
  { id: 'con.vendaje', name: 'Vendaje Compresivo', rarity: 'comun', icon: 'venda', text: 'Gana 12 de Bloqueo.', ops: [B(12)] },
  { id: 'con.botiquin', name: 'Botiquín', rarity: 'comun', icon: 'cruz', text: 'Recupera 12 de Forma. Se puede usar en el mapa.', ops: [HEAL(12)], runOps: [{ op: 'heal', n: 12 }] },
  { id: 'con.pizarra', name: 'Pizarra de Bolsillo', rarity: 'comun', icon: 'pizarra', text: 'Roba 3 cartas.', ops: [D(3)] },
  { id: 'con.spray', name: 'Spray Frío', rarity: 'comun', icon: 'spray', text: 'El rival queda con Fatiga 2.', ops: [RIVAL('fatiga', 2)] },
  { id: 'con.grito', name: 'Grito de Ánimo', rarity: 'comun', icon: 'megafono', text: 'Gana 2 de Confianza.', ops: [SELF('confianza', 2)] },
  { id: 'con.agua', name: 'Botella de Agua', rarity: 'comun', icon: 'botella', text: 'Recupera 5 de Forma y gana 6 de Bloqueo.', ops: [HEAL(5), B(6)] },
  { id: 'con.silbatazo', name: 'Silbatazo', rarity: 'poco', icon: 'silbato', text: 'Anula la Ocasión rival de este turno.', ops: [{ op: 'cancelOcasion' }] },
  { id: 'con.video', name: 'Vídeo del Rival', rarity: 'poco', icon: 'video', text: 'El rival queda Desorganizado 3.', ops: [RIVAL('desorganizado', 3)] },
  { id: 'con.moral', name: 'Inyección de Moral', rarity: 'poco', icon: 'corazon', text: 'Gana 3 del recurso de tu club.', ops: [CUSTOM('gainClubRes', { n: 3 })] },
  { id: 'con.chut', name: 'Chut a Bocajarro', rarity: 'poco', icon: 'balon', text: 'Genera 15 de Peligro.', ops: [P(15)] },
  { id: 'con.cambio', name: 'Cambio de Refresco', rarity: 'poco', icon: 'flechas', text: '+2 Cambios y roba 2 cartas.', ops: [{ op: 'cambios', n: 2 }, D(2)] },
  { id: 'con.milagro', name: 'Suplente Milagroso', rarity: 'rara', icon: 'estrella', text: 'Recupera el 30% de tu Forma máxima. Se puede usar en el mapa.', ops: [CUSTOM('healPct', { n: 30 })], runOps: [{ op: 'healPct', n: 30 }] },
  { id: 'con.descuento', name: 'Tiempo de Descuento', rarity: 'rara', icon: 'reloj', text: '+1 turno de partido (máx. 2 por partido). Roba 2 cartas.', ops: [{ op: 'clock', n: 1 }, D(2)] },
]
