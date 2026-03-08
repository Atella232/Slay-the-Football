import { getReachableRooms } from '@/lib/map/mapFlow';
import type { GameState } from '@/types/game';

function getMode(state: GameState): string {
  if (state.gameOver) return state.victory ? 'victory' : 'defeat';
  if (!state.gameStarted) return 'team_select';
  if (state.inCombat) return 'combat';
  if (state.showReward) return `reward:${state.rewardType ?? 'unknown'}`;
  return 'map';
}


export function buildTextSnapshot(state: GameState): string {
  const reachableRooms = getReachableRooms(state.map);
  const payload = {
    note: 'Turn-based state snapshot. Map coordinates use x to the right and y downward.',
    mode: getMode(state),
    ascension: state.ascension,
    seed: state.currentSeed ?? state.nextSeed ?? null,
    act: state.map.act,
    turn: state.turn,
    player: {
      team: state.player.team,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      block: state.player.block,
      energy: state.player.energy,
      maxEnergy: state.player.maxEnergy,
      gold: state.player.gold,
      garra: state.player.garra || 0,
      posesion: state.player.posesion || 0,
      momentum: state.player.momentum || 0,
      buffs: state.player.buffs.map(buff => ({ id: buff.id, value: buff.value })),
      debuffs: state.player.debuffs.map(debuff => ({ id: debuff.id, value: debuff.value })),
      hand: state.player.hand.map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        cost: card.tempCost ?? card.cost,
      })),
      piles: {
        draw: state.player.drawPile.length,
        discard: state.player.discard.length,
        exhaust: state.player.exhaust.length,
        deck: state.player.deck.length,
      },
      relics: state.player.relics.map(relic => relic.name),
      potions: state.player.potions.map(potion => potion.name),
    },
    combat: state.inCombat
      ? {
          enemies: state.enemies.map(enemy => ({
            id: enemy.id,
            name: enemy.name,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            block: enemy.block,
            intent: enemy.intent,
            buffs: enemy.buffs.map(buff => ({ id: buff.id, value: buff.value })),
            debuffs: enemy.debuffs.map(debuff => ({ id: debuff.id, value: debuff.value })),
          })),
        }
      : null,
    map: state.inCombat
      ? null
      : {
          currentRoomId: state.map.currentRoomId,
          reachableRooms: reachableRooms.map(room => ({
            id: room.id,
            type: room.type,
            x: room.x,
            y: room.y,
          })),
        },
    reward: state.showReward
      ? {
          type: state.rewardType,
          eventTitle: state.currentEvent?.title ?? null,
        }
      : null,
  };

  return JSON.stringify(payload);
}

