import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombatLogEntry, CombatLogTone, GameState, Enemy, Card, TeamType, Relic, DamageEffect, Potion } from '@/types/game';
import { allCards, getStartingDeck } from '@/data/cards';
import { starterRelics, getRandomRelic } from '@/data/relics';
import { getRandomEnemy, getBossForAct, generateRandomIntent } from '@/data/enemies';
import { allEvents } from '@/data/events';
import { BASE_BOSS_TRANSITION_HEAL_RATIO, BASE_REST_HEAL_RATIO, applyAscensionToEnemy, getAscensionTuning, scaleInt } from '@/lib/ascension';
import { getUpgradedCard } from '@/lib/cardUpgrade';
import { createRandomId, normalizeRngSeed, randomChoice, randomInt, setRngSeed, shuffleWithRng } from '@/lib/rng';
import { movePlayedCardToCombatPiles, resolveCardPlayCost, stripCardTempCost } from '@/lib/combat/cardFlow';
import { resolveCombatEffect } from '@/lib/combat/effectResolver';
import { generateMap, prepareRoomSelection } from '@/lib/map/mapFlow';
import { rollCombatVictoryGold } from '@/lib/rewards/rewardTable';
import {
  appendRewardChoice,
  appendRewardOffers,
  createRunSession,
  persistFinishedRun,
  type CardPickSource,
  type RelicPickSource,
  type RunResult,
  type TelemetryRewardChoice,
  type TelemetryRewardOffer,
  type TelemetryRunSession,
  type TelemetryRunSummary,
} from '@/lib/telemetry';


interface GameStore extends GameState {
  // Acciones
  startGame: (team: TeamType) => void;
  setAscension: (level: number) => void;
  setNextSeed: (seed: number) => void;
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
  recordRewardOffers: (offers: Array<Omit<TelemetryRewardOffer, 'runId' | 'atTurn'>>) => void;
  recordRewardChoice: (choice: Omit<TelemetryRewardChoice, 'runId' | 'atTurn'>) => void;
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
  addCombatLog: (text: string, tone?: CombatLogTone) => void;
  clearCombatLog: () => void;
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
  combatLog: [],
  unlockedTeams: ['athletic'],
  ascension: 0,
  currentSeed: null,
  nextSeed: null,
};

function createRewardCard(team: TeamType): Card {
  const pool = allCards.filter(card => card.team === 'neutral' || card.team === team);
  const card = randomChoice(pool);
  return { ...card, id: createRandomId(`generated_${card.id}`) };
}

const MAX_COMBAT_LOG_ENTRIES = 8;

function createCombatLogEntry(text: string, tone: CombatLogTone = 'neutral'): CombatLogEntry {
  return {
    id: createRandomId('combat_log'),
    text,
    tone,
  };
}

function pushCombatLog(entries: CombatLogEntry[], text: string, tone: CombatLogTone = 'neutral'): CombatLogEntry[] {
  return [...entries, createCombatLogEntry(text, tone)].slice(-MAX_COMBAT_LOG_ENTRIES);
}

function getDebuffValue(debuffs: Enemy['debuffs'], id: string): number {
  return debuffs.find(debuff => debuff.id === id)?.value || 0;
}

function describeIntent(intent: Enemy['intent']): string {
  if (intent.type === 'attack') return 'Ataque ' + (intent.value ?? 0);
  if (intent.type === 'defend') return 'Bloqueo ' + (intent.value ?? 0);
  if (intent.type === 'buff') return 'Buff ' + (intent.value ?? 0);
  if (intent.type === 'debuff') return 'Debuff ' + (intent.value ?? 0);
  return intent.description;
}

function formatEnemyList(enemies: Enemy[]): string {
  if (enemies.length === 0) return 'nadie';
  if (enemies.length === 1) return enemies[0].name;
  if (enemies.length === 2) return enemies[0].name + ' y ' + enemies[1].name;
  return enemies[0].name + ', ' + enemies[1].name + ' y ' + (enemies.length - 2) + ' mas';
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
        const runSeed = normalizeRngSeed(get().nextSeed ?? Date.now());
        setRngSeed(runSeed);
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
          combatLog: [],
          currentSeed: runSeed,
          nextSeed: null,
          telemetryRun: createRunSession(team, ascension),
        });
      },

      setAscension: (level: number) => {
        const clamped = Math.max(0, Math.min(20, Math.floor(level)));
        set({ ascension: clamped });
      },

      setNextSeed: (seed: number) => {
        set({ nextSeed: normalizeRngSeed(seed) });
      },

      selectRoom: (roomId: string) => {
        const { map, player } = get();
        const ascension = get().ascension;
        const tuning = getAscensionTuning(ascension);
        const preparedSelection = prepareRoomSelection(map, roomId);
        if (!preparedSelection) return;

        const workingMap = preparedSelection.map;
        const room = preparedSelection.room;

        set(state => ({
          telemetryRun: state.telemetryRun
            ? {
                ...state.telemetryRun,
                floorsVisited: state.telemetryRun.floorsVisited + 1,
                actReached: Math.max(state.telemetryRun.actReached, map.act),
              }
            : state.telemetryRun,
        }));

        // Reliquia Titulo de Liga: No puedes descansar en Hoteles
        const tituloLiga = player.relics.find(r => r.id.startsWith('titulo_liga'));
        if (room.type === 'rest' && tituloLiga) {
          // Si tiene Titulo de Liga, la sala de descanso no hace nada y se consume el nodo.
          set({
            map: workingMap,
            currentEvent: null,
            showReward: false,
            rewardType: null,
          });
          return;
        }

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
          nextEvent = randomChoice(allEvents);
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
          map: workingMap,
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
              drawPile: shuffleWithRng(currentDrawPile),
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
            combatLog: [],
          });

          get().addCombatLog('Empieza el combate contra ' + formatEnemyList(get().enemies) + '.', 'warn');

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
        const {
          canPlay,
          consumeNextAttackDouble,
          consumeNextAttackFree,
          consumeNextCardFree,
          consumeNextSkillFree,
          effectiveCost,
          iterations,
        } = resolveCardPlayCost(player, card);

        if (!canPlay) return;

        const enemySnapshotBefore = get().enemies.map(enemy => ({
          id: enemy.id,
          name: enemy.name,
          hp: enemy.hp,
          weak: getDebuffValue(enemy.debuffs || [], 'weak'),
          vulnerable: getDebuffValue(enemy.debuffs || [], 'vulnerable'),
        }));
        const playerSnapshotBefore = {
          block: player.block,
          energy: player.energy,
          garra: player.garra || 0,
          posesion: player.posesion || 0,
          momentum: player.momentum || 0,
          nextCardFree: !!player.nextCardFree,
          nextSkillFree: !!player.nextSkillFree,
          nextAttackFree: !!player.nextAttackFree,
          nextAttackDouble: !!player.nextAttackDouble,
        };

        get().addCombatLog(
          'Juegas ' + card.name + (effectiveCost === 0 ? ' gratis' : ' por ' + effectiveCost + ' de energia') + (iterations === 2 ? ' (x2).' : '.'),
          effectiveCost === 0 ? 'good' : 'neutral'
        );

        const {
          cardToDiscard,
          exhaustedByPlay,
          nextExhaust: newExhaust,
          nextHand: newHand,
        } = movePlayedCardToCombatPiles(player.hand, player.exhaust, cardIndex);

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
        if (madridPassiveActive) {
          get().addCombatLog(
            hasBandaDerecha
              ? 'Pasiva Madrid + Banda Derecha: ataque enlazado reforzado.'
              : 'Pasiva Madrid: ataque enlazado reforzado.',
            'good'
          );
        }

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
          const montjuic = get().player.relics.find(r => r.id.startsWith('control_montjuic'));

          if (before < 6 && rawAfter >= 6) {
            thresholdTriggered = true;
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
            get().addCombatLog(
              montjuic
                ? 'Control de Montjuic: el umbral de Posesion te da +1 energia y roba 1.'
                : 'Umbral de Posesion: +1 energia y roba 1.',
              'good'
            );
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
            get().addCombatLog('Pasiva Athletic: +2 de bloqueo al primer exhaust.', 'good');
            set(state => ({
              player: {
                ...state.player,
                athleticExhaustBonusUsedThisTurn: true,
              },
            }));
          }

          if (current.relics.some(r => r.id.startsWith('plan_lezama')) && !current.firstExhaustDrawUsedThisTurn) {
            get().addCombatLog('Plan de Lezama: robas 1 al primer exhaust.', 'good');
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
            get().addCombatLog('Leyenda del Club: crea ' + amount + ' carta' + (amount > 1 ? 's' : '') + '.', 'good');
          }
        };

        if (exhaustedByPlay > 0) {
          applyExhaustTriggers(exhaustedByPlay);
          gainGarra(1);
        }

        if (player.team === 'barcelona' && card.type === 'skill' && cardsPlayedBefore >= 1 && !player.barcaPassiveUsedThisTurn) {
          get().addCombatLog('Pasiva Barca: robas 1 al enlazar skills.', 'good');
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
            get().addCombatLog(
              hasPizarra && hasRutina
                ? 'Pizarra del Mister + Rutina Invisible: +1 energia al tercer skill.'
                : hasPizarra
                  ? 'Pizarra del Mister: +1 energia al tercer skill.'
                  : 'Rutina Invisible: +1 energia al tercer skill.',
              'good'
            );
            set(state => ({
              player: {
                ...state.player,
                energy: state.player.energy + 1,
              },
            }));
          }
        }
        const updatePlayer = (updater: (currentPlayer: typeof player) => typeof player) => {
          set(state => ({ player: updater(state.player) }));
        };

        const updateEnemies = (updater: (currentEnemies: Enemy[]) => Enemy[]) => {
          set(state => ({ enemies: updater(state.enemies) }));
        };

        for (let i = 0; i < iterations; i++) {
          card.effects.forEach(effect => {
            const resolution = resolveCombatEffect(effect, {
              targetIndex,
              relicDamageMultiplier,
              madridPassiveDamageBonus,
              spentGarraThisCard,
              spentMomentumThisCard,
              getPlayer: () => get().player,
              getEnemies: () => get().enemies,
              getPlayerBuff: buffId => get().getPlayerBuff(buffId),
              damageEnemy: (enemyIndex, damage) => get().damageEnemy(enemyIndex, damage),
              applyBlock: amount => get().applyBlock(amount),
              drawCards: amount => get().drawCards(amount),
              addBuffToPlayer: (id, name, value) => get().addBuffToPlayer(id, name, value),
              addCombatLog: (text, tone) => get().addCombatLog(text, tone),
              gainGarra,
              gainMomentum,
              gainPosesion,
              applyExhaustTriggers,
              updatePlayer,
              updateEnemies,
            });

            spentGarraThisCard += resolution.spentGarra;
            spentMomentumThisCard += resolution.spentMomentum;
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

        const stateAfterPlay = get();
        const damagedTargets = enemySnapshotBefore
          .map(enemyBefore => {
            const enemyAfter = stateAfterPlay.enemies.find(enemy => enemy.id === enemyBefore.id);
            const hpAfter = enemyAfter ? enemyAfter.hp : 0;
            return {
              name: enemyBefore.name,
              damage: Math.max(0, enemyBefore.hp - hpAfter),
              defeated: !enemyAfter || enemyAfter.hp <= 0,
            };
          })
          .filter(entry => entry.damage > 0);
        const totalDamage = damagedTargets.reduce((sum, entry) => sum + entry.damage, 0);
        if (damagedTargets.length === 1) {
          const target = damagedTargets[0];
          get().addCombatLog(target.name + ' recibe ' + target.damage + ' de dano' + (target.defeated ? ' y cae.' : '.'), 'good');
        } else if (damagedTargets.length > 1) {
          get().addCombatLog('Infliges ' + totalDamage + ' de dano repartido.', 'good');
        }

        const blockGain = stateAfterPlay.player.block - playerSnapshotBefore.block;
        if (blockGain > 0) {
          get().addCombatLog('Ganas ' + blockGain + ' de bloqueo.', 'good');
        }

        const refundedEnergy = stateAfterPlay.player.energy - (playerSnapshotBefore.energy - effectiveCost);
        if (refundedEnergy > 0) {
          get().addCombatLog('Recuperas ' + refundedEnergy + ' de energia.', 'good');
        }

        if (spentGarraThisCard > 0) {
          get().addCombatLog('Consumes ' + spentGarraThisCard + ' de garra.', 'warn');
        }
        if (spentMomentumThisCard > 0) {
          get().addCombatLog('Consumes ' + spentMomentumThisCard + ' de momentum.', 'warn');
        }

        const garraDelta = (stateAfterPlay.player.garra || 0) - playerSnapshotBefore.garra;
        const posesionDelta = (stateAfterPlay.player.posesion || 0) - playerSnapshotBefore.posesion;
        const momentumDelta = (stateAfterPlay.player.momentum || 0) - playerSnapshotBefore.momentum;
        if (garraDelta > 0) get().addCombatLog('Garra +' + garraDelta + '.', 'good');
        if (posesionDelta > 0) get().addCombatLog('Posesion +' + posesionDelta + '.', 'good');
        if (momentumDelta > 0) get().addCombatLog('Momentum +' + momentumDelta + '.', 'good');

        enemySnapshotBefore.forEach(enemyBefore => {
          const enemyAfter = stateAfterPlay.enemies.find(enemy => enemy.id === enemyBefore.id);
          if (!enemyAfter) return;
          const vulnerableDelta = getDebuffValue(enemyAfter.debuffs || [], 'vulnerable') - enemyBefore.vulnerable;
          const weakDelta = getDebuffValue(enemyAfter.debuffs || [], 'weak') - enemyBefore.weak;
          if (vulnerableDelta > 0) {
            get().addCombatLog('Aplicas Vulnerable ' + vulnerableDelta + ' a ' + enemyBefore.name + '.', 'good');
          }
          if (weakDelta > 0) {
            get().addCombatLog('Aplicas Debil ' + weakDelta + ' a ' + enemyBefore.name + '.', 'good');
          }
        });

        if (stateAfterPlay.player.nextCardFree && !playerSnapshotBefore.nextCardFree) {
          get().addCombatLog('La proxima carta sale gratis.', 'good');
        }
        if (stateAfterPlay.player.nextSkillFree && !playerSnapshotBefore.nextSkillFree) {
          get().addCombatLog('Preparas una skill gratis.', 'good');
        }
        if (stateAfterPlay.player.nextAttackFree && !playerSnapshotBefore.nextAttackFree) {
          get().addCombatLog('Preparas un ataque gratis.', 'good');
        }
        if (stateAfterPlay.player.nextAttackDouble && !playerSnapshotBefore.nextAttackDouble) {
          get().addCombatLog('Preparas el proximo ataque x2.', 'good');
        }
      },

      endTurn: () => {
        const { player, enemies, map, ascension } = get();
        const tuning = getAscensionTuning(ascension);
        let currentBlock = player.block;
        let totalDamage = 0;
        let totalBlockedDamage = 0;

        // Enemigos actúan según su intención
        const newEnemies = enemies.map((enemy, enemyIndex) => {
          const nextEnemy = {
            ...enemy,
            block: 0,
            buffs: [...enemy.buffs],
            debuffs: [...(enemy.debuffs || [])],
          };

          if (enemy.intent.type === 'attack' && enemy.intent.value) {
            const strengthBuff = nextEnemy.buffs.find(buff => buff.id === 'strength')?.value || 0;
            let incomingDamage = enemy.intent.value + strengthBuff;
            const damageMultiplier = enemy.isBoss
              ? tuning.enemyDamageMultiplier * tuning.bossDamageMultiplier
              : tuning.enemyDamageMultiplier;
            incomingDamage = scaleInt(incomingDamage, damageMultiplier, 1);

            const weakDebuff = nextEnemy.debuffs.find(d => d.id === 'weak');
            if (weakDebuff) {
              incomingDamage = Math.floor(incomingDamage * 0.75);
            }

            const blockedDamage = Math.min(currentBlock, incomingDamage);
            const actualDamage = incomingDamage - blockedDamage;

            currentBlock -= blockedDamage;
            totalBlockedDamage += blockedDamage;
            totalDamage += actualDamage;

            const thorns = player.thorns || 0;
            if (thorns > 0) {
              nextEnemy.hp -= thorns;
              get().addDamageEffect({
                id: createRandomId(`thorns_${enemy.id}`),
                damage: thorns,
                isCrit: false,
                isHeal: false,
                target: 'enemy',
                targetIndex: enemyIndex,
              });
            }

            if (actualDamage > 0) {
              get().addDamageEffect({
                id: createRandomId('damage_player'),
                damage: actualDamage,
                isCrit: false,
                isHeal: false,
                target: 'player',
              });
            }
          } else if (enemy.intent.type === 'defend' && enemy.intent.value) {
            nextEnemy.block = enemy.intent.value;
            get().addCombatLog(enemy.name + ' gana ' + enemy.intent.value + ' de bloqueo.', 'warn');
          } else if (enemy.intent.type === 'buff') {
            get().addCombatLog(enemy.name + ' se refuerza.', 'warn');
            nextEnemy.buffs.push({
              id: 'strength',
              name: 'Fuerza',
              value: enemy.intent.value || 2,
            });
          } else if (enemy.intent.type === 'debuff') {
            const debuffValue = enemy.intent.value || 1;
            get().addCombatLog(enemy.name + ' aplica Debil ' + debuffValue + '.', 'bad');
            const existingWeak = player.debuffs.find(d => d.id === 'weak');
            let newDebuffs = [...player.debuffs];

            if (existingWeak) {
              newDebuffs = newDebuffs.map(d => d.id === 'weak' ? { ...d, value: d.value + debuffValue } : d);
            } else {
              newDebuffs.push({ id: 'weak', name: 'Débil', value: debuffValue });
            }
            set(state => ({ player: { ...state.player, debuffs: newDebuffs } }));
          }

          const updatedDebuffs = nextEnemy.debuffs.map(debuff => ({
            ...debuff,
            value: debuff.value - 1,
          })).filter(d => d.value > 0);

          const nextAiStep = enemy.aiPattern ? (enemy.aiStep || 0) + 1 : enemy.aiStep;
          const nextIntentSource = enemy.aiPattern ? { ...nextEnemy, aiStep: nextAiStep } : nextEnemy;
          return {
            ...nextEnemy,
            debuffs: updatedDebuffs,
            intent: generateRandomIntent(nextIntentSource, map.act),
            aiStep: nextAiStep,
            didAttackLastTurn: enemy.intent.type === 'attack',
          };
        });

        // Calcular nueva HP después de todo el daño
        const currentPlayer = get().player; // Obtener estado fresco
        const newHp = currentPlayer.hp - totalDamage;

        if (totalBlockedDamage > 0 && totalDamage > 0) {
          get().addCombatLog('Bloqueas ' + totalBlockedDamage + ' y recibes ' + totalDamage + ' de dano.', totalDamage > totalBlockedDamage ? 'bad' : 'warn');
        } else if (totalBlockedDamage > 0) {
          get().addCombatLog('Bloqueas ' + totalBlockedDamage + ' de dano.', 'good');
        } else if (totalDamage > 0) {
          get().addCombatLog('Recibes ' + totalDamage + ' de dano.', 'bad');
        }

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
        const handWithoutTempCost = currentPlayer.hand.map(stripCardTempCost);
        let newDrawPile = [...currentPlayer.drawPile];
        let newDiscard = [...currentPlayer.discard, ...handWithoutTempCost];

        // Si no hay suficientes cartas, barajar descarte y añadir al mazo
        if (newDrawPile.length < 5 && newDiscard.length > 0) {
          // Fisher-Yates shuffle
          for (let i = newDiscard.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
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

        newEnemies.forEach(enemy => {
          get().addCombatLog(enemy.name + ' prepara ' + describeIntent(enemy.intent) + '.', enemy.intent.type === 'attack' ? 'warn' : 'neutral');
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
        const energyBeforeStart = player.energy;

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

        const energyAfterStart = get().player.energy;
        const gainedEnergy = energyAfterStart - energyBeforeStart;
        if (gainedEnergy > 0) {
          get().addCombatLog('Empiezas el turno con +' + gainedEnergy + ' de energia.', 'good');
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
              const k = randomInt(j + 1);
              [newDiscard[j], newDiscard[k]] = [newDiscard[k], newDiscard[j]];
            }
            newDrawPile = [...newDiscard];
            newDiscard = [];
          }

          if (newDrawPile.length > 0) {
            const randomIndex = randomInt(newDrawPile.length);
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
          const j = randomInt(i + 1);
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
          id: createRandomId('damage_player'),
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
          id: createRandomId(`damage_enemy_${enemyIndex}`),
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
          const { map, ascension } = get();
          const tuning = getAscensionTuning(ascension);

          const currentRoom = map.rooms.find(r => r.id === map.currentRoomId);
          const roomTypeForReward = currentRoom?.type === 'elite' || currentRoom?.type === 'boss'
            ? currentRoom.type
            : 'monster';
          const goldReward = scaleInt(rollCombatVictoryGold(map.act, roomTypeForReward), tuning.goldRewardMultiplier, 1);
          get().addGold(goldReward);

          // Verificar victoria del acto
          if (currentRoom?.type === 'boss') {
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

      recordRewardOffers: (offers) => {
        if (offers.length === 0) return;
        set(state => {
          if (!state.telemetryRun) {
            return { telemetryRun: state.telemetryRun };
          }

          const runId = state.telemetryRun.runId;
          return {
            telemetryRun: appendRewardOffers(
              state.telemetryRun,
              offers.map(offer => ({
                ...offer,
                runId,
                atTurn: state.turn,
              }))
            ),
          };
        });
      },

      recordRewardChoice: (choice) => {
        set(state => {
          if (!state.telemetryRun) {
            return { telemetryRun: state.telemetryRun };
          }

          return {
            telemetryRun: appendRewardChoice(state.telemetryRun, {
              ...choice,
              runId: state.telemetryRun.runId,
              atTurn: state.turn,
            }),
          };
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
        const healAmount = scaleInt(player.maxHp * BASE_REST_HEAL_RATIO, tuning.restHealMultiplier, 1);
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

      addCombatLog: (text: string, tone: CombatLogTone = 'neutral') => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set(state => ({ combatLog: pushCombatLog(state.combatLog, trimmed, tone) }));
      },

      clearCombatLog: () => {
        set({ combatLog: [] });
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
        const nextSeed = currentState.nextSeed;

        if (currentState.telemetryRun && currentState.gameStarted && !currentState.gameOver && !currentState.victory) {
          const summary = buildRunSummary(currentState.telemetryRun, currentState, 'abandoned');
          persistFinishedRun(currentState.telemetryRun, summary);
        }

        set({ ...initialState, unlockedTeams, ascension, nextSeed, telemetryRun: null });
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
        const playerSnapshotBeforePotion = {
          hp: player.hp,
          block: player.block,
          energy: player.energy,
        };
        const enemySnapshotBeforePotion = enemies.map(enemy => ({
          id: enemy.id,
          name: enemy.name,
          hp: enemy.hp,
          vulnerable: getDebuffValue(enemy.debuffs || [], 'vulnerable'),
        }));

        get().addCombatLog('Usas ' + potion.name + '.', 'neutral');

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

        const stateAfterPotion = get();
        const healGain = stateAfterPotion.player.hp - playerSnapshotBeforePotion.hp;
        const blockGain = stateAfterPotion.player.block - playerSnapshotBeforePotion.block;
        const energyGain = stateAfterPotion.player.energy - playerSnapshotBeforePotion.energy;
        const damagedTargets = enemySnapshotBeforePotion
          .map(enemyBefore => {
            const enemyAfter = stateAfterPotion.enemies.find(enemy => enemy.id === enemyBefore.id);
            const hpAfter = enemyAfter ? enemyAfter.hp : 0;
            return {
              name: enemyBefore.name,
              damage: Math.max(0, enemyBefore.hp - hpAfter),
              vulnerableGain: (enemyAfter ? getDebuffValue(enemyAfter.debuffs || [], 'vulnerable') : enemyBefore.vulnerable) - enemyBefore.vulnerable,
            };
          })
          .filter(entry => entry.damage > 0 || entry.vulnerableGain > 0);

        if (healGain > 0) get().addCombatLog('Recuperas ' + healGain + ' de vida.', 'good');
        if (blockGain > 0) get().addCombatLog('Ganas ' + blockGain + ' de bloqueo.', 'good');
        if (energyGain > 0) get().addCombatLog('Ganas ' + energyGain + ' de energia.', 'good');
        damagedTargets.forEach(target => {
          if (target.damage > 0) {
            get().addCombatLog(target.name + ' recibe ' + target.damage + ' de dano.', 'good');
          }
          if (target.vulnerableGain > 0) {
            get().addCombatLog('Aplicas Vulnerable ' + target.vulnerableGain + ' a ' + target.name + '.', 'good');
          }
        });

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
          combatLog: [],
        });
        get().healPlayer(scaleInt(player.maxHp * BASE_BOSS_TRANSITION_HEAL_RATIO, tuning.bossTransitionHealMultiplier, 1));
      },

    }),    {
      name: 'climb-the-league',
      partialize: (state) => ({
        ascension: state.ascension,
        combatLog: state.combatLog,
        currentEvent: state.currentEvent,
        currentSeed: state.currentSeed,
        enemies: state.enemies,
        gameOver: state.gameOver,
        gameStarted: state.gameStarted,
        inCombat: state.inCombat,
        map: state.map,
        nextSeed: state.nextSeed,
        player: state.player,
        rewardType: state.rewardType,
        showReward: state.showReward,
        telemetryRun: state.telemetryRun,
        turn: state.turn,
        unlockedTeams: state.unlockedTeams,
        victory: state.victory,
      }),
    }
  )
);




































