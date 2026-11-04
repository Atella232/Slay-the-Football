import { describe, expect, it } from 'vitest'
import { checkMap, generateMap, MAP_ROWS, FINAL_ID } from './map/generate'
import { seedRng } from '../core/rng'

describe('generador de mapa', () => {
  it('cumple las reglas en 400 semillas por acto', () => {
    let okCount = 0
    for (let i = 0; i < 400; i++) {
      for (const act of [1, 2, 3] as const) {
        const nodes = generateMap(act, 0, seedRng('map', i, act))
        const chk = checkMap(nodes)
        if (chk.ok) okCount++
        expect(chk.minMercado).toBeGreaterThanOrEqual(1)
        expect(chk.minConcentracion).toBeGreaterThanOrEqual(1)
        expect(chk.maxGrande).toBeLessThanOrEqual(3)
        // filas fijas
        for (const n of nodes) {
          if (n.row === 0) expect(n.type).toBe('partido')
          if (n.row === 6) expect(n.type).toBe('vitrina')
          if (n.row === 12) expect(n.type).toBe('concentracion')
          if (n.row < 4) expect(['grande', 'concentracion']).not.toContain(n.type)
          if (n.id !== FINAL_ID && n.row < MAP_ROWS - 1) expect(n.next.length).toBeGreaterThan(0)
          if (n.row === MAP_ROWS - 1) expect(n.next).toEqual([FINAL_ID])
        }
        expect(nodes.find(n => n.id === FINAL_ID)?.type).toBe('final')
      }
    }
    expect(okCount / 1200).toBeGreaterThan(0.95)
  }, 60000)

  it('es determinista', () => {
    const a = generateMap(2, 0, seedRng('x', 1))
    const b = generateMap(2, 0, seedRng('x', 1))
    expect(a).toEqual(b)
  })
})
