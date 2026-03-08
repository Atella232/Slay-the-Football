import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ContinueRunSummary } from '@/lib/runPersistence';
import { getTeamPresentation, type TeamPresentation } from '@/lib/teamPresentation';
import type { TeamType } from '@/types/game';

const TelemetryDashboard = lazy(() =>
  import('@/components/TelemetryDashboard').then(module => ({ default: module.TelemetryDashboard }))
);

interface TeamOption {
  description: string;
  gameplan: string;
  hp: number;
  id: TeamType;
  locked: boolean;
  mechanic: string;
  presentation: TeamPresentation;
  starterRelicDescription: string;
  starterRelicName: string;
  subtitle: string;
}

interface TeamSelectProps {
  ascension: number;
  continueRun: ContinueRunSummary | null;
  nextSeed: number | null;
  onAscensionChange: (ascension: number) => void;
  onContinue: () => void;
  onStart: (team: TeamType) => void;
  unlockedTeams: TeamType[];
}

function getSeedLabel(seed: number | null): string {
  return seed === null ? 'Seed aleatoria' : `Seed ${seed}`;
}

function getTeamLabel(team: TeamType): string {
  return getTeamPresentation(team).name;
}

function getContinueModeLabel(mode: ContinueRunSummary['currentMode']): string {
  if (mode === 'combat') return 'En combate';
  if (mode === 'reward') return 'En recompensa';
  return 'En mapa';
}

function TeamCrest({ alt, className, src }: { alt: string; className: string; src: string }) {
  return <img alt={alt} src={src} className={className} />;
}

export function TeamSelect({ ascension, continueRun, nextSeed, onAscensionChange, onContinue, onStart, unlockedTeams }: TeamSelectProps) {
  const [localAscension, setLocalAscension] = useState(ascension);
  const [showTelemetry, setShowTelemetry] = useState(false);

  useEffect(() => {
    setLocalAscension(ascension);
  }, [ascension]);

  const teams: TeamOption[] = [
    {
      id: 'athletic',
      subtitle: 'Presion y choque directo',
      description: 'Mazo robusto, defensa estable y golpes frontales.',
      hp: 85,
      locked: !unlockedTeams.includes('athletic'),
      mechanic: 'Garra y exhaust defensivo.',
      gameplan: 'Bloquea, aguanta y remata con cartas que escalan por resistencia.',
      starterRelicName: 'Sangre de Leon',
      starterRelicDescription: 'Al final de cada partido, cura 5 HP.',
      presentation: getTeamPresentation('athletic'),
    },
    {
      id: 'barcelona',
      subtitle: 'Control y tempo',
      description: 'Juego tecnico, robo de cartas y valor por secuencia.',
      hp: 75,
      locked: !unlockedTeams.includes('barcelona'),
      mechanic: 'Posesion y cadenas de skills.',
      gameplan: 'Encadena turnos largos, abarata mano y gana ventaja de recursos.',
      starterRelicName: 'La Masia',
      starterRelicDescription: 'Al inicio de cada partido, roba 2 cartas adicionales.',
      presentation: getTeamPresentation('barcelona'),
    },
    {
      id: 'madrid',
      subtitle: 'Picos de dano explosivo',
      description: 'Ataques de alto impacto con ritmo agresivo.',
      hp: 80,
      locked: !unlockedTeams.includes('madrid'),
      mechanic: 'Momentum y ataque tras skill.',
      gameplan: 'Prepara ventanas cortas de burst y cierra rapido los combates.',
      starterRelicName: 'Decimocuarta',
      starterRelicDescription: 'Al inicio de cada partido, inflige 3 de dano a todos los enemigos.',
      presentation: getTeamPresentation('madrid'),
    },
  ];

  const activeRules = useMemo(() => {
    if (localAscension <= 0) return [];

    return Array.from({ length: Math.min(localAscension, 20) }, (_, index) => {
      const level = index + 1;
      if (level <= 3) {
        return {
          level,
          summary: 'Los enemigos pegan un poco mas duro y el margen de error baja.',
          title: `Ascension ${level}`,
        };
      }

      if (level <= 8) {
        return {
          level,
          summary: 'La economia se aprieta y el castigo por ruta floja se nota antes.',
          title: `Ascension ${level}`,
        };
      }

      if (level <= 14) {
        return {
          level,
          summary: 'La run exige mazos mas compactos, reliquias utiles y mejores curvas.',
          title: `Ascension ${level}`,
        };
      }

      return {
        level,
        summary: 'Modo alto riesgo: menos colchones y peleas que castigan mucho mas cualquier tempo perdido.',
        title: `Ascension ${level}`,
      };
    });
  }, [localAscension]);
  const latestRules = activeRules.slice(-3);

  if (showTelemetry) {
    return (
      <Suspense
        fallback={
          <div className="screen-shell min-h-screen px-4 py-6 md:px-8 md:py-7 soft-grid">
            <div className="mx-auto max-w-5xl glass-panel rounded-3xl p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Analytics</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Cargando telemetria</h2>
              <p className="mt-3 text-sm text-slate-300">El dashboard se carga aparte para no penalizar la pantalla inicial.</p>
            </div>
          </div>
        }
      >
        <TelemetryDashboard onClose={() => setShowTelemetry(false)} />
      </Suspense>
    );
  }

  return (
    <div className="screen-shell min-h-screen px-4 py-6 md:px-8 md:py-7 soft-grid">
      <div className="mx-auto max-w-7xl">
        <section className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-4 items-start">
          <header className="glass-panel rounded-3xl p-6 md:p-7 screen-rise">
            <p className="text-xs tracking-[0.32em] uppercase text-cyan-200/80 mb-3">Football Deckbuilding Roguelike</p>
            <h1 className="hero-title text-4xl md:text-5xl xl:text-6xl text-white leading-none">Climb The League</h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-slate-300">
              Elige club, fija la dificultad y arranca la run desde esta misma pantalla. La home ya no deberia ser un paso intermedio: aqui empiezas a jugar.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="metric-pill text-cyan-100">4 actos</span>
              <span className="metric-pill text-amber-100">3 clubes</span>
              <span className="metric-pill text-slate-100">{getSeedLabel(nextSeed)}</span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {teams.map((team) => (
                <div key={team.id} className={`rounded-2xl border ${team.presentation.softAccent} px-4 py-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{team.subtitle}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{team.presentation.name}</p>
                    </div>
                    <TeamCrest
                      alt={`${team.presentation.name} crest`}
                      src={team.presentation.crestSrc}
                      className={`h-14 w-14 object-contain ${team.presentation.emblemTint}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-300">Reliquia inicial: {team.starterRelicName}</p>
                  <p className={`mt-2 text-xs ${team.presentation.pillAccent}`}>{team.mechanic}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTelemetry(true)}
                className="text-cyan-100 border-cyan-300/40 hover:bg-cyan-200/10"
              >
                Ver analytics
              </Button>
            </div>
          </header>

          <aside className="glass-panel rounded-3xl p-5 md:p-6 screen-slide-in">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Inicio rapido</p>
                <h2 className="text-2xl font-semibold text-white mt-1">Arranca una run</h2>
              </div>
              <span className="metric-pill text-sm text-amber-200">A{localAscension}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-600/50 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Nivel de ascension</h3>
                <span className="text-xs text-slate-300">{latestRules.length === 0 ? 'Base' : `${latestRules.length} ajustes activos`}</span>
              </div>

              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={localAscension}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setLocalAscension(next);
                  onAscensionChange(next);
                }}
                className="mt-4 w-full accent-cyan-400"
              />

              <div className="mt-4 space-y-2">
                {latestRules.length === 0 && (
                  <p className="text-sm text-slate-400">A0: dificultad base y economia sin penalizaciones.</p>
                )}
                {latestRules.map((rule) => (
                  <div key={rule.level} className="rounded-xl border border-slate-700/60 bg-slate-900/55 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-cyan-200">{rule.title}</p>
                    <p className="text-sm text-slate-200">{rule.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {continueRun && (
              <div className={`mt-4 rounded-2xl border ${getTeamPresentation(continueRun.team).softAccent} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">Run guardada</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Continuar con {getTeamLabel(continueRun.team)}</h3>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="metric-pill text-xs text-emerald-200">{getContinueModeLabel(continueRun.currentMode)}</span>
                    <TeamCrest
                      alt={`${getTeamLabel(continueRun.team)} crest`}
                      src={getTeamPresentation(continueRun.team).crestSrc}
                      className={`h-14 w-14 object-contain ${getTeamPresentation(continueRun.team).emblemTint}`}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
                  <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">Acto {continueRun.act}</span>
                  <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">Turno {continueRun.turn}</span>
                  <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">HP {continueRun.hp}/{continueRun.maxHp}</span>
                  <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">{continueRun.gold} oro</span>
                </div>

                <p className="mt-3 text-xs text-slate-300">
                  Ascension A{continueRun.ascension}. {getSeedLabel(continueRun.seed)}.
                  {continueRun.currentRoomId ? ` Nodo actual: ${continueRun.currentRoomId}.` : ''}
                </p>

                <Button onClick={onContinue} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                  Continuar run
                </Button>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  disabled={team.locked}
                  onClick={() => onStart(team.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${team.locked ? 'border-slate-700/70 bg-slate-900/30 text-slate-500 cursor-not-allowed' : `${team.presentation.softAccent} hover:bg-slate-900/65 text-white`}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <TeamCrest
                        alt={`${team.presentation.name} crest`}
                        src={team.presentation.crestSrc}
                        className={`mt-0.5 h-14 w-14 shrink-0 object-contain ${team.presentation.emblemTint} ${team.locked ? 'opacity-45' : ''}`}
                      />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{team.subtitle}</p>
                        <h3 className="mt-1 text-lg font-semibold">{team.presentation.name}</h3>
                      </div>
                    </div>
                    <span className={`metric-pill text-xs ${team.locked ? 'text-slate-500' : team.presentation.pillAccent}`}>
                      {team.locked ? 'Bloqueado' : 'Iniciar run'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{team.gameplan}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="metric-pill text-amber-100">{team.hp} HP</span>
                    <span className={`metric-pill ${team.presentation.pillAccent}`}>{team.starterRelicName}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-600/50 bg-slate-950/35 p-4">
              <h3 className="text-sm font-semibold text-white">Progresion de desbloqueo</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {teams.map(team => (
                  <div key={team.id} className={`flex items-center gap-3 rounded-xl border border-slate-700/60 px-3 py-2 text-slate-200 ${team.presentation.softAccent}`}>
                    <TeamCrest alt={`${team.presentation.name} crest`} src={team.presentation.crestSrc} className="h-9 w-9 object-contain" />
                    <span>{team.locked ? 'Bloqueado' : 'Activo'} - {team.presentation.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {teams.map((team, index) => (
            <article
              key={team.id}
              className={`relative overflow-hidden rounded-3xl border ${team.presentation.panelRing} glass-panel screen-rise`}
              style={{ animationDelay: `${120 + index * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${team.presentation.panelAccent}`} />
              <div className="relative p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-[0.22em] uppercase text-slate-300">{team.subtitle}</p>
                    <h3 className={`mt-2 bg-gradient-to-r ${team.presentation.headerGradient} bg-clip-text text-2xl font-bold text-transparent`}>
                      {team.presentation.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <TeamCrest
                      alt={`${team.presentation.name} crest`}
                      src={team.presentation.crestSrc}
                      className={`h-20 w-20 object-contain ${team.presentation.emblemTint}`}
                    />
                    <span className="metric-pill text-emerald-200 text-sm">{team.hp} HP</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-100/95">{team.description}</p>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200">Reliquia inicial</p>
                    <p className="mt-1 text-white">{team.starterRelicName}</p>
                    <p className="mt-1 text-slate-300 text-xs">{team.starterRelicDescription}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200">Mecanica clave</p>
                    <p className="mt-1 text-white">{team.mechanic}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200">Plan de juego</p>
                    <p className="mt-1 text-slate-200">{team.gameplan}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  {team.locked ? (
                    <span className="metric-pill text-amber-200 text-sm">Bloqueado</span>
                  ) : (
                    <Button onClick={() => onStart(team.id)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                      Iniciar run
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

