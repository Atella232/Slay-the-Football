import type { CardDef, Cond, V } from '../../../engine/model/types'
import { B, D, E, IF, P, RES, RIVAL, SELF, add, behind, hasRes, intent, last, mul, phase, resOf, spent } from '../../dsl'

const M = 'momentum' as const

/** Remontada: vas perdiendo o es el tramo final. */
const remontando: Cond = { k: 'or', c: [behind, phase('tramoFinal')] }
/** Tácticas jugadas este turno (sin contar la carta en juego). */
const tacticasJugadas: V = { k: 'played', type: 'tactica' }

export const MADRID_CARDS: CardDef[] = [
  // ── Iniciales ──
  {
    id: 'mad.galope', name: 'Galope por Banda', club: 'madrid', type: 'ataque', rarity: 'inicial', cost: 1,
    ops: [IF(last('tactica'), [P(9)], [P(7)])], up: { ops: [IF(last('tactica'), [P(12)], [P(9)])] },
    text: 'Genera {P} de Peligro. Si la carta anterior fue una Táctica, genera {P2} en su lugar.',
    art: { tpl: 'banda' },
  },
  {
    id: 'mad.transicion', name: 'Transición', club: 'madrid', type: 'tactica', rarity: 'inicial', cost: 1,
    ops: [B(3), { op: 'freeNext', type: 'ataque' }, RES(M, 1)],
    up: { ops: [B(6), { op: 'freeNext', type: 'ataque' }, RES(M, 1)] }, art: { tpl: 'contra' },
  },

  // ── Comunes ──
  {
    id: 'mad.centro_area', name: 'Centro al Área', club: 'madrid', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(6), RES(M, 1)], up: { ops: [P(9), RES(M, 1)] }, art: { tpl: 'paseLargo' },
  },
  {
    id: 'mad.escuadra', name: 'Disparo a la Escuadra', club: 'madrid', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [{ op: 'spendRes', res: M, max: 2, then: [P(add(6, mul(spent, 4)))] }],
    up: { ops: [{ op: 'spendRes', res: M, max: 2, then: [P(add(8, mul(spent, 5)))] }] },
    text: 'Gasta hasta 2 de Momentum. Genera 6 de Peligro, +4 por cada Momentum gastado.',
    upText: 'Gasta hasta 2 de Momentum. Genera 8 de Peligro, +5 por cada Momentum gastado.',
    art: { tpl: 'falta' },
  },
  {
    id: 'mad.zapatazo', name: 'Zapatazo', club: 'madrid', type: 'ataque', rarity: 'comun', cost: 2,
    ops: [P(14)], up: { ops: [P(18)] }, art: { tpl: 'disparo' },
    flavor: 'De 15 para arriba, la grada se pone en pie.',
  },
  {
    id: 'mad.estampida', name: 'Salida en Estampida', club: 'madrid', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [IF(last('tactica'), [P(3, 3)], [P(3, 2)])], up: { ops: [IF(last('tactica'), [P(4, 3)], [P(4, 2)])] },
    text: 'Genera {P} de Peligro dos veces. Si la carta anterior fue una Táctica, tres veces.',
    art: { tpl: 'contra' },
  },
  {
    id: 'mad.plancha', name: 'Remate en Plancha', club: 'madrid', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [IF(hasRes(M, 3), [P(11)], [P(7)])], up: { ops: [IF(hasRes(M, 3), [P(14)], [P(9)])] },
    text: 'Genera {P} de Peligro. Si tienes 3+ de Momentum, genera {P2} en su lugar.',
    art: { tpl: 'cabezazo' },
  },
  {
    id: 'mad.corte_salida', name: 'Corte y Salida', club: 'madrid', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(6), SELF('contragolpe', 1)], up: { ops: [B(9), SELF('contragolpe', 1)] },
    text: 'Gana {B} de Bloqueo. Ganas Contragolpe (+3 de Peligro en tu próximo Ataque).',
    art: { tpl: 'despeje' },
  },
  {
    id: 'mad.achique', name: 'Bloque Medio', club: 'madrid', type: 'defensa', rarity: 'comun', cost: 2,
    ops: [B(11), RES(M, 1)], up: { ops: [B(15), RES(M, 1)] }, art: { tpl: 'lineaAlta' },
  },
  {
    id: 'mad.ayuda_extremo', name: 'Ayuda del Extremo', club: 'madrid', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [IF(last('ataque'), [B(9)], [B(5)])], up: { ops: [IF(last('ataque'), [B(12)], [B(7)])] },
    text: 'Gana {B} de Bloqueo. Si la carta anterior fue un Ataque, gana {B2} en su lugar.',
    art: { tpl: 'presion' },
    flavor: 'Del área rival a la propia en diez segundos.',
  },
  {
    id: 'mad.miedo_escenico', name: 'Miedo Escénico', club: 'madrid', type: 'tactica', rarity: 'comun', cost: 0, kw: ['agotar'],
    ops: [RIVAL('desorganizado', 1), RES(M, 1)], up: { ops: [RIVAL('desorganizado', 1), RES(M, 2)] },
    art: { tpl: 'remontada' },
    flavor: 'El estadio aprieta y al visitante le tiemblan las piernas.',
  },
  {
    id: 'mad.pared', name: 'Toque de Primera', club: 'madrid', type: 'tactica', rarity: 'comun', cost: 0,
    ops: [D(1), SELF('contragolpe', 1)], up: { ops: [D(1), SELF('contragolpe', 1), RES(M, 1)] },
    text: 'Roba 1 carta. Ganas Contragolpe (+3 de Peligro en tu próximo Ataque).',
    upText: 'Roba 1 carta. Ganas Contragolpe (+3 de Peligro en tu próximo Ataque). Gana 1 de Momentum.',
    art: { tpl: 'triangulo' },
  },
  {
    id: 'mad.cambio_marcha', name: 'Cambio de Marcha', club: 'madrid', type: 'tactica', rarity: 'comun', cost: 0, unlock: 2,
    ops: [D(1), IF(hasRes(M, 2), [{ op: 'spendRes', res: M, max: 2, then: [E(1)] }])],
    up: { ops: [D(1), IF(hasRes(M, 1), [{ op: 'spendRes', res: M, max: 1, then: [E(1)] }])] },
    text: 'Roba 1 carta. Si tienes 2+ de Momentum, gasta 2 y gana 1 de Energía.',
    upText: 'Roba 1 carta. Si tienes Momentum, gasta 1 y gana 1 de Energía.',
    art: { tpl: 'regate' },
  },

  // ── Poco comunes ──
  {
    id: 'mad.descuento', name: 'Cabezazo en el Descuento', club: 'madrid', type: 'ataque', rarity: 'poco', cost: 1, unlock: 5,
    ops: [IF(remontando, [P(15)], [P(7)])], up: { ops: [IF(remontando, [P(18)], [P(9)])] },
    text: 'Genera {P} de Peligro. Si vas perdiendo o es el tramo final, genera {P2} en su lugar.',
    art: { tpl: 'corner' },
    flavor: 'Minuto 93. Nadie se ha ido a casa.',
  },
  {
    id: 'mad.cabalgada', name: 'Cabalgada', club: 'madrid', type: 'ataque', rarity: 'poco', cost: 1, unlock: 4,
    ops: [{ op: 'spendRes', res: M, max: 3, then: [P(4, add(1, spent))] }],
    up: { ops: [{ op: 'spendRes', res: M, max: 3, then: [P(5, add(1, spent))] }] },
    text: 'Gasta hasta 3 de Momentum. Genera {P} de Peligro, una vez más por cada Momentum gastado.',
    art: { tpl: 'regate' },
  },
  {
    id: 'mad.segunda_linea', name: 'Llegada de Segunda Línea', club: 'madrid', type: 'ataque', rarity: 'poco', cost: 1,
    ops: [P(6), RES(M, tacticasJugadas)], up: { ops: [P(9), RES(M, tacticasJugadas)] },
    text: 'Genera {P} de Peligro. Gana 1 de Momentum por cada Táctica que hayas jugado este turno.',
    art: { tpl: 'desmarque' },
  },
  {
    id: 'mad.chilena', name: 'Chilena', club: 'madrid', type: 'ataque', rarity: 'poco', cost: 2, kw: ['agotar'],
    ops: [P(20)], up: { ops: [P(26)] }, art: { tpl: 'disparo' },
    flavor: 'Hay goles que aplaude hasta la afición rival.',
  },
  {
    id: 'mad.muro_blanco', name: 'Muro Blanco', club: 'madrid', type: 'defensa', rarity: 'poco', cost: 1,
    ops: [{ op: 'spendRes', res: M, max: 2, then: [B(add(6, mul(spent, 4)))] }],
    up: { ops: [{ op: 'spendRes', res: M, max: 2, then: [B(add(8, mul(spent, 5)))] }] },
    text: 'Gasta hasta 2 de Momentum. Gana 6 de Bloqueo, +4 por cada Momentum gastado.',
    upText: 'Gasta hasta 2 de Momentum. Gana 8 de Bloqueo, +5 por cada Momentum gastado.',
    art: { tpl: 'muro' },
  },
  {
    id: 'mad.mano_salvadora', name: 'Mano Salvadora', club: 'madrid', type: 'defensa', rarity: 'poco', cost: 2,
    ops: [B(12), IF(intent('ocasion'), [RES(M, 1), D(1)])], up: { ops: [B(16), IF(intent('ocasion'), [RES(M, 1), D(1)])] },
    text: 'Gana {B} de Bloqueo. Si el rival prepara una Ocasión, gana 1 de Momentum y roba 1 carta.',
    art: { tpl: 'parada' },
  },
  {
    id: 'mad.basculacion', name: 'Ayudas Defensivas', club: 'madrid', type: 'defensa', rarity: 'poco', cost: 1, unlock: 3,
    ops: [B(add(4, mul(tacticasJugadas, 2)))], up: { ops: [B(add(7, mul(tacticasJugadas, 2)))] },
    text: 'Gana 4 de Bloqueo, +2 por cada Táctica que hayas jugado este turno.',
    upText: 'Gana 7 de Bloqueo, +2 por cada Táctica que hayas jugado este turno.',
    art: { tpl: 'autobus' },
  },
  {
    id: 'mad.noventa_minutos', name: 'Noventa Minutos', club: 'madrid', type: 'tactica', rarity: 'poco', cost: 1,
    ops: [RES(M, 2), IF(remontando, [E(1), D(1)])], up: { ops: [RES(M, 3), IF(remontando, [E(1), D(1)])] },
    text: 'Gana 2 de Momentum. Si vas perdiendo o es el tramo final, gana 1 de Energía y roba 1 carta.',
    upText: 'Gana 3 de Momentum. Si vas perdiendo o es el tramo final, gana 1 de Energía y roba 1 carta.',
    art: { tpl: 'remontada' },
    flavor: '«Noventa minuti en el Bernabéu son molto longo.»',
  },
  {
    id: 'mad.noches_europeas', name: 'Noches Europeas', club: 'madrid', type: 'sistema', rarity: 'poco', cost: 1, unlock: 3,
    ops: [], hooks: [{ on: 'resGained', f: { res: M }, ops: [B(2)] }],
    up: { hooks: [{ on: 'resGained', f: { res: M }, ops: [B(3)] }] },
    text: 'Cada vez que ganes Momentum, gana 2 de Bloqueo.', upText: 'Cada vez que ganes Momentum, gana 3 de Bloqueo.',
    art: { tpl: 'sistema' },
  },

  // ── Raras ──
  {
    id: 'mad.remontada', name: 'Remontada', club: 'madrid', type: 'ataque', rarity: 'rara', cost: 2, unlock: 7,
    ops: [{ op: 'spendRes', res: M, max: 'all', then: [IF(remontando, [P(add(5, mul(spent, 2)), 3)], [P(add(5, mul(spent, 2)), 2)])] }],
    up: { ops: [{ op: 'spendRes', res: M, max: 'all', then: [IF(remontando, [P(add(7, mul(spent, 2)), 3)], [P(add(7, mul(spent, 2)), 2)])] }] },
    text: 'Gasta todo tu Momentum. Genera dos veces 5 de Peligro, +2 por cada Momentum gastado. Si vas perdiendo o es el tramo final, tres veces.',
    upText: 'Gasta todo tu Momentum. Genera dos veces 7 de Peligro, +2 por cada Momentum gastado. Si vas perdiendo o es el tramo final, tres veces.',
    art: { tpl: 'remontada' },
    flavor: 'Aquí nadie se rinde mientras ruede el balón.',
  },
  {
    id: 'mad.vendaval', name: 'Vendaval', club: 'madrid', type: 'tactica', rarity: 'rara', cost: 0, unlock: 8,
    ops: [IF(hasRes(M, 3), [{ op: 'spendRes', res: M, max: 3, then: [{ op: 'playTwice', type: 'ataque' }] }], [RES(M, 2)])],
    up: { ops: [IF(hasRes(M, 2), [{ op: 'spendRes', res: M, max: 2, then: [{ op: 'playTwice', type: 'ataque' }] }], [RES(M, 2)])] },
    text: 'Si tienes 3+ de Momentum, gasta 3: tu próximo Ataque este turno se juega dos veces. Si no, gana 2 de Momentum.',
    upText: 'Si tienes 2+ de Momentum, gasta 2: tu próximo Ataque este turno se juega dos veces. Si no, gana 2 de Momentum.',
    art: { tpl: 'contra' },
    flavor: 'Tres pases, diez segundos y el balón dentro.',
  },
  {
    id: 'mad.galacticos', name: 'Galácticos', club: 'madrid', type: 'sistema', rarity: 'rara', cost: 3, unlock: 9,
    ops: [], mods: [{ stat: 'peligro', type: 'ataque', add: resOf(M) }], up: { cost: 2 },
    text: 'Tus Ataques generan +1 de Peligro por cada Momentum que tengas.',
    art: { tpl: 'sistema' },
    flavor: 'Una estrella en cada línea del campo.',
  },
  {
    id: 'mad.hasta_el_final', name: 'Hasta el Final', club: 'madrid', type: 'sistema', rarity: 'rara', cost: 2, unlock: 6,
    ops: [], hooks: [{ on: 'turnStart', when: remontando, ops: [E(1), D(1)] }], up: { cost: 1 },
    text: 'Al inicio de cada turno, si vas perdiendo o es el tramo final, gana 1 de Energía y roba 1 carta.',
    art: { tpl: 'sistema' },
    flavor: 'El reloj también juega de blanco.',
  },

  // ── Leyendas ──
  {
    id: 'mad.zidane', name: 'Zidane', club: 'madrid', type: 'ataque', rarity: 'leyenda', cost: 2, kw: ['retener'],
    ops: [RIVAL('desorganizado', 1), P(12)], up: { ops: [RIVAL('desorganizado', 1), P(16)] },
    text: 'Retener. El rival queda Desorganizado 1. Genera {P} de Peligro.',
    legend: { player: 'Zinedine Zidane', dorsal: 5 }, art: { tpl: 'disparo' },
    flavor: 'Glasgow, 2002. Una volea para la eternidad.',
  },
  {
    id: 'mad.ronaldo', name: 'Ronaldo Nazario', club: 'madrid', type: 'ataque', rarity: 'leyenda', cost: 1,
    ops: [{ op: 'repliegueRemove', n: 'all' }, P(6, 2), RES(M, 1)],
    up: { ops: [{ op: 'repliegueRemove', n: 'all' }, P(8, 2), RES(M, 1)] },
    text: 'Elimina todo el Repliegue rival. Genera {P} de Peligro dos veces. Gana 1 de Momentum.',
    legend: { player: 'Ronaldo Nazario', dorsal: 11 }, art: { tpl: 'regate' },
    flavor: 'El Fenómeno: regatear al portero era un trámite.',
  },
  {
    id: 'mad.benzema', name: 'Benzema', club: 'madrid', type: 'ataque', rarity: 'leyenda', cost: 2, kw: ['doblete'], unlock: 10,
    ops: [P(5, add(1, resOf(M)))], up: { ops: [P(7, add(1, resOf(M)))] },
    text: 'Doblete. Genera {P} de Peligro, una vez más por cada Momentum que tengas.',
    legend: { player: 'Karim Benzema', dorsal: 9 }, art: { tpl: 'desmarque' },
    flavor: 'Diecisiete minutos para darle la vuelta a una eliminatoria.',
  },
  {
    id: 'mad.modric_kroos', name: 'Modrić y Kroos', club: 'madrid', type: 'tactica', rarity: 'leyenda', cost: 1, kw: ['retener'],
    ops: [RES(M, 2), D(2), { op: 'freeNext', type: 'ataque' }], up: { cost: 0 },
    text: 'Retener. Gana 2 de Momentum. Roba 2 cartas. Tu próximo Ataque este turno cuesta 0.',
    legend: { player: 'Luka Modrić y Toni Kroos', dorsal: 10 }, art: { tpl: 'tiki' },
    flavor: 'Uno la esconde, el otro la reparte. El rival sólo mira.',
  },
]
