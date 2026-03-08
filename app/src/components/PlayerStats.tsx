import { Shield, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

import { useGameStore } from '@/store/gameStore';

function getTeamName(team: string): string {
  switch (team) {
    case 'athletic':
      return 'Athletic Club';
    case 'barcelona':
      return 'FC Barcelona';
    case 'madrid':
      return 'Real Madrid';
    default:
      return 'Equipo';
  }
}

function getTeamColors(team: string): string {
  switch (team) {
    case 'athletic':
      return 'from-red-700 to-white';
    case 'barcelona':
      return 'from-blue-900 to-red-700';
    case 'madrid':
      return 'from-white to-yellow-400';
    default:
      return 'from-gray-700 to-gray-500';
  }
}

function getTeamBadge(team: string): string {
  switch (team) {
    case 'athletic':
      return 'ATH';
    case 'barcelona':
      return 'BAR';
    case 'madrid':
      return 'RMA';
    default:
      return 'CLB';
  }
}

export function PlayerStats() {
  const player = useGameStore(state => state.player);
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const teamColors = getTeamColors(player.team);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${teamColors} mb-4`}
      >
        {getTeamName(player.team)}
      </motion.div>

      <div className={`w-32 h-32 rounded-full flex items-center justify-center text-3xl font-black tracking-[0.24em] mb-4 bg-gradient-to-br ${teamColors} text-slate-950 shadow-lg`}>
        {getTeamBadge(player.team)}
      </div>

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

      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-full">
          <Shield className="h-4 w-4 text-blue-300" />
          <span className="text-white font-bold">{player.block}</span>
        </div>

        <div className="flex items-center gap-2 bg-yellow-900/50 px-3 py-1 rounded-full">
          <Zap className="h-4 w-4 text-yellow-300" />
          <span className="text-white font-bold">{player.energy}/{player.maxEnergy}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-yellow-700/50 px-3 py-1 rounded-full mt-2">
        <Trophy className="h-4 w-4 text-yellow-200" />
        <span className="text-white font-bold">{player.gold}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="bg-rose-900/40 text-rose-200 px-2 py-1 rounded">Garra: {player.garra || 0}</div>
        <div className="bg-cyan-900/40 text-cyan-200 px-2 py-1 rounded">Posesion: {player.posesion || 0}</div>
        <div className="bg-amber-900/40 text-amber-200 px-2 py-1 rounded">Momentum: {player.momentum || 0}</div>
      </div>

      {(player.buffs.length > 0 || player.debuffs.length > 0) && (
        <div className="flex gap-1 mt-3 flex-wrap justify-center max-w-48">
          {player.buffs.map((buff, index) => (
            <span key={`${buff.id}_${index}`} className="text-xs bg-green-700 text-white px-2 py-1 rounded">
              {buff.name} {buff.value}
            </span>
          ))}
          {player.debuffs.map((debuff, index) => (
            <span key={`${debuff.id}_${index}`} className="text-xs bg-red-700 text-white px-2 py-1 rounded">
              {debuff.name} {debuff.value}
            </span>
          ))}
        </div>
      )}

      {player.relics.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap justify-center max-w-64">
          {player.relics.map((relic, index) => (
            <div
              key={`${relic.id}_${index}`}
              title={relic.description}
              className="min-w-10 h-8 rounded-full bg-yellow-600 px-2 flex items-center justify-center text-[10px] font-semibold tracking-wide text-slate-950 cursor-help hover:bg-yellow-500 transition-colors"
            >
              REL
            </div>
          ))}
        </div>
      )}
    </div>
  );
}