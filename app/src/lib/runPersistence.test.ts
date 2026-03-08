import { beforeEach, describe, expect, it } from 'vitest';

import { loadContinueRunSummary } from '@/lib/runPersistence';

describe('run persistence summary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when there is no active run to continue', () => {
    expect(loadContinueRunSummary()).toBeNull();
  });

  it('extracts a resumable run summary from persisted state', () => {
    localStorage.setItem('climb-the-league', JSON.stringify({
      state: {
        ascension: 4,
        currentSeed: 20260308,
        gameStarted: true,
        gameOver: false,
        victory: false,
        inCombat: true,
        showReward: false,
        turn: 6,
        map: {
          act: 2,
          currentRoomId: 'room_2_3',
        },
        player: {
          team: 'barcelona',
          hp: 42,
          maxHp: 75,
          gold: 91,
        },
      },
      version: 0,
    }));

    expect(loadContinueRunSummary()).toEqual({
      act: 2,
      ascension: 4,
      currentMode: 'combat',
      currentRoomId: 'room_2_3',
      gold: 91,
      hp: 42,
      maxHp: 75,
      seed: 20260308,
      team: 'barcelona',
      turn: 6,
    });
  });

  it('treats reward screens as resumable state too', () => {
    localStorage.setItem('climb-the-league', JSON.stringify({
      state: {
        ascension: 0,
        currentSeed: 77,
        gameStarted: true,
        gameOver: false,
        victory: false,
        inCombat: false,
        showReward: true,
        turn: 3,
        map: {
          act: 1,
          currentRoomId: 'room_1_1',
        },
        player: {
          team: 'athletic',
          hp: 63,
          maxHp: 85,
          gold: 28,
        },
      },
      version: 0,
    }));

    expect(loadContinueRunSummary()?.currentMode).toBe('reward');
  });

  it('ignores completed runs', () => {
    localStorage.setItem('climb-the-league', JSON.stringify({
      state: {
        gameStarted: true,
        gameOver: true,
        victory: false,
        map: { act: 4, currentRoomId: null },
        player: { team: 'madrid', hp: 0, maxHp: 80, gold: 140 },
      },
      version: 0,
    }));

    expect(loadContinueRunSummary()).toBeNull();
  });
});
