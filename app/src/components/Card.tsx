import { motion } from 'framer-motion';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getGlossaryEntry } from '@/lib/glossary';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { normalizeText } from '@/lib/text';
import type { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isInHand?: boolean;
  hintLabel?: string;
  hintTone?: 'neutral' | 'good' | 'warn';
  isPrimed?: boolean;
}

function getCardTheme(cardType: CardType['type']): string {
  if (cardType === 'attack') return 'from-rose-700/90 via-rose-800/90 to-red-950';
  if (cardType === 'skill') return 'from-cyan-700/85 via-sky-800/85 to-blue-950';
  return 'from-amber-600/85 via-orange-700/85 to-zinc-900';
}

function getTeamBorder(team: CardType['team']): string {
  if (team === 'athletic') return 'border-rose-400/70';
  if (team === 'barcelona') return 'border-cyan-400/70';
  if (team === 'madrid') return 'border-amber-300/70';
  return 'border-slate-400/60';
}

function getTypeLabel(type: CardType['type']): string {
  if (type === 'attack') return 'ATK';
  if (type === 'skill') return 'SKL';
  return 'PWR';
}
function getTeamBadgeLabel(team: CardType['team']): string {
  if (team === 'athletic') return 'ATH';
  if (team === 'barcelona') return 'BAR';
  if (team === 'madrid') return 'RMA';
  return 'NEU';
}

function getHintToneClass(hintTone: 'neutral' | 'good' | 'warn'): string {
  if (hintTone === 'good') return 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100';
  if (hintTone === 'warn') return 'border-amber-300/60 bg-amber-500/20 text-amber-100';
  return 'border-cyan-300/55 bg-cyan-500/20 text-cyan-100';
}

function getPrimedFrameClass(hintTone: 'neutral' | 'good' | 'warn'): string {
  if (hintTone === 'good') return 'border-emerald-200/65';
  if (hintTone === 'warn') return 'border-amber-200/65';
  return 'border-cyan-200/65';
}

function getPrimedGlow(hintTone: 'neutral' | 'good' | 'warn'): string[] {
  if (hintTone === 'good') {
    return [
      '0 16px 35px rgba(0,0,0,0.45)',
      '0 0 0 1px rgba(167,243,208,0.45), 0 0 26px rgba(16,185,129,0.32)',
      '0 16px 35px rgba(0,0,0,0.45)',
    ];
  }
  if (hintTone === 'warn') {
    return [
      '0 16px 35px rgba(0,0,0,0.45)',
      '0 0 0 1px rgba(253,230,138,0.42), 0 0 28px rgba(245,158,11,0.34)',
      '0 16px 35px rgba(0,0,0,0.45)',
    ];
  }
  return [
    '0 16px 35px rgba(0,0,0,0.45)',
    '0 0 0 1px rgba(165,243,252,0.42), 0 0 24px rgba(34,211,238,0.28)',
    '0 16px 35px rgba(0,0,0,0.45)',
  ];
}

export function CardComponent({ card, onClick, disabled = false, isInHand = false, hintLabel, hintTone = 'neutral', isPrimed = false }: CardProps) {
  const shownCost = card.tempCost ?? card.cost;
  const displayName = normalizeText(card.name);
  const displayDescription = normalizeText(card.description);
  const teamPresentation = card.team === 'neutral' ? null : getTeamPresentation(card.team);

  return (
    <motion.button
      type="button"
      whileHover={isInHand && !disabled ? { y: -18, scale: 1.05 } : { y: -3, scale: 1.01 }}
      whileTap={isInHand && !disabled ? { scale: 0.97 } : { scale: 0.99 }}
      animate={isPrimed && !disabled ? { boxShadow: getPrimedGlow(hintTone) } : undefined}
      transition={isPrimed && !disabled ? { duration: 1.35, repeat: Infinity, ease: 'easeInOut' } : undefined}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative h-52 w-36 overflow-hidden rounded-xl
        border ${getTeamBorder(card.team)}
        bg-gradient-to-br ${getCardTheme(card.type)}
        shadow-[0_16px_35px_rgba(0,0,0,0.45)]
        transition-all duration-200
        ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}
      `}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.17),transparent_55%)]" />
      {teamPresentation && (
        <>
          <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${teamPresentation.headerGradient}`} />
          <img
            alt={`${teamPresentation.name} crest`}
            src={teamPresentation.crestSrc}
            className="pointer-events-none absolute right-3 top-[92px] h-12 w-12 object-contain opacity-25"
          />
        </>
      )}
      {isPrimed && !disabled && (
        <motion.div
          initial={{ opacity: 0.14 }}
          animate={{ opacity: [0.14, 0.38, 0.14] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className={`pointer-events-none absolute inset-[3px] rounded-[10px] border ${getPrimedFrameClass(hintTone)}`}
        />
      )}

      <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/45 text-sm font-bold text-amber-300">
        {shownCost}
      </div>

      <div className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-100">
        {getTypeLabel(card.type)}
      </div>

      {teamPresentation && (
        <div className={`absolute left-11 top-2 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${teamPresentation.pillAccent}`}>
{getTeamBadgeLabel(card.team)}
        </div>
      )}

      {hintLabel && (
        <div className={`absolute right-2 top-11 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${getHintToneClass(hintTone)}`}>
          {hintLabel}
        </div>
      )}

      <div className="absolute left-3 right-3 top-12 text-left">
        <p className="line-clamp-2 text-sm font-bold leading-tight text-white">{displayName}</p>
      </div>

      <div className="absolute inset-x-3 top-[84px] flex h-[62px] items-center justify-center rounded-lg border border-white/10 bg-black/20">
        <span className="text-xl font-semibold text-white/85">{getTypeLabel(card.type)}</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 min-h-[64px] rounded-lg border border-white/10 bg-black/45 px-2 py-2">
        <p className="line-clamp-4 text-left text-[11px] leading-snug text-slate-100">{displayDescription}</p>
      </div>

      {card.keywords && card.keywords.length > 0 && (
        <div className="absolute bottom-[74px] left-3 right-3 flex flex-wrap gap-1">
          {card.keywords.slice(0, 2).map((keyword, index) => {
            const glossaryEntry = getGlossaryEntry(keyword);
            return (
              <Tooltip key={`${keyword}_${index}`}>
                <TooltipTrigger asChild>
                  <span className="rounded border border-white/10 bg-black/55 px-1.5 py-0.5 text-[9px] text-cyan-200">
                    {(glossaryEntry?.shortLabel ?? keyword).toUpperCase()}
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6} className="max-w-56 rounded-xl border border-cyan-300/30 bg-slate-950 px-3 py-2 text-slate-100">
                  <p className="font-semibold text-white">{glossaryEntry?.title ?? keyword.toUpperCase()}</p>
                  <p className="mt-1 text-xs text-slate-300">{glossaryEntry?.description ?? 'Keyword sin descripcion registrada.'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}

      <div
        className={`
          absolute right-3 top-[74px] h-2.5 w-2.5 rounded-full
          ${card.rarity === 'common' ? 'bg-slate-300' : ''}
          ${card.rarity === 'uncommon' ? 'bg-cyan-300' : ''}
          ${card.rarity === 'rare' ? 'bg-amber-300' : ''}
        `}
      />

      {card.upgraded && (
        <div className="absolute bottom-3 right-3 text-[11px] font-bold tracking-widest text-amber-300">UP+</div>
      )}
    </motion.button>
  );
}

