import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Enemy } from '@/types/game';
import { athleticCards, barcelonaCards, madridCards } from '@/data/cards';
import { commonRelics, rareRelics, getRandomRelic } from '@/data/relics';
import { generateMap, useGameStore } from './gameStore';

function makeEnemy(hp: number = 100): Enemy {
  return {
    id: `enemy_${Date.now()}`,
    name: 'Dummy',
    hp,
    maxHp: hp,
    block: 0,
    intent: { type: 'attack', value: 5, description: 'Attack 5' },
    buffs: [],
    debuffs: [],
  };
}

describe('gameStore core mechanics', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies Aupa Athletic conditional damage when block is above 20', () => {
    useGameStore.getState().startGame('athletic');
    const aupa = athleticCards.find(c => c.id === 'aupa_athletic');
    if (!aupa) throw new Error('Card not found');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        energy: 3,
        block: 21,
        hand: [{ ...aupa, id: 'test_aupa' }],
        discard: [],
        exhaust: [],
      },
    }));

    useGameStore.getState().playCard(0, 0);
    const enemy = useGameStore.getState().enemies[0];
    expect(enemy.hp).toBe(80);
  });

  it('never generates dead-end rooms before the final boss row', () => {
    for (const act of [1, 2, 3, 4]) {
      for (let i = 0; i < 120; i += 1) {
        const rooms = generateMap(act, 0);
        const lastRow = Math.max(...rooms.map(room => room.y));

        const deadEnds = rooms.filter(room => room.y < lastRow && room.connections.length === 0);
        expect(deadEnds.length).toBe(0);
      }
    }
  });

  it('applies Messi bonus damage when 3+ cards have been played this turn', () => {
    useGameStore.getState().startGame('barcelona');
    const messi = barcelonaCards.find(c => c.id === 'messi');
    if (!messi) throw new Error('Card not found');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        energy: 3,
        cardsPlayedThisTurn: 3,
        hand: [{ ...messi, id: 'test_messi' }],
        discard: [],
        exhaust: [],
      },
    }));

    useGameStore.getState().playCard(0, 0);
    const enemy = useGameStore.getState().enemies[0];
    expect(enemy.hp).toBe(70);
  });

  it('applies Botella de Agua energy on next combat after resting', () => {
    useGameStore.getState().startGame('athletic');
    const botella = commonRelics.find(r => r.id === 'botella_agua');
    if (!botella) throw new Error('Relic not found');

    useGameStore.getState().addRelic({ ...botella, id: 'botella_agua_test' });
    useGameStore.getState().restAtSite();
    expect(useGameStore.getState().player.pendingRestEnergy).toBe(2);

    const firstRoom = useGameStore.getState().map.rooms.find(r => r.y === 0);
    if (!firstRoom) throw new Error('No starting room found');
    useGameStore.getState().selectRoom(firstRoom.id);

    expect(useGameStore.getState().inCombat).toBe(true);
    expect(useGameStore.getState().player.energy).toBe(5);
    expect(useGameStore.getState().player.pendingRestEnergy).toBe(0);
  });

  it('shows boss reward and advances act after choosing boss relic', () => {
    useGameStore.getState().startGame('barcelona');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      map: {
        act: 1,
        currentRoomId: 'boss_test',
        rooms: [{ id: 'boss_test', type: 'boss', x: 0, y: 0, connections: [] }],
      },
      enemies: [makeEnemy(1)],
      player: {
        ...state.player,
        hp: 40,
      },
    }));

    useGameStore.getState().damageEnemy(0, 10);
    const afterBoss = useGameStore.getState();
    expect(afterBoss.showReward).toBe(true);
    expect(afterBoss.rewardType).toBe('boss');
    expect(afterBoss.inCombat).toBe(false);

    useGameStore.getState().advanceAfterBossReward();
    const afterAdvance = useGameStore.getState();
    expect(afterAdvance.map.act).toBe(2);
    expect(afterAdvance.showReward).toBe(false);
    expect(afterAdvance.rewardType).toBe(null);
    expect(afterAdvance.player.hp).toBe(62);
  });

  it('advances to act 4 after boss reward in act 3', () => {
    useGameStore.getState().startGame('athletic');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      map: {
        act: 3,
        currentRoomId: 'boss_act3',
        rooms: [{ id: 'boss_act3', type: 'boss', x: 0, y: 0, connections: [] }],
      },
      enemies: [makeEnemy(1)],
    }));

    useGameStore.getState().damageEnemy(0, 10);
    const rewardState = useGameStore.getState();
    expect(rewardState.showReward).toBe(true);
    expect(rewardState.rewardType).toBe('boss');
    expect(rewardState.victory).toBe(false);

    useGameStore.getState().advanceAfterBossReward();
    const afterAdvance = useGameStore.getState();
    expect(afterAdvance.map.act).toBe(4);
    expect(afterAdvance.victory).toBe(false);
  });

  it('wins the run by defeating act 4 boss', () => {
    useGameStore.getState().startGame('madrid');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      map: {
        act: 4,
        currentRoomId: 'boss_act4',
        rooms: [{ id: 'boss_act4', type: 'boss', x: 0, y: 0, connections: [] }],
      },
      enemies: [makeEnemy(1)],
    }));

    useGameStore.getState().damageEnemy(0, 10);
    const afterKill = useGameStore.getState();
    expect(afterKill.victory).toBe(true);
    expect(afterKill.showReward).toBe(false);
  });

  it('adds a generated card to hand when exhausting with Leyenda del Club', () => {
    useGameStore.getState().startGame('athletic');
    const leyenda = rareRelics.find(r => r.id === 'leyenda_club');
    const muro = athleticCards.find(c => c.id === 'muro_rojiblanco');
    if (!leyenda || !muro) throw new Error('Data not found');

    useGameStore.getState().addRelic({ ...leyenda, id: 'leyenda_club_test' });
    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        energy: 3,
        hand: [{ ...muro, id: 'muro_test' }],
        discard: [],
        exhaust: [],
      },
    }));

    useGameStore.getState().playCard(0, 0);
    const state = useGameStore.getState();
    expect(state.player.exhaust.length).toBe(1);
    expect(state.player.hand.length).toBe(1);
    expect(state.player.hand[0].id.startsWith('generated_')).toBe(true);
  });

  it('does not roll boss relics from generic random relic rewards', () => {
    for (let i = 0; i < 200; i++) {
      const relic = getRandomRelic();
      expect(relic.rarity).not.toBe('boss');
    }
  });

  it('uses potions in combat and consumes them', () => {
    useGameStore.getState().startGame('athletic');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        hp: 40,
      },
    }));

    const added = useGameStore.getState().addPotion({
      id: 'test_heal_potion',
      name: 'Test Heal',
      description: 'Heal test',
      effect: { type: 'heal', value: 10, target: 'self' },
    });
    expect(added).toBe(true);

    const used = useGameStore.getState().consumePotion(0, 0);
    expect(used).toBe(true);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(50);
    expect(state.player.potions.length).toBe(0);
  });

  it('applies ascension hp penalty to player max hp on game start', () => {
    useGameStore.getState().setAscension(4);
    useGameStore.getState().startGame('athletic');
    const state = useGameStore.getState();
    expect(state.player.maxHp).toBe(80);
    expect(state.ascension).toBe(4);
  });

  it('reduces starting hand size at ascension 10 for combat start', () => {
    useGameStore.getState().setAscension(10);
    useGameStore.getState().startGame('athletic');

    const firstRoom = useGameStore.getState().map.rooms.find(room => room.y === 0);
    if (!firstRoom) throw new Error('No starting room found');
    useGameStore.getState().selectRoom(firstRoom.id);

    const state = useGameStore.getState();
    expect(state.inCombat).toBe(true);
    expect(state.player.hand.length).toBe(4);
  });

  it('limits potion slots to 2 at ascension 12', () => {
    useGameStore.getState().setAscension(12);
    useGameStore.getState().startGame('athletic');

    const addOne = useGameStore.getState().addPotion({
      id: 'potion_a',
      name: 'Potion A',
      description: 'A',
      effect: { type: 'heal', value: 10, target: 'self' },
    });
    const addTwo = useGameStore.getState().addPotion({
      id: 'potion_b',
      name: 'Potion B',
      description: 'B',
      effect: { type: 'heal', value: 10, target: 'self' },
    });
    const addThree = useGameStore.getState().addPotion({
      id: 'potion_c',
      name: 'Potion C',
      description: 'C',
      effect: { type: 'heal', value: 10, target: 'self' },
    });

    const state = useGameStore.getState();
    expect(state.player.maxPotionSlots).toBe(2);
    expect(addOne).toBe(true);
    expect(addTwo).toBe(true);
    expect(addThree).toBe(false);
  });

  it('reduces potion effectiveness at ascension 20', () => {
    useGameStore.getState().setAscension(20);
    useGameStore.getState().startGame('athletic');

    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        hp: 40,
      },
    }));

    useGameStore.getState().addPotion({
      id: 'potion_heal_asc20',
      name: 'Potion Heal',
      description: 'Heal',
      effect: { type: 'heal', value: 16, target: 'self' },
    });

    useGameStore.getState().consumePotion(0, 0);
    const state = useGameStore.getState();
    expect(state.player.hp).toBe(51);
  });

  it('resolves unknown rooms into a concrete room type on selection', () => {
    useGameStore.getState().startGame('athletic');

    useGameStore.setState(state => ({
      ...state,
      inCombat: false,
      showReward: false,
      rewardType: null,
      map: {
        act: 1,
        currentRoomId: null,
        rooms: [
          { id: 'unknown_start', type: 'unknown', x: 0, y: 0, connections: ['next_room'], visited: false },
          { id: 'next_room', type: 'monster', x: 0, y: 1, connections: [], visited: false },
        ],
      },
    }));

    useGameStore.getState().selectRoom('unknown_start');
    const state = useGameStore.getState();
    const selected = state.map.rooms.find(r => r.id === 'unknown_start');
    if (!selected) throw new Error('Unknown room not found');

    expect(selected.type).not.toBe('unknown');
    expect(state.map.currentRoomId).toBe('unknown_start');
  });

  it('blocks selecting rooms that are not currently reachable', () => {
    useGameStore.getState().startGame('athletic');

    useGameStore.setState(state => ({
      ...state,
      inCombat: false,
      map: {
        act: 1,
        currentRoomId: 'start_room',
        rooms: [
          { id: 'start_room', type: 'monster', x: 0, y: 0, connections: ['allowed_room'], visited: true },
          { id: 'allowed_room', type: 'monster', x: 0, y: 1, connections: [], visited: false },
          { id: 'blocked_room', type: 'shop', x: 1, y: 1, connections: [], visited: false },
        ],
      },
    }));

    useGameStore.getState().selectRoom('blocked_room');
    const state = useGameStore.getState();
    const blocked = state.map.rooms.find(r => r.id === 'blocked_room');
    if (!blocked) throw new Error('Blocked room missing');

    expect(state.map.currentRoomId).toBe('start_room');
    expect(blocked.visited).toBe(false);
  });

  it('allows fallback progression to next row when current room has no connections', () => {
    useGameStore.getState().startGame('athletic');

    useGameStore.setState(state => ({
      ...state,
      inCombat: false,
      showReward: false,
      rewardType: null,
      map: {
        act: 1,
        currentRoomId: 'stuck_room',
        rooms: [
          { id: 'stuck_room', type: 'monster', x: 0, y: 0, connections: [], visited: true },
          { id: 'shop_next', type: 'shop', x: 0, y: 1, connections: [], visited: false },
          { id: 'rest_next', type: 'rest', x: 1, y: 1, connections: [], visited: false },
        ],
      },
    }));

    useGameStore.getState().selectRoom('shop_next');
    const state = useGameStore.getState();
    const selected = state.map.rooms.find(r => r.id === 'shop_next');
    if (!selected) throw new Error('Fallback room missing');

    expect(state.map.currentRoomId).toBe('shop_next');
    expect(selected.visited).toBe(true);
    expect(state.showReward).toBe(true);
    expect(state.rewardType).toBe('shop');
  });

  it('grants Athletic passive block at combat start', () => {
    useGameStore.getState().startGame('athletic');
    const firstRoom = useGameStore.getState().map.rooms.find(room => room.y === 0);
    if (!firstRoom) throw new Error('No starting room found');

    useGameStore.getState().selectRoom(firstRoom.id);
    const state = useGameStore.getState();

    expect(state.inCombat).toBe(true);
    expect(state.player.block).toBeGreaterThanOrEqual(4);
  });

  it('triggers Barcelona passive draw once per turn on first skill after another card', () => {
    const barcaStrike = barcelonaCards.find(c => c.id === 'barca_strike');
    const barcaDefend = barcelonaCards.find(c => c.id === 'barca_defend');
    if (!barcaStrike || !barcaDefend) throw new Error('Barca cards not found');

    useGameStore.getState().startGame('barcelona');
    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        energy: 3,
        hand: [
          { ...barcaStrike, id: 'barca_strike_test' },
          { ...barcaDefend, id: 'barca_defend_test_1' },
          { ...barcaDefend, id: 'barca_defend_test_2' },
        ],
      },
    }));

    useGameStore.getState().playCard(0, 0); // Attack first
    useGameStore.getState().playCard(0, 0); // First skill after another card

    const state = useGameStore.getState();
    expect(state.player.hand.length).toBe(2);
    expect(state.player.barcaPassiveUsedThisTurn).toBe(true);
  });

  it('applies Madrid attack-after-skill passive damage and gains momentum', () => {
    const skill = madridCards.find(c => c.id === 'velocidad');
    const attack = madridCards.find(c => c.id === 'madrid_strike');
    if (!skill || !attack) throw new Error('Madrid cards not found');

    useGameStore.getState().startGame('madrid');
    useGameStore.setState(state => ({
      ...state,
      inCombat: true,
      enemies: [makeEnemy(100)],
      player: {
        ...state.player,
        energy: 3,
        hand: [
          { ...skill, id: 'madrid_skill_test' },
          { ...attack, id: 'madrid_attack_test' },
        ],
      },
    }));

    useGameStore.getState().playCard(0, 0); // Skill
    useGameStore.getState().playCard(0, 0); // Attack after skill

    const state = useGameStore.getState();
    expect(state.enemies[0].hp).toBe(90); // 6 base + 4 passive
    expect(state.player.momentum).toBe(1);
  });

  it('prevents buying potions with Gestion Total boss relic', () => {
    useGameStore.getState().startGame('athletic');
    useGameStore.getState().addRelic({
      id: 'gestion_total_test',
      name: 'Gestion Total',
      description: 'No puedes comprar pociones.',
      rarity: 'boss',
      effect: { type: 'energy_per_turn', value: 1, target: 'self' },
    });

    useGameStore.setState(state => ({
      ...state,
      player: {
        ...state.player,
        gold: 200,
      },
    }));

    const bought = useGameStore.getState().buyPotion({
      id: 'potion_test',
      name: 'Potion',
      description: 'Potion',
      effect: { type: 'heal', value: 10, target: 'self' },
    }, 50);

    expect(bought).toBe(false);
    expect(useGameStore.getState().player.gold).toBe(200);
  });

  it('applies ADN Ganador max HP penalty when relic is acquired', () => {
    useGameStore.getState().startGame('madrid');
    const before = useGameStore.getState().player.maxHp;

    useGameStore.getState().addRelic({
      id: 'adn_ganador_test',
      name: 'ADN Ganador',
      description: 'Pierdes 10 HP maximo.',
      rarity: 'boss',
      effect: { type: 'energy_per_turn', value: 1, target: 'self' },
    });

    const after = useGameStore.getState().player.maxHp;
    expect(after).toBe(before - 10);
  });
});
