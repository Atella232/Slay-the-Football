import { motion } from 'framer-motion';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCardArtSrc } from '@/lib/cardArt';
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
  if (cardType === 'attack') return 'from-rose-500 via-fuchsia-700 to-rose-900';
  if (cardType === 'skill') return 'from-sky-500 via-cyan-700 to-blue-900';
  return 'from-amber-400 via-orange-600 to-stone-900';
}

function getCardInnerTone(cardType: CardType['type']): string {
  if (cardType === 'attack') return 'from-rose-400/88 via-rose-700/92 to-rose-950';
  if (cardType === 'skill') return 'from-sky-400/84 via-cyan-700/92 to-blue-950';
  return 'from-amber-300/84 via-orange-600/88 to-stone-950';
}

function getRarityFrame(rarity: CardType['rarity']): { outer: string; inner: string } {
  if (rarity === 'uncommon') {
    return {
      outer: 'border-slate-200/90',
      inner: 'border-slate-100/30',
    };
  }

  if (rarity === 'rare') {
    return {
      outer: 'border-amber-300/95',
      inner: 'border-amber-100/35',
    };
  }

  return {
    outer: 'border-zinc-950/95',
    inner: 'border-white/10',
  };
}

function getTypeLabel(type: CardType['type']): string {
  if (type === 'attack') return 'Ataque';
  if (type === 'skill') return 'Skill';
  return 'Power';
}

function getTitleClass(name: string): string {
  const length = name.length;

  if (length >= 24) {
    return 'text-[11px] leading-[0.95]';
  }

  if (length >= 18) {
    return 'text-[12px] leading-[0.96]';
  }

  if (length >= 14) {
    return 'text-[13px] leading-[0.96]';
  }

  return 'text-[15px] leading-[0.9]';
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
  const cardArtSrc = getCardArtSrc(card);
  const keywords = card.keywords?.slice(0, 2) ?? [];
  const hasKeywords = keywords.length > 0;
  const rarityFrame = getRarityFrame(card.rarity);
  const titleClass = getTitleClass(displayName);

  return (
    <motion.button
      type="button"
      whileHover={isInHand && !disabled ? { y: -18, scale: 1.05 } : { y: -3, scale: 1.01 }}
      whileTap={isInHand && !disabled ? { scale: 0.97 } : { scale: 0.99 }}
      animate={isPrimed && !disabled ? { boxShadow: getPrimedGlow(hintTone) } : undefined}
      transition={isPrimed && !disabled ? { duration: 1.35, repeat: Infinity, ease: 'easeInOut' } : undefined}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`relative h-52 w-36 overflow-hidden rounded-[18px] border-[3px] ${rarityFrame.outer} bg-gradient-to-br ${getCardTheme(card.type)} p-[3px] shadow-[0_16px_35px_rgba(0,0,0,0.45)] transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
    >
      <div className={`relative flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-gradient-to-b ${getCardInnerTone(card.type)} px-[9px] pb-[9px] pt-[9px]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_55%)]" />
        <div className={`absolute inset-[5px] rounded-[11px] border ${rarityFrame.inner}`} />

        {isPrimed && !disabled && (
          <motion.div
            initial={{ opacity: 0.14 }}
            animate={{ opacity: [0.14, 0.38, 0.14] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className={`pointer-events-none absolute inset-[3px] rounded-[12px] border ${getPrimedFrameClass(hintTone)}`}
          />
        )}

        <div className="relative z-10 flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-amber-100/50 bg-black/38 text-sm font-black text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            {shownCost}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className={`hero-title line-clamp-2 text-left font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] ${titleClass}`}>
              {displayName}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-1 flex min-h-[14px] flex-wrap items-center gap-1.5 px-0.5">
          {teamPresentation && (
            <span className={`rounded-full border border-white/12 bg-black/28 px-2 py-[2px] text-[8px] font-semibold tracking-[0.16em] ${teamPresentation.pillAccent}`}>
              {getTeamBadgeLabel(card.team)}
            </span>
          )}
          <span className="rounded-full border border-cyan-100/35 bg-black/24 px-2 py-[2px] text-[8px] font-semibold uppercase tracking-[0.16em] text-cyan-50">
            {getTypeLabel(card.type)}
          </span>
          {hintLabel && (
            <span className={`rounded-full border px-2 py-[2px] text-[8px] font-semibold uppercase tracking-[0.16em] ${getHintToneClass(hintTone)}`}>
              {hintLabel}
            </span>
          )}
        </div>

        <div className="relative z-10 mt-2 h-[76px] overflow-hidden rounded-[13px] border-2 border-cyan-200/68 bg-slate-900 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.35)]">
          {cardArtSrc ? (
            <>
              <img alt={`${displayName} art`} src={cardArtSrc} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/12" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-black/10 via-black/20 to-black/30">
              <span className="hero-title text-xl font-bold text-white/85">{getTypeLabel(card.type)}</span>
            </div>
          )}

          {teamPresentation && (
            <img
              alt={`${teamPresentation.name} crest`}
              src={teamPresentation.crestSrc}
              className={`pointer-events-none absolute bottom-1 right-2 h-10 w-10 object-contain ${cardArtSrc ? 'opacity-16' : 'opacity-28'}`}
            />
          )}
        </div>

        <div className="relative z-10 mt-2 flex-1 rounded-[14px] border border-stone-300/20 bg-stone-900/80 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex h-full flex-col">
            <p className={`text-left text-[11px] leading-[1.24] text-stone-100 ${hasKeywords ? 'line-clamp-4' : 'line-clamp-5'}`}>
              {displayDescription}
            </p>

            {hasKeywords && (
              <div className="mt-auto flex flex-wrap gap-1 pt-2">
                {keywords.map((keyword, index) => {
                  const glossaryEntry = getGlossaryEntry(keyword);
                  return (
                    <Tooltip key={`${keyword}_${index}`}>
                      <TooltipTrigger asChild>
                        <span className="rounded border border-white/10 bg-black/35 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-cyan-100">
                          {glossaryEntry?.shortLabel ?? keyword}
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
          </div>
        </div>

        {card.upgraded && (
          <div className="absolute bottom-2 right-3 z-20 rounded-full border border-amber-200/35 bg-amber-300/15 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.16em] text-amber-200">
            UP+
          </div>
        )}
      </div>
    </motion.button>
  );
}




