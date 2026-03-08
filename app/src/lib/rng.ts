let activeSeed = normalizeRngSeed(Date.now());
let activeState = activeSeed;
let idCounter = 0;

export function normalizeRngSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1;
  const normalized = Math.abs(Math.floor(seed)) >>> 0;
  return normalized || 1;
}

export function setRngSeed(seed: number): number {
  activeSeed = normalizeRngSeed(seed);
  activeState = activeSeed;
  idCounter = 0;
  return activeSeed;
}

export function getRngSeed(): number {
  return activeSeed;
}

export function randomFloat(): number {
  activeState = (1664525 * activeState + 1013904223) >>> 0;
  return activeState / 0x100000000;
}

export function randomBool(chance = 0.5): boolean {
  return randomFloat() < chance;
}

export function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(randomFloat() * maxExclusive);
}

export function randomBetween(minInclusive: number, maxInclusive: number): number {
  if (maxInclusive <= minInclusive) return minInclusive;
  return minInclusive + randomInt(maxInclusive - minInclusive + 1);
}

export function randomChoice<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('randomChoice requires at least one item');
  }
  return items[randomInt(items.length)];
}

export function shuffleWithRng<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createRandomId(prefix: string): string {
  idCounter += 1;
  const token = Math.floor(randomFloat() * 0xffffffff)
    .toString(36)
    .padStart(7, '0')
    .slice(0, 7);
  return `${prefix}_${activeSeed.toString(36)}_${idCounter.toString(36)}_${token}`;
}
