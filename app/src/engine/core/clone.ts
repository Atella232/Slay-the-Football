export function clone<T>(v: T): T {
  return structuredClone(v)
}
