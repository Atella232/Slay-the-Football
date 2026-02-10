import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Room, Enemy, Card, TeamType, Relic, DamageEffect, Potion } from '@/types/game';
import { allCards, getStartingDeck } from '@/data/cards';
import { starterRelics, getRandomRelic } from '@/data/relics';
import { getRandomEnemy, getBossForAct, generateRandomIntent } from '@/data/enemies';
import { allEvents } from '@/data/events';
import { getAscensionTuning, scaleInt } from '@/lib/ascension';
import { getUpgradedCard } from '@/lib/cardUpgrade';
import {
  createRunSession,
  persistFinishedRun,
  type CardPickSource,
  type RelicPickSource,
  type RunResult,
  type TelemetryRunSession,
  type TelemetryRunSummary,
} from '@/lib/telemetry';


interface GameStore extends GameState {
  // Acciones
  startGame: (team: TeamType) => void;
  setAscension: (level: number) => void;
  selectRoom: (roomId: string) => void;
  playCard: (cardIndex: number, targetIndex?: number) => void;
  endTurn: () => void;
  drawCards: (amount: number) => void;
  shuffleDeck: () => void;
  addCardToDeck: (card: Card, source?: CardPickSource) => void;
  removeCardFromDeck: (cardId: string) => void;
  addRelic: (relic: Relic, source?: RelicPickSource) => void;
  healPlayer: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  damageEnemy: (enemyIndex: number, amount: number) => void;
  applyBlock: (amount: number) => void;
  addGold: (amount: number) => void;
  upgradeCard: (cardId: string) => void;
  restAtSite: () => void;
  unlockTeam: (team: TeamType) => void;
  closeReward: () => void;
  addDamageEffect: (effect: DamageEffect) => void;
  clearDamageEffect: (effectId: string) => void;
  clearDamageEffects: () => void;
  // Relic effects
  applyRelicEffectsAtCombatStart: () => void;
  applyRelicEffectsAfterCombat: () => void;
  // Buff system
  addBuffToPlayer: (id: string, name: string, value: number) => void;
  getPlayerBuff: (id: string) => number;
  resetGame: () => void;
  startTurn: () => void;
  buyCard: (card: Card, cost: number) => boolean;
  buyRelic: (relic: Relic, cost: number) => boolean;
  buyPotion: (potion: Potion, cost: number) => boolean;
  addPotion: (potion: Potion) => boolean;
  consumePotion: (potionIndex: number, targetIndex?: number) => boolean;
  setMaxHp: (amount: number) => void;
  advanceAfterBossReward: () => void;
  telemetryRun: TelemetryRunSession | null;


}

const initialState: GameState = {
  player: {
    team: 'athletic',
    hp: 85,
    maxHp: 85,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    hand: [],
    deck: [],
    discard: [],
    exhaust: [],
    drawPile: [],
    relics: [],
    buffs: [],
    debuffs: [],
    gold: 0,
    nextCardFree: false,
    cardsPlayedThisTurn: 0,
    potions: [],
    maxPotionSlots: 3,
    garra: 0,
    posesion: 0,
    momentum: 0,
    previousCardType: undefined,
    athleticExhaustBonusUsedThisTurn: false,
    barcaPassiveUsedThisTurn: false,
    madridPassiveUsedThisTurn: false,
    blockRetainCap: 0,
    skillsPlayedThisTurn: 0,
    firstBlockBonusUsedThisTurn: false,
    firstBlockBonusUsedThisCombat: false,
    firstExhaustDrawUsedThisTurn: false,
    bloodiedStrengthUsed: false,
    genRemontadaExtraGainsThisCombat: 0,
    cardRemovalCount: 0,
  },
  map: {
    act: 1,
    rooms: [],
    currentRoomId: null,
  },
  enemies: [],
  turn: 1,
  inCombat: false,
  gameStarted: false,
  gameOver: false,
  victory: false,
  showReward: false,
  rewardType: null,
  damageEffects: [],
  unlockedTeams: ['athletic'],
  ascension: 0,
};

// Generar mapa procedural
function getEliteTargetForAct(act: number, ascension: number): number {
  const tuning = getAscensionTuning(ascension);
  const eliteBonus = tuning.eliteTargetBonus;
  if (act === 1) return 1;
  if (act === 2) return 2 + eliteBonus;
  if (act === 4) return (Math.random() < 0.5 ? 3 : 4) + eliteBonus;
  return (Math.random() < 0.5 ? 2 : 3) + eliteBonus;
}

function applyAscensionToEnemy(enemy: Enemy, ascension: number): Enemy {
  const tuning = getAscensionTuning(ascension);
  let hpMultiplier = tuning.enemyHpMultiplier;
  if (enemy.isElite) hpMultiplier *= tuning.eliteHpMultiplier;
  if (enemy.isBoss) hpMultiplier *= tuning.bossHpMultiplier;

  const scaledHp = scaleInt(enemy.maxHp, hpMultiplier, 1);
  return {
    ...enemy,
    maxHp: scaledHp,
    hp: scaledHp,
  };
}

function resolveUnknownRoomType(): Exclude<Room['type'], 'unknown' | 'boss'> {
  const rand = Math.random();
  if (rand < 0.35) return 'monster';
  if (rand < 0.52) return 'event';
  if (rand < 0.67) return 'shop';
  if (rand < 0.79) return 'rest';
  if (rand < 0.92) return 'treasure';
  return 'elite';
}

export function generateMap(act: number, ascension: number): Room[] {
  const rooms: Room[] = [];
  const rows = act === 4 ? 13 : 15 + Math.floor(Math.random() * 3); // 13 en Acto 4, 15-17 resto
  const cols = 7;

  for (let y = 0; y < rows; y++) {
    let numRooms = Math.floor(Math.random() * 2) + 3; // 3-4
    if (y === 0) numRooms = 3;
    if (y === rows - 1) numRooms = 1;

    const positions: number[] = [];
    if (y === rows - 1) {
      positions.push(Math.floor(cols / 2));
    } else {
      while (positions.length < numRooms) {
        const pos = Math.floor(Math.random() * cols);
        if (!positions.includes(pos)) positions.push(pos);
      }
      positions.sort((a, b) => a - b);
    }

    for (const x of positions) {
      let type: Room['type'];
      if (y === 0) {
        type = 'monster';
      } else if (y === rows - 1) {
        type = 'boss';
      } else {
        const rand = Math.random();
        if (act === 4) {
          if (rand < 0.12) type = 'unknown';
          else if (rand < 0.37) type = 'monster';
          else if (rand < 0.52) type = 'event';
          else if (rand < 0.65) type = 'rest';
          else if (rand < 0.76) type = 'shop';
          else type = 'elite';
        } else {
          if (rand < 0.18) type = 'unknown';
          else if (rand < 0.50) type = 'monster';
          else if (rand < 0.62) type = 'event';
          else if (rand < 0.74) type = 'rest';
          else if (rand < 0.86) type = 'shop';
          else type = 'elite';
        }
      }

      rooms.push({
        id: `room_${y}_${x}`,
        type,
        x,
        y,
        connections: [],
        visited: false,
      });
    }
  }

  // Conexiones hacia la siguiente fila
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const nextRowRooms = rooms.filter(r => r.y === room.y + 1);
    for (const nextRoom of nextRowRooms) {
      if (Math.abs(nextRoom.x - room.x) <= 2) {
        room.connections.push(nextRoom.id);
      }
    }
  }

  // Asegurar al menos un padre para cada sala (excepto fila 0)
  for (const room of rooms) {
    if (room.y === 0) continue;
    const hasParent = rooms.some(r => r.y === room.y - 1 && r.connections.includes(room.id));
    if (!hasParent) {
      const prevRowRooms = rooms.filter(r => r.y === room.y - 1);
      if (prevRowRooms.length > 0) {
        prevRowRooms.sort((a, b) => Math.abs(a.x - room.x) - Math.abs(b.x - room.x));
        prevRowRooms[0].connections.push(room.id);
      }
    }
  }

  // Asegurar al menos una conexión de salida para cada sala no final.
  // Evita "callejones sin salida" que bloquean la llegada al jefe.
  for (const room of rooms) {
    if (room.y >= rows - 1) continue;
    if (room.connections.length > 0) continue;

    const nextRowRooms = rooms.filter(r => r.y === room.y + 1);
    if (nextRowRooms.length === 0) continue;

    nextRowRooms.sort((a, b) => Math.abs(a.x - room.x) - Math.abs(b.x - room.x));
    room.connections.push(nextRowRooms[0].id);
  }

  // Limpiar duplicados defensivamente después de ajustes de conectividad.
  rooms.forEach(room => {
    room.connections = [...new Set(room.connections)];
  });

  // Sala de tesoro garantizada alrededor del medio
  const treasureBand = rooms.filter(r => r.y >= Math.floor(rows * 0.45) && r.y <= Math.floor(rows * 0.6) && r.type !== 'boss');
  if (treasureBand.length > 0) {
    const treasureRoom = treasureBand[Math.floor(Math.random() * treasureBand.length)];
    treasureRoom.type = 'treasure';
  }

  // Ajustar cantidad de élites por acto
  const targetElite = getEliteTargetForAct(act, ascension);
  const eliteRooms = rooms.filter(r => r.type === 'elite');
  if (eliteRooms.length > targetElite) {
    const toDowngrade = shuffleArray([...eliteRooms]).slice(0, eliteRooms.length - targetElite);
    toDowngrade.forEach(room => { room.type = 'monster'; });
  } else if (eliteRooms.length < targetElite) {
    const candidates = rooms.filter(r => r.type === 'monster' && r.y > 0 && r.y < rows - 1);
    const toUpgrade = shuffleArray(candidates).slice(0, targetElite - eliteRooms.length);
    toUpgrade.forEach(room => { room.type = 'elite'; });
  }

  // Garantizar al menos una tienda y una sala de descanso por acto
  const nonFixed = rooms.filter(r => r.y > 0 && r.y < rows - 1 && r.type !== 'treasure');
  if (!rooms.some(r => r.type === 'shop') && nonFixed.length > 0) {
    nonFixed[Math.floor(Math.random() * nonFixed.length)].type = 'shop';
  }
  if (!rooms.some(r => r.type === 'rest') && nonFixed.length > 0) {
    nonFixed[Math.floor(Math.random() * nonFixed.length)].type = 'rest';
  }

  return rooms;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createRewardCard(team: TeamType): Card {
  const pool = allCards.filter(card => card.team === 'neutral' || card.team === team);
  const card = pool[Math.floor(Math.random() * pool.length)];
  return { ...card, id: `generated_${card.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
}

function buildRunSummary(session: TelemetryRunSession, state: GameState, result: RunResult): TelemetryRunSummary {
  const deck = state.player.deck;
  const deckSize = deck.length;
  const attackCards = deck.filter(card => card.type === 'attack').length;
  const skillCards = deck.filter(card => card.type === 'skill').length;
  const powerCards = deck.filter(card => card.type === 'power').length;
  const turns = Math.max(1, session.turns);

  return {
    runId: session.runId,
    team: session.team,
    ascension: session.ascension,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    result,
    actReached: Math.max(session.actReached, state.map.act),
    floorsVisited: session.floorsVisited,
    turns,
    totalDamageDealt: session.totalDamageDealt,
    totalDamageTaken: session.totalDamageTaken,
    avgDamageDealtPerTurn: session.totalDamageDealt / turns,
    avgDamageTakenPerTurn: session.totalDamageTaken / turns,
    deckSize,
    attackCards,
    skillCards,
    powerCards,
    relicCount: state.player.relics.length,
    potionCount: state.player.potions.length,
    goldAtEnd: state.player.gold,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      telemetryRun: null,

      startGame: (team: TeamType) => {
        const ascension = get().ascension;
        const tuning = getAscensionTuning(ascension);
        const deck = getStartingDeck(team);
        const startingRelic = starterRelics[team];
        const baseMaxHp = team === 'athletic' ? 85 : team === 'barcelona' ? 75 : 80;
        const maxHp = Math.max(1, baseMaxHp - tuning.playerMaxHpPenalty);

        set({
          player: {
            team,
            hp: maxHp,
            maxHp,
            block: 0,
            energy: 3,
            maxEnergy: 3,
            hand: [],
            deck: [...deck],
            discard: [],
            exhaust: [],
            drawPile: [...deck],
            relics: [startingRelic],
            buffs: [],
            debuffs: [],
            gold: 0,
            relicCounters: {},
            attacksPlayedThisTurn: 0,
            blockOnExhaust: 0,
            drawOnExhaust: 0,
            pendingRestEnergy: 0,
            potions: [],
            maxPotionSlots: tuning.maxPotionSlots,
            garra: 0,
            posesion: 0,
            momentum: 0,
            previousCardType: undefined,
            athleticExhaustBonusUsedThisTurn: false,
            barcaPassiveUsedThisTurn: false,
            madridPassiveUsedThisTurn: false,
            blockRetainCap: 0,
            skillsPlayedThisTurn: 0,
            firstBlockBonusUsedThisTurn: false,
            firstBlockBonusUsedThisCombat: false,
            firstExhaustDrawUsedThisTurn: false,
            bloodiedStrengthUsed: false,
            genRemontadaExtraGainsThisCombat: 0,
            cardRemovalCount: 0,
          },
          map: {
            act: 1,
            rooms: generateMap(1, ascension),
            currentRoomId: null,
          },
          enemies: [],
          turn: 1,
          inCombat: false,
          gameStarted: true,
          gameOver: false,
          victory: false,
          showReward: false,
          rewardType: null,
          currentEvent: null,
          telemetryRun: createRunSession(team, ascension),
        });
      },

      setAscension: (level: number) => {
        const clamped = Math.max(0, Math.min(20, Math.floor(level)));
        set({ ascension: clamped });
      },

      selectRoom: (roomId: string) => {
        const { map, player } = get();
        const ascension = get().ascension;
        const tuning = getAscensionTuning(ascension);
        const currentRoom = map.rooms.find(r => r.id === map.currentRoomId);
        const reachableRoomIds = currentRoom
          ? currentRoom.connections.length > 0
            ? currentRoom.connections
            : map.rooms.filter(r => r.y === currentRoom.y + 1).map(r => r.id)
          : map.rooms.filter(r => r.y === 0).map(r => r.id);

        if (!reachableRoomIds.includes(roomId)) return;

        let workingMap = map;
        let room = workingMap.rooms.find(r => r.id === roomId);
        if (!room || room.visited) return;

        set(state => ({
          telemetryRun: state.telemetryRun
            ? {
                ...state.telemetryRun,
                floorsVisited: state.telemetryRun.floorsVisited + 1,
                actReached: Math.max(state.telemetryRun.actReached, map.act),
              }
            : state.telemetryRun,
        }));

        if (room.type === 'unknown') {
          const resolvedType = resolveUnknownRoomType();
          const resolvedRooms = workingMap.rooms.map(r =>
            r.id === roomId ? { ...r, type: resolvedType } : r
          );
          workingMap = { ...workingMap, rooms: resolvedRooms };
          room = resolvedRooms.find(r => r.id === roomId);
          if (!room) return;
        }

        // Reliquia Título de Liga: No puedes descansar en Hoteles
        const tituloLiga = player.relics.find(r => r.id.startsWith('titulo_liga'));
        if (room.type === 'rest' && tituloLiga) {
          // Si tiene Título de Liga, la sala de descanso no hace nada (o se salta)
          // Para simplificar, marcaremos como visitada pero no mostraremos recompensa
          const updatedRooms = workingMap.rooms.map(r =>
            r.id === roomId ? { ...r, visited: true } : r
          );
          set({
            map: { ...workingMap, rooms: updatedRooms, currentRoomId: roomId },
            currentEvent: null,
            showReward: false,
            rewardType: null,
          });
          return;
        }

        const updatedRooms = workingMap.rooms.map(r =>
          r.id === roomId ? { ...r, visited: true } : r
        );

        let enemies: Enemy[] = [];
        let inCombat = false;
        let showReward = false;
        let rewardType: GameState['rewardType'] = null;
        let nextEvent = null;

        if (room.type === 'monster' || room.type === 'elite' || room.type === 'boss') {
          const rawEnemies = room.type === 'boss'
            ? [getBossForAct(workingMap.act)]
            : room.type === 'elite'
              ? [getRandomEnemy(workingMap.act, true)]
              : [getRandomEnemy(workingMap.act)];
          enemies = rawEnemies.map(enemy => applyAscensionToEnemy(enemy, ascension));
          inCombat = true;
        } else if (room.type === 'rest') {
          showReward = true;
          rewardType = 'rest';
        } else if (room.type === 'treasure') {
          const newRelic = getRandomRelic(undefined, false, player.team, player.relics.map(relic => relic.id));
          get().addRelic(newRelic, 'treasure');
          showReward = true;
          rewardType = 'treasure';
        } else if (room.type === 'shop') {
          showReward = true;
          rewardType = 'shop';
        } else if (room.type === 'event') {
          nextEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
          showReward = true;
          rewardType = 'event';
        }

        // Aplicar efectos de reliquias al inicio de combate
        if (inCombat) {
          player.relics.forEach(relic => {
            if (relic.effect.type === 'draw_start') {
              // Se aplicará al robar
            }
          });
        }

        set({
          map: { ...workingMap, rooms: updatedRooms, currentRoomId: roomId },
          enemies,
          inCombat,
          showReward,
          rewardType,
          currentEvent: nextEvent,
          turn: 1,
        });

        if (inCombat) {
          // Resetear estado del jugador para el nuevo combate
          const currentPlayer = get().player;

          let currentDrawPile = [...currentPlayer.deck];

          // Lógica de reliquia Champions League (mejorar básicos al inicio)
          const championsLeague = currentPlayer.relics.find(r => r.effect.type === 'upgrade_basic');
          if (championsLeague) {
            currentDrawPile = currentDrawPile.map(card => {
              if (['Golpeo', 'Disparo', 'Pase Corto', 'Cobertura', 'Marcaje', 'Posicionamiento'].includes(card.name)) {
                return getUpgradedCard(card);
              }
              return card;
            });
          }

          set({
            player: {
              ...currentPlayer,
              hand: [],
              block: 0,
              energy: currentPlayer.maxEnergy + (currentPlayer.pendingRestEnergy || 0),
              buffs: [],
              debuffs: [],
              drawPile: shuffleArray(currentDrawPile),
              discard: [],
              exhaust: [],
              nextCardFree: false,
              nextSkillFree: false,
              nextAttackFree: false,
              nextAttackDouble: false,
              cardsPlayedThisTurn: 0,
              attacksPlayedThisTurn: 0,
              drawPerTurn: 0,
              blockPerTurn: 0,
              thorns: 0,
              blockOnExhaust: 0,
              drawOnExhaust: 0,
              pendingRestEnergy: 0,
              garra: 0,
              posesion: 0,
              momentum: 0,
              previousCardType: undefined,
              athleticExhaustBonusUsedThisTurn: false,
              barcaPassiveUsedThisTurn: false,
              madridPassiveUsedThisTurn: false,
              blockRetainCap: 0,
              skillsPlayedThisTurn: 0,
              firstBlockBonusUsedThisTurn: false,
              firstBlockBonusUsedThisCombat: false,
              firstExhaustDrawUsedThisTurn: false,
              bloodiedStrengthUsed: false,
              genRemontadaExtraGainsThisCombat: 0,
            },
          });

          // Aplicar efectos de reliquias al inicio de combate
          get().applyRelicEffectsAtCombatStart();

          // Robar cartas iniciales
          get().drawCards(tuning.startingHandSize);
          get().startTurn();
        }
      },

      playCard: (cardIndex: number, targetIndex: number = 0) => {
        const player = get().player;
        const card = player.hand[cardIndex];
        if (!card) return;

        const cardsPlayedBefore = player.cardsPlayedThisTurn || 0;
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

        if (player.energy < effectiveCost) return;

        let iterations = 1;
        let consumeNextAttackDouble = false;
        if (player.nextAttackDouble && card.type === 'attack') {
          iterations = 2;
          consumeNextAttackDouble = true;
        }

        const newHand = [...player.hand];
        newHand.splice(cardIndex, 1);

        const newExhaust = [...player.exhaust];
        let cardToDiscard: Card | null = null;
        const exhaustedByPlay = card.keywords?.includes('exhaust') ? 1 : 0;

        const stripTempCost = (cardValue: Card): Card => {
          const { tempCost, ...rest } = cardValue;
          return rest;
        };

        if (exhaustedByPlay > 0) {
          newExhaust.push(stripTempCost(card));
        } else {
          cardToDiscard = stripTempCost(card);
        }

        let relicDamageMultiplier = 1;
        const newRelicCounters = { ...(player.relicCounters || {}) };

        if (card.type === 'attack') {
          ['penalti', 'bota_oro_historica'].forEach(relicId => {
            if (player.relics.some(r => r.id.startsWith(relicId))) {
              const currentCount = (newRelicCounters[relicId] || 0) + 1;
              newRelicCounters[relicId] = currentCount;
              if (currentCount % 10 === 0) {
                relicDamageMultiplier *= 2;
              }
            }
          });
        }

        set(state => ({
          player: {
            ...state.player,
            hand: newHand,
            exhaust: newExhaust,
            energy: state.player.energy - effectiveCost,
            relicCounters: newRelicCounters,
            nextCardFree: consumeNextCardFree ? false : state.player.nextCardFree,
            nextSkillFree: consumeNextSkillFree ? false : state.player.nextSkillFree,
            nextAttackFree: consumeNextAttackFree ? false : state.player.nextAttackFree,
            nextAttackDouble: consumeNextAttackDouble ? false : state.player.nextAttackDouble,
            cardsPlayedThisTurn: (state.player.cardsPlayedThisTurn || 0) + 1,
            attacksPlayedThisTurn: card.type === 'attack' ? (state.player.attacksPlayedThisTurn || 0) + 1 : state.player.attacksPlayedThisTurn,
            skillsPlayedThisTurn: card.type === 'skill' ? (state.player.skillsPlayedThisTurn || 0) + 1 : state.player.skillsPlayedThisTurn,
          },
        }));

        let spentGarraThisCard = 0;
        let spentMomentumThisCard = 0;
        const madridPassiveActive = (
          player.team === 'madrid'
          && card.type === 'attack'
          && player.previousCardType === 'skill'
          && !player.madridPassiveUsedThisTurn
        );
        const hasBandaDerecha = player.relics.some(r => r.id.startsWith('banda_derecha'));
        const madridPassiveDamageBonus = madridPassiveActive ? (4 + (hasBandaDerecha ? 5 : 0)) : 0;

        const gainGarra = (amount: number) => {
          if (amount <= 0) return;
          set(state => ({
            player: {
              ...state.player,
              garra: Math.min(10, (state.player.garra || 0) + amount),
            },
          }));
        };

        const gainMomentum = (amount: number) => {
          if (amount <= 0) return;
          const stateNow = get().player;
          let bonus = 0;
          if (
            stateNow.relics.some(r => r.id.startsWith('gen_remontada'))
            && (stateNow.genRemontadaExtraGainsThisCombat || 0) < 2
          ) {
            bonus = 1;
          }
          set(state => ({
            player: {
              ...state.player,
              momentum: Math.min(5, (state.player.momentum || 0) + amount + bonus),
              genRemontadaExtraGainsThisCombat: (state.player.genRemontadaExtraGainsThisCombat || 0) + bonus,
            },
          }));
        };

        const gainPosesion = (amount: number) => {
          if (amount <= 0) return;
          const before = get().player.posesion || 0;
          const rawAfter = Math.min(8, before + amount);
          let finalPosesion = rawAfter;
          let thresholdTriggered = false;

          if (before < 6 && rawAfter >= 6) {
            thresholdTriggered = true;
            const montjuic = get().player.relics.find(r => r.id.startsWith('control_montjuic'));
            finalPosesion = montjuic ? 3 : 2;
          }

          set(state => ({
            player: {
              ...state.player,
              posesion: finalPosesion,
              energy: state.player.energy + (thresholdTriggered ? 1 : 0),
            },
          }));

          if (thresholdTriggered) {
            get().drawCards(1);
          }
        };

        const applyExhaustTriggers = (amount: number) => {
          if (amount <= 0) return;
          const current = get().player;
          const blockGain = (current.blockOnExhaust || 0) * amount;
          const drawGain = (current.drawOnExhaust || 0) * amount;

          if (blockGain > 0) get().applyBlock(blockGain);
          if (drawGain > 0) get().drawCards(drawGain);

          if (current.team === 'athletic' && !current.athleticExhaustBonusUsedThisTurn) {
            get().applyBlock(2);
            set(state => ({
              player: {
                ...state.player,
                athleticExhaustBonusUsedThisTurn: true,
              },
            }));
          }

          if (current.relics.some(r => r.id.startsWith('plan_lezama')) && !current.firstExhaustDrawUsedThisTurn) {
            get().drawCards(1);
            set(state => ({
              player: {
                ...state.player,
                firstExhaustDrawUsedThisTurn: true,
              },
            }));
          }

          const hasLeyenda = current.relics.some(r => r.id.startsWith('leyenda_club'));
          if (hasLeyenda) {
            for (let j = 0; j < amount; j++) {
              const generated = createRewardCard(current.team);
              set(state => ({
                player: {
                  ...state.player,
                  hand: [...state.player.hand, generated],
                },
              }));
            }
          }
        };

        if (exhaustedByPlay > 0) {
          applyExhaustTriggers(exhaustedByPlay);
          gainGarra(1);
        }

        if (player.team === 'barcelona' && card.type === 'skill' && cardsPlayedBefore >= 1 && !player.barcaPassiveUsedThisTurn) {
          get().drawCards(1);
          set(state => ({
            player: {
              ...state.player,
              barcaPassiveUsedThisTurn: true,
            },
          }));
        }

        if (player.team === 'madrid' && card.type === 'attack' && player.previousCardType === 'skill') {
          gainMomentum(1);
        }

        const refreshedPlayer = get().player;
        if (card.type === 'skill' && (refreshedPlayer.skillsPlayedThisTurn || 0) % 3 === 0) {
          const hasPizarra = refreshedPlayer.relics.some(r => r.id.startsWith('pizarra_mister'));
          const hasRutina = refreshedPlayer.relics.some(r => r.id.startsWith('rutina_invisible'));
          if (hasPizarra || hasRutina) {
            set(state => ({
              player: {
                ...state.player,
                energy: state.player.energy + 1,
              },
            }));
          }
        }

        for (let i = 0; i < iterations; i++) {
          card.effects.forEach(effect => {
            if (effect.type === 'damage' && effect.target === 'enemy') {
              const strength = get().getPlayerBuff('strength') + get().getPlayerBuff('temp_strength');
              let damage = (effect.value + strength + madridPassiveDamageBonus) * relicDamageMultiplier;

              const playerWeak = get().player.debuffs?.find(d => d.id === 'weak');
              if (playerWeak) {
                damage = Math.floor(damage * 0.75);
              }

              const currentEnemies = get().enemies;
              const enemy = currentEnemies[targetIndex];

              if (enemy) {
                const vulnerable = enemy.debuffs?.find(d => d.id === 'vulnerable');
                if (vulnerable) {
                  damage = Math.floor(damage * 1.5);
                }
              }

              get().damageEnemy(targetIndex, damage);
            } else if (effect.type === 'conditional_damage' && effect.target === 'enemy') {
              let conditionMet = false;
              const enemy = get().enemies[targetIndex];
              const statePlayer = get().player;

              if (effect.condition === 'enemy_hp_less_50' && enemy) {
                conditionMet = enemy.hp < enemy.maxHp * 0.5;
              } else if (effect.condition === 'enemy_hp_more_than_player' && enemy) {
                conditionMet = enemy.hp > statePlayer.hp;
              } else if (effect.condition === 'enemy_hp_more_50' && enemy) {
                conditionMet = enemy.hp > enemy.maxHp * 0.5;
              } else if (effect.condition === 'enemy_attacked_last_turn' && enemy) {
                conditionMet = !!enemy.didAttackLastTurn;
              } else if (effect.condition === 'player_block_more_20') {
                conditionMet = (statePlayer.block || 0) > 20;
              } else if (effect.condition === 'cards_played_3') {
                conditionMet = (statePlayer.cardsPlayedThisTurn || 0) >= 3;
              } else if (effect.condition === 'previous_card_skill') {
                conditionMet = statePlayer.previousCardType === 'skill';
              } else if (effect.condition === 'enemy_intent_attack' && enemy) {
                conditionMet = enemy.intent.type === 'attack';
              } else if (effect.condition === 'posesion_4') {
                conditionMet = (statePlayer.posesion || 0) >= 4;
              } else if (effect.condition === 'momentum_3') {
                conditionMet = (statePlayer.momentum || 0) >= 3;
              } else if (effect.condition === 'garra_3') {
                conditionMet = (statePlayer.garra || 0) >= 3;
              } else if (effect.condition === 'spent_garra') {
                conditionMet = spentGarraThisCard > 0;
              } else if (effect.condition === 'spent_momentum') {
                conditionMet = spentMomentumThisCard > 0;
              }

              if (conditionMet && enemy) {
                let damage = (effect.value + madridPassiveDamageBonus) * relicDamageMultiplier;
                const vulnerable = enemy.debuffs?.find(d => d.id === 'vulnerable');
                if (vulnerable) {
                  damage = Math.floor(damage * 1.5);
                }
                get().damageEnemy(targetIndex, damage);
              }
            } else if (effect.type === 'exhaust_hand_damage' && effect.target === 'enemy') {
              const currentState = get();
              const handToExhaust = [...currentState.player.hand];
              const exhaustCount = handToExhaust.length;

              if (exhaustCount > 0) {
                const updatedExhaust = [
                  ...currentState.player.exhaust,
                  ...handToExhaust.map(({ tempCost, ...rest }) => rest),
                ];
                set(state => ({
                  player: {
                    ...state.player,
                    hand: [],
                    exhaust: updatedExhaust,
                  },
                }));

                let damage = (effect.value * exhaustCount) * relicDamageMultiplier;
                const enemy = get().enemies[targetIndex];
                if (enemy) {
                  const vuln = enemy.debuffs?.find(d => d.id === 'vulnerable');
                  if (vuln) damage = Math.floor(damage * 1.5);
                  get().damageEnemy(targetIndex, damage);
                }

                applyExhaustTriggers(exhaustCount);
              }
            } else if (effect.type === 'block' && effect.target === 'self') {
              const currentPlayer = get().player;
              const dexterity = get().getPlayerBuff('dexterity');
              let extraBlock = 0;
              let markTurnBonusUsed = false;
              let markCombatBonusUsed = false;

              if (
                currentPlayer.relics.some(r => r.id.startsWith('txapela_hierro'))
                && !currentPlayer.firstBlockBonusUsedThisTurn
              ) {
                extraBlock += 3;
                markTurnBonusUsed = true;
              }

              if (
                currentPlayer.relics.some(r => r.id.startsWith('chaleco_gps'))
                && !currentPlayer.firstBlockBonusUsedThisCombat
              ) {
                extraBlock += 4;
                markCombatBonusUsed = true;
              }

              get().applyBlock(effect.value + dexterity + extraBlock);
              if (markTurnBonusUsed || markCombatBonusUsed) {
                set(state => ({
                  player: {
                    ...state.player,
                    firstBlockBonusUsedThisTurn: markTurnBonusUsed ? true : state.player.firstBlockBonusUsedThisTurn,
                    firstBlockBonusUsedThisCombat: markCombatBonusUsed ? true : state.player.firstBlockBonusUsedThisCombat,
                  },
                }));
              }
            } else if (effect.type === 'conditional_block' && effect.target === 'self') {
              let conditionMet = false;

              if (effect.condition === 'enemy_vulnerable') {
                const hasVulnerable = get().enemies.some(e => e.debuffs?.some(d => d.id === 'vulnerable'));
                if (hasVulnerable) conditionMet = true;
              }

              if (conditionMet) {
                const dexterity = get().getPlayerBuff('dexterity');
                get().applyBlock(effect.value + dexterity);
              }
            } else if (effect.type === 'draw' && effect.target === 'self') {
              get().drawCards(effect.value);
            } else if (effect.type === 'energy' && effect.target === 'self') {
              set(state => ({
                player: { ...state.player, energy: state.player.energy + effect.value },
              }));
            } else if (effect.type === 'conditional_energy' && effect.target === 'self') {
              let grant = false;
              if (effect.condition === 'enemy_attacked_last_turn') {
                grant = !!get().enemies[targetIndex]?.didAttackLastTurn;
              }
              if (grant) {
                set(state => ({
                  player: { ...state.player, energy: state.player.energy + effect.value },
                }));
              }
            } else if (effect.type === 'vulnerable' && effect.target === 'enemy') {
              const currentEnemies = get().enemies;
              const nextEnemies = [...currentEnemies];
              if (nextEnemies[targetIndex]) {
                if (!nextEnemies[targetIndex].debuffs) {
                  nextEnemies[targetIndex].debuffs = [];
                }
                const existingVulnerable = nextEnemies[targetIndex].debuffs.find(d => d.id === 'vulnerable');
                if (existingVulnerable) {
                  existingVulnerable.value += effect.value;
                } else {
                  nextEnemies[targetIndex].debuffs.push({
                    id: 'vulnerable',
                    name: 'Vulnerable',
                    value: effect.value,
                  });
                }
                set({ enemies: nextEnemies });
              }
            } else if (effect.type === 'weak' && effect.target === 'enemy') {
              const currentEnemies = get().enemies;
              const nextEnemies = [...currentEnemies];
              if (nextEnemies[targetIndex]) {
                if (!nextEnemies[targetIndex].debuffs) {
                  nextEnemies[targetIndex].debuffs = [];
                }
                const existingWeak = nextEnemies[targetIndex].debuffs.find(d => d.id === 'weak');
                if (existingWeak) {
                  existingWeak.value += effect.value;
                } else {
                  nextEnemies[targetIndex].debuffs.push({
                    id: 'weak',
                    name: 'Débil',
                    value: effect.value,
                  });
                }
                set({ enemies: nextEnemies });
              }
            } else if (effect.type === 'strength' && effect.target === 'self') {
              get().addBuffToPlayer('strength', 'Fuerza', effect.value);
            } else if (effect.type === 'strength_conditional' && effect.target === 'self') {
              if (effect.condition === 'player_hp_less_50' && get().player.hp < get().player.maxHp * 0.5) {
                get().addBuffToPlayer('strength', 'Fuerza', effect.value);
              }
            } else if (effect.type === 'strength_when_low' && effect.target === 'self') {
              if (get().player.hp < get().player.maxHp * 0.5) {
                get().addBuffToPlayer('strength', 'Fuerza', effect.value);
              }
            } else if (effect.type === 'dexterity_when_low' && effect.target === 'self') {
              if (get().player.hp < get().player.maxHp * 0.5) {
                get().addBuffToPlayer('dexterity', 'Destreza', effect.value);
              }
            } else if (effect.type === 'feel_no_pain' && effect.target === 'self') {
              set(state => ({
                player: {
                  ...state.player,
                  blockOnExhaust: (state.player.blockOnExhaust || 0) + effect.value,
                },
              }));
            } else if (effect.type === 'dark_embrace' && effect.target === 'self') {
              set(state => ({
                player: {
                  ...state.player,
                  drawOnExhaust: (state.player.drawOnExhaust || 0) + effect.value,
                },
              }));
            } else if (effect.type === 'next_card_free') {
              set(state => ({
                player: { ...state.player, nextCardFree: true },
              }));
            } else if (effect.type === 'next_skill_free') {
              set(state => ({
                player: { ...state.player, nextSkillFree: true },
              }));
            } else if (effect.type === 'next_attack_free') {
              set(state => ({
                player: { ...state.player, nextAttackFree: true },
              }));
            } else if (effect.type === 'next_attack_double') {
              set(state => ({
                player: { ...state.player, nextAttackDouble: true },
              }));
            } else if (effect.type === 'discard' && effect.target === 'self') {
              const currentPlayer = get().player;
              const handCopy = [...currentPlayer.hand];
              const toDiscard: Card[] = [];
              for (let j = 0; j < effect.value && handCopy.length > 0; j++) {
                const randomIndex = Math.floor(Math.random() * handCopy.length);
                const selected = handCopy.splice(randomIndex, 1)[0];
                const { tempCost, ...cleanCard } = selected;
                toDiscard.push(cleanCard);
              }
              set({
                player: {
                  ...currentPlayer,
                  hand: handCopy,
                  discard: [...currentPlayer.discard, ...toDiscard],
                },
              });
            } else if (effect.type === 'damage' && effect.target === 'all_enemies') {
              const strength = get().getPlayerBuff('strength') + get().getPlayerBuff('temp_strength');
              const allEnemiesNow = get().enemies;
              allEnemiesNow.forEach((enemy, idx) => {
                let damage = effect.value + strength + madridPassiveDamageBonus;
                const vulnerable = enemy.debuffs?.find(d => d.id === 'vulnerable');
                if (vulnerable) {
                  damage = Math.floor(damage * 1.5);
                }
                get().damageEnemy(idx, damage);
              });
            } else if (effect.type === 'damage_all' && effect.target === 'all_enemies') {
              const strength = get().getPlayerBuff('strength') + get().getPlayerBuff('temp_strength');
              const allEnemiesNow = get().enemies;
              allEnemiesNow.forEach((enemy, idx) => {
                let damage = effect.value + strength + madridPassiveDamageBonus;
                const vulnerable = enemy.debuffs?.find(d => d.id === 'vulnerable');
                if (vulnerable) {
                  damage = Math.floor(damage * 1.5);
                }
                get().damageEnemy(idx, damage);
              });
            } else if (effect.type === 'weak' && effect.target === 'all_enemies') {
              const allEnemiesNow = get().enemies;
              const nextEnemies = allEnemiesNow.map(enemy => {
                const debuffs = enemy.debuffs || [];
                const existingWeak = debuffs.find(d => d.id === 'weak');
                if (existingWeak) {
                  return { ...enemy, debuffs: debuffs.map(d => d.id === 'weak' ? { ...d, value: d.value + effect.value } : d) };
                }
                return { ...enemy, debuffs: [...debuffs, { id: 'weak', name: 'Débil', value: effect.value }] };
              });
              set({ enemies: nextEnemies });
            } else if (effect.type === 'weak_all' && effect.target === 'all_enemies') {
              const allEnemiesNow = get().enemies;
              const nextEnemies = allEnemiesNow.map(enemy => {
                const debuffs = enemy.debuffs || [];
                const existingWeak = debuffs.find(d => d.id === 'weak');
                if (existingWeak) {
                  return { ...enemy, debuffs: debuffs.map(d => d.id === 'weak' ? { ...d, value: d.value + effect.value } : d) };
                }
                return { ...enemy, debuffs: [...debuffs, { id: 'weak', name: 'Débil', value: effect.value }] };
              });
              set({ enemies: nextEnemies });
            } else if (effect.type === 'vulnerable' && effect.target === 'all_enemies') {
              const allEnemiesNow = get().enemies;
              const nextEnemies = allEnemiesNow.map(enemy => {
                const debuffs = enemy.debuffs || [];
                const existingVuln = debuffs.find(d => d.id === 'vulnerable');
                if (existingVuln) {
                  return { ...enemy, debuffs: debuffs.map(d => d.id === 'vulnerable' ? { ...d, value: d.value + effect.value } : d) };
                }
                return { ...enemy, debuffs: [...debuffs, { id: 'vulnerable', name: 'Vulnerable', value: effect.value }] };
              });
              set({ enemies: nextEnemies });
            } else if (effect.type === 'draw_per_turn') {
              set(state => ({
                player: { ...state.player, drawPerTurn: (state.player.drawPerTurn || 0) + effect.value },
              }));
            } else if (effect.type === 'reduce_hand_cost' && effect.target === 'self') {
              set(state => ({
                player: {
                  ...state.player,
                  hand: state.player.hand.map(c => ({
                    ...c,
                    tempCost: Math.max(0, (c.tempCost ?? c.cost) - effect.value),
                  })),
                },
              }));
            } else if (effect.type === 'barricade' || effect.type === 'block_per_turn') {
              set(state => ({
                player: { ...state.player, blockPerTurn: (state.player.blockPerTurn || 0) + effect.value },
              }));
            } else if (effect.type === 'retain_block_up_to' && effect.target === 'self') {
              set(state => ({
                player: {
                  ...state.player,
                  blockRetainCap: Math.max(state.player.blockRetainCap || 0, effect.value),
                },
              }));
            } else if (effect.type === 'temp_strength_this_turn' && effect.target === 'self') {
              get().addBuffToPlayer('temp_strength', 'Fuerza Temporal', effect.value);
            } else if (effect.type === 'gain_garra' && effect.target === 'self') {
              gainGarra(effect.value);
            } else if (effect.type === 'spend_garra' && effect.target === 'self') {
              const current = get().player.garra || 0;
              const spent = Math.min(current, Math.max(0, effect.value));
              if (spent > 0) {
                spentGarraThisCard += spent;
                set(state => ({
                  player: {
                    ...state.player,
                    garra: Math.max(0, (state.player.garra || 0) - spent),
                  },
                }));
              }
            } else if (effect.type === 'if_garra_at_least' && effect.target === 'self') {
              if ((get().player.garra || 0) >= effect.value) {
                gainGarra(1);
              }
            } else if (effect.type === 'gain_posesion' && effect.target === 'self') {
              gainPosesion(effect.value);
            } else if (effect.type === 'trigger_posesion_threshold' && effect.target === 'self') {
              gainPosesion(0);
            } else if (effect.type === 'set_card_cost_temp' && effect.target === 'self') {
              set(state => {
                const hand = [...state.player.hand];
                let bestIndex = -1;
                let bestCost = -1;
                hand.forEach((handCard, idx) => {
                  const handCost = handCard.tempCost ?? handCard.cost;
                  if (handCost > bestCost) {
                    bestCost = handCost;
                    bestIndex = idx;
                  }
                });
                if (bestIndex < 0 || bestCost <= 0) return state;
                hand[bestIndex] = { ...hand[bestIndex], tempCost: 0 };
                return {
                  ...state,
                  player: {
                    ...state.player,
                    hand,
                  },
                };
              });
            } else if (effect.type === 'gain_momentum' && effect.target === 'self') {
              gainMomentum(effect.value);
            } else if (effect.type === 'spend_momentum' && effect.target === 'self') {
              const current = get().player.momentum || 0;
              const spent = Math.min(current, Math.max(0, effect.value));
              if (spent > 0) {
                spentMomentumThisCard += spent;
                set(state => ({
                  player: {
                    ...state.player,
                    momentum: Math.max(0, (state.player.momentum || 0) - spent),
                  },
                }));
              }
            } else if (effect.type === 'if_previous_card_type' && effect.target === 'self') {
              if (effect.condition === 'skill' && get().player.previousCardType === 'skill') {
                set(state => ({ player: { ...state.player, energy: state.player.energy + effect.value } }));
              }
            } else if (effect.type === 'damage_bonus_if_enemy_intent_attack' && effect.target === 'enemy') {
              const enemy = get().enemies[targetIndex];
              if (enemy?.intent.type === 'attack') {
                let damage = effect.value * relicDamageMultiplier;
                const vulnerable = enemy.debuffs?.find(d => d.id === 'vulnerable');
                if (vulnerable) damage = Math.floor(damage * 1.5);
                get().damageEnemy(targetIndex, damage);
              }
            } else if (effect.type === 'dexterity') {
              get().addBuffToPlayer('dexterity', 'Destreza', effect.value);
            }
          });
        }

        if (cardToDiscard) {
          set(state => ({
            player: {
              ...state.player,
              discard: [...state.player.discard, cardToDiscard],
            },
          }));
        }

        set(state => ({
          player: {
            ...state.player,
            previousCardType: card.type,
            madridPassiveUsedThisTurn: state.player.madridPassiveUsedThisTurn || madridPassiveActive,
          },
        }));
      },

      endTurn: () => {
        const { player, enemies, map, ascension } = get();
        const tuning = getAscensionTuning(ascension);
        let currentBlock = player.block;
        let totalDamage = 0;

        // Enemigos actúan según su intención
        const newEnemies = enemies.map(enemy => {
          if (enemy.intent.type === 'attack' && enemy.intent.value) {
            const strengthBuff = enemy.buffs.find(buff => buff.id === 'strength')?.value || 0;
            let incomingDamage = enemy.intent.value + strengthBuff;
            incomingDamage = scaleInt(incomingDamage, tuning.enemyDamageMultiplier, 1);

            // Aplicar debuff "débil" - reduce daño en 25%
            const weakDebuff = enemy.debuffs?.find(d => d.id === 'weak');
            if (weakDebuff) {
              incomingDamage = Math.floor(incomingDamage * 0.75);
            }

            const blockedDamage = Math.min(currentBlock, incomingDamage);
            const actualDamage = incomingDamage - blockedDamage;

            // Reducir el bloqueo acumulado
            currentBlock -= blockedDamage;

            // Acumular daño para aplicar después
            totalDamage += actualDamage;

            // Aplicar espinas (thorns) - reflejar daño al enemigo
            const thorns = player.thorns || 0;
            if (thorns > 0) {
              enemy.hp -= thorns;
              get().addDamageEffect({
                id: `thorns_${enemy.id}_${Date.now()}`,
                damage: thorns,
                isCrit: false,
                isHeal: false,
                target: 'enemy',
                targetIndex: enemies.indexOf(enemy),
              });
            }

            // Crear efecto visual de daño
            if (actualDamage > 0) {
              get().addDamageEffect({
                id: `damage_player_${Date.now()}_${Math.random()}`,
                damage: actualDamage,
                isCrit: false,
                isHeal: false,
                target: 'player',
              });
            }
          } else if (enemy.intent.type === 'defend' && enemy.intent.value) {
            enemy.block += enemy.intent.value;
          } else if (enemy.intent.type === 'buff') {
            // Añadir buff al enemigo
            enemy.buffs.push({
              id: 'strength',
              name: 'Fuerza',
              value: enemy.intent.value || 2,
            });
          } else if (enemy.intent.type === 'debuff') {
            const debuffValue = enemy.intent.value || 1;
            const existingWeak = player.debuffs.find(d => d.id === 'weak');
            let newDebuffs = [...player.debuffs];

            if (existingWeak) {
              newDebuffs = newDebuffs.map(d => d.id === 'weak' ? { ...d, value: d.value + debuffValue } : d);
            } else {
              newDebuffs.push({ id: 'weak', name: 'Débil', value: debuffValue });
            }
            set(state => ({ player: { ...state.player, debuffs: newDebuffs } }));
          }

          // Decrementar debuffs del enemigo
          const updatedDebuffs = enemy.debuffs?.map(debuff => ({
            ...debuff,
            value: debuff.value - 1,
          })).filter(d => d.value > 0) || [];

          // Generar nueva intención para el próximo turno
          return {
            ...enemy,
            debuffs: updatedDebuffs,
            intent: generateRandomIntent(enemy, map.act),
            didAttackLastTurn: enemy.intent.type === 'attack',
          };
        });

        // Calcular nueva HP después de todo el daño
        const currentPlayer = get().player; // Obtener estado fresco
        const newHp = currentPlayer.hp - totalDamage;

        set(state => ({
          telemetryRun: state.telemetryRun
            ? {
                ...state.telemetryRun,
                turns: state.telemetryRun.turns + 1,
                totalDamageTaken: state.telemetryRun.totalDamageTaken + totalDamage,
                damageByTurn: [
                  ...state.telemetryRun.damageByTurn,
                  {
                    turn: state.turn,
                    dealt: state.telemetryRun.turnDamageDealt,
                    taken: totalDamage,
                  },
                ],
                turnDamageDealt: 0,
                turnDamageTaken: 0,
              }
            : state.telemetryRun,
        }));

        if (
          currentPlayer.relics.some(r => r.id.startsWith('noche_champions'))
          && !currentPlayer.bloodiedStrengthUsed
          && newHp > 0
          && newHp <= currentPlayer.maxHp * 0.5
        ) {
          get().addBuffToPlayer('strength', 'Fuerza', 2);
        }

        // Verificar game over
        if (newHp <= 0) {
          const currentState = get();
          if (currentState.telemetryRun) {
            const summary = buildRunSummary(currentState.telemetryRun, currentState, 'defeat');
            persistFinishedRun(currentState.telemetryRun, summary);
          }
          set({ gameOver: true, victory: false, telemetryRun: null });
          return;
        }

        // Mover mano al descarte y preparar mazo
        const handWithoutTempCost = currentPlayer.hand.map(({ tempCost, ...rest }) => rest);
        let newDrawPile = [...currentPlayer.drawPile];
        let newDiscard = [...currentPlayer.discard, ...handWithoutTempCost];

        // Si no hay suficientes cartas, barajar descarte y añadir al mazo
        if (newDrawPile.length < 5 && newDiscard.length > 0) {
          // Fisher-Yates shuffle
          for (let i = newDiscard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDiscard[i], newDiscard[j]] = [newDiscard[j], newDiscard[i]];
          }
          newDrawPile = [...newDrawPile, ...newDiscard];
          newDiscard = [];
        }

        // Calcular bloqueo inicial por barricade/powers
        const retainedBlock = Math.min(currentBlock, currentPlayer.blockRetainCap || 0);
        const startingBlock = (currentPlayer.blockPerTurn || 0) + retainedBlock;

        // Reliquia Copa de Europa (Conservar energía)
        let energyForNextTurn = currentPlayer.maxEnergy;
        const copaEuropa = currentPlayer.relics.find(r => r.id.startsWith('copa_europa'));
        if (copaEuropa) {
          energyForNextTurn += currentPlayer.energy;
          energyForNextTurn = currentPlayer.maxEnergy + currentPlayer.energy;
        }

        // Reliquia Cinta de Capitán
        // Si no jugó ataques (attacksPlayedThisTurn == 0), gana 1 energía extra PRÓXIMO turno.
        const cintaCapitan = currentPlayer.relics.find(r => r.id.startsWith('cinta_capitan'));
        let extraEnergyNextTurn = 0;
        if (cintaCapitan && (!currentPlayer.attacksPlayedThisTurn || currentPlayer.attacksPlayedThisTurn === 0)) {
          extraEnergyNextTurn += 1;
        }

        energyForNextTurn += extraEnergyNextTurn;

        set({
          player: {
            ...currentPlayer,
            hp: newHp,
            block: startingBlock, // Aplicar bloqueo por turno
            energy: energyForNextTurn, // Energía calculada
            hand: [],
            discard: newDiscard,
            drawPile: newDrawPile,
            nextCardFree: false,
            nextSkillFree: false,
            nextAttackFree: false,
            nextAttackDouble: false,
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0, // Reset counter
            previousCardType: undefined,
            athleticExhaustBonusUsedThisTurn: false,
            barcaPassiveUsedThisTurn: false,
            madridPassiveUsedThisTurn: false,
            skillsPlayedThisTurn: 0,
            firstBlockBonusUsedThisTurn: false,
            firstExhaustDrawUsedThisTurn: false,
            bloodiedStrengthUsed: (
              currentPlayer.bloodiedStrengthUsed
              || (
                currentPlayer.relics.some(r => r.id.startsWith('noche_champions'))
                && newHp > 0
                && newHp <= currentPlayer.maxHp * 0.5
              )
            ),
            buffs: currentPlayer.buffs.filter(buff => buff.id !== 'temp_strength'),
          },
          enemies: newEnemies,
          turn: get().turn + 1,
        });

        // Robar 5 cartas + cartas adicionales por powers
        const extraDraw = get().player.drawPerTurn || 0;
        get().drawCards(5 + extraDraw);

        // Iniciar efectos del nuevo turno
        get().startTurn();
      },

      startTurn: () => {
        const { player, turn, inCombat } = get();
        if (!inCombat) return;

        // Reliquia Medalla de Campeón (Energía cada 3 turnos)
        const medalla = player.relics.find(r => r.id.startsWith('medalla_campeon'));
        if (medalla && turn % 3 === 0) {
          set(state => ({
            player: { ...state.player, energy: state.player.energy + 1 }
          }));
        }

        const perTurnEnergyRelics = player.relics.filter(r => r.effect.type === 'energy_per_turn');
        if (perTurnEnergyRelics.length > 0) {
          set(state => ({
            player: { ...state.player, energy: state.player.energy + perTurnEnergyRelics.length }
          }));
        }

      },

      drawCards: (amount: number) => {
        const player = get().player;
        const newHand = [...player.hand];
        let newDrawPile = [...player.drawPile];
        let newDiscard = [...player.discard];

        for (let i = 0; i < amount; i++) {
          if (newDrawPile.length === 0 && newDiscard.length > 0) {
            // Barajar descarte antes de añadirlo al mazo
            for (let j = newDiscard.length - 1; j > 0; j--) {
              const k = Math.floor(Math.random() * (j + 1));
              [newDiscard[j], newDiscard[k]] = [newDiscard[k], newDiscard[j]];
            }
            newDrawPile = [...newDiscard];
            newDiscard = [];
          }

          if (newDrawPile.length > 0) {
            const randomIndex = Math.floor(Math.random() * newDrawPile.length);
            const card = newDrawPile[randomIndex];
            newHand.push(card);
            newDrawPile.splice(randomIndex, 1);
          }
        }

        // Usar fresh state para evitar sobrescribir otros cambios
        const freshPlayer = get().player;
        set({
          player: {
            ...freshPlayer,
            hand: newHand,
            drawPile: newDrawPile,
            discard: newDiscard,
          },
        });
      },

      shuffleDeck: () => {
        const { player } = get();
        const allCards = [...player.drawPile, ...player.discard];

        for (let i = allCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }

        set({
          player: {
            ...player,
            drawPile: allCards,
            discard: [],
          },
        });
      },

      addCardToDeck: (card: Card, source: CardPickSource = 'other') => {
        const { player } = get();
        set({
          player: {
            ...player,
            deck: [...player.deck, card],
            drawPile: [...player.drawPile, card],
          },
        });

        set(state => ({
          telemetryRun: state.telemetryRun
            ? {
                ...state.telemetryRun,
                cardPicks: [
                  ...state.telemetryRun.cardPicks,
                  {
                    id: card.id,
                    name: card.name,
                    team: card.team,
                    rarity: card.rarity,
                    source,
                    runId: state.telemetryRun.runId,
                    atTurn: state.turn,
                  },
                ],
              }
            : state.telemetryRun,
        }));
      },

      removeCardFromDeck: (cardId: string) => {
        const { player } = get();
        set({
          player: {
            ...player,
            deck: player.deck.filter(c => c.id !== cardId),
            drawPile: player.drawPile.filter(c => c.id !== cardId),
            discard: player.discard.filter(c => c.id !== cardId),
            hand: player.hand.filter(c => c.id !== cardId),
          },
        });
      },

      addRelic: (relic: Relic, source: RelicPickSource = 'other') => {
        const { player } = get();
        const alreadyHas = player.relics.some(existing => existing.id.startsWith(relic.id));
        if (alreadyHas) return;

        let maxHp = player.maxHp;
        let hp = player.hp;
        let maxPotionSlots = player.maxPotionSlots;
        let potions = player.potions;

        if (relic.id.startsWith('adn_ganador')) {
          maxHp = Math.max(1, player.maxHp - 10);
          hp = Math.min(player.hp, maxHp);
        }

        if (relic.id.startsWith('catedral_rojiblanca')) {
          maxPotionSlots = Math.max(1, player.maxPotionSlots - 1);
          if (player.potions.length > maxPotionSlots) {
            potions = player.potions.slice(0, maxPotionSlots);
          }
        }

        set({
          player: {
            ...player,
            relics: [...player.relics, relic],
            maxHp,
            hp,
            maxPotionSlots,
            potions,
          },
        });

        set(state => ({
          telemetryRun: state.telemetryRun
            ? {
                ...state.telemetryRun,
                relicPicks: [
                  ...state.telemetryRun.relicPicks,
                  {
                    id: relic.id,
                    name: relic.name,
                    rarity: relic.rarity,
                    team: relic.team,
                    source,
                    runId: state.telemetryRun.runId,
                    atTurn: state.turn,
                  },
                ],
              }
            : state.telemetryRun,
        }));
      },

      healPlayer: (amount: number) => {
        const { player } = get();
        set({
          player: {
            ...player,
            hp: Math.min(player.maxHp, player.hp + amount),
          },
        });
      },

      damagePlayer: (amount: number) => {
        const { player } = get();
        const newHp = player.hp - amount;

        // Añadir efecto visual de daño
        get().addDamageEffect({
          id: `damage_player_${Date.now()}`,
          damage: amount,
          isCrit: false,
          isHeal: false,
          target: 'player',
        });

        if (newHp <= 0) {
          const currentState = get();
          if (currentState.telemetryRun) {
            const summary = buildRunSummary(currentState.telemetryRun, currentState, 'defeat');
            persistFinishedRun(currentState.telemetryRun, summary);
          }
          set({ gameOver: true, victory: false, telemetryRun: null });
        } else {
          set({
            player: {
              ...player,
              hp: newHp,
            },
          });
        }
      },

      damageEnemy: (enemyIndex: number, amount: number) => {
        const { enemies } = get();
        const newEnemies = [...enemies];
        const enemy = newEnemies[enemyIndex];

        if (!enemy) return;

        const damage = Math.max(0, amount - enemy.block);
        enemy.hp -= damage;
        enemy.block = Math.max(0, enemy.block - amount);

        if (damage > 0) {
          set(state => ({
            telemetryRun: state.telemetryRun
              ? {
                  ...state.telemetryRun,
                  totalDamageDealt: state.telemetryRun.totalDamageDealt + damage,
                  turnDamageDealt: state.telemetryRun.turnDamageDealt + damage,
                }
              : state.telemetryRun,
          }));
        }

        // Añadir efecto visual de daño
        get().addDamageEffect({
          id: `damage_enemy_${enemyIndex}_${Date.now()}`,
          damage: damage,
          isCrit: false,
          isHeal: false,
          target: 'enemy',
          targetIndex: enemyIndex,
        });

        if (enemy.hp <= 0) {
          newEnemies.splice(enemyIndex, 1);
          if (get().player.team === 'madrid') {
            const current = get().player;
            const bonus = (
              current.relics.some(r => r.id.startsWith('gen_remontada'))
              && (current.genRemontadaExtraGainsThisCombat || 0) < 2
            ) ? 1 : 0;
            set(state => ({
              player: {
                ...state.player,
                momentum: Math.min(5, (state.player.momentum || 0) + 1 + bonus),
                genRemontadaExtraGainsThisCombat: (state.player.genRemontadaExtraGainsThisCombat || 0) + bonus,
              },
            }));
          }
        } else if (damage >= 15 && get().player.team === 'madrid') {
          const current = get().player;
          const bonus = (
            current.relics.some(r => r.id.startsWith('gen_remontada'))
            && (current.genRemontadaExtraGainsThisCombat || 0) < 2
          ) ? 1 : 0;
          set(state => ({
            player: {
              ...state.player,
              momentum: Math.min(5, (state.player.momentum || 0) + 1 + bonus),
              genRemontadaExtraGainsThisCombat: (state.player.genRemontadaExtraGainsThisCombat || 0) + bonus,
            },
          }));
        }

        set({ enemies: newEnemies });

        if (newEnemies.length === 0) {
          // Victoria en combate
          const { player, map, ascension } = get();
          const tuning = getAscensionTuning(ascension);

          // Curar con Sangre de León
          const sangreLeon = player.relics.find(r => r.id === 'sangre_leon');
          if (sangreLeon) {
            get().healPlayer(6);
          }

          const currentRoom = map.rooms.find(r => r.id === map.currentRoomId);

          // Ganar oro al ganar combate (curva de economia por acto)
          let minGold = 16;
          let maxGold = 26;
          if (map.act === 2) {
            minGold = 24;
            maxGold = 34;
          } else if (map.act === 3) {
            minGold = 32;
            maxGold = 44;
          } else if (map.act >= 4) {
            minGold = 42;
            maxGold = 56;
          }

          let goldReward = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
          if (currentRoom?.type === 'elite') {
            goldReward += 22;
          }
          goldReward = scaleInt(goldReward, tuning.goldRewardMultiplier, 1);
          get().addGold(goldReward);

          // Verificar victoria del acto
          if (currentRoom?.type === 'boss') {
            get().addGold(scaleInt(90, tuning.goldRewardMultiplier, 1)); // Recompensa extra por jefe
            if (map.act >= 4) {
              const currentState = get();
              if (currentState.telemetryRun) {
                const summary = buildRunSummary(currentState.telemetryRun, currentState, 'victory');
                persistFinishedRun(currentState.telemetryRun, summary);
              }
              set({ victory: true, inCombat: false, telemetryRun: null });
              return;
            } else {
              get().applyRelicEffectsAfterCombat();
              set({ inCombat: false, showReward: true, rewardType: 'boss' });
              return;
            }
          }

          // Mostrar pantalla de recompensa para combates normales
          get().applyRelicEffectsAfterCombat();
          set({ inCombat: false, showReward: true, rewardType: 'combat' });
        }
      },

      applyBlock: (amount: number) => {
        const { player } = get();
        set({
          player: {
            ...player,
            block: player.block + amount,
          },
        });
      },

      addGold: (amount: number) => {
        const { player } = get();
        set({
          player: {
            ...player,
            gold: player.gold + amount,
          },
        });
      },

      upgradeCard: (cardId: string) => {
        const { player } = get();

        const upgradeOneCard = (card: Card) => {
          if (card.id === cardId) {
            return getUpgradedCard(card);
          }
          return card;
        };

        set({
          player: {
            ...player,
            deck: player.deck.map(upgradeOneCard),
            drawPile: player.drawPile.map(upgradeOneCard),
            discard: player.discard.map(upgradeOneCard),
            hand: player.hand.map(upgradeOneCard),
          },
        });
      },

      restAtSite: () => {
        const { player, ascension } = get();
        const tuning = getAscensionTuning(ascension);
        const healAmount = scaleInt(player.maxHp * 0.3, tuning.restHealMultiplier, 1);
        get().healPlayer(healAmount);
        if (player.relics.some(r => r.id.startsWith('botella_agua'))) {
          set(state => ({
            player: {
              ...state.player,
              pendingRestEnergy: (state.player.pendingRestEnergy || 0) + 2,
            },
          }));
        }
      },

      unlockTeam: (team: TeamType) => {
        const { unlockedTeams } = get();
        if (!unlockedTeams.includes(team)) {
          set({
            unlockedTeams: [...unlockedTeams, team],
          });
        }
      },

      closeReward: () => {
        set({ showReward: false, rewardType: null, currentEvent: null });
      },

      addDamageEffect: (effect: DamageEffect) => {
        const { damageEffects } = get();
        set({ damageEffects: [...damageEffects, effect] });

        // Auto-limpiar después de 1 segundo
        setTimeout(() => {
          get().clearDamageEffect(effect.id);
        }, 1000);
      },

      clearDamageEffect: (effectId: string) => {
        const { damageEffects } = get();
        set({ damageEffects: damageEffects.filter(e => e.id !== effectId) });
      },

      clearDamageEffects: () => {
        set({ damageEffects: [] });
      },

      // Aplicar efectos de reliquias al inicio del combate
      applyRelicEffectsAtCombatStart: () => {
        const { player, enemies } = get();
        let extraCards = 0;
        let extraEnergy = 0;

        if (player.team === 'athletic') {
          get().applyBlock(4);
        }

        player.relics.forEach(relic => {
          switch (relic.effect.type) {
            case 'draw_start':
              extraCards += relic.effect.value;
              break;
            case 'strength_start':
              get().addBuffToPlayer('strength', 'Fuerza', relic.effect.value);
              break;
            case 'dexterity_start':
              get().addBuffToPlayer('dexterity', 'Destreza', relic.effect.value);
              break;
            case 'energy_first_turn':
              extraEnergy += relic.effect.value;
              break;
            case 'damage_start':
              // Daño a todos los enemigos
              enemies.forEach((_, index) => {
                get().damageEnemy(index, relic.effect.value);
              });
              break;
            case 'vulnerable_all_start': {
              // Vulnerable a todos
              const newEnemies = get().enemies.map(e => ({
                ...e,
                debuffs: [...(e.debuffs || []), {
                  id: 'vulnerable',
                  name: 'Vulnerable',
                  value: relic.effect.value,
                }],
              }));
              set({ enemies: newEnemies });
              break;
            }
            case 'weak_strongest': {
              // Debilidad al más fuerte
              const sortedByHp = [...get().enemies].sort((a, b) => b.maxHp - a.maxHp);
              if (sortedByHp.length > 0) {
                const strongestId = sortedByHp[0].id;
                const updatedEnemies = get().enemies.map(e =>
                  e.id === strongestId
                    ? { ...e, debuffs: [...(e.debuffs || []), { id: 'weak', name: 'Débil', value: relic.effect.value }] }
                    : e
                );
                set({ enemies: updatedEnemies });
              }
              break;
            }
            case 'thorns_start': {
              // Espinas al inicio del combate
              const p = get().player;
              set({ player: { ...p, thorns: (p.thorns || 0) + relic.effect.value } });
              break;
            }
            case 'strength_dexterity':
              get().addBuffToPlayer('strength', 'Fuerza', relic.effect.value);
              get().addBuffToPlayer('dexterity', 'Destreza', relic.effect.value);
              break;
            case 'posesion_start': {
              const p = get().player;
              set({ player: { ...p, posesion: Math.min(8, (p.posesion || 0) + relic.effect.value) } });
              break;
            }
            case 'garra_start': {
              const p = get().player;
              set({ player: { ...p, garra: Math.min(10, (p.garra || 0) + relic.effect.value) } });
              break;
            }
            case 'weak_self_start': {
              const p = get().player;
              const existingWeak = p.debuffs.find(d => d.id === 'weak');
              const nextDebuffs = existingWeak
                ? p.debuffs.map(d => d.id === 'weak' ? { ...d, value: d.value + relic.effect.value } : d)
                : [...p.debuffs, { id: 'weak', name: 'Debil', value: relic.effect.value }];
              set({ player: { ...p, debuffs: nextDebuffs } });
              break;
            }
          }
        });

        if (player.relics.some(r => r.id.startsWith('adn_blaugrana'))) {
          const p = get().player;
          set({ player: { ...p, posesion: Math.min(8, (p.posesion || 0) + 2) } });
        }

        if (player.relics.some(r => r.id.startsWith('catedral_rojiblanca'))) {
          const p = get().player;
          set({ player: { ...p, garra: Math.min(10, (p.garra || 0) + 2) } });
        }

        if (player.relics.some(r => r.id.startsWith('gen_remontada'))) {
          const p = get().player;
          const existingWeak = p.debuffs.find(d => d.id === 'weak');
          const nextDebuffs = existingWeak
            ? p.debuffs.map(d => d.id === 'weak' ? { ...d, value: d.value + 1 } : d)
            : [...p.debuffs, { id: 'weak', name: 'Debil', value: 1 }];
          set({ player: { ...p, debuffs: nextDebuffs } });
        }

        // Aplicar energía extra
        if (extraEnergy > 0) {
          const p = get().player;
          set({ player: { ...p, energy: p.energy + extraEnergy } });
        }

        // Las cartas extras se roban en drawCards
        if (extraCards > 0) {
          get().drawCards(extraCards);
        }
      },

      // Aplicar efectos de reliquias al final del combate
      applyRelicEffectsAfterCombat: () => {
        const { player } = get();
        let healAmount = 0;

        player.relics.forEach(relic => {
          if (relic.effect.type === 'heal_after_combat') {
            healAmount += relic.effect.value;
          }
        });

        if (healAmount > 0) {
          get().healPlayer(healAmount);
        }
      },

      // Añadir buff al jugador
      addBuffToPlayer: (id: string, name: string, value: number) => {
        const { player } = get();
        const existingBuff = player.buffs.find(b => b.id === id);

        if (existingBuff) {
          set({
            player: {
              ...player,
              buffs: player.buffs.map(b =>
                b.id === id ? { ...b, value: b.value + value } : b
              ),
            },
          });
        } else {
          set({
            player: {
              ...player,
              buffs: [...player.buffs, { id, name, value }],
            },
          });
        }
      },

      // Obtener valor de un buff del jugador
      getPlayerBuff: (id: string): number => {
        const buff = get().player.buffs.find(b => b.id === id);
        return buff?.value || 0;
      },

      resetGame: () => {
        const currentState = get();
        const unlockedTeams = currentState.unlockedTeams;
        const ascension = currentState.ascension;

        if (currentState.telemetryRun && currentState.gameStarted && !currentState.gameOver && !currentState.victory) {
          const summary = buildRunSummary(currentState.telemetryRun, currentState, 'abandoned');
          persistFinishedRun(currentState.telemetryRun, summary);
        }

        set({ ...initialState, unlockedTeams, ascension, telemetryRun: null });
      },

      buyCard: (card: Card, cost: number) => {
        const { player } = get();
        if (player.gold >= cost) {
          get().addGold(-cost);
          get().addCardToDeck(card, 'shop');
          return true;
        }
        return false;
      },

      buyRelic: (relic: Relic, cost: number) => {
        const { player } = get();
        if (player.gold >= cost) {
          get().addGold(-cost);
          get().addRelic(relic, 'shop');
          return true;
        }
        return false;
      },

      buyPotion: (potion: Potion, cost: number) => {
        const { player } = get();
        if (player.relics.some(r => r.id.startsWith('gestion_total'))) return false;
        if (player.gold < cost) return false;
        if (player.potions.length >= player.maxPotionSlots) return false;

        get().addGold(-cost);
        return get().addPotion(potion);
      },

      addPotion: (potion: Potion) => {
        const { player } = get();
        if (player.potions.length >= player.maxPotionSlots) return false;

        set({
          player: {
            ...player,
            potions: [...player.potions, potion],
          },
        });
        return true;
      },

      consumePotion: (potionIndex: number, targetIndex: number = 0) => {
        const { player, enemies, inCombat, ascension } = get();
        const potion = player.potions[potionIndex];
        if (!potion) return false;
        if (!inCombat) return false;
        const tuning = getAscensionTuning(ascension);
        const scaledValue = scaleInt(potion.effect.value, tuning.potionEffectMultiplier, 1);

        const consumePotion = () => {
          const freshPlayer = get().player;
          const nextPotions = freshPlayer.potions.filter((_, index) => index !== potionIndex);
          set({
            player: {
              ...freshPlayer,
              potions: nextPotions,
            },
          });
        };

        switch (potion.effect.type) {
          case 'heal':
            get().healPlayer(scaledValue);
            break;
          case 'block':
            get().applyBlock(scaledValue);
            break;
          case 'energy':
            set(state => ({
              player: {
                ...state.player,
                energy: state.player.energy + scaledValue,
              },
            }));
            break;
          case 'strength':
            get().addBuffToPlayer('strength', 'Fuerza', scaledValue);
            break;
          case 'damage':
            if (enemies[targetIndex]) {
              get().damageEnemy(targetIndex, scaledValue);
            }
            break;
          case 'damage_all':
            enemies.forEach((_, index) => get().damageEnemy(index, scaledValue));
            break;
          case 'vulnerable': {
            const updatedEnemies = get().enemies.map((enemy, index) => {
              if (potion.effect.target === 'all_enemies' || index === targetIndex) {
                return {
                  ...enemy,
                  debuffs: [
                    ...(enemy.debuffs || []),
                    { id: 'vulnerable', name: 'Vulnerable', value: scaledValue },
                  ],
                };
              }
              return enemy;
            });
            set({ enemies: updatedEnemies });
            break;
          }
          default:
            return false;
        }

        consumePotion();
        return true;
      },

      setMaxHp: (amount: number) => {
        set(state => {
          const newMax = state.player.maxHp + amount;
          const newHp = Math.min(state.player.hp, newMax); // Don't heal efficiently? Or clamp?
          // Logic: limit hp to newMax. If max increases, hp stays same (unless heal logic used separately).
          // If max decreases, hp might need clamping.
          return {
            player: { ...state.player, maxHp: newMax, hp: newHp }
          };
        });
      },

      advanceAfterBossReward: () => {
        const { map, player, ascension } = get();
        const tuning = getAscensionTuning(ascension);
        if (map.act >= 4) {
          set({
            inCombat: false,
            showReward: false,
            rewardType: null,
            currentEvent: null,
            victory: true,
          });
          return;
        }
        const nextAct = map.act + 1;
        set({
          map: {
            act: nextAct,
            rooms: generateMap(nextAct, ascension),
            currentRoomId: null,
          },
          inCombat: false,
          showReward: false,
          rewardType: null,
          currentEvent: null,
        });
        get().healPlayer(scaleInt(player.maxHp * 0.3, tuning.bossTransitionHealMultiplier, 1));
      },

    }),
    {
      name: 'climb-the-league',
      partialize: (state) => ({ unlockedTeams: state.unlockedTeams, ascension: state.ascension }),
    }
  )
);


