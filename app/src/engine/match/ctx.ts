import { clone } from '../core/clone'
import { EngineError } from '../core/assert'
import type { CardDef, CardInst, CardType, GameEvent, MatchState, RunState, Side, Source, Task } from '../model/types'
import { cardDef } from '../registry'

export interface Frame {
  ev: GameEvent
  snap: RunState
}

export const OPS_BUDGET = 4000

export class Ctx {
  run: RunState
  events: GameEvent[] = []
  frames: Frame[] | null
  opsUsed = 0
  /** Lado que está actuando (para la marca "fresh" de estados). */
  acting: Side = 'player'

  constructor(run: RunState, opts: { frames?: boolean } = {}) {
    this.run = run
    this.frames = opts.frames ? [] : null
  }

  get inMatch(): boolean {
    return this.run.screen.k === 'match'
  }

  get m(): MatchState {
    const s = this.run.screen
    if (s.k !== 'match') throw new EngineError('No hay partido en curso')
    return s.m
  }

  emit(ev: GameEvent): void {
    this.events.push(ev)
    if (this.frames) this.frames.push({ ev, snap: clone(this.run) })
  }

  log(text: string): void {
    if (this.inMatch) {
      const l = this.m.log
      l.push(text)
      if (l.length > 40) l.splice(0, l.length - 40)
    }
    this.emit({ e: 'log', text })
  }

  inst(uid: number): CardInst {
    const c = this.m.cards[uid]
    if (!c) throw new EngineError(`Carta uid ${uid} no existe en el partido`)
    return c
  }

  def(uid: number): CardDef {
    return cardDef(this.inst(uid).def)
  }

  cardType(uid: number): CardType {
    return this.def(uid).type
  }

  spend(): void {
    this.opsUsed++
    if (this.opsUsed > OPS_BUDGET) throw new EngineError('Bucle de efectos detectado (presupuesto de ops agotado)')
  }
}

export function ownerOf(src: Source): Side {
  return src.kind === 'rival' ? 'rival' : 'player'
}

export function newTask(ops: Task['ops'], src: Source, bind: Record<string, number> = {}, x?: number): Task {
  return { ops: ops.slice(), i: 0, src, bind: { ...bind }, x }
}
