import { describe, expect, it } from 'vitest';

import { bossEnemies, eliteEnemies, generateRandomIntent, getBossForAct, getRandomEnemy } from '@/data/enemies';

function eliteIntentTypesFor(enemyIndex: number, act: number, steps: number[]): string[] {
  return steps.map(step => generateRandomIntent({ ...eliteEnemies[enemyIndex], aiStep: step }, act).type);
}

function bossIntentTypesFor(bossIndex: number, act: number, hpRatio: number, steps: number[]): string[] {
  return steps.map(step => {
    const boss = bossEnemies[bossIndex];
    const hp = Math.max(1, Math.floor(boss.maxHp * hpRatio));
    return generateRandomIntent({ ...boss, hp, aiStep: step }, act).type;
  });
}

describe('elite enemy patterns', () => {
  it('keeps Portero Titular on a defend-attack-defend-debuff loop', () => {
    expect(eliteIntentTypesFor(0, 2, [0, 1, 2, 3])).toEqual(['defend', 'attack', 'defend', 'debuff']);
  });

  it('keeps Capitan del Equipo on a buff-attack-debuff-finisher loop', () => {
    expect(eliteIntentTypesFor(1, 2, [0, 1, 2, 3])).toEqual(['buff', 'attack', 'debuff', 'attack']);
  });

  it('keeps Goleador Natural on an aggressive burst loop', () => {
    expect(eliteIntentTypesFor(2, 2, [0, 1, 2, 3])).toEqual(['attack', 'attack', 'debuff', 'attack']);
  });

  it('spawns elite enemies with ai pattern metadata and opening intent', () => {
    for (let index = 0; index < 18; index += 1) {
      const enemy = getRandomEnemy(3, true);
      expect(enemy.isElite).toBe(true);
      expect(enemy.aiPattern).toBeTruthy();
      expect(enemy.aiStep).toBe(0);
      expect(enemy.intent).toEqual(generateRandomIntent(enemy, 3));
    }
  });
});

describe('boss enemy phases', () => {
  it('gives Campeon de Segunda a distinct second phase loop', () => {
    expect(bossIntentTypesFor(0, 1, 1, [0, 1, 2, 3])).toEqual(['attack', 'defend', 'attack', 'debuff']);
    expect(bossIntentTypesFor(0, 1, 0.45, [0, 1, 2, 3])).toEqual(['buff', 'attack', 'debuff', 'attack']);
  });

  it('gives Lider de Primera a command phase and a finisher phase', () => {
    expect(bossIntentTypesFor(1, 2, 1, [0, 1, 2, 3])).toEqual(['buff', 'defend', 'attack', 'debuff']);
    expect(bossIntentTypesFor(1, 2, 0.45, [0, 1, 2, 3])).toEqual(['buff', 'attack', 'attack', 'debuff']);
  });

  it('gives Campeon de Europa a tempo phase and a burst phase', () => {
    expect(bossIntentTypesFor(2, 3, 1, [0, 1, 2, 3])).toEqual(['attack', 'buff', 'defend', 'attack']);
    expect(bossIntentTypesFor(2, 3, 0.45, [0, 1, 2, 3])).toEqual(['buff', 'attack', 'debuff', 'attack']);
  });

  it('gives Rey del Continente a fortress phase and an execution phase', () => {
    expect(bossIntentTypesFor(3, 4, 1, [0, 1, 2, 3])).toEqual(['defend', 'buff', 'attack', 'debuff']);
    expect(bossIntentTypesFor(3, 4, 0.45, [0, 1, 2, 3])).toEqual(['buff', 'attack', 'debuff', 'attack']);
  });

  it('spawns bosses with ai pattern metadata and opening intent', () => {
    for (const act of [1, 2, 3, 4]) {
      const boss = getBossForAct(act);
      expect(boss.isBoss).toBe(true);
      expect(boss.aiPattern).toBeTruthy();
      expect(boss.aiStep).toBe(0);
      expect(boss.intent).toEqual(generateRandomIntent(boss, act));
    }
  });
});
