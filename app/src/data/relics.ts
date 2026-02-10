import type { Relic, TeamType } from '@/types/game';

// RELIQUIAS INICIALES POR EQUIPO
export const starterRelics: Record<string, Relic> = {
  athletic: {
    id: 'sangre_leon',
    name: 'Sangre de Leon',
    description: 'Al final de cada partido, cura 6 HP.',
    rarity: 'common',
    team: 'athletic',
    effect: { type: 'heal_after_combat', value: 6, target: 'self' },
  },
  barcelona: {
    id: 'la_masia',
    name: 'La Masia',
    description: 'Al inicio de cada partido, roba 2 cartas adicionales.',
    rarity: 'common',
    team: 'barcelona',
    effect: { type: 'draw_start', value: 2, target: 'self' },
  },
  madrid: {
    id: 'decimocuarta',
    name: 'Decimocuarta',
    description: 'Al inicio de cada partido, inflige 3 de dano a todos los enemigos.',
    rarity: 'common',
    team: 'madrid',
    effect: { type: 'damage_start', value: 3, target: 'all_enemies' },
  },
};

// RELIQUIAS COMUNES
export const commonRelics: Relic[] = [
  {
    id: 'botas_oro',
    name: 'Botas de Oro',
    description: 'Gana 1 de Fuerza al inicio de cada partido.',
    rarity: 'common',
    effect: { type: 'strength_start', value: 1, target: 'self' },
  },
  {
    id: 'guante_plata',
    name: 'Guante de Plata',
    description: 'Gana 1 de Destreza al inicio de cada partido.',
    rarity: 'common',
    effect: { type: 'dexterity_start', value: 1, target: 'self' },
  },
  {
    id: 'balon_oficial',
    name: 'Balon Oficial',
    description: 'Gana 1 energia el primer turno de cada partido.',
    rarity: 'common',
    effect: { type: 'energy_first_turn', value: 1, target: 'self' },
  },
  {
    id: 'venda_magica',
    name: 'Venda Magica',
    description: 'Al final de cada partido, cura 2 HP.',
    rarity: 'common',
    effect: { type: 'heal_after_combat', value: 2, target: 'self' },
  },
  {
    id: 'pito_arbitro',
    name: 'Pito del Arbitro',
    description: 'Aplica 1 Vulnerable a TODOS los enemigos al inicio.',
    rarity: 'common',
    effect: { type: 'vulnerable_all_start', value: 1, target: 'all_enemies' },
  },
  {
    id: 'botella_agua',
    name: 'Botella de Agua',
    description: 'Al entrar en Hotel, empieza el siguiente partido con 2 energia.',
    rarity: 'common',
    effect: { type: 'energy_after_rest', value: 2, target: 'self' },
  },
  {
    id: 'espinilleras',
    name: 'Espinilleras',
    description: 'Al inicio de cada partido, gana 3 Espinas.',
    rarity: 'common',
    effect: { type: 'thorns_start', value: 3, target: 'self' },
  },
  {
    id: 'silbato_electronico',
    name: 'Silbato Electronico',
    description: 'Inicio combate: aplica 1 Debil a todos los enemigos.',
    rarity: 'common',
    effect: { type: 'weak_all', value: 1, target: 'all_enemies' },
  },
  {
    id: 'chaleco_gps',
    name: 'Chaleco GPS',
    description: 'La primera carta de bloqueo de cada combate gana +4 bloqueo.',
    rarity: 'common',
    effect: { type: 'first_block_combat_bonus', value: 4, target: 'self' },
  },
  {
    id: 'microfono_vestuario',
    name: 'Microfono de Vestuario',
    description: 'En el primer turno de cada combate, roba 1 carta adicional.',
    rarity: 'common',
    effect: { type: 'draw_start', value: 1, target: 'self' },
  },
];

// RELIQUIAS POCO COMUNES
export const uncommonRelics: Relic[] = [
  {
    id: 'medalla_campeon',
    name: 'Medalla de Campeon',
    description: 'Cada 3 turnos, gana 1 energia.',
    rarity: 'uncommon',
    effect: { type: 'energy_every_3_turns', value: 1, target: 'self' },
  },
  {
    id: 'cinta_capitan',
    name: 'Cinta de Capitan',
    description: 'Si no juegas ataques durante tu turno, gana 1 energia el siguiente turno.',
    rarity: 'uncommon',
    effect: { type: 'energy_next_if_no_attack', value: 1, target: 'self' },
  },
  {
    id: 'penalti',
    name: 'Penalti',
    description: 'Cada 10 ataque inflige dano doble.',
    rarity: 'uncommon',
    effect: { type: 'double_damage_every_10', value: 1, target: 'self' },
  },
  {
    id: 'tarjeta_roja',
    name: 'Tarjeta Roja',
    description: 'Al inicio de cada partido, aplica 2 Debil al enemigo mas fuerte.',
    rarity: 'uncommon',
    effect: { type: 'weak_strongest', value: 2, target: 'enemy' },
  },
  {
    id: 'txapela_hierro',
    name: 'Txapela de Hierro',
    description: 'La primera carta de bloqueo de cada turno gana +3 bloqueo.',
    rarity: 'uncommon',
    team: 'athletic',
    effect: { type: 'first_block_turn_bonus', value: 3, target: 'self' },
  },
  {
    id: 'adn_blaugrana',
    name: 'ADN Blaugrana',
    description: 'Empiezas cada combate con 2 Posesion.',
    rarity: 'uncommon',
    team: 'barcelona',
    effect: { type: 'posesion_start', value: 2, target: 'self' },
  },
  {
    id: 'noche_champions',
    name: 'Noche de Champions',
    description: 'La primera vez por combate que bajas de 50% HP, ganas 2 Fuerza.',
    rarity: 'uncommon',
    team: 'madrid',
    effect: { type: 'bloodied_strength_once', value: 2, target: 'self' },
  },
  {
    id: 'rutina_invisible',
    name: 'Rutina Invisible',
    description: 'Al jugar 3 skills en un turno, gana 1 energia.',
    rarity: 'uncommon',
    effect: { type: 'energy_every_3_skills', value: 1, target: 'self' },
  },
];

// RELIQUIAS RARAS
export const rareRelics: Relic[] = [
  {
    id: 'copa_europa',
    name: 'Copa de Europa',
    description: 'La energia se conserva entre turnos.',
    rarity: 'rare',
    effect: { type: 'conserve_energy', value: 1, target: 'self' },
  },
  {
    id: 'bota_oro_historica',
    name: 'Bota de Oro Historica',
    description: 'Cada 10 ataque inflige dano doble.',
    rarity: 'rare',
    effect: { type: 'double_damage_every_10', value: 1, target: 'self' },
  },
  {
    id: 'leyenda_club',
    name: 'Leyenda del Club',
    description: 'Al agotar una carta, anade una carta aleatoria a tu mano.',
    rarity: 'rare',
    effect: { type: 'card_on_exhaust', value: 1, target: 'self' },
  },
  {
    id: 'balon_oro',
    name: 'Balon de Oro',
    description: 'Gana 2 de Fuerza y 2 de Destreza al inicio de cada partido.',
    rarity: 'rare',
    effect: { type: 'strength_dexterity', value: 2, target: 'self' },
  },
  {
    id: 'plan_lezama',
    name: 'Plan de Lezama',
    description: 'La primera carta agotada por turno te hace robar 1 carta.',
    rarity: 'rare',
    team: 'athletic',
    effect: { type: 'first_exhaust_draw', value: 1, target: 'self' },
  },
  {
    id: 'pizarra_mister',
    name: 'Pizarra del Mister',
    description: 'Al jugar 3 skills en un turno, gana 1 energia.',
    rarity: 'rare',
    team: 'barcelona',
    effect: { type: 'energy_every_3_skills', value: 1, target: 'self' },
  },
  {
    id: 'banda_derecha',
    name: 'Banda Derecha',
    description: 'El primer ataque tras una skill cada turno gana +5 dano.',
    rarity: 'rare',
    team: 'madrid',
    effect: { type: 'first_attack_after_skill_bonus', value: 5, target: 'self' },
  },
];

// RELIQUIAS DE JEFE
export const bossRelics: Relic[] = [
  {
    id: 'ascenso_directo',
    name: 'Ascenso Directo',
    description: 'Gana 1 energia al inicio de cada turno. En recompensas de cartas, tienes 2 opciones menos.',
    rarity: 'boss',
    effect: { type: 'energy_per_turn', value: 1, target: 'self' },
  },
  {
    id: 'titulo_liga',
    name: 'Titulo de Liga',
    description: 'Gana 1 energia al inicio de cada turno. No puedes descansar en Hoteles.',
    rarity: 'boss',
    effect: { type: 'energy_per_turn', value: 1, target: 'self' },
  },
  {
    id: 'champions_league',
    name: 'Champions League',
    description: 'Transforma todos los Golpeos y Coberturas en cartas mejoradas.',
    rarity: 'boss',
    effect: { type: 'upgrade_basic', value: 1, target: 'self' },
  },
  {
    id: 'catedral_rojiblanca',
    name: 'Catedral Rojiblanca',
    description: 'Gana 1 energia por turno. Inicio combate: +2 Garra. Pierdes 1 slot de pocion.',
    rarity: 'boss',
    team: 'athletic',
    effect: { type: 'energy_per_turn', value: 1, target: 'self' },
  },
  {
    id: 'control_montjuic',
    name: 'Control de Montjuic',
    description: 'Mejora el umbral de Posesion. Recompensas de carta con 1 opcion menos.',
    rarity: 'boss',
    team: 'barcelona',
    effect: { type: 'posesion_threshold_plus', value: 1, target: 'self' },
  },
  {
    id: 'gen_remontada',
    name: 'Gen de Remontada',
    description: 'Cuando ganas Momentum, ganas +1 adicional (max 2 extra por combate). Empiezas con 1 Debil.',
    rarity: 'boss',
    team: 'madrid',
    effect: { type: 'momentum_gain_plus', value: 1, target: 'self' },
  },
  {
    id: 'temporada_perfecta',
    name: 'Temporada Perfecta',
    description: 'Gana 1 energia por turno. Recompensas de carta con 1 opcion menos.',
    rarity: 'boss',
    effect: { type: 'energy_per_turn', value: 1, target: 'self' },
  },
  {
    id: 'gestion_total',
    name: 'Gestion Total',
    description: 'Gana 1 energia por turno. No puedes comprar pociones.',
    rarity: 'boss',
    effect: { type: 'energy_per_turn', value: 1, target: 'self' },
  },
  {
    id: 'apuesta_ofensiva',
    name: 'Apuesta Ofensiva',
    description: 'Gana 1 energia por turno. Empiezas cada combate con 1 Debil.',
    rarity: 'boss',
    effect: { type: 'weak_self_start', value: 1, target: 'self' },
  },
  {
    id: 'adn_ganador',
    name: 'ADN Ganador',
    description: 'Gana 1 energia por turno. Pierdes 10 HP maximo.',
    rarity: 'boss',
    effect: { type: 'energy_per_turn', value: 1, target: 'self' },
  },
];

// Todas las reliquias
export const allRelics: Relic[] = [
  ...commonRelics,
  ...uncommonRelics,
  ...rareRelics,
  ...bossRelics,
];

function filterRelicsByTeam(pool: Relic[], team?: TeamType): Relic[] {
  if (!team) return pool;
  return pool.filter(relic => !relic.team || relic.team === team);
}

export function getRandomRelic(
  rarity?: 'common' | 'uncommon' | 'rare' | 'boss',
  includeBoss: boolean = false,
  team?: TeamType,
  exclude: string[] = []
): Relic {
  let pool = allRelics;
  if (rarity) {
    pool = allRelics.filter(r => r.rarity === rarity);
  } else if (!includeBoss) {
    pool = allRelics.filter(r => r.rarity !== 'boss');
  }

  pool = filterRelicsByTeam(pool, team).filter(relic => !exclude.some(id => id.startsWith(relic.id)));
  if (pool.length === 0) {
    pool = filterRelicsByTeam(allRelics.filter(r => r.rarity !== 'boss'), team);
  }

  const selectedRelic = pool[Math.floor(Math.random() * pool.length)];
  return { ...selectedRelic, id: `${selectedRelic.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
}

export function getRandomRelicsForShop(team: TeamType, existing: string[], count: number): Relic[] {
  const pool = filterRelicsByTeam(allRelics.filter(r => r.rarity !== 'boss'), team)
    .filter(relic => !existing.some(id => id.startsWith(relic.id)));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).map(relic => ({
    ...relic,
    id: `${relic.id}_shop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }));
}

export function getRandomBossRelics(count: number, exclude: string[] = [], team?: TeamType): Relic[] {
  const pool = filterRelicsByTeam(bossRelics, team).filter(relic => !exclude.some(id => id.startsWith(relic.id)));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).map(relic => ({
    ...relic,
    id: `${relic.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }));
}
