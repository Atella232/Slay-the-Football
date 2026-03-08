import { beforeEach, describe, expect, it } from 'vitest';

import { installDebugHooks } from '@/lib/debugHooks';
import { useGameStore } from '@/store/gameStore';

describe('debug hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetGame();
    installDebugHooks();
  });

  it('exposes deterministic debug helpers on window', () => {
    expect(window.setGameSeed?.(1337)).toBe(1337);
    expect(useGameStore.getState().nextSeed).toBe(1337);
    expect(window.getGameSeed?.()).toBe(1337);

    const beforeStart = JSON.parse(window.render_game_to_text?.() ?? '{}');
    expect(beforeStart.mode).toBe('team_select');

    useGameStore.getState().startGame('athletic');

    const afterStart = JSON.parse(window.render_game_to_text?.() ?? '{}');
    expect(afterStart.mode).toBe('map');
    expect(afterStart.seed).toBe(1337);
    expect(afterStart.player.team).toBe('athletic');
    expect(Array.isArray(afterStart.map.reachableRooms)).toBe(true);
    expect(window.advanceTime?.(16)).toBe(window.render_game_to_text?.());
    expect(window.getGameSeed?.()).toBe(1337);
  });
});