import { Button } from '@/components/ui/button';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';

export function TreasureRoom() {
  const { player, closeReward } = useGameStore();
  const relic = player.relics[player.relics.length - 1];

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 flex items-center justify-center soft-grid">
      <div className="glass-panel rounded-3xl p-8 max-w-xl w-full text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Sala de tesoro</p>
        <h1 className="hero-title text-4xl text-white mt-2">Trofeo encontrado</h1>

        {relic ? (
          <>
            <h2 className="mt-6 text-2xl font-semibold text-amber-200">{normalizeText(relic.name)}</h2>
            <p className="mt-2 text-slate-300">{normalizeText(relic.description)}</p>
          </>
        ) : (
          <p className="mt-6 text-slate-300">No se pudo identificar la reliquia obtenida.</p>
        )}

        <Button onClick={closeReward} className="mt-7 bg-amber-500 hover:bg-amber-400 text-black font-semibold">
          Continuar
        </Button>
      </div>
    </div>
  );
}
