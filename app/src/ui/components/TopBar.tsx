import type { RunState } from '../../engine/model/types'
import { clubDef, consumibleDef, rivalDef, trofeoDef } from '../../engine/registry'
import { Icon } from '../art/icons'
import { Crest } from '../art/team'
import { useGame } from '../store/game'
import { minuteOf } from '../../engine/match/flow'
import { strikeLimit } from '../../engine/run/run'
import { CONCEPTS } from '../glossary'
import { useEffect, useState } from 'react'
import { fxBus } from '../store/fx'

export function TopBar({ run }: { run: RunState }) {
  const club = clubDef(run.club)
  const setOverlay = useGame(s => s.setOverlay)
  const act = useGame(s => s.act)
  const busy = useGame(s => s.busy)
  const inMatch = run.screen.k === 'match'
  const pct = Math.max(0, Math.min(100, (run.forma / run.formaMax) * 100))
  const [proc, setProc] = useState<string | null>(null)
  useEffect(
    () =>
      fxBus.on(ev => {
        if (ev.e === 'trofeoProc') {
          setProc(ev.id)
          window.setTimeout(() => setProc(p => (p === ev.id ? null : p)), 500)
        }
      }),
    [],
  )
  const limit = strikeLimit(run)
  const tapCons = (slot: number) => {
    const id = run.consumibles[slot]
    if (!id || busy) return
    const d = consumibleDef(id)
    const canMatch = inMatch && d.ops?.length && run.screen.k === 'match' && run.screen.m.phase === 'player'
    const canMap = !inMatch && d.runOps?.length
    if (canMatch || canMap) act({ t: 'consumible', slot })
    else useGame.getState().flash(inMatch ? 'Ahora no se puede usar' : 'Este consumible sólo se usa en partido')
  }
  return (
    <div className="topbar">
      <div className="club-chip">
        <Crest club={run.club} size={34} />
        <div style={{ lineHeight: 1 }}>
          <div>{club.short}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Acto {run.act}
            {run.exig > 0 ? ` · Exig. ${run.exig}` : ''}
          </div>
        </div>
      </div>
      <div className="forma-bar" data-tip={`Forma|${CONCEPTS.forma}`}>
        <div className="fill" style={{ width: `${pct}%` }} />
        <div className="label">
          <Icon name="forma" size={14} /> {run.forma}/{run.formaMax}
        </div>
      </div>
      <span className="stat" data-tip="Oro|Para el Mercado.">
        <Icon name="oro" size={18} style={{ color: 'var(--gold)' }} />
        {run.gold}
      </span>
      <span className="stat" data-tip={`Derrotas|${CONCEPTS.strikes}`}>
        {Array.from({ length: limit }, (_, i) => (
          <span key={i} style={{ width: 10, height: 14, borderRadius: 2, display: 'inline-block', background: i < run.strikes ? 'var(--ocasion)' : 'rgba(255,255,255,.15)' }} />
        ))}
      </span>
      {!inMatch && (
        <div className="trofeo-row">
          {run.trofeos.map(t => {
            const d = trofeoDef(t.id)
            return (
              <div key={t.id} className={`trofeo-icon t-${d.tier} ${proc === t.id ? 'proc' : ''}`} data-tip={`${d.name}|${d.text}`}>
                <Icon name={d.icon} size={18} />
                {d.counter && t.ctr > 0 && <span className="ctr">{t.ctr}</span>}
              </div>
            )
          })}
        </div>
      )}
      <div className="spacer" />
      {inMatch && run.screen.k === 'match' && <Scoreboard run={run} />}
      {inMatch && (
        <div className="trofeo-row" style={{ maxWidth: 220 }}>
          {run.trofeos.map(t => {
            const d = trofeoDef(t.id)
            return (
              <div key={t.id} className={`trofeo-icon t-${d.tier} ${proc === t.id ? 'proc' : ''}`} data-tip={`${d.name}|${d.text}`}>
                <Icon name={d.icon} size={18} />
                {d.counter && t.ctr > 0 && <span className="ctr">{t.ctr}</span>}
              </div>
            )
          })}
        </div>
      )}
      <div className="cons-slots">
        {run.consumibles.map((id, i) => {
          const d = id ? consumibleDef(id) : null
          return (
            <button
              key={i}
              className={`cons-slot ${d ? 'full' : ''}`}
              data-tip={d ? `${d.name}|${d.text}` : 'Hueco de consumible'}
              onClick={() => tapCons(i)}
              aria-label={d ? `Usar ${d.name}` : 'Hueco vacío'}
            >
              {d ? <Icon name={d.icon} size={18} /> : null}
            </button>
          )
        })}
      </div>
      <button className="icon-btn" onClick={() => setOverlay({ k: 'deck' })} data-tip={`Mazo|${run.deck.length} cartas`} aria-label="Ver mazo">
        <Icon name="mazo" />
      </button>
      <button className="icon-btn" onClick={() => setOverlay({ k: 'pause' })} aria-label="Menú">
        <Icon name="menu" />
      </button>
    </div>
  )
}

function Scoreboard({ run }: { run: RunState }) {
  if (run.screen.k !== 'match') return null
  const m = run.screen.m
  const rd = rivalDef(m.rival.def)
  const club = clubDef(run.club)
  const minute = minuteOf(m)
  const total = m.maxTurns
  const tramo = !m.prorroga && m.turn >= m.maxTurns - 1
  return (
    <div className="scoreboard" aria-label={`Marcador ${club.short} ${m.score.f} - ${m.score.a} ${rd.short}, minuto ${minute}`}>
      <div className="team">
        <Crest club={run.club} size={30} />
        {club.short}
      </div>
      <div className="score" data-tip={`Meta|Gana quien llegue antes a ${m.meta} goles. Al final, gana quien vaya por delante.`}>
        <span>{m.score.f}</span>
        <span className="meta">
          meta
          <br />
          {m.meta}
        </span>
        <span>{m.score.a}</span>
      </div>
      <div className="team">
        {rd.short}
        <Crest spec={rd.kit} short={rd.crest ? undefined : rd.short} club={rd.crest} size={30} />
      </div>
      <div className={`clock ${m.prorroga ? 'prorroga' : tramo ? 'final' : ''}`} data-tip={`Reloj|Turno ${m.turn} de ${total}. ${m.prorroga ? 'Prórroga: gol de oro.' : 'Tras el turno 4, descanso.'}`}>
        <span>{minute}'</span>
        <div className="pips">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`pip ${i < m.turn ? 'on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
