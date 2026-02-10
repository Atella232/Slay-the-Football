import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

export function PlayerStats() {
  const player = useGameStore(state => state.player);
  const hpPercent = (player.hp / player.maxHp) * 100;

  const getTeamName = () => {
    switch (player.team) {
      case 'athletic':
        return 'Athletic Club';
      case 'barcelona':
        return 'FC Barcelona';
      case 'madrid':
        return 'Real Madrid';
      default:
        return 'Equipo';
    }
  };

  const getTeamColors = () => {
    switch (player.team) {
      case 'athletic':
        return 'from-red-700 to-white';
      case 'barcelona':
        return 'from-blue-900 to-red-700';
      case 'madrid':
        return 'from-white to-yellow-400';
      default:
        return 'from-gray-700 to-gray-500';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Nombre del equipo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getTeamColors()} mb-4`}
      >
        {getTeamName()}
      </motion.div>

      {/* Sprite del equipo */}
      <div className={`
        w-32 h-32 rounded-full flex items-center justify-center text-6xl mb-4
        bg-gradient-to-br ${getTeamColors()} shadow-lg
      `}>
        {player.team === 'athletic' && 'ðŸ¦'}
        {player.team === 'barcelona' && 'ðŸ”µ'}
        {player.team === 'madrid' && 'ðŸ‘‘'}
      </div>

      {/* Barra de HP */}
      <div className="w-48 h-6 bg-gray-700 rounded-full overflow-hidden mb-2 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${hpPercent}%` }}
          className={`h-full ${
            hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
          {player.hp}/{player.maxHp} HP
        </div>
      </div>

      {/* Bloqueo y Energía */}
      <div className="flex gap-4 mt-2">
        {/* Bloqueo */}
        <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-full">
          <span className="text-blue-400 text-xl">ðŸ›¡ï¸</span>
          <span className="text-white font-bold">{player.block}</span>
        </div>

        {/* Energía */}
        <div className="flex items-center gap-2 bg-yellow-900/50 px-3 py-1 rounded-full">
          <span className="text-yellow-400 text-xl">âš¡</span>
          <span className="text-white font-bold">{player.energy}/{player.maxEnergy}</span>
        </div>
      </div>

      {/* Oro */}
      <div className="flex items-center gap-2 bg-yellow-700/50 px-3 py-1 rounded-full mt-2">
        <span className="text-yellow-300 text-xl">ðŸ’°</span>
        <span className="text-white font-bold">{player.gold}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="bg-rose-900/40 text-rose-200 px-2 py-1 rounded">Garra: {player.garra || 0}</div>
        <div className="bg-cyan-900/40 text-cyan-200 px-2 py-1 rounded">Posesion: {player.posesion || 0}</div>
        <div className="bg-amber-900/40 text-amber-200 px-2 py-1 rounded">Momentum: {player.momentum || 0}</div>
      </div>

      {/* Buffs/Debuffs */}
      {(player.buffs.length > 0 || player.debuffs.length > 0) && (
        <div className="flex gap-1 mt-3 flex-wrap justify-center max-w-48">
          {player.buffs.map((buff, i) => (
            <span key={i} className="text-xs bg-green-700 text-white px-2 py-1 rounded">
              {buff.name} {buff.value}
            </span>
          ))}
          {player.debuffs.map((debuff, i) => (
            <span key={i} className="text-xs bg-red-700 text-white px-2 py-1 rounded">
              {debuff.name} {debuff.value}
            </span>
          ))}
        </div>
      )}

      {/* Reliquias */}
      {player.relics.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap justify-center max-w-64">
          {player.relics.map((relic, i) => (
            <div
              key={i}
              title={relic.description}
              className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-xs cursor-help hover:bg-yellow-500 transition-colors"
            >
              ðŸ†
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
