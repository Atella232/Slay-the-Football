import { describe, expect, it } from 'vitest';

import type { Card } from '@/types/game';
import {
  discardCardsFromHand,
  exhaustHandCards,
  movePlayedCardToCombatPiles,
  resolveCardPlayCost,
  stripCardTempCost,
} from '@/lib/combat/cardFlow';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: overrides.id ?? 'card_test',
    name: overrides.name ?? 'Carta Test',
    type: overrides.type ?? 'attack',
    cost: overrides.cost ?? 1,
    tempCost: overrides.tempCost,
    description: overrides.description ?? 'Descripcion',
    effects: overrides.effects ?? [],
    rarity: overrides.rarity ?? 'common',
    team: overrides.team ?? 'neutral',
    keywords: overrides.keywords,
    upgraded: overrides.upgraded,
  };
}

describe('cardFlow helpers', () => {
  it('resolves next-card-free and next-attack-double together for attacks', () => {
    const result = resolveCardPlayCost(
      {
        energy: 1,
        nextAttackDouble: true,
        nextAttackFree: false,
        nextCardFree: true,
        nextSkillFree: false,
      },
      makeCard({ cost: 2, type: 'attack' })
    );

    expect(result.effectiveCost).toBe(0);
    expect(result.canPlay).toBe(true);
    expect(result.consumeNextCardFree).toBe(true);
    expect(result.consumeNextAttackDouble).toBe(true);
    expect(result.iterations).toBe(2);
  });

  it('does not consume skill-free on attacks and blocks unpayable cards', () => {
    const result = resolveCardPlayCost(
      {
        energy: 1,
        nextAttackDouble: false,
        nextAttackFree: false,
        nextCardFree: false,
        nextSkillFree: true,
      },
      makeCard({ cost: 2, type: 'attack' })
    );

    expect(result.effectiveCost).toBe(2);
    expect(result.canPlay).toBe(false);
    expect(result.consumeNextSkillFree).toBe(false);
  });

  it('routes exhaust cards to exhaust and strips temp cost', () => {
    const exhaustCard = makeCard({ id: 'muro', keywords: ['exhaust'], tempCost: 0, type: 'skill' });
    const filler = makeCard({ id: 'golpe' });

    const result = movePlayedCardToCombatPiles([filler, exhaustCard], [], 1);

    expect(result.nextHand.map(card => card.id)).toEqual(['golpe']);
    expect(result.cardToDiscard).toBeNull();
    expect(result.exhaustedByPlay).toBe(1);
    expect(result.nextExhaust).toHaveLength(1);
    expect(result.nextExhaust[0].id).toBe('muro');
    expect(result.nextExhaust[0].tempCost).toBeUndefined();
  });

  it('routes non-exhaust cards to discard payload', () => {
    const attack = makeCard({ id: 'golpe', tempCost: 0 });

    const result = movePlayedCardToCombatPiles([attack], [], 0);

    expect(result.nextHand).toHaveLength(0);
    expect(result.cardToDiscard?.id).toBe('golpe');
    expect(result.cardToDiscard?.tempCost).toBeUndefined();
    expect(result.nextExhaust).toHaveLength(0);
  });

  it('exhausts the whole hand preserving pile order and stripping temp cost', () => {
    const hand = [
      makeCard({ id: 'a', tempCost: 0 }),
      makeCard({ id: 'b', type: 'skill', tempCost: 1 }),
    ];
    const existingExhaust = [makeCard({ id: 'old' })];

    const result = exhaustHandCards(hand, existingExhaust);

    expect(result.exhaustCount).toBe(2);
    expect(result.nextHand).toEqual([]);
    expect(result.nextExhaust.map(card => card.id)).toEqual(['old', 'a', 'b']);
    expect(result.nextExhaust[1].tempCost).toBeUndefined();
    expect(result.nextExhaust[2].tempCost).toBeUndefined();
  });

  it('discards cards using current hand indexes in shrinking order', () => {
    const hand = [
      makeCard({ id: 'a' }),
      makeCard({ id: 'b', tempCost: 0 }),
      makeCard({ id: 'c' }),
      makeCard({ id: 'd' }),
    ];

    const result = discardCardsFromHand(hand, [1, 2]);

    expect(result.discardedCards.map(card => card.id)).toEqual(['b', 'd']);
    expect(result.discardedCards[0].tempCost).toBeUndefined();
    expect(result.nextHand.map(card => card.id)).toEqual(['a', 'c']);
  });

  it('strips temp cost without mutating the source card', () => {
    const card = makeCard({ id: 'temp', tempCost: 0 });
    const result = stripCardTempCost(card);

    expect(result.tempCost).toBeUndefined();
    expect(card.tempCost).toBe(0);
  });
});
