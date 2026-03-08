import { motion } from 'framer-motion';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getIntentEntry, getIntentPresentation, getStatusEntry } from '@/lib/glossary';
import { normalizeText } from '@/lib/text';
import type { Enemy as EnemyType } from '@/types/game';

interface EnemyProps {
  enemy: EnemyType;
  isTarget?: boolean;
  onClick?: () => void;
}

function getSeverityClass(severity: 'low' | 'medium' | 'high' | 'support'): string {
  if (severity === 'high') return 'border-rose-300/70 bg-rose-950/85 text-rose-50';
  if (severity === 'medium') return 'border-amber-300/60 bg-amber-950/80 text-amber-50';
  if (severity === 'support') return 'border-cyan-300/55 bg-cyan-950/80 text-cyan-50';
  return 'border-emerald-300/55 bg-emerald-950/75 text-emerald-50';
}

export function EnemyComponent({ enemy, isTarget = false, onClick }: EnemyProps) {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;
  const intentPresentation = getIntentPresentation(enemy);
  const intentEntry = getIntentEntry(enemy.intent.type);

  return (
    <motion.button
      type="button"
      whileHover={onClick ? { y: -4, scale: 1.03 } : {}}
      onClick={onClick}
      className={[
        'relative w-48 rounded-2xl px-4 pt-5 pb-4 text-left border transition-all duration-200',
        'bg-gradient-to-b from-slate-800/85 to-slate-950/90 shadow-[0_22px_50px_rgba(0,0,0,0.45)]',
        onClick ? 'cursor-pointer' : 'cursor-default',
        isTarget ? 'border-rose-400/80 ring-2 ring-rose-300/45' : 'border-slate-600/60',
      ].join(' ')}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute -top-4 left-4 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${getSeverityClass(intentPresentation.severity)}`}>
            {intentPresentation.badge}
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
          <p className="font-semibold text-white">{intentEntry?.title ?? 'Intencion enemiga'}</p>
          <p className="mt-1 text-xs text-slate-300">{intentEntry?.description ?? intentPresentation.detail}</p>
        </TooltipContent>
      </Tooltip>

      <div className="absolute -top-4 right-4 rounded-full border border-white/20 bg-slate-950/90 px-2 py-1 text-[10px] text-slate-200">
        {enemy.isBoss ? 'BOSS' : enemy.isElite ? 'ELITE' : 'NORMAL'}
      </div>

      <div className="mt-3 mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white leading-tight">{normalizeText(enemy.name)}</h3>
      </div>

      <div className={`rounded-xl border px-3 py-2 ${getSeverityClass(intentPresentation.severity)}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">Proxima accion</p>
        <p className="mt-1 text-sm font-semibold">{intentPresentation.headline}</p>
        <p className="mt-1 text-[11px] opacity-90">{normalizeText(intentPresentation.detail)}</p>
      </div>

      <div className="mt-3 h-3 rounded-full bg-slate-700/80 overflow-hidden border border-white/10">
        <div
          className={`h-full transition-all duration-300 ${hpPercent > 55 ? 'bg-emerald-400' : hpPercent > 30 ? 'bg-amber-400' : 'bg-rose-400'}`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-200">
        <span>{enemy.hp}/{enemy.maxHp} HP</span>
        <span className="text-cyan-200">BLK {enemy.block}</span>
      </div>

      {(enemy.buffs.length > 0 || enemy.debuffs.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {enemy.buffs.map((buff, index) => {
            const glossaryEntry = getStatusEntry(buff.id, buff.name);
            return (
              <Tooltip key={`${buff.id}_${index}`}>
                <TooltipTrigger asChild>
                  <span className="rounded px-1.5 py-0.5 text-[10px] bg-emerald-900/60 border border-emerald-400/35 text-emerald-100">
                    {normalizeText(buff.name)} {buff.value}
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-emerald-400/30 bg-slate-950 px-3 py-2 text-slate-100">
                  <p className="font-semibold text-white">{glossaryEntry?.title ?? normalizeText(buff.name)}</p>
                  <p className="mt-1 text-xs text-slate-300">{glossaryEntry?.description ?? 'Efecto positivo activo sobre el enemigo.'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {enemy.debuffs.map((debuff, index) => {
            const glossaryEntry = getStatusEntry(debuff.id, debuff.name);
            return (
              <Tooltip key={`${debuff.id}_${index}`}>
                <TooltipTrigger asChild>
                  <span className="rounded px-1.5 py-0.5 text-[10px] bg-rose-900/60 border border-rose-400/35 text-rose-100">
                    {normalizeText(debuff.name)} {debuff.value}
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-rose-400/30 bg-slate-950 px-3 py-2 text-slate-100">
                  <p className="font-semibold text-white">{glossaryEntry?.title ?? normalizeText(debuff.name)}</p>
                  <p className="mt-1 text-xs text-slate-300">{glossaryEntry?.description ?? 'Efecto negativo activo sobre el enemigo.'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </motion.button>
  );
}