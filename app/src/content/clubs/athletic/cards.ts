import type { CardDef } from '../../../engine/model/types'
import { B, CUSTOM, D, E, HURT, IF, P, RES, RIVAL, hasBlock, hasRes, intent, mul, add, phase, resOf, spent, picked } from '../../dsl'

const G = 'garra' as const

export const ATHLETIC_CARDS: CardDef[] = [
  // ── Iniciales ──
  {
    id: 'ath.bravura', name: 'Bravura', club: 'athletic', type: 'ataque', rarity: 'inicial', cost: 1,
    ops: [P(7), RES(G, 1)], up: { ops: [P(10), RES(G, 1)] }, art: { tpl: 'contra' },
    flavor: 'Ni un balón perdido.',
  },
  {
    id: 'ath.muro_rojiblanco', name: 'Muro Rojiblanco', club: 'athletic', type: 'defensa', rarity: 'inicial', cost: 1, kw: ['agotar'],
    ops: [B(8)], up: { ops: [B(11)] }, art: { tpl: 'muro' },
    flavor: 'Once leones en treinta metros.',
  },

  // ── Comunes ──
  {
    id: 'ath.rugido', name: 'Rugido de La Catedral', club: 'athletic', type: 'tactica', rarity: 'comun', cost: 0, kw: ['agotar'],
    ops: [RES(G, 2)], up: { ops: [RES(G, 3)] }, art: { tpl: 'remontada' },
  },
  {
    id: 'ath.entrada_limpia', name: 'Entrada Limpia', club: 'athletic', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [P(6), IF(hasBlock(), [RIVAL('desorganizado', 1)])], up: { ops: [P(8), IF(hasBlock(), [RIVAL('desorganizado', 1)])] },
    art: { tpl: 'falta' },
  },
  {
    id: 'ath.linea_compacta', name: 'Línea Compacta', club: 'athletic', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(6), IF(hasRes(G, 3), [D(1)])], up: { ops: [B(9), IF(hasRes(G, 3), [D(1)])] }, art: { tpl: 'lineaAlta' },
  },
  {
    id: 'ath.cabezazo', name: 'Cabezazo', club: 'athletic', type: 'ataque', rarity: 'comun', cost: 2,
    ops: [P(13)], up: { ops: [P(17)] }, art: { tpl: 'cabezazo' },
    flavor: 'Tradición de área.',
  },
  {
    id: 'ath.choque', name: 'Choque Frontal', club: 'athletic', type: 'ataque', rarity: 'comun', cost: 2,
    ops: [{ op: 'spendRes', res: G, max: 3, then: [P(add(10, mul(spent, 3)))] }],
    up: { ops: [{ op: 'spendRes', res: G, max: 3, then: [P(add(12, mul(spent, 4)))] }] },
    text: 'Gasta hasta 3 de Garra. Genera 10 de Peligro, +3 por cada Garra gastada.',
    upText: 'Gasta hasta 3 de Garra. Genera 12 de Peligro, +4 por cada Garra gastada.',
    art: { tpl: 'contra' },
  },
  {
    id: 'ath.cantera', name: 'Cantera', club: 'athletic', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [{ op: 'pick', from: 'hand', min: 1, max: 1, act: 'exhaust' }, D(2)], up: { cost: 0 }, art: { tpl: 'rondo' },
  },
  {
    id: 'ath.despeje_heroico', name: 'Despeje Heroico', club: 'athletic', type: 'defensa', rarity: 'comun', cost: 1,
    ops: [B(7), IF(intent('ocasion'), [B(3)])], up: { ops: [B(9), IF(intent('ocasion'), [B(4)])] }, art: { tpl: 'despeje' },
  },
  {
    id: 'ath.presion_leones', name: 'Presión de Leones', club: 'athletic', type: 'tactica', rarity: 'comun', cost: 1,
    ops: [RIVAL('fatiga', 1), RES(G, 1)], up: { ops: [RIVAL('fatiga', 2), RES(G, 1)] }, art: { tpl: 'presion' },
  },
  {
    id: 'ath.patadon', name: 'Patadón', club: 'athletic', type: 'ataque', rarity: 'comun', cost: 0, kw: ['agotar'],
    ops: [P(5)], up: { ops: [P(8)] }, art: { tpl: 'paseLargo' },
  },
  {
    id: 'ath.bloque_bajo', name: 'Bloque Bajo', club: 'athletic', type: 'defensa', rarity: 'comun', cost: 2,
    ops: [B(13)], up: { ops: [B(17)] }, art: { tpl: 'autobus' },
  },
  {
    id: 'ath.segunda_jugada', name: 'Segunda Jugada', club: 'athletic', type: 'ataque', rarity: 'comun', cost: 1,
    ops: [IF(hasRes(G, 4), [P(5, 2)], [P(5)])], up: { ops: [IF(hasRes(G, 4), [P(7, 2)], [P(7)])] },
    text: 'Genera {P} de Peligro. Si tienes 4+ de Garra, lo hace dos veces.',
    art: { tpl: 'cabezazo' },
  },

  // ── Poco comunes ──
  {
    id: 'ath.corazon', name: 'Corazón Rojiblanco', club: 'athletic', type: 'sistema', rarity: 'poco', cost: 1,
    ops: [], hooks: [{ on: 'turnStart', ops: [RES(G, 1)] }], up: { cost: 0 },
    text: 'Al inicio de cada turno, gana 1 de Garra.',
    art: { tpl: 'sistema' },
  },
  {
    id: 'ath.lezama', name: 'Lezama', club: 'athletic', type: 'sistema', rarity: 'poco', cost: 1,
    ops: [], hooks: [{ on: 'cardExhausted', limit: { per: 'turn', n: 2 }, ops: [D(1)] }],
    up: { hooks: [{ on: 'cardExhausted', limit: { per: 'turn', n: 3 }, ops: [D(1)] }] },
    text: 'Cuando agotes una carta, roba 1 (máx. 2 por turno).', upText: 'Cuando agotes una carta, roba 1 (máx. 3 por turno).',
    art: { tpl: 'rondo' },
  },
  {
    id: 'ath.muralla', name: 'Muralla', club: 'athletic', type: 'defensa', rarity: 'poco', cost: 2,
    ops: [{ op: 'spendRes', res: G, max: 'all', then: [B(add(10, mul(spent, 2)))] }],
    up: { ops: [{ op: 'spendRes', res: G, max: 'all', then: [B(add(13, mul(spent, 3)))] }] },
    text: 'Gasta toda tu Garra. Gana 10 de Bloqueo, +2 por cada Garra gastada.',
    upText: 'Gasta toda tu Garra. Gana 13 de Bloqueo, +3 por cada Garra gastada.',
    art: { tpl: 'muro' },
  },
  {
    id: 'ath.carga', name: 'Carga del León', club: 'athletic', type: 'ataque', rarity: 'poco', cost: 1,
    ops: [IF(phase('tramoFinal'), [P(4, 3)], [P(4, 2)])], up: { ops: [IF(phase('tramoFinal'), [P(5, 3)], [P(5, 2)])] },
    text: 'Genera {P} de Peligro dos veces. En el tramo final, tres veces.',
    art: { tpl: 'contra' },
  },
  {
    id: 'ath.sacrificio', name: 'Sacrificio', club: 'athletic', type: 'tactica', rarity: 'poco', cost: 0, kw: ['agotar'],
    ops: [HURT(3), E(2)], up: { ops: [HURT(2), E(2)] }, art: { tpl: 'remontada' },
  },
  {
    id: 'ath.orgullo', name: 'Orgullo', club: 'athletic', type: 'defensa', rarity: 'poco', cost: 1,
    ops: [B(add(5, resOf(G)))], up: { ops: [B(add(8, resOf(G)))] },
    text: 'Gana 5 de Bloqueo, más 1 por cada Garra que tengas.', upText: 'Gana 8 de Bloqueo, más 1 por cada Garra que tengas.',
    art: { tpl: 'muro' },
  },
  {
    id: 'ath.forjado', name: 'Forjado en Lezama', club: 'athletic', type: 'tactica', rarity: 'poco', cost: 1,
    ops: [{ op: 'pick', from: 'hand', min: 0, max: 2, act: 'exhaust' }, B(mul(picked, 4))],
    up: { ops: [{ op: 'pick', from: 'hand', min: 0, max: 2, act: 'exhaust' }, B(mul(picked, 6))] },
    text: 'Agota hasta 2 cartas de tu mano. Gana 4 de Bloqueo por cada una.',
    upText: 'Agota hasta 2 cartas de tu mano. Gana 6 de Bloqueo por cada una.',
    art: { tpl: 'rondo' },
  },
  {
    id: 'ath.contra_leon', name: 'Contra del León', club: 'athletic', type: 'ataque', rarity: 'poco', cost: 2,
    ops: [{ op: 'repliegueRemove', n: 'all' }, P(12)], up: { ops: [{ op: 'repliegueRemove', n: 'all' }, P(16)] },
    art: { tpl: 'contra' },
  },
  {
    id: 'ath.marcaje', name: 'Marcaje Férreo', club: 'athletic', type: 'tactica', rarity: 'poco', cost: 1,
    ops: [{ op: 'reduceOcasion', n: 4 }, RES(G, 1)], up: { ops: [{ op: 'reduceOcasion', n: 6 }, RES(G, 1)] },
    art: { tpl: 'presion' },
  },

  // ── Raras ──
  {
    id: 'ath.catedral', name: 'La Catedral', club: 'athletic', type: 'sistema', rarity: 'rara', cost: 3,
    ops: [], hooks: [{ on: 'turnStart', ops: [B(5), RES(G, 1)] }], up: { cost: 2 },
    text: 'Al inicio de cada turno, gana 5 de Bloqueo y 1 de Garra.',
    art: { tpl: 'sistema' },
  },
  {
    id: 'ath.furia', name: 'Furia Rojiblanca', club: 'athletic', type: 'ataque', rarity: 'rara', cost: 2,
    ops: [{ op: 'spendRes', res: G, max: 'all', then: [P(add(6, mul(spent, 4)))] }],
    up: { ops: [{ op: 'spendRes', res: G, max: 'all', then: [P(add(8, mul(spent, 5)))] }] },
    text: 'Gasta toda tu Garra. Genera 6 de Peligro, +4 por cada Garra gastada.',
    upText: 'Gasta toda tu Garra. Genera 8 de Peligro, +5 por cada Garra gastada.',
    art: { tpl: 'remontada' },
  },
  {
    id: 'ath.nunca_rendirse', name: 'Nunca Rendirse', club: 'athletic', type: 'sistema', rarity: 'rara', cost: 2,
    ops: [], mods: [{ stat: 'peligro', type: 'ataque', add: 4, when: phase('tramoFinal') }], up: { cost: 1 },
    text: 'En el tramo final, tus Ataques generan +4 de Peligro.',
    art: { tpl: 'remontada' },
  },
  {
    id: 'ath.fuego_forja', name: 'Fuego de Forja', club: 'athletic', type: 'tactica', rarity: 'rara', cost: 1, kw: ['agotar'],
    ops: [CUSTOM('exhaustHand'), RES(G, mul(picked, 2))], up: { cost: 0 },
    text: 'Agota todas las demás cartas de tu mano. Gana 2 de Garra por cada una.',
    art: { tpl: 'remontada' },
  },
  {
    id: 'ath.muro_historico', name: 'Muro Histórico', club: 'athletic', type: 'sistema', rarity: 'rara', cost: 2,
    ops: [{ op: 'retainBlock', n: 15 }], up: { cost: 1 },
    text: 'Al inicio de cada turno conservas la mitad de tu Bloqueo (máx. 15).',
    art: { tpl: 'muro' },
  },

  // ── Leyendas ──
  {
    id: 'ath.iribar', name: 'Iribar', club: 'athletic', type: 'defensa', rarity: 'leyenda', cost: 1, kw: ['retener'],
    ops: [B(12), { op: 'reduceOcasion', n: 5 }], up: { ops: [B(16), { op: 'reduceOcasion', n: 6 }] },
    text: 'Retener. Gana {B} de Bloqueo. Este turno, la Ocasión rival tiene −5.',
    upText: 'Retener. Gana {B} de Bloqueo. Este turno, la Ocasión rival tiene −6.',
    legend: { player: 'José Ángel Iribar', dorsal: 1 }, art: { tpl: 'parada' },
    flavor: '«El Txopo». Bajo palos, una montaña.',
  },
  {
    id: 'ath.zarra', name: 'Zarra', club: 'athletic', type: 'ataque', rarity: 'leyenda', cost: 2, kw: ['doblete'],
    ops: [IF(hasRes(G, 5), [P(8, 3)], [P(8, 2)])], up: { ops: [IF(hasRes(G, 5), [P(10, 3)], [P(10, 2)])] },
    text: 'Doblete. Genera {P} de Peligro dos veces. Con 5+ de Garra, tres veces.',
    legend: { player: 'Telmo Zarra', dorsal: 9 }, art: { tpl: 'cabezazo' },
    flavor: 'El mejor rematador de cabeza de Europa.',
  },
  {
    id: 'ath.aduriz', name: 'Aduriz', club: 'athletic', type: 'ataque', rarity: 'leyenda', cost: 1,
    ops: [IF(phase('tramoFinal'), [P(20)], [P(10)])], up: { ops: [IF(phase('tramoFinal'), [P(25)], [P(13)])] },
    text: 'Genera {P} de Peligro. En el tramo final, genera {P2} en su lugar.',
    legend: { player: 'Aritz Aduriz', dorsal: 20 }, art: { tpl: 'cabezazo' },
    flavor: 'Los goles no entienden de edad.',
  },
]
