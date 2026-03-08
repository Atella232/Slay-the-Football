import { useState } from 'react';
import { motion } from 'framer-motion';

import { getReachableRooms } from '@/lib/map/mapFlow';
import { getTeamPresentation } from '@/lib/teamPresentation';
import { useGameStore } from '@/store/gameStore';
import type { Room } from '@/types/game';

interface MapNodeProps {
  room: Room;
  isCurrent: boolean;
  isReachable: boolean;
  onClick: () => void;
}

interface DecisionCardProps {
  room: Room;
  onClick: () => void;
}

function getRoomIcon(type: Room['type']): string {
  if (type === 'monster') return 'M';
  if (type === 'elite') return 'E';
  if (type === 'rest') return 'R';
  if (type === 'shop') return 'S';
  if (type === 'treasure') return 'T';
  if (type === 'boss') return 'B';
  if (type === 'event') return '?';
  return '!';
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

function getRoomHint(type: Room['type']): string {
  if (type === 'monster') return 'Combate estandar para escalar mazo y economia.';
  if (type === 'elite') return 'Mas riesgo, mas reliquias y mejor oro.';
  if (type === 'rest') return 'Recupera vida o mejora una carta.';
  if (type === 'shop') return 'Compra tempo, removal o utilidades.';
  if (type === 'treasure') return 'Premio directo sin gastar vida.';
  if (type === 'boss') return 'Cierre del acto y salto de poder.';
  if (type === 'event') return 'Decision contextual con premio o coste.';
  return 'Nodo imprevisible que resolvera al entrar.';
}

function getRoomTone(type: Room['type']): string {
  if (type === 'elite') return 'border-rose-300/35 bg-rose-950/20 text-rose-100';
  if (type === 'rest') return 'border-emerald-300/30 bg-emerald-950/20 text-emerald-100';
  if (type === 'shop') return 'border-amber-300/30 bg-amber-950/20 text-amber-100';
  if (type === 'treasure') return 'border-yellow-300/30 bg-yellow-950/20 text-yellow-100';
  if (type === 'boss') return 'border-amber-100/40 bg-amber-900/20 text-amber-50';
  if (type === 'event') return 'border-cyan-300/30 bg-cyan-950/20 text-cyan-100';
  if (type === 'unknown') return 'border-violet-300/30 bg-violet-950/20 text-violet-100';
  return 'border-cyan-300/25 bg-slate-950/35 text-white';
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
      aria-label={`Sala ${getRoomName(room.type)} fila ${room.y + 1}`}
      className={`w-12 h-12 rounded-full border-2 text-sm font-bold transition-all duration-200 ${getRoomClass(room, isCurrent, isReachable)}`}
    >
      <span className="text-lg leading-none">{getRoomIcon(room.type)}</span>
    </motion.button>
  );
}

function DecisionCard({ room, onClick }: DecisionCardProps) {
  const roomName = getRoomName(room.type);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Entrar en ${roomName}`}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors hover:bg-slate-900/65 ${getRoomTone(room.type)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] opacity-80">Siguiente nodo</p>
          <p className="mt-2 text-lg font-semibold">Entrar en {roomName}</p>
        </div>
        <span className="metric-pill text-xs">Fila {room.y + 1}</span>
      </div>
      <p className="mt-3 text-sm opacity-90">{getRoomHint(room.type)}</p>
    </button>
  );
}

function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  isActive,
}: {
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

function getObjectiveLabel(currentRoom: Room | undefined, act: number): string {
  if (!currentRoom) return 'Selecciona tu primer partido para abrir la ruta del acto.';
  if (currentRoom.type === 'boss') return 'Ya estas en el cierre del acto. Ajusta recursos antes del salto.';
  if (act === 4) return 'Cada decision del acto final debe proteger vida y tempo de mano.';
  return 'Compara riesgo inmediato contra economia y escalado del mazo.';
}

export function MapComponent() {
  const { map, selectRoom, inCombat, player, ascension } = useGameStore();
  const [showLegend, setShowLegend] = useState(false);

  if (inCombat) return null;

  const rowSpacing = 74;
  const colSpacing = 104;
  const padding = 48;

  const currentRoom = map.rooms.find(room => room.id === map.currentRoomId);
  const teamPresentation = getTeamPresentation(player.team);
  const reachableRooms = getReachableRooms(map);
  const reachableRoomIds = reachableRooms.map(room => room.id);

  const rows: Room[][] = [];
  map.rooms.forEach(room => {
    if (!rows[room.y]) rows[room.y] = [];
    rows[room.y].push(room);
  });
  rows.forEach(row => row.sort((a, b) => a.x - b.x));

  const maxRoomsInRow = Math.max(...rows.map(row => row.length), 1);
  const mapWidth = Math.max(640, padding * 2 + (maxRoomsInRow - 1) * colSpacing);
  const mapHeight = Math.max(460, padding * 2 + (rows.length - 1) * rowSpacing);
  const progressMax = Math.max(rows.length - 1, 1);
  const progressValue = currentRoom ? currentRoom.y + 1 : 0;
  const currentRoomLabel = currentRoom ? getRoomName(currentRoom.type) : 'Inicio del acto';

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
    'M Normal',
    'E Elite',
    'R Descanso',
    'S Tienda',
    'T Tesoro',
    'B Jefe',
    '? Evento',
    '! Desconocido',
  ];

  return (
    <div className="screen-shell min-h-screen px-4 py-5 md:px-7 md:py-6 soft-grid">
      <div className="mx-auto max-w-7xl">
        <header className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4 md:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
          <div className="flex items-start gap-4">
            <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`h-16 w-16 shrink-0 object-contain ${teamPresentation.emblemTint}`} />
            <div>
              <p className="text-xs tracking-[0.24em] uppercase text-cyan-200/80">Ruta del torneo</p>
              <h1 className={`hero-title mt-1 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-2xl md:text-3xl text-transparent`}>
                Acto {map.act} - {getActName(map.act)}
              </h1>
              <p className="mt-2 text-sm text-slate-300">{getObjectiveLabel(currentRoom, map.act)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="metric-pill text-amber-200">A{ascension}</span>
            <span className="metric-pill text-rose-200">HP {player.hp}/{player.maxHp}</span>
            <span className="metric-pill text-amber-100">Oro {player.gold}</span>
            <span className={`metric-pill ${teamPresentation.pillAccent}`}>Opciones {reachableRooms.length}</span>
            <button
              type="button"
              onClick={() => setShowLegend(prev => !prev)}
              className={`metric-pill ${teamPresentation.pillAccent} hover:bg-cyan-700/30 transition-colors`}
            >
              {showLegend ? 'Ocultar leyenda' : 'Ver leyenda'}
            </button>
          </div>
        </header>

        {showLegend && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4 mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-100`}
          >
            {legendItems.map(item => (
              <span key={item} className="metric-pill justify-center text-center">{item}</span>
            ))}
          </motion.div>
        )}

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
          <aside className="space-y-4">
            <section className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Nodo actual</p>
                  <h2 className={`mt-2 bg-gradient-to-r ${teamPresentation.headerGradient} bg-clip-text text-2xl font-semibold text-transparent`}>
                    {currentRoomLabel}
                  </h2>
                </div>
                <img alt={`${teamPresentation.name} crest`} src={teamPresentation.crestSrc} className={`h-14 w-14 object-contain ${teamPresentation.emblemTint}`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="metric-pill text-emerald-100">Progreso {progressValue}/{progressMax}</span>
                <span className={`metric-pill ${teamPresentation.pillAccent}`}>{currentRoom ? `Fila ${currentRoom.y + 1}` : 'Inicio'}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {currentRoom ? getRoomHint(currentRoom.type) : 'Aun no has fijado camino. El primer combate siempre abre la run.'}
              </p>
            </section>

            <section className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Siguiente decision</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Elige tu proximo nodo</h2>
                </div>
                <span className={`metric-pill ${teamPresentation.pillAccent}`}>{reachableRooms.length} rutas</span>
              </div>

              <div className="mt-4 space-y-3">
                {reachableRooms.map(room => (
                  <DecisionCard key={room.id} room={room} onClick={() => selectRoom(room.id)} />
                ))}
              </div>
            </section>

            {player.relics.length > 0 && (
              <section className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4`}>
                <p className="text-xs uppercase tracking-[0.22em] text-amber-200/90">Reliquias activas</p>
                <div className="mt-3 flex flex-wrap gap-2">
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
          </aside>

          <section className={`glass-panel rounded-2xl border ${teamPresentation.softAccent} p-4`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Vista global del acto</p>
                <h2 className="text-xl font-semibold text-white mt-1">Mapa tactico</h2>
              </div>
              <p className="text-sm text-slate-300">La linea luminosa marca tus salidas disponibles desde la posicion actual.</p>
            </div>

            <div className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 210px)' }}>
              <div className="relative" style={{ height: `${mapHeight}px`, minHeight: '440px' }}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="xMidYMin meet">
                  {map.rooms.map(room => {
                    const fromPos = getRoomPosition(room.id);
                    if (!fromPos) return null;
                    return room.connections.map(connId => {
                      const toPos = getRoomPosition(connId);
                      if (!toPos) return null;
                      const isActive = reachableRoomIds.includes(connId) || !!room.visited;
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
                            isReachable={reachableRoomIds.includes(room.id)}
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
        </div>
      </div>
    </div>
  );
}
