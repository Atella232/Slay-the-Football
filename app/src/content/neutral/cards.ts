import type { CardDef } from '../../engine/model/types'
import { B, D, E, HEAL, HURT, IF, P, RIVAL, SELF, intent, last, playedAtLeast, rivalHas, selfHas } from '../dsl'

export const NEUTRAL_CARDS: CardDef[] = [
  // ── Iniciales ──
  {
    id: 'neu.disparo', name: 'Disparo', club: 'neutral', type: 'ataque', rarity: 'inicial', cost: 1,
    ops: [P(6)], up: { ops: [P(9)] }, art: { tpl: 'disparo' },
    flavor: 'Lo básico: ver portería y chutar.',
  },
  {
    id: 'neu.despeje', name: 'Despeje', club: 'neutral', type: 'defensa', rarity: 'inicial', cost: 1,
    ops: [B(5)], up: { ops: [B(8)] }, art: { tpl: 'despeje' },
    flavor: 'Arriba y lejos. Ya se ordenará el equipo.',
  },

  // ── Comunes ──
  {
    id: 'neu.pase_seguro', name: 'Pase Seguro', club: 'neutral', type: 'tactica', rarity: 'comun', cost: 0,
    ops: [B(3), D(1)], up: { ops: [B(5), D(1)] }, art: { tpl: 'triangulo' },
  },
  {
    id: 'neu.lectura', name: 'Lectura de Juego', club: 'neutral', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(6), IF(intent('ocasion'), [D(1)])], up: { ops: [B(9), IF(intent('ocasion'), [D(1)])] }, art: { tpl: 'parada' },
  },
  {
    id: 'neu.cambio_orientacion', name: 'Cambio de Orientación', club: 'neutral', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [IF(last('tactica'), [P(10)], [P(6)])], up: { ops: [IF(last('tactica'), [P(13)], [P(8)])] },
    text: 'Genera {P} de Peligro. Si la carta anterior fue una Táctica, genera {P2} en su lugar.',
    art: { tpl: 'paseLargo' },
  },
  {
    id: 'neu.rebote', name: 'Remate de Rebote', club: 'neutral', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(7), IF(rivalHas('desorganizado'), [P(4)])], up: { ops: [P(9), IF(rivalHas('desorganizado'), [P(5)])] },
    art: { tpl: 'disparo' },
  },
  {
    id: 'neu.falta_tactica', name: 'Falta Táctica', club: 'neutral', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [{ op: 'cancelOcasion' }, SELF('amarilla', 1)], up: { cost: 0 },
    art: { tpl: 'falta' }, flavor: 'Cortar la contra tiene un precio.',
  },
  {
    id: 'neu.orden_defensivo', name: 'Orden Defensivo', club: 'neutral', type: 'defensa', rarity: 'comun', cost: 2,
    ops: [B(12)], up: { ops: [B(16)] }, art: { tpl: 'muro' },
  },
  {
    id: 'neu.desmarque', name: 'Desmarque', club: 'neutral', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(5), D(1)], up: { ops: [P(7), D(1)] }, art: { tpl: 'desmarque' },
  },
  {
    id: 'neu.tiro_lejano', name: 'Tiro Lejano', club: 'neutral', type: 'ataque', rarity: 'comun', cost: 2,
    ops: [{ op: 'repliegueRemove', n: 6 }, P(10)], up: { ops: [{ op: 'repliegueRemove', n: 8 }, P(13)] },
    art: { tpl: 'disparo' },
  },
  {
    id: 'neu.vigilancia', name: 'Vigilancia', club: 'neutral', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(4), RIVAL('fatiga', 1)], up: { ops: [B(6), RIVAL('fatiga', 1)] }, art: { tpl: 'presion' },
  },
  {
    id: 'neu.presion_tras_perdida', name: 'Presión Tras Pérdida', club: 'neutral', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [RIVAL('desorganizado', 2)], up: { cost: 0 }, art: { tpl: 'presion' },
  },
  {
    id: 'neu.conduccion', name: 'Conducción', club: 'neutral', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(4), B(4)], up: { ops: [P(6), B(6)] }, art: { tpl: 'regate' },
  },
  {
    id: 'neu.cambio_ritmo', name: 'Cambio de Ritmo', club: 'neutral', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [D(2)], up: { ops: [D(3)] }, art: { tpl: 'banda' },
  },

  // ── Poco comunes ──
  {
    id: 'neu.ajuste_tactico', name: 'Ajuste Táctico', club: 'neutral', type: 'tactica', rarity: 'poco', cost: 1, kw: ['agotar'],
    ops: [{ op: 'handCost', delta: -1 }], up: { cost: 0 }, art: { tpl: 'sistema' },
  },
  {
    id: 'neu.plan_b', name: 'Plan B', club: 'neutral', type: 'tactica', rarity: 'poco', cost: 0,
    ops: [{ op: 'pick', from: 'hand', min: 1, max: 1, act: 'discard' }, D(2)],
    up: { ops: [{ op: 'pick', from: 'hand', min: 1, max: 1, act: 'discard' }, D(3)] }, art: { tpl: 'cambio' },
  },
  {
    id: 'neu.asistencia_medica', name: 'Asistencia Médica', club: 'neutral', type: 'tactica', rarity: 'poco', cost: 0, kw: ['agotar'],
    ops: [HEAL(4), B(4)], up: { ops: [HEAL(6), B(6)] }, art: { tpl: 'estado' },
  },
  {
    id: 'neu.competir', name: 'Competir sin Balón', club: 'neutral', type: 'sistema', rarity: 'poco', cost: 1,
    ops: [], hooks: [{ on: 'cardPlayed', f: { type: 'tactica' }, ops: [B(2)] }],
    up: { hooks: [{ on: 'cardPlayed', f: { type: 'tactica' }, ops: [B(3)] }] },
    text: 'Cada vez que juegues una Táctica, gana 2 de Bloqueo.', upText: 'Cada vez que juegues una Táctica, gana 3 de Bloqueo.',
    art: { tpl: 'sistema' },
  },
  {
    id: 'neu.contragolpe_letal', name: 'Contragolpe Letal', club: 'neutral', type: 'ataque', rarity: 'poco', cost: 2,
    ops: [IF(selfHas('contragolpe'), [P(16)], [P(10)])], up: { ops: [IF(selfHas('contragolpe'), [P(20)], [P(13)])] },
    text: 'Genera {P} de Peligro. Si tienes Contragolpe, genera {P2} en su lugar.',
    art: { tpl: 'contra' },
  },
  {
    id: 'neu.tiempo_anadido', name: 'Tiempo Añadido', club: 'neutral', type: 'tactica', rarity: 'poco', cost: 1, kw: ['agotar'],
    ops: [{ op: 'clock', n: 1 }, D(1)], up: { cost: 0 }, art: { tpl: 'sistema' },
  },
  {
    id: 'neu.doble_pivote', name: 'Doble Pivote', club: 'neutral', type: 'defensa', rarity: 'poco', cost: 1,
    ops: [B(6), { op: 'freeNext', type: 'defensa' }], up: { ops: [B(9), { op: 'freeNext', type: 'defensa' }] }, art: { tpl: 'muro' },
  },
  {
    id: 'neu.contrapresion', name: 'Contrapresión', club: 'neutral', type: 'ataque', rarity: 'poco', cost: 1,
    ops: [P(6), RIVAL('fatiga', 1)], up: { ops: [P(8), RIVAL('fatiga', 2)] }, art: { tpl: 'presion' },
  },
  {
    id: 'neu.corner_ensayado', name: 'Córner Ensayado', club: 'neutral', type: 'ataque', rarity: 'poco', cost: 1,
    playIf: playedAtLeast(2), ops: [P(11)], up: { ops: [P(15)] },
    text: 'Sólo se puede jugar si ya jugaste 2 cartas este turno. Genera {P} de Peligro.',
    art: { tpl: 'corner' },
  },
  {
    id: 'neu.arenga', name: 'Arenga', club: 'neutral', type: 'tactica', rarity: 'poco', cost: 1, kw: ['agotar'],
    ops: [SELF('confianza', 2)], up: { ops: [SELF('confianza', 3)] }, art: { tpl: 'remontada' },
  },

  // ── Raras ──
  {
    id: 'neu.todo_o_nada', name: 'Todo o Nada', club: 'neutral', type: 'ataque', rarity: 'rara', cost: 2,
    ops: [P(20), HURT(4)], up: { ops: [P(26), HURT(4)] }, art: { tpl: 'disparo' },
  },
  {
    id: 'neu.tecnico_leyenda', name: 'Técnico Leyenda', club: 'neutral', type: 'sistema', rarity: 'rara', cost: 2,
    ops: [], hooks: [{ on: 'cardPlayed', when: playedAtLeast(4), limit: { per: 'turn', n: 1 }, ops: [E(1), D(1)] }],
    up: { cost: 1 },
    text: 'La cuarta carta que juegues cada turno te da 1 de Energía y robas 1 carta.',
    art: { tpl: 'sistema' },
  },
  {
    id: 'neu.autobus', name: 'Aparcar el Autobús', club: 'neutral', type: 'defensa', rarity: 'rara', cost: 3, kw: ['agotar'],
    ops: [B(25)], up: { ops: [B(32)] }, art: { tpl: 'autobus' },
  },
  {
    id: 'neu.vision', name: 'Visión de Juego', club: 'neutral', type: 'tactica', rarity: 'rara', cost: 1,
    ops: [{ op: 'pick', from: 'discard', min: 1, max: 1, act: 'toHand' }, D(1)], up: { cost: 0 }, art: { tpl: 'paseLargo' },
  },
  {
    id: 'neu.mentalidad', name: 'Mentalidad Ganadora', club: 'neutral', type: 'sistema', rarity: 'rara', cost: 1,
    ops: [], hooks: [{ on: 'goalScored', ops: [E(1), D(2)] }], up: { cost: 0 },
    text: 'Cada vez que marques un gol, gana 1 de Energía y roba 2 cartas.',
    art: { tpl: 'remontada' },
  },
  {
    id: 'neu.var', name: 'Revisión VAR', club: 'neutral', type: 'tactica', rarity: 'rara', cost: 1, kw: ['agotar'],
    ops: [{ op: 'repliegueRemove', n: 'all' }, RIVAL('desorganizado', 2)], up: { cost: 0 }, art: { tpl: 'sistema' },
  },

  // ── Especiales (eventos) ──
  {
    id: 'neu.canterano', name: 'Canterano Prometedor', club: 'neutral', type: 'ataque', rarity: 'especial', cost: 0, kw: ['retener'],
    ops: [P(4)], up: { ops: [P(7)] }, art: { tpl: 'regate' },
  },
  {
    id: 'neu.fichaje', name: 'Fichaje Estrella', club: 'neutral', type: 'ataque', rarity: 'especial', cost: 1,
    ops: [P(12)], up: { ops: [P(16)] }, art: { tpl: 'disparo' },
  },
]

export const ESTADOS: CardDef[] = [
  {
    id: 'est.cansancio', name: 'Cansancio', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable', 'efimera'],
    ops: [], up: {}, text: 'Injugable. Efímera.', art: { tpl: 'estado' },
  },
  {
    id: 'est.lesion', name: 'Lesión', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable'],
    ops: [], up: {}, text: 'Injugable.', art: { tpl: 'estado' },
  },
  {
    id: 'est.nervios', name: 'Nervios', club: 'neutral', type: 'estado', rarity: 'especial', cost: 1, kw: ['agotar'],
    ops: [], up: {}, text: 'Agotar. No hace nada: sólo ocupa sitio.', art: { tpl: 'estado' },
  },
  {
    id: 'est.crisis', name: 'Crisis', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable'],
    ops: [], up: {}, text: 'Injugable. Desaparece de tu mazo con la próxima victoria.', art: { tpl: 'estado' },
  },
  {
    id: 'est.calambre', name: 'Calambre', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable', 'efimera'],
    ops: [], up: {}, inHand: [{ on: 'turnEnd', ops: [HURT(2)] }],
    text: 'Injugable. Efímera. Si está en tu mano al final del turno, pierdes 2 de Forma.', art: { tpl: 'estado' },
  },
  {
    id: 'est.mal_pase', name: 'Mal Pase', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable', 'efimera'],
    ops: [], up: {}, text: 'Injugable. Efímera.', art: { tpl: 'estado' },
  },
  {
    id: 'est.presion_mediatica', name: 'Presión Mediática', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable'],
    ops: [], up: {}, inHand: [{ on: 'turnEnd', ops: [SELF('desconcentrado', 1)] }],
    text: 'Injugable. Si está en tu mano al final del turno, quedas Desconcentrado 1 turno.', art: { tpl: 'estado' },
  },
  {
    id: 'est.tarjeta', name: 'Tarjeta', club: 'neutral', type: 'estado', rarity: 'especial', cost: 0, kw: ['injugable', 'efimera'],
    ops: [], up: {}, text: 'Injugable. Efímera.', art: { tpl: 'estado' },
  },
]
