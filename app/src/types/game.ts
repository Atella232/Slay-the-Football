// Tipos principales del juego Climb the League

export type TeamType = 'athletic' | 'barcelona' | 'madrid';
export type CardType = 'attack' | 'skill' | 'power';
export type CardRarity = 'common' | 'uncommon' | 'rare';
export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'boss';
export type RoomType = 'monster' | 'elite' | 'rest' | 'event' | 'treasure' | 'shop' | 'boss' | 'unknown';

export interface Effect {
  type: string;
  value: number;
  target?: 'self' | 'enemy' | 'all_enemies';
  condition?: string;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  tempCost?: number;
  description: string;
  effects: Effect[];
  rarity: CardRarity;
  team: TeamType | 'neutral';
  keywords?: string[];
  upgraded?: boolean;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  team?: TeamType;
  effect: Effect;
}

export interface Buff {
  id: string;
  name: string;
  value: number;
  duration?: number;
}

export interface Debuff {
  id: string;
  name: string;
  value: number;
  duration?: number;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  intent: Intent;
  buffs: Buff[];
  debuffs: Debuff[];
  isElite?: boolean;
  isBoss?: boolean;
  didAttackLastTurn?: boolean;
}

export interface Intent {
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown';
  value?: number;
  description: string;
}

export interface Room {
  id: string;
  type: RoomType;
  x: number;
  y: number;
  connections: string[];
  visited?: boolean;
  enemy?: Enemy;
}

export interface Map {
  act: number;
  rooms: Room[];
  currentRoomId: string | null;
}

export interface Player {
  team: TeamType;
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  exhaust: Card[];
  drawPile: Card[];
  relics: Relic[];
  gold: number;
  buffs: Buff[];
  debuffs: Debuff[];
  nextCardFree?: boolean;
  cardsPlayedThisTurn?: number;
  thorns?: number; // Daño reflejado cuando atacado
  nextSkillFree?: boolean; // Próxima skill cuesta 0
  nextAttackFree?: boolean; // Próximo ataque cuesta 0
  nextAttackDouble?: boolean; // Próxima carta de ataque se juega dos veces
  drawPerTurn?: number; // Cartas extra por turno (de powers)
  blockPerTurn?: number; // Bloqueo al inicio del turno (barricade)
  relicCounters?: Record<string, number>; // Contadores para reliquias (ej: Penalti, Campeón)
  attacksPlayedThisTurn?: number; // Contador de ataques jugados este turno
  blockOnExhaust?: number; // Bloqueo por carta agotada
  drawOnExhaust?: number; // Robo por carta agotada
  pendingRestEnergy?: number; // Energía extra para el próximo combate tras descansar
  potions: Potion[];
  maxPotionSlots: number;
  garra?: number;
  posesion?: number;
  momentum?: number;
  previousCardType?: CardType;
  athleticExhaustBonusUsedThisTurn?: boolean;
  barcaPassiveUsedThisTurn?: boolean;
  madridPassiveUsedThisTurn?: boolean;
  blockRetainCap?: number;
  skillsPlayedThisTurn?: number;
  firstBlockBonusUsedThisTurn?: boolean;
  firstBlockBonusUsedThisCombat?: boolean;
  firstExhaustDrawUsedThisTurn?: boolean;
  bloodiedStrengthUsed?: boolean;
  genRemontadaExtraGainsThisCombat?: number;
  cardRemovalCount?: number;
}

export interface DamageEffect {
  id: string;
  damage: number;
  isCrit: boolean;
  isHeal: boolean;
  target: 'player' | 'enemy';
  targetIndex?: number;
}

export interface GameState {
  player: Player;
  map: Map;
  enemies: Enemy[];
  turn: number;
  inCombat: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  victory: boolean;
  showReward: boolean;
  rewardType: 'combat' | 'boss' | 'rest' | 'treasure' | 'shop' | 'event' | null;
  currentEvent?: GameEvent | null;
  damageEffects: DamageEffect[];
  unlockedTeams: TeamType[];
  ascension: number;
}

export interface Potion {
  id: string;
  name: string;
  description: string;
  effect: Effect;
}

export interface ShopItem {
  type: 'card' | 'relic' | 'potion' | 'remove';
  item: Card | Relic | Potion | null;
  price: number;
}

// EVENTOS
export interface EventOption {
  text: string;
  effect?: {
    type: 'gold' | 'health' | 'card' | 'relic' | 'remove_card' | 'transform_card' | 'damage' | 'heal' | 'max_hp';
    value?: number;
    target?: string; // id de carta/reliquia o 'random'
    description?: string; // Descripción del efecto para tooltip
  };
  condition?: {
    type: 'gold_min' | 'hp_min' | 'card_has' | 'relic_has';
    value: number | string;
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  image?: string; // Emojis por ahora
  options: EventOption[];
}
