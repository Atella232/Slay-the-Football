import { useState } from 'react';

import { CardComponent } from '@/components/Card';
import { Button } from '@/components/ui/button';
import { allCards } from '@/data/cards';
import { getRandomPotion } from '@/data/potions';
import { getRandomRelicsForShop } from '@/data/relics';
import { getAscensionTuning, scaleInt } from '@/lib/ascension';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';
import type { Card, Potion, Relic } from '@/types/game';

interface ShopItem<T> {
  item: T;
  cost: number;
  purchased: boolean;
}

function generateShopCards(team: Card['team'], priceMultiplier: number): ShopItem<Card>[] {
  const shopCards: ShopItem<Card>[] = [];
  const teamCards = allCards.filter(card => card.team === team || card.team === 'neutral');

  const attacks = teamCards.filter(card => card.type === 'attack');
  for (let i = 0; i < 2; i++) {
    const card = attacks[Math.floor(Math.random() * attacks.length)];
    const baseCost = card.rarity === 'rare' ? 140 : card.rarity === 'uncommon' ? 70 : 45;
    const noisyCost = Math.floor(baseCost * (0.92 + Math.random() * 0.16));
    shopCards.push({ item: { ...card, id: `${card.id}_shop_${Date.now()}_${i}` }, cost: scaleInt(noisyCost, priceMultiplier, 1), purchased: false });
  }

  const skills = teamCards.filter(card => card.type === 'skill');
  for (let i = 0; i < 2; i++) {
    const card = skills[Math.floor(Math.random() * skills.length)];
    const baseCost = card.rarity === 'rare' ? 140 : card.rarity === 'uncommon' ? 70 : 45;
    const noisyCost = Math.floor(baseCost * (0.92 + Math.random() * 0.16));
    shopCards.push({ item: { ...card, id: `${card.id}_shop_${Date.now()}_skills_${i}` }, cost: scaleInt(noisyCost, priceMultiplier, 1), purchased: false });
  }

  const powers = teamCards.filter(card => card.type === 'power');
  if (powers.length > 0) {
    const card = powers[Math.floor(Math.random() * powers.length)];
    const baseCost = card.rarity === 'rare' ? 140 : card.rarity === 'uncommon' ? 70 : 45;
    const noisyCost = Math.floor(baseCost * (0.92 + Math.random() * 0.16));
    shopCards.push({ item: { ...card, id: `${card.id}_shop_${Date.now()}_power` }, cost: scaleInt(noisyCost, priceMultiplier, 1), purchased: false });
  }

  return shopCards;
}

function generateShopRelics(team: Card['team'], existingRelics: Relic[], priceMultiplier: number): ShopItem<Relic>[] {
  const shopRelics: ShopItem<Relic>[] = [];
  const normalizedTeam = team === 'neutral' ? 'athletic' : team;
  const availableRelics = getRandomRelicsForShop(
    normalizedTeam,
    existingRelics.map(playerRelic => playerRelic.id),
    3
  );

  for (let i = 0; i < availableRelics.length; i++) {
    const relic = availableRelics[i];
    const baseCost = relic.rarity === 'rare' ? 245 : relic.rarity === 'uncommon' ? 145 : 95;
    const noisyCost = Math.floor(baseCost * (0.92 + Math.random() * 0.16));
    shopRelics.push({ item: { ...relic, id: `${relic.id}_shop` }, cost: scaleInt(noisyCost, priceMultiplier, 1), purchased: false });
  }

  return shopRelics;
}

export function Shop() {
  const { player, ascension, buyCard, buyRelic, buyPotion, closeReward } = useGameStore();
  const tuning = getAscensionTuning(ascension);

  const [cardsForSale, setCardsForSale] = useState<ShopItem<Card>[]>(() => generateShopCards(player.team, tuning.shopPriceMultiplier));
  const [relicsForSale, setRelicsForSale] = useState<ShopItem<Relic>[]>(() => generateShopRelics(player.team, player.relics, tuning.shopPriceMultiplier));
  const [potionsForSale, setPotionsForSale] = useState<ShopItem<Potion>[]>(() => [
    { item: getRandomPotion(), cost: scaleInt(42, tuning.shopPriceMultiplier, 1), purchased: false },
    { item: getRandomPotion(), cost: scaleInt(42, tuning.shopPriceMultiplier, 1), purchased: false },
  ]);
  const removeCost = scaleInt(80 + (player.cardRemovalCount || 0) * 25, tuning.shopPriceMultiplier, 1);
  const [showDeckForRemoval, setShowDeckForRemoval] = useState(false);

  const handleBuyCard = (index: number) => {
    const shopItem = cardsForSale[index];
    if (shopItem.purchased) return;

    if (buyCard(shopItem.item, shopItem.cost)) {
      const nextCards = [...cardsForSale];
      nextCards[index].purchased = true;
      setCardsForSale(nextCards);
    }
  };

  const handleBuyRelic = (index: number) => {
    const shopItem = relicsForSale[index];
    if (shopItem.purchased) return;

    if (buyRelic(shopItem.item, shopItem.cost)) {
      const nextRelics = [...relicsForSale];
      nextRelics[index].purchased = true;
      setRelicsForSale(nextRelics);
    }
  };

  const handleBuyPotion = (index: number) => {
    const shopItem = potionsForSale[index];
    if (shopItem.purchased) return;

    if (buyPotion(shopItem.item, shopItem.cost)) {
      const nextPotions = [...potionsForSale];
      nextPotions[index].purchased = true;
      setPotionsForSale(nextPotions);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    const cardExists = player.deck.some(card => card.id === cardId);
    if (!cardExists) return;

    const { addGold, removeCardFromDeck } = useGameStore.getState();
    if (player.gold < removeCost) return;

    addGold(-removeCost);
    removeCardFromDeck(cardId);
    useGameStore.setState(state => ({
      player: {
        ...state.player,
        cardRemovalCount: (state.player.cardRemovalCount || 0) + 1,
      },
    }));
    setShowDeckForRemoval(false);
  };

  return (
    <div className="screen-shell min-h-screen p-5 md:p-8 soft-grid">
      <div className="mx-auto max-w-7xl glass-panel rounded-3xl p-5 md:p-7">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Mercado del club</p>
            <h1 className="hero-title text-3xl md:text-4xl text-white mt-1">Tienda Oficial</h1>
            <p className="text-sm text-slate-300 mt-2">Ascension A{ascension}. Precios ajustados por dificultad.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="metric-pill text-amber-100">Oro {player.gold}</span>
            <span className="metric-pill text-cyan-100">Pociones {player.potions.length}/{player.maxPotionSlots}</span>
            <Button onClick={closeReward} className="bg-rose-600 hover:bg-rose-500 text-white">Salir</Button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-200 mb-3">Cartas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {cardsForSale.map((shopItem, index) => (
                <div key={index} className="flex flex-col items-center">
                  <CardComponent
                    card={shopItem.item}
                    disabled={shopItem.purchased || player.gold < shopItem.cost}
                    onClick={() => handleBuyCard(index)}
                  />
                  {!shopItem.purchased ? (
                    <Button
                      size="sm"
                      disabled={player.gold < shopItem.cost}
                      onClick={() => handleBuyCard(index)}
                      className="mt-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                    >
                      {shopItem.cost} oro
                    </Button>
                  ) : (
                    <span className="mt-2 text-xs text-emerald-300">Comprada</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
              <h2 className="text-sm uppercase tracking-[0.2em] text-amber-200 mb-3">Reliquias</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {relicsForSale.map((shopItem, index) => (
                  <div key={index} className="rounded-xl border border-amber-300/25 bg-amber-950/20 p-3">
                    <p className="font-semibold text-white">{normalizeText(shopItem.item.name)}</p>
                    <p className="text-xs text-amber-100/85 mt-1 min-h-[44px]">{normalizeText(shopItem.item.description)}</p>
                    {shopItem.purchased ? (
                      <span className="text-xs text-emerald-300">Comprada</span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={player.gold < shopItem.cost}
                        onClick={() => handleBuyRelic(index)}
                        className="mt-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                      >
                        {shopItem.cost} oro
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4">
              <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-200 mb-3">Pociones</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {potionsForSale.map((shopItem, index) => (
                  <div key={index} className="rounded-xl border border-cyan-300/25 bg-cyan-950/20 p-3">
                    <p className="font-semibold text-white">{normalizeText(shopItem.item.name)}</p>
                    <p className="text-xs text-cyan-100/90 mt-1 min-h-[34px]">{normalizeText(shopItem.item.description)}</p>
                    {shopItem.purchased ? (
                      <span className="text-xs text-emerald-300">Comprada</span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={
                          player.gold < shopItem.cost
                          || player.potions.length >= player.maxPotionSlots
                          || player.relics.some(relic => relic.id.startsWith('gestion_total'))
                        }
                        onClick={() => handleBuyPotion(index)}
                        className="mt-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                      >
                        {shopItem.cost} oro
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/35 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-white font-semibold">Rescindir contrato</h3>
                <p className="text-sm text-slate-300">Elimina una carta permanentemente del mazo.</p>
              </div>
              <Button
                disabled={player.gold < removeCost || player.deck.length <= 1}
                onClick={() => setShowDeckForRemoval(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white disabled:bg-slate-600 disabled:text-slate-300"
              >
                {`Eliminar (${removeCost} oro)`}
              </Button>
            </div>
          </section>
        </div>
      </div>

      {showDeckForRemoval && (
        <div className="absolute inset-0 z-50 bg-slate-950/96 p-5 md:p-8 flex flex-col">
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="hero-title text-xl text-white">Selecciona una carta para eliminar</h2>
              <Button variant="outline" onClick={() => setShowDeckForRemoval(false)}>Cancelar</Button>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {player.deck.map(card => (
              <button key={card.id} type="button" onClick={() => handleRemoveCard(card.id)} className="rounded-xl p-1">
                <CardComponent card={card} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
