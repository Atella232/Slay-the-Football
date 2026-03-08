import { createRandomId, randomChoice, randomFloat } from '@/lib/rng';
import type { Enemy } from '@/types/game';

type EnemyPatternId = NonNullable<Enemy['aiPattern']>;

function buildElitePatternIntent(pattern: EnemyPatternId, act: number, step: number): Enemy['intent'] {
  const phase = ((step % 4) + 4) % 4;
  const actDamageBonus = act >= 4 ? 4 : 0;
  const actBlockBonus = act >= 4 ? 4 : 0;
  const baseDamage = 8 + act * 4 + actDamageBonus;
  const heavyDamage = Math.floor(baseDamage * 1.45) + 2;
  const baseBlock = 10 + act * 3 + actBlockBonus;
  const baseBuff = 2 + act;
  const baseDebuff = 1 + act;

  if (pattern === 'keeper_wall') {
    if (phase === 0) return { type: 'defend', value: baseBlock + 6, description: `Cierra el arco (${baseBlock + 6} bloqueo)` };
    if (phase === 1) return { type: 'attack', value: baseDamage + 2, description: `Contraataque por ${baseDamage + 2}` };
    if (phase === 2) return { type: 'defend', value: baseBlock + 2, description: `Rearma la muralla (${baseBlock + 2} bloqueo)` };
    return { type: 'debuff', value: baseDebuff + 1, description: `Te enfria el ritmo (${baseDebuff + 1} Debil)` };
  }

  if (pattern === 'captain_rally') {
    if (phase === 0) return { type: 'buff', value: baseBuff + 1, description: 'Ordena al equipo y gana Fuerza' };
    if (phase === 1) return { type: 'attack', value: baseDamage + 1, description: `Embiste por ${baseDamage + 1}` };
    if (phase === 2) return { type: 'debuff', value: baseDebuff, description: `Te corta la circulacion (${baseDebuff} Debil)` };
    return { type: 'attack', value: heavyDamage, description: `Remate lider por ${heavyDamage}` };
  }

  if (phase === 0) return { type: 'attack', value: baseDamage + 3, description: `Desmarque letal por ${baseDamage + 3}` };
  if (phase === 1) return { type: 'attack', value: heavyDamage + 2, description: `Definicion brutal por ${heavyDamage + 2}` };
  if (phase === 2) return { type: 'debuff', value: baseDebuff + 1, description: `Te obliga a dudar (${baseDebuff + 1} Debil)` };
  return { type: 'attack', value: baseDamage + 1, description: `Ataca el segundo palo por ${baseDamage + 1}` };
}

function buildBossPatternIntent(pattern: EnemyPatternId, enemy: Enemy, act: number, step: number): Enemy['intent'] {
  const phaseTwo = enemy.hp <= enemy.maxHp * 0.5;
  const phase = ((step % 4) + 4) % 4;
  const phaseLabel = phaseTwo ? 'Fase 2' : 'Fase 1';
  const actDamageBonus = act >= 4 ? 5 : 0;
  const actBlockBonus = act >= 4 ? 4 : 0;
  const baseDamage = 13 + act * 4 + actDamageBonus;
  const heavyDamage = Math.floor(baseDamage * (phaseTwo ? 1.75 : 1.45));
  const baseBlock = 12 + act * 3 + actBlockBonus;
  const baseBuff = 3 + act + (phaseTwo ? 2 : 0);
  const baseDebuff = 2 + act + (phaseTwo ? 1 : 0);

  if (pattern === 'champion_press') {
    if (!phaseTwo) {
      if (phase === 0) return { type: 'attack', value: baseDamage, description: `${phaseLabel}: entrada por ${baseDamage}` };
      if (phase === 1) return { type: 'defend', value: baseBlock + 4, description: `${phaseLabel}: se atrinchera (${baseBlock + 4} bloqueo)` };
      if (phase === 2) return { type: 'attack', value: baseDamage + 4, description: `${phaseLabel}: aprieta por ${baseDamage + 4}` };
      return { type: 'debuff', value: baseDebuff, description: `${phaseLabel}: te corta el ritmo (${baseDebuff} Debil)` };
    }
    if (phase === 0) return { type: 'buff', value: baseBuff, description: `${phaseLabel}: se crece y gana Fuerza` };
    if (phase === 1) return { type: 'attack', value: heavyDamage, description: `${phaseLabel}: remate total por ${heavyDamage}` };
    if (phase === 2) return { type: 'debuff', value: baseDebuff + 1, description: `${phaseLabel}: asfixia la salida (${baseDebuff + 1} Debil)` };
    return { type: 'attack', value: heavyDamage + 4, description: `${phaseLabel}: golpe final por ${heavyDamage + 4}` };
  }

  if (pattern === 'leader_command') {
    if (!phaseTwo) {
      if (phase === 0) return { type: 'buff', value: baseBuff, description: `${phaseLabel}: ordena la presion y gana Fuerza` };
      if (phase === 1) return { type: 'defend', value: baseBlock + 2, description: `${phaseLabel}: reorganiza lineas (${baseBlock + 2} bloqueo)` };
      if (phase === 2) return { type: 'attack', value: baseDamage + 2, description: `${phaseLabel}: castiga por ${baseDamage + 2}` };
      return { type: 'debuff', value: baseDebuff, description: `${phaseLabel}: manda entradas duras (${baseDebuff} Debil)` };
    }
    if (phase === 0) return { type: 'buff', value: baseBuff + 1, description: `${phaseLabel}: activa la marcha extra` };
    if (phase === 1) return { type: 'attack', value: heavyDamage, description: `${phaseLabel}: oleada lider por ${heavyDamage}` };
    if (phase === 2) return { type: 'attack', value: baseDamage + 5, description: `${phaseLabel}: embestida por ${baseDamage + 5}` };
    return { type: 'debuff', value: baseDebuff + 1, description: `${phaseLabel}: rompe tu estructura (${baseDebuff + 1} Debil)` };
  }

  if (pattern === 'european_machine') {
    if (!phaseTwo) {
      if (phase === 0) return { type: 'attack', value: baseDamage + 1, description: `${phaseLabel}: golpea por ${baseDamage + 1}` };
      if (phase === 1) return { type: 'buff', value: baseBuff, description: `${phaseLabel}: acelera su maquinaria` };
      if (phase === 2) return { type: 'defend', value: baseBlock + 3, description: `${phaseLabel}: blinda el sistema (${baseBlock + 3} bloqueo)` };
      return { type: 'attack', value: heavyDamage - 2, description: `${phaseLabel}: cambio de ritmo por ${heavyDamage - 2}` };
    }
    if (phase === 0) return { type: 'buff', value: baseBuff + 2, description: `${phaseLabel}: sube una marcha mas` };
    if (phase === 1) return { type: 'attack', value: heavyDamage + 2, description: `${phaseLabel}: rafaga europea por ${heavyDamage + 2}` };
    if (phase === 2) return { type: 'debuff', value: baseDebuff + 1, description: `${phaseLabel}: te deja sin aire (${baseDebuff + 1} Debil)` };
    return { type: 'attack', value: heavyDamage + 5, description: `${phaseLabel}: avalancha por ${heavyDamage + 5}` };
  }

  if (!phaseTwo) {
    if (phase === 0) return { type: 'defend', value: baseBlock + 6, description: `${phaseLabel}: levanta el imperio (${baseBlock + 6} bloqueo)` };
    if (phase === 1) return { type: 'buff', value: baseBuff + 1, description: `${phaseLabel}: reclama el centro del campo` };
    if (phase === 2) return { type: 'attack', value: baseDamage + 4, description: `${phaseLabel}: decreto ofensivo por ${baseDamage + 4}` };
    return { type: 'debuff', value: baseDebuff + 1, description: `${phaseLabel}: somete la posesion (${baseDebuff + 1} Debil)` };
  }
  if (phase === 0) return { type: 'buff', value: baseBuff + 2, description: `${phaseLabel}: corona la ofensiva` };
  if (phase === 1) return { type: 'attack', value: heavyDamage + 3, description: `${phaseLabel}: castigo imperial por ${heavyDamage + 3}` };
  if (phase === 2) return { type: 'debuff', value: baseDebuff + 2, description: `${phaseLabel}: aplasta la resistencia (${baseDebuff + 2} Debil)` };
  return { type: 'attack', value: heavyDamage + 7, description: `${phaseLabel}: sentencia continental por ${heavyDamage + 7}` };
}

function buildPatternIntent(enemy: Enemy, act: number, step: number): Enemy['intent'] {
  if (!enemy.aiPattern) return enemy.intent;
  if (enemy.isBoss) return buildBossPatternIntent(enemy.aiPattern, enemy, act, step);
  return buildElitePatternIntent(enemy.aiPattern, act, step);
}

// ENEMIGOS NORMALES - ACTO 1 (Segunda Division)
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
    intent: { type: 'debuff', value: 2, description: 'Va a aplicar 2 Debil' },
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

// ENEMIGOS NORMALES - ACTO 2 (Primera Division)
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
    intent: { type: 'attack', value: 15, description: 'Va a atacar critico por 15' },
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

// ELITES
export const eliteEnemies: Enemy[] = [
  {
    id: 'portero_titular',
    name: 'Portero Titular',
    hp: 90,
    maxHp: 90,
    block: 0,
    intent: { type: 'defend', value: 15, description: 'Defensa elite' },
    buffs: [],
    debuffs: [],
    isElite: true,
    aiPattern: 'keeper_wall',
    aiStep: 0,
  },
  {
    id: 'capitan_equipo',
    name: 'Capitan del Equipo',
    hp: 100,
    maxHp: 100,
    block: 0,
    intent: { type: 'buff', value: 5, description: 'Buff a aliados' },
    buffs: [],
    debuffs: [],
    isElite: true,
    aiPattern: 'captain_rally',
    aiStep: 0,
  },
  {
    id: 'goleador_natural',
    name: 'Goleador Natural',
    hp: 80,
    maxHp: 80,
    block: 0,
    intent: { type: 'attack', value: 18, description: 'Ataque critico' },
    buffs: [],
    debuffs: [],
    isElite: true,
    aiPattern: 'poacher_burst',
    aiStep: 0,
  },
];

// JEFES
export const bossEnemies: Enemy[] = [
  {
    id: 'campeon_segunda',
    name: 'Campeon de Segunda',
    hp: 150,
    maxHp: 150,
    block: 0,
    intent: { type: 'attack', value: 15, description: 'Ataque de campeon' },
    buffs: [],
    debuffs: [],
    isBoss: true,
    aiPattern: 'champion_press',
    aiStep: 0,
  },
  {
    id: 'lider_primera',
    name: 'Lider de Primera',
    hp: 200,
    maxHp: 200,
    block: 0,
    intent: { type: 'buff', value: 8, description: 'Invoca refuerzos' },
    buffs: [],
    debuffs: [],
    isBoss: true,
    aiPattern: 'leader_command',
    aiStep: 0,
  },
  {
    id: 'campeon_europa',
    name: 'Campeon de Europa',
    hp: 250,
    maxHp: 250,
    block: 0,
    intent: { type: 'attack', value: 25, description: 'Ataque devastador' },
    buffs: [],
    debuffs: [],
    isBoss: true,
    aiPattern: 'european_machine',
    aiStep: 0,
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
    aiPattern: 'continental_emperor',
    aiStep: 0,
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

  const baseEnemy = randomChoice(pool);
  const aiStep = baseEnemy.aiPattern ? 0 : baseEnemy.aiStep;

  return {
    ...baseEnemy,
    id: createRandomId(baseEnemy.id),
    hp: baseEnemy.maxHp,
    block: 0,
    buffs: [],
    debuffs: [],
    aiStep,
    intent: baseEnemy.aiPattern ? buildPatternIntent({ ...baseEnemy, hp: baseEnemy.maxHp }, act, aiStep || 0) : baseEnemy.intent,
  };
}

// Obtener jefe especifico del acto
export function getBossForAct(act: number): Enemy {
  const bossIndex = Math.min(act - 1, bossEnemies.length - 1);
  const boss = bossEnemies[bossIndex];
  const aiStep = boss.aiPattern ? 0 : boss.aiStep;

  return {
    ...boss,
    id: createRandomId(boss.id),
    hp: boss.maxHp,
    block: 0,
    buffs: [],
    debuffs: [],
    aiStep,
    intent: boss.aiPattern ? buildPatternIntent({ ...boss, hp: boss.maxHp }, act, aiStep || 0) : boss.intent,
  };
}

// Generar intencion aleatoria para un enemigo
export function generateRandomIntent(enemy: Enemy, act: number): Enemy['intent'] {
  if (enemy.aiPattern) {
    return buildPatternIntent(enemy, act, enemy.aiStep || 0);
  }

  const intents: Enemy['intent'][] = [];
  const actDamageBonus = act >= 4 ? 4 : 0;
  const actBlockBonus = act >= 4 ? 4 : 0;

  const baseDamage = 6 + act * 3 + actDamageBonus + (enemy.isElite ? 4 : 0) + (enemy.isBoss ? 10 : 0);
  intents.push({
    type: 'attack',
    value: baseDamage,
    description: `Va a atacar por ${baseDamage}`,
  });

  intents.push({
    type: 'attack',
    value: Math.floor(baseDamage * 1.5),
    description: `Va a atacar fuerte por ${Math.floor(baseDamage * 1.5)}`,
  });

  const baseBlock = 8 + act * 2 + actBlockBonus;
  intents.push({
    type: 'defend',
    value: baseBlock,
    description: `Se prepara para defender (${baseBlock} bloqueo)`,
  });

  if (enemy.isElite || enemy.isBoss) {
    intents.push({
      type: 'buff',
      value: 2 + act,
      description: 'Va a aumentar su poder',
    });
  }

  intents.push({
    type: 'debuff',
    value: 1 + act,
    description: 'Va a aplicar un efecto negativo',
  });

  const weights = act >= 4 ? [0.45, 0.22, 0.17, 0.08, 0.08] : [0.4, 0.2, 0.2, 0.1, 0.1];
  const roll = randomFloat();
  let weightSum = 0;

  for (let index = 0; index < intents.length; index += 1) {
    weightSum += weights[index] || 0.1;
    if (roll <= weightSum) {
      return intents[index];
    }
  }

  return intents[0];
}
