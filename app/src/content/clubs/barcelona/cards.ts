import type { CardDef, Cond, V } from '../../../engine/model/types'
import { B, CUSTOM, D, E, IF, P, RES, RIVAL, add, ahead, hasRes, mul, phase, playedAtLeast, resOf, spent } from '../../dsl'

const POS = 'posesion' as const

/** Tácticas ya jugadas este turno (sin contar la carta en juego). */
const TACTICAS: V = { k: 'played', type: 'tactica' }
const X: V = { k: 'x' }
const minV = (a: V, b: V): V => ({ k: 'min', a, b })
const maxV = (a: V, b: V): V => ({ k: 'max', a, b })
/** 1 si este turno ya jugaste alguna carta de ese tipo; 0 si no. */
const jugo = (type: 'ataque' | 'defensa' | 'tactica'): V => minV(1, { k: 'played', type })
const TIPOS_JUGADOS: V = add(jugo('ataque'), add(jugo('defensa'), jugo('tactica')))

/** Segunda parte, tramo final o prórroga. */
const segundaParte: Cond = { k: 'not', c: phase('primera') }
const ganandoAlFinal: Cond = { k: 'and', c: [phase('tramoFinal'), ahead] }
const finalConPosesion: Cond = { k: 'and', c: [phase('tramoFinal'), hasRes(POS, 1)] }

export const BARCELONA_CARDS: CardDef[] = [
  // ── Iniciales ──
  {
    id: 'bar.pase_corto', name: 'Pase Corto', club: 'barcelona', type: 'ataque', rarity: 'inicial', cost: 1,
    ops: [P(5), RES(POS, 1)], up: { ops: [P(8), RES(POS, 1)] }, art: { tpl: 'triangulo' },
    flavor: 'El balón no se cansa.',
  },
  {
    id: 'bar.tiki_taka', name: 'Tiki-Taka', club: 'barcelona', type: 'tactica', rarity: 'inicial', cost: 1,
    ops: [RES(POS, 1), D(2), { op: 'pick', from: 'hand', min: 1, max: 1, act: 'discard' }],
    up: { ops: [RES(POS, 1), D(3), { op: 'pick', from: 'hand', min: 1, max: 1, act: 'discard' }] }, art: { tpl: 'tiki' },
    flavor: 'Toco y me voy.',
  },

  // ── Comunes ──
  {
    id: 'bar.llegada', name: 'Llegada desde Atrás', club: 'barcelona', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [IF(hasRes(POS, 4), [P(10)], [P(7)])], up: { ops: [IF(hasRes(POS, 4), [P(13)], [P(9)])] },
    text: 'Genera {P} de Peligro. Si tienes 4+ de Posesión, genera {P2} en su lugar.',
    art: { tpl: 'disparo' },
  },
  {
    id: 'bar.ultimo_pase', name: 'Último Pase', club: 'barcelona', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(add(5, mul(TACTICAS, 3)))], up: { ops: [P(add(6, mul(TACTICAS, 4)))] },
    text: 'Genera 5 de Peligro, +3 por cada Táctica que hayas jugado este turno.',
    upText: 'Genera 6 de Peligro, +4 por cada Táctica que hayas jugado este turno.',
    art: { tpl: 'paseLargo' },
  },
  {
    id: 'bar.pared', name: 'Pared', club: 'barcelona', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(6), { op: 'freeNext', type: 'tactica' }], up: { ops: [P(9), { op: 'freeNext', type: 'tactica' }] },
    art: { tpl: 'triangulo', seed: 2 },
  },
  {
    id: 'bar.salida_balon', name: 'Salida de Balón', club: 'barcelona', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(6), RES(POS, 1)], up: { ops: [B(9), RES(POS, 1)] }, art: { tpl: 'rondo' },
  },
  {
    id: 'bar.achique', name: 'Achique de Espacios', club: 'barcelona', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(7), IF(hasRes(POS, 4), [{ op: 'reduceOcasion', n: 3 }])],
    up: { ops: [B(10), IF(hasRes(POS, 4), [{ op: 'reduceOcasion', n: 3 }])] },
    art: { tpl: 'lineaAlta' },
  },
  {
    id: 'bar.cerrar_partido', name: 'Cerrar el Partido', club: 'barcelona', type: 'defensa', rarity: 'comun', cost: 2,
    ops: [B(13), IF(ganandoAlFinal, [{ op: 'cancelOcasion' }])], up: { ops: [B(17), IF(ganandoAlFinal, [{ op: 'cancelOcasion' }])] },
    text: 'Gana {B} de Bloqueo. Si vas ganando en el tramo final, anula la Ocasión rival de este turno.',
    art: { tpl: 'autobus' },
  },
  {
    id: 'bar.rondo', name: 'Rondo', club: 'barcelona', type: 'tactica', rarity: 'comun', cost: 0,
    ops: [B(2), IF(hasRes(POS, 4), [RIVAL('fatiga', 1)])], up: { ops: [B(4), IF(hasRes(POS, 4), [RIVAL('fatiga', 1)])] },
    art: { tpl: 'rondo', seed: 2 },
    flavor: 'Siete contra dos. Que corran ellos.',
  },
  {
    id: 'bar.la_pausa', name: 'La Pausa', club: 'barcelona', type: 'tactica', rarity: 'comun', cost: 0,
    ops: [RES(POS, 1), { op: 'pick', from: 'hand', min: 0, max: 2, act: 'retain' }],
    up: { ops: [RES(POS, 2), { op: 'pick', from: 'hand', min: 0, max: 2, act: 'retain' }] },
    art: { tpl: 'tiki', seed: 2 },
  },
  {
    id: 'bar.circulacion', name: 'Circulación', club: 'barcelona', type: 'tactica', rarity: 'comun', cost: 0,
    ops: [RES(POS, 1), D(1)], up: { ops: [RES(POS, 2), D(1)] }, art: { tpl: 'banda' },
  },
  {
    id: 'bar.cinco_segundos', name: 'Presión de Cinco Segundos', club: 'barcelona', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [B(4), RIVAL('desorganizado', 1)], up: { ops: [B(7), RIVAL('desorganizado', 1)] }, art: { tpl: 'presion' },
  },
  {
    id: 'bar.temporizar', name: 'Temporizar', club: 'barcelona', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [B(4), CUSTOM('energyNext', { n: 1 })], up: { ops: [B(7), CUSTOM('energyNext', { n: 1 })] },
    text: 'Gana {B} de Bloqueo. El próximo turno, gana 1 de Energía.',
    art: { tpl: 'cambio' },
  },

  // ── Poco comunes ──
  {
    id: 'bar.la_croqueta', name: 'La Croqueta', club: 'barcelona', type: 'ataque', rarity: 'poco', cost: 1,
    ops: [IF(hasRes(POS, 4), [RIVAL('desorganizado', 1)]), P(4, 2)],
    up: { ops: [IF(hasRes(POS, 4), [RIVAL('desorganizado', 1)]), P(5, 2)] },
    text: 'Si tienes 4+ de Posesión, el rival queda Desorganizado 1. Después, genera {P} de Peligro dos veces.',
    art: { tpl: 'regate' },
  },
  {
    id: 'bar.arreon_final', unlock: 4, name: 'Arreón Final', club: 'barcelona', type: 'ataque', rarity: 'poco', cost: 1,
    ops: [P(6), IF(finalConPosesion, [{ op: 'spendRes', res: POS, max: 'all', then: [P(mul(spent, 3))] }])],
    up: { ops: [P(8), IF(finalConPosesion, [{ op: 'spendRes', res: POS, max: 'all', then: [P(mul(spent, 4))] }])] },
    text: 'Genera {P} de Peligro. En el tramo final, gasta toda tu Posesión y genera 3 de Peligro más por cada una.',
    upText: 'Genera {P} de Peligro. En el tramo final, gasta toda tu Posesión y genera 4 de Peligro más por cada una.',
    art: { tpl: 'remontada' },
  },
  {
    id: 'bar.pase_filtrado', name: 'Pase Filtrado', club: 'barcelona', type: 'ataque', rarity: 'poco', cost: 1,
    ops: [IF(hasRes(POS, 4), [{ op: 'repliegueRemove', n: 'all' }]), P(7)],
    up: { ops: [IF(hasRes(POS, 4), [{ op: 'repliegueRemove', n: 'all' }]), P(10)] },
    art: { tpl: 'desmarque' },
  },
  {
    id: 'bar.balon_pies', unlock: 3, name: 'Balón en los Pies', club: 'barcelona', type: 'defensa', rarity: 'poco', cost: 1,
    ops: [B(add(5, resOf(POS)))], up: { ops: [B(add(8, resOf(POS)))] },
    text: 'Gana 5 de Bloqueo, +1 por cada Posesión que tengas.',
    upText: 'Gana 8 de Bloqueo, +1 por cada Posesión que tengas.',
    art: { tpl: 'rondo', seed: 3 },
  },
  {
    id: 'bar.basculacion', name: 'Basculación', club: 'barcelona', type: 'defensa', rarity: 'poco', cost: 1,
    ops: [B(add(6, mul(TACTICAS, 3)))], up: { ops: [B(add(9, mul(TACTICAS, 3)))] },
    text: 'Gana 6 de Bloqueo, +3 por cada Táctica que hayas jugado este turno.',
    upText: 'Gana 9 de Bloqueo, +3 por cada Táctica que hayas jugado este turno.',
    art: { tpl: 'muro' },
  },
  {
    id: 'bar.desgaste', unlock: 3, name: 'Desgaste con Balón', club: 'barcelona', type: 'tactica', rarity: 'poco', cost: 1,
    ops: [RES(POS, 2), IF(segundaParte, [RIVAL('fatiga', 2)], [RIVAL('fatiga', 1)])],
    up: { ops: [RES(POS, 3), IF(segundaParte, [RIVAL('fatiga', 2)], [RIVAL('fatiga', 1)])] },
    text: 'Gana 2 de Posesión. El rival queda con Fatiga 1; a partir de la segunda parte, con Fatiga 2.',
    upText: 'Gana 3 de Posesión. El rival queda con Fatiga 1; a partir de la segunda parte, con Fatiga 2.',
    art: { tpl: 'presion', seed: 2 },
  },
  {
    id: 'bar.tercer_hombre', unlock: 2, name: 'El Tercer Hombre', club: 'barcelona', type: 'tactica', rarity: 'poco', cost: 1,
    ops: [D(1), IF(playedAtLeast(2), [E(1)])], up: { ops: [D(2), IF(playedAtLeast(2), [E(1)])] },
    art: { tpl: 'desmarque', seed: 2 },
  },
  {
    id: 'bar.falso_nueve', name: 'Falso Nueve', club: 'barcelona', type: 'sistema', rarity: 'poco', cost: 1,
    ops: [], hooks: [{ on: 'cardPlayed', f: { type: 'tactica' }, ops: [P(2)] }],
    up: { hooks: [{ on: 'cardPlayed', f: { type: 'tactica' }, ops: [P(3)] }] },
    text: 'Cada vez que juegues una Táctica, genera 2 de Peligro.',
    upText: 'Cada vez que juegues una Táctica, genera 3 de Peligro.',
    art: { tpl: 'sistema' },
  },
  {
    id: 'bar.defender_balon', name: 'Defender con el Balón', club: 'barcelona', type: 'sistema', rarity: 'poco', cost: 1,
    ops: [], hooks: [{ on: 'turnEnd', ops: [B(resOf(POS))] }],
    up: { cost: 0 },
    text: 'Al final de tu turno, gana 1 de Bloqueo por cada Posesión que tengas.',
    art: { tpl: 'sistema', seed: 2 },
  },

  // ── Raras ──
  {
    id: 'bar.jugada_coral', unlock: 8, name: 'Jugada Coral', club: 'barcelona', type: 'ataque', rarity: 'rara', cost: 1,
    ops: [P(5, add(1, TIPOS_JUGADOS))], up: { ops: [P(7, add(1, TIPOS_JUGADOS))] },
    text: 'Genera {P} de Peligro una vez, más otra por cada tipo de carta (Ataque, Defensa, Táctica) que hayas jugado este turno.',
    art: { tpl: 'tiki', seed: 3 },
    flavor: 'Del portero al nueve sin que el rival la huela.',
  },
  {
    id: 'bar.portero_libero', name: 'Portero Líbero', club: 'barcelona', type: 'defensa', rarity: 'rara', cost: 1, kw: ['retener'],
    ops: [B(7), IF(hasRes(POS, 4), [E(1)])], up: { ops: [B(10), IF(hasRes(POS, 4), [E(1)])] },
    art: { tpl: 'parada' },
    flavor: 'Aquí el primer pase lo da el portero.',
  },
  {
    id: 'bar.verticalidad', unlock: 5, name: 'Verticalidad', club: 'barcelona', type: 'tactica', rarity: 'rara', cost: 1,
    ops: [{ op: 'spendRes', res: POS, max: 4, then: [D(spent)] }], up: { cost: 0 },
    text: 'Gasta hasta 4 de Posesión. Roba 1 carta por cada Posesión gastada.',
    art: { tpl: 'paseLargo', seed: 2 },
    flavor: 'Tener el balón es el camino, no la meta.',
  },
  {
    id: 'bar.recital', unlock: 6, name: 'Recital', club: 'barcelona', type: 'tactica', rarity: 'rara', cost: 'X',
    ops: [RES(POS, X), D(X)], up: { ops: [RES(POS, add(X, 1)), D(add(X, 1))] },
    text: 'Gana X de Posesión y roba X cartas.',
    upText: 'Gana X+1 de Posesión y roba X+1 cartas.',
    art: { tpl: 'rondo', seed: 4 },
    flavor: 'Noventa minutos de toque. El rival, mirando.',
  },
  {
    id: 'bar.juego_posicion', unlock: 7, name: 'Juego de Posición', club: 'barcelona', type: 'sistema', rarity: 'rara', cost: 2,
    ops: [],
    hooks: [{
      on: 'resGained', f: { res: POS }, when: hasRes(POS, 6), limit: { per: 'turn', n: 1 },
      ops: [RES(POS, maxV(0, add(4, mul(resOf(POS), -1))))],
    }],
    up: { cost: 1 },
    text: 'Cuando tu Posesión llega a 6, vuelve a 4 en lugar de a 2 (una vez por turno).',
    art: { tpl: 'sistema', seed: 3 },
    flavor: 'Que corra el balón, no el jugador.',
  },

  // ── Leyendas ──
  {
    id: 'bar.messi', unlock: 10, name: 'Messi', club: 'barcelona', type: 'ataque', rarity: 'leyenda', cost: 2, kw: ['doblete'],
    ops: [{ op: 'spendRes', res: POS, max: 3, then: [P(6, add(2, spent))] }],
    up: { ops: [{ op: 'spendRes', res: POS, max: 3, then: [P(7, add(2, spent))] }] },
    text: 'Doblete. Gasta hasta 3 de Posesión. Genera {P} de Peligro dos veces, más una vez por cada Posesión gastada.',
    legend: { player: 'Lionel Messi', dorsal: 10 }, art: { tpl: 'regate', seed: 2 },
    flavor: 'Recibe, encara y define. Siempre igual, siempre imposible.',
  },
  {
    id: 'bar.xavi_iniesta', unlock: 9, name: 'Xavi e Iniesta', club: 'barcelona', type: 'tactica', rarity: 'leyenda', cost: 2,
    ops: [RES(POS, 2), { op: 'pick', from: 'hand', min: 0, max: 2, act: 'freeTurn' }], up: { cost: 1 },
    text: 'Gana 2 de Posesión. Elige hasta 2 cartas de tu mano: cuestan 0 este turno.',
    legend: { player: 'Xavi e Iniesta', dorsal: 6 }, art: { tpl: 'tiki', seed: 4 },
    flavor: 'Dos cerebros y un solo balón, que nunca se pierde.',
  },
  {
    id: 'bar.pedri_gavi', name: 'Pedri y Gavi', club: 'barcelona', type: 'defensa', rarity: 'leyenda', cost: 1, kw: ['retener'],
    ops: [IF(hasRes(POS, 4), [RIVAL('desorganizado', 1)]), B(7), P(7), RES(POS, 1)],
    up: { ops: [IF(hasRes(POS, 4), [RIVAL('desorganizado', 1)]), B(9), P(9), RES(POS, 1)] },
    text: 'Retener. Si tienes 4+ de Posesión, el rival queda Desorganizado 1. Gana {B} de Bloqueo, genera {P} de Peligro y gana 1 de Posesión.',
    legend: { player: 'Pedri y Gavi', dorsal: 8 }, art: { tpl: 'presion', seed: 3 },
    flavor: 'De La Masia al mundo: talento y colmillo.',
  },
]
