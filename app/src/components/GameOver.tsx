import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

function getTeamName(team: string): string {
  if (team === 'athletic') return 'Athletic Club';
  if (team === 'barcelona') return 'FC Barcelona';
  return 'Real Madrid';
}

export function GameOver() {
  const { victory, resetGame, player } = useGameStore();

  useEffect(() => {
    if (!victory) return;
    const { unlockedTeams, unlockTeam } = useGameStore.getState();
    if (player.team === 'athletic' && !unlockedTeams.includes('barcelona')) {
      unlockTeam('barcelona');
    } else if (player.team === 'barcelona' && !unlockedTeams.includes('madrid')) {
      unlockTeam('madrid');
    }
  }, [victory, player.team]);

  return (
    <div className="screen-shell min-h-screen p-6 md:p-10 flex items-center justify-center soft-grid">
      <div className="glass-panel rounded-3xl p-8 max-w-2xl w-full text-center">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`hero-title text-5xl ${victory ? 'text-amber-200' : 'text-rose-300'}`}
        >
          {victory ? 'Victoria' : 'Derrota'}
        </motion.h1>

        <p className="mt-4 text-slate-300 text-lg">
          {victory
            ? `Run completada con ${getTeamName(player.team)}.`
            : 'La run termino. Ajusta estrategia y vuelve a intentarlo.'}
        </p>

        {victory && player.team !== 'madrid' && (
          <div className="mt-5 rounded-2xl border border-emerald-300/35 bg-emerald-900/25 px-4 py-3 text-emerald-100">
            Nuevo club desbloqueado.
          </div>
        )}

        <Button onClick={resetGame} className="mt-7 bg-cyan-600 hover:bg-cyan-500 text-white px-8">
          {victory ? 'Nueva partida' : 'Reintentar'}
        </Button>
      </div>
    </div>
  );
}
