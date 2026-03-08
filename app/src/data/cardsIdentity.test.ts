import { describe, expect, it } from 'vitest';

import { athleticCards, barcelonaCards, getStartingDeck, madridCards } from '@/data/cards';
import type { Card } from '@/types/game';

function countCards(cards: Card[], predicate: (card: Card) => boolean) {
  return cards.filter(predicate).length;
}

function hasAnyEffect(card: Card, types: string[]) {
  return card.effects.some(effect => types.includes(effect.type));
}

function hasAnyCondition(card: Card, conditions: string[]) {
  return card.effects.some(effect => effect.condition && conditions.includes(effect.condition));
}

describe('team card identities', () => {
  it('keeps Athletic focused on garra, exhaust, and block retention', () => {
    const identityCards = countCards(
      athleticCards,
      card =>
        !!card.keywords?.includes('exhaust') ||
        hasAnyEffect(card, ['gain_garra', 'spend_garra', 'feel_no_pain', 'dark_embrace', 'retain_block_up_to', 'exhaust_hand_damage']),
    );

    expect(identityCards).toBeGreaterThanOrEqual(10);
    expect(getStartingDeck('athletic').some(card => !!card.keywords?.includes('exhaust'))).toBe(true);
  });

  it('gives Barcelona both possession scaling and low-cost chaining from the core pool', () => {
    const possessionCards = countCards(barcelonaCards, card => hasAnyEffect(card, ['gain_posesion', 'trigger_posesion_threshold']));
    const chainCards = countCards(barcelonaCards, card => hasAnyEffect(card, ['draw', 'next_card_free', 'next_skill_free', 'reduce_hand_cost', 'draw_per_turn']));
    const barcaStartingDeck = getStartingDeck('barcelona');

    expect(possessionCards).toBeGreaterThanOrEqual(8);
    expect(chainCards).toBeGreaterThanOrEqual(9);
    expect(barcaStartingDeck.some(card => hasAnyEffect(card, ['gain_posesion']))).toBe(true);

    const posesionTotal = barcelonaCards.find(card => card.id === 'posesion_total');
    const campNou = barcelonaCards.find(card => card.id === 'camp_nou');
    expect(posesionTotal?.description).not.toBe(campNou?.description);
  });

  it('gives Madrid explicit momentum setup and skill-into-burst finishers', () => {
    const momentumCards = countCards(madridCards, card => hasAnyEffect(card, ['gain_momentum', 'spend_momentum']));
    const burstCards = countCards(
      madridCards,
      card => hasAnyEffect(card, ['next_attack_free', 'next_attack_double']) || hasAnyCondition(card, ['previous_card_skill', 'momentum_3']),
    );
    const madridStartingDeck = getStartingDeck('madrid');

    expect(momentumCards).toBeGreaterThanOrEqual(8);
    expect(burstCards).toBeGreaterThanOrEqual(8);
    expect(madridStartingDeck.some(card => hasAnyEffect(card, ['gain_momentum', 'next_attack_free']))).toBe(true);
  });
});
