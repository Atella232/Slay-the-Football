import type { Card, Effect } from '@/types/game';

function effectUpgradeDelta(effectType: string): number {
  switch (effectType) {
    case 'damage':
    case 'conditional_damage':
    case 'damage_all':
    case 'exhaust_hand_damage':
      return 3;
    case 'block':
    case 'conditional_block':
    case 'barricade':
    case 'block_per_turn':
      return 3;
    case 'draw':
    case 'draw_per_turn':
      return 1;
    case 'vulnerable':
    case 'weak':
    case 'weak_all':
      return 1;
    case 'energy':
    case 'conditional_energy':
    case 'gain_garra':
    case 'gain_posesion':
    case 'gain_momentum':
    case 'temp_strength_this_turn':
      return 1;
    case 'strength':
    case 'strength_conditional':
    case 'strength_when_low':
    case 'dexterity':
    case 'dexterity_when_low':
      return 1;
    default:
      return 1;
  }
}

function upgradeEffect(effect: Effect): Effect {
  const delta = effectUpgradeDelta(effect.type);
  return { ...effect, value: effect.value + delta };
}

function formatEffect(effect: Effect): string {
  const targetAll = effect.target === 'all_enemies';

  switch (effect.type) {
    case 'damage':
      return targetAll ? `Inflige ${effect.value} de dano a TODOS los enemigos` : `Inflige ${effect.value} de dano`;
    case 'conditional_damage':
      return `Inflige ${effect.value} de dano adicional (condicional)`;
    case 'damage_all':
      return `Al inicio del turno, inflige ${effect.value} de dano a TODOS los enemigos`;
    case 'damage_bonus_if_enemy_intent_attack':
      return `Si el enemigo va a atacar, inflige ${effect.value} de dano adicional`;
    case 'block':
      return `Gana ${effect.value} de bloqueo`;
    case 'conditional_block':
      return `Gana ${effect.value} de bloqueo adicional (condicional)`;
    case 'draw':
      return `Roba ${effect.value} carta${effect.value > 1 ? 's' : ''}`;
    case 'draw_per_turn':
      return `Al inicio de tu turno, roba ${effect.value} carta${effect.value > 1 ? 's' : ''} adicional${effect.value > 1 ? 'es' : ''}`;
    case 'energy':
      return `Gana ${effect.value} energia`;
    case 'conditional_energy':
      return `Gana ${effect.value} energia (condicional)`;
    case 'gain_garra':
      return `Gana ${effect.value} Garra`;
    case 'gain_posesion':
      return `Gana ${effect.value} Posesion`;
    case 'gain_momentum':
      return `Gana ${effect.value} Momentum`;
    case 'spend_garra':
      return `Consume hasta ${effect.value} Garra`;
    case 'spend_momentum':
      return `Consume hasta ${effect.value} Momentum`;
    case 'set_card_cost_temp':
      return `La carta de mayor coste en tu mano cuesta 0 este turno`;
    case 'retain_block_up_to':
      return `Retiene hasta ${effect.value} de bloqueo al final del turno`;
    case 'temp_strength_this_turn':
      return `Gana ${effect.value} de Fuerza Temporal este turno`;
    case 'vulnerable':
      return targetAll ? `Aplica ${effect.value} Vulnerable a TODOS los enemigos` : `Aplica ${effect.value} Vulnerable`;
    case 'weak':
    case 'weak_all':
      return targetAll ? `Aplica ${effect.value} Debil a TODOS los enemigos` : `Aplica ${effect.value} Debil`;
    case 'strength':
    case 'strength_conditional':
    case 'strength_when_low':
      return `Gana ${effect.value} de Fuerza`;
    case 'dexterity':
    case 'dexterity_when_low':
      return `Gana ${effect.value} de Destreza`;
    case 'next_card_free':
      return 'La siguiente carta cuesta 0';
    case 'next_skill_free':
      return 'La siguiente skill cuesta 0';
    case 'next_attack_free':
      return 'El siguiente ataque cuesta 0';
    case 'next_attack_double':
      return 'El siguiente ataque se juega dos veces';
    case 'discard':
      return `Descarta ${effect.value} carta${effect.value > 1 ? 's' : ''}`;
    case 'exhaust_hand_damage':
      return `Por cada carta agotada en mano, inflige ${effect.value} de dano`;
    case 'feel_no_pain':
      return `Cuando agotas una carta, gana ${effect.value} de bloqueo`;
    case 'dark_embrace':
      return `Cuando agotas una carta, roba ${effect.value} carta`;
    default:
      return `${effect.type}: ${effect.value}`;
  }
}

function buildDescriptionFromEffects(effects: Effect[]): string {
  return effects.map(formatEffect).join('. ') + '.';
}

export function getUpgradedCard(card: Card): Card {
  if (card.upgraded) return card;

  const upgradedEffects = card.effects.map(upgradeEffect);
  const reducedCost = card.type === 'power' ? card.cost : Math.max(0, card.cost - 1);

  return {
    ...card,
    name: card.name.endsWith('+') ? card.name : `${card.name}+`,
    cost: reducedCost,
    effects: upgradedEffects,
    description: buildDescriptionFromEffects(upgradedEffects),
    upgraded: true,
  };
}
