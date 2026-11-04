// Atajos para escribir contenido de forma compacta y legible.
import type { ClubRes, CmpOp, Cond, EffectOp, IntentKind, MatchPhaseName, StatusId, V } from '../engine/model/types'

export const P = (n: V, hits?: V): EffectOp => (hits === undefined ? { op: 'peligro', n } : { op: 'peligro', n, hits })
export const B = (n: V): EffectOp => ({ op: 'bloqueo', n })
export const D = (n: V): EffectOp => ({ op: 'draw', n })
export const E = (n: V): EffectOp => ({ op: 'energy', n })
export const SELF = (id: StatusId, n: V): EffectOp => ({ op: 'status', who: 'self', id, n })
export const RIVAL = (id: StatusId, n: V): EffectOp => ({ op: 'status', who: 'rival', id, n })
export const RES = (res: ClubRes, n: V): EffectOp => ({ op: 'res', res, n })
export const IF = (c: Cond, then: EffectOp[], els?: EffectOp[]): EffectOp => (els ? { op: 'if', c, then, else: els } : { op: 'if', c, then })
export const HEAL = (n: V): EffectOp => ({ op: 'heal', n })
export const HURT = (n: V): EffectOp => ({ op: 'loseForma', n })
export const ADD = (def: string, to: 'hand' | 'draw' | 'discard', n: V = 1): EffectOp => ({ op: 'addCard', def, to, n })
export const CUSTOM = (h: string, args?: Record<string, number | string>): EffectOp => ({ op: 'custom', h, args })

export const resOf = (res: ClubRes): V => ({ k: 'res', res })
export const spent: V = { k: 'bound', name: 'spent' }
export const picked: V = { k: 'bound', name: 'picked' }
export const mul = (a: V, b: V): V => ({ k: 'mul', a, b })
export const add = (a: V, b: V): V => ({ k: 'add', a, b })

export const phase = (is: MatchPhaseName): Cond => ({ k: 'phase', is })
export const behind: Cond = { k: 'scoreDiff', op: '<', n: 0 }
export const ahead: Cond = { k: 'scoreDiff', op: '>', n: 0 }
export const hasRes = (res: ClubRes, n: number, op: CmpOp = '>='): Cond => ({ k: 'res', res, op, n })
export const intent = (part: IntentKind): Cond => ({ k: 'intentHas', part })
export const last = (type: 'ataque' | 'defensa' | 'tactica' | 'sistema'): Cond => ({ k: 'lastPlayed', type })
export const rivalHas = (id: StatusId, n = 1): Cond => ({ k: 'status', who: 'rival', id, op: '>=', n })
export const selfHas = (id: StatusId, n = 1): Cond => ({ k: 'status', who: 'self', id, op: '>=', n })
export const hasBlock = (n = 1): Cond => ({ k: 'block', op: '>=', n })
export const formaBelow = (pct: number): Cond => ({ k: 'formaPct', op: '<=', n: pct })
export const playedAtLeast = (n: number, type?: 'ataque' | 'defensa' | 'tactica'): Cond => ({ k: 'played', type, op: '>=', n })
