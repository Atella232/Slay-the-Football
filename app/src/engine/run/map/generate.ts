import type { Act, MapNode, NodeType } from '../../model/types'
import type { RngState } from '../../core/rng'
import { randInt, shuffle } from '../../core/rng'

export const MAP_ROWS = 13
export const MAP_COLS = 7
export const MAP_PATHS = 6
export const FINAL_ID = 'final'

const SPECIAL: NodeType[] = ['grande', 'concentracion', 'mercado']

interface Grid {
  nodes: Map<string, MapNode>
  edges: Set<string>
}

function nid(act: Act, row: number, col: number): string {
  return `${act}-${row}-${col}`
}

function crosses(edges: Set<string>, row: number, from: number, to: number): boolean {
  // un borde (from→to) cruza con (from+d → to-d)
  if (from === to) return false
  if (to === from + 1) return edges.has(`${row}:${from + 1}>${from}`)
  if (to === from - 1) return edges.has(`${row}:${from - 1}>${from}`)
  return false
}

function buildPaths(act: Act, rng: RngState): Grid {
  const nodes = new Map<string, MapNode>()
  const edges = new Set<string>()
  const starts: number[] = []
  for (let p = 0; p < MAP_PATHS; p++) {
    let col = randInt(rng, MAP_COLS)
    if (p === 1) {
      let guard = 0
      while (col === starts[0] && guard++ < 20) col = randInt(rng, MAP_COLS)
    }
    starts.push(col)
    for (let row = 0; row < MAP_ROWS; row++) {
      const id = nid(act, row, col)
      if (!nodes.has(id)) nodes.set(id, { id, row, col, type: 'partido', next: [] })
      if (row === MAP_ROWS - 1) {
        const n = nodes.get(id)!
        if (!n.next.includes(FINAL_ID)) n.next.push(FINAL_ID)
        break
      }
      const options = [-1, 0, 1]
        .map(d => col + d)
        .filter(c => c >= 0 && c < MAP_COLS)
      shuffle(rng, options)
      let nextCol = options.find(c => !crosses(edges, row, col, c))
      if (nextCol === undefined) nextCol = col
      edges.add(`${row}:${col}>${nextCol}`)
      const nextId = nid(act, row + 1, nextCol)
      const n = nodes.get(id)!
      if (!n.next.includes(nextId)) n.next.push(nextId)
      col = nextCol
    }
  }
  return { nodes, edges }
}

interface Bag {
  types: NodeType[]
}

function makeBag(act: Act, count: number, exig: number, rng: RngState): Bag {
  const w: Record<string, number> = {
    partido: 46,
    evento: 22,
    grande: (act === 1 ? 10 : 14) + (exig >= 1 ? 4 : 0),
    concentracion: 12,
    mercado: 6,
  }
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  const types: NodeType[] = []
  for (const [t, wt] of Object.entries(w)) {
    const n = Math.round((wt / total) * count)
    for (let i = 0; i < n; i++) types.push(t as NodeType)
  }
  while (types.length < count) types.push('partido')
  shuffle(rng, types)
  return { types }
}

function allowed(t: NodeType, node: MapNode, parents: MapNode[]): boolean {
  const r = node.row
  if ((t === 'grande' || t === 'concentracion') && r < 4) return false
  if (t === 'concentracion' && r === 11) return false
  if (t === 'mercado' && r < 2) return false
  if (SPECIAL.includes(t) && parents.some(p => p.type === t)) return false
  return true
}

function parentsOf(nodes: MapNode[], id: string): MapNode[] {
  return nodes.filter(n => n.next.includes(id))
}

function assignTypes(act: Act, list: MapNode[], exig: number, rng: RngState): void {
  const fixed = new Set([0, 6, 12])
  const free = list.filter(n => !fixed.has(n.row))
  const bag = makeBag(act, free.length, exig, rng)
  const byRow = list.slice().sort((a, b) => a.row - b.row || a.col - b.col)
  for (const n of byRow) {
    if (n.row === 0) n.type = 'partido'
    else if (n.row === 6) n.type = 'vitrina'
    else if (n.row === 12) n.type = 'concentracion'
    else {
      const parents = parentsOf(list, n.id)
      const siblings = parents.flatMap(p => p.next).filter(id => id !== n.id)
      const sibTypes = list.filter(x => siblings.includes(x.id)).map(x => x.type)
      let idx = bag.types.findIndex(t => allowed(t, n, parents) && !(t !== 'partido' && sibTypes.includes(t)))
      if (idx < 0) idx = bag.types.findIndex(t => allowed(t, n, parents))
      if (idx < 0) {
        n.type = 'partido'
        continue
      }
      n.type = bag.types[idx]
      bag.types.splice(idx, 1)
    }
  }
}

// ── DP sobre caminos ──

function children(list: Map<string, MapNode>, n: MapNode): MapNode[] {
  return n.next.filter(id => id !== FINAL_ID).map(id => list.get(id)!).filter(Boolean)
}

function dpMin(list: Map<string, MapNode>, f: (n: MapNode) => number): Map<string, number> {
  const memo = new Map<string, number>()
  const sorted = [...list.values()].sort((a, b) => b.row - a.row)
  for (const n of sorted) {
    const ch = children(list, n)
    const best = ch.length ? Math.min(...ch.map(c => memo.get(c.id)!)) : 0
    memo.set(n.id, f(n) + best)
  }
  return memo
}

function dpMax(list: Map<string, MapNode>, f: (n: MapNode) => number): Map<string, number> {
  const memo = new Map<string, number>()
  const sorted = [...list.values()].sort((a, b) => b.row - a.row)
  for (const n of sorted) {
    const ch = children(list, n)
    const best = ch.length ? Math.max(...ch.map(c => memo.get(c.id)!)) : 0
    memo.set(n.id, f(n) + best)
  }
  return memo
}

function roots(list: Map<string, MapNode>): MapNode[] {
  return [...list.values()].filter(n => n.row === 0)
}

/** Recorre el camino que minimiza (o maximiza) f y devuelve sus nodos. */
function walk(list: Map<string, MapNode>, memo: Map<string, number>, mode: 'min' | 'max'): MapNode[] {
  const rs = roots(list)
  let cur = rs.reduce((a, b) => ((mode === 'min' ? memo.get(a.id)! <= memo.get(b.id)! : memo.get(a.id)! >= memo.get(b.id)!) ? a : b))
  const path = [cur]
  for (;;) {
    const ch = children(list, cur)
    if (!ch.length) break
    cur = ch.reduce((a, b) => ((mode === 'min' ? memo.get(a.id)! <= memo.get(b.id)! : memo.get(a.id)! >= memo.get(b.id)!) ? a : b))
    path.push(cur)
  }
  return path
}

function tryConvert(all: MapNode[], path: MapNode[], to: NodeType, rows: [number, number]): boolean {
  const cands = path.filter(n => n.type === 'partido' && n.row >= rows[0] && n.row <= rows[1] && ![0, 6, 12].includes(n.row))
  for (const n of cands) {
    const parents = parentsOf(all, n.id)
    const kids = n.next.map(id => all.find(x => x.id === id)).filter(Boolean) as MapNode[]
    if (!allowed(to, n, parents)) continue
    if (kids.some(k => k.type === to)) continue
    n.type = to
    return true
  }
  return false
}

export interface MapCheck {
  ok: boolean
  minMercado: number
  minConcentracion: number
  maxGrande: number
  grandeShare: number
}

export function checkMap(nodes: MapNode[]): MapCheck {
  const list = new Map(nodes.filter(n => n.id !== FINAL_ID).map(n => [n.id, n]))
  const rs = roots(list)
  const mm = dpMin(list, n => (n.type === 'mercado' ? 1 : 0))
  const mc = dpMin(list, n => (n.type === 'concentracion' && n.row >= 4 && n.row <= 10 ? 1 : 0))
  const mg = dpMax(list, n => (n.type === 'grande' ? 1 : 0))
  // proporción de caminos con al menos un grande
  const total = new Map<string, number>()
  const without = new Map<string, number>()
  const sorted = [...list.values()].sort((a, b) => b.row - a.row)
  for (const n of sorted) {
    const ch = children(list, n)
    const t = ch.length ? ch.reduce((acc, c) => acc + total.get(c.id)!, 0) : 1
    const w = n.type === 'grande' ? 0 : ch.length ? ch.reduce((acc, c) => acc + without.get(c.id)!, 0) : 1
    total.set(n.id, t)
    without.set(n.id, w)
  }
  const T = rs.reduce((a, r) => a + total.get(r.id)!, 0)
  const W = rs.reduce((a, r) => a + without.get(r.id)!, 0)
  const res = {
    minMercado: Math.min(...rs.map(r => mm.get(r.id)!)),
    minConcentracion: Math.min(...rs.map(r => mc.get(r.id)!)),
    maxGrande: Math.max(...rs.map(r => mg.get(r.id)!)),
    grandeShare: T > 0 ? (T - W) / T : 0,
  }
  return { ...res, ok: res.minMercado >= 1 && res.minConcentracion >= 1 && res.maxGrande <= 3 && res.grandeShare >= 0.7 }
}

function repair(all: MapNode[]): void {
  for (let iter = 0; iter < 30; iter++) {
    const list = new Map(all.filter(n => n.id !== FINAL_ID).map(n => [n.id, n]))
    const chk = checkMap(all)
    if (chk.ok) return
    if (chk.minMercado < 1) {
      const memo = dpMin(list, n => (n.type === 'mercado' ? 1 : 0))
      if (!tryConvert(all, walk(list, memo, 'min'), 'mercado', [2, 11])) return
      continue
    }
    if (chk.minConcentracion < 1) {
      const memo = dpMin(list, n => (n.type === 'concentracion' && n.row >= 4 && n.row <= 10 ? 1 : 0))
      if (!tryConvert(all, walk(list, memo, 'min'), 'concentracion', [4, 10])) return
      continue
    }
    if (chk.maxGrande > 3) {
      const memo = dpMax(list, n => (n.type === 'grande' ? 1 : 0))
      const path = walk(list, memo, 'max')
      const g = path.filter(n => n.type === 'grande').pop()
      if (!g) return
      g.type = 'partido'
      continue
    }
    if (chk.grandeShare < 0.7) {
      const memo = dpMin(list, n => (n.type === 'grande' ? 1 : 0))
      if (!tryConvert(all, walk(list, memo, 'min'), 'grande', [4, 11])) return
      continue
    }
  }
}

export function generateMap(act: Act, exig: number, rng: RngState): MapNode[] {
  let best: MapNode[] | null = null
  for (let attempt = 0; attempt < 20; attempt++) {
    const grid = buildPaths(act, rng)
    const list = [...grid.nodes.values()]
    assignTypes(act, list, exig, rng)
    repair(list)
    const final: MapNode = { id: FINAL_ID, row: MAP_ROWS, col: 3, type: 'final', next: [] }
    const all = [...list, final]
    best = all
    if (checkMap(all).ok) break
  }
  const out = best!
  for (const n of out) n.next.sort()
  return out.sort((a, b) => a.row - b.row || a.col - b.col)
}

export function reachable(nodes: MapNode[], current: string | null): string[] {
  if (current === null) return nodes.filter(n => n.row === 0).map(n => n.id)
  const cur = nodes.find(n => n.id === current)
  return cur ? cur.next.slice() : []
}
