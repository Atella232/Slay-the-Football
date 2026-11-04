import type { TrofeoDef } from '../../engine/model/types'
import { B, CUSTOM, D, E, HEAL, RIVAL, SELF, formaBelow, playedAtLeast } from '../dsl'

const copaOFinal = { k: 'or' as const, c: [{ k: 'tier' as const, is: 'copa' as const }, { k: 'tier' as const, is: 'final' as const }] }

export const NEUTRAL_TROFEOS: TrofeoDef[] = [
  // ── Comunes ──
  { id: 'tro.botas_oro', name: 'Botas Doradas', tier: 'comun', icon: 'bota', text: 'Empiezas cada partido con 1 de Confianza.', hooks: [{ on: 'matchStart', ops: [SELF('confianza', 1)] }] },
  { id: 'tro.espinilleras', name: 'Espinilleras', tier: 'comun', icon: 'espinillera', text: 'Empiezas cada partido con 1 de Solidez.', hooks: [{ on: 'matchStart', ops: [SELF('solidez', 1)] }] },
  { id: 'tro.balon_oficial', name: 'Balón Oficial', tier: 'comun', icon: 'balon', text: 'Ganas 1 de Energía extra en el primer turno de cada partido.', mods: [{ stat: 'firstTurnEnergy', add: 1 }] },
  { id: 'tro.venda', name: 'Venda Elástica', tier: 'comun', icon: 'venda', text: 'Al ganar un partido, recuperas 3 de Forma.', runMods: [{ stat: 'healAfterWin', n: 3 }] },
  { id: 'tro.silbato', name: 'Silbato de Plata', tier: 'comun', icon: 'silbato', text: 'Al empezar cada partido, el rival queda con Fatiga 1.', hooks: [{ on: 'matchStart', ops: [RIVAL('fatiga', 1)] }] },
  { id: 'tro.chaleco_gps', name: 'Chaleco GPS', tier: 'comun', icon: 'chaleco', text: 'La primera vez que ganas Bloqueo en cada partido, ganas 5 más.', hooks: [{ on: 'blockGained', limit: { per: 'match', n: 1 }, ops: [B(5)] }] },
  { id: 'tro.microfono', name: 'Micrófono de Vestuario', tier: 'comun', icon: 'micro', text: 'Robas 1 carta extra en el primer turno de cada partido.', mods: [{ stat: 'firstTurnDraw', add: 1 }] },
  { id: 'tro.bufanda', name: 'Bufanda de la Peña', tier: 'comun', icon: 'bufanda', text: '+8 de Forma máxima.', runMods: [{ stat: 'formaMax', n: 8 }] },
  { id: 'tro.cuaderno', name: 'Cuaderno del Míster', tier: 'comun', icon: 'libreta', text: 'Cada 3 turnos jugados, robas 1 carta extra.', counter: { every: 3, on: 'turnStart', ops: [D(1)] } },
  { id: 'tro.almohada', name: 'Almohada de Viaje', tier: 'comun', icon: 'almohada', text: 'Descansar en la Concentración cura un 10% más.', runMods: [{ stat: 'restHealPct', n: 10 }] },
  { id: 'tro.hucha', name: 'Hucha del Utillero', tier: 'comun', icon: 'hucha', text: 'Ganas un 20% más de oro en los partidos.', runMods: [{ stat: 'goldPct', n: 20 }] },
  { id: 'tro.tacos', name: 'Tacos de Aluminio', tier: 'comun', icon: 'tacos', text: 'Tus Ataques generan +1 de Peligro.', mods: [{ stat: 'peligro', type: 'ataque', add: 1 }] },

  // ── Poco comunes ──
  { id: 'tro.medalla', name: 'Medalla al Mérito', tier: 'poco', icon: 'medalla', text: 'Cada 3 turnos jugados, ganas 1 de Energía.', counter: { every: 3, on: 'turnStart', ops: [E(1)] } },
  { id: 'tro.brazalete', name: 'Brazalete de Capitán', tier: 'poco', icon: 'brazalete', text: 'Si terminas el turno sin jugar Ataques, ganas 1 de Energía el turno siguiente.', hooks: [{ on: 'turnEnd', when: { k: 'played', type: 'ataque', op: '=', n: 0 }, ops: [CUSTOM('energyNext', { n: 1 })] }] },
  { id: 'tro.var', name: 'Monitor del VAR', tier: 'poco', icon: 'monitor', text: 'Cada 3 turnos jugados, el rival queda Desorganizado 1.', counter: { every: 3, on: 'turnStart', ops: [RIVAL('desorganizado', 1)] } },
  { id: 'tro.analista', name: 'Analista de Vídeo', tier: 'poco', icon: 'video', text: 'En partidos de Copa y Final, empiezas con 2 de Solidez.', hooks: [{ on: 'matchStart', when: copaOFinal, ops: [SELF('solidez', 2)] }] },
  { id: 'tro.botin_carbono', name: 'Botín de Carbono', tier: 'poco', icon: 'bota', text: 'Al inicio de cada turno ganas Contragolpe (+3 de Peligro en tu primer Ataque).', hooks: [{ on: 'turnStart', ops: [SELF('contragolpe', 1)] }] },
  { id: 'tro.rutina', name: 'Rutina Invisible', tier: 'poco', icon: 'reloj', text: 'La tercera Táctica que juegues cada turno te da 1 de Energía.', hooks: [{ on: 'cardPlayed', f: { type: 'tactica' }, when: playedAtLeast(3, 'tactica'), limit: { per: 'turn', n: 1 }, ops: [E(1)] }] },
  { id: 'tro.banquillo', name: 'Banquillo Largo', tier: 'poco', icon: 'banquillo', text: '+1 Cambio en cada partido.', mods: [{ stat: 'cambios', add: 1 }] },
  { id: 'tro.nevera', name: 'Nevera Portátil', tier: 'poco', icon: 'nevera', text: '+1 hueco de consumible.', runMods: [{ stat: 'consumibleSlots', n: 1 }] },
  { id: 'tro.amuleto', name: 'Amuleto de la Suerte', tier: 'poco', icon: 'trebol', text: 'Cada vez que encajas un gol, ganas 6 de Bloqueo.', hooks: [{ on: 'goalConceded', ops: [B(6)] }] },
  { id: 'tro.fisio', name: 'Fisioterapeuta', tier: 'poco', icon: 'cruz', text: 'Si empiezas un partido con la Forma al 50% o menos, recuperas 6.', hooks: [{ on: 'matchStart', when: formaBelow(50), ops: [HEAL(6)] }] },

  // ── Raras ──
  { id: 'tro.copa_europa', name: 'Orejona', tier: 'rara', icon: 'copa', text: 'La Energía que no gastes se conserva para el turno siguiente.', hooks: [{ on: 'turnEnd', ops: [CUSTOM('carryEnergy')] }] },
  { id: 'tro.balon_oro', name: 'Balón Dorado', tier: 'rara', icon: 'balon', text: 'Empiezas cada partido con 2 de Confianza y 2 de Solidez.', hooks: [{ on: 'matchStart', ops: [SELF('confianza', 2), SELF('solidez', 2)] }] },
  { id: 'tro.pizarra', name: 'Pizarra Magnética', tier: 'rara', icon: 'pizarra', text: 'Cada vez que barajas tu mazo, robas 2 cartas.', hooks: [{ on: 'shuffle', ops: [D(2)] }] },
  { id: 'tro.leyenda_club', name: 'Placa de Leyenda', tier: 'rara', icon: 'placa', text: 'Cada vez que agotas una carta, ganas 3 de Bloqueo.', hooks: [{ on: 'cardExhausted', ops: [B(3)] }] },
  { id: 'tro.bota_oro', name: 'Bota de Oro', tier: 'rara', icon: 'bota', text: 'Cada 6 Ataques que juegues, ganas 1 de Confianza.', counter: { every: 6, on: 'cardPlayed', f: { type: 'ataque' }, ops: [SELF('confianza', 1)] } },
  { id: 'tro.psicologo', name: 'Psicólogo Deportivo', tier: 'rara', icon: 'cerebro', text: 'Con la Forma al 40% o menos, tus Ataques generan +3 de Peligro.', mods: [{ stat: 'peligro', type: 'ataque', add: 3, when: formaBelow(40) }] },
  { id: 'tro.alto_rendimiento', name: 'Centro de Alto Rendimiento', tier: 'rara', icon: 'pesa', text: 'En la Concentración puedes descansar y entrenar a la vez.', runMods: [{ stat: 'restUpgradeAndHeal', n: 1 }] },
  { id: 'tro.grada', name: 'Grada de Animación', tier: 'rara', icon: 'grada', text: 'Cada vez que marcas un gol, ganas 1 de Energía.', hooks: [{ on: 'goalScored', ops: [E(1)] }] },

  // ── Jefe ──
  { id: 'tro.ascenso', name: 'Ascenso Directo', tier: 'jefe', icon: 'flecha', text: '+1 de Energía por turno. Las recompensas de carta ofrecen 1 opción menos.', mods: [{ stat: 'energyPerTurn', add: 1 }], runMods: [{ stat: 'cardChoices', n: -1 }] },
  { id: 'tro.titulo_liga', name: 'Título de Liga', tier: 'jefe', icon: 'copa', text: '+1 de Energía por turno. Ya no puedes descansar en la Concentración (sí entrenar).', mods: [{ stat: 'energyPerTurn', add: 1 }], runMods: [{ stat: 'noRest', n: 1 }] },
  { id: 'tro.gestion_total', name: 'Gestión Total', tier: 'jefe', icon: 'maletin', text: '+1 de Energía por turno. El Mercado ya no vende consumibles.', mods: [{ stat: 'energyPerTurn', add: 1 }], runMods: [{ stat: 'noConsumibleShop', n: 1 }] },
  { id: 'tro.apuesta', name: 'Apuesta Ofensiva', tier: 'jefe', icon: 'dados', text: '+1 de Energía por turno. Empiezas cada partido con Fatiga 1.', mods: [{ stat: 'energyPerTurn', add: 1 }], hooks: [{ on: 'matchStart', ops: [SELF('fatiga', 1)] }] },
  { id: 'tro.adn_ganador', name: 'ADN Ganador', tier: 'jefe', icon: 'adn', text: '+1 de Energía por turno. −10 de Forma máxima.', mods: [{ stat: 'energyPerTurn', add: 1 }], runMods: [{ stat: 'formaMax', n: -10 }] },
  { id: 'tro.temporada_perfecta', name: 'Temporada Perfecta', tier: 'jefe', icon: 'estrella', text: '+1 de Energía por turno. Los rivales empiezan cada partido con 1 de Confianza.', mods: [{ stat: 'energyPerTurn', add: 1 }], hooks: [{ on: 'matchStart', ops: [RIVAL('confianza', 1)] }] },

  // ── Tienda ──
  { id: 'tro.carnet_socio', name: 'Carnet de Socio', tier: 'tienda', icon: 'carnet', text: 'Todo en el Mercado cuesta un 20% menos.', runMods: [{ stat: 'shopPct', n: -20 }] },
  { id: 'tro.ojeador', name: 'Libreta del Ojeador', tier: 'tienda', icon: 'prismaticos', text: 'Las recompensas de carta ofrecen 1 opción más.', runMods: [{ stat: 'cardChoices', n: 1 }] },
  { id: 'tro.tijeras', name: 'Tijeras del Utillero', tier: 'tienda', icon: 'tijeras', text: 'Eliminar cartas en el Mercado cuesta 50 menos.', runMods: [{ stat: 'removeCostAdd', n: -50 }] },
]
