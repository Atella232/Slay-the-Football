import type { TeamType } from '@/types/game';

const STORAGE_KEY = 'climb-the-league';

export interface ContinueRunSummary {
  act: number;
  ascension: number;
  currentMode: 'map' | 'combat' | 'reward';
  currentRoomId: string | null;
  gold: number;
  hp: number;
  maxHp: number;
  seed: number | null;
  team: TeamType;
  turn: number;
}

interface PersistedRunState {
  ascension?: number;
  currentSeed?: number | null;
  gameOver?: boolean;
  gameStarted?: boolean;
  inCombat?: boolean;
  map?: {
    act?: number;
    currentRoomId?: string | null;
  };
  player?: {
    gold?: number;
    hp?: number;
    maxHp?: number;
    team?: TeamType;
  };
  rewardType?: unknown;
  showReward?: boolean;
  turn?: number;
  victory?: boolean;
}

function isTeamType(value: unknown): value is TeamType {
  return value === 'athletic' || value === 'barcelona' || value === 'madrid';
}

export function loadContinueRunSummary(): ContinueRunSummary | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: PersistedRunState } | PersistedRunState;
    const state = (
      typeof parsed === 'object' && parsed !== null && 'state' in parsed
        ? parsed.state ?? {}
        : parsed
    ) as PersistedRunState;

    if (!state.gameStarted || state.gameOver || state.victory) return null;
    if (!state.player || !state.map || !isTeamType(state.player.team)) return null;

    const currentMode = state.showReward
      ? 'reward'
      : state.inCombat
        ? 'combat'
        : 'map';

    return {
      act: Number.isFinite(state.map.act) ? Number(state.map.act) : 1,
      ascension: Number.isFinite(state.ascension) ? Number(state.ascension) : 0,
      currentMode,
      currentRoomId: state.map.currentRoomId ?? null,
      gold: Number.isFinite(state.player.gold) ? Number(state.player.gold) : 0,
      hp: Number.isFinite(state.player.hp) ? Number(state.player.hp) : 0,
      maxHp: Number.isFinite(state.player.maxHp) ? Number(state.player.maxHp) : 0,
      seed: Number.isFinite(state.currentSeed) ? Number(state.currentSeed) : null,
      team: state.player.team,
      turn: Number.isFinite(state.turn) ? Number(state.turn) : 1,
    };
  } catch {
    return null;
  }
}
