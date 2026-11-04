import type { RivalDef } from '../../engine/model/types'
import { at, buff, giveCard, mv, oc, pres, rep, toPlayer, toSelf } from './helpers'
import { B } from '../dsl'

export const ACT2_RIVALS: RivalDef[] = [
  // ───────── Liga ─────────
  {
    id: 'r2.brumoso', name: 'Real Club Brumoso', short: 'RCB', act: 2, tier: 'liga', easy: true,
    segments: [30, 35], formation: '4-4-2',
    trait: { name: 'Contragolpeadores', text: 'Si juegas 3 Ataques en un turno, ganan 1 de Confianza.' },
    hooks: [{ on: 'cardPlayed', f: { type: 'ataque' }, when: { k: 'played', type: 'ataque', op: '>=', n: 3 }, limit: { per: 'turn', n: 1 }, ops: [toSelf('confianza', 1)] }],
    kit: { primary: '#546e7a', secondary: '#eceff1', pattern: 'rayas', crest: 'escudo', emblem: 12 },
    ai: {
      moves: {
        contra: mv('Contra a la carrera', oc(12)),
        choque: mv('Choque', at(9)),
        cierre: mv('Repliegue', rep(9), at(4)),
      },
      pick: [{ move: 'contra', w: 4 }, { move: 'choque', w: 4 }, { move: 'cierre', w: 3 }],
    },
  },
  {
    id: 'r2.ria', name: 'Sporting de la Ría', short: 'SRI', act: 2, tier: 'liga', easy: true,
    segments: [29, 35], formation: '4-3-3',
    trait: { name: 'Extremos veloces', text: 'Atacan por las dos bandas con golpes múltiples.' },
    kit: { primary: '#00838f', secondary: '#ffffff', pattern: 'finas', crest: 'circulo', emblem: 13 },
    ai: {
      moves: {
        bandas: mv('Doble banda', at(5, 2)),
        centro: mv('Centro chut', oc(12)),
        robo: mv('Robo alto', at(6), pres('Quedas Desconcentrado', [toPlayer('desconcentrado', 1)])),
      },
      pick: [{ move: 'bandas', w: 4 }, { move: 'centro', w: 4 }, { move: 'robo', w: 2 }],
    },
  },
  {
    id: 'r2.granate', name: 'Granate CF', short: 'GCF', act: 2, tier: 'liga',
    segments: [32, 36], formation: '5-4-1', startRepliegue: 8,
    trait: { name: 'Muralla granate', text: 'Empiezan con 8 de Repliegue y ganan Solidez al cerrarse.' },
    kit: { primary: '#7b1f2e', secondary: '#f8bbd0', pattern: 'liso', crest: 'rombo', emblem: 14 },
    ai: {
      moves: {
        muro: mv('Muro', rep(12), buff('Gana 1 de Solidez', [toSelf('solidez', 1)])),
        salida: mv('Salida rápida', oc(13)),
        golpe: mv('Golpe seco', at(10)),
      },
      pick: [{ move: 'muro', w: 3 }, { move: 'salida', w: 4 }, { move: 'golpe', w: 3 }],
    },
  },
  {
    id: 'r2.faro', name: 'Deportivo Faro', short: 'DFA', act: 2, tier: 'liga',
    segments: [31, 36], formation: '4-3-3',
    trait: { name: 'Presión tras pérdida', text: 'Su presión mete Malos Pases en tu mazo de robo.' },
    kit: { primary: '#fbc02d', secondary: '#263238', pattern: 'aros', crest: 'estandarte', emblem: 15 },
    ai: {
      moves: {
        presion: mv('Presión total', at(6), pres('Añade 2 Malos Pases a tu robo', [giveCard('est.mal_pase', 'draw', 2)])),
        tiro: mv('Tiro tras robo', oc(13)),
        directo: mv('Juego directo', at(10)),
      },
      opening: ['presion'],
      pick: [{ move: 'presion', w: 3 }, { move: 'tiro', w: 4 }, { move: 'directo', w: 3 }],
    },
  },
  {
    id: 'r2.puerto', name: 'Unión Puerto', short: 'UPT', act: 2, tier: 'liga',
    segments: [32, 38], formation: '4-4-2',
    trait: { name: 'Marrulleros', text: 'Pierden tiempo cuando ganan y reparten leña.' },
    kit: { primary: '#283593', secondary: '#ff7043', pattern: 'mitades', crest: 'escudo', emblem: 16 },
    ai: {
      moves: {
        ocasion: mv('Llegada', oc(13)),
        lena: mv('Leña', at(11), buff('Ve la amarilla', [toSelf('amarilla', 1)])),
        tiempo: mv('Perder tiempo', rep(12)),
      },
      pick: [
        { move: 'ocasion', w: 4 },
        { move: 'lena', w: 4 },
        { move: 'tiempo', w: 1 },
        { move: 'tiempo', w: 6, when: { k: 'scoreDiff', op: '>', n: 0 } },
      ],
    },
  },
  {
    id: 'r2.alcornoque', name: 'CD Alcornoque', short: 'CDA', act: 2, tier: 'liga',
    segments: [31, 38], formation: '4-4-2',
    trait: { name: 'Juego aéreo', text: 'Cada tres turnos cuelgan un balón letal al área.' },
    kit: { primary: '#33691e', secondary: '#d7ccc8', pattern: 'chevron', crest: 'circulo', emblem: 17 },
    ai: {
      moves: {
        balon: mv('Balón largo', at(9)),
        segunda: mv('Segunda jugada', rep(6), at(6)),
        remate: mv('Centro al área', oc(16)),
      },
      opening: ['balon', 'segunda', 'remate', 'balon', 'segunda', 'remate', 'balon', 'segunda', 'remate', 'balon', 'segunda', 'remate'],
      pick: [{ move: 'balon', w: 1 }],
    },
  },

  // ───────── Copa ─────────
  {
    id: 'r2.ciudadela', name: 'Real Club Ciudadela', short: 'RCC', act: 2, tier: 'copa', meta: 3,
    segments: [35, 40, 44], formation: '5-3-2',
    trait: { name: 'Portero imbatible', text: 'Al inicio de cada turno tuyo, el rival gana 6 de Repliegue.' },
    hooks: [{ on: 'turnStart', ops: [B(6)] }],
    kit: { primary: '#37474f', secondary: '#80deea', pattern: 'cuartos', crest: 'escudo', emblem: 18 },
    ai: {
      moves: {
        contra: mv('Contragolpe', oc(14)),
        choque: mv('Choque', at(11)),
        pared: mv('Pared', oc(10), at(6)),
      },
      pick: [{ move: 'contra', w: 3 }, { move: 'choque', w: 4 }, { move: 'pared', w: 3 }],
    },
  },
  {
    id: 'r2.volcan', name: 'Atlético Volcán', short: 'ATV', act: 2, tier: 'copa', meta: 3,
    segments: [36, 40, 44], formation: '3-4-3',
    trait: { name: 'Erupción', text: 'Ráfagas que te dejan Desorganizado.' },
    kit: { primary: '#bf360c', secondary: '#212121', pattern: 'banda', crest: 'rombo', emblem: 19 },
    ai: {
      moves: {
        rafaga: mv('Ráfaga', at(5, 3)),
        caos: mv('Caos', at(6), pres('Quedas Desorganizado', [toPlayer('desorganizado', 1)])),
        disparo: mv('Disparo a la escuadra', oc(14)),
      },
      opening: ['caos'],
      pick: [{ move: 'rafaga', w: 4 }, { move: 'caos', w: 2 }, { move: 'disparo', w: 4 }],
    },
  },
  {
    id: 'r2.laberinto', name: 'CF Laberinto', short: 'CFL', act: 2, tier: 'copa', meta: 3,
    segments: [35, 39, 43], formation: '4-3-3',
    trait: { name: 'Posesión eterna', text: 'Mientras tocan, ganan Confianza; luego te castigan.' },
    kit: { primary: '#4527a0', secondary: '#b2ff59', pattern: 'finas', crest: 'circulo', emblem: 20 },
    ai: {
      moves: {
        toque: mv('Toque', rep(9), buff('Gana 1 de Confianza', [toSelf('confianza', 1)])),
        llegada: mv('Llegada', oc(13)),
        disparo: mv('Disparo', at(10)),
      },
      opening: ['toque', 'llegada'],
      pick: [{ move: 'toque', w: 3 }, { move: 'llegada', w: 4 }, { move: 'disparo', w: 3 }],
    },
  },

  // ───────── Finales: El Clásico ─────────
  {
    id: 'r2.athletic', name: 'Athletic Club', short: 'ATH', act: 2, tier: 'final', meta: 3, crest: 'athletic',
    segments: [40, 46, 49], formation: '4-4-2',
    trait: { name: 'La Catedral', text: 'Bloque rocoso que se vuelve feroz en el tramo final.' },
    kit: { primary: '#d4202c', secondary: '#ffffff', pattern: 'rayas', crest: 'escudo', emblem: 0 },
    ai: {
      moves: {
        muro: mv('Muro rojiblanco', rep(12), at(5)),
        cabezazo: mv('Cabezazo', oc(14)),
        garra: mv('Garra', at(8, 2)),
      },
      opening: ['muro'],
      pick: [{ move: 'muro', w: 3 }, { move: 'cabezazo', w: 4 }, { move: 'garra', w: 3 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Corazón de León', onEnter: [toSelf('solidez', 2)],
        ai: {
          moves: {
            cabezazo: mv('Cabezazo', oc(15)),
            garra: mv('Garra', at(9, 2)),
            presion: mv('Presión rojiblanca', at(7), pres('Quedas con Fatiga', [toPlayer('fatiga', 1)])),
          },
          pick: [{ move: 'cabezazo', w: 4 }, { move: 'garra', w: 4 }, { move: 'presion', w: 2 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'Nunca se rinden', onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            todo: mv('Todo al área', oc(16), at(5)),
            garra: mv('Garra final', at(10, 2)),
          },
          pick: [{ move: 'todo', w: 6 }, { move: 'garra', w: 4 }],
        },
      },
    ],
  },
  {
    id: 'r2.barcelona', name: 'FC Barcelona', short: 'FCB', act: 2, tier: 'final', meta: 3, crest: 'barcelona',
    segments: [39, 44, 49], formation: '4-3-3',
    trait: { name: 'Tiki-taka', text: 'Te quitan el balón: ganan Confianza mientras tocan y te meten Malos Pases.' },
    kit: { primary: '#a50044', secondary: '#004d98', pattern: 'rayas', crest: 'escudo', emblem: 0 },
    ai: {
      moves: {
        rondo: mv('Rondo', rep(10), buff('Gana 1 de Confianza', [toSelf('confianza', 1)])),
        filtrado: mv('Pase filtrado', oc(14)),
        presion: mv('Presión tras pérdida', at(6), pres('Añade 1 Mal Pase a tu mano', [giveCard('est.mal_pase', 'hand')])),
      },
      opening: ['rondo'],
      pick: [{ move: 'rondo', w: 3 }, { move: 'filtrado', w: 4 }, { move: 'presion', w: 3 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Juego de posición',
        ai: {
          moves: {
            triangulo: mv('Triangulación', oc(15)),
            rondo: mv('Rondo', rep(10), buff('Gana 1 de Confianza', [toSelf('confianza', 1)])),
            remate: mv('Remate', at(12)),
          },
          pick: [{ move: 'triangulo', w: 4 }, { move: 'rondo', w: 3 }, { move: 'remate', w: 3 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'Asedio azulgrana', onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            asedio: mv('Asedio', oc(16), at(5)),
            presion: mv('Presión asfixiante', at(8), pres('Añade 1 Mal Pase a tu mano', [giveCard('est.mal_pase', 'hand')])),
          },
          pick: [{ move: 'asedio', w: 6 }, { move: 'presion', w: 4 }],
        },
      },
    ],
  },
  {
    id: 'r2.madrid', name: 'Real Madrid', short: 'RMA', act: 2, tier: 'final', meta: 3, crest: 'madrid',
    segments: [40, 46, 49], formation: '4-3-3',
    trait: { name: 'Remontada', text: 'Cada gol que encaja le hace más peligroso. Nunca lo des por muerto.' },
    kit: { primary: '#f4f4f4', secondary: '#1b2a63', pattern: 'liso', crest: 'escudo', emblem: 0 },
    ai: {
      moves: {
        contra: mv('Contra blanca', oc(14)),
        galope: mv('Galope', at(11)),
        pausa: mv('Pausa', rep(10), at(4)),
      },
      pick: [{ move: 'contra', w: 4 }, { move: 'galope', w: 4 }, { move: 'pausa', w: 2 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Noche europea', onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            contra: mv('Contra letal', oc(15)),
            galope: mv('Galope', at(12)),
          },
          pick: [{ move: 'contra', w: 5 }, { move: 'galope', w: 5 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'Hasta el final', onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            todo: mv('Minuto 90', oc(17), at(6)),
            galope: mv('Galope final', at(8, 2)),
          },
          pick: [{ move: 'todo', w: 6 }, { move: 'galope', w: 4 }],
        },
      },
    ],
  },
]
