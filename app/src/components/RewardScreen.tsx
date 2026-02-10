import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { CardComponent } from './Card';
import { allCards } from '@/data/cards';
import { getRandomPotion } from '@/data/potions';
import { getRandomBossRelics, getRandomRelic } from '@/data/relics';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';
import type { Card, Potion, Relic } from '@/types/game';

function randomRewardCard(): Card {
  const card = allCards[Math.floor(Math.random() * allCards.length)];
  return { ...card, id: `reward_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` };
}

export function RewardScreen() {
  const {
    player,
    rewardType,
    addCardToDeck,
    addRelic,
    addGold,
    addPotion,
    closeReward,
    advanceAfterBossReward,
  } = useGameStore();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBossRelic, setSelectedBossRelic] = useState<Relic | null>(null);
  const [rewardTaken, setRewardTaken] = useState(false);
  const [showRelic, setShowRelic] = useState(true);
  const [showPotion, setShowPotion] = useState(true);
  const [relicReward] = useState<Relic>(() => getRandomRelic(undefined, false, player.team, player.relics.map(relic => relic.id)));
  const [potionReward] = useState<Potion>(() => getRandomPotion());
  const [goldReward] = useState<number>(() => Math.floor(Math.random() * 13) + 14);
  const cardPenalty = player.relics.some(relic => relic.id.startsWith('ascenso_directo')) ? 2 : 0;
  const bossCardPenalty = player.relics.some(relic =>
    relic.id.startsWith('temporada_perfecta') || relic.id.startsWith('control_montjuic')
  ) ? 1 : 0;
  const cardChoices = Math.max(1, 3 - cardPenalty - bossCardPenalty);
  const [rewardCards] = useState<Card[]>(() => Array.from({ length: cardChoices }, () => randomRewardCard()));
  const [bossRelics] = useState<Relic[]>(() => getRandomBossRelics(3, player.relics.map(relic => relic.id), player.team));

  const isBossReward = rewardType === 'boss';

  const handleTakeCard = (card: Card) => {
    if (selectedCard || isBossReward) return;
    setSelectedCard(card);
    addCardToDeck(card, 'reward');
    setRewardTaken(true);
  };

  const handleTakeRelic = () => {
    if (!showRelic || isBossReward) return;
    addRelic(relicReward, 'reward');
    setShowRelic(false);
    setRewardTaken(true);
  };

  const handleTakeGold = () => {
    if (isBossReward) return;
    addGold(goldReward);
    setRewardTaken(true);
  };

  const handleTakePotion = () => {
    if (isBossReward || !showPotion) return;
    const added = addPotion(potionReward);
    if (!added) return;
    setShowPotion(false);
    setRewardTaken(true);
  };

  const handleTakeBossRelic = (relic: Relic) => {
    if (!isBossReward || selectedBossRelic) return;
    setSelectedBossRelic(relic);
    addRelic(relic, 'boss');
    setRewardTaken(true);
  };

  if (rewardTaken) {
    return (
      <div className="screen-shell min-h-screen p-6 flex items-center justify-center soft-grid">
        <div className="glass-panel rounded-3xl p-8 text-center max-w-xl w-full">
          <h1 className="hero-title text-3xl text-white">Recompensa confirmada</h1>
          <p className="mt-3 text-slate-300">
            {isBossReward ? 'Has elegido una reliquia de jefe.' : 'Has reclamado tu premio de combate.'}
          </p>
          <Button
            onClick={isBossReward ? advanceAfterBossReward : closeReward}
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (isBossReward) {
    return (
      <div className="screen-shell min-h-screen p-6 md:p-10 soft-grid">
        <div className="mx-auto max-w-6xl glass-panel rounded-3xl p-6 md:p-8">
          <h1 className="hero-title text-3xl md:text-4xl text-white text-center">Elige una reliquia de jefe</h1>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {bossRelics.map((relic, index) => (
              <motion.button
                key={relic.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleTakeBossRelic(relic)}
                className="rounded-2xl border border-amber-300/40 bg-amber-900/18 p-5 text-left hover:bg-amber-800/25 transition-colors"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Boss relic</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{normalizeText(relic.name)}</h2>
                <p className="mt-2 text-sm text-amber-100/90">{normalizeText(relic.description)}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 soft-grid">
      <div className="mx-auto max-w-7xl glass-panel rounded-3xl p-6 md:p-8">
        <h1 className="hero-title text-3xl md:text-4xl text-white text-center">Elige tu recompensa</h1>

        <section className="mt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200 mb-4">1) Carta</p>
          <div className="flex flex-wrap justify-center gap-4">
            {rewardCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <CardComponent
                  card={card}
                  onClick={() => handleTakeCard(card)}
                  disabled={selectedCard !== null}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {showRelic && (
            <button
              type="button"
              onClick={handleTakeRelic}
              className="rounded-2xl border border-amber-300/40 bg-amber-900/20 p-5 text-left hover:bg-amber-800/25 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">2) Reliquia</p>
              <p className="mt-2 text-lg font-semibold text-white">{normalizeText(relicReward.name)}</p>
              <p className="mt-2 text-sm text-amber-100/90">{normalizeText(relicReward.description)}</p>
            </button>
          )}

          {showPotion && (
            <button
              type="button"
              onClick={handleTakePotion}
              disabled={player.potions.length >= player.maxPotionSlots}
              className="rounded-2xl border border-cyan-300/40 bg-cyan-900/20 p-5 text-left hover:bg-cyan-800/25 disabled:bg-slate-700/40 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">3) Pocion</p>
              <p className="mt-2 text-lg font-semibold text-white">{normalizeText(potionReward.name)}</p>
              <p className="mt-2 text-sm text-cyan-100/90">{normalizeText(potionReward.description)}</p>
              {player.potions.length >= player.maxPotionSlots && (
                <p className="mt-2 text-xs text-rose-300">No tienes espacio de pociones.</p>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleTakeGold}
            className="rounded-2xl border border-amber-200/35 bg-slate-900/40 p-5 text-left hover:bg-slate-800/50 transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100">4) Oro</p>
            <p className="mt-2 text-lg font-semibold text-white">{goldReward} de oro</p>
            <p className="mt-2 text-sm text-slate-300">Liquidez inmediata para tienda y removals.</p>
          </button>
        </section>

        <div className="mt-8 text-center">
          <Button onClick={closeReward} variant="outline" className="text-white border-slate-300/40 hover:bg-slate-200/10">
            Saltar recompensa
          </Button>
        </div>
      </div>
    </div>
  );
}
