import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { ClubId } from '../../engine/model/types'
import { C, clubDef, trofeoDef } from '../../engine/registry'
import { clubLevel, xpToNext } from '../../engine/meta/profile'
import { useGame, hasSavedRun } from '../store/game'
import { Crest } from '../art/team'
import { Icon } from '../art/icons'
import { Diagram } from '../art/Diagram'
import { audio } from '../../platform/audio'
import { Album, Daily } from './Album'

export function Home() {
  const home = useGame(s => s.home)
  if (home === 'clubs') return <ClubSelect />
  if (home === 'history') return <History />
  if (home === 'credits') return <Credits />
  if (home === 'album') return <Album />
  if (home === 'daily') return <Daily />
  return <Title />
}

function Title() {
  const setHome = useGame(s => s.setHome)
  const continueRun = useGame(s => s.continueRun)
  const setOverlay = useGame(s => s.setOverlay)
  const [saved] = useState(hasSavedRun())
  useEffect(() => {
    audio.setMusic('menu')
  }, [])
  return (
    <div className="home">
      <div className="chalkboard" />
      <div style={{ position: 'absolute', inset: '8% 6%', opacity: 0.16 }}>
        <Diagram tpl="tiki" seed="title" own="#d4202c" />
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <motion.div className="title-logo" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          Slay the
          <br />
          <em>Football</em>
        </motion.div>
        <div className="title-sub">De Segunda a campeón de Europa. Una temporada, un mazo.</div>
        <div className="menu">
          {saved && (
            <button className="btn primary big" onClick={() => { audio.play('click'); continueRun() }}>
              <Icon name="play" /> Continuar temporada
            </button>
          )}
          <button className={`btn big ${saved ? '' : 'primary'}`} onClick={() => { audio.play('click'); setHome('clubs') }}>
            Nueva temporada
          </button>
          <button className="btn" onClick={() => setHome('daily')}>
            <Icon name="reloj" size={18} /> Reto diario
          </button>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setHome('album')}>
              Álbum
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setHome('history')}>
              Historial
            </button>
          </div>
          <button className="btn" onClick={() => setOverlay({ k: 'settings' })}>
            <Icon name="ajustes" size={18} /> Ajustes
          </button>
          <button className="btn small" onClick={() => setHome('credits')}>
            Créditos
          </button>
        </div>
      </div>
    </div>
  )
}

function ClubSelect() {
  const profile = useGame(s => s.profile)
  const startRun = useGame(s => s.startRun)
  const setHome = useGame(s => s.setHome)
  const clubs: ClubId[] = ['athletic', 'barcelona', 'madrid']
  const [sel, setSel] = useState<ClubId>('athletic')
  const [exigRaw, setExig] = useState(0)
  const maxExig = profile.exigMax[sel] ?? 0
  const exig = Math.min(exigRaw, maxExig)
  const locked = (c: ClubId) => !profile.unlocked.includes(c)
  const levels = C().exigencia
  return (
    <div className="home">
      <div className="chalkboard" />
      <div className="scene" style={{ inset: 0, gap: 16 }}>
        <div className="row" style={{ width: '100%' }}>
          <button className="btn" onClick={() => setHome('title')}>
            ← Volver
          </button>
          <div className="scene-title" style={{ flex: 1 }}>
            Elige tu club
          </div>
          <div style={{ width: 110 }} />
        </div>
        <div className="club-cards">
          {clubs.map(id => {
            const c = clubDef(id)
            const lk = locked(id)
            const t = trofeoDef(c.starterTrofeo)
            const xp = xpToNext(profile.clubXp[id])
            return (
              <button key={id} className={`club-card ${sel === id ? 'sel' : ''} ${lk ? 'locked' : ''}`} style={{ ['--cc' as string]: c.colors.primary }} onClick={() => !lk && setSel(id)} aria-pressed={sel === id} disabled={lk}>
                <div className="row">
                  <Crest club={id} size={72} />
                  <div>
                    <h3>{c.name}</h3>
                    <div className="motto">{c.motto}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="tag"><Icon name="forma" size={14} /> {c.forma} Forma</span>
                  <span className="tag"><Icon name={c.res} size={14} /> {c.resName}</span>
                  <span className="tag">Nivel {clubLevel(profile.clubXp[id])}{xp.need ? ` · ${xp.into}/${xp.need}` : ''}</span>
                </div>
                <p>
                  <b style={{ color: 'var(--gold-2)' }}>{c.passive.name}.</b> {c.passive.text}
                </p>
                <p>
                  <b style={{ color: 'var(--gold-2)' }}>{t.name}.</b> {t.text}
                </p>
                {lk && <div className="lock-msg"><Icon name="candado" size={16} /> {c.unlock}</div>}
              </button>
            )
          })}
        </div>
        <div className="box exig" style={{ width: 760 }}>
          <span className="display">Exigencia</span>
          <input className="slider" type="range" min={0} max={maxExig} value={exig} onChange={e => setExig(Number(e.target.value))} disabled={maxExig === 0} aria-label="Nivel de exigencia" />
          <span className="display" style={{ fontSize: 24, width: 30 }}>{exig}</span>
          <span className="muted" style={{ flex: 1 }}>{exig === 0 ? (maxExig === 0 ? 'Gana una temporada para desbloquear niveles de Exigencia.' : levels[0].text) : levels.filter(l => l.level > 0 && l.level <= exig).slice(-1)[0]?.text}</span>
        </div>
        <button className="btn primary big" onClick={() => startRun(sel, exig)}>
          Empezar temporada
        </button>
      </div>
    </div>
  )
}

const OUT_LABEL: Record<string, string> = { campeon: 'Campeón', eliminado: 'Eliminado', lesionado: 'Sin Forma', destituido: 'Destituido', abandono: 'Abandonada' }

function History() {
  const profile = useGame(s => s.profile)
  const setHome = useGame(s => s.setHome)
  return (
    <div className="home">
      <div className="chalkboard" />
      <div className="scene" style={{ inset: 0 }}>
        <div className="row" style={{ width: '100%' }}>
          <button className="btn" onClick={() => setHome('title')}>← Volver</button>
          <div className="scene-title" style={{ flex: 1 }}>Historial</div>
          <div style={{ width: 110 }} />
        </div>
        <div className="row muted" style={{ fontSize: 20, gap: 30 }}>
          <span>Temporadas: {profile.totals.runs}</span>
          <span>Títulos: {profile.totals.titles}</span>
          <span>Partidos: {profile.totals.matches}</span>
          <span>Goles: {profile.totals.goals}</span>
        </div>
        <div className="col" style={{ width: 900, overflowY: 'auto', maxHeight: 480, touchAction: 'pan-y' }}>
          {profile.history.length === 0 && <div className="muted" style={{ textAlign: 'center', fontSize: 20 }}>Todavía no has terminado ninguna temporada.</div>}
          {profile.history.map(h => (
            <div key={h.id} className="reward-item" style={{ cursor: 'default' }}>
              <Crest club={h.club} size={36} />
              <span style={{ flex: 1 }}>
                {OUT_LABEL[h.outcome]} · Acto {h.act}{h.exig ? ` · Exigencia ${h.exig}` : ''}
                <small>
                  {new Date(h.date).toLocaleDateString('es-ES')} · {h.wins} victorias · {h.goalsFor}-{h.goalsAgainst} · semilla {h.seed}
                </small>
              </span>
              <span className="display" style={{ fontSize: 26, color: 'var(--gold)' }}>{h.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Credits() {
  const setHome = useGame(s => s.setHome)
  return (
    <div className="home">
      <div className="chalkboard" />
      <div className="scene" style={{ inset: 0, justifyContent: 'center' }}>
        <div className="scene-title">Créditos</div>
        <div className="scene-sub" style={{ fontSize: 20, lineHeight: 1.4 }}>
          Diseño, código, arte procedural y sonido sintetizado generados para este proyecto.
          <br />
          Tipografías: Oswald, Barlow Condensed y Kalam (SIL Open Font License).
          <br />
          Juego de fans sin ánimo de lucro. Los nombres y escudos de clubes y jugadores pertenecen a sus propietarios.
        </div>
        <button className="btn" onClick={() => setHome('title')}>← Volver</button>
      </div>
    </div>
  )
}
