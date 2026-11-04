import type {
  CardDef,
  CharlaDef,
  ClubDef,
  ClubId,
  ConsumibleDef,
  EventDef,
  ExigenciaLevelDef,
  RivalDef,
  TrofeoDef,
} from './model/types'
import type { Handler } from './match/handlers'

export interface ContentPack {
  version: string
  clubs: Record<ClubId, ClubDef>
  cards: Record<string, CardDef>
  trofeos: Record<string, TrofeoDef>
  consumibles: Record<string, ConsumibleDef>
  rivals: Record<string, RivalDef>
  events: Record<string, EventDef>
  charlas: Record<string, CharlaDef>
  exigencia: ExigenciaLevelDef[]
  handlers: Record<string, Handler>
}

let pack: ContentPack | null = null

export function setContent(p: ContentPack): void {
  pack = p
}

export function C(): ContentPack {
  if (!pack) throw new Error('Contenido no registrado: llama a setContent()')
  return pack
}

export function cardDef(id: string): CardDef {
  const d = C().cards[id]
  if (!d) throw new Error(`Carta desconocida: ${id}`)
  return d
}

export function trofeoDef(id: string): TrofeoDef {
  const d = C().trofeos[id]
  if (!d) throw new Error(`Trofeo desconocido: ${id}`)
  return d
}

export function rivalDef(id: string): RivalDef {
  const d = C().rivals[id]
  if (!d) throw new Error(`Rival desconocido: ${id}`)
  return d
}

export function consumibleDef(id: string): ConsumibleDef {
  const d = C().consumibles[id]
  if (!d) throw new Error(`Consumible desconocido: ${id}`)
  return d
}

export function clubDef(id: ClubId): ClubDef {
  return C().clubs[id]
}
