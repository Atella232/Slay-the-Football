import { lazy, startTransition, Suspense, useEffect, useState, type ReactNode } from 'react';

import { TeamSelect } from '@/components/TeamSelect';
import { Toaster } from '@/components/ui/sonner';
import { loadProfileState, saveProfileState, type ProfileState } from '@/lib/profileStorage';
import { loadContinueRunSummary, type ContinueRunSummary } from '@/lib/runPersistence';
import type { TeamType } from '@/types/game';

const RuntimeApp = lazy(() => import('@/components/RuntimeApp').then(module => ({ default: module.RuntimeApp })));

interface RuntimeConfig {
  ascension: number;
  debugRoom: string | null;
  resume: boolean;
  seed: number | null;
  team: TeamType;
}

function ScreenTransition({ children, screenKey }: { children: ReactNode; screenKey: string }) {
  return (
    <div key={screenKey} className="screen-transition">
      {children}
    </div>
  );
}

function ScreenLoading() {
  return (
    <div className="screen-shell min-h-screen px-4 py-6 md:px-8 md:py-7 soft-grid">
      <div className="mx-auto max-w-4xl glass-panel rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Loading screen</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Preparando la siguiente escena</h2>
        <p className="mt-3 text-sm text-slate-300">El runtime del juego se carga bajo demanda para bajar el peso de la home.</p>
      </div>
    </div>
  );
}

function getDebugTeam(value: string | null): TeamType | null {
  if (value === 'athletic' || value === 'barcelona' || value === 'madrid') return value;
  return null;
}

function getDebugRuntimeConfig(ascension: number): RuntimeConfig | null {
  if (typeof window === 'undefined') return null;

  const isLocalDebugHost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  if (!import.meta.env.DEV && !isLocalDebugHost) return null;

  const params = new URLSearchParams(window.location.search);
  const debugTeam = getDebugTeam(params.get('debugTeam'));
  if (!debugTeam) return null;

  const debugSeedRaw = params.get('debugSeed');
  const debugSeed = debugSeedRaw === null ? null : Number(debugSeedRaw);

  return {
    ascension,
    debugRoom: params.get('debugRoom'),
    resume: false,
    seed: Number.isFinite(debugSeed) ? (debugSeed as number) : null,
    team: debugTeam,
  };
}

function getInitialBootState(): {
  continueRun: ContinueRunSummary | null;
  nextSeed: number | null;
  profile: ProfileState;
  runtimeConfig: RuntimeConfig | null;
} {
  const profile = loadProfileState();
  const runtimeConfig = getDebugRuntimeConfig(profile.ascension);

  return {
    continueRun: loadContinueRunSummary(),
    nextSeed: runtimeConfig?.seed ?? null,
    profile,
    runtimeConfig,
  };
}

function App() {
  const [initialBootState] = useState(() => getInitialBootState());
  const [profile, setProfile] = useState<ProfileState>(initialBootState.profile);
  const [nextSeed, setNextSeed] = useState<number | null>(initialBootState.nextSeed);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(initialBootState.runtimeConfig);
  const [continueRun, setContinueRun] = useState<ContinueRunSummary | null>(initialBootState.continueRun);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.setGameSeed = (seed: number) => {
      const normalized = Number.isFinite(seed) ? Math.trunc(seed) : null;
      setNextSeed(normalized);
      return normalized;
    };

    window.getGameSeed = () => runtimeConfig?.seed ?? nextSeed;
  }, [nextSeed, runtimeConfig]);

  const screenKey = runtimeConfig ? 'runtime' : 'team-select';

  return (
    <>
      <Suspense fallback={<ScreenLoading />}>
        <ScreenTransition screenKey={screenKey}>
          {runtimeConfig ? (
            <RuntimeApp
              initialConfig={runtimeConfig}
              onExitToMenu={() => {
                const refreshedProfile = loadProfileState();
                setProfile(refreshedProfile);
                setContinueRun(loadContinueRunSummary());
                setRuntimeConfig(null);
              }}
            />
          ) : (
            <TeamSelect
              ascension={profile.ascension}
              continueRun={continueRun}
              nextSeed={nextSeed}
              onAscensionChange={(ascension) => {
                const nextProfile = { ...profile, ascension };
                saveProfileState(nextProfile);
                setProfile(nextProfile);
              }}
              onContinue={() => {
                if (!continueRun) return;
                startTransition(() => {
                  setRuntimeConfig({
                    ascension: continueRun.ascension,
                    debugRoom: null,
                    resume: true,
                    seed: continueRun.seed,
                    team: continueRun.team,
                  });
                });
              }}
              onStart={(team) => {
                startTransition(() => {
                  setRuntimeConfig({
                    ascension: profile.ascension,
                    debugRoom: null,
                    resume: false,
                    seed: nextSeed,
                    team,
                  });
                });
              }}
              unlockedTeams={profile.unlockedTeams}
            />
          )}
        </ScreenTransition>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
