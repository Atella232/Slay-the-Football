export class EngineError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'EngineError'
  }
}

export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new EngineError(msg)
}
