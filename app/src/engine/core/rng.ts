// RNG determinista sfc32 con semillas derivadas por splitmix32.
// El estado es un array serializable de 4 enteros sin signo.

export type RngState = [number, number, number, number]

export function hashString(str: string): number {
  // cyrb53 reducido a 32 bits
  let h1 = 0xdeadbeef ^ 0
  let h2 = 0x41c6ce57 ^ 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h1 ^ h2) >>> 0
}

function splitmix32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x9e3779b9) >>> 0
    let z = s
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b)
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35)
    return (z ^ (z >>> 16)) >>> 0
  }
}

export function seedRng(...parts: (string | number)[]): RngState {
  const sm = splitmix32(hashString(parts.join('|')))
  const st: RngState = [sm(), sm(), sm(), sm()]
  // calentar
  for (let i = 0; i < 12; i++) nextU32(st)
  return st
}

export function nextU32(s: RngState): number {
  let [a, b, c, d] = s
  a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0
  const t = (((a + b) >>> 0) + d) >>> 0
  d = (d + 1) >>> 0
  a = b ^ (b >>> 9)
  b = (c + (c << 3)) >>> 0
  c = (c << 21) | (c >>> 11)
  c = (c + t) >>> 0
  s[0] = a >>> 0; s[1] = b >>> 0; s[2] = c >>> 0; s[3] = d
  return t
}

/** Float en [0,1). */
export function rand(s: RngState): number {
  return nextU32(s) / 4294967296
}

/** Entero en [0, n). */
export function randInt(s: RngState, n: number): number {
  if (n <= 0) return 0
  return Math.floor(rand(s) * n)
}

export function chance(s: RngState, p: number): boolean {
  return rand(s) < p
}

export function pick<T>(s: RngState, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick de array vacío')
  return arr[randInt(s, arr.length)]
}

export function shuffle<T>(s: RngState, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(s, i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function weighted<T>(s: RngState, items: readonly { item: T; w: number }[]): T {
  const total = items.reduce((acc, it) => acc + Math.max(0, it.w), 0)
  if (total <= 0) return items[0].item
  let r = rand(s) * total
  for (const it of items) {
    const w = Math.max(0, it.w)
    if (r < w) return it.item
    r -= w
  }
  return items[items.length - 1].item
}

/** Muestra k elementos distintos. */
export function sample<T>(s: RngState, arr: readonly T[], k: number): T[] {
  const copy = arr.slice()
  shuffle(s, copy)
  return copy.slice(0, Math.min(k, copy.length))
}
