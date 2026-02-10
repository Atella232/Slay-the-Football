import { useState } from 'react';
import { motion } from 'framer-motion';

import { CardComponent } from '@/components/Card';
import { Button } from '@/components/ui/button';
import { getAscensionTuning, scaleInt } from '@/lib/ascension';
import { getUpgradedCard } from '@/lib/cardUpgrade';
import { useGameStore } from '@/store/gameStore';

export function RestSite() {
  const { player, ascension, restAtSite, closeReward, upgradeCard } = useGameStore();
  const [actionTaken, setActionTaken] = useState(false);
  const [healedAmount, setHealedAmount] = useState(0);
  const [showUpgradeSelection, setShowUpgradeSelection] = useState(false);
  const [selectedUpgradeCardId, setSelectedUpgradeCardId] = useState<string | null>(null);

  const tuning = getAscensionTuning(ascension);
  const restHeal = scaleInt(player.maxHp * 0.3, tuning.restHealMultiplier, 1);
  const trainHeal = scaleInt(player.maxHp * 0.15, tuning.restHealMultiplier, 1);

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
        <div className="glass-panel rounded-3xl p-8 max-w-xl w-full text-center">
          <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="hero-title text-3xl text-white">
            Recuperacion completada
          </motion.h1>
          <p className="text-slate-300 mt-3">Tu equipo recupero <span className="text-emerald-300 font-semibold">{healedAmount} HP</span>.</p>

          <div className="mt-5 h-6 rounded-full bg-slate-700 border border-white/10 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
          </div>
          <p className="mt-2 text-slate-100">{player.hp}/{player.maxHp} HP</p>

          <Button onClick={closeReward} className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white">Continuar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 soft-grid">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Zona de descanso</p>
          <h1 className="hero-title text-4xl text-white mt-2">Hotel del Equipo</h1>
          <p className="text-slate-300 mt-2">Elige entre recuperarte o entrenar una carta. Ascension actual: A{ascension}.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleRest}
              className="rounded-2xl border border-emerald-400/40 bg-emerald-900/20 p-5 text-left hover:bg-emerald-800/30 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Descansar</p>
              <p className="text-2xl font-semibold text-white mt-1">Recuperar {restHeal} HP</p>
              <p className="text-sm text-emerald-100/80 mt-2">30% base ajustado por ascension.</p>
            </button>

            <button
              type="button"
              onClick={handleUpgradeClick}
              className="rounded-2xl border border-cyan-400/40 bg-cyan-900/20 p-5 text-left hover:bg-cyan-800/30 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Entrenar</p>
              <p className="text-2xl font-semibold text-white mt-1">Mejorar carta + {trainHeal} HP</p>
              <p className="text-sm text-cyan-100/80 mt-2">Seleccion con vista previa antes de confirmar.</p>
            </button>
          </div>

          <p className="mt-5 text-sm text-slate-400">HP actual: {player.hp}/{player.maxHp}</p>
        </div>
      </div>

      {showUpgradeSelection && (
        <div className="absolute inset-0 z-50 bg-slate-950/96 p-5 md:p-8 flex flex-col">
          <div className="glass-panel rounded-2xl p-4 md:p-5">
            <div className="flex justify-between items-center gap-4">
              <h2 className="hero-title text-xl md:text-2xl text-white">Selecciona una carta para entrenar</h2>
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
                <h3 className="text-sm uppercase tracking-[0.2em] text-cyan-200 mb-3">Vista previa</h3>
                {!selectedCard && <p className="text-slate-300">Selecciona una carta del mazo para ver el resultado.</p>}

                {selectedCard && selectedUpgradedCard && (
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 lg:items-start">
                    <div>
                      <p className="text-xs text-slate-300 mb-2">Actual</p>
                      <CardComponent card={selectedCard} />
                    </div>
                    <div className="text-cyan-200 text-xl font-bold mt-14">-&gt;</div>
                    <div>
                      <p className="text-xs text-slate-300 mb-2">Mejorada</p>
                      <CardComponent card={selectedUpgradedCard} />
                    </div>
                    <div className="lg:ml-auto lg:mt-12">
                      <Button onClick={confirmUpgrade} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                        Confirmar mejora (+{trainHeal} HP)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 mt-4 overflow-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
              <div className="col-span-full text-center text-slate-400 text-lg mt-10">
                Todas tus cartas estan mejoradas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
