import { describe, expect, it } from 'vitest';

import { allEvents } from '@/data/events';

const supportedEffectTypes = new Set(['gold', 'heal', 'health', 'max_hp', 'remove_card', 'relic']);

describe('event pool coverage', () => {
  it('expands the event pool to at least twelve events with meaningful choice sets', () => {
    expect(allEvents.length).toBeGreaterThanOrEqual(12);

    for (const event of allEvents) {
      expect(event.options.length).toBeGreaterThanOrEqual(2);
      expect(event.title.length).toBeGreaterThan(0);
      expect(event.description.length).toBeGreaterThan(0);
    }
  });

  it('uses only effect types that the runtime event room can resolve', () => {
    for (const event of allEvents) {
      for (const option of event.options) {
        expect(option.effect).toBeTruthy();
        expect(supportedEffectTypes.has(option.effect!.type)).toBe(true);
      }
    }
  });

  it('keeps a healthy mix of economy, sustain, deck shaping, and relic rewards', () => {
    const counters = {
      gold: 0,
      heal: 0,
      maxHp: 0,
      removeCard: 0,
      relic: 0,
    };

    for (const event of allEvents) {
      for (const option of event.options) {
        switch (option.effect?.type) {
          case 'gold':
            counters.gold += 1;
            break;
          case 'heal':
          case 'health':
            counters.heal += 1;
            break;
          case 'max_hp':
            counters.maxHp += 1;
            break;
          case 'remove_card':
            counters.removeCard += 1;
            break;
          case 'relic':
            counters.relic += 1;
            break;
        }

        if (option.effect?.removeCard) counters.removeCard += 1;
      }
    }

    expect(counters.gold).toBeGreaterThanOrEqual(10);
    expect(counters.heal).toBeGreaterThanOrEqual(8);
    expect(counters.maxHp).toBeGreaterThanOrEqual(6);
    expect(counters.removeCard).toBeGreaterThanOrEqual(5);
    expect(counters.relic).toBeGreaterThanOrEqual(5);
  });
});
