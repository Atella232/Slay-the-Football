import { createRandomId, randomChoice } from '@/lib/rng';
import type { Potion } from '@/types/game';

export const allPotions: Potion[] = [
  {
    id: 'potion_heal',
    name: 'Botiquin Rapido',
    description: 'Recupera 16 de vida.',
    effect: { type: 'heal', value: 16, target: 'self' },
  },
  {
    id: 'potion_block',
    name: 'Muro Instantaneo',
    description: 'Gana 14 de bloqueo.',
    effect: { type: 'block', value: 14, target: 'self' },
  },
  {
    id: 'potion_energy',
    name: 'Bebida Energetica',
    description: 'Gana 1 de energia este turno.',
    effect: { type: 'energy', value: 1, target: 'self' },
  },
  {
    id: 'potion_strength',
    name: 'Suero de Presion',
    description: 'Gana 3 de Fuerza.',
    effect: { type: 'strength', value: 3, target: 'self' },
  },
  {
    id: 'potion_bomb',
    name: 'Bomba Tactica',
    description: 'Inflige 14 de dano a todos los enemigos.',
    effect: { type: 'damage_all', value: 14, target: 'all_enemies' },
  },
  {
    id: 'potion_vulnerable',
    name: 'Spray Desestabilizador',
    description: 'Aplica 3 Vulnerable a todos los enemigos.',
    effect: { type: 'vulnerable', value: 3, target: 'all_enemies' },
  },
];

export function getRandomPotion(): Potion {
  const potion = randomChoice(allPotions);
  return {
    ...potion,
    id: createRandomId(potion.id),
  };
}
