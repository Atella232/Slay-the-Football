import { describe, expect, it, vi } from 'vitest';

import { resolveCombatEffect, type CombatEffectResolverContext } from '@/lib/combat/effectResolver';
import type { Card, CombatLogTone, Effect, Enemy, Player } from '@/types/game';

function makeCard(id: string, cost: number, tempCost?: number): Card {
  return {
    id,
    name: id,
    type: 'skill',
    cost,
    tempCost,
    description: id,
    effects: [],
    rarity: 'common',
    team: 'neutral',
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    team: 'athletic',
    hp: 80,
    maxHp: 80,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    hand: [],
    deck: [],
    discard: [],
    exhaust: [],
    drawPile: [],
    relics: [],
    gold: 0,
    buffs: [],
    debuffs: [],
    potions: [],
    maxPotionSlots: 3,
    ...overrides,
  };
}

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'enemy',
    name: 'Enemy',
    hp: 100,
    maxHp: 100,
    block: 0,
    intent: { type: 'attack', value: 10, description: 'attack' },
    buffs: [],
    debuffs: [],
    ...overrides,
  };
}

function createContext(options: {
  player?: Player;
  enemies?: Enemy[];
  relicDamageMultiplier?: number;
  madridPassiveDamageBonus?: number;
  spentGarraThisCard?: number;
  spentMomentumThisCard?: number;
}) {
  let player = options.player ?? makePlayer();
  let enemies = options.enemies ?? [makeEnemy()];
  const combatLogs: Array<{ text: string; tone?: CombatLogTone }> = [];
  let exhaustTriggerCount = 0;

  const context: CombatEffectResolverContext = {
    targetIndex: 0,
    relicDamageMultiplier: options.relicDamageMultiplier ?? 1,
    madridPassiveDamageBonus: options.madridPassiveDamageBonus ?? 0,
    spentGarraThisCard: options.spentGarraThisCard ?? 0,
    spentMomentumThisCard: options.spentMomentumThisCard ?? 0,
    getPlayer: () => player,
    getEnemies: () => enemies,
    getPlayerBuff: id => player.buffs.find(buff => buff.id === id)?.value || 0,
    damageEnemy: (targetIndex, amount) => {
      enemies = enemies.map((enemy, index) => (
        index === targetIndex
          ? { ...enemy, hp: Math.max(0, enemy.hp - amount) }
          : enemy
      ));
    },
    applyBlock: amount => {
      player = { ...player, block: player.block + amount };
    },
    drawCards: vi.fn(),
    addBuffToPlayer: (id, name, value) => {
      const existingBuff = player.buffs.find(buff => buff.id === id);
      player = {
        ...player,
        buffs: existingBuff
          ? player.buffs.map(buff => (buff.id === id ? { ...buff, value: buff.value + value } : buff))
          : [...player.buffs, { id, name, value }],
      };
    },
    addCombatLog: (text, tone) => {
      combatLogs.push({ text, tone });
    },
    gainGarra: amount => {
      player = { ...player, garra: Math.min(10, (player.garra || 0) + amount) };
    },
    gainMomentum: amount => {
      player = { ...player, momentum: Math.min(5, (player.momentum || 0) + amount) };
    },
    gainPosesion: amount => {
      player = { ...player, posesion: Math.min(8, (player.posesion || 0) + amount) };
    },
    applyExhaustTriggers: amount => {
      exhaustTriggerCount += amount;
    },
    updatePlayer: updater => {
      player = updater(player);
    },
    updateEnemies: updater => {
      enemies = updater(enemies);
    },
  };

  return {
    context,
    getPlayer: () => player,
    getEnemies: () => enemies,
    combatLogs,
    getExhaustTriggerCount: () => exhaustTriggerCount,
  };
}

describe('resolveCombatEffect', () => {
  it('applies strength, weak, vulnerable and multipliers to direct damage', () => {
    const player = makePlayer({
      buffs: [{ id: 'strength', name: 'Fuerza', value: 2 }],
      debuffs: [{ id: 'weak', name: 'Debil', value: 1 }],
    });
    const enemy = makeEnemy({ debuffs: [{ id: 'vulnerable', name: 'Vulnerable', value: 2 }] });
    const harness = createContext({
      player,
      enemies: [enemy],
      relicDamageMultiplier: 2,
      madridPassiveDamageBonus: 4,
    });
    const effect: Effect = { type: 'damage', value: 10, target: 'enemy' };

    resolveCombatEffect(effect, harness.context);

    expect(harness.getEnemies()[0].hp).toBe(64);
  });

  it('adds block with dexterity and first-block relic bonuses', () => {
    const player = makePlayer({
      buffs: [{ id: 'dexterity', name: 'Destreza', value: 2 }],
      relics: [
        { id: 'txapela_hierro_1', name: 'Txapela', description: '', rarity: 'common', effect: { type: 'block', value: 0 } },
        { id: 'chaleco_gps_1', name: 'Chaleco', description: '', rarity: 'common', effect: { type: 'block', value: 0 } },
      ],
      firstBlockBonusUsedThisTurn: false,
      firstBlockBonusUsedThisCombat: false,
    });
    const harness = createContext({ player });
    const effect: Effect = { type: 'block', value: 5, target: 'self' };

    resolveCombatEffect(effect, harness.context);

    expect(harness.getPlayer().block).toBe(14);
    expect(harness.getPlayer().firstBlockBonusUsedThisTurn).toBe(true);
    expect(harness.getPlayer().firstBlockBonusUsedThisCombat).toBe(true);
    expect(harness.combatLogs.map(entry => entry.text)).toEqual([
      'Txapela de Hierro: +3 de bloqueo.',
      'Chaleco GPS: +4 de bloqueo.',
    ]);
  });

  it('merges weak across all enemies', () => {
    const enemies = [
      makeEnemy({ id: 'a', debuffs: [{ id: 'weak', name: 'Debil', value: 1 }] }),
      makeEnemy({ id: 'b' }),
    ];
    const harness = createContext({ enemies });
    const effect: Effect = { type: 'weak_all', value: 2, target: 'all_enemies' };

    resolveCombatEffect(effect, harness.context);

    expect(harness.getEnemies()[0].debuffs.find(debuff => debuff.id === 'weak')?.value).toBe(3);
    expect(harness.getEnemies()[1].debuffs.find(debuff => debuff.id === 'weak')?.value).toBe(2);
  });

  it('exhausts the hand, damages the target and triggers exhaust callbacks', () => {
    const player = makePlayer({
      hand: [makeCard('a', 1), makeCard('b', 2)],
      exhaust: [],
    });
    const enemy = makeEnemy({ debuffs: [{ id: 'vulnerable', name: 'Vulnerable', value: 1 }] });
    const harness = createContext({ player, enemies: [enemy] });
    const effect: Effect = { type: 'exhaust_hand_damage', value: 3, target: 'enemy' };

    resolveCombatEffect(effect, harness.context);

    expect(harness.getPlayer().hand).toHaveLength(0);
    expect(harness.getPlayer().exhaust).toHaveLength(2);
    expect(harness.getEnemies()[0].hp).toBe(91);
    expect(harness.getExhaustTriggerCount()).toBe(2);
  });

  it('sets the highest temporary hand cost to zero', () => {
    const player = makePlayer({
      hand: [makeCard('cheap', 1), makeCard('expensive', 3, 5), makeCard('mid', 2)],
    });
    const harness = createContext({ player });
    const effect: Effect = { type: 'set_card_cost_temp', value: 0, target: 'self' };

    resolveCombatEffect(effect, harness.context);

    expect(harness.getPlayer().hand.map(card => card.tempCost ?? card.cost)).toEqual([1, 0, 2]);
  });
});
