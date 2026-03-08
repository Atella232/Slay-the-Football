import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CardComponent } from '@/components/Card';
import { Button } from '@/components/ui/button';
import { getRandomRelic } from '@/data/relics';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';
import type { EventEffect, EventOption } from '@/types/game';

export function EventRoom() {
  const { player, currentEvent, addGold, healPlayer, addRelic, removeCardFromDeck, closeReward, setMaxHp } = useGameStore();
  const [showDeckForRemoval, setShowDeckForRemoval] = useState(false);
  const [pendingOption, setPendingOption] = useState<EventOption | null>(null);
  const teamPresentation = getTeamPresentation(player.team);

  useEffect(() => {
    if (!currentEvent) {
      closeReward();
    }
  }, [currentEvent, closeReward]);

  if (!currentEvent) return null;

  const readNumber = (value: unknown, fallback = 0): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    return value;
  };

  const requiresCardRemoval = (effect?: EventEffect) => effect?.type === 'remove_card' || !!effect?.removeCard;

  const checkCondition = (option: EventOption) => {
    if (option.effect && player.gold < readNumber(option.effect.costGold, 0)) return false;
    if (!option.condition) return true;

    const { type, value } = option.condition;
    if (type === 'gold_min') return player.gold >= readNumber(value, 0);
    if (type === 'hp_min') return player.hp >= readNumber(value, 0);
    return true;
  };

  const applyEventOption = (option: EventOption, removedCardId?: string) => {
    const { effect } = option;
    if (!effect) return;

    const effectValue = readNumber(effect.value, 0);
    const costGold = readNumber(effect.costGold, 0);
    const bonusGold = readNumber(effect.bonusGold, 0);

    if (costGold > 0) addGold(-costGold);

    switch (effect.type) {
      case 'gold':
        addGold(effectValue);
        break;

      case 'heal':
      case 'health':
        healPlayer(effectValue);
        break;

      case 'max_hp':
        setMaxHp(effectValue);
        break;

      case 'remove_card':
        if (removedCardId) removeCardFromDeck(removedCardId);
        break;

      case 'relic': {
        const relic = getRandomRelic();
        if (relic) addRelic(relic, 'event');
        break;
      }

      default:
        throw new Error('unsupported_event_effect');
    }

    if (effect.removeCard && removedCardId) {
      removeCardFromDeck(removedCardId);
    }

    if (bonusGold !== 0) addGold(bonusGold);
  };

  const finalizeOption = (option: EventOption, removedCardId?: string) => {
    applyEventOption(option, removedCardId);
    setPendingOption(null);
    setShowDeckForRemoval(false);
    toast(`Evento aplicado: ${normalizeText(option.text)}`);
    closeReward();
  };

  const handleOptionClick = (option: EventOption) => {
    if (!checkCondition(option)) return;

    if (!option.effect) {
      closeReward();
      return;
    }

    if (requiresCardRemoval(option.effect)) {
      setPendingOption(option);
      setShowDeckForRemoval(true);
      return;
    }

    try {
      finalizeOption(option);
    } catch {
      toast.error('El evento fallo. Se cerro de forma segura.');
      setPendingOption(null);
      setShowDeckForRemoval(false);
      closeReward();
    }
  };

  const handleCardRemove = (cardId: string) => {
    if (!pendingOption) return;

    try {
      finalizeOption(pendingOption, cardId);
    } catch {
      toast.error('El evento fallo. Se cerro de forma segura.');
      setPendingOption(null);
      setShowDeckForRemoval(false);
      closeReward();
    }
  };

  const handleCancelRemoval = () => {
    setShowDeckForRemoval(false);
    setPendingOption(null);
  };

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 soft-grid">
      <div className={`mx-auto grid max-w-5xl grid-cols-1 gap-6 rounded-3xl border ${teamPresentation.softAccent} glass-panel p-6 md:grid-cols-[0.72fr_1fr] md:p-8`}>
        <div className={`flex flex-col items-center justify-between rounded-2xl border ${teamPresentation.softAccent} bg-gradient-to-br ${teamPresentation.panelAccent} p-6 text-center`}>
          <img
            alt={`${teamPresentation.name} crest`}
            src={teamPresentation.crestSrc}
            className={`h-20 w-20 object-contain ${teamPresentation.emblemTint}`}
          />
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Decision del club</p>
            <span className="text-7xl text-cyan-100">{currentEvent.image || '?'}</span>
          </div>
          <p className={`metric-pill ${teamPresentation.pillAccent}`}>{teamPresentation.name}</p>
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Evento</p>
          <h1 className={`hero-title mt-2 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-3xl text-transparent`}>
            {normalizeText(currentEvent.title)}
          </h1>
          <p className="mt-3 text-slate-300">{normalizeText(currentEvent.description)}</p>
          <div className={`mt-4 rounded-2xl border ${teamPresentation.softAccent} px-4 py-3 text-sm ${teamPresentation.pillAccent}`}>
            Cada decision empuja la run hacia economia, sustain o poda de mazo. La sala conserva el color del club para que el contexto no se rompa.
          </div>

          <div className="mt-6 space-y-3">
            {currentEvent.options.map((option, index) => {
              const valid = checkCondition(option);
              return (
                <Button
                  key={index}
                  disabled={!valid}
                  onClick={() => handleOptionClick(option)}
                  className={`h-auto w-full justify-between border px-4 py-4 ${valid ? `${teamPresentation.softAccent} bg-slate-900/55 text-white hover:bg-slate-900/75` : 'border-slate-700 bg-slate-800/75 text-slate-400'}`}
                >
                  <span className="text-left">{normalizeText(option.text)}</span>
                  {option.effect?.description && (
                    <span className={`rounded-md px-2 py-1 text-xs ${valid ? `${teamPresentation.pillAccent} bg-black/25` : 'bg-black/20 text-slate-400'}`}>
                      {normalizeText(option.effect.description)}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {showDeckForRemoval && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-950/96 p-5 md:p-8">
          <div className={`glass-panel flex items-center justify-between rounded-2xl border ${teamPresentation.softAccent} p-4`}>
            <h2 className={`hero-title bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-xl text-transparent`}>
              Selecciona una carta para eliminar
            </h2>
            <Button variant="outline" onClick={handleCancelRemoval}>Cancelar</Button>
          </div>

          <div className="mt-4 grid flex-1 grid-cols-2 gap-3 overflow-auto md:grid-cols-4 lg:grid-cols-6">
            {player.deck.map(card => (
              <button key={card.id} type="button" onClick={() => handleCardRemove(card.id)} className="rounded-xl p-1">
                <CardComponent card={card} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
