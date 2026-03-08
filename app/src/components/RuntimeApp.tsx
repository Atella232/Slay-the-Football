import { useEffect, useLayoutEffect } from 'react';

import { ArtGallery } from '@/components/ArtGallery';
import { Combat } from '@/components/Combat';
import { EventRoom } from '@/components/EventRoom';
import { GameOver } from '@/components/GameOver';
import { MapComponent } from '@/components/Map';
import { RestSite } from '@/components/RestSite';
import { RewardScreen } from '@/components/RewardScreen';
import { Shop } from '@/components/Shop';
import { TreasureRoom } from '@/components/TreasureRoom';
import { allEvents } from '@/data/events';
import { installDebugHooks } from '@/lib/debugHooks';
import { useGameStore } from '@/store/gameStore';
import type { TeamType } from '@/types/game';

export interface RuntimeConfig {
  ascension: number;
  debugRoom: string | null;
  resume: boolean;
  seed: number | null;
  team: TeamType;
}

interface RuntimeAppProps {
  initialConfig: RuntimeConfig;
  onExitToMenu: () => void;
}

export function RuntimeApp({ initialConfig, onExitToMenu }: RuntimeAppProps) {
  const { gameOver, victory, inCombat, gameStarted, showReward, rewardType } = useGameStore();

  useLayoutEffect(() => {
    installDebugHooks();

    const state = useGameStore.getState();
    const hasActiveRun = state.gameStarted && !state.gameOver && !state.victory;
    if (initialConfig.resume && hasActiveRun) {
      return;
    }

    state.resetGame();
    state.setAscension(initialConfig.ascension);
    if (Number.isFinite(initialConfig.seed)) {
      state.setNextSeed(initialConfig.seed as number);
    }
    state.startGame(initialConfig.team);

    if (initialConfig.debugRoom === 'first') {
      const firstRoom = useGameStore.getState().map.rooms.find(room => room.y === 0);
      if (firstRoom) {
        useGameStore.getState().selectRoom(firstRoom.id);
      }
    }

    if (initialConfig.debugRoom === 'reward') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'combat',
      }));
    }

    if (initialConfig.debugRoom === 'elite_reward') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'combat',
        map: {
          ...currentState.map,
          currentRoomId: 'debug_elite_reward',
          rooms: [{ id: 'debug_elite_reward', type: 'elite', x: 0, y: 0, connections: [] }],
        },
      }));
    }

    if (initialConfig.debugRoom === 'boss_reward') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'boss',
      }));
    }

    if (initialConfig.debugRoom === 'shop') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'shop',
        currentEvent: null,
        map: {
          ...currentState.map,
          currentRoomId: 'debug_shop',
          rooms: [{ id: 'debug_shop', type: 'shop', x: 0, y: 0, connections: [] }],
        },
      }));
    }

    if (initialConfig.debugRoom === 'event') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'event',
        currentEvent: allEvents[0],
        map: {
          ...currentState.map,
          currentRoomId: 'debug_event',
          rooms: [{ id: 'debug_event', type: 'event', x: 0, y: 0, connections: [] }],
        },
      }));
    }

    if (initialConfig.debugRoom === 'rest') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'rest',
        currentEvent: null,
        map: {
          ...currentState.map,
          currentRoomId: 'debug_rest',
          rooms: [{ id: 'debug_rest', type: 'rest', x: 0, y: 0, connections: [] }],
        },
      }));
    }

    if (initialConfig.debugRoom === 'treasure') {
      useGameStore.setState(currentState => ({
        ...currentState,
        inCombat: false,
        showReward: true,
        rewardType: 'treasure',
        currentEvent: null,
        map: {
          ...currentState.map,
          currentRoomId: 'debug_treasure',
          rooms: [{ id: 'debug_treasure', type: 'treasure', x: 0, y: 0, connections: [] }],
        },
      }));
    }
  }, [initialConfig.ascension, initialConfig.debugRoom, initialConfig.resume, initialConfig.seed, initialConfig.team]);

  useEffect(() => {
    if (!useGameStore.getState().gameStarted) {
      onExitToMenu();
    }
  }, [gameStarted, onExitToMenu]);

  if (initialConfig.debugRoom === 'art_gallery') {
    return <ArtGallery initialTeam={initialConfig.team} />;
  }

  if (gameOver || victory) {
    return <GameOver />;
  }

  if (showReward) {
    if (rewardType === 'rest') return <RestSite />;
    if (rewardType === 'combat' || rewardType === 'boss') return <RewardScreen />;
    if (rewardType === 'shop') return <Shop />;
    if (rewardType === 'event') return <EventRoom />;
    if (rewardType === 'treasure') return <TreasureRoom />;
  }

  if (inCombat) {
    return <Combat />;
  }

  return <MapComponent />;
}

