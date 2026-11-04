import type { Ctx } from './ctx'
import type { EffectOp, Task } from '../model/types'

/** Manejador de efecto personalizado. Devuelve ops a insertar o nada. */
export type Handler = (ctx: Ctx, task: Task, args: Record<string, number | string>) => EffectOp[] | void
