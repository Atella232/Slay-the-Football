import type { Card, Player } from '@/types/game';

type CardCostPlayer = Pick<Player, 'energy' | 'nextAttackDouble' | 'nextAttackFree' | 'nextCardFree' | 'nextSkillFree'>;
type CardCostCard = Pick<Card, 'cost' | 'tempCost' | 'type'>;

export interface CardCostResolution {
  canPlay: boolean;
  cardCost: number;
  consumeNextAttackDouble: boolean;
  consumeNextAttackFree: boolean;
  consumeNextCardFree: boolean;
  consumeNextSkillFree: boolean;
  effectiveCost: number;
  iterations: number;
}

export interface PlayedCardPileResult {
  cardToDiscard: Card | null;
  exhaustedByPlay: number;
  nextExhaust: Card[];
  nextHand: Card[];
  playedCard: Card | null;
}

export interface ExhaustHandResult {
  exhaustCount: number;
  exhaustedCards: Card[];
  nextExhaust: Card[];
  nextHand: Card[];
}

export interface DiscardCardsResult {
  discardedCards: Card[];
  nextHand: Card[];
}

export function stripCardTempCost(cardValue: Card): Card {
  const rest = { ...cardValue };
  delete rest.tempCost;
  return rest;
}

export function resolveCardPlayCost(player: CardCostPlayer, card: CardCostCard): CardCostResolution {
  const cardCost = card.tempCost ?? card.cost;
  let effectiveCost = cardCost;
  let consumeNextCardFree = false;
  let consumeNextSkillFree = false;
  let consumeNextAttackFree = false;

  if (player.nextCardFree) {
    effectiveCost = 0;
    consumeNextCardFree = true;
  } else if (player.nextSkillFree && card.type === 'skill') {
    effectiveCost = 0;
    consumeNextSkillFree = true;
  } else if (player.nextAttackFree && card.type === 'attack') {
    effectiveCost = 0;
    consumeNextAttackFree = true;
  }

  const consumeNextAttackDouble = !!player.nextAttackDouble && card.type === 'attack';

  return {
    canPlay: player.energy >= effectiveCost,
    cardCost,
    consumeNextAttackDouble,
    consumeNextAttackFree,
    consumeNextCardFree,
    consumeNextSkillFree,
    effectiveCost,
    iterations: consumeNextAttackDouble ? 2 : 1,
  };
}

export function movePlayedCardToCombatPiles(hand: Card[], exhaust: Card[], cardIndex: number): PlayedCardPileResult {
  const playedCard = hand[cardIndex];
  if (!playedCard) {
    return {
      cardToDiscard: null,
      exhaustedByPlay: 0,
      nextExhaust: [...exhaust],
      nextHand: [...hand],
      playedCard: null,
    };
  }

  const nextHand = [...hand];
  nextHand.splice(cardIndex, 1);

  const exhaustedByPlay = playedCard.keywords?.includes('exhaust') ? 1 : 0;
  if (exhaustedByPlay > 0) {
    return {
      cardToDiscard: null,
      exhaustedByPlay,
      nextExhaust: [...exhaust, stripCardTempCost(playedCard)],
      nextHand,
      playedCard,
    };
  }

  return {
    cardToDiscard: stripCardTempCost(playedCard),
    exhaustedByPlay,
    nextExhaust: [...exhaust],
    nextHand,
    playedCard,
  };
}

export function exhaustHandCards(hand: Card[], exhaust: Card[]): ExhaustHandResult {
  const exhaustedCards = hand.map(stripCardTempCost);
  return {
    exhaustCount: exhaustedCards.length,
    exhaustedCards,
    nextExhaust: [...exhaust, ...exhaustedCards],
    nextHand: [],
  };
}

export function discardCardsFromHand(hand: Card[], currentIndexes: number[]): DiscardCardsResult {
  const nextHand = [...hand];
  const discardedCards: Card[] = [];

  currentIndexes.forEach(index => {
    if (index < 0 || index >= nextHand.length) return;
    const [selected] = nextHand.splice(index, 1);
    if (!selected) return;
    discardedCards.push(stripCardTempCost(selected));
  });

  return {
    discardedCards,
    nextHand,
  };
}
