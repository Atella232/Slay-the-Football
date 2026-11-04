import { describe, expect, it } from 'vitest'
import { rand, randInt, seedRng, shuffle } from './rng'

describe('rng', () => {
  it('es determinista por semilla y difiere entre semillas', () => {
    const a = seedRng('a')
    const b = seedRng('a')
    const c = seedRng('b')
    const xa = [rand(a), rand(a), rand(a)]
    expect([rand(b), rand(b), rand(b)]).toEqual(xa)
    expect([rand(c), rand(c), rand(c)]).not.toEqual(xa)
  })
  it('randInt cubre el rango de forma razonable', () => {
    const s = seedRng('dist')
    const counts = [0, 0, 0, 0]
    for (let i = 0; i < 4000; i++) counts[randInt(s, 4)]++
    for (const n of counts) expect(n).toBeGreaterThan(850)
  })
  it('shuffle conserva los elementos', () => {
    const s = seedRng('sh')
    const arr = shuffle(s, [1, 2, 3, 4, 5, 6])
    expect(arr.slice().sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
})
