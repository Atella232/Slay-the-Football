import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { CardComponent } from './Card';
import { EnemyComponent } from './Enemy';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';

function getTeamName(team: string): string {
  if (team === 'athletic') return 'Athletic Club';
  if (team === 'barcelona') return 'FC Barcelona';
  return 'Real Madrid';
}

export function Combat() {
  const {
    player,
    enemies,
    turn,
    playCard,
    endTurn,
    inCombat,
    damageEffects,
    consumePotion,
  } = useGameStore();

  const [selectedTarget, setSelectedTarget] = useState<number>(0);

  if (!inCombat) return null;

  const canPlayCard = (card: typeof player.hand[0]) => {
    let effectiveCost = card.tempCost ?? card.cost;
    if (player.nextCardFree) effectiveCost = 0;
    else if (player.nextSkillFree && card.type === 'skill') effectiveCost = 0;
    else if (player.nextAttackFree && card.type === 'attack') effectiveCost = 0;
    return player.energy >= effectiveCost;
  };

  const hpPercent = (player.hp / player.maxHp) * 100;

  return (
    <div className="screen-shell min-h-screen flex flex-col px-3 py-3 md:px-5 md:py-5 soft-grid">
      <header className="glass-panel rounded-2xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Combate en curso</p>
          <h1 className="hero-title text-xl text-white">Turno {turn} · {getTeamName(player.team)}</h1>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="metric-pill text-slate-200">Mazo {player.drawPile.length}</span>
          <span className="metric-pill text-slate-200">Descarte {player.discard.length}</span>
          <span className="metric-pill text-slate-200">Exilio {player.exhaust.length}</span>
          <span className="metric-pill text-amber-100">Oro {player.gold}</span>
        </div>
      </header>

      <div className="mt-3 flex-1 grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-3 min-h-0">
        <aside className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Equipo</p>
            <p className="text-lg font-bold text-white mt-1">{getTeamName(player.team)}</p>
          </div>

          <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-3">
            <p className="text-xs text-slate-300">Vida</p>
            <div className="mt-2 h-5 rounded-full bg-slate-700 overflow-hidden border border-white/10">
              <motion.div
                animate={{ width: `${hpPercent}%` }}
                className={`h-full ${hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 25 ? 'bg-amber-400' : 'bg-rose-400'}`}
              />
            </div>
            <p className="mt-1 text-xs text-slate-100">{player.hp}/{player.maxHp} HP</p>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-950/25 p-3">
            <p className="text-xs text-amber-200">Energia</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{player.energy}/{player.maxEnergy}</p>
            {player.nextCardFree && <p className="text-xs text-emerald-300">Proxima carta gratis</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-950/25 p-2 text-cyan-200">Bloqueo: {player.block}</div>
            <div className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/25 p-2 text-fuchsia-200">Buffs: {player.buffs.length}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-rose-400/30 bg-rose-950/25 p-2 text-rose-200">Garra: {player.garra || 0}</div>
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-950/25 p-2 text-cyan-200">Posesion: {player.posesion || 0}</div>
            <div className="rounded-lg border border-amber-400/30 bg-amber-950/25 p-2 text-amber-200">Momentum: {player.momentum || 0}</div>
          </div>

          {player.buffs.length > 0 && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/25 p-3">
              <p className="text-xs text-emerald-200 mb-2">Mejoras</p>
              <div className="flex flex-wrap gap-1">
                {player.buffs.map((buff, index) => (
                  <span key={`${buff.id}_${index}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-100 border border-emerald-400/30">
                    {normalizeText(buff.name)} {buff.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {player.debuffs.length > 0 && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-950/25 p-3">
              <p className="text-xs text-rose-200 mb-2">Debilidades</p>
              <div className="flex flex-wrap gap-1">
                {player.debuffs.map((debuff, index) => (
                  <span key={`${debuff.id}_${index}`} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-100 border border-rose-400/30">
                    {normalizeText(debuff.name)} {debuff.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/25 p-3 mt-auto">
            <p className="text-xs text-cyan-200 mb-2">Pociones {player.potions.length}/{player.maxPotionSlots}</p>
            <div className="flex flex-col gap-1.5">
              {player.potions.length === 0 && <span className="text-xs text-slate-400">Sin pociones</span>}
              {player.potions.map((potion, index) => (
                <button
                  key={potion.id}
                  type="button"
                  onClick={() => consumePotion(index, selectedTarget)}
                  title={normalizeText(potion.description)}
                  className="text-left rounded-lg border border-cyan-300/30 bg-cyan-800/35 px-2 py-1 text-xs text-slate-100 hover:bg-cyan-700/50 transition-colors"
                >
                  {normalizeText(potion.name)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="glass-panel rounded-2xl p-4 flex flex-col min-h-0">
          <div className="flex-1 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {enemies.map((enemy, index) => (
              <div key={enemy.id} className="relative">
                <EnemyComponent
                  enemy={enemy}
                  isTarget={selectedTarget === index}
                  onClick={() => setSelectedTarget(index)}
                />
                {damageEffects
                  .filter(effect => effect.target === 'enemy' && effect.targetIndex === index)
                  .map(effect => (
                    <motion.div
                      key={effect.id}
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -48, scale: 1.4 }}
                      transition={{ duration: 0.75 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl font-bold text-rose-400 pointer-events-none drop-shadow-lg"
                    >
                      -{effect.damage}
                    </motion.div>
                  ))}
              </div>
            ))}

            {damageEffects
              .filter(effect => effect.target === 'player')
              .map(effect => (
                <motion.div
                  key={effect.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -42, scale: 1.4 }}
                  transition={{ duration: 0.75 }}
                  className="absolute top-8 left-6 text-3xl font-bold text-rose-400 pointer-events-none drop-shadow-lg"
                >
                  -{effect.damage}
                </motion.div>
              ))}
          </div>

          <footer className="mt-3 pt-3 border-t border-slate-600/50 flex items-end justify-between gap-3">
            <div className="flex-1 overflow-x-auto pb-2">
              <div className="flex items-end min-w-max px-2">
                {player.hand.map((card, index) => (
                  <motion.div
                    key={`${card.id}_${index}`}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="transition-all hover:-translate-y-12 hover:scale-105 hover:z-50"
                    style={{ marginLeft: index > 0 ? -30 : 0, zIndex: index }}
                  >
                    <CardComponent
                      card={card}
                      onClick={() => playCard(index, selectedTarget)}
                      disabled={!canPlayCard(card)}
                      isInHand
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <Button
              onClick={endTurn}
              size="lg"
              className="bg-gradient-to-b from-rose-600 to-red-800 hover:from-rose-500 hover:to-red-700 text-white font-semibold px-8 py-6 rounded-xl border border-rose-300/40"
            >
              Finalizar turno
            </Button>
          </footer>
        </section>
      </div>
    </div>
  );
}
