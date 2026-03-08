import { useState } from 'react';

import { CardComponent } from '@/components/Card';
import { EnemyComponent } from '@/components/Enemy';
import { act1Enemies, act2Enemies, act3Enemies, act4Enemies, bossEnemies, eliteEnemies } from '@/data/enemies';
import { allCards } from '@/data/cards';
import { getCardArtSrc } from '@/lib/cardArt';
import { getEnemyArtSrc } from '@/lib/enemyArt';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { normalizeText } from '@/lib/text';
import type { Card, TeamType } from '@/types/game';

type TeamFilter = 'all' | 'neutral' | TeamType;
type ArtFilter = 'all' | 'with-art' | 'missing-art';

const allEnemyEntries = [...act1Enemies, ...act2Enemies, ...act3Enemies, ...act4Enemies, ...eliteEnemies, ...bossEnemies].sort((left, right) => {
  const leftRank = left.isBoss ? 2 : left.isElite ? 1 : 0;
  const rightRank = right.isBoss ? 2 : right.isElite ? 1 : 0;
  if (leftRank !== rightRank) return rightRank - leftRank;
  return left.name.localeCompare(right.name, 'es');
});

const allCardEntries = [...allCards].sort((left, right) => {
  if (left.team !== right.team) return left.team.localeCompare(right.team, 'es');
  return left.name.localeCompare(right.name, 'es');
});

function getFilterButtonClass(active: boolean): string {
  return active
    ? 'border-cyan-300/50 bg-cyan-700/30 text-cyan-50'
    : 'border-slate-600/60 bg-slate-900/45 text-slate-200 hover:bg-slate-800/60';
}

function getTeamLabel(team: TeamFilter): string {
  if (team === 'all') return 'Todos';
  if (team === 'neutral') return 'Neutrales';
  return getTeamPresentation(team).name;
}

function getCardSubtitle(card: Card): string {
  return `${card.team.toUpperCase()} · ${card.type.toUpperCase()} · ${card.rarity.toUpperCase()}`;
}

function getEnemyTier(enemy: (typeof allEnemyEntries)[number]): string {
  if (enemy.isBoss) return 'Boss';
  if (enemy.isElite) return 'Elite';
  return 'Normal';
}

interface ArtGalleryProps {
  initialTeam: TeamType;
}

export function ArtGallery({ initialTeam }: ArtGalleryProps) {
  const [cardTeam, setCardTeam] = useState<TeamFilter>(initialTeam);
  const [cardArtFilter, setCardArtFilter] = useState<ArtFilter>('with-art');
  const [enemyArtFilter, setEnemyArtFilter] = useState<ArtFilter>('with-art');

  const visibleCards = allCardEntries.filter(card => {
    const artSrc = getCardArtSrc(card);
    if (cardTeam !== 'all' && card.team !== cardTeam) return false;
    if (cardArtFilter === 'with-art') return !!artSrc;
    if (cardArtFilter === 'missing-art') return !artSrc;
    return true;
  });

  const visibleEnemies = allEnemyEntries.filter(enemy => {
    const artSrc = getEnemyArtSrc(enemy.id);
    if (enemyArtFilter === 'with-art') return !!artSrc;
    if (enemyArtFilter === 'missing-art') return !artSrc;
    return true;
  });

  const cardsWithArt = allCardEntries.filter(card => !!getCardArtSrc(card)).length;
  const enemiesWithArt = allEnemyEntries.filter(enemy => !!getEnemyArtSrc(enemy.id)).length;

  return (
    <div className="screen-shell min-h-screen px-4 py-5 text-slate-100 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="glass-panel rounded-[28px] border border-slate-700/60 p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Debug art gallery</p>
              <h1 className="hero-title mt-2 text-3xl text-white md:text-4xl">Revision de ilustraciones</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
                Vista de curacion para revisar arte a tamano grande y tambien dentro del marco real de carta o enemigo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/45 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Cartas con arte</p>
                <p className="mt-1 text-2xl font-semibold text-white">{cardsWithArt}/{allCardEntries.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/45 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Enemigos con arte</p>
                <p className="mt-1 text-2xl font-semibold text-white">{enemiesWithArt}/{allEnemyEntries.length}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 glass-panel rounded-[28px] border border-slate-700/60 p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">Cartas</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Galeria de cartas</h2>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                {(['all', 'neutral', 'athletic', 'barcelona', 'madrid'] as TeamFilter[]).map(team => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setCardTeam(team)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${getFilterButtonClass(cardTeam === team)}`}
                  >
                    {getTeamLabel(team)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['with-art', 'missing-art', 'all'] as ArtFilter[]).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCardArtFilter(filter)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${getFilterButtonClass(cardArtFilter === filter)}`}
                  >
                    {filter === 'with-art' ? 'Con arte' : filter === 'missing-art' ? 'Sin arte' : 'Todas'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleCards.map(card => {
              const artSrc = getCardArtSrc(card);
              return (
                <article key={`${card.team}_${card.id}`} className="rounded-[26px] border border-slate-700/60 bg-slate-950/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{normalizeText(card.name)}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{getCardSubtitle(card)}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${artSrc ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100' : 'border-rose-300/35 bg-rose-500/15 text-rose-100'}`}>
                      {artSrc ? 'Arte listo' : 'Falta arte'}
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/65">
                    {artSrc ? (
                      <img alt={`${normalizeText(card.name)} art preview`} src={artSrc} className="aspect-[16/9] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-sm uppercase tracking-[0.25em] text-slate-400">
                        Sin ilustracion
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-center rounded-2xl border border-slate-700/60 bg-slate-950/30 p-4">
                    <div className="pointer-events-none">
                      <CardComponent card={card} disabled />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-5 glass-panel rounded-[28px] border border-slate-700/60 p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">Enemigos</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Galeria de enemigos</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['with-art', 'missing-art', 'all'] as ArtFilter[]).map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setEnemyArtFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${getFilterButtonClass(enemyArtFilter === filter)}`}
                >
                  {filter === 'with-art' ? 'Con arte' : filter === 'missing-art' ? 'Sin arte' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleEnemies.map(enemy => {
              const artSrc = getEnemyArtSrc(enemy.id);
              return (
                <article key={enemy.id} className="rounded-[26px] border border-slate-700/60 bg-slate-950/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{normalizeText(enemy.name)}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{getEnemyTier(enemy)} · {enemy.maxHp} HP</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${artSrc ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100' : 'border-rose-300/35 bg-rose-500/15 text-rose-100'}`}>
                      {artSrc ? 'Arte listo' : 'Falta arte'}
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/65">
                    {artSrc ? (
                      <img alt={`${normalizeText(enemy.name)} art preview`} src={artSrc} className="aspect-[16/9] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-sm uppercase tracking-[0.25em] text-slate-400">
                        Sin ilustracion
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-center rounded-2xl border border-slate-700/60 bg-slate-950/30 p-4">
                    <div className="pointer-events-none">
                      <EnemyComponent enemy={enemy} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
