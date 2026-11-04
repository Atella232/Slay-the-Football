import type { Handler } from '../engine/match/handlers'
import { exhaustCard } from '../engine/match/cards'
import { gainRes, heal } from '../engine/match/combat'
import { clubDef } from '../engine/registry'

export const HANDLERS: Record<string, Handler> = {
  /** Agota toda la mano (salvo la carta en juego). Liga $picked. */
  exhaustHand: (ctx, task) => {
    const m = ctx.m
    const uids = m.piles.hand.slice()
    for (const uid of uids) exhaustCard(ctx, uid)
    task.bind.picked = uids.length
  },
  /** Energía extra para el turno siguiente. */
  energyNext: (ctx, _task, args) => {
    ctx.m.player.energyBonusNext += Number(args.n ?? 1)
  },
  /** Conserva la energía no gastada. */
  carryEnergy: ctx => {
    const m = ctx.m
    m.player.energyBonusNext += m.player.energy
  },
  /** Gana N del recurso del club. */
  gainClubRes: (ctx, _task, args) => {
    gainRes(ctx, Number(args.n ?? 1), clubDef(ctx.run.club).res)
  },
  /** Cura un porcentaje de la Forma máxima. */
  healPct: (ctx, _task, args) => {
    heal(ctx, Math.floor((ctx.run.formaMax * Number(args.n ?? 0)) / 100))
  },
}
