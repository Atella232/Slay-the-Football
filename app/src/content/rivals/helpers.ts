import type { EffectOp, IntentPart, MoveDef } from '../../engine/model/types'

export const oc = (n: number): IntentPart => ({ k: 'ocasion', n })
export const at = (n: number, hits?: number): IntentPart => (hits ? { k: 'ataque', n, hits } : { k: 'ataque', n })
export const rep = (n: number): IntentPart => ({ k: 'repliegue', n })
export const pres = (text: string, ops: EffectOp[]): IntentPart => ({ k: 'presion', text, ops })
export const buff = (text: string, ops: EffectOp[]): IntentPart => ({ k: 'buff', text, ops })
export const mv = (name: string, ...parts: IntentPart[]): MoveDef => ({ name, parts })

/** Desde el punto de vista del rival: estado al jugador. */
export const toPlayer = (id: import('../../engine/model/types').StatusId, n: number): EffectOp => ({ op: 'status', who: 'rival', id, n })
/** Desde el punto de vista del rival: estado a sí mismo. */
export const toSelf = (id: import('../../engine/model/types').StatusId, n: number): EffectOp => ({ op: 'status', who: 'self', id, n })
export const giveCard = (def: string, to: 'hand' | 'draw' | 'discard', n = 1): EffectOp => ({ op: 'addCard', def, to, n })
