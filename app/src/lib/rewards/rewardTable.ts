import { allCards } from '@/data/cards';
import { getRandomPotion } from '@/data/potions';
import { getRandomRelic } from '@/data/relics';
import { createRandomId, randomBetween, randomInt } from '@/lib/rng';
import type { Card, CardRarity, Potion, Relic, TeamType } from '@/types/game';

export interface RewardTableEntry {
  act: number;
  cardChoices: number;
  cardWeights: Record<CardRarity, number>;
  relicWeights: Record<Exclude<Relic['rarity'], 'boss'>, number>;
  victoryGold: {
    min: number;
    max: number;
    eliteBonus: number;
    bossBonus: number;
  };
  rewardGold: {
    min: number;
    max: number;
  };
  relicChance: number;
  potionChance: number;
}

export interface CombatRewardOffer {
  profile: RewardTableEntry;
  rewardCards: Card[];
  relicReward: Relic | null;
  potionReward: Potion | null;
  goldReward: number;
}

const rewardTableByAct: Record<number, RewardTableEntry> = {
  1: {
    act: 1,
    cardChoices: 3,
    cardWeights: { common: 72, uncommon: 23, rare: 5 },
    relicWeights: { common: 78, uncommon: 22, rare: 0 },
    victoryGold: { min: 14, max: 20, eliteBonus: 14, bossBonus: 60 },
    rewardGold: { min: 12, max: 18 },
    relicChance: 32,
    potionChance: 58,
  },
  2: {
    act: 2,
    cardChoices: 3,
    cardWeights: { common: 60, uncommon: 30, rare: 10 },
    relicWeights: { common: 60, uncommon: 30, rare: 10 },
    victoryGold: { min: 20, max: 29, eliteBonus: 16, bossBonus: 72 },
    rewardGold: { min: 17, max: 25 },
    relicChance: 38,
    potionChance: 52,
  },
  3: {
    act: 3,
    cardChoices: 3,
    cardWeights: { common: 50, uncommon: 35, rare: 15 },
    relicWeights: { common: 45, uncommon: 35, rare: 20 },
    victoryGold: { min: 26, max: 37, eliteBonus: 18, bossBonus: 84 },
    rewardGold: { min: 23, max: 33 },
    relicChance: 44,
    potionChance: 46,
  },
  4: {
    act: 4,
    cardChoices: 3,
    cardWeights: { common: 42, uncommon: 38, rare: 20 },
    relicWeights: { common: 35, uncommon: 40, rare: 25 },
    victoryGold: { min: 32, max: 45, eliteBonus: 20, bossBonus: 96 },
    rewardGold: { min: 29, max: 40 },
    relicChance: 50,
    potionChance: 40,
  },
};

function clampAct(act: number): number {
  if (!Number.isFinite(act)) return 1;
  return Math.min(4, Math.max(1, Math.floor(act)));
}

function pickWeightedKey<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, value]) => sum + Math.max(0, value), 0);
  if (total <= 0) return entries[0][0];

  let roll = randomInt(total);
  for (const [key, value] of entries) {
    const normalized = Math.max(0, value);
    if (roll < normalized) return key;
    roll -= normalized;
  }

  return entries[entries.length - 1][0];
}

function createCardWithRewardId(card: Card): Card {
  return {
    ...card,
    id: createRandomId(`reward_${card.id}`),
  };
}

function filterRewardCards(team: TeamType, rarity: CardRarity, excludedRoots: string[]): Card[] {
  return allCards.filter(card => {
    if (card.team !== 'neutral' && card.team !== team) return false;
    if (card.rarity !== rarity) return false;
    return !excludedRoots.some(id => id.includes(card.id));
  });
}

function getFallbackRarityOrder(rarity: CardRarity): CardRarity[] {
  if (rarity === 'rare') return ['rare', 'uncommon', 'common'];
  if (rarity === 'uncommon') return ['uncommon', 'common', 'rare'];
  return ['common', 'uncommon', 'rare'];
}

export function getRewardTableEntry(act: number): RewardTableEntry {
  return rewardTableByAct[clampAct(act)];
}

export function createRewardCardForAct(team: TeamType, act: number, excludedRoots: string[] = []): Card {
  const profile = getRewardTableEntry(act);
  const desiredRarity = pickWeightedKey(profile.cardWeights);

  for (const rarity of getFallbackRarityOrder(desiredRarity)) {
    const pool = filterRewardCards(team, rarity, excludedRoots);
    if (pool.length > 0) {
      return createCardWithRewardId(pool[randomInt(pool.length)]);
    }
  }

  const fallbackPool = allCards.filter(card => card.team === 'neutral' || card.team === team);
  return createCardWithRewardId(fallbackPool[randomInt(fallbackPool.length)]);
}

export function rollCombatVictoryGold(act: number, roomType: 'monster' | 'elite' | 'boss' = 'monster'): number {
  const profile = getRewardTableEntry(act);
  let amount = randomBetween(profile.victoryGold.min, profile.victoryGold.max);

  if (roomType === 'elite') amount += profile.victoryGold.eliteBonus;
  if (roomType === 'boss') amount += profile.victoryGold.bossBonus;

  return amount;
}

export function createCombatRewardOffer(params: {
  act: number;
  team: TeamType;
  existingRelicIds: string[];
  cardChoicePenalty?: number;
  forceRelic?: boolean;
}): CombatRewardOffer {
  const profile = getRewardTableEntry(params.act);
  const cardChoicePenalty = Math.max(0, params.cardChoicePenalty || 0);
  const rewardCards: Card[] = [];
  const excludedRoots: string[] = [];
  const cardChoices = Math.max(1, profile.cardChoices - cardChoicePenalty);

  for (let index = 0; index < cardChoices; index += 1) {
    const card = createRewardCardForAct(params.team, params.act, excludedRoots);
    rewardCards.push(card);
    excludedRoots.push(card.id);
  }

  const goldReward = randomBetween(profile.rewardGold.min, profile.rewardGold.max);
  const forceRelic = !!params.forceRelic;
  const relicReward = forceRelic || randomInt(100) < profile.relicChance
    ? getRandomRelic(pickWeightedKey(profile.relicWeights), false, params.team, params.existingRelicIds)
    : null;
  const potionReward = randomInt(100) < profile.potionChance ? getRandomPotion() : null;

  return {
    profile,
    rewardCards,
    relicReward,
    potionReward,
    goldReward,
  };
}
