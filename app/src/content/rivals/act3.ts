import type { RivalDef } from '../../engine/model/types'
import { at, buff, giveCard, mv, oc, pres, rep, toPlayer, toSelf } from './helpers'
import { B } from '../dsl'

export const ACT3_RIVALS: RivalDef[] = [
  // ───────── Liga de campeones: fase de grupos ─────────
  {
    id: 'r3.riviera', name: 'Olympique Riviera', short: 'OLR', act: 3, tier: 'liga', easy: true,
    segments: [36, 41], formation: '4-2-3-1',
    trait: { name: 'Glamour', text: 'Técnicos pero blandos: atacan bien, defienden poco.' },
    kit: { primary: '#0277bd', secondary: '#ffffff', pattern: 'banda', crest: 'escudo', emblem: 21 },
    ai: {
      moves: {
        filigrana: mv('Filigrana', oc(15)),
        disparo: mv('Disparo', at(12)),
        triangulo: mv('Triangulación', at(6, 2)),
      },
      pick: [{ move: 'filigrana', w: 4 }, { move: 'disparo', w: 4 }, { move: 'triangulo', w: 3 }],
    },
  },
  {
    id: 'r3.fiordo', name: 'FC Fiordo', short: 'FCF', act: 3, tier: 'liga', easy: true,
    segments: [38, 42], formation: '4-4-2',
    trait: { name: 'Frío nórdico', text: 'Su ritmo te deja con Fatiga.' },
    kit: { primary: '#e3f2fd', secondary: '#0d47a1', pattern: 'aros', crest: 'circulo', emblem: 22 },
    ai: {
      moves: {
        frio: mv('Ritmo gélido', at(8), pres('Quedas con Fatiga', [toPlayer('fatiga', 1)])),
        cabezazo: mv('Cabezazo', oc(15)),
        bloque: mv('Bloque', rep(12), at(5)),
      },
      pick: [{ move: 'frio', w: 3 }, { move: 'cabezazo', w: 4 }, { move: 'bloque', w: 3 }],
    },
  },
  {
    id: 'r3.estepa', name: 'Dinamo Estepa', short: 'DES', act: 3, tier: 'liga',
    segments: [40, 44], formation: '5-3-2', startRepliegue: 10,
    trait: { name: 'Muro del este', text: 'Empiezan con 10 de Repliegue y se encierran con Solidez.' },
    kit: { primary: '#1a237e', secondary: '#ffffff', pattern: 'rayas', crest: 'estandarte', emblem: 23 },
    ai: {
      moves: {
        muro: mv('Muro', rep(15), buff('Gana 1 de Solidez', [toSelf('solidez', 1)])),
        contra: mv('Contra', oc(16)),
        golpe: mv('Golpe', at(13)),
      },
      pick: [{ move: 'muro', w: 3 }, { move: 'contra', w: 4 }, { move: 'golpe', w: 3 }],
    },
  },
  {
    id: 'r3.danubio', name: 'Rapid Danubio', short: 'RDA', act: 3, tier: 'liga',
    segments: [39, 44], formation: '4-3-3',
    trait: { name: 'Vértigo', text: 'Ataques múltiples que te dejan Desorganizado.' },
    kit: { primary: '#2e7d32', secondary: '#ffffff', pattern: 'mitades', crest: 'escudo', emblem: 24 },
    ai: {
      moves: {
        vertigo: mv('Vértigo', at(6, 3)),
        lio: mv('Lío en el área', at(7), pres('Quedas Desorganizado', [toPlayer('desorganizado', 1)])),
        chut: mv('Chut', oc(16)),
      },
      pick: [{ move: 'vertigo', w: 4 }, { move: 'lio', w: 2 }, { move: 'chut', w: 4 }],
    },
  },
  {
    id: 'r3.laguna', name: 'Real Laguna', short: 'RLA', act: 3, tier: 'liga',
    segments: [39, 45], formation: '4-4-2',
    trait: { name: 'Calidad de Champions', text: 'Mezclan Ocasión y Ataque en la misma jugada.' },
    kit: { primary: '#004d40', secondary: '#ffd740', pattern: 'chevron', crest: 'rombo', emblem: 25 },
    ai: {
      moves: {
        combo: mv('Jugada ensayada', oc(12), at(6)),
        disparo: mv('Disparo', at(13)),
        pausa: mv('Pausa', rep(12), at(5)),
      },
      pick: [{ move: 'combo', w: 4 }, { move: 'disparo', w: 4 }, { move: 'pausa', w: 2 }],
    },
  },
  {
    id: 'r3.polder', name: 'Polder United', short: 'PUN', act: 3, tier: 'liga',
    segments: [39, 44], formation: '4-3-3',
    trait: { name: 'Fútbol total', text: 'Presionan, tocan y te llenan el mazo de Malos Pases.' },
    kit: { primary: '#ff6d00', secondary: '#ffffff', pattern: 'liso', crest: 'circulo', emblem: 26 },
    ai: {
      moves: {
        presion: mv('Presión total', at(8), pres('Añade 2 Malos Pases a tu robo', [giveCard('est.mal_pase', 'draw', 2)])),
        toque: mv('Toque', rep(10), buff('Gana 1 de Confianza', [toSelf('confianza', 1)])),
        llegada: mv('Llegada', oc(16)),
      },
      pick: [{ move: 'presion', w: 3 }, { move: 'toque', w: 3 }, { move: 'llegada', w: 4 }],
    },
  },

  // ───────── Copa (eliminatorias) ─────────
  {
    id: 'r3.kaiser', name: 'Kaiser FC', short: 'KFC', act: 3, tier: 'copa', meta: 3,
    segments: [44, 49, 54], formation: '4-2-3-1',
    trait: { name: 'Máquina alemana', text: 'Portero enorme (+8 de Repliegue cada turno tuyo) y ataques implacables.' },
    hooks: [{ on: 'turnStart', ops: [B(8)] }],
    kit: { primary: '#c62828', secondary: '#ffffff', pattern: 'liso', crest: 'escudo', emblem: 27 },
    ai: {
      moves: {
        maquina: mv('Máquina', at(14)),
        tiro: mv('Tiro colocado', oc(17)),
        doble: mv('Doble amenaza', oc(12), at(7)),
      },
      pick: [{ move: 'maquina', w: 4 }, { move: 'tiro', w: 3 }, { move: 'doble', w: 3 }],
    },
  },
  {
    id: 'r3.cerrojo', name: 'Calcio Cerrojo', short: 'CCE', act: 3, tier: 'copa', meta: 3,
    segments: [42, 48, 52], formation: '5-3-2', startRepliegue: 12,
    trait: { name: 'Catenaccio', text: 'Se encierran con mucha Solidez y matan a la contra.' },
    kit: { primary: '#1565c0', secondary: '#000000', pattern: 'finas', crest: 'escudo', emblem: 28 },
    rivalStatuses: [{ id: 'solidez', n: 2 }],
    ai: {
      moves: {
        cerrojo: mv('Cerrojo', rep(16)),
        contra: mv('Contra mortal', oc(18)),
        falta: mv('Falta táctica', at(9), buff('Ve la amarilla', [toSelf('amarilla', 1)])),
      },
      pick: [{ move: 'cerrojo', w: 3 }, { move: 'contra', w: 4 }, { move: 'falta', w: 3 }],
    },
  },
  {
    id: 'r3.tamesis', name: 'Gigantes del Támesis', short: 'GDT', act: 3, tier: 'copa', meta: 3,
    segments: [44, 50, 54], formation: '4-4-2',
    trait: { name: 'Intensidad inglesa', text: 'Ráfagas de golpes y balones al área.' },
    kit: { primary: '#311b92', secondary: '#e0e0e0', pattern: 'cuartos', crest: 'rombo', emblem: 29 },
    ai: {
      moves: {
        rafaga: mv('Ráfaga', at(6, 3)),
        centro: mv('Centro', oc(17)),
        presion: mv('Presión', at(9), pres('Añade 1 Calambre a tu robo', [giveCard('est.calambre', 'draw')])),
      },
      pick: [{ move: 'rafaga', w: 4 }, { move: 'centro', w: 4 }, { move: 'presion', w: 2 }],
    },
  },

  // ───────── Finales ─────────
  {
    id: 'r3.rey_continente', name: 'Rey del Continente', short: 'RDC', act: 3, tier: 'final', meta: 3,
    segments: [50, 56, 62], formation: '4-3-3',
    trait: { name: 'Gigante de Europa', text: 'Tres fases. Cada gol que encaja despierta a la bestia.' },
    kit: { primary: '#ffffff', secondary: '#d4af37', pattern: 'banda', crest: 'escudo', emblem: 30 },
    ai: {
      moves: {
        control: mv('Control', rep(14), at(6)),
        golpe: mv('Golpe de autoridad', at(15)),
        ocasion: mv('Ocasión clara', oc(17)),
      },
      opening: ['control'],
      pick: [{ move: 'control', w: 3 }, { move: 'golpe', w: 3 }, { move: 'ocasion', w: 4 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Orgullo herido', onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            asedio: mv('Asedio', oc(18)),
            combo: mv('Combinación', oc(13), at(7)),
            golpe: mv('Golpe', at(9, 2)),
          },
          pick: [{ move: 'asedio', w: 4 }, { move: 'combo', w: 3 }, { move: 'golpe', w: 3 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'Noche de leyenda', onEnter: [toSelf('confianza', 2), toSelf('solidez', 2)],
        ai: {
          moves: {
            final: mv('A por la Copa', oc(20), at(6)),
            rafaga: mv('Ráfaga', at(7, 3)),
            presion: mv('Presión final', at(10), pres('Quedas Desorganizado', [toPlayer('desorganizado', 1)])),
          },
          pick: [{ move: 'final', w: 5 }, { move: 'rafaga', w: 3 }, { move: 'presion', w: 2 }],
        },
      },
    ],
  },
  {
    id: 'r3.imperial', name: 'Dinamo Imperial', short: 'DIM', act: 3, tier: 'final', meta: 3,
    segments: [52, 58, 62], formation: '3-5-2',
    trait: { name: 'Imperio', text: 'Te desgasta con estados y castiga cualquier descuido.' },
    kit: { primary: '#4a148c', secondary: '#ffd600', pattern: 'chevron', crest: 'estandarte', emblem: 31 },
    ai: {
      moves: {
        desgaste: mv('Desgaste', at(8), pres('Quedas con Fatiga y añade Cansancio', [toPlayer('fatiga', 1), giveCard('est.cansancio', 'draw')])),
        ocasion: mv('Ocasión', oc(17)),
        muro: mv('Muro imperial', rep(14), buff('Gana 1 de Solidez', [toSelf('solidez', 1)])),
      },
      opening: ['desgaste'],
      pick: [{ move: 'desgaste', w: 3 }, { move: 'ocasion', w: 4 }, { move: 'muro', w: 3 }],
    },
    phases: [
      {
        atGoalsConceded: 1, name: 'Contraofensiva', onEnter: [toSelf('confianza', 2)],
        ai: {
          moves: {
            ocasion: mv('Ocasión', oc(18)),
            golpe: mv('Golpe', at(14)),
            caos: mv('Caos', at(8), pres('Quedas Desconcentrado', [toPlayer('desconcentrado', 2)])),
          },
          pick: [{ move: 'ocasion', w: 4 }, { move: 'golpe', w: 4 }, { move: 'caos', w: 2 }],
        },
      },
      {
        atGoalsConceded: 2, name: 'Todo o nada', onEnter: [toSelf('confianza', 3)],
        ai: {
          moves: {
            final: mv('Ataque final', oc(20), at(7)),
            rafaga: mv('Ráfaga', at(7, 3)),
          },
          pick: [{ move: 'final', w: 6 }, { move: 'rafaga', w: 4 }],
        },
      },
    ],
  },
]
