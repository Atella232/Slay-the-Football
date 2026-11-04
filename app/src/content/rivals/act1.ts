import type { RivalDef } from '../../engine/model/types'
import { at, buff, giveCard, mv, oc, pres, rep, toPlayer, toSelf } from './helpers'
import { B } from '../dsl'

export const ACT1_RIVALS: RivalDef[] = [
  // ───────── Liga ─────────
  {
    id: 'r1.villarriba', name: 'CD Villarriba', short: 'VLR', act: 1, tier: 'liga', easy: true,
    segments: [21, 25], formation: '4-4-2',
    trait: { name: 'Equipo de pueblo', text: 'Corren mucho, piensan poco.' },
    kit: { primary: '#2f7d32', secondary: '#f5f5f5', pattern: 'rayas', crest: 'escudo', emblem: 1 },
    ai: {
      moves: {
        chut: mv('Chut desde lejos', oc(7)),
        entrada: mv('Entrada a destiempo', at(6)),
        atras: mv('Todos atrás', rep(6), at(3)),
      },
      opening: ['entrada', 'chut'],
      pick: [{ move: 'chut', w: 3 }, { move: 'entrada', w: 4 }, { move: 'atras', w: 3 }],
    },
  },
  {
    id: 'r1.villabajo', name: 'Atlético Villabajo', short: 'VLB', act: 1, tier: 'liga', easy: true,
    segments: [22, 25], formation: '5-3-2',
    trait: { name: 'Leñeros', text: 'Sus entradas te dejan Desconcentrado.' },
    kit: { primary: '#6d2b8f', secondary: '#ffd54f', pattern: 'mitades', crest: 'circulo', emblem: 2 },
    ai: {
      moves: {
        fea: mv('Entrada fea', at(5), pres('Te deja Desconcentrado', [toPlayer('desconcentrado', 1)])),
        tiro: mv('Tiro cruzado', oc(8)),
        bloque: mv('Bloque bajo', rep(7)),
      },
      opening: ['bloque'],
      pick: [{ move: 'fea', w: 4 }, { move: 'tiro', w: 4 }, { move: 'bloque', w: 2 }],
    },
  },
  {
    id: 'r1.chiringuito', name: 'Deportivo Chiringuito', short: 'CHI', act: 1, tier: 'liga',
    segments: [24, 28], formation: '5-4-1', startRepliegue: 6,
    trait: { name: 'Catenaccio', text: 'Empiezan con 6 de Repliegue y se encierran atrás.' },
    kit: { primary: '#0d47a1', secondary: '#90caf9', pattern: 'aros', crest: 'rombo', emblem: 3 },
    ai: {
      moves: {
        cerrojo: mv('Cerrojo', rep(10)),
        contra: mv('Contra rápida', oc(9)),
        patada: mv('Patada a seguir', rep(5), at(5)),
      },
      pick: [{ move: 'cerrojo', w: 4 }, { move: 'contra', w: 4 }, { move: 'patada', w: 3 }],
    },
  },
  {
    id: 'r1.polvoranca', name: 'Racing de Polvoranca', short: 'RPO', act: 1, tier: 'liga',
    segments: [24, 29], formation: '4-4-2',
    trait: { name: 'Juego aéreo', text: 'Cada tres turnos, un centro peligrosísimo al área.' },
    kit: { primary: '#ffffff', secondary: '#c62828', pattern: 'banda', crest: 'escudo', emblem: 4 },
    ai: {
      moves: {
        balon: mv('Balón largo', at(6)),
        segunda: mv('Segunda jugada', rep(4), at(4)),
        remate: mv('Centro al área', oc(12)),
      },
      opening: ['balon', 'segunda', 'remate', 'balon', 'segunda', 'remate', 'balon', 'segunda', 'remate', 'balon', 'segunda', 'remate'],
      pick: [{ move: 'balon', w: 1 }],
    },
  },
  {
    id: 'r1.las_tapias', name: 'UD Las Tapias', short: 'UDT', act: 1, tier: 'liga',
    segments: [24, 28], formation: '4-3-3',
    trait: { name: 'Presión alta', text: 'Su presión mete Malos Pases en tu descarte.' },
    kit: { primary: '#ff6f00', secondary: '#212121', pattern: 'liso', crest: 'estandarte', emblem: 5 },
    ai: {
      moves: {
        presion: mv('Presión asfixiante', at(4), pres('Añade 1 Mal Pase a tu descarte', [giveCard('est.mal_pase', 'discard')])),
        robo: mv('Robo y tiro', oc(9)),
        golpe: mv('Ataque directo', at(7)),
      },
      opening: ['presion'],
      pick: [{ move: 'presion', w: 3 }, { move: 'robo', w: 4 }, { move: 'golpe', w: 3 }],
    },
  },
  {
    id: 'r1.barrio', name: 'Unión Deportiva Barrio', short: 'UDB', act: 1, tier: 'liga',
    segments: [25, 29], formation: '4-5-1',
    trait: { name: 'Pérdida de tiempo', text: 'Cuando van ganando, se repliegan y se tiran al suelo.' },
    kit: { primary: '#f9a825', secondary: '#1b5e20', pattern: 'cuartos', crest: 'circulo', emblem: 6 },
    ai: {
      moves: {
        ocasion: mv('Llegada por banda', oc(10)),
        ataque: mv('Disparo a puerta', at(7)),
        tiempo: mv('Fingir lesión', rep(9), buff('Gana 1 de Solidez', [toSelf('solidez', 1)])),
      },
      pick: [
        { move: 'ocasion', w: 4 },
        { move: 'ataque', w: 4 },
        { move: 'tiempo', w: 1 },
        { move: 'tiempo', w: 6, when: { k: 'scoreDiff', op: '>', n: 0 } },
      ],
    },
  },

  // ───────── Copa ─────────
  {
    id: 'r1.arrabal', name: 'Real Sporting Arrabal', short: 'RSA', act: 1, tier: 'copa',
    segments: [28, 34, 36], formation: '4-4-2', meta: 3,
    trait: { name: 'Portero en racha', text: 'Al inicio de cada turno tuyo, el rival gana 4 de Repliegue.' },
    hooks: [{ on: 'turnStart', ops: [B(4)] }],
    kit: { primary: '#004d40', secondary: '#ffeb3b', pattern: 'chevron', crest: 'escudo', emblem: 7 },
    ai: {
      moves: {
        contra: mv('Contragolpe', oc(11)),
        choque: mv('Choque', at(8)),
        pared: mv('Pared y disparo', oc(8), at(4)),
      },
      opening: ['choque'],
      pick: [{ move: 'contra', w: 3 }, { move: 'choque', w: 4 }, { move: 'pared', w: 3 }],
    },
  },
  {
    id: 'r1.hierro_viejo', name: 'CF Hierro Viejo', short: 'CFH', act: 1, tier: 'copa',
    segments: [29, 34, 38], formation: '5-3-2', meta: 3,
    trait: { name: 'Juego duro', text: 'Pegan fuerte y acumulan amarillas: a la segunda, bronca y pierden su siguiente ocasión.' },
    kit: { primary: '#424242', secondary: '#ff5722', pattern: 'rayas', crest: 'rombo', emblem: 8 },
    ai: {
      moves: {
        hachazo: mv('Hachazo', at(11), buff('Ve la amarilla', [toSelf('amarilla', 1)])),
        tiro: mv('Tiro raso', oc(10)),
        lio: mv('Tangana', at(5), pres('Quedas Desconcentrado', [toPlayer('desconcentrado', 2)])),
      },
      opening: ['lio'],
      pick: [{ move: 'hachazo', w: 4 }, { move: 'tiro', w: 4 }, { move: 'lio', w: 2 }],
    },
  },
  {
    id: 'r1.rondo', name: 'Atlético Rondo', short: 'ATR', act: 1, tier: 'copa',
    segments: [28, 32, 36], formation: '4-3-3', meta: 3,
    trait: { name: 'Tiki-taka de barrio', text: 'Mientras tocan, ganan Confianza. Luego llegan con mucho peligro.' },
    kit: { primary: '#1565c0', secondary: '#ffffff', pattern: 'finas', crest: 'circulo', emblem: 9 },
    ai: {
      moves: {
        toque: mv('Toque y toque', rep(6), buff('Gana 1 de Confianza', [toSelf('confianza', 1)])),
        llegada: mv('Llegada al área', oc(10)),
        disparo: mv('Disparo', at(7)),
      },
      opening: ['toque', 'llegada'],
      pick: [{ move: 'toque', w: 3 }, { move: 'llegada', w: 4 }, { move: 'disparo', w: 3 }],
    },
  },

  // ───────── Finales ─────────
  {
    id: 'r1.meseta', name: 'Real Unión de la Meseta', short: 'RUM', act: 1, tier: 'final',
    segments: [34, 39, 42], formation: '4-4-2', meta: 3,
    trait: { name: 'Campeón de Segunda', text: 'Empieza encerrado; cada gol que encaja le hace más agresivo.' },
    kit: { primary: '#b71c1c', secondary: '#fafafa', pattern: 'mitades', crest: 'escudo', emblem: 10 },
    ai: {
      moves: {
        muro: mv('Muralla', rep(10), at(4)),
        contra: mv('Contra letal', oc(11)),
      },
      opening: ['muro'],
      pick: [{ move: 'muro', w: 5 }, { move: 'contra', w: 5 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Al ataque',
        onEnter: [toSelf('confianza', 1)],
        ai: {
          moves: {
            asedio: mv('Asedio', oc(12)),
            golpe: mv('Golpe a golpe', at(7, 2)),
            presion: mv('Presión', at(6), pres('Añade 1 Cansancio a tu robo', [giveCard('est.cansancio', 'draw')])),
          },
          pick: [{ move: 'asedio', w: 4 }, { move: 'golpe', w: 4 }, { move: 'presion', w: 2 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'A la desesperada',
        onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            todos: mv('Todos arriba', oc(13), at(5)),
            pelotazo: mv('Pelotazo', at(12)),
          },
          pick: [{ move: 'todos', w: 6 }, { move: 'pelotazo', w: 4 }],
        },
      },
    ],
  },
  {
    id: 'r1.altiplano', name: 'CD Altiplano', short: 'CDA', act: 1, tier: 'final',
    segments: [35, 38, 42], formation: '3-5-2', meta: 3,
    trait: { name: 'Equipo físico', text: 'Golpea varias veces y te mete Calambres en el mazo.' },
    kit: { primary: '#5d4037', secondary: '#ffcc80', pattern: 'aros', crest: 'estandarte', emblem: 11 },
    ai: {
      moves: {
        rafaga: mv('Ráfaga', at(4, 3)),
        calambre: mv('Ritmo infernal', at(5), pres('Añade 1 Calambre a tu robo', [giveCard('est.calambre', 'draw')])),
        remate: mv('Remate de cabeza', oc(11)),
      },
      opening: ['calambre'],
      pick: [{ move: 'rafaga', w: 4 }, { move: 'calambre', w: 2 }, { move: 'remate', w: 4 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Más físico',
        ai: {
          moves: {
            rafaga: mv('Ráfaga', at(5, 3)),
            remate: mv('Remate de cabeza', oc(12)),
            balon: mv('Balón dividido', rep(8), at(5)),
          },
          pick: [{ move: 'rafaga', w: 4 }, { move: 'remate', w: 4 }, { move: 'balon', w: 2 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'Último aliento',
        onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            rafaga: mv('Ráfaga final', at(5, 3)),
            remate: mv('Remate a bocajarro', oc(13)),
          },
          pick: [{ move: 'rafaga', w: 5 }, { move: 'remate', w: 5 }],
        },
      },
    ],
  },
]
