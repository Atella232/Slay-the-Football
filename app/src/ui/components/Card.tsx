import { memo, type CSSProperties, type PointerEventHandler } from 'react'
import type { CardDef } from '../../engine/model/types'
import { Diagram } from '../art/Diagram'
import { RichText } from './RichText'
import { TYPE_NAME } from '../../engine/text/cardText'
import { clubDef } from '../../engine/registry'

export const TYPE_COLOR: Record<CardDef['type'], string> = {
  ataque: '#e8553d',
  defensa: '#3d8de8',
  tactica: '#e0ad2e',
  sistema: '#9b6be8',
  estado: '#6f7570',
}

const RARITY_LABEL: Record<CardDef['rarity'], string> = {
  inicial: 'Inicial',
  comun: 'Común',
  poco: 'Poco común',
  rara: 'Rara',
  leyenda: 'Leyenda',
  especial: 'Especial',
}

export interface CardViewProps {
  def: CardDef
  up: boolean
  text: string
  cost: number | 'X'
  baseCost?: number | 'X'
  playable?: boolean
  selected?: boolean
  dim?: boolean
  own: string
  className?: string
  style?: CSSProperties
  onClick?: () => void
  onPointerDown?: PointerEventHandler<HTMLDivElement>
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  tabIndex?: number
}

export const CardView = memo(function CardView(p: CardViewProps) {
  const d = p.def
  const color = TYPE_COLOR[d.type]
  const club = d.club === 'neutral' ? 'Neutral' : clubDef(d.club).short
  const costDiff = typeof p.cost === 'number' && typeof p.baseCost === 'number' ? p.cost - p.baseCost : 0
  const name = (p.up && d.up.name) || d.name
  return (
    <div
      className={[
        'card',
        `t-${d.type}`,
        `r-${d.rarity}`,
        p.up ? 'is-up' : '',
        p.playable ? 'is-playable' : '',
        p.selected ? 'is-selected' : '',
        p.dim ? 'is-dim' : '',
        p.className ?? '',
      ].join(' ')}
      style={{ ...p.style, ['--tc' as string]: color }}
      onClick={p.onClick}
      onPointerDown={p.onPointerDown}
      onPointerEnter={p.onPointerEnter}
      onPointerLeave={p.onPointerLeave}
      onContextMenu={p.onContextMenu}
      role="button"
      tabIndex={p.tabIndex}
      aria-label={`${name}${p.up ? ' mejorada' : ''}, coste ${p.cost}. ${p.text.replace(/⟦(-?\d+)\|[+=-]⟧/g, '$1')}`}
    >
      <div className="card-inner">
        <div className="card-head">
          <span className="card-name">
            {name}
            {p.up ? '+' : ''}
          </span>
        </div>
        {d.type !== 'estado' || d.cost !== 0 ? (
          <div className={`card-cost ${costDiff < 0 ? 'cheaper' : costDiff > 0 ? 'pricier' : ''}`}>{p.cost}</div>
        ) : null}
        <div className="card-art">
          <Diagram tpl={d.art.tpl} seed={d.id} own={p.own} />
          {d.legend && (
            <div className="card-legend">
              <span className="dorsal">{d.legend.dorsal}</span>
              <span className="player">{d.legend.player}</span>
            </div>
          )}
        </div>
        <div className="card-type">
          <span>{TYPE_NAME[d.type]}</span>
          <span className="sep">·</span>
          <span>{club}</span>
          <span className={`rar rar-${d.rarity}`}>{RARITY_LABEL[d.rarity]}</span>
        </div>
        <div className="card-text">
          <p>
            <RichText text={p.text} />
          </p>
        </div>
      </div>
    </div>
  )
})

export function ownColor(club: CardDef['club'], runClub: string): string {
  const id = club === 'neutral' ? runClub : club
  const c = clubDef(id as never)
  // Madrid usa blanco: lo oscurecemos ligeramente para que se vea sobre la pizarra
  return c.colors.primary.toLowerCase() === '#f4f4f4' ? '#e9e6da' : c.colors.primary
}
