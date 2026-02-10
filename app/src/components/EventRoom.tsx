import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CardComponent } from '@/components/Card';
import { Button } from '@/components/ui/button';
import { getRandomRelic } from '@/data/relics';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';
import type { EventOption } from '@/types/game';

export function EventRoom() {
  const { player, currentEvent, addGold, healPlayer, addRelic, removeCardFromDeck, closeReward, setMaxHp } = useGameStore();
  const [showDeckForRemoval, setShowDeckForRemoval] = useState(false);
  const [pendingOption, setPendingOption] = useState<EventOption | null>(null);

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

  const checkCondition = (option: EventOption) => {
    if (!option.condition) return true;
    const { type, value } = option.condition;

    if (type === 'gold_min') return player.gold >= (value as number);
    if (type === 'hp_min') return player.hp >= (value as number);
    return true;
  };

  const handleOptionClick = (option: EventOption) => {
    if (!checkCondition(option)) return;

    const { effect } = option;
    if (!effect) {
      closeReward();
      return;
    }

    try {
      const effectValue = readNumber(effect.value, 0);
      const goldCost = option.condition?.type === 'gold_min' ? readNumber(option.condition.value, 0) : 0;
      const textLower = option.text.toLowerCase();
      const isBetOption = textLower.includes('apostar') || textLower.includes('paga') || textLower.includes('pay');

      switch (effect.type) {
        case 'gold':
          addGold(effectValue);
          if (isBetOption && goldCost > 0) addGold(-goldCost);
          break;

        case 'heal':
        case 'health':
          healPlayer(effectValue);
          break;

        case 'max_hp':
          setMaxHp(effectValue);
          if (textLower.includes('ignorar')) {
            setPendingOption(option);
            setShowDeckForRemoval(true);
            return;
          }
          break;

        case 'remove_card':
          setPendingOption(option);
          setShowDeckForRemoval(true);
          return;

        case 'relic': {
          const relic = getRandomRelic();
          if (relic) addRelic(relic, 'event');
          if (isBetOption && goldCost > 0) addGold(-goldCost);
          break;
        }

        default:
          toast.error('Efecto de evento no soportado.');
          return;
      }
    } catch {
      toast.error('El evento fallo. Se cerro de forma segura.');
      closeReward();
      return;
    }

    toast(`Evento aplicado: ${normalizeText(option.text)}`);
    closeReward();
  };

  const handleCardRemove = (cardId: string) => {
    const option = pendingOption;
    removeCardFromDeck(cardId);

    if (option?.text.toLowerCase().includes('vender')) {
      addGold(30);
    }

    setShowDeckForRemoval(false);
    setPendingOption(null);
    closeReward();
    toast('Carta eliminada.');
  };

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 soft-grid">
      <div className="mx-auto max-w-5xl glass-panel rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-[0.7fr_1fr] gap-6">
        <div className="rounded-2xl border border-slate-600/50 bg-slate-900/40 p-6 flex items-center justify-center">
          <span className="text-6xl text-cyan-200">{currentEvent.image || '?'}</span>
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Evento</p>
          <h1 className="hero-title text-3xl text-white mt-2">{normalizeText(currentEvent.title)}</h1>
          <p className="text-slate-300 mt-3">{normalizeText(currentEvent.description)}</p>

          <div className="mt-6 space-y-3">
            {currentEvent.options.map((option, index) => {
              const valid = checkCondition(option);
              return (
                <Button
                  key={index}
                  disabled={!valid}
                  onClick={() => handleOptionClick(option)}
                  className={`w-full h-auto py-4 px-4 justify-between ${valid ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  <span className="text-left">{normalizeText(option.text)}</span>
                  {option.effect?.description && (
                    <span className="text-xs bg-black/25 px-2 py-1 rounded-md">{normalizeText(option.effect.description)}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {showDeckForRemoval && (
        <div className="absolute inset-0 z-50 bg-slate-950/96 p-5 md:p-8 flex flex-col">
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
            <h2 className="hero-title text-xl text-white">Selecciona una carta para eliminar</h2>
            <Button variant="outline" onClick={() => setShowDeckForRemoval(false)}>Cancelar</Button>
          </div>

          <div className="mt-4 flex-1 overflow-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
