import { beforeEach, describe, expect, it } from 'vitest';

import { loadProfileState, saveProfileState } from '@/lib/profileStorage';

describe('profile storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads profile state from the shared storage payload', () => {
    localStorage.setItem('climb-the-league', JSON.stringify({
      state: {
        profileAscension: 3,
        unlockedTeams: ['athletic', 'barcelona'],
      },
      version: 0,
    }));

    expect(loadProfileState()).toEqual({
      ascension: 3,
      unlockedTeams: ['athletic', 'barcelona'],
    });
  });

  it('falls back to legacy ascension when profileAscension is absent', () => {
    localStorage.setItem('climb-the-league', JSON.stringify({
      state: {
        ascension: 2,
        unlockedTeams: ['athletic'],
      },
      version: 0,
    }));

    expect(loadProfileState().ascension).toBe(2);
  });

  it('preserves active run data when saving profile changes', () => {
    localStorage.setItem('climb-the-league', JSON.stringify({
      state: {
        ascension: 1,
        unlockedTeams: ['athletic'],
        gameStarted: true,
        turn: 9,
        player: {
          team: 'madrid',
          hp: 35,
          maxHp: 80,
          gold: 112,
        },
        map: {
          act: 3,
          currentRoomId: 'room_3_2',
        },
      },
      version: 0,
    }));

    saveProfileState({ ascension: 5, unlockedTeams: ['athletic', 'barcelona', 'madrid'] });

    const persisted = JSON.parse(localStorage.getItem('climb-the-league') || '{}') as { state: Record<string, unknown> };
    expect(persisted.state.profileAscension).toBe(5);
    expect(persisted.state.ascension).toBe(1);
    expect(persisted.state.unlockedTeams).toEqual(['athletic', 'barcelona', 'madrid']);
    expect(persisted.state.gameStarted).toBe(true);
    expect((persisted.state.player as { team: string }).team).toBe('madrid');
    expect((persisted.state.map as { act: number }).act).toBe(3);
  });
});
