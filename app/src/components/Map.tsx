import { useState } from 'react';
import { motion } from 'framer-motion';

import { useGameStore } from '@/store/gameStore';
import type { Room } from '@/types/game';

interface MapNodeProps {
  room: Room;
  isCurrent: boolean;
  isReachable: boolean;
  onClick: () => void;
}

function getRoomIcon(type: Room['type']): string {
  if (type === 'monster') return '⚽';
  if (type === 'elite') return '🔥';
  if (type === 'rest') return '🏨';
  if (type === 'shop') return '🛒';
  if (type === 'treasure') return '🏆';
  if (type === 'boss') return '👑';
  if (type === 'event') return '❓';
  return '❔';
}

function getRoomName(type: Room['type']): string {
  if (type === 'monster') return 'Normal';
  if (type === 'elite') return 'Elite';
  if (type === 'rest') return 'Descanso';
  if (type === 'shop') return 'Tienda';
  if (type === 'treasure') return 'Tesoro';
  if (type === 'boss') return 'Jefe';
  if (type === 'event') return 'Evento';
  return 'Desconocido';
}

function getRoomClass(room: Room, isCurrent: boolean, isReachable: boolean): string {
  if (isCurrent) return 'bg-emerald-500/95 border-emerald-200 text-emerald-950 shadow-[0_0_18px_rgba(16,185,129,0.6)]';
  if (room.visited) return 'bg-slate-700/90 border-slate-500 text-slate-200';
  if (isReachable && room.type === 'elite') return 'bg-rose-600/90 border-rose-300 text-white';
  if (isReachable && room.type === 'boss') return 'bg-amber-500/90 border-amber-100 text-amber-950';
  if (isReachable && room.type === 'unknown') return 'bg-violet-600/90 border-violet-200 text-white';
  if (isReachable) return 'bg-cyan-600/90 border-cyan-200 text-white';
  return 'bg-slate-800/70 border-slate-600/60 text-slate-500';
}

function MapNode({ room, isCurrent, isReachable, onClick }: MapNodeProps) {
  return (
    <motion.button
      type="button"
      whileHover={isReachable ? { scale: 1.1, y: -2 } : {}}
      whileTap={isReachable ? { scale: 0.97 } : {}}
      onClick={isReachable ? onClick : undefined}
      disabled={!isReachable}
      title={getRoomName(room.type)}
      className={`w-12 h-12 rounded-full border-2 text-sm font-bold transition-all duration-200 ${getRoomClass(room, isCurrent, isReachable)}`}
    >
      <span className="text-lg leading-none">{getRoomIcon(room.type)}</span>
    </motion.button>
  );
}

function ConnectionLine({ fromX, fromY, toX, toY, isActive }: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
}) {
  const midY = (fromY + toY) / 2;
  return (
    <path
      d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
      fill="none"
      stroke={isActive ? '#48d1ef' : '#334155'}
      strokeWidth={isActive ? 2.8 : 1.6}
      strokeDasharray={isActive ? '0' : '5,4'}
      className="transition-all duration-300"
    />
  );
}

function getActName(act: number): string {
  if (act === 1) return 'Segunda Division';
  if (act === 2) return 'Primera Division';
  if (act === 3) return 'Champions League';
  return 'Final Continental';
}

export function MapComponent() {
  const { map, selectRoom, inCombat, player, ascension } = useGameStore();
  const [showLegend, setShowLegend] = useState(false);

  if (inCombat) return null;

  const rowSpacing = 74;
  const colSpacing = 104;
  const padding = 48;

  const currentRoom = map.rooms.find(room => room.id === map.currentRoomId);
  const reachableRooms = !currentRoom
    ? map.rooms.filter(room => room.y === 0).map(room => room.id)
    : currentRoom.connections.length > 0
      ? currentRoom.connections
      : map.rooms.filter(room => room.y === currentRoom.y + 1).map(room => room.id);

  const rows: Room[][] = [];
  map.rooms.forEach(room => {
    if (!rows[room.y]) rows[room.y] = [];
    rows[room.y].push(room);
  });
  rows.forEach(row => row.sort((a, b) => a.x - b.x));

  const maxRoomsInRow = Math.max(...rows.map(row => row.length), 1);
  const mapWidth = Math.max(640, padding * 2 + (maxRoomsInRow - 1) * colSpacing);
  const mapHeight = Math.max(460, padding * 2 + (rows.length - 1) * rowSpacing);

  const getRoomPosition = (roomId: string) => {
    const room = map.rooms.find(r => r.id === roomId);
    if (!room) return null;
    const rowRooms = rows[room.y];
    if (!rowRooms) return null;
    const indexInRow = rowRooms.findIndex(r => r.id === roomId);
    const startX = mapWidth / 2 - ((rowRooms.length - 1) * colSpacing) / 2;
    return {
      x: startX + indexInRow * colSpacing,
      y: padding + room.y * rowSpacing,
    };
  };

  const legendItems = [
    '⚽ Normal',
    '🔥 Elite',
    '🏨 Descanso',
    '🛒 Tienda',
    '🏆 Tesoro',
    '👑 Jefe',
    '❓ Evento',
    '❔ Desconocido',
  ];

  return (
    <div className="screen-shell min-h-screen px-4 py-5 md:px-7 md:py-6 soft-grid">
      <div className="mx-auto max-w-6xl">
        <header className="glass-panel rounded-2xl p-4 md:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.24em] uppercase text-cyan-200/80">Ruta del torneo</p>
            <h1 className="hero-title text-2xl md:text-3xl text-white mt-1">Acto {map.act} · {getActName(map.act)}</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="metric-pill text-amber-200">A{ascension}</span>
            <span className="metric-pill text-rose-200">HP {player.hp}/{player.maxHp}</span>
            <span className="metric-pill text-amber-100">Oro {player.gold}</span>
            <button
              type="button"
              onClick={() => setShowLegend(prev => !prev)}
              className="metric-pill text-cyan-100 hover:bg-cyan-700/30 transition-colors"
            >
              {showLegend ? 'Ocultar leyenda' : 'Ver leyenda'}
            </button>
          </div>
        </header>

        {showLegend && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-4 mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-100"
          >
            {legendItems.map(item => (
              <span key={item} className="metric-pill justify-center text-center">{item}</span>
            ))}
          </motion.div>
        )}

        <section className="glass-panel rounded-2xl p-3 mt-4">
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 210px)' }}>
            <div className="relative" style={{ height: `${mapHeight}px`, minHeight: '440px' }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="xMidYMin meet">
                {map.rooms.map(room => {
                  const fromPos = getRoomPosition(room.id);
                  if (!fromPos) return null;
                  return room.connections.map(connId => {
                    const toPos = getRoomPosition(connId);
                    if (!toPos) return null;
                    const isActive = reachableRooms.includes(connId) || !!room.visited;
                    return (
                      <ConnectionLine
                        key={`${room.id}-${connId}`}
                        fromX={fromPos.x}
                        fromY={fromPos.y}
                        toX={toPos.x}
                        toY={toPos.y}
                        isActive={isActive}
                      />
                    );
                  });
                })}
              </svg>

              <div className="relative">
                {rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-12 mb-8">
                    {row.map((room, roomIndex) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: rowIndex * 0.03 + roomIndex * 0.02 }}
                      >
                        <MapNode
                          room={room}
                          isCurrent={room.id === map.currentRoomId}
                          isReachable={reachableRooms.includes(room.id)}
                          onClick={() => selectRoom(room.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {player.relics.length > 0 && (
          <section className="glass-panel rounded-2xl p-3 mt-4">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200/90">Reliquias activas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {player.relics.map(relic => (
                <span
                  key={relic.id}
                  title={`${relic.name}: ${relic.description}`}
                  className="metric-pill text-xs text-slate-100"
                >
                  {relic.name}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
