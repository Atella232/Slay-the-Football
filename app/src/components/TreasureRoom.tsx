import { Button } from '@/components/ui/button';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { normalizeText } from '@/lib/text';
import { useGameStore } from '@/store/gameStore';

export function TreasureRoom() {
  const { player, closeReward } = useGameStore();
  const relic = player.relics[player.relics.length - 1];
  const teamPresentation = getTeamPresentation(player.team);

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 flex items-center justify-center soft-grid">
      <div className={`glass-panel w-full max-w-2xl rounded-3xl border ${teamPresentation.softAccent} p-8 text-center`}>
        <img
          alt={`${teamPresentation.name} crest`}
          src={teamPresentation.crestSrc}
          className={`mx-auto h-20 w-20 object-contain ${teamPresentation.emblemTint}`}
        />
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-amber-200/80">Sala de tesoro</p>
        <h1 className={`hero-title mt-2 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-4xl text-transparent`}>
          Trofeo encontrado
        </h1>

        <div className={`mt-5 rounded-2xl border ${teamPresentation.softAccent} bg-gradient-to-br ${teamPresentation.panelAccent} px-5 py-6`}>
          {relic ? (
            <>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">Reliquia asegurada</p>
              <h2 className="mt-3 text-2xl font-semibold text-amber-200">{normalizeText(relic.name)}</h2>
              <p className="mt-2 text-slate-200">{normalizeText(relic.description)}</p>
            </>
          ) : (
            <p className="mt-2 text-slate-200">No se pudo identificar la reliquia obtenida.</p>
          )}
        </div>

        <div className={`mt-5 rounded-2xl border ${teamPresentation.softAccent} px-4 py-3 text-sm ${teamPresentation.pillAccent}`}>
          La sala de tesoro ya comparte escudo y paleta del club para que la run no cambie de lenguaje visual al salir del combate.
        </div>

        <Button onClick={closeReward} className="mt-7 bg-amber-500 text-black font-semibold hover:bg-amber-400">
          Continuar
        </Button>
      </div>
    </div>
  );
}
