import { useEffect, useState } from 'react'
import type { MatchState, RunState, StatusInst } from '../../engine/model/types'
import { Ctx } from '../../engine/match/ctx'
import { previewIntent } from '../../engine/match/rival'
import { clubDef, rivalDef } from '../../engine/registry'
import { Icon } from '../art/icons'
import { Crest, Kit } from '../art/team'
import { STATUS_HELP, CONCEPTS } from '../glossary'
import { fxBus } from '../store/fx'

function StatusRow({ list }: { list: StatusInst[] }) {
  return (
    <div className="status-row">
      {list.map(s => {
        const h = STATUS_HELP[s.id]
        const cls = s.id === 'amarilla' ? 'yellow' : s.id === 'expulsion' ? 'red' : h.good ? 'good' : 'bad'
        return (
          <span key={s.id} className={`status-chip ${cls}`} data-tip={`${h.name}|${h.text}`}>
            <Icon name={s.id} size={15} />
            {s.id === 'expulsion' || s.id === 'contragolpe' ? '' : s.n}
          </span>
        )
      })}
    </div>
  )
}

export function PlayerPanel({ run, m }: { run: RunState; m: MatchState }) {
  const club = clubDef(run.club)
  const ctx = new Ctx(run)
  const parts = m.phase === 'player' ? previewIntent(ctx) : []
  const oc = parts.find(p => p.k === 'ocasion' && !p.cancelled)
  const atkTotal = parts.filter(p => p.k === 'ataque').reduce((a, p) => a + (p.n ?? 0) * (p.hits ?? 1), 0)
  const block = m.player.block
  const [flash, setFlash] = useState(false)
  useEffect(
    () =>
      fxBus.on(ev => {
        if (ev.e === 'block' && ev.side === 'player') {
          setFlash(true)
          window.setTimeout(() => setFlash(false), 400)
        }
      }),
    [],
  )
  let blockLeft = block
  let ocLine: React.ReactNode = null
  if (oc) {
    if (block >= (oc.n ?? 0)) {
      ocLine = <span className="ok">✔ Paras la Ocasión ({oc.n})</span>
      blockLeft -= oc.n ?? 0
    } else ocLine = <span className="warn">⚠ Te faltan {(oc.n ?? 0) - block} para parar la Ocasión</span>
  }
  const dmg = Math.max(0, atkTotal - blockLeft)
  const res = club.res
  const resVal = m.player.res[res] ?? 0
  return (
    <div className="side-panel">
      <div className="box">
        <h4>Tu portería</h4>
        <div className="shield">
          <div className={`shield-icon ${block === 0 ? 'zero' : ''} ${flash ? 'flash' : ''}`} data-tip={`Bloqueo|${CONCEPTS.bloqueo}`}>
            <Icon name="bloqueo" size={64} />
            <span className="n">{block}</span>
          </div>
          <div className="threat">
            {ocLine}
            {atkTotal > 0 && (dmg > 0 ? <span className="hurt">Recibirás {dmg} de daño</span> : <span className="ok">✔ Sin daño del Ataque</span>)}
            {!oc && atkTotal === 0 && m.phase === 'player' && <span className="muted">Sin amenaza directa</span>}
          </div>
        </div>
      </div>
      <div className="box" data-tip={`${club.resName}|${club.resText}`}>
        <h4>{club.resName}</h4>
        <div className="res-meter">
          <span className="display" style={{ fontSize: 26, width: 26 }}>
            {resVal}
          </span>
          <div className="res-pips">
            {Array.from({ length: club.resMax }, (_, i) => (
              <span key={i} className={`res-pip ${i < resVal ? 'on' : ''} ${res === 'posesion' && (i === 3 || i === 5) ? 'threshold' : ''}`} />
            ))}
          </div>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }} data-tip={`${club.passive.name}|${club.passive.text}`}>
          <Icon name="info" size={13} /> {club.passive.name}
        </div>
      </div>
      <div className="box">
        <h4>Estado</h4>
        <StatusRow list={m.player.st} />
      </div>
    </div>
  )
}

export function RivalPanel({ run, m }: { run: RunState; m: MatchState }) {
  const rd = rivalDef(m.rival.def)
  const ctx = new Ctx(run)
  const parts = previewIntent(ctx)
  const seg = m.rival.segs[m.rival.seg] ?? 1
  const defPct = Math.max(0, (m.rival.defensa / seg) * 100)
  const repPct = Math.min(100, (m.rival.repliegue / seg) * 100)
  const locked = m.rival.kickoffLock
  return (
    <div className="side-panel">
      <div className="box">
        <div className="rival-head">
          <Crest spec={rd.kit} club={rd.crest} short={rd.crest ? undefined : rd.short} size={52} />
          <div style={{ minWidth: 0 }}>
            <div className="rival-name">{rd.name}</div>
            <div className="muted" style={{ fontSize: 14 }}>
              {m.tier === 'liga' ? 'Liga' : m.tier === 'copa' ? 'Copa' : m.tier === 'final' ? 'Final' : 'Amistoso'} · {rd.formation}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Kit spec={rd.kit} size={40} />
          </div>
        </div>
        <div className="trait">
          <b>{rd.trait.name}.</b> {rd.trait.text}
        </div>
      </div>
      <div className="box defensa">
        <h4 data-tip={`Defensa|${CONCEPTS.peligro}`}>Defensa · gol {m.score.f + 1}</h4>
        <div className={`defensa-bar ${locked ? 'locked' : ''}`} data-tip={locked ? `Saque de centro|${CONCEPTS.saque}` : `Defensa|${CONCEPTS.peligro}`}>
          <div className="fill" style={{ width: `${defPct}%` }} />
          {m.rival.repliegue > 0 && <div className="rep" style={{ left: `${Math.max(0, defPct - repPct)}%`, width: `${Math.min(defPct, repPct)}%` }} />}
          <div className="label">
            {m.rival.defensa}
            {m.rival.repliegue > 0 && (
              <span style={{ color: '#0b3e6b' }} data-tip={`Repliegue|${CONCEPTS.repliegue}`}>
                +{m.rival.repliegue}
              </span>
            )}
          </div>
          {locked && (
            <span className="lock">
              <Icon name="candado" size={18} />
            </span>
          )}
        </div>
        <div className="segments">
          {m.rival.segs.slice(0, m.meta).map((_, i) => (
            <span key={i} className={`segment ${i < m.score.f ? 'done' : i === m.rival.seg ? 'current' : ''}`} />
          ))}
        </div>
      </div>
      <div className="box">
        <h4>Intención</h4>
        {m.rival.intent && <div className="intent-name">{m.rival.intent.name}</div>}
        <div className="intents">
          {parts.map((p, i) => {
            if (p.k === 'ocasion')
              return (
                <span key={i} className={`intent ocasion ${p.cancelled ? 'cancelled' : ''}`} data-tip={`Ocasión ${p.n}|${CONCEPTS.ocasion}`}>
                  <Icon name="ocasion" size={22} /> {p.n}
                </span>
              )
            if (p.k === 'ataque')
              return (
                <span key={i} className="intent ataque" data-tip={`Ataque|${CONCEPTS.ataque}`}>
                  <Icon name="ataque" size={22} /> {p.n}
                  {p.hits && p.hits > 1 ? `×${p.hits}` : ''}
                </span>
              )
            if (p.k === 'repliegue')
              return (
                <span key={i} className="intent repliegue" data-tip={`Repliegue|${CONCEPTS.repliegue}`}>
                  <Icon name="repliegue" size={22} /> {p.n}
                </span>
              )
            return (
              <span key={i} className={`intent ${p.k}`} data-tip={`${p.k === 'presion' ? 'Presión' : 'Refuerzo'}|${p.text}`}>
                <Icon name={p.k === 'presion' ? 'presion' : 'buff'} size={18} /> {p.text}
              </span>
            )
          })}
        </div>
        <div style={{ marginTop: 8 }}>
          <StatusRow list={m.rival.st} />
        </div>
      </div>
    </div>
  )
}
