import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { CardComponent } from './Card';
import { Button } from '@/components/ui/button';
import { getRandomBossRelics } from '@/data/relics';
import { createCombatRewardOffer } from '@/lib/rewards/rewardTable';
import type { TelemetryRewardOffer } from '@/lib/telemetry';
import { normalizeText } from '@/lib/text';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { useGameStore } from '@/store/gameStore';
import type { Card, Relic } from '@/types/game';

export function RewardScreen() {
  const {
    player,
    map,
    rewardType,
    addCardToDeck,
    addRelic,
    addGold,
    addPotion,
    closeReward,
    advanceAfterBossReward,
    recordRewardOffers,
    recordRewardChoice,
  } = useGameStore();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBossRelic, setSelectedBossRelic] = useState<Relic | null>(null);
  const [rewardTaken, setRewardTaken] = useState(false);
  const recordedOffersRef = useRef(false);
  const isBossReward = rewardType === 'boss';
  const currentRoom = map.rooms.find(room => room.id === map.currentRoomId);
  const isEliteReward = currentRoom?.type === 'elite';
  const teamPresentation = getTeamPresentation(player.team);

  const cardPenalty = player.relics.some(relic => relic.id.startsWith('ascenso_directo')) ? 2 : 0;
  const bossCardPenalty = player.relics.some(relic =>
    relic.id.startsWith('temporada_perfecta') || relic.id.startsWith('control_montjuic')
  ) ? 1 : 0;

  const [rewardOffer] = useState(() => createCombatRewardOffer({
    act: map.act,
    team: player.team,
    existingRelicIds: player.relics.map(relic => relic.id),
    cardChoicePenalty: cardPenalty + bossCardPenalty,
    forceRelic: isEliteReward,
  }));
  const [bossRelics] = useState<Relic[]>(() => getRandomBossRelics(3, player.relics.map(relic => relic.id), player.team));
  const [showRelic, setShowRelic] = useState(rewardOffer.relicReward !== null);
  const [showPotion, setShowPotion] = useState(rewardOffer.potionReward !== null);

  const { profile, rewardCards, relicReward, potionReward, goldReward } = rewardOffer;
  const combatRewardLabel = isEliteReward ? 'Recompensa de elite' : 'Recompensa de combate';
  const combatRewardSubtitle = isEliteReward
    ? 'Has tumbado un elite: aqui siempre aparece una reliquia garantizada ademas de las otras opciones.'
    : 'La curva del acto ya decide cuanta calidad puede salir aqui. Tu eleccion sigue siendo unica.';

  const combatOffers = useMemo<Array<Omit<TelemetryRewardOffer, 'runId' | 'atTurn'>>>(() => {
    const offers: Array<Omit<TelemetryRewardOffer, 'runId' | 'atTurn'>> = rewardCards.map(card => ({
      kind: 'card',
      rewardType: 'combat',
      itemId: card.id,
      name: card.name,
      team: card.team,
      rarity: card.rarity,
      act: map.act,
    }));

    if (showRelic && relicReward) {
      offers.push({
        kind: 'relic',
        rewardType: 'combat',
        itemId: relicReward.id,
        name: relicReward.name,
        team: relicReward.team,
        rarity: relicReward.rarity,
        act: map.act,
      });
    }

    if (showPotion && potionReward) {
      offers.push({
        kind: 'potion',
        rewardType: 'combat',
        itemId: potionReward.id,
        name: potionReward.name,
        rarity: 'resource',
        act: map.act,
      });
    }

    offers.push({
      kind: 'gold',
      rewardType: 'combat',
      itemId: `gold_${goldReward}`,
      name: 'Oro directo',
      rarity: 'resource',
      act: map.act,
    });

    return offers;
  }, [goldReward, map.act, potionReward, relicReward, rewardCards, showPotion, showRelic]);

  const bossOffers = useMemo<Array<Omit<TelemetryRewardOffer, 'runId' | 'atTurn'>>>(() => {
    return bossRelics.map(relic => ({
      kind: 'boss_relic',
      rewardType: 'boss',
      itemId: relic.id,
      name: relic.name,
      team: relic.team,
      rarity: relic.rarity,
      act: map.act,
    }));
  }, [bossRelics, map.act]);

  useEffect(() => {
    if (recordedOffersRef.current) return;
    const offers = isBossReward ? bossOffers : combatOffers;
    if (offers.length === 0) return;
    recordRewardOffers(offers);
    recordedOffersRef.current = true;
  }, [bossOffers, combatOffers, isBossReward, recordRewardOffers]);

  const handleTakeCard = (card: Card) => {
    if (selectedCard || isBossReward) return;
    recordRewardChoice({
      kind: 'card',
      rewardType: 'combat',
      itemId: card.id,
      name: card.name,
      team: card.team,
      rarity: card.rarity,
      act: map.act,
    });
    setSelectedCard(card);
    addCardToDeck(card, 'reward');
    setRewardTaken(true);
  };

  const handleTakeRelic = () => {
    if (!showRelic || isBossReward || !relicReward) return;
    recordRewardChoice({
      kind: 'relic',
      rewardType: 'combat',
      itemId: relicReward.id,
      name: relicReward.name,
      team: relicReward.team,
      rarity: relicReward.rarity,
      act: map.act,
    });
    addRelic(relicReward, 'reward');
    setShowRelic(false);
    setRewardTaken(true);
  };

  const handleTakeGold = () => {
    if (isBossReward) return;
    recordRewardChoice({
      kind: 'gold',
      rewardType: 'combat',
      itemId: `gold_${goldReward}`,
      name: 'Oro directo',
      rarity: 'resource',
      act: map.act,
    });
    addGold(goldReward);
    setRewardTaken(true);
  };

  const handleTakePotion = () => {
    if (isBossReward || !showPotion || !potionReward) return;
    const added = addPotion(potionReward);
    if (!added) return;
    recordRewardChoice({
      kind: 'potion',
      rewardType: 'combat',
      itemId: potionReward.id,
      name: potionReward.name,
      rarity: 'resource',
      act: map.act,
    });
    setShowPotion(false);
    setRewardTaken(true);
  };

  const handleTakeBossRelic = (relic: Relic) => {
    if (!isBossReward || selectedBossRelic) return;
    recordRewardChoice({
      kind: 'boss_relic',
      rewardType: 'boss',
      itemId: relic.id,
      name: relic.name,
      team: relic.team,
      rarity: relic.rarity,
      act: map.act,
    });
    setSelectedBossRelic(relic);
    addRelic(relic, 'boss');
    setRewardTaken(true);
  };

  const handleSkipReward = () => {
    recordRewardChoice({
      kind: 'skip',
      rewardType: 'combat',
      itemId: 'skip_reward',
      name: 'Saltar recompensa',
      rarity: 'resource',
      act: map.act,
    });
    closeReward();
  };

  if (rewardTaken) {
    return (
      <div className="screen-shell min-h-screen p-6 flex items-center justify-center soft-grid">
        <div className={`glass-panel rounded-3xl border ${teamPresentation.softAccent} p-8 text-center max-w-xl w-full`}>
          <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`mx-auto h-20 w-20 object-contain ${teamPresentation.emblemTint}`} />
          <h1 className={`hero-title mt-4 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-3xl text-transparent`}>
            Recompensa confirmada
          </h1>
          <p className="mt-3 text-slate-300">
            {isBossReward ? 'Has elegido una reliquia de jefe.' : 'Has reclamado una unica recompensa para esta sala.'}
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
        <div className={`mx-auto max-w-6xl glass-panel rounded-3xl border ${teamPresentation.softAccent} p-6 md:p-8`}>
          <div className="text-center max-w-2xl mx-auto">
            <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`mx-auto h-20 w-20 object-contain ${teamPresentation.emblemTint}`} />
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-amber-200/80">Recompensa de jefe</p>
            <h1 className={`hero-title mt-2 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-3xl md:text-4xl text-transparent`}>
              Elige una reliquia de jefe
            </h1>
            <p className="mt-3 text-slate-300">Solo puedes quedarte con una. La eleccion define el siguiente acto.</p>
          </div>
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
      <div className={`mx-auto max-w-7xl glass-panel rounded-3xl border ${teamPresentation.softAccent} p-6 md:p-8`}>
        <div className="max-w-4xl mx-auto text-center">
          <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`mx-auto h-20 w-20 object-contain ${teamPresentation.emblemTint}`} />
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-200/80">{combatRewardLabel}</p>
          <h1 className={`hero-title mt-2 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-3xl md:text-4xl text-transparent`}>
            Elige 1 recompensa
          </h1>
          <p className="mt-3 text-slate-300">{combatRewardSubtitle}</p>
        </div>

        <div className={`mt-6 rounded-2xl border ${teamPresentation.softAccent} px-4 py-3 text-sm ${teamPresentation.pillAccent}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>
              Acto {profile.act}: cartas {profile.cardWeights.common}/{profile.cardWeights.uncommon}/{profile.cardWeights.rare}, reliquias {profile.relicWeights.common}/{profile.relicWeights.uncommon}/{profile.relicWeights.rare}, pocion {profile.potionChance}%.
            </span>
            <span className="metric-pill text-slate-100">{teamPresentation.name}</span>
          </div>
        </div>

        <section className="mt-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Cartas para el mazo</p>
              <p className="text-sm text-slate-400">La tabla del acto empuja la rareza; tus reliquias pueden recortar opciones.</p>
            </div>
            <span className={`metric-pill ${teamPresentation.pillAccent} text-sm`}>{rewardCards.length} opciones</span>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {rewardCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                className="flex flex-col items-center gap-2"
              >
                <CardComponent
                  card={card}
                  onClick={() => handleTakeCard(card)}
                  disabled={selectedCard !== null}
                />
                <span className={`text-xs uppercase tracking-[0.16em] ${teamPresentation.pillAccent}`}>{card.rarity}</span>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Opciones instantaneas</p>
            <p className="text-sm text-slate-400">
              {isEliteReward
                ? 'La reliquia esta garantizada por la victoria elite. Oro y pocion siguen dependiendo de la tabla del acto.'
                : 'Reliquia y pocion ya no salen siempre: dependen de la tabla del acto.'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {showRelic && relicReward && (
              <button
                type="button"
                onClick={handleTakeRelic}
                className="rounded-2xl border border-amber-300/40 bg-amber-900/20 p-5 text-left hover:bg-amber-800/25 transition-colors"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">{isEliteReward ? 'Reliquia de elite' : 'Reliquia'}</p>
                <p className="mt-2 text-lg font-semibold text-white">{normalizeText(relicReward.name)}</p>
                <p className="mt-2 text-sm text-amber-100/90">{normalizeText(relicReward.description)}</p>
                <p className="mt-3 text-xs text-amber-200/80">
                  {isEliteReward ? `Garantizada tras vencer al elite. Rareza ${relicReward.rarity}. Cuenta como tu eleccion unica.` : `Rareza ${relicReward.rarity}. Cuenta como tu eleccion unica.`}
                </p>
              </button>
            )}

            {showPotion && potionReward && (
              <button
                type="button"
                onClick={handleTakePotion}
                disabled={player.potions.length >= player.maxPotionSlots}
                className="rounded-2xl border border-cyan-300/40 bg-cyan-900/20 p-5 text-left hover:bg-cyan-800/25 disabled:bg-slate-700/40 transition-colors"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Pocion</p>
                <p className="mt-2 text-lg font-semibold text-white">{normalizeText(potionReward.name)}</p>
                <p className="mt-2 text-sm text-cyan-100/90">{normalizeText(potionReward.description)}</p>
                {player.potions.length >= player.maxPotionSlots ? (
                  <p className="mt-3 text-xs text-rose-300">No tienes espacio de pociones.</p>
                ) : (
                  <p className="mt-3 text-xs text-cyan-200/80">Cuenta como tu eleccion unica.</p>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleTakeGold}
              className="rounded-2xl border border-amber-200/35 bg-slate-900/40 p-5 text-left hover:bg-slate-800/50 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Oro</p>
              <p className="mt-2 text-lg font-semibold text-white">{goldReward} de oro</p>
              <p className="mt-2 text-sm text-slate-300">La banda del acto para oro directo aqui es {profile.rewardGold.min}-{profile.rewardGold.max}.</p>
              <p className="mt-3 text-xs text-slate-400">Cuenta como tu eleccion unica.</p>
            </button>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Button onClick={handleSkipReward} variant="outline" className="text-white border-slate-300/40 hover:bg-slate-200/10">
            Saltar recompensa
          </Button>
        </div>
      </div>
    </div>
  );
}
