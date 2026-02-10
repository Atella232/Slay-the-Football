import type { Card as CardType } from '@/types/game';
import { motion } from 'framer-motion';
import { normalizeText } from '@/lib/text';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isInHand?: boolean;
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

export function CardComponent({ card, onClick, disabled = false, isInHand = false }: CardProps) {
  const shownCost = card.tempCost ?? card.cost;
  const displayName = normalizeText(card.name);
  const displayDescription = normalizeText(card.description);

  return (
    <motion.button
      type="button"
      whileHover={isInHand && !disabled ? { y: -18, scale: 1.05 } : { y: -3, scale: 1.01 }}
      whileTap={isInHand && !disabled ? { scale: 0.97 } : { scale: 0.99 }}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative w-36 h-52 rounded-xl overflow-hidden
        bg-gradient-to-br ${getCardTheme(card.type)}
        border ${getTeamBorder(card.team)}
        shadow-[0_16px_35px_rgba(0,0,0,0.45)]
        transition-all duration-200
        ${disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.17),transparent_55%)]" />

      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/45 border border-white/20 text-amber-300 font-bold text-sm flex items-center justify-center">
        {shownCost}
      </div>

      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/45 border border-white/15 text-[10px] font-bold tracking-wide text-slate-100">
        {getTypeLabel(card.type)}
      </div>

      <div className="absolute top-12 left-3 right-3 text-left">
        <p className="text-sm font-bold leading-tight text-white line-clamp-2">{displayName}</p>
      </div>

      <div className="absolute inset-x-3 top-[84px] h-[62px] rounded-lg border border-white/10 bg-black/20 flex items-center justify-center">
        <span className="text-xl font-semibold text-white/85">{getTypeLabel(card.type)}</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-black/45 px-2 py-2 min-h-[64px]">
        <p className="text-[11px] leading-snug text-slate-100 line-clamp-4 text-left">{displayDescription}</p>
      </div>

      {card.keywords && card.keywords.length > 0 && (
        <div className="absolute bottom-[74px] left-3 right-3 flex flex-wrap gap-1">
          {card.keywords.slice(0, 2).map((keyword, index) => (
            <span key={index} className="text-[9px] px-1.5 py-0.5 rounded bg-black/55 border border-white/10 text-cyan-200">
              {keyword.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <div
        className={`
          absolute top-11 right-2 w-2.5 h-2.5 rounded-full
          ${card.rarity === 'common' ? 'bg-slate-300' : ''}
          ${card.rarity === 'uncommon' ? 'bg-cyan-300' : ''}
          ${card.rarity === 'rare' ? 'bg-amber-300' : ''}
        `}
      />

      {card.upgraded && (
        <div className="absolute bottom-3 right-3 text-[11px] font-bold text-amber-300 tracking-widest">UP+</div>
      )}
    </motion.button>
  );
}
