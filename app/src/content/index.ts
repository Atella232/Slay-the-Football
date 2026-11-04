import type { CardDef, ContentPackLike } from './types'
import type { ClubDef, ClubId } from '../engine/model/types'
import type { ContentPack } from '../engine/registry'
import { setContent } from '../engine/registry'
import { NEUTRAL_CARDS, ESTADOS } from './neutral/cards'
import { ATHLETIC } from './clubs/athletic/club'
import { ATHLETIC_CARDS } from './clubs/athletic/cards'
import { ATHLETIC_TROFEOS } from './clubs/athletic/trofeos'
import { BARCELONA } from './clubs/barcelona/club'
import { BARCELONA_CARDS } from './clubs/barcelona/cards'
import { BARCELONA_TROFEOS } from './clubs/barcelona/trofeos'
import { MADRID } from './clubs/madrid/club'
import { MADRID_CARDS } from './clubs/madrid/cards'
import { MADRID_TROFEOS } from './clubs/madrid/trofeos'
import { NEUTRAL_TROFEOS } from './trofeos'
import { DAILY_MODS } from './trofeos/daily'
import { CONSUMIBLES } from './consumibles'
import { CHARLAS } from './charlas'
import { HANDLERS } from './handlers'
import { EVENTS } from './events'
import { EXIGENCIA } from './exigencia'
import { ACT1_RIVALS } from './rivals/act1'
import { ACT2_RIVALS } from './rivals/act2'
import { ACT3_RIVALS } from './rivals/act3'

export const CONTENT_VERSION = '1.0.0'

function byId<T extends { id: string }>(list: T[], kind: string): Record<string, T> {
  const out: Record<string, T> = {}
  for (const x of list) {
    if (out[x.id]) throw new Error(`${kind} duplicado: ${x.id}`)
    out[x.id] = x
  }
  return out
}

export function buildContent(): ContentPack {
  const clubs: Record<ClubId, ClubDef> = { athletic: ATHLETIC, barcelona: BARCELONA, madrid: MADRID }
  const cards: CardDef[] = [...NEUTRAL_CARDS, ...ESTADOS, ...ATHLETIC_CARDS, ...BARCELONA_CARDS, ...MADRID_CARDS]
  return {
    version: CONTENT_VERSION,
    clubs,
    cards: byId(cards, 'Carta'),
    trofeos: byId([...ATHLETIC_TROFEOS, ...BARCELONA_TROFEOS, ...MADRID_TROFEOS, ...NEUTRAL_TROFEOS, ...DAILY_MODS], 'Trofeo'),
    consumibles: byId(CONSUMIBLES, 'Consumible'),
    rivals: byId([...ACT1_RIVALS, ...ACT2_RIVALS, ...ACT3_RIVALS], 'Rival'),
    events: byId(EVENTS, 'Evento'),
    charlas: byId(CHARLAS, 'Charla'),
    exigencia: EXIGENCIA,
    handlers: HANDLERS,
  }
}

let installed = false
export function installContent(): ContentPack {
  const pack = buildContent()
  setContent(pack)
  installed = true
  return pack
}

export function isInstalled(): boolean {
  return installed
}

export type { ContentPackLike }
