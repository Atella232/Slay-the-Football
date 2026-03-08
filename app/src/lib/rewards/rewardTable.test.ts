import { describe, expect, it } from 'vitest';

import { createCombatRewardOffer, createRewardCardForAct, getRewardTableEntry, rollCombatVictoryGold } from '@/lib/rewards/rewardTable';
import { setRngSeed } from '@/lib/rng';

describe('reward table', () => {
  it('scales gold and rarity pressure upward with each act', () => {
    const act1 = getRewardTableEntry(1);
    const act4 = getRewardTableEntry(4);

    expect(act4.cardWeights.rare).toBeGreaterThan(act1.cardWeights.rare);
    expect(act4.relicWeights.rare).toBeGreaterThan(act1.relicWeights.rare);
    expect(act4.victoryGold.min).toBeGreaterThan(act1.victoryGold.min);
    expect(act4.rewardGold.max).toBeGreaterThan(act1.rewardGold.max);
  });

  it('builds combat reward offers from the team or neutral pools and avoids duplicate card roots', () => {
    setRngSeed(20260308);
    const offer = createCombatRewardOffer({
      act: 2,
      team: 'barcelona',
      existingRelicIds: [],
    });

    expect(offer.rewardCards.length).toBe(3);
    expect(offer.goldReward).toBeGreaterThanOrEqual(offer.profile.rewardGold.min);
    expect(offer.goldReward).toBeLessThanOrEqual(offer.profile.rewardGold.max);
    expect(offer.rewardCards.every(card => card.team === 'neutral' || card.team === 'barcelona')).toBe(true);

    const uniqueRoots = new Set(offer.rewardCards.map(card => `${card.name}|${card.team}|${card.rarity}`));
    expect(uniqueRoots.size).toBe(offer.rewardCards.length);
  });

  it('guarantees a relic when the offer is forced for elite rewards', () => {
    setRngSeed(17);
    const offer = createCombatRewardOffer({
      act: 1,
      team: 'athletic',
      existingRelicIds: [],
      forceRelic: true,
    });

    expect(offer.relicReward).not.toBeNull();
    expect(offer.relicReward?.rarity).not.toBe('boss');
  });

  it('produces more rare card rewards in act 4 than in act 1 over a seeded sample', () => {
    setRngSeed(77);
    let act1Rare = 0;
    for (let index = 0; index < 240; index += 1) {
      if (createRewardCardForAct('athletic', 1).rarity === 'rare') act1Rare += 1;
    }

    setRngSeed(77);
    let act4Rare = 0;
    for (let index = 0; index < 240; index += 1) {
      if (createRewardCardForAct('athletic', 4).rarity === 'rare') act4Rare += 1;
    }

    expect(act4Rare).toBeGreaterThan(act1Rare);
  });

  it('keeps act 1 relic rolls away from rare relics while act 4 can surface them', () => {
    setRngSeed(31415);
    let act1RareRelics = 0;
    for (let index = 0; index < 240; index += 1) {
      const reward = createCombatRewardOffer({ act: 1, team: 'madrid', existingRelicIds: [] });
      if (reward.relicReward?.rarity === 'rare') act1RareRelics += 1;
    }

    setRngSeed(31415);
    let act4RareRelics = 0;
    for (let index = 0; index < 240; index += 1) {
      const reward = createCombatRewardOffer({ act: 4, team: 'madrid', existingRelicIds: [] });
      if (reward.relicReward?.rarity === 'rare') act4RareRelics += 1;
    }

    expect(act1RareRelics).toBe(0);
    expect(act4RareRelics).toBeGreaterThan(0);
  });

  it('adds elite and boss gold on top of the base act curve', () => {
    setRngSeed(99);
    const monster = rollCombatVictoryGold(3, 'monster');
    setRngSeed(99);
    const elite = rollCombatVictoryGold(3, 'elite');
    setRngSeed(99);
    const boss = rollCombatVictoryGold(3, 'boss');

    expect(elite).toBeGreaterThan(monster);
    expect(boss).toBeGreaterThan(elite);
  });

  it('keeps the early-economy bands tighter after the balance pass', () => {
    const act1 = getRewardTableEntry(1);
    const act4 = getRewardTableEntry(4);

    expect(act1.victoryGold.max).toBe(20);
    expect(act1.rewardGold.max).toBe(18);
    expect(act4.victoryGold.max).toBe(45);
    expect(act4.rewardGold.max).toBe(40);
  });
});
