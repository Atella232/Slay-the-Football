import type { Enemy as EnemyType } from '@/types/game';
import { motion } from 'framer-motion';
import { normalizeText } from '@/lib/text';

interface EnemyProps {
  enemy: EnemyType;
  isTarget?: boolean;
  onClick?: () => void;
}

function getIntentIcon(intent: EnemyType['intent']['type']): string {
  if (intent === 'attack') return 'ATK';
  if (intent === 'defend') return 'DEF';
  if (intent === 'buff') return 'BUF';
  if (intent === 'debuff') return 'DBF';
  return '...';
}

export function EnemyComponent({ enemy, isTarget = false, onClick }: EnemyProps) {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;

  return (
    <motion.button
      type="button"
      whileHover={onClick ? { y: -4, scale: 1.03 } : {}}
      onClick={onClick}
      className={[
        'relative w-44 rounded-2xl px-4 pt-5 pb-4 text-left border transition-all duration-200',
        'bg-gradient-to-b from-slate-800/85 to-slate-950/90 shadow-[0_22px_50px_rgba(0,0,0,0.45)]',
        onClick ? 'cursor-pointer' : 'cursor-default',
        isTarget ? 'border-rose-400/80 ring-2 ring-rose-300/45' : 'border-slate-600/60',
      ].join(' ')}
    >
      <div className="absolute -top-4 left-4 rounded-full border border-cyan-300/35 bg-slate-950/90 px-2 py-1 text-[10px] font-bold tracking-wide text-cyan-200">
        {getIntentIcon(enemy.intent.type)}
      </div>

      <div className="absolute -top-4 right-4 rounded-full border border-white/20 bg-slate-950/90 px-2 py-1 text-[10px] text-slate-200">
        {enemy.isBoss ? 'BOSS' : enemy.isElite ? 'ELITE' : 'NORMAL'}
      </div>

      <div className="mt-3 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white leading-tight">{normalizeText(enemy.name)}</h3>
      </div>

      <p className="text-[11px] text-slate-300 min-h-[34px]">{normalizeText(enemy.intent.description)}</p>

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
          {enemy.buffs.map((buff, index) => (
            <span key={`${buff.id}_${index}`} className="rounded px-1.5 py-0.5 text-[10px] bg-emerald-900/60 border border-emerald-400/35 text-emerald-100">
              {normalizeText(buff.name)} {buff.value}
            </span>
          ))}
          {enemy.debuffs.map((debuff, index) => (
            <span key={`${debuff.id}_${index}`} className="rounded px-1.5 py-0.5 text-[10px] bg-rose-900/60 border border-rose-400/35 text-rose-100">
              {normalizeText(debuff.name)} {debuff.value}
            </span>
          ))}
        </div>
      )}
    </motion.button>
  );
}
