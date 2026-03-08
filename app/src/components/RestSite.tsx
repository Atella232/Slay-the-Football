import { useState } from 'react';
import { motion } from 'framer-motion';

import { CardComponent } from '@/components/Card';
import { Button } from '@/components/ui/button';
import { BASE_REST_HEAL_RATIO, BASE_TRAIN_HEAL_RATIO, getAscensionTuning, scaleInt } from '@/lib/ascension';
import { getUpgradedCard } from '@/lib/cardUpgrade';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { useGameStore } from '@/store/gameStore';

export function RestSite() {
  const { player, ascension, restAtSite, closeReward, upgradeCard } = useGameStore();
  const [actionTaken, setActionTaken] = useState(false);
  const [healedAmount, setHealedAmount] = useState(0);
  const [showUpgradeSelection, setShowUpgradeSelection] = useState(false);
  const [selectedUpgradeCardId, setSelectedUpgradeCardId] = useState<string | null>(null);

  const tuning = getAscensionTuning(ascension);
  const restHeal = scaleInt(player.maxHp * BASE_REST_HEAL_RATIO, tuning.restHealMultiplier, 1);
  const trainHeal = scaleInt(player.maxHp * BASE_TRAIN_HEAL_RATIO, tuning.restHealMultiplier, 1);
  const teamPresentation = getTeamPresentation(player.team);

  const upgradableCards = player.deck.filter(card => !card.upgraded);
  const selectedCard = upgradableCards.find(card => card.id === selectedUpgradeCardId) || null;
  const selectedUpgradedCard = selectedCard ? getUpgradedCard(selectedCard) : null;

  const handleRest = () => {
    restAtSite();
    setHealedAmount(restHeal);
    setActionTaken(true);
  };

  const handleUpgradeClick = () => {
    setShowUpgradeSelection(true);
    setSelectedUpgradeCardId(null);
  };

  const confirmUpgrade = () => {
    if (!selectedUpgradeCardId) return;

    upgradeCard(selectedUpgradeCardId);
    const { healPlayer } = useGameStore.getState();
    healPlayer(trainHeal);

    setHealedAmount(trainHeal);
    setActionTaken(true);
    setShowUpgradeSelection(false);
    setSelectedUpgradeCardId(null);
  };

  if (actionTaken) {
    return (
      <div className="screen-shell min-h-screen p-6 md:p-10 flex items-center justify-center soft-grid">
        <div className={`glass-panel w-full max-w-xl rounded-3xl border ${teamPresentation.softAccent} p-8 text-center`}>
          <img
            alt={`${teamPresentation.name} crest`}
            src={teamPresentation.crestSrc}
            className={`mx-auto h-20 w-20 object-contain ${teamPresentation.emblemTint}`}
          />
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`hero-title mt-5 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-3xl text-transparent`}
          >
            Recuperacion completada
          </motion.h1>
          <p className="mt-3 text-slate-300">
            Tu equipo recupero <span className="font-semibold text-emerald-300">{healedAmount} HP</span>.
          </p>

          <div className={`mt-5 rounded-2xl border ${teamPresentation.softAccent} px-4 py-3 text-sm ${teamPresentation.pillAccent}`}>
            El bloque de descanso mantiene la identidad del club incluso fuera del combate.
          </div>

          <div className="mt-5 h-6 overflow-hidden rounded-full border border-white/10 bg-slate-700">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
          </div>
          <p className="mt-2 text-slate-100">{player.hp}/{player.maxHp} HP</p>

          <Button onClick={closeReward} className="mt-6 bg-cyan-600 text-white hover:bg-cyan-500">Continuar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 soft-grid">
      <div className="mx-auto max-w-6xl">
        <div className={`glass-panel rounded-3xl border ${teamPresentation.softAccent} p-6 md:p-8`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`h-16 w-16 object-contain ${teamPresentation.emblemTint}`} />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Zona de descanso</p>
                <h1 className={`hero-title mt-2 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-4xl text-transparent`}>
                  Hotel del Equipo
                </h1>
                <p className="mt-2 text-slate-300">Elige entre recuperarte o entrenar una carta. Ascension actual: A{ascension}.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="metric-pill text-emerald-100">HP {player.hp}/{player.maxHp}</span>
              <span className={`metric-pill ${teamPresentation.pillAccent}`}>Club {teamPresentation.name}</span>
            </div>
          </div>

          <div className={`mt-5 rounded-2xl border ${teamPresentation.softAccent} px-4 py-3 text-sm ${teamPresentation.pillAccent}`}>
            Este tramo baja pulsaciones pero sigue comunicando el club. La decision es sustain puro o mejora de mazo con cura parcial.
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={handleRest}
              className="rounded-2xl border border-emerald-400/40 bg-emerald-900/20 p-5 text-left transition-colors hover:bg-emerald-800/30"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Descansar</p>
              <p className="mt-1 text-2xl font-semibold text-white">Recuperar {restHeal} HP</p>
              <p className="mt-2 text-sm text-emerald-100/80">{Math.round(BASE_REST_HEAL_RATIO * 100)}% base ajustado por ascension.</p>
            </button>

            <button
              type="button"
              onClick={handleUpgradeClick}
              className={`rounded-2xl border ${teamPresentation.softAccent} bg-slate-900/40 p-5 text-left transition-colors hover:bg-slate-800/45`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Entrenar</p>
              <p className="mt-1 text-2xl font-semibold text-white">Mejorar carta + {trainHeal} HP</p>
              <p className="mt-2 text-sm text-cyan-100/80">Seleccion con vista previa antes de confirmar.</p>
            </button>
          </div>
        </div>
      </div>

      {showUpgradeSelection && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-950/96 p-5 md:p-8">
          <div className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4 md:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className={`hero-title bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-xl text-transparent md:text-2xl`}>
                Selecciona una carta para entrenar
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpgradeSelection(false);
                  setSelectedUpgradeCardId(null);
                }}
              >
                Cerrar
              </Button>
            </div>

            {upgradableCards.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-200">Vista previa</h3>
                {!selectedCard && <p className="text-slate-300">Selecciona una carta del mazo para ver el resultado.</p>}

                {selectedCard && selectedUpgradedCard && (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
                    <div>
                      <p className="mb-2 text-xs text-slate-300">Actual</p>
                      <CardComponent card={selectedCard} />
                    </div>
                    <div className="mt-14 text-xl font-bold text-cyan-200">-&gt;</div>
                    <div>
                      <p className="mb-2 text-xs text-slate-300">Mejorada</p>
                      <CardComponent card={selectedUpgradedCard} />
                    </div>
                    <div className="lg:ml-auto lg:mt-12">
                      <Button onClick={confirmUpgrade} className="bg-cyan-600 text-white hover:bg-cyan-500">
                        Confirmar mejora (+{trainHeal} HP)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 grid flex-1 grid-cols-2 gap-3 overflow-auto md:grid-cols-4 lg:grid-cols-6">
            {upgradableCards.map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedUpgradeCardId(card.id)}
                className={`rounded-xl p-1 transition-all ${selectedUpgradeCardId === card.id ? 'ring-2 ring-cyan-300' : ''}`}
              >
                <CardComponent card={card} />
              </button>
            ))}

            {upgradableCards.length === 0 && (
              <div className="col-span-full mt-10 text-center text-lg text-slate-400">
                Todas tus cartas estan mejoradas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
