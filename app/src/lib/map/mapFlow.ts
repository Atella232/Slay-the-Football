import { getAscensionTuning } from '@/lib/ascension';
import { randomBool, randomFloat, randomInt, shuffleWithRng } from '@/lib/rng';
import type { Map as GameMap, Room } from '@/types/game';

type NavigableRoomType = Exclude<Room['type'], 'boss' | 'unknown'>;

export interface PreparedRoomSelection {
  map: GameMap;
  room: Room;
}

function getEliteTargetForAct(act: number, ascension: number): number {
  const tuning = getAscensionTuning(ascension);
  const eliteBonus = tuning.eliteTargetBonus;
  if (act === 1) return 1;
  if (act === 2) return 2 + eliteBonus;
  if (act === 4) return (randomBool() ? 3 : 4) + eliteBonus;
  return (randomBool() ? 2 : 3) + eliteBonus;
}

export function resolveUnknownRoomType(): NavigableRoomType {
  const rand = randomFloat();
  if (rand < 0.35) return 'monster';
  if (rand < 0.52) return 'event';
  if (rand < 0.67) return 'shop';
  if (rand < 0.79) return 'rest';
  if (rand < 0.92) return 'treasure';
  return 'elite';
}

export function getReachableRoomIds(map: GameMap): string[] {
  const currentRoom = map.rooms.find(room => room.id === map.currentRoomId);
  if (!currentRoom) {
    return map.rooms.filter(room => room.y === 0).map(room => room.id);
  }

  if (currentRoom.connections.length > 0) {
    return currentRoom.connections;
  }

  return map.rooms.filter(room => room.y === currentRoom.y + 1).map(room => room.id);
}

export function getReachableRooms(map: GameMap): Room[] {
  const reachableIds = new Set(getReachableRoomIds(map));
  return map.rooms.filter(room => reachableIds.has(room.id));
}

export function prepareRoomSelection(
  map: GameMap,
  roomId: string,
  resolveUnknownTypeFn: () => NavigableRoomType = resolveUnknownRoomType
): PreparedRoomSelection | null {
  const reachableRoomIds = getReachableRoomIds(map);
  if (!reachableRoomIds.includes(roomId)) return null;

  let workingRooms = map.rooms;
  let room = workingRooms.find(candidate => candidate.id === roomId);
  if (!room || room.visited) return null;

  if (room.type === 'unknown') {
    const resolvedType = resolveUnknownTypeFn();
    workingRooms = workingRooms.map(candidate =>
      candidate.id === roomId ? { ...candidate, type: resolvedType } : candidate
    );
    room = workingRooms.find(candidate => candidate.id === roomId);
    if (!room) return null;
  }

  const updatedRooms = workingRooms.map(candidate =>
    candidate.id === roomId ? { ...candidate, visited: true } : candidate
  );
  const selectedRoom = updatedRooms.find(candidate => candidate.id === roomId);
  if (!selectedRoom) return null;

  return {
    map: {
      ...map,
      currentRoomId: roomId,
      rooms: updatedRooms,
    },
    room: selectedRoom,
  };
}

export function generateMap(act: number, ascension: number): Room[] {
  const rooms: Room[] = [];
  const rows = act === 4 ? 13 : 15 + randomInt(3);
  const cols = 7;

  for (let y = 0; y < rows; y++) {
    let numRooms = randomInt(2) + 3;
    if (y === 0) numRooms = 3;
    if (y === rows - 1) numRooms = 1;

    const positions: number[] = [];
    if (y === rows - 1) {
      positions.push(Math.floor(cols / 2));
    } else {
      while (positions.length < numRooms) {
        const pos = randomInt(cols);
        if (!positions.includes(pos)) positions.push(pos);
      }
      positions.sort((a, b) => a - b);
    }

    for (const x of positions) {
      let type: Room['type'];
      if (y === 0) {
        type = 'monster';
      } else if (y === rows - 1) {
        type = 'boss';
      } else {
        const rand = randomFloat();
        if (act === 4) {
          if (rand < 0.12) type = 'unknown';
          else if (rand < 0.37) type = 'monster';
          else if (rand < 0.52) type = 'event';
          else if (rand < 0.65) type = 'rest';
          else if (rand < 0.76) type = 'shop';
          else type = 'elite';
        } else {
          if (rand < 0.18) type = 'unknown';
          else if (rand < 0.5) type = 'monster';
          else if (rand < 0.62) type = 'event';
          else if (rand < 0.74) type = 'rest';
          else if (rand < 0.86) type = 'shop';
          else type = 'elite';
        }
      }

      rooms.push({
        id: `room_${y}_${x}`,
        type,
        x,
        y,
        connections: [],
        visited: false,
      });
    }
  }

  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    const nextRowRooms = rooms.filter(candidate => candidate.y === room.y + 1);
    for (const nextRoom of nextRowRooms) {
      if (Math.abs(nextRoom.x - room.x) <= 2) {
        room.connections.push(nextRoom.id);
      }
    }
  }

  for (const room of rooms) {
    if (room.y === 0) continue;
    const hasParent = rooms.some(candidate => candidate.y === room.y - 1 && candidate.connections.includes(room.id));
    if (!hasParent) {
      const prevRowRooms = rooms.filter(candidate => candidate.y === room.y - 1);
      if (prevRowRooms.length > 0) {
        prevRowRooms.sort((a, b) => Math.abs(a.x - room.x) - Math.abs(b.x - room.x));
        prevRowRooms[0].connections.push(room.id);
      }
    }
  }

  for (const room of rooms) {
    if (room.y >= rows - 1) continue;
    if (room.connections.length > 0) continue;

    const nextRowRooms = rooms.filter(candidate => candidate.y === room.y + 1);
    if (nextRowRooms.length === 0) continue;

    nextRowRooms.sort((a, b) => Math.abs(a.x - room.x) - Math.abs(b.x - room.x));
    room.connections.push(nextRowRooms[0].id);
  }

  rooms.forEach(room => {
    room.connections = [...new Set(room.connections)];
  });

  const treasureBand = rooms.filter(room => room.y >= Math.floor(rows * 0.45) && room.y <= Math.floor(rows * 0.6) && room.type !== 'boss');
  if (treasureBand.length > 0) {
    const treasureRoom = treasureBand[randomInt(treasureBand.length)];
    treasureRoom.type = 'treasure';
  }

  const targetElite = getEliteTargetForAct(act, ascension);
  const eliteRooms = rooms.filter(room => room.type === 'elite');
  if (eliteRooms.length > targetElite) {
    const toDowngrade = shuffleWithRng([...eliteRooms]).slice(0, eliteRooms.length - targetElite);
    toDowngrade.forEach(room => {
      room.type = 'monster';
    });
  } else if (eliteRooms.length < targetElite) {
    const candidates = rooms.filter(room => room.type === 'monster' && room.y > 0 && room.y < rows - 1);
    const toUpgrade = shuffleWithRng(candidates).slice(0, targetElite - eliteRooms.length);
    toUpgrade.forEach(room => {
      room.type = 'elite';
    });
  }

  const nonFixed = rooms.filter(room => room.y > 0 && room.y < rows - 1 && room.type !== 'treasure');
  if (!rooms.some(room => room.type === 'shop') && nonFixed.length > 0) {
    nonFixed[randomInt(nonFixed.length)].type = 'shop';
  }
  if (!rooms.some(room => room.type === 'rest') && nonFixed.length > 0) {
    nonFixed[randomInt(nonFixed.length)].type = 'rest';
  }

  return rooms;
}
