import { discardCardsFromHand, exhaustHandCards } from '@/lib/combat/cardFlow';
import { randomInt } from '@/lib/rng';
import type { CombatLogTone, Effect, Enemy, Player } from '@/types/game';

export interface CombatEffectResolution {
  spentGarra: number;
  spentMomentum: number;
}

export interface CombatEffectResolverContext {
  targetIndex: number;
  relicDamageMultiplier: number;
  madridPassiveDamageBonus: number;
  spentGarraThisCard: number;
  spentMomentumThisCard: number;
  getPlayer: () => Player;
  getEnemies: () => Enemy[];
  getPlayerBuff: (id: string) => number;
  damageEnemy: (targetIndex: number, amount: number) => void;
  applyBlock: (amount: number) => void;
  drawCards: (amount: number) => void;
  addBuffToPlayer: (id: string, name: string, value: number) => void;
  addCombatLog: (text: string, tone?: CombatLogTone) => void;
  gainGarra: (amount: number) => void;
  gainMomentum: (amount: number) => void;
  gainPosesion: (amount: number) => void;
  applyExhaustTriggers: (amount: number) => void;
  updatePlayer: (updater: (player: Player) => Player) => void;
  updateEnemies: (updater: (enemies: Enemy[]) => Enemy[]) => void;
}

const EMPTY_RESOLUTION: CombatEffectResolution = {
  spentGarra: 0,
  spentMomentum: 0,
};

function getDebuffValue(debuffs: Enemy['debuffs'], id: string): number {
  return debuffs.find(debuff => debuff.id === id)?.value || 0;
}

function isPlayerWeak(player: Player): boolean {
  return !!player.debuffs?.some(debuff => debuff.id === 'weak');
}

function applyVulnerable(enemy: Enemy | undefined, damage: number): number {
  if (!enemy || getDebuffValue(enemy.debuffs || [], 'vulnerable') <= 0) return damage;
  return Math.floor(damage * 1.5);
}

function applyEnemyDebuff(enemy: Enemy, debuffId: 'weak' | 'vulnerable', value: number): Enemy {
  const debuffs = enemy.debuffs || [];
  const debuffName = debuffId === 'weak' ? 'Debil' : 'Vulnerable';
  const existingDebuff = debuffs.find(debuff => debuff.id === debuffId);
  if (existingDebuff) {
    return {
      ...enemy,
      debuffs: debuffs.map(debuff => (
        debuff.id === debuffId
          ? { ...debuff, value: debuff.value + value }
          : debuff
      )),
    };
  }

  return {
    ...enemy,
    debuffs: [...debuffs, { id: debuffId, name: debuffName, value }],
  };
}

function updateTargetEnemy(
  context: CombatEffectResolverContext,
  targetIndex: number,
  updater: (enemy: Enemy) => Enemy
): void {
  context.updateEnemies(enemies => enemies.map((enemy, index) => (
    index === targetIndex ? updater(enemy) : enemy
  )));
}

function updateAllEnemies(
  context: CombatEffectResolverContext,
  updater: (enemy: Enemy) => Enemy
): void {
  context.updateEnemies(enemies => enemies.map(updater));
}

function resolveConditionalDamage(
  effect: Effect,
  context: CombatEffectResolverContext
): CombatEffectResolution {
  if (effect.target !== 'enemy') return EMPTY_RESOLUTION;

  const enemy = context.getEnemies()[context.targetIndex];
  const player = context.getPlayer();
  let conditionMet = false;

  if (effect.condition === 'enemy_hp_less_50' && enemy) {
    conditionMet = enemy.hp < enemy.maxHp * 0.5;
  } else if (effect.condition === 'enemy_hp_more_than_player' && enemy) {
    conditionMet = enemy.hp > player.hp;
  } else if (effect.condition === 'enemy_hp_more_50' && enemy) {
    conditionMet = enemy.hp > enemy.maxHp * 0.5;
  } else if (effect.condition === 'enemy_attacked_last_turn' && enemy) {
    conditionMet = !!enemy.didAttackLastTurn;
  } else if (effect.condition === 'player_block_more_20') {
    conditionMet = (player.block || 0) > 20;
  } else if (effect.condition === 'cards_played_3') {
    conditionMet = (player.cardsPlayedThisTurn || 0) >= 3;
  } else if (effect.condition === 'previous_card_skill') {
    conditionMet = player.previousCardType === 'skill';
  } else if (effect.condition === 'enemy_intent_attack' && enemy) {
    conditionMet = enemy.intent.type === 'attack';
  } else if (effect.condition === 'posesion_4') {
    conditionMet = (player.posesion || 0) >= 4;
  } else if (effect.condition === 'momentum_3') {
    conditionMet = (player.momentum || 0) >= 3;
  } else if (effect.condition === 'garra_3') {
    conditionMet = (player.garra || 0) >= 3;
  } else if (effect.condition === 'spent_garra') {
    conditionMet = context.spentGarraThisCard > 0;
  } else if (effect.condition === 'spent_momentum') {
    conditionMet = context.spentMomentumThisCard > 0;
  }

  if (!conditionMet || !enemy) return EMPTY_RESOLUTION;

  const damage = applyVulnerable(
    enemy,
    (effect.value + context.madridPassiveDamageBonus) * context.relicDamageMultiplier
  );
  context.damageEnemy(context.targetIndex, damage);
  return EMPTY_RESOLUTION;
}

function resolveDirectDamage(
  effect: Effect,
  context: CombatEffectResolverContext
): CombatEffectResolution {
  const player = context.getPlayer();
  const strength = context.getPlayerBuff('strength') + context.getPlayerBuff('temp_strength');
  const weakMultiplier = isPlayerWeak(player) ? 0.75 : 1;

  if (effect.target === 'enemy') {
    const enemy = context.getEnemies()[context.targetIndex];
    if (!enemy) return EMPTY_RESOLUTION;
    const rawDamage = (effect.value + strength + context.madridPassiveDamageBonus) * context.relicDamageMultiplier;
    const damage = applyVulnerable(enemy, Math.floor(rawDamage * weakMultiplier));
    context.damageEnemy(context.targetIndex, damage);
    return EMPTY_RESOLUTION;
  }

  if (effect.target === 'all_enemies') {
    context.getEnemies().forEach((enemy, index) => {
      const rawDamage = effect.value + strength + context.madridPassiveDamageBonus;
      const damage = applyVulnerable(enemy, Math.floor(rawDamage * weakMultiplier));
      context.damageEnemy(index, damage);
    });
  }

  return EMPTY_RESOLUTION;
}

function resolveBlock(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.target !== 'self') return EMPTY_RESOLUTION;

  const player = context.getPlayer();
  const dexterity = context.getPlayerBuff('dexterity');
  let extraBlock = 0;
  let useTurnBonus = false;
  let useCombatBonus = false;

  if (player.relics.some(relic => relic.id.startsWith('txapela_hierro')) && !player.firstBlockBonusUsedThisTurn) {
    extraBlock += 3;
    useTurnBonus = true;
  }

  if (player.relics.some(relic => relic.id.startsWith('chaleco_gps')) && !player.firstBlockBonusUsedThisCombat) {
    extraBlock += 4;
    useCombatBonus = true;
  }

  context.applyBlock(effect.value + dexterity + extraBlock);

  if (useTurnBonus) {
    context.addCombatLog('Txapela de Hierro: +3 de bloqueo.', 'good');
  }
  if (useCombatBonus) {
    context.addCombatLog('Chaleco GPS: +4 de bloqueo.', 'good');
  }

  if (useTurnBonus || useCombatBonus) {
    context.updatePlayer(currentPlayer => ({
      ...currentPlayer,
      firstBlockBonusUsedThisTurn: useTurnBonus ? true : currentPlayer.firstBlockBonusUsedThisTurn,
      firstBlockBonusUsedThisCombat: useCombatBonus ? true : currentPlayer.firstBlockBonusUsedThisCombat,
    }));
  }

  return EMPTY_RESOLUTION;
}

function resolveConditionalBlock(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.target !== 'self') return EMPTY_RESOLUTION;
  if (effect.condition !== 'enemy_vulnerable') return EMPTY_RESOLUTION;

  const hasVulnerableEnemy = context.getEnemies().some(enemy => getDebuffValue(enemy.debuffs || [], 'vulnerable') > 0);
  if (!hasVulnerableEnemy) return EMPTY_RESOLUTION;

  context.applyBlock(effect.value + context.getPlayerBuff('dexterity'));
  return EMPTY_RESOLUTION;
}

function resolveEnemyDebuff(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.target === 'enemy') {
    const enemy = context.getEnemies()[context.targetIndex];
    if (!enemy) return EMPTY_RESOLUTION;
    updateTargetEnemy(context, context.targetIndex, currentEnemy => applyEnemyDebuff(currentEnemy, effect.type as 'weak' | 'vulnerable', effect.value));
  } else if (effect.target === 'all_enemies') {
    updateAllEnemies(context, enemy => applyEnemyDebuff(enemy, effect.type as 'weak' | 'vulnerable', effect.value));
  }

  return EMPTY_RESOLUTION;
}

function resolveDiscard(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.target !== 'self') return EMPTY_RESOLUTION;

  const player = context.getPlayer();
  const discardIndexes: number[] = [];
  let remainingHand = player.hand.length;
  for (let index = 0; index < effect.value && remainingHand > 0; index += 1) {
    discardIndexes.push(randomInt(remainingHand));
    remainingHand -= 1;
  }

  const discardResult = discardCardsFromHand(player.hand, discardIndexes);
  context.updatePlayer(currentPlayer => ({
    ...currentPlayer,
    hand: discardResult.nextHand,
    discard: [...currentPlayer.discard, ...discardResult.discardedCards],
  }));

  return EMPTY_RESOLUTION;
}

function resolveExhaustHandDamage(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.target !== 'enemy') return EMPTY_RESOLUTION;

  const player = context.getPlayer();
  const { exhaustCount, nextExhaust, nextHand } = exhaustHandCards(player.hand, player.exhaust);
  if (exhaustCount <= 0) return EMPTY_RESOLUTION;

  context.updatePlayer(currentPlayer => ({
    ...currentPlayer,
    hand: nextHand,
    exhaust: nextExhaust,
  }));

  const enemy = context.getEnemies()[context.targetIndex];
  if (enemy) {
    const damage = applyVulnerable(
      enemy,
      effect.value * exhaustCount * context.relicDamageMultiplier
    );
    context.damageEnemy(context.targetIndex, damage);
  }

  context.applyExhaustTriggers(exhaustCount);
  return EMPTY_RESOLUTION;
}

function resolvePlayerResourceEffect(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.type === 'gain_garra' && effect.target === 'self') {
    context.gainGarra(effect.value);
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'gain_momentum' && effect.target === 'self') {
    context.gainMomentum(effect.value);
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'gain_posesion' && effect.target === 'self') {
    context.gainPosesion(effect.value);
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'trigger_posesion_threshold' && effect.target === 'self') {
    context.gainPosesion(0);
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'if_garra_at_least' && effect.target === 'self') {
    if ((context.getPlayer().garra || 0) >= effect.value) {
      context.gainGarra(1);
    }
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'spend_garra' && effect.target === 'self') {
    const currentGarra = context.getPlayer().garra || 0;
    const spentGarra = Math.min(currentGarra, Math.max(0, effect.value));
    if (spentGarra > 0) {
      context.updatePlayer(player => ({
        ...player,
        garra: Math.max(0, (player.garra || 0) - spentGarra),
      }));
    }
    return { spentGarra, spentMomentum: 0 };
  }

  if (effect.type === 'spend_momentum' && effect.target === 'self') {
    const currentMomentum = context.getPlayer().momentum || 0;
    const spentMomentum = Math.min(currentMomentum, Math.max(0, effect.value));
    if (spentMomentum > 0) {
      context.updatePlayer(player => ({
        ...player,
        momentum: Math.max(0, (player.momentum || 0) - spentMomentum),
      }));
    }
    return { spentGarra: 0, spentMomentum };
  }

  if (effect.type === 'if_previous_card_type' && effect.target === 'self') {
    if (effect.condition === 'skill' && context.getPlayer().previousCardType === 'skill') {
      context.updatePlayer(player => ({ ...player, energy: player.energy + effect.value }));
    }
  }

  return EMPTY_RESOLUTION;
}

function resolvePlayerModifierEffect(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.type === 'feel_no_pain' && effect.target === 'self') {
    context.updatePlayer(player => ({
      ...player,
      blockOnExhaust: (player.blockOnExhaust || 0) + effect.value,
    }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'dark_embrace' && effect.target === 'self') {
    context.updatePlayer(player => ({
      ...player,
      drawOnExhaust: (player.drawOnExhaust || 0) + effect.value,
    }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'draw_per_turn') {
    context.updatePlayer(player => ({
      ...player,
      drawPerTurn: (player.drawPerTurn || 0) + effect.value,
    }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'barricade' || effect.type === 'block_per_turn') {
    context.updatePlayer(player => ({
      ...player,
      blockPerTurn: (player.blockPerTurn || 0) + effect.value,
    }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'retain_block_up_to' && effect.target === 'self') {
    context.updatePlayer(player => ({
      ...player,
      blockRetainCap: Math.max(player.blockRetainCap || 0, effect.value),
    }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'next_card_free') {
    context.updatePlayer(player => ({ ...player, nextCardFree: true }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'next_skill_free') {
    context.updatePlayer(player => ({ ...player, nextSkillFree: true }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'next_attack_free') {
    context.updatePlayer(player => ({ ...player, nextAttackFree: true }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'next_attack_double') {
    context.updatePlayer(player => ({ ...player, nextAttackDouble: true }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'reduce_hand_cost' && effect.target === 'self') {
    context.updatePlayer(player => ({
      ...player,
      hand: player.hand.map(card => ({
        ...card,
        tempCost: Math.max(0, (card.tempCost ?? card.cost) - effect.value),
      })),
    }));
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'set_card_cost_temp' && effect.target === 'self') {
    context.updatePlayer(player => {
      const hand = [...player.hand];
      let bestIndex = -1;
      let bestCost = -1;

      hand.forEach((card, index) => {
        const handCost = card.tempCost ?? card.cost;
        if (handCost > bestCost) {
          bestCost = handCost;
          bestIndex = index;
        }
      });

      if (bestIndex < 0 || bestCost <= 0) return player;
      hand[bestIndex] = { ...hand[bestIndex], tempCost: 0 };
      return { ...player, hand };
    });
  }

  return EMPTY_RESOLUTION;
}

function resolveBuffEffect(effect: Effect, context: CombatEffectResolverContext): CombatEffectResolution {
  if (effect.type === 'strength' && effect.target === 'self') {
    context.addBuffToPlayer('strength', 'Fuerza', effect.value);
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'strength_conditional' && effect.target === 'self') {
    const player = context.getPlayer();
    if (effect.condition === 'player_hp_less_50' && player.hp < player.maxHp * 0.5) {
      context.addBuffToPlayer('strength', 'Fuerza', effect.value);
    }
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'strength_when_low' && effect.target === 'self') {
    const player = context.getPlayer();
    if (player.hp < player.maxHp * 0.5) {
      context.addBuffToPlayer('strength', 'Fuerza', effect.value);
    }
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'dexterity_when_low' && effect.target === 'self') {
    const player = context.getPlayer();
    if (player.hp < player.maxHp * 0.5) {
      context.addBuffToPlayer('dexterity', 'Destreza', effect.value);
    }
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'temp_strength_this_turn' && effect.target === 'self') {
    context.addBuffToPlayer('temp_strength', 'Fuerza Temporal', effect.value);
    return EMPTY_RESOLUTION;
  }

  if (effect.type === 'dexterity') {
    context.addBuffToPlayer('dexterity', 'Destreza', effect.value);
  }

  return EMPTY_RESOLUTION;
}

const effectResolvers: Record<string, (effect: Effect, context: CombatEffectResolverContext) => CombatEffectResolution> = {
  damage: resolveDirectDamage,
  damage_all: resolveDirectDamage,
  conditional_damage: resolveConditionalDamage,
  exhaust_hand_damage: resolveExhaustHandDamage,
  block: resolveBlock,
  conditional_block: resolveConditionalBlock,
  draw: (effect, context) => {
    if (effect.target === 'self') context.drawCards(effect.value);
    return EMPTY_RESOLUTION;
  },
  energy: (effect, context) => {
    if (effect.target === 'self') {
      context.updatePlayer(player => ({ ...player, energy: player.energy + effect.value }));
    }
    return EMPTY_RESOLUTION;
  },
  conditional_energy: (effect, context) => {
    if (effect.target !== 'self') return EMPTY_RESOLUTION;
    if (effect.condition === 'enemy_attacked_last_turn' && context.getEnemies()[context.targetIndex]?.didAttackLastTurn) {
      context.updatePlayer(player => ({ ...player, energy: player.energy + effect.value }));
    }
    return EMPTY_RESOLUTION;
  },
  vulnerable: resolveEnemyDebuff,
  weak: resolveEnemyDebuff,
  weak_all: (effect, context) => resolveEnemyDebuff({ ...effect, type: 'weak', target: 'all_enemies' }, context),
  strength: resolveBuffEffect,
  strength_conditional: resolveBuffEffect,
  strength_when_low: resolveBuffEffect,
  dexterity_when_low: resolveBuffEffect,
  temp_strength_this_turn: resolveBuffEffect,
  dexterity: resolveBuffEffect,
  feel_no_pain: resolvePlayerModifierEffect,
  dark_embrace: resolvePlayerModifierEffect,
  next_card_free: resolvePlayerModifierEffect,
  next_skill_free: resolvePlayerModifierEffect,
  next_attack_free: resolvePlayerModifierEffect,
  next_attack_double: resolvePlayerModifierEffect,
  draw_per_turn: resolvePlayerModifierEffect,
  reduce_hand_cost: resolvePlayerModifierEffect,
  barricade: resolvePlayerModifierEffect,
  block_per_turn: resolvePlayerModifierEffect,
  retain_block_up_to: resolvePlayerModifierEffect,
  set_card_cost_temp: resolvePlayerModifierEffect,
  discard: resolveDiscard,
  gain_garra: resolvePlayerResourceEffect,
  spend_garra: resolvePlayerResourceEffect,
  if_garra_at_least: resolvePlayerResourceEffect,
  gain_posesion: resolvePlayerResourceEffect,
  trigger_posesion_threshold: resolvePlayerResourceEffect,
  gain_momentum: resolvePlayerResourceEffect,
  spend_momentum: resolvePlayerResourceEffect,
  if_previous_card_type: resolvePlayerResourceEffect,
  damage_bonus_if_enemy_intent_attack: (effect, context) => {
    if (effect.target !== 'enemy') return EMPTY_RESOLUTION;
    const enemy = context.getEnemies()[context.targetIndex];
    if (enemy?.intent.type === 'attack') {
      const damage = applyVulnerable(enemy, effect.value * context.relicDamageMultiplier);
      context.damageEnemy(context.targetIndex, damage);
    }
    return EMPTY_RESOLUTION;
  },
};

export function resolveCombatEffect(
  effect: Effect,
  context: CombatEffectResolverContext
): CombatEffectResolution {
  const resolver = effectResolvers[effect.type];
  if (!resolver) return EMPTY_RESOLUTION;
  return resolver(effect, context);
}
