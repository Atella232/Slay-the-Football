import { useState } from 'react'
import type { CardClub } from '../../engine/model/types'
import { C, clubDef, trofeoDef } from '../../engine/registry'
import { cardText } from '../../engine/text/cardText'
import { ACHIEVEMENTS } from '../../engine/meta/achievements'
import { dailyConfig, todayUtc } from '../../engine/meta/daily'
import { CardView, ownColor } from '../components/Card'
import { Icon } from '../art/icons'
import { Crest } from '../art/team'
import { useGame } from '../store/game'

type Tab = 'cartas' | 'trofeos' | 'rivales' | 'logros'

export function Album() {
  const profile = useGame(s => s.profile)
  const setHome = useGame(s => s.setHome)
  const setOverlay = useGame(s => s.setOverlay)
  const [tab, setTab] = useState<Tab>('cartas')
  const [club, setClub] = useState<CardClub>('athletic')
  const c = C()
  const cards = Object.values(c.cards).filter(d => d.club === club && d.type !== 'estado')
  const seenCards = new Set(profile.seenCards)
  const allCards = Object.values(c.cards).filter(d => d.type !== 'estado')
  const pct = (a: number, b: number) => Math.round((a / Math.max(1, b)) * 100)
  const trofeos = Object.values(c.trofeos).filter(t => t.tier !== 'especial')
  const rivals = Object.values(c.rivals)
  const tabs: [Tab, string, string][] = [
    ['cartas', 'Cromos', `${pct(allCards.filter(d => seenCards.has(d.id)).length, allCards.length)}%`],
    ['trofeos', 'Trofeos', `${pct(trofeos.filter(t => profile.seenTrofeos.includes(t.id)).length, trofeos.length)}%`],
    ['rivales', 'Rivales', `${pct(rivals.filter(r => profile.seenRivals.includes(r.id)).length, rivals.length)}%`],
    ['logros', 'Logros', `${profile.achievements.length}/${ACHIEVEMENTS.length}`],
  ]
  return (
    <div className="home">
      <div className="chalkboard" />
      <div className="scene" style={{ inset: 0, gap: 12, paddingTop: 16 }}>
        <div className="row" style={{ width: '100%' }}>
          <button className="btn" onClick={() => setHome('title')}>← Volver</button>
          <div className="scene-title" style={{ flex: 1, fontSize: 40 }}>Álbum de la temporada</div>
          <div style={{ width: 110 }} />
        </div>
        <div className="row">
          {tabs.map(([k, label, prog]) => (
            <button key={k} className={`btn ${tab === k ? 'primary' : ''}`} onClick={() => setTab(k)}>
              {label} <span style={{ opacity: 0.7 }}>{prog}</span>
            </button>
          ))}
        </div>
        {tab === 'cartas' && (
          <>
            <div className="row">
              {(['athletic', 'barcelona', 'madrid', 'neutral'] as CardClub[]).map(k => (
                <button key={k} className={`btn small ${club === k ? 'primary' : ''}`} onClick={() => setClub(k)}>
                  {k === 'neutral' ? 'Neutrales' : clubDef(k).short}
                </button>
              ))}
            </div>
            <div className="card-grid" style={{ width: '100%', maxHeight: 470 }}>
              {cards.map(d =>
                seenCards.has(d.id) ? (
                  <CardView key={d.id} def={d} up={false} text={cardText(d, false)} cost={d.cost} own={ownColor(d.club, 'athletic')} onClick={() => setOverlay({ k: 'inspect', def: d.id, up: false })} />
                ) : (
                  <div key={d.id} className="card" style={{ display: 'grid', placeItems: 'center', cursor: 'default', background: 'rgba(255,255,255,.06)' }} aria-label="Cromo sin descubrir">
                    <div className="col" style={{ alignItems: 'center', color: 'var(--chalk-3)' }}>
                      <Icon name="evento" size={42} />
                      <span className="display" style={{ fontSize: 14 }}>{d.unlock ? `Nivel ${d.unlock}` : 'Sin descubrir'}</span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
        {tab === 'trofeos' && (
          <div className="row" style={{ flexWrap: 'wrap', gap: 10, overflowY: 'auto', maxHeight: 520, justifyContent: 'center', touchAction: 'pan-y' }}>
            {trofeos.map(t => {
              const seen = profile.seenTrofeos.includes(t.id)
              const d = trofeoDef(t.id)
              return (
                <div key={t.id} className="reward-item" style={{ width: 290, cursor: 'default', opacity: seen ? 1 : 0.4 }}>
                  <span className="ic"><Icon name={seen ? d.icon : 'evento'} size={22} /></span>
                  <span>
                    {seen ? d.name : '???'}
                    <small>{seen ? d.text : `Trofeo ${d.tier === 'jefe' ? 'de campeón' : d.tier}`}</small>
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {tab === 'rivales' && (
          <div className="row" style={{ flexWrap: 'wrap', gap: 10, overflowY: 'auto', maxHeight: 520, justifyContent: 'center', touchAction: 'pan-y' }}>
            {rivals.map(r => {
              const seen = profile.seenRivals.includes(r.id)
              return (
                <div key={r.id} className="reward-item" style={{ width: 380, cursor: 'default', opacity: seen ? 1 : 0.4 }}>
                  {seen ? <Crest spec={r.kit} club={r.crest} short={r.crest ? undefined : r.short} size={42} /> : <Icon name="escudo" size={36} />}
                  <span>
                    {seen ? r.name : '???'} <span className="muted">· Acto {r.act} · {r.tier === 'liga' ? 'Liga' : r.tier === 'copa' ? 'Copa' : 'Final'}</span>
                    <small>{seen ? `${r.trait.name}: ${r.trait.text}` : 'Aún no te has enfrentado a este equipo.'}</small>
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {tab === 'logros' && (
          <div className="row" style={{ flexWrap: 'wrap', gap: 10, overflowY: 'auto', maxHeight: 520, justifyContent: 'center', touchAction: 'pan-y' }}>
            {ACHIEVEMENTS.map(a => {
              const got = profile.achievements.includes(a.id)
              return (
                <div key={a.id} className="reward-item" style={{ width: 380, cursor: 'default', opacity: got ? 1 : 0.45 }}>
                  <span className="ic" style={{ color: got ? 'var(--gold)' : 'var(--chalk-3)' }}><Icon name={got ? 'medalla' : 'candado'} size={22} /></span>
                  <span>
                    {a.name}
                    <small>{a.text}</small>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function Daily() {
  const profile = useGame(s => s.profile)
  const setHome = useGame(s => s.setHome)
  const startRun = useGame(s => s.startRun)
  const date = todayUtc(new Date())
  const cfg = dailyConfig(date)
  const club = clubDef(cfg.club)
  const best = profile.daily[date]
  const recent = Object.entries(profile.daily).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6)
  return (
    <div className="home">
      <div className="chalkboard" />
      <div className="scene" style={{ inset: 0, justifyContent: 'center' }}>
        <div className="scene-title">Reto diario · {new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>
        <div className="scene-sub">La misma temporada para todo el mundo durante el día de hoy: mismo club, misma semilla y dos condiciones especiales. Todas las cartas del club están disponibles.</div>
        <div className="row" style={{ gap: 30, alignItems: 'flex-start' }}>
          <div className="box" style={{ width: 360 }}>
            <h4>Club del día</h4>
            <div className="row">
              <Crest club={cfg.club} size={64} />
              <div className="display" style={{ fontSize: 26 }}>{club.name}</div>
            </div>
          </div>
          <div className="box" style={{ width: 420 }}>
            <h4>Condiciones</h4>
            <div className="col">
              {cfg.mods.map(id => {
                const d = trofeoDef(id)
                return (
                  <div key={id} className="row" style={{ alignItems: 'flex-start' }}>
                    <span className="ic" style={{ color: 'var(--purple)' }}><Icon name={d.icon} size={22} /></span>
                    <span style={{ fontSize: 18 }}>
                      <b>{d.name}.</b> {d.text.replace('Reto diario: ', '')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 19 }}>{best !== undefined ? `Tu mejor puntuación hoy: ${best}` : 'Aún no lo has jugado hoy.'}</div>
        {recent.length > 0 && (
          <div className="muted" style={{ fontSize: 16 }}>
            Últimos retos: {recent.map(([d, sc]) => `${d.slice(5)}: ${sc}`).join(' · ')}
          </div>
        )}
        <div className="row">
          <button className="btn" onClick={() => setHome('title')}>← Volver</button>
          <button className="btn primary big" onClick={() => startRun(cfg.club, 0, { seed: cfg.seed, daily: true, mods: cfg.mods })}>Jugar el reto</button>
        </div>
      </div>
    </div>
  )
}
