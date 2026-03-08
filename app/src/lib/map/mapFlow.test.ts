import { describe, expect, it } from 'vitest';

import type { Map as GameMap, Room } from '@/types/game';
import { generateMap, getReachableRoomIds, getReachableRooms, prepareRoomSelection } from '@/lib/map/mapFlow';

function makeMap(rooms: Room[], currentRoomId: string | null = null): GameMap {
  return {
    act: 1,
    currentRoomId,
    rooms,
  };
}

describe('mapFlow helpers', () => {
  it('never generates dead-end rooms before the final boss row', () => {
    for (const act of [1, 2, 3, 4]) {
      for (let i = 0; i < 120; i += 1) {
        const rooms = generateMap(act, 0);
        const lastRow = Math.max(...rooms.map(room => room.y));
        const deadEnds = rooms.filter(room => room.y < lastRow && room.connections.length === 0);
        expect(deadEnds.length).toBe(0);
      }
    }
  });

  it('returns first row as reachable when the run has not started moving', () => {
    const rooms: Room[] = [
      { id: 'a', type: 'monster', x: 0, y: 0, connections: ['c'], visited: false },
      { id: 'b', type: 'shop', x: 1, y: 0, connections: ['d'], visited: false },
      { id: 'c', type: 'monster', x: 0, y: 1, connections: [], visited: false },
      { id: 'd', type: 'rest', x: 1, y: 1, connections: [], visited: false },
    ];

    expect(getReachableRoomIds(makeMap(rooms))).toEqual(['a', 'b']);
    expect(getReachableRooms(makeMap(rooms)).map(room => room.id)).toEqual(['a', 'b']);
  });

  it('falls back to the next row when the current room has no connections', () => {
    const rooms: Room[] = [
      { id: 'start', type: 'monster', x: 0, y: 0, connections: [], visited: true },
      { id: 'shop_next', type: 'shop', x: 0, y: 1, connections: [], visited: false },
      { id: 'rest_next', type: 'rest', x: 1, y: 1, connections: [], visited: false },
    ];

    expect(getReachableRoomIds(makeMap(rooms, 'start'))).toEqual(['shop_next', 'rest_next']);
  });

  it('resolves unknown rooms, marks them visited and updates current room id', () => {
    const rooms: Room[] = [
      { id: 'unknown_start', type: 'unknown', x: 0, y: 0, connections: ['next_room'], visited: false },
      { id: 'next_room', type: 'monster', x: 0, y: 1, connections: [], visited: false },
    ];

    const result = prepareRoomSelection(makeMap(rooms), 'unknown_start', () => 'event');
    expect(result).not.toBeNull();
    expect(result?.map.currentRoomId).toBe('unknown_start');
    expect(result?.room.type).toBe('event');
    expect(result?.room.visited).toBe(true);
  });

  it('blocks selecting rooms that are not currently reachable', () => {
    const rooms: Room[] = [
      { id: 'start_room', type: 'monster', x: 0, y: 0, connections: ['allowed_room'], visited: true },
      { id: 'allowed_room', type: 'monster', x: 0, y: 1, connections: [], visited: false },
      { id: 'blocked_room', type: 'shop', x: 1, y: 1, connections: [], visited: false },
    ];

    const result = prepareRoomSelection(makeMap(rooms, 'start_room'), 'blocked_room');
    expect(result).toBeNull();
  });
});
