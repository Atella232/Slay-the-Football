import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CardComponent } from './Card';
import { EnemyComponent } from './Enemy';
import { getGlossaryEntry, getStatusEntry } from '@/lib/glossary';
import { normalizeText } from '@/lib/text';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { useGameStore } from '@/store/gameStore';

const pileOrder = ['draw', 'discard', 'exhaust'] as const;
type PileKey = (typeof pileOrder)[number];


function getPileLabel(pile: PileKey): string {
  if (pile === 'draw') return 'Mazo';
  if (pile === 'discard') return 'Descarte';
  return 'Exilio';
}

function getPileDescription(pile: PileKey): string {
  if (pile === 'draw') return 'Cartas pendientes de robar en esta pelea.';
  if (pile === 'discard') return 'Recursos ya gastados que volveran al ciclo.';
  return 'Cartas fuera de la rotacion actual.';
}

function getCardTypeLabel(type: string): string {
  if (type === 'attack') return 'Ataque';
  if (type === 'skill') return 'Skill';
  return 'Power';
}

function getInitialPile(): PileKey {
  if (typeof window === 'undefined') return 'draw';
  const debugPile = new URLSearchParams(window.location.search).get('debugPile');
  if (debugPile === 'discard' || debugPile === 'exhaust') return debugPile;
  return 'draw';
}

function getCombatLogToneClass(tone: 'neutral' | 'good' | 'warn' | 'bad'): string {
  if (tone === 'good') return 'border-emerald-400/35 bg-emerald-950/35 text-emerald-100';
  if (tone === 'warn') return 'border-amber-400/35 bg-amber-950/35 text-amber-100';
  if (tone === 'bad') return 'border-rose-400/35 bg-rose-950/35 text-rose-100';
  return 'border-slate-600/60 bg-slate-900/50 text-slate-100';
}

type CombatPlayer = ReturnType<typeof useGameStore.getState>['player'];
type CombatCueTone = 'neutral' | 'good' | 'warn' | 'bad';
type CombatCueAnchor = 'energy' | 'block' | 'trigger' | 'center';
type CombatTriggerKey = 'nextCardFree' | 'nextSkillFree' | 'nextAttackFree' | 'nextAttackDouble';

interface CombatCue {
  id: string;
  label: string;
  tone: CombatCueTone;
  anchor: CombatCueAnchor;
}

interface CombatFeedbackSnapshot {
  block: number;
  combatLogCount: number;
  energy: number;
  nextAttackDouble: boolean;
  nextAttackFree: boolean;
  nextCardFree: boolean;
  nextSkillFree: boolean;
  turn: number;
}

function getCueToneClass(tone: CombatCueTone): string {
  if (tone === 'good') return 'border-emerald-300/45 bg-emerald-500/18 text-emerald-50';
  if (tone === 'warn') return 'border-amber-300/45 bg-amber-500/18 text-amber-50';
  if (tone === 'bad') return 'border-rose-300/45 bg-rose-500/18 text-rose-50';
  return 'border-cyan-300/40 bg-slate-900/85 text-cyan-50';
}

function getTriggerEventLabel(triggerKey: CombatTriggerKey): string {
  if (triggerKey === 'nextCardFree') return 'Carta 0';
  if (triggerKey === 'nextSkillFree') return 'Skill 0';
  if (triggerKey === 'nextAttackFree') return 'Ataque 0';
  return 'Ataque x2';
}

function createCombatFeedbackSnapshot(player: CombatPlayer, combatLogCount: number, turn: number): CombatFeedbackSnapshot {
  return {
    block: player.block,
    combatLogCount,
    energy: player.energy,
    nextAttackDouble: !!player.nextAttackDouble,
    nextAttackFree: !!player.nextAttackFree,
    nextCardFree: !!player.nextCardFree,
    nextSkillFree: !!player.nextSkillFree,
    turn,
  };
}

function getCueFromCombatLog(text: string, tone: CombatCueTone): Omit<CombatCue, 'id'> | null {
  const normalized = normalizeText(text);
  const lowered = normalized.toLowerCase();

  if (
    lowered.includes('pasiva')
    || lowered.includes('plan de lezama')
    || lowered.includes('leyenda del club')
    || lowered.includes('pizarra del mister')
    || lowered.includes('rutina invisible')
    || lowered.includes('txapela de hierro')
    || lowered.includes('chaleco gps')
    || lowered.includes('umbral de posesion')
    || lowered.includes('control de montjuic')
    || lowered.includes('banda derecha')
  ) {
    return { label: normalized, tone, anchor: 'center' };
  }

  if (lowered.startsWith('usas ')) {
    return { label: normalized, tone: 'neutral', anchor: 'center' };
  }

  return null;
}

function GlossaryChip({ glossaryKey, value }: { glossaryKey: string; value: number }) {
  const entry = getGlossaryEntry(glossaryKey);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help rounded-lg border border-slate-600/60 bg-slate-900/40 p-2 text-left text-xs text-slate-100">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{entry?.shortLabel ?? glossaryKey}</p>
          <p className="mt-1 text-base font-semibold text-white">{value}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
        <p className="font-semibold text-white">{entry?.title ?? glossaryKey}</p>
        <p className="mt-1 text-xs text-slate-300">{entry?.description ?? 'Sin descripcion registrada.'}</p>
      </TooltipContent>
    </Tooltip>
  );
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
    combatLog,
    consumePotion,
  } = useGameStore();

  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [activePile, setActivePile] = useState<PileKey>(() => getInitialPile());
  const quickGlossary = useMemo(() => {
    const glossaryKeys = new Set<string>();
    glossaryKeys.add('block');
    glossaryKeys.add('garra');
    glossaryKeys.add('posesion');
    glossaryKeys.add('momentum');
    player.buffs.forEach(buff => {
      const entry = getStatusEntry(buff.id, buff.name);
      if (entry) glossaryKeys.add(entry.shortLabel.toLowerCase());
    });
    player.debuffs.forEach(debuff => {
      const entry = getStatusEntry(debuff.id, debuff.name);
      if (entry) glossaryKeys.add(entry.shortLabel.toLowerCase());
    });
    return Array.from(glossaryKeys)
      .map(key => ({ key, entry: getGlossaryEntry(key) }))
      .filter(item => item.entry !== null)
      .slice(0, 6);
  }, [player.buffs, player.debuffs]);

  const canPlayCard = (card: typeof player.hand[0]) => {
    let effectiveCost = card.tempCost ?? card.cost;
    if (player.nextCardFree) effectiveCost = 0;
    else if (player.nextSkillFree && card.type === 'skill') effectiveCost = 0;
    else if (player.nextAttackFree && card.type === 'attack') effectiveCost = 0;
    return player.energy >= effectiveCost;
  };

  const hpPercent = (player.hp / player.maxHp) * 100;
  const teamPresentation = getTeamPresentation(player.team);
  const pileCards = activePile === 'draw'
    ? player.drawPile
    : activePile === 'discard'
      ? player.discard
      : player.exhaust;
  const pendingTriggers = useMemo(() => {
    const triggers: Array<{ label: string; tone: 'good' | 'warn' | 'neutral' }> = [];
    if (player.nextCardFree) triggers.push({ label: 'Prox carta 0', tone: 'good' });
    if (player.nextSkillFree) triggers.push({ label: 'Skill 0', tone: 'good' });
    if (player.nextAttackFree) triggers.push({ label: 'Ataque 0', tone: 'good' });
    if (player.nextAttackDouble) triggers.push({ label: 'Ataque x2', tone: 'warn' });
    if ((player.blockRetainCap || 0) > 0) triggers.push({ label: 'Retiene ' + (player.blockRetainCap || 0) + ' BLK', tone: 'neutral' });
    if ((player.blockPerTurn || 0) > 0) triggers.push({ label: '+' + (player.blockPerTurn || 0) + ' BLK/turno', tone: 'neutral' });
    return triggers;
  }, [player.nextCardFree, player.nextSkillFree, player.nextAttackFree, player.nextAttackDouble, player.blockRetainCap, player.blockPerTurn]);
  const energySlots = useMemo(
    () => Array.from({ length: Math.max(player.maxEnergy, player.energy) }, (_, index) => index < player.energy),
    [player.energy, player.maxEnergy]
  );
  const recentCombatLog = useMemo(() => [...combatLog].reverse(), [combatLog]);
  const [combatCues, setCombatCues] = useState<CombatCue[]>([]);
  const feedbackSnapshotRef = useRef<CombatFeedbackSnapshot | null>(null);
  const cueCounterRef = useRef(0);
  const cueTimeoutsRef = useRef<Array<ReturnType<typeof window.setTimeout>>>([]);

  useEffect(() => () => {
    cueTimeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    cueTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    const previousSnapshot = feedbackSnapshotRef.current;
    const currentSnapshot = createCombatFeedbackSnapshot(player, combatLog.length, turn);
    feedbackSnapshotRef.current = currentSnapshot;

    if (!previousSnapshot) return;

    const queuedCues: CombatCue[] = [];
    const pushCue = (label: string, tone: CombatCueTone, anchor: CombatCueAnchor) => {
      queuedCues.push({
        id: `combat_cue_${cueCounterRef.current++}`,
        label,
        tone,
        anchor,
      });
    };

    const energyDelta = currentSnapshot.energy - previousSnapshot.energy;
    if (energyDelta !== 0) {
      pushCue(`${energyDelta > 0 ? '+' : ''}${energyDelta} energia`, energyDelta > 0 ? 'good' : 'warn', 'energy');
    }

    const blockDelta = currentSnapshot.block - previousSnapshot.block;
    if (blockDelta > 0) {
      pushCue(`+${blockDelta} bloqueo`, 'good', 'block');
    }

    const triggerKeys: CombatTriggerKey[] = ['nextCardFree', 'nextSkillFree', 'nextAttackFree', 'nextAttackDouble'];
    triggerKeys.forEach(triggerKey => {
      const hadTrigger = previousSnapshot[triggerKey];
      const hasTrigger = currentSnapshot[triggerKey];
      if (!hadTrigger && hasTrigger) {
        pushCue(`${getTriggerEventLabel(triggerKey)} lista`, 'good', 'trigger');
      } else if (hadTrigger && !hasTrigger) {
        const expired = previousSnapshot.turn !== currentSnapshot.turn;
        pushCue(`${getTriggerEventLabel(triggerKey)} ${expired ? 'expira' : 'consumida'}`, expired ? 'neutral' : 'warn', 'trigger');
      }
    });

    combatLog
      .slice(previousSnapshot.combatLogCount)
      .map(entry => getCueFromCombatLog(entry.text, entry.tone))
      .filter((cue): cue is Omit<CombatCue, 'id'> => cue !== null)
      .forEach(cue => {
        pushCue(cue.label, cue.tone, cue.anchor);
      });

    if (queuedCues.length === 0) return;

    const frameId = window.requestAnimationFrame(() => {
      setCombatCues(current => [...current, ...queuedCues].slice(-10));
    });

    queuedCues.forEach(cue => {
      const timeoutId = window.setTimeout(() => {
        setCombatCues(current => current.filter(currentCue => currentCue.id !== cue.id));
      }, cue.anchor === 'center' ? 2200 : 1600);
      cueTimeoutsRef.current.push(timeoutId);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    combatLog,
    player,
    turn,
  ]);

  const energyCues = combatCues.filter(cue => cue.anchor === 'energy');
  const blockCues = combatCues.filter(cue => cue.anchor === 'block');
  const triggerCues = combatCues.filter(cue => cue.anchor === 'trigger');
  const centerCues = combatCues.filter(cue => cue.anchor === 'center');

  const getCardHint = (card: typeof player.hand[0]) => {
    const effectiveCost = card.tempCost ?? card.cost;
    if ((player.nextCardFree || player.nextAttackFree) && player.nextAttackDouble && card.type === 'attack') {
      return { label: '0 x2', tone: 'warn' as const };
    }
    if (player.nextCardFree) return { label: 'Gratis', tone: 'good' as const };
    if (player.nextSkillFree && card.type === 'skill') return { label: 'Skill 0', tone: 'good' as const };
    if (player.nextAttackFree && card.type === 'attack') return { label: 'Atk 0', tone: 'good' as const };
    if (player.nextAttackDouble && card.type === 'attack') return { label: 'x2', tone: 'warn' as const };
    if (effectiveCost < card.cost) return { label: '-' + (card.cost - effectiveCost), tone: 'neutral' as const };
    return null;
  };

  const isCardPrimed = (card: typeof player.hand[0]) => (
    !!player.nextCardFree
    || (!!player.nextSkillFree && card.type === 'skill')
    || (!!player.nextAttackFree && card.type === 'attack')
    || (!!player.nextAttackDouble && card.type === 'attack')
  );

  if (!inCombat) return null;

  return (
    <div className="screen-shell soft-grid flex min-h-screen flex-col px-3 py-3 md:px-5 md:py-5">
      <header className="glass-panel flex flex-col gap-3 rounded-2xl px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Combate en curso</p>
          <div className="mt-1 flex items-center gap-3">
            <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`h-11 w-11 object-contain ${teamPresentation.emblemTint}`} />
            <h1 className={`hero-title bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-xl text-transparent`}>Turno {turn} - {teamPresentation.name}</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {pileOrder.map(pile => (
            <button
              key={pile}
              type="button"
              aria-label={`Abrir ${getPileLabel(pile).toLowerCase()}`}
              onClick={() => setActivePile(pile)}
              className={`metric-pill transition-colors ${activePile === pile ? 'border-cyan-300/40 bg-cyan-700/40 text-cyan-50' : 'text-slate-200'}`}
            >
              {getPileLabel(pile)} {pile === 'draw' ? player.drawPile.length : pile === 'discard' ? player.discard.length : player.exhaust.length}
            </button>
          ))}
          <span className="metric-pill text-amber-100">Oro {player.gold}</span>
        </div>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className={`glass-panel flex min-h-0 flex-col gap-3 rounded-2xl border ${teamPresentation.softAccent} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Equipo</p>
              <p className={`mt-1 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-lg font-bold text-transparent`}>{teamPresentation.name}</p>
            </div>
            <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`h-16 w-16 object-contain ${teamPresentation.emblemTint}`} />
          </div>

          <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-3">
            <p className="text-xs text-slate-300">Vida</p>
            <div className="mt-2 h-5 overflow-hidden rounded-full border border-white/10 bg-slate-700">
              <motion.div
                animate={{ width: `${hpPercent}%` }}
                className={`h-full ${hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 25 ? 'bg-amber-400' : 'bg-rose-400'}`}
              />
            </div>
            <p className="mt-1 text-xs text-slate-100">{player.hp}/{player.maxHp} HP</p>
          </div>

          <motion.div
            key={`energy-${player.energy}-${player.maxEnergy}-${pendingTriggers.length}`}
            initial={{ opacity: 0.72, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-xl border border-amber-400/30 bg-amber-950/25 p-3"
          >
            <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-1.5">
              <AnimatePresence>
                {energyCues.map(cue => (
                  <motion.div
                    key={cue.id}
                    initial={{ opacity: 0, x: 18, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, y: -16, scale: 1.04 }}
                    transition={{ duration: 0.22 }}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur ${getCueToneClass(cue.tone)}`}
                  >
                    {cue.label}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-amber-200">Energia</p>
                <p className="mt-1 text-2xl font-bold text-amber-300">{player.energy}/{player.maxEnergy}</p>
              </div>
              <div className="flex max-w-32 flex-wrap justify-end gap-1.5">
                <AnimatePresence initial={false}>
                  {energySlots.map((isActive, index) => (
                    <motion.span
                      key={`energy_${index}_${isActive ? 'on' : 'off'}`}
                      initial={{ opacity: 0.5, scale: 0.8 }}
                      animate={{ opacity: 1, scale: isActive ? [1, 1.14, 1] : 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.22 }}
                      className={`h-3.5 w-3.5 rounded-full border ${isActive ? 'border-amber-200 bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.55)]' : 'border-slate-500/70 bg-slate-800/80'}`}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
            {pendingTriggers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {pendingTriggers.map(trigger => (
                    <motion.span
                      key={trigger.label}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: [1, 1.04, 1] }}
                      exit={{ opacity: 0, y: -10, scale: 0.88 }}
                      transition={{ duration: 0.22 }}
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${trigger.tone === 'good' ? 'border-emerald-300/45 bg-emerald-500/15 text-emerald-100' : trigger.tone === 'warn' ? 'border-amber-300/45 bg-amber-500/15 text-amber-100' : 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'}`}
                    >
                      {trigger.label}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex flex-col items-end gap-1.5">
              <AnimatePresence>
                {triggerCues.map(cue => (
                  <motion.div
                    key={cue.id}
                    initial={{ opacity: 0, y: 12, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 1.05 }}
                    transition={{ duration: 0.22 }}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur ${getCueToneClass(cue.tone)}`}
                  >
                    {cue.label}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            <motion.div
              key={`block-${player.block}-${player.blockRetainCap || 0}-${player.blockPerTurn || 0}`}
              initial={{ opacity: 0.72, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-lg border border-cyan-400/30 bg-cyan-950/25 p-2 text-left"
            >
              <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col items-end gap-1">
                <AnimatePresence>
                  {blockCues.map(cue => (
                    <motion.div
                      key={cue.id}
                      initial={{ opacity: 0, y: 10, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 1.04 }}
                      transition={{ duration: 0.22 }}
                      className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur ${getCueToneClass(cue.tone)}`}
                    >
                      {cue.label}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">Bloqueo</p>
              <p className="mt-1 text-base font-semibold text-white">{player.block}</p>
              <p className="mt-1 text-[11px] text-cyan-100/80">
                {(player.blockRetainCap || 0) > 0 ? 'Retiene hasta ' + (player.blockRetainCap || 0) : 'Sin retencion'}
              </p>
              {(player.blockPerTurn || 0) > 0 && (
                <p className="text-[11px] text-cyan-100/80">+{player.blockPerTurn} al inicio</p>
              )}
            </motion.div>
            <div className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/25 p-2 text-xs text-fuchsia-200">
              <p className="text-[11px] uppercase tracking-[0.16em] text-fuchsia-300/80">Estados</p>
              <p className="mt-1 text-base font-semibold text-white">{player.buffs.length + player.debuffs.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <GlossaryChip glossaryKey="garra" value={player.garra || 0} />
            <GlossaryChip glossaryKey="posesion" value={player.posesion || 0} />
            <GlossaryChip glossaryKey="momentum" value={player.momentum || 0} />
          </div>

          {player.buffs.length > 0 && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/25 p-3">
              <p className="mb-2 text-xs text-emerald-200">Mejoras</p>
              <div className="flex flex-wrap gap-1">
                {player.buffs.map((buff, index) => {
                  const glossaryEntry = getStatusEntry(buff.id, buff.name);
                  return (
                    <Tooltip key={`${buff.id}_${index}`}>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded border border-emerald-400/30 bg-emerald-900/60 px-1.5 py-0.5 text-[10px] text-emerald-100">
                          {normalizeText(buff.name)} {buff.value}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-emerald-400/30 bg-slate-950 px-3 py-2 text-slate-100">
                        <p className="font-semibold text-white">{glossaryEntry?.title ?? normalizeText(buff.name)}</p>
                        <p className="mt-1 text-xs text-slate-300">{glossaryEntry?.description ?? 'Efecto positivo activo sobre el jugador.'}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {player.debuffs.length > 0 && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-950/25 p-3">
              <p className="mb-2 text-xs text-rose-200">Debilidades</p>
              <div className="flex flex-wrap gap-1">
                {player.debuffs.map((debuff, index) => {
                  const glossaryEntry = getStatusEntry(debuff.id, debuff.name);
                  return (
                    <Tooltip key={`${debuff.id}_${index}`}>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded border border-rose-400/30 bg-rose-900/60 px-1.5 py-0.5 text-[10px] text-rose-100">
                          {normalizeText(debuff.name)} {debuff.value}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-rose-400/30 bg-slate-950 px-3 py-2 text-slate-100">
                        <p className="font-semibold text-white">{glossaryEntry?.title ?? normalizeText(debuff.name)}</p>
                        <p className="mt-1 text-xs text-slate-300">{glossaryEntry?.description ?? 'Efecto negativo activo sobre el jugador.'}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-600/60 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Glosario rapido</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickGlossary.map(item => (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    <span className="metric-pill cursor-help text-xs text-slate-100">{item.entry?.shortLabel}</span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                    <p className="font-semibold text-white">{item.entry?.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{item.entry?.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-cyan-400/30 bg-cyan-950/25 p-3">
            <p className="mb-2 text-xs text-cyan-200">Pociones {player.potions.length}/{player.maxPotionSlots}</p>
            <div className="flex flex-col gap-1.5">
              {player.potions.length === 0 && <span className="text-xs text-slate-400">Sin pociones</span>}
              {player.potions.map((potion, index) => (
                <button
                  key={potion.id}
                  type="button"
                  onClick={() => consumePotion(index, selectedTarget)}
                  title={normalizeText(potion.description)}
                  className="rounded-lg border border-cyan-300/30 bg-cyan-800/35 px-2 py-1 text-left text-xs text-slate-100 transition-colors hover:bg-cyan-700/50"
                >
                  {normalizeText(potion.name)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="glass-panel relative flex min-h-0 flex-col rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Campo</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Objetivo activo: {enemies[selectedTarget]?.name ?? 'Sin objetivo'}</h2>
            </div>
            <span className="metric-pill text-cyan-100">Enemigos {enemies.length}</span>
          </div>

          <div className="pointer-events-none absolute right-4 top-16 z-30 flex max-w-[min(26rem,80%)] flex-col items-end gap-2">
            <AnimatePresence>
              {centerCues.map(cue => (
                <motion.div
                  key={cue.id}
                  initial={{ opacity: 0, x: 22, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, y: -18, scale: 1.04 }}
                  transition={{ duration: 0.24 }}
                  className={`rounded-2xl border px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.16em] shadow-[0_18px_45px_rgba(2,6,23,0.42)] backdrop-blur ${getCueToneClass(cue.tone)}`}
                >
                  {cue.label}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="relative mt-4 flex min-h-[280px] flex-1 flex-wrap items-center justify-center gap-4 md:gap-6">
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
                      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-3xl font-bold text-rose-400 drop-shadow-lg"
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
                  className="pointer-events-none absolute left-6 top-8 text-3xl font-bold text-rose-400 drop-shadow-lg"
                >
                  -{effect.damage}
                </motion.div>
              ))}
          </div>

          <footer className="mt-3 flex items-end justify-between gap-3 border-t border-slate-600/50 pt-3">
            <div className="flex-1 overflow-x-auto pb-2">
              <div className="flex min-w-max items-end px-2">
                {player.hand.map((card, index) => {
                  const hint = getCardHint(card);
                  return (
                    <motion.div
                      key={`${card.id}_${index}`}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.04 }}
                      className="transition-all hover:z-50 hover:-translate-y-12 hover:scale-105"
                      style={{ marginLeft: index > 0 ? -30 : 0, zIndex: index }}
                    >
                      <CardComponent
                        card={card}
                        onClick={() => playCard(index, selectedTarget)}
                        disabled={!canPlayCard(card)}
                        isInHand
                        hintLabel={hint?.label}
                        hintTone={hint?.tone}
                        isPrimed={isCardPrimed(card)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={endTurn}
              size="lg"
              className="rounded-xl border border-rose-300/40 bg-gradient-to-b from-rose-600 to-red-800 px-8 py-6 font-semibold text-white hover:from-rose-500 hover:to-red-700"
            >
              Finalizar turno
            </Button>
          </footer>
        </section>

        <aside className="glass-panel flex min-h-[260px] flex-col rounded-2xl p-4 xl:min-h-0">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Panel de mazo</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{getPileLabel(activePile)}</h2>
            <p className="mt-2 text-sm text-slate-300">{getPileDescription(activePile)}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {pileOrder.map(pile => (
              <button
                key={pile}
                type="button"
                aria-label={`Ver ${getPileLabel(pile).toLowerCase()}`}
                onClick={() => setActivePile(pile)}
                className={`rounded-xl border px-3 py-2 text-left transition-colors ${activePile === pile ? 'border-cyan-300/40 bg-cyan-900/25 text-cyan-50' : 'border-slate-600/60 bg-slate-900/40 text-slate-200 hover:bg-slate-800/60'}`}
              >
                <p className="text-[11px] uppercase tracking-[0.18em]">{getPileLabel(pile)}</p>
                <p className="mt-1 text-lg font-semibold">
                  {pile === 'draw' ? player.drawPile.length : pile === 'discard' ? player.discard.length : player.exhaust.length}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Log de combate</p>
                <p className="mt-1 text-sm text-slate-300">Ultimas {recentCombatLog.length || 0} acciones visibles</p>
              </div>
              <span className="metric-pill text-xs text-slate-100">B19</span>
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {recentCombatLog.length === 0 ? (
                <div className="rounded-xl border border-slate-700/60 bg-slate-900/45 p-3 text-xs text-slate-400">
                  Aun no hay acciones registradas en este combate.
                </div>
              ) : (
                recentCombatLog.map(entry => (
                  <div key={entry.id} className={`rounded-xl border px-3 py-2 text-sm ${getCombatLogToneClass(entry.tone)}`}>
                    {normalizeText(entry.text)}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-2 overflow-auto pr-1">
            {pileCards.length === 0 ? (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-400">
                No hay cartas en esta pila ahora mismo.
              </div>
            ) : (
              pileCards.map((card, index) => (
                <div key={`${card.id}_${index}`} className="rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{normalizeText(card.name)}</p>
                      <p className="mt-1 text-xs text-slate-400">{getCardTypeLabel(card.type)} - {card.rarity}</p>
                    </div>
                    <span className="metric-pill text-xs text-amber-100">Coste {card.tempCost ?? card.cost}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs text-slate-300">{normalizeText(card.description)}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}






