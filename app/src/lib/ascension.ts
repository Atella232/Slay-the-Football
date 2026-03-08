import type { Enemy } from '@/types/game';

export const BASE_REST_HEAL_RATIO = 0.26;
export const BASE_TRAIN_HEAL_RATIO = 0.13;
export const BASE_BOSS_TRANSITION_HEAL_RATIO = 0.24;

export interface AscensionTuning {
  enemyHpMultiplier: number;
  eliteHpMultiplier: number;
  bossHpMultiplier: number;
  enemyDamageMultiplier: number;
  bossDamageMultiplier: number;
  playerMaxHpPenalty: number;
  restHealMultiplier: number;
  bossTransitionHealMultiplier: number;
  goldRewardMultiplier: number;
  potionEffectMultiplier: number;
  shopPriceMultiplier: number;
  startingHandSize: number;
  maxPotionSlots: number;
  eliteTargetBonus: number;
}

export interface AscensionRule {
  level: number;
  title: string;
  summary: string;
}

const ASCENSION_RULES: AscensionRule[] = [
  { level: 1, title: 'A1', summary: 'Enemigos con +10% vida.' },
  { level: 2, title: 'A2', summary: 'Elites con +12% vida adicional.' },
  { level: 3, title: 'A3', summary: 'Jefes con +18% vida adicional.' },
  { level: 4, title: 'A4', summary: 'Empiezas con 5 HP max menos.' },
  { level: 5, title: 'A5', summary: 'Enemigos infligen +5% dano.' },
  { level: 6, title: 'A6', summary: 'Enemigos infligen +5% dano adicional.' },
  { level: 7, title: 'A7', summary: 'Mas elites en el mapa.' },
  { level: 8, title: 'A8', summary: 'Jefes con +10% dano.' },
  { level: 9, title: 'A9', summary: 'Curas de hostal -8%.' },
  { level: 10, title: 'A10', summary: 'Mano inicial -1 carta.' },
  { level: 11, title: 'A11', summary: 'Tienda +6% precios y -6% oro ganado.' },
  { level: 12, title: 'A12', summary: 'Pierdes 1 slot de pocion.' },
  { level: 13, title: 'A13', summary: 'Pociones -10% efectividad.' },
  { level: 14, title: 'A14', summary: 'Empiezas con 3 HP max menos adicionales.' },
  { level: 15, title: 'A15', summary: 'Enemigos +10% vida y mas elites.' },
  { level: 16, title: 'A16', summary: 'Enemigos +7% dano.' },
  { level: 17, title: 'A17', summary: 'Jefes +10% vida.' },
  { level: 18, title: 'A18', summary: 'Mano inicial baja a 3 cartas.' },
  { level: 19, title: 'A19', summary: 'Hostal -8% adicional, tienda +6%, oro -8%.' },
  { level: 20, title: 'A20', summary: 'Pociones -15% adicional y cura entre actos reducida.' },
];

export function getAscensionRulesUpTo(level: number): AscensionRule[] {
  return ASCENSION_RULES.filter(rule => rule.level <= level);
}

export function getAscensionTuning(level: number): AscensionTuning {
  const clamped = Math.max(0, Math.min(20, Math.floor(level)));

  const tuning: AscensionTuning = {
    enemyHpMultiplier: 1,
    eliteHpMultiplier: 1,
    bossHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    bossDamageMultiplier: 1,
    playerMaxHpPenalty: 0,
    restHealMultiplier: 1,
    bossTransitionHealMultiplier: 1,
    goldRewardMultiplier: 1,
    potionEffectMultiplier: 1,
    shopPriceMultiplier: 1,
    startingHandSize: 5,
    maxPotionSlots: 3,
    eliteTargetBonus: 0,
  };

  if (clamped >= 1) tuning.enemyHpMultiplier += 0.1;
  if (clamped >= 2) tuning.eliteHpMultiplier += 0.12;
  if (clamped >= 3) tuning.bossHpMultiplier += 0.18;
  if (clamped >= 4) tuning.playerMaxHpPenalty += 5;
  if (clamped >= 5) tuning.enemyDamageMultiplier += 0.05;
  if (clamped >= 6) tuning.enemyDamageMultiplier += 0.05;
  if (clamped >= 7) tuning.eliteTargetBonus += 1;
  if (clamped >= 8) tuning.bossDamageMultiplier += 0.1;
  if (clamped >= 9) tuning.restHealMultiplier *= 0.92;
  if (clamped >= 10) tuning.startingHandSize = 4;
  if (clamped >= 11) {
    tuning.shopPriceMultiplier *= 1.06;
    tuning.goldRewardMultiplier *= 0.94;
  }
  if (clamped >= 12) tuning.maxPotionSlots = 2;
  if (clamped >= 13) tuning.potionEffectMultiplier *= 0.9;
  if (clamped >= 14) tuning.playerMaxHpPenalty += 3;
  if (clamped >= 15) {
    tuning.enemyHpMultiplier += 0.1;
    tuning.eliteTargetBonus += 1;
  }
  if (clamped >= 16) tuning.enemyDamageMultiplier += 0.07;
  if (clamped >= 17) tuning.bossHpMultiplier += 0.1;
  if (clamped >= 18) tuning.startingHandSize = 3;
  if (clamped >= 19) {
    tuning.shopPriceMultiplier *= 1.06;
    tuning.goldRewardMultiplier *= 0.92;
    tuning.restHealMultiplier *= 0.92;
  }
  if (clamped >= 20) {
    tuning.potionEffectMultiplier *= 0.85;
    tuning.bossTransitionHealMultiplier *= 0.7;
  }

  return tuning;
}

export function scaleInt(base: number, multiplier: number, min = 0): number {
  return Math.max(min, Math.floor(base * multiplier));
}

export function applyAscensionToEnemy(enemy: Enemy, level: number): Enemy {
  const tuning = getAscensionTuning(level);
  const hpMultiplier = enemy.isBoss
    ? tuning.enemyHpMultiplier * tuning.bossHpMultiplier
    : enemy.isElite
      ? tuning.enemyHpMultiplier * tuning.eliteHpMultiplier
      : tuning.enemyHpMultiplier;
  const scaledMaxHp = scaleInt(enemy.maxHp, hpMultiplier, 1);

  return {
    ...enemy,
    hp: scaledMaxHp,
    maxHp: scaledMaxHp,
  };
}
