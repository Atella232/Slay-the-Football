import { useEffect } from 'react'
import { cardDef } from '../../engine/registry'
import { cardText } from '../../engine/text/cardText'
import { Ctx } from '../../engine/match/ctx'
import { CardView, ownColor } from './Card'
import { useGame } from '../store/game'
import { Icon } from '../art/icons'
import { KEYWORD_HELP } from '../glossary'
import type { Keyword } from '../../engine/model/types'

export function Overlays() {
  const overlay = useGame(s => s.overlay)
  const setOverlay = useGame(s => s.setOverlay)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const o = useGame.getState().overlay
        if (o) setOverlay(null)
        else if (useGame.getState().run) setOverlay({ k: 'pause' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOverlay])
  if (!overlay) return null
  switch (overlay.k) {
    case 'deck':
      return <DeckOverlay />
    case 'pile':
      return <PileOverlay pile={overlay.pile} />
    case 'settings':
      return <SettingsOverlay />
    case 'pause':
      return <PauseOverlay />
    case 'inspect':
      return <InspectOverlay def={overlay.def} up={overlay.up} />
    case 'confirm':
      return <ConfirmOverlay text={overlay.text} yes={overlay.yes} />
  }
}

function Modal({ title, children, width = 1060 }: { title: string; children: React.ReactNode; width?: number }) {
  const setOverlay = useGame(s => s.setOverlay)
  return (
    <div className="modal-back" onClick={() => setOverlay(null)}>
      <div className="modal" style={{ width }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <button className="icon-btn close" onClick={() => setOverlay(null)} aria-label="Cerrar">
          <Icon name="cerrar" />
        </button>
        {children}
      </div>
    </div>
  )
}

function DeckOverlay() {
  const run = useGame(s => s.view)
  if (!run) return null
  const sorted = run.deck.slice().sort((a, b) => {
    const da = cardDef(a.def)
    const db = cardDef(b.def)
    return da.type.localeCompare(db.type) || da.name.localeCompare(db.name)
  })
  return (
    <Modal title={`Tu mazo · ${run.deck.length} cartas`}>
      <div className="card-grid">
        {sorted.map(c => {
          const d = cardDef(c.def)
          return <CardView key={c.uid} def={d} up={c.up} text={cardText(d, c.up)} cost={c.up && d.up.cost !== undefined ? d.up.cost : d.cost} own={ownColor(d.club, run.club)} />
        })}
      </div>
    </Modal>
  )
}

const PILE_NAME = { draw: 'Mazo de robo (orden oculto)', discard: 'Descarte', agotadas: 'Agotadas', sistemas: 'Sistemas en juego' }

function PileOverlay({ pile }: { pile: 'draw' | 'discard' | 'agotadas' | 'sistemas' }) {
  const run = useGame(s => s.view)
  if (!run || run.screen.k !== 'match') return null
  const m = run.screen.m
  let uids = m.piles[pile].slice()
  if (pile === 'draw') uids.sort((a, b) => cardDef(m.cards[a].def).name.localeCompare(cardDef(m.cards[b].def).name))
  else uids = uids.reverse()
  const ctx = new Ctx(run)
  return (
    <Modal title={`${PILE_NAME[pile]} · ${uids.length}`}>
      <div className="card-grid">
        {uids.length === 0 && <div className="muted" style={{ fontSize: 20 }}>Vacío</div>}
        {uids.map(uid => {
          const c = m.cards[uid]
          const d = cardDef(c.def)
          return <CardView key={uid} def={d} up={c.up} text={cardText(d, c.up, ctx)} cost={c.up && d.up.cost !== undefined ? d.up.cost : d.cost} own={ownColor(d.club, run.club)} />
        })}
      </div>
    </Modal>
  )
}

function SettingsOverlay() {
  const s = useGame(st => st.settings)
  const update = useGame(st => st.updateSettings)
  const vol = (k: 'master' | 'sfx' | 'crowd' | 'music', label: string) => (
    <label className="row" style={{ justifyContent: 'space-between', fontSize: 19 }}>
      {label}
      <input className="slider" type="range" min={0} max={1} step={0.05} value={s[k]} onChange={e => update({ [k]: Number(e.target.value) })} />
    </label>
  )
  const toggle = (k: 'reducedMotion' | 'confirmEndTurn' | 'largeText', label: string) => (
    <label className="row" style={{ justifyContent: 'space-between', fontSize: 19, cursor: 'pointer' }}>
      {label}
      <input type="checkbox" checked={s[k]} onChange={e => update({ [k]: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--gold)' }} />
    </label>
  )
  return (
    <Modal title="Ajustes" width={560}>
      <div className="col">
        {vol('master', 'Volumen general')}
        {vol('sfx', 'Efectos')}
        {vol('crowd', 'Afición')}
        {vol('music', 'Música')}
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 19 }}>
          Velocidad de animación
          <div className="row" style={{ gap: 6 }}>
            {([1, 1.5, 2, 99] as const).map(v => (
              <button key={v} className={`btn small ${s.speed === v ? 'primary' : ''}`} onClick={() => update({ speed: v })}>
                {v === 99 ? 'Instant.' : `${v}×`}
              </button>
            ))}
          </div>
        </div>
        {toggle('reducedMotion', 'Reducir movimiento')}
        {toggle('largeText', 'Texto de cartas grande')}
        {toggle('confirmEndTurn', 'Avisar si terminas el turno sin parar una Ocasión')}
      </div>
    </Modal>
  )
}

function PauseOverlay() {
  const setOverlay = useGame(s => s.setOverlay)
  const toTitle = useGame(s => s.toTitle)
  const run = useGame(s => s.run)
  return (
    <Modal title="Pausa" width={460}>
      <div className="col">
        <button className="btn big primary" onClick={() => setOverlay(null)}>Seguir jugando</button>
        <button className="btn" onClick={() => setOverlay({ k: 'settings' })}>Ajustes</button>
        <button className="btn" onClick={() => setOverlay({ k: 'deck' })}>Ver mazo</button>
        <div className="muted" style={{ fontSize: 16 }}>La partida se guarda automáticamente después de cada acción.</div>
        <button className="btn" onClick={toTitle}>Guardar y salir al menú</button>
        {run && run.screen.k !== 'ended' && (
          <button
            className="btn danger"
            onClick={() => setOverlay({ k: 'confirm', text: '¿Abandonar la temporada? Se registrará en el historial y no podrás continuarla.', yes: { t: 'abandon' } })}
          >
            Abandonar temporada
          </button>
        )}
        <div className="muted" style={{ fontSize: 15 }}>
          Atajos: 1-0 elegir carta · Enter jugar · E fin de turno · S cambio · A/D/X pilas · Esc pausa
        </div>
        {run && <div className="muted" style={{ fontSize: 14 }}>Semilla: {run.seed}</div>}
      </div>
    </Modal>
  )
}

function InspectOverlay({ def, up }: { def: string; up: boolean }) {
  const run = useGame(s => s.view)
  const d = cardDef(def)
  const kws = ((up && d.up.kw ? d.up.kw : d.kw) ?? []) as Keyword[]
  const ctx = run && run.screen.k === 'match' ? new Ctx(run) : undefined
  return (
    <Modal title={d.name} width={720}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 30 }}>
        <div style={{ transform: 'scale(1.5)', transformOrigin: 'top left', width: 252, height: 354 }}>
          <CardView def={d} up={up} text={cardText(d, up, ctx)} cost={up && d.up.cost !== undefined ? d.up.cost : d.cost} own={ownColor(d.club, run?.club ?? 'athletic')} />
        </div>
        <div className="col" style={{ fontSize: 18 }}>
          {d.flavor && <i className="muted">«{d.flavor}»</i>}
          {kws.map(k => (
            <div key={k}>
              <b style={{ color: 'var(--gold-2)' }}>{k[0].toUpperCase() + k.slice(1)}:</b> {KEYWORD_HELP[k]}
            </div>
          ))}
          {!up && Object.keys(d.up).length > 0 && (
            <div>
              <b style={{ color: 'var(--good)' }}>Mejorada:</b> {cardText(d, true).replace(/⟦(-?\d+)\|[+=-]⟧/g, '$1')}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ConfirmOverlay({ text, yes }: { text: string; yes: import('../../engine/model/types').Action }) {
  const setOverlay = useGame(s => s.setOverlay)
  const act = useGame(s => s.act)
  return (
    <Modal title="¿Seguro?" width={520}>
      <p style={{ fontSize: 20, margin: 0 }}>{text}</p>
      <div className="row center">
        <button className="btn" onClick={() => setOverlay(null)} autoFocus>
          Cancelar
        </button>
        <button
          className="btn primary"
          onClick={() => {
            setOverlay(null)
            act(yes)
          }}
        >
          Sí
        </button>
      </div>
    </Modal>
  )
}
