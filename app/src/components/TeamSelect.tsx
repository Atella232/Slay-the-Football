import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { TelemetryDashboard } from '@/components/TelemetryDashboard';
import { getAscensionRulesUpTo } from '@/lib/ascension';
import { useGameStore } from '@/store/gameStore';
import type { TeamType } from '@/types/game';

interface TeamOption {
  id: TeamType;
  name: string;
  subtitle: string;
  description: string;
  hp: number;
  gradient: string;
  ring: string;
  locked: boolean;
}

export function TeamSelect() {
  const { unlockedTeams, startGame, ascension, setAscension } = useGameStore();
  const [localAscension, setLocalAscension] = useState(ascension);
  const [showTelemetry, setShowTelemetry] = useState(false);

  const teams: TeamOption[] = [
    {
      id: 'athletic',
      name: 'Athletic Club',
      subtitle: 'Presion y choque directo',
      description: 'Mazo robusto, defensa estable y golpes frontales.',
      hp: 85,
      gradient: 'from-rose-700/70 via-red-700/45 to-slate-900',
      ring: 'border-rose-300/45',
      locked: !unlockedTeams.includes('athletic'),
    },
    {
      id: 'barcelona',
      name: 'FC Barcelona',
      subtitle: 'Control y tempo',
      description: 'Juego tecnico, robo de cartas y valor por secuencia.',
      hp: 75,
      gradient: 'from-cyan-700/65 via-blue-700/40 to-slate-900',
      ring: 'border-cyan-300/45',
      locked: !unlockedTeams.includes('barcelona'),
    },
    {
      id: 'madrid',
      name: 'Real Madrid',
      subtitle: 'Picos de dano explosivo',
      description: 'Ataques de alto impacto con ritmo agresivo.',
      hp: 80,
      gradient: 'from-amber-400/50 via-zinc-700/35 to-slate-900',
      ring: 'border-amber-200/45',
      locked: !unlockedTeams.includes('madrid'),
    },
  ];

  const activeRules = useMemo(() => getAscensionRulesUpTo(localAscension), [localAscension]);

  if (showTelemetry) {
    return <TelemetryDashboard onClose={() => setShowTelemetry(false)} />;
  }

  return (
    <div className="screen-shell min-h-screen px-5 py-10 md:px-10 md:py-12 soft-grid">
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 md:p-8"
        >
          <p className="text-xs tracking-[0.32em] uppercase text-cyan-200/80 mb-3">Football Deckbuilding Roguelike</p>
          <h1 className="hero-title text-4xl md:text-6xl text-white">Climb The League</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Demo vertical slice. Escoge club, ajusta ascension y arranca una run completa de 4 actos.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTelemetry(true)}
              className="text-cyan-100 border-cyan-300/40 hover:bg-cyan-200/10"
            >
              Ver analytics
            </Button>
          </div>
        </motion.header>

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-panel rounded-3xl p-5 md:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Nivel de Ascension</h2>
              <span className="metric-pill text-sm text-amber-200">A{localAscension}</span>
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
                setAscension(next);
              }}
              className="mt-5 w-full accent-cyan-400"
            />

            <div className="mt-5 max-h-56 overflow-auto space-y-2 pr-2">
              {activeRules.length === 0 && (
                <p className="text-sm text-slate-400">A0: dificultad base.</p>
              )}
              {activeRules.map((rule) => (
                <div key={rule.level} className="rounded-xl border border-slate-600/50 bg-slate-900/45 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-cyan-200">{rule.title}</p>
                  <p className="text-sm text-slate-200">{rule.summary}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14 }}
            className="glass-panel rounded-3xl p-5 md:p-6"
          >
            <h2 className="text-xl font-semibold text-white">Progresion de desbloqueo</h2>
            <p className="text-sm text-slate-300 mt-2">Ganar con un club desbloquea el siguiente.</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-xl border border-slate-600/40 px-3 py-2 text-slate-200">
                {unlockedTeams.includes('athletic') ? 'Activo' : 'Bloqueado'} - Athletic Club
              </div>
              <div className="rounded-xl border border-slate-600/40 px-3 py-2 text-slate-200">
                {unlockedTeams.includes('barcelona') ? 'Activo' : 'Bloqueado'} - FC Barcelona
              </div>
              <div className="rounded-xl border border-slate-600/40 px-3 py-2 text-slate-200">
                {unlockedTeams.includes('madrid') ? 'Activo' : 'Bloqueado'} - Real Madrid
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <motion.article
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.08 }}
              className={`relative overflow-hidden rounded-3xl border ${team.ring} glass-panel`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${team.gradient}`} />
              <div className="relative p-6">
                <p className="text-xs tracking-[0.22em] uppercase text-slate-300">{team.subtitle}</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{team.name}</h3>
                <p className="mt-3 text-sm text-slate-200 min-h-[42px]">{team.description}</p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="metric-pill text-emerald-200 text-sm">{team.hp} HP base</span>
                  {team.locked ? (
                    <span className="metric-pill text-amber-200 text-sm">Bloqueado</span>
                  ) : (
                    <Button
                      onClick={() => {
                        setAscension(localAscension);
                        startGame(team.id);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                    >
                      Iniciar run
                    </Button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      </div>
    </div>
  );
}
