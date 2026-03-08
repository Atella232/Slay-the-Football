import { describe, expect, it } from 'vitest';

import {
  BASE_BOSS_TRANSITION_HEAL_RATIO,
  BASE_REST_HEAL_RATIO,
  BASE_TRAIN_HEAL_RATIO,
  getAscensionTuning,
} from '@/lib/ascension';

describe('ascension tuning', () => {
  it('keeps boss damage scaling separate from regular enemy damage', () => {
    const tuning = getAscensionTuning(8);

    expect(tuning.enemyDamageMultiplier).toBeCloseTo(1.1, 5);
    expect(tuning.bossDamageMultiplier).toBeCloseTo(1.1, 5);
  });

  it('moderates economy pressure and sustain at high ascension', () => {
    const tuning = getAscensionTuning(19);

    expect(tuning.shopPriceMultiplier).toBeCloseTo(1.1236, 4);
    expect(tuning.goldRewardMultiplier).toBeCloseTo(0.8648, 4);
    expect(tuning.restHealMultiplier).toBeCloseTo(0.8464, 4);
  });

  it('exports the new baseline heal ratios for hostal and boss transition', () => {
    expect(BASE_REST_HEAL_RATIO).toBeCloseTo(0.26, 5);
    expect(BASE_TRAIN_HEAL_RATIO).toBeCloseTo(0.13, 5);
    expect(BASE_BOSS_TRANSITION_HEAL_RATIO).toBeCloseTo(0.24, 5);
  });
});
