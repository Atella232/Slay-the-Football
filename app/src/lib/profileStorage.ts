import type { TeamType } from '@/types/game';

const STORAGE_KEY = 'climb-the-league';
const DEFAULT_UNLOCKED_TEAMS: TeamType[] = ['athletic'];

export interface ProfileState {
  ascension: number;
  unlockedTeams: TeamType[];
}

interface PersistedProfilePayload {
  state?: Record<string, unknown>;
  version?: number;
}

function normalizeUnlockedTeams(value: unknown): TeamType[] {
  if (!Array.isArray(value)) return DEFAULT_UNLOCKED_TEAMS;

  const teams = value.filter(
    (team): team is TeamType => team === 'athletic' || team === 'barcelona' || team === 'madrid'
  );

  if (!teams.includes('athletic')) {
    teams.unshift('athletic');
  }

  return teams;
}

function getDefaultProfileState(): ProfileState {
  return {
    ascension: 0,
    unlockedTeams: DEFAULT_UNLOCKED_TEAMS,
  };
}

function loadPersistedPayload(): PersistedProfilePayload {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as PersistedProfilePayload | Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as PersistedProfilePayload;
  } catch {
    return {};
  }
}

export function loadProfileState(): ProfileState {
  if (typeof window === 'undefined') {
    return getDefaultProfileState();
  }

  const parsed = loadPersistedPayload();
  const state = (
    typeof parsed === 'object' && parsed !== null && 'state' in parsed
      ? parsed.state ?? {}
      : parsed
  ) as Partial<ProfileState> & { profileAscension?: number };
  const ascensionSource = Number.isFinite(state.profileAscension) ? state.profileAscension : state.ascension;
  const ascensionValue = Number.isFinite(ascensionSource) ? Number(ascensionSource) : 0;

  return {
    ascension: Math.max(0, Math.min(20, Math.floor(ascensionValue))),
    unlockedTeams: normalizeUnlockedTeams(state.unlockedTeams),
  };
}

export function saveProfileState(profile: ProfileState): void {
  if (typeof window === 'undefined') return;

  const normalizedProfile: ProfileState = {
    ascension: Math.max(0, Math.min(20, Math.floor(profile.ascension))),
    unlockedTeams: normalizeUnlockedTeams(profile.unlockedTeams),
  };

  const persisted = loadPersistedPayload();
  const previousState = typeof persisted.state === 'object' && persisted.state !== null ? persisted.state : {};

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...persisted,
      state: {
        ...previousState,
        profileAscension: normalizedProfile.ascension,
        unlockedTeams: normalizedProfile.unlockedTeams,
      },
      version: typeof persisted.version === 'number' ? persisted.version : 0,
    })
  );
}
