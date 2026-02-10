import type { Enemy } from '@/types/game';

// ENEMIGOS NORMALES - ACTO 1 (Segunda División)
export const act1Enemies: Enemy[] = [
  {
    id: 'portero_novato',
    name: 'Portero Novato',
    hp: 40,
    maxHp: 40,
    block: 0,
    intent: { type: 'defend', value: 8, description: 'Se prepara para defender' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'defensa_regional',
    name: 'Defensa Regional',
    hp: 50,
    maxHp: 50,
    block: 0,
    intent: { type: 'attack', value: 8, description: 'Va a atacar por 8' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'mediocentro_luchador',
    name: 'Mediocentro Luchador',
    hp: 45,
    maxHp: 45,
    block: 0,
    intent: { type: 'debuff', value: 2, description: 'Va a aplicar 2 Débil' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'delantero_promesa',
    name: 'Delantero Promesa',
    hp: 35,
    maxHp: 35,
    block: 0,
    intent: { type: 'attack', value: 12, description: 'Va a atacar fuerte por 12' },
    buffs: [],
    debuffs: [],
  },
];

// ENEMIGOS NORMALES - ACTO 2 (Primera División)
export const act2Enemies: Enemy[] = [
  {
    id: 'portero_experto',
    name: 'Portero Experto',
    hp: 60,
    maxHp: 60,
    block: 0,
    intent: { type: 'defend', value: 12, description: 'Se prepara para defender fuerte' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'defensa_primera',
    name: 'Defensa de Primera',
    hp: 70,
    maxHp: 70,
    block: 0,
    intent: { type: 'attack', value: 10, description: 'Va a atacar por 10' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'mediapunta',
    name: 'Mediapunta',
    hp: 55,
    maxHp: 55,
    block: 0,
    intent: { type: 'buff', value: 3, description: 'Va a buffearse' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'delantero_goleador',
    name: 'Delantero Goleador',
    hp: 50,
    maxHp: 50,
    block: 0,
    intent: { type: 'attack', value: 15, description: 'Va a atacar crítico por 15' },
    buffs: [],
    debuffs: [],
  },
];

// ENEMIGOS NORMALES - ACTO 3 (Champions)
export const act3Enemies: Enemy[] = [
  {
    id: 'portero_estrella',
    name: 'Portero Estrella',
    hp: 80,
    maxHp: 80,
    block: 0,
    intent: { type: 'defend', value: 15, description: 'Defensa masiva' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'defensa_internacional',
    name: 'Defensa Internacional',
    hp: 90,
    maxHp: 90,
    block: 0,
    intent: { type: 'attack', value: 12, description: 'Ataque fuerte' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'crack_europeo',
    name: 'Crack Europeo',
    hp: 75,
    maxHp: 75,
    block: 0,
    intent: { type: 'buff', value: 5, description: 'Gran buff' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'delantero_leyenda',
    name: 'Delantero Leyenda',
    hp: 70,
    maxHp: 70,
    block: 0,
    intent: { type: 'attack', value: 20, description: 'Ataque devastador' },
    buffs: [],
    debuffs: [],
  },
];

// ENEMIGOS NORMALES - ACTO 4 (Final Europea)
export const act4Enemies: Enemy[] = [
  {
    id: 'muro_continental',
    name: 'Muro Continental',
    hp: 128,
    maxHp: 128,
    block: 0,
    intent: { type: 'defend', value: 24, description: 'Levanta una defensa total' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'motor_europeo',
    name: 'Motor Europeo',
    hp: 116,
    maxHp: 116,
    block: 0,
    intent: { type: 'buff', value: 8, description: 'Aumenta su ritmo de juego' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'killer_de_area',
    name: 'Killer de Area',
    hp: 108,
    maxHp: 108,
    block: 0,
    intent: { type: 'attack', value: 28, description: 'Remate letal' },
    buffs: [],
    debuffs: [],
  },
  {
    id: 'cerebro_tactico',
    name: 'Cerebro Tactico',
    hp: 122,
    maxHp: 122,
    block: 0,
    intent: { type: 'debuff', value: 4, description: 'Aplica presion total' },
    buffs: [],
    debuffs: [],
  },
];

// ÉLITES
export const eliteEnemies: Enemy[] = [
  {
    id: 'portero_titular',
    name: 'Portero Titular',
    hp: 90,
    maxHp: 90,
    block: 0,
    intent: { type: 'defend', value: 15, description: 'Defensa élite' },
    buffs: [],
    debuffs: [],
    isElite: true,
  },
  {
    id: 'capitan_equipo',
    name: 'Capitán del Equipo',
    hp: 100,
    maxHp: 100,
    block: 0,
    intent: { type: 'buff', value: 5, description: 'Buff a aliados' },
    buffs: [],
    debuffs: [],
    isElite: true,
  },
  {
    id: 'goleador_natural',
    name: 'Goleador Natural',
    hp: 80,
    maxHp: 80,
    block: 0,
    intent: { type: 'attack', value: 18, description: 'Ataque crítico' },
    buffs: [],
    debuffs: [],
    isElite: true,
  },
];

// JEFES
export const bossEnemies: Enemy[] = [
  {
    id: 'campeon_segunda',
    name: 'Campeón de Segunda',
    hp: 150,
    maxHp: 150,
    block: 0,
    intent: { type: 'attack', value: 15, description: 'Ataque de campeón' },
    buffs: [],
    debuffs: [],
    isBoss: true,
  },
  {
    id: 'lider_primera',
    name: 'Líder de Primera',
    hp: 200,
    maxHp: 200,
    block: 0,
    intent: { type: 'buff', value: 8, description: 'Invoca refuerzos' },
    buffs: [],
    debuffs: [],
    isBoss: true,
  },
  {
    id: 'campeon_europa',
    name: 'Campeón de Europa',
    hp: 250,
    maxHp: 250,
    block: 0,
    intent: { type: 'attack', value: 25, description: 'Ataque devastador' },
    buffs: [],
    debuffs: [],
    isBoss: true,
  },
  {
    id: 'rey_del_continente',
    name: 'Rey del Continente',
    hp: 380,
    maxHp: 380,
    block: 0,
    intent: { type: 'attack', value: 34, description: 'Ataque imperial' },
    buffs: [],
    debuffs: [],
    isBoss: true,
  },
];

// Obtener enemigo aleatorio por acto
export function getRandomEnemy(act: number, isElite: boolean = false, isBoss: boolean = false): Enemy {
  let pool: Enemy[] = [];
  
  if (isBoss) {
    pool = bossEnemies;
  } else if (isElite) {
    pool = eliteEnemies;
  } else {
    switch (act) {
      case 1:
        pool = act1Enemies;
        break;
      case 2:
        pool = act2Enemies;
        break;
      case 3:
        pool = act3Enemies;
        break;
      case 4:
        pool = act4Enemies;
        break;
      default:
        pool = act1Enemies;
    }
  }
  
  const baseEnemy = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...baseEnemy,
    id: `${baseEnemy.id}_${Date.now()}`,
    hp: baseEnemy.maxHp,
    block: 0,
    buffs: [],
    debuffs: [],
  };
}

// Obtener jefe específico del acto
export function getBossForAct(act: number): Enemy {
  const bossIndex = Math.min(act - 1, bossEnemies.length - 1);
  const boss = bossEnemies[bossIndex];
  return {
    ...boss,
    id: `${boss.id}_${Date.now()}`,
    hp: boss.maxHp,
    block: 0,
    buffs: [],
    debuffs: [],
  };
}

// Generar intención aleatoria para un enemigo
export function generateRandomIntent(enemy: Enemy, act: number): Enemy['intent'] {
  const intents: Enemy['intent'][] = [];
  const actDamageBonus = act >= 4 ? 4 : 0;
  const actBlockBonus = act >= 4 ? 4 : 0;
  
  // Ataque básico
  const baseDamage = 6 + act * 3 + actDamageBonus + (enemy.isElite ? 4 : 0) + (enemy.isBoss ? 10 : 0);
  intents.push({
    type: 'attack',
    value: baseDamage,
    description: `Va a atacar por ${baseDamage}`,
  });
  
  // Ataque fuerte (menos probable)
  intents.push({
    type: 'attack',
    value: Math.floor(baseDamage * 1.5),
    description: `Va a atacar fuerte por ${Math.floor(baseDamage * 1.5)}`,
  });
  
  // Defensa
  const baseBlock = 8 + act * 2 + actBlockBonus;
  intents.push({
    type: 'defend',
    value: baseBlock,
    description: `Se prepara para defender (${baseBlock} bloqueo)`,
  });
  
  // Buff (solo para élites y jefes)
  if (enemy.isElite || enemy.isBoss) {
    intents.push({
      type: 'buff',
      value: 2 + act,
      description: 'Va a aumentar su poder',
    });
  }
  
  // Debuff
  intents.push({
    type: 'debuff',
    value: 1 + act,
    description: 'Va a aplicar un efecto negativo',
  });
  
  // Seleccionar intención aleatoria (ataque es más probable)
  const weights = act >= 4 ? [0.45, 0.22, 0.17, 0.08, 0.08] : [0.4, 0.2, 0.2, 0.1, 0.1];
  const random = Math.random();
  let weightSum = 0;
  
  for (let i = 0; i < intents.length; i++) {
    weightSum += weights[i] || 0.1;
    if (random <= weightSum) {
      return intents[i];
    }
  }
  
  return intents[0];
}
