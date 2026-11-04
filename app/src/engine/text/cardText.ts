import type { Ctx } from '../match/ctx'
import type { CardDef, CardInst, ClubRes, Cond, EffectOp, Keyword, StatusId, V } from '../model/types'
import { bloqueoValue, peligroValue } from '../match/modifiers'
import { cardDef, clubDef } from '../registry'

export const STATUS_NAME: Record<StatusId, string> = {
  confianza: 'Confianza',
  solidez: 'Solidez',
  fatiga: 'Fatiga',
  desorganizado: 'Desorganizado',
  desconcentrado: 'Desconcentrado',
  amarilla: 'Amarilla',
  expulsion: 'Expulsión',
  contragolpe: 'Contragolpe',
  reaccion: 'Reacción',
}

export const KEYWORD_NAME: Record<Keyword, string> = {
  agotar: 'Agotar',
  retener: 'Retener',
  inicial: 'Inicial',
  efimera: 'Efímera',
  injugable: 'Injugable',
  doblete: 'Doblete',
}

export const RES_NAME: Record<ClubRes, string> = { garra: 'Garra', posesion: 'Posesión', momentum: 'Momentum' }

export const TYPE_NAME = { ataque: 'Ataque', defensa: 'Defensa', tactica: 'Táctica', sistema: 'Sistema', estado: 'Estado' } as const

/** Marca de número: ⟦n|d⟧ donde d = + (mejorado), - (empeorado), = (igual). */
export function num(n: number, base: number): string {
  const d = n > base ? '+' : n < base ? '-' : '='
  return `⟦${n}|${d}⟧`
}

function plural(n: number, s: string, p: string): string {
  return n === 1 ? s : p
}

interface Live {
  ctx?: Ctx
  type?: CardDef['type']
}

function vText(v: V): string | null {
  if (typeof v === 'number') return String(v)
  return null
}

function peligroNum(live: Live, base: number): string {
  if (live.ctx && live.ctx.inMatch) return num(peligroValue(live.ctx, base, live.type), base)
  return num(base, base)
}

function bloqueoNum(live: Live, base: number): string {
  if (live.ctx && live.ctx.inMatch) return num(bloqueoValue(live.ctx, base, live.type), base)
  return num(base, base)
}

export function condText(c: Cond): string {
  switch (c.k) {
    case 'phase':
      return { primera: 'es la primera parte', segunda: 'es la segunda parte', tramoFinal: 'es el tramo final', prorroga: 'es la prórroga' }[c.is]
    case 'scoreDiff':
      if (c.op === '<' && c.n === 0) return 'vas perdiendo'
      if (c.op === '>' && c.n === 0) return 'vas ganando'
      if (c.op === '=' && c.n === 0) return 'vais empatados'
      return `la diferencia de goles es ${c.op} ${c.n}`
    case 'res':
      return c.op === '>=' ? `tienes ${c.n}+ de ${RES_NAME[c.res]}` : `tu ${RES_NAME[c.res]} es ${c.op} ${c.n}`
    case 'intentHas':
      return c.part === 'ocasion' ? 'el rival prepara una Ocasión' : c.part === 'ataque' ? 'el rival prepara un Ataque' : `el rival prepara ${c.part}`
    case 'lastPlayed':
      return `la carta anterior fue ${c.type === 'tactica' ? 'una Táctica' : c.type === 'ataque' ? 'un Ataque' : c.type === 'defensa' ? 'una Defensa' : 'un Sistema'}`
    case 'prevPlayed':
      return `la carta previa fue ${TYPE_NAME[c.type]}`
    case 'status':
      if (c.who === 'rival') return `el rival tiene ${STATUS_NAME[c.id]}`
      return `tienes ${STATUS_NAME[c.id]}`
    case 'block':
      return c.n <= 1 ? 'tienes Bloqueo' : `tienes ${c.n}+ de Bloqueo`
    case 'formaPct':
      return `tu Forma está al ${c.n}% o menos`
    case 'played':
      return `ya jugaste ${c.n}+ cartas${c.type ? ` de tipo ${TYPE_NAME[c.type]}` : ''} este turno`
    case 'handSize':
      return `tienes ${c.op} ${c.n} cartas en mano`
    case 'rivalSegmentPct':
      return `la Defensa rival está al ${c.n}% o menos`
    case 'firstTurn':
      return 'es el primer turno'
    case 'tier':
      return `es un partido de ${c.is}`
    case 'and':
      return c.c.map(condText).join(' y ')
    case 'or':
      return c.c.map(condText).join(' o ')
    case 'not':
      return `no ${condText(c.c)}`
  }
}

function opText(op: EffectOp, live: Live): string {
  switch (op.op) {
    case 'peligro': {
      const n = vText(op.n)
      const hits = op.hits !== undefined ? vText(op.hits) : '1'
      const val = n !== null ? peligroNum(live, Number(n)) : 'X'
      if (hits && hits !== '1') return `Genera ${val} de Peligro ${hits} veces.`
      return `Genera ${val} de Peligro.`
    }
    case 'bloqueo': {
      const n = vText(op.n)
      return `Gana ${n !== null ? bloqueoNum(live, Number(n)) : 'X'} de Bloqueo.`
    }
    case 'draw': {
      const n = Number(vText(op.n) ?? 1)
      return `Roba ${n} ${plural(n, 'carta', 'cartas')}.`
    }
    case 'energy': {
      const n = Number(vText(op.n) ?? 1)
      return n >= 0 ? `Gana ${n} de Energía.` : `Pierde ${-n} de Energía.`
    }
    case 'status': {
      const n = vText(op.n) ?? 'X'
      const nm = STATUS_NAME[op.id]
      if (op.who === 'rival') {
        if (op.id === 'amarilla') return `El rival ve ${n === '1' ? 'una amarilla' : `${n} amarillas`}.`
        if (op.id === 'fatiga' || op.id === 'desorganizado' || op.id === 'desconcentrado') return `El rival queda ${nm === 'Fatiga' ? 'con Fatiga' : nm} ${n}.`
        return `El rival gana ${n} de ${nm}.`
      }
      if (op.id === 'amarilla') return `Ves ${n === '1' ? 'una amarilla' : `${n} amarillas`}.`
      if (op.id === 'contragolpe') return 'Ganas Contragolpe.'
      return `Gana ${n} de ${nm}.`
    }
    case 'res': {
      const n = vText(op.n)
      return n !== null ? (Number(n) >= 0 ? `Gana ${n} de ${RES_NAME[op.res]}.` : `Pierde ${-Number(n)} de ${RES_NAME[op.res]}.`) : `Gana ${RES_NAME[op.res]}.`
    }
    case 'spendRes':
      return `Gasta ${op.max === 'all' ? 'toda tu' : `hasta ${op.max} de`} ${RES_NAME[op.res]}: ${opsText(op.then, live)}`
    case 'pick': {
      const n = op.min === op.max ? `${op.max}` : op.min === 0 ? `hasta ${op.max}` : `${op.min}-${op.max}`
      const from = op.from === 'hand' ? 'de tu mano' : op.from === 'discard' ? 'de tu descarte' : 'de tu mazo'
      const card = plural(op.max, 'carta', 'cartas')
      const act = {
        exhaust: `Agota ${n} ${card} ${from}.`,
        discard: `Descarta ${n} ${card}.`,
        toHand: `Pon ${n} ${card} ${from} en tu mano.`,
        toDrawTop: `Coloca ${n} ${card} ${from} encima del mazo.`,
        upgradeTmp: `Mejora ${n} ${card} ${from} durante el partido.`,
        freeTurn: `Elige ${n} ${card} ${from}: cuesta 0 este turno.`,
        retain: `Retén ${n} ${card} ${from}.`,
      }[op.act]
      return act + (op.then ? ' ' + opsText(op.then, live) : '')
    }
    case 'addCard': {
      const n = Number(vText(op.n) ?? 1)
      const where = op.to === 'hand' ? 'a tu mano' : op.to === 'draw' ? 'a tu mazo' : 'a tu descarte'
      return `Añade ${n} ${plural(n, 'copia', 'copias')} de ${cardDef(op.def).name} ${where}.`
    }
    case 'freeNext':
      return op.type ? `${op.type === 'ataque' ? 'Tu próximo Ataque' : op.type === 'defensa' ? 'Tu próxima Defensa' : 'Tu próxima Táctica'} este turno cuesta 0.` : 'La próxima carta que juegues este turno cuesta 0.'
    case 'handCost':
      return `Las cartas de tu mano cuestan ${-op.delta} menos este turno.`
    case 'playTwice':
      return `Tu próximo ${TYPE_NAME[op.type]} este turno se juega dos veces.`
    case 'cancelOcasion':
      return 'Anula la Ocasión rival de este turno.'
    case 'reduceOcasion':
      return `La Ocasión rival tiene −${vText(op.n)} este turno.`
    case 'reduceAtaque':
      return `El Ataque rival tiene −${vText(op.n)} este turno.`
    case 'clock':
      return `Añade ${op.n} turno al reloj (máx. 2 por partido).`
    case 'repliegueRemove':
      return op.n === 'all' ? 'Elimina todo el Repliegue rival.' : `Elimina hasta ${vText(op.n)} de Repliegue rival.`
    case 'heal':
      return `Recupera ${vText(op.n)} de Forma.`
    case 'loseForma':
      return `Pierdes ${vText(op.n)} de Forma.`
    case 'gold':
      return `Gana ${vText(op.n)} de oro.`
    case 'cambios':
      return `+${vText(op.n)} ${plural(Number(vText(op.n)), 'Cambio', 'Cambios')}.`
    case 'retainBlock':
      return 'Conservas Bloqueo entre turnos.'
    case 'exhaustSelf':
      return 'Agota esta carta.'
    case 'if': {
      const t = `Si ${condText(op.c)}, ${lowerFirst(opsText(op.then, live))}`
      return op.else ? `${t} Si no, ${lowerFirst(opsText(op.else, live))}` : t
    }
    case 'repeat':
      return `Repite ${vText(op.n)} veces: ${opsText(op.ops, live)}`
    case 'choose':
      return `Elige: ${op.options.map(o => o.label).join(' / ')}.`
    case 'custom':
      return ''
    case '_finishPlay':
      return ''
  }
}

function lowerFirst(s: string): string {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s
}

export function opsText(ops: EffectOp[], live: Live): string {
  return ops.map(o => opText(o, live)).filter(Boolean).join(' ')
}

/** Lista de valores base de Peligro/Bloqueo en orden de placeholder ({P}, {P2}...). El "si no" va antes que el "si". */
function collect(ops: EffectOp[], kind: 'peligro' | 'bloqueo', out: number[]): number[] {
  for (const op of ops) {
    if (op.op === kind && typeof op.n === 'number') out.push(op.n)
    if (op.op === 'if') {
      if (op.else) collect(op.else, kind, out)
      collect(op.then, kind, out)
    }
    if (op.op === 'spendRes') collect(op.then, kind, out)
    if (op.op === 'repeat') collect(op.ops, kind, out)
  }
  return out
}

export function cardText(def: CardDef, up: boolean, ctx?: Ctx): string {
  const live: Live = { ctx, type: def.type }
  const ops = up && def.up.ops ? def.up.ops : def.ops
  const kw = (up && def.up.kw ? def.up.kw : def.kw) ?? []
  const tpl = up && def.upText ? def.upText : def.text
  const kwShown = kw.filter(k => k !== 'injugable' || def.type === 'estado')
  if (tpl) {
    const ps = collect(ops, 'peligro', [])
    const bs = collect(ops, 'bloqueo', [])
    const missing = kwShown.filter(k => !tpl.includes(KEYWORD_NAME[k]))
    const prefix = missing.length ? missing.map(k => KEYWORD_NAME[k]).join('. ') + '. ' : ''
    return prefix + tpl
      .replace(/\{P(\d?)\}/g, (_, i) => {
        const v = ps[i ? Number(i) - 1 : 0]
        return v === undefined ? '?' : peligroNum(live, v)
      })
      .replace(/\{B(\d?)\}/g, (_, i) => {
        const v = bs[i ? Number(i) - 1 : 0]
        return v === undefined ? '?' : bloqueoNum(live, v)
      })
  }
  const parts: string[] = []
  if (kwShown.length) parts.push(kwShown.map(k => KEYWORD_NAME[k]).join('. ') + '.')
  const body = opsText(ops, live)
  if (body) parts.push(body)
  return parts.join(' ')
}

/** Texto plano sin marcas de número (para logs y tests). */
export function plainText(s: string): string {
  return s.replace(/⟦(-?\d+)\|[+=-]⟧/g, '$1')
}

export function instText(inst: CardInst, def: CardDef, ctx?: Ctx): string {
  return cardText(def, inst.up || !!inst.tmpUp, ctx)
}

export function resName(club: Parameters<typeof clubDef>[0]): string {
  return clubDef(club).resName
}
