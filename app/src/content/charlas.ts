import type { CharlaDef } from '../engine/model/types'
import { B, CUSTOM, D, E, HEAL, HURT, RIVAL, SELF } from './dsl'

export const CHARLAS: CharlaDef[] = [
  { id: 'cha.calma', name: 'Tranquilidad', text: 'Recupera 6 de Forma.', ops: [HEAL(6)] },
  { id: 'cha.a_por_ellos', name: '¡A por ellos!', text: 'Gana 2 de Confianza.', ops: [SELF('confianza', 2)] },
  { id: 'cha.orden', name: 'Orden atrás', text: 'Gana 2 de Solidez.', ops: [SELF('solidez', 2)] },
  { id: 'cha.sistema', name: 'Cambio de sistema', text: 'Roba 2 cartas.', ops: [D(2)] },
  { id: 'cha.intensidad', name: 'Más intensidad', text: 'Gana 1 de Energía este turno.', ops: [E(1)] },
  { id: 'cha.banquillo', name: 'Mirar al banquillo', text: '+1 Cambio.', ops: [{ op: 'cambios', n: 1 }] },
  { id: 'cha.muro', name: 'Cerrar filas', text: 'Gana 10 de Bloqueo.', ops: [B(10)] },
  { id: 'cha.presion', name: 'Presión arriba', text: 'El rival queda Desorganizado 2.', ops: [RIVAL('desorganizado', 2)] },
  { id: 'cha.desgaste', name: 'Desgastarlos', text: 'El rival queda con Fatiga 2.', ops: [RIVAL('fatiga', 2)] },
  { id: 'cha.identidad', name: 'Nuestra identidad', text: 'Gana 3 del recurso de tu club.', ops: [CUSTOM('gainClubRes', { n: 3 })] },
  { id: 'cha.pizarra', name: 'La pizarra', text: 'La próxima carta que juegues este turno cuesta 0.', ops: [{ op: 'freeNext' }] },
  { id: 'cha.ultimatum', name: 'Ultimátum', text: 'Gana 2 de Energía y pierde 4 de Forma.', ops: [E(2), HURT(4)] },
]
