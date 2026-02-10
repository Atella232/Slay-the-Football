import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { loadTelemetryData } from '@/lib/telemetry';
import { normalizeText } from '@/lib/text';
import type { TeamType } from '@/types/game';

interface TelemetryDashboardProps {
  onClose: () => void;
}

type TeamFilter = TeamType | 'all';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function teamLabel(team: TeamType): string {
  if (team === 'athletic') return 'Athletic';
  if (team === 'barcelona') return 'Barcelona';
  return 'Madrid';
}

export function TelemetryDashboard({ onClose }: TelemetryDashboardProps) {
  const data = useMemo(() => loadTelemetryData(), []);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [ascensionFilter, setAscensionFilter] = useState<'all' | number>('all');

  const filteredRuns = useMemo(() => {
    return data.runs.filter(run => {
      if (teamFilter !== 'all' && run.team !== teamFilter) return false;
      if (ascensionFilter !== 'all' && run.ascension !== ascensionFilter) return false;
      return true;
    });
  }, [data.runs, teamFilter, ascensionFilter]);

  const runIdSet = useMemo(() => new Set(filteredRuns.map(run => run.runId)), [filteredRuns]);

  const filteredCardPicks = useMemo(() => data.cardPicks.filter(pick => runIdSet.has(pick.runId)), [data.cardPicks, runIdSet]);
  const filteredRelicPicks = useMemo(() => data.relicPicks.filter(pick => runIdSet.has(pick.runId)), [data.relicPicks, runIdSet]);

  const summary = useMemo(() => {
    const totalRuns = filteredRuns.length;
    const victories = filteredRuns.filter(run => run.result === 'victory').length;
    const defeats = filteredRuns.filter(run => run.result === 'defeat').length;
    const winrate = totalRuns > 0 ? victories / totalRuns : 0;

    const byTeam = ['athletic', 'barcelona', 'madrid'].map(team => {
      const teamRuns = filteredRuns.filter(run => run.team === team);
      const teamWins = teamRuns.filter(run => run.result === 'victory').length;
      return {
        team: team as TeamType,
        runs: teamRuns.length,
        winrate: teamRuns.length > 0 ? teamWins / teamRuns.length : 0,
      };
    });

    const avgDamageDealt =
      totalRuns > 0 ? filteredRuns.reduce((acc, run) => acc + run.avgDamageDealtPerTurn, 0) / totalRuns : 0;
    const avgDamageTaken =
      totalRuns > 0 ? filteredRuns.reduce((acc, run) => acc + run.avgDamageTakenPerTurn, 0) / totalRuns : 0;

    const cardPickMap = new Map<string, number>();
    filteredCardPicks.forEach(pick => {
      cardPickMap.set(pick.name, (cardPickMap.get(pick.name) || 0) + 1);
    });
    const topCards = [...cardPickMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, picks]) => ({ name, picks }));

    const relicPickMap = new Map<string, number>();
    filteredRelicPicks.forEach(pick => {
      relicPickMap.set(pick.name, (relicPickMap.get(pick.name) || 0) + 1);
    });
    const topRelics = [...relicPickMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, picks]) => ({ name, picks }));

    return {
      totalRuns,
      victories,
      defeats,
      winrate,
      byTeam,
      avgDamageDealt,
      avgDamageTaken,
      topCards,
      topRelics,
    };
  }, [filteredRuns, filteredCardPicks, filteredRelicPicks]);

  const recentRuns = useMemo(() => {
    return [...filteredRuns]
      .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
      .slice(0, 12);
  }, [filteredRuns]);

  const uniqueAscensions = useMemo(() => {
    return [...new Set(data.runs.map(run => run.ascension))].sort((a, b) => a - b);
  }, [data.runs]);

  const trendSeries = useMemo(() => {
    return [...filteredRuns]
      .sort((a, b) => new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime())
      .slice(-20);
  }, [filteredRuns]);

  const maxDamage = useMemo(() => {
    return Math.max(
      1,
      ...trendSeries.map(run => Math.max(run.avgDamageDealtPerTurn, run.avgDamageTakenPerTurn))
    );
  }, [trendSeries]);

  return (
    <div className="screen-shell min-h-screen p-5 md:p-8 soft-grid">
      <div className="mx-auto max-w-7xl glass-panel rounded-3xl p-5 md:p-7">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Balance analytics</p>
            <h1 className="hero-title text-3xl md:text-4xl text-white mt-1">Telemetry Dashboard</h1>
          </div>
          <Button onClick={onClose} className="bg-rose-600 hover:bg-rose-500 text-white">
            Volver
          </Button>
        </header>

        <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-600/50 bg-slate-900/35 p-3">
            <p className="text-xs text-slate-300 mb-2">Filtro equipo</p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'athletic', 'barcelona', 'madrid'] as TeamFilter[]).map(team => (
                <Button
                  key={team}
                  size="sm"
                  onClick={() => setTeamFilter(team)}
                  className={teamFilter === team ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-700 hover:bg-slate-600'}
                >
                  {team === 'all' ? 'Todos' : teamLabel(team)}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-900/35 p-3">
            <p className="text-xs text-slate-300 mb-2">Filtro ascension</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setAscensionFilter('all')}
                className={ascensionFilter === 'all' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-700 hover:bg-slate-600'}
              >
                Todas
              </Button>
              {uniqueAscensions.slice(0, 12).map(level => (
                <Button
                  key={level}
                  size="sm"
                  onClick={() => setAscensionFilter(level)}
                  className={ascensionFilter === level ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-700 hover:bg-slate-600'}
                >
                  A{level}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-cyan-300/25 bg-cyan-950/20 p-3">
            <p className="text-xs text-cyan-200">Runs</p>
            <p className="text-xl font-bold text-white">{summary.totalRuns}</p>
          </div>
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-950/20 p-3">
            <p className="text-xs text-emerald-200">Winrate</p>
            <p className="text-xl font-bold text-white">{pct(summary.winrate)}</p>
          </div>
          <div className="rounded-xl border border-amber-300/25 bg-amber-950/20 p-3">
            <p className="text-xs text-amber-200">Dano/turno (hecho)</p>
            <p className="text-xl font-bold text-white">{summary.avgDamageDealt.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-rose-300/25 bg-rose-950/20 p-3">
            <p className="text-xs text-rose-200">Dano/turno (recibido)</p>
            <p className="text-xl font-bold text-white">{summary.avgDamageTaken.toFixed(1)}</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
          <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-200 mb-3">Tendencia ultimas 20 runs</h2>
          <div className="space-y-2">
            {trendSeries.length === 0 && <p className="text-sm text-slate-400">Sin datos.</p>}
            {trendSeries.map(run => {
              const dealtPct = (run.avgDamageDealtPerTurn / maxDamage) * 100;
              const takenPct = (run.avgDamageTakenPerTurn / maxDamage) * 100;
              return (
                <div key={run.runId} className="rounded-lg border border-slate-700/50 bg-slate-900/45 p-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200">{new Date(run.endedAt).toLocaleDateString()} · {teamLabel(run.team)} · A{run.ascension}</span>
                    <span className="text-slate-300">{run.result}</span>
                  </div>
                  <div className="h-2 bg-slate-700/70 rounded overflow-hidden mb-1">
                    <div className="h-full bg-cyan-400" style={{ width: `${dealtPct}%` }} />
                  </div>
                  <div className="h-2 bg-slate-700/70 rounded overflow-hidden">
                    <div className="h-full bg-rose-400" style={{ width: `${takenPct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">Cian: daño hecho · Rosa: daño recibido</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {summary.byTeam.map(item => (
            <div key={item.team} className="rounded-xl border border-slate-600/40 bg-slate-900/40 p-3">
              <p className="text-sm font-semibold text-white capitalize">{teamLabel(item.team)}</p>
              <p className="text-xs text-slate-300 mt-1">Runs: {item.runs}</p>
              <p className="text-xs text-slate-300">Winrate: {pct(item.winrate)}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-200 mb-3">Top cartas pickeadas</h2>
            <div className="space-y-2">
              {summary.topCards.length === 0 && <p className="text-sm text-slate-400">Sin datos.</p>}
              {summary.topCards.map(card => (
                <div key={card.name} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/45 px-3 py-2">
                  <span className="text-sm text-white">{normalizeText(card.name)}</span>
                  <span className="text-xs text-cyan-200">{card.picks} picks</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-amber-200 mb-3">Top reliquias pickeadas</h2>
            <div className="space-y-2">
              {summary.topRelics.length === 0 && <p className="text-sm text-slate-400">Sin datos.</p>}
              {summary.topRelics.map(relic => (
                <div key={relic.name} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/45 px-3 py-2">
                  <span className="text-sm text-white">{normalizeText(relic.name)}</span>
                  <span className="text-xs text-amber-200">{relic.picks} picks</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-200 mb-3">Ultimas runs</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-300 border-b border-slate-700/60">
                  <th className="text-left py-2 pr-3">Fecha</th>
                  <th className="text-left py-2 pr-3">Equipo</th>
                  <th className="text-left py-2 pr-3">Ascension</th>
                  <th className="text-left py-2 pr-3">Resultado</th>
                  <th className="text-left py-2 pr-3">Acto</th>
                  <th className="text-left py-2 pr-3">Turns</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.length === 0 && (
                  <tr>
                    <td className="py-3 text-slate-400" colSpan={6}>No hay runs registradas aun.</td>
                  </tr>
                )}
                {recentRuns.map(run => (
                  <tr key={run.runId} className="border-b border-slate-800/70">
                    <td className="py-2 pr-3 text-slate-200">{new Date(run.endedAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-white capitalize">{teamLabel(run.team)}</td>
                    <td className="py-2 pr-3 text-cyan-200">A{run.ascension}</td>
                    <td className="py-2 pr-3 text-slate-200">{run.result}</td>
                    <td className="py-2 pr-3 text-slate-200">{run.actReached}</td>
                    <td className="py-2 pr-3 text-slate-200">{run.turns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
