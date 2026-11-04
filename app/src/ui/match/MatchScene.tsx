import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import type { MatchState, RunState } from '../../engine/model/types'
import { Ctx } from '../../engine/match/ctx'
import { previewIntent } from '../../engine/match/rival'
import { C, cardDef, clubDef, rivalDef } from '../../engine/registry'
import { cardText } from '../../engine/text/cardText'
import { pickCandidates } from '../../engine/match/queue'
import { penaltyScore } from '../../engine/match/penalties'
import { useGame } from '../store/game'
import { fxBus } from '../store/fx'
import { PlayerPanel, RivalPanel } from './Panels'
import { Pitch } from './Pitch'
import { Hand } from './Hand'
import { CardView, ownColor } from '../components/Card'
import { Icon } from '../art/icons'
import { CONCEPTS } from '../glossary'
import { audio } from '../../platform/audio'
import { useStage } from '../Stage'

export function MatchScene({ run }: { run: RunState }) {
  if (run.screen.k !== 'match') return null
  return <MatchInner run={run} m={run.screen.m} />
}

function MatchInner({ run, m }: { run: RunState; m: MatchState }) {
  const act = useGame(s => s.act)
  const busy = useGame(s => s.busy)
  const settings = useGame(s => s.settings)
  const setOverlay = useGame(s => s.setOverlay)
  const profile = useGame(s => s.profile)
  const markTutorial = useGame(s => s.markTutorial)
  const [cambioMode, setCambioMode] = useState(false)
  const shaker = useAnimationControls()
  const club = clubDef(run.club)

  useEffect(() => {
    audio.crowdBed(true, 0.3)
    return () => audio.crowdBed(false)
  }, [])

  useEffect(() => {
    const tense = m.turn >= m.maxTurns - 1 || Math.abs(m.score.f - m.score.a) <= 0
    audio.crowdBed(true, tense ? 0.6 : 0.3)
  }, [m.turn, m.maxTurns, m.score.f, m.score.a])

  useEffect(
    () =>
      fxBus.on(ev => {
        if ((ev.e === 'ataque' && ev.forma > 0) || (ev.e === 'goal' && ev.side === 'rival'))
          void shaker.start({ x: [0, -7, 6, -4, 3, 0], y: [0, 3, -4, 2, -1, 0], transition: { duration: 0.35 } })
      }),
    [shaker],
  )

  const onPlay = useCallback((uid: number) => act({ t: 'play', uid }), [act])

  const ctx = new Ctx(run)
  const parts = m.phase === 'player' ? previewIntent(ctx) : []
  const oc = parts.find(p => p.k === 'ocasion' && !p.cancelled)
  const unstopped = !!oc && m.player.block < (oc.n ?? 0)
  const endTurn = () => {
    if (busy && m.phase !== 'player') return
    if (settings.confirmEndTurn && unstopped && oc) {
      setOverlay({ k: 'confirm', text: `La Ocasión rival (${oc.n}) supera tu Bloqueo (${m.player.block}). Si terminas el turno, te marcarán. ¿Terminar igualmente?`, yes: { t: 'endTurn' } })
      return
    }
    audio.play('whistle')
    act({ t: 'endTurn' })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().overlay) return
      if (m.phase !== 'player' || m.pending) return
      if (e.key === 'e' || e.key === 'E') endTurn()
      if (e.key === 's' || e.key === 'S') setCambioMode(v => !v && m.player.cambios > 0)
      if (e.key === 'a' || e.key === 'A') setOverlay({ k: 'pile', pile: 'draw' })
      if (e.key === 'd' || e.key === 'D') setOverlay({ k: 'pile', pile: 'discard' })
      if (e.key === 'x' || e.key === 'X') setOverlay({ k: 'pile', pile: 'agotadas' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const showTip = !profile.tutorial.firstMatch && m.turn === 1 && m.phase === 'player'

  return (
    <motion.div className="match" animate={shaker} style={{ ['--club' as string]: club.colors.primary, ['--club-2' as string]: club.colors.secondary }}>
      <div className="match-board">
        <PlayerPanel run={run} m={m} />
        <Pitch run={run} m={m} />
        <RivalPanel run={run} m={m} />
      </div>
      <div className="hand-zone">
        <div className={`energy-orb ${m.player.energy === 0 ? 'empty' : ''}`} data-tip={`Energía|${CONCEPTS.energia}`} aria-label={`Energía ${m.player.energy}`}>
          <span>
            {m.player.energy}
            <small>/{3}</small>
          </span>
        </div>
        <button className="pile-btn" style={{ left: 22 }} onClick={() => setOverlay({ k: 'pile', pile: 'draw' })} aria-label="Mazo de robo">
          <Icon name="mazo" size={20} />
          <span className="n">{m.piles.draw.length}</span>
          <span className="l">Robo</span>
        </button>
        <button className="pile-btn" style={{ left: 104 }} onClick={() => setOverlay({ k: 'pile', pile: 'sistemas' })} aria-label="Sistemas en juego" data-tip="Sistemas|Cartas de Sistema en juego: su efecto dura todo el partido.">
          <Icon name="sistema" size={20} />
          <span className="n">{m.piles.sistemas.length}</span>
          <span className="l">Sistemas</span>
        </button>
        <Hand run={run} m={m} cambioMode={cambioMode} setCambioMode={setCambioMode} onPlay={onPlay} />
        <button
          className={`btn cambio-btn ${cambioMode ? 'on' : ''}`}
          disabled={m.phase !== 'player' || !!m.pending || m.player.cambios <= 0}
          onClick={() => setCambioMode(v => !v)}
          data-tip={`Cambios|${CONCEPTS.cambios}`}
        >
          <Icon name="cambio" /> Cambio
          <span className="pips-inline">
            {Array.from({ length: Math.max(3, m.player.cambios) }, (_, i) => (
              <i key={i} className={i < m.player.cambios ? 'on' : ''} />
            ))}
          </span>
        </button>
        <button className="btn primary big end-turn" disabled={m.phase !== 'player' || !!m.pending} onClick={endTurn} aria-keyshortcuts="E">
          Fin de turno
        </button>
        <button className="pile-btn" style={{ right: 104 }} onClick={() => setOverlay({ k: 'pile', pile: 'agotadas' })} aria-label="Cartas agotadas">
          <Icon name="agotadas" size={20} />
          <span className="n">{m.piles.agotadas.length}</span>
          <span className="l">Agotadas</span>
        </button>
        <button className="pile-btn" style={{ right: 22 }} onClick={() => setOverlay({ k: 'pile', pile: 'discard' })} aria-label="Descarte">
          <Icon name="descarte" size={20} />
          <span className="n">{m.piles.discard.length}</span>
          <span className="l">Descarte</span>
        </button>
        {cambioMode && <div className="hint-bar">Elige la carta que quieres cambiar (Esc para cancelar)</div>}
        {showTip && !cambioMode && (
          <div className="hint-bar" style={{ cursor: 'pointer' }} onClick={() => markTutorial('firstMatch')}>
            Arrastra una carta hacia arriba (o tócala dos veces) para jugarla · E: fin de turno · ✕
          </div>
        )}
      </div>
      <FxLayer />
      {m.pending && <PendingModal run={run} m={m} />}
      {m.phase === 'charla' && <CharlaModal m={m} />}
      {m.phase === 'penalties' && <Penalties run={run} m={m} />}
      {m.phase === 'ended' && !busy && <MatchEnd run={run} m={m} />}
    </motion.div>
  )
}

// ───────────── Efectos visuales ─────────────

interface Floating {
  id: number
  x: number
  y: number
  text: string
  color: string
}

let fid = 0

function FxLayer() {
  const { w } = useStage()
  const [nums, setNums] = useState<Floating[]>([])
  const [goal, setGoal] = useState<'player' | 'rival' | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    const add = (f: Omit<Floating, 'id'>) => {
      const id = ++fid
      setNums(ns => [...ns.slice(-8), { ...f, id }])
      window.setTimeout(() => setNums(ns => ns.filter(n => n.id !== id)), 1100)
    }
    const showBanner = (t: string, ms = 1400) => {
      setBanner(t)
      window.setTimeout(() => setBanner(b => (b === t ? null : b)), ms)
    }
    return fxBus.on(ev => {
      switch (ev.e) {
        case 'peligro':
          if (ev.toDefensa + ev.toRepliegue > 0) add({ x: w - 170 + (Math.random() - 0.5) * 60, y: 190, text: `-${ev.toDefensa + ev.toRepliegue}`, color: '#fff' })
          else if (ev.lost > 0) add({ x: w - 170, y: 190, text: 'Saque de centro', color: '#aaa' })
          break
        case 'ataque':
          if (ev.forma > 0) {
            add({ x: 130, y: 150, text: `-${ev.forma}`, color: '#ff8a3d' })
            setFlash(f => f + 1)
          } else if (ev.blocked > 0) add({ x: 130, y: 150, text: `Bloqueado ${ev.blocked}`, color: '#58b2ff' })
          break
        case 'heal':
          add({ x: 200, y: 40, text: `+${ev.n}`, color: '#4ade80' })
          break
        case 'goal':
          setGoal(ev.side)
          window.setTimeout(() => setGoal(null), ev.side === 'player' ? 2000 : 1500)
          break
        case 'ocasion':
          if (ev.saved && ev.n > 0) showBanner('¡Parada!', 900)
          break
        case 'halftime':
          showBanner('Descanso', 1200)
          break
        case 'prorroga':
          showBanner('¡Prórroga! Gol de oro', 1600)
          break
        case 'rivalPhase':
          showBanner(ev.name, 1400)
          break
        case 'kickoffLock':
          add({ x: w - 170, y: 230, text: 'Saque de centro', color: '#f2c14e' })
          break
      }
    })
  }, [w])
  return (
    <>
      {flash > 0 && <div key={flash} className="red-flash" />}
      <AnimatePresence>
        {nums.map(n => (
          <motion.div
            key={n.id}
            className="dmg-num"
            style={{ left: n.x, top: n.y, color: n.color, fontSize: n.text.length > 5 ? 24 : 40 }}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -70 }}
            transition={{ duration: 0.5 }}
          >
            {n.text}
          </motion.div>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {goal && (
          <motion.div className="goal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className={`goal-text ${goal === 'rival' ? 'rival' : ''}`}
              initial={{ scale: 0.3, rotate: -8 }}
              animate={{ scale: [0.3, 1.15, 1], rotate: [-8, 3, 0] }}
              transition={{ duration: 0.6 }}
            >
              {goal === 'player' ? '¡GOOOL!' : 'Gol rival'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {banner && (
          <motion.div className="banner" initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}>
            <div>{banner}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ───────────── Elección pendiente ─────────────

function PendingModal({ run, m }: { run: RunState; m: MatchState }) {
  const act = useGame(s => s.act)
  const [picked, setPicked] = useState<number[]>([])
  const p = m.pending!
  const ctx = new Ctx(run)
  if (p.kind === 'choose') {
    return (
      <div className="modal-back">
        <div className="modal">
          <h2>{p.prompt}</h2>
          <div className="col">
            {(p.options ?? []).map((o, i) => (
              <button key={i} className="btn big" onClick={() => act({ t: 'resolve', pick: [i] })}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }
  const cands = pickCandidates(ctx, p.from!, { f: p.f })
  const toggle = (uid: number) =>
    setPicked(ps => (ps.includes(uid) ? ps.filter(x => x !== uid) : p.max === 1 ? [uid] : ps.length < p.max ? [...ps, uid] : ps))
  const ok = picked.length >= p.min && picked.length <= p.max
  return (
    <div className="modal-back">
      <div className="modal" style={{ width: 1000 }}>
        <h2>{p.prompt}</h2>
        <div className="card-grid">
          {cands.map(uid => {
            const inst = m.cards[uid]
            const d = cardDef(inst.def)
            return (
              <CardView
                key={uid}
                def={d}
                up={inst.up}
                text={cardText(d, inst.up, ctx)}
                cost={typeof d.cost === 'number' ? d.cost : 'X'}
                selected={picked.includes(uid)}
                own={ownColor(d.club, run.club)}
                onClick={() => toggle(uid)}
              />
            )
          })}
        </div>
        <div className="row center">
          <span className="muted">
            {picked.length}/{p.max} {p.min > 0 ? `(mínimo ${p.min})` : ''}
          </span>
          <button className="btn primary" disabled={!ok} onClick={() => act({ t: 'resolve', pick: picked })}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ───────────── Descanso ─────────────

function CharlaModal({ m }: { m: MatchState }) {
  const act = useGame(s => s.act)
  const busy = useGame(s => s.busy)
  useEffect(() => {
    audio.play('whistleLong')
  }, [])
  if (busy) return null
  return (
    <div className="modal-back">
      <div className="modal" style={{ width: 760, alignItems: 'center' }}>
        <div className="chalk-title" style={{ fontSize: 44 }}>
          Descanso · {m.score.f}-{m.score.a}
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 19 }}>
          El vestuario te escucha. Elige la charla para la segunda parte.
        </p>
        <div className="row" style={{ alignItems: 'stretch' }}>
          {(m.charlas ?? []).map((id, i) => {
            const ch = C().charlas[id]
            return (
              <button key={id} className="reward-item" style={{ flexDirection: 'column', alignItems: 'flex-start', width: 220 }} onClick={() => act({ t: 'charla', i })}>
                <span className="display" style={{ fontSize: 22 }}>
                  {ch.name}
                </span>
                <small>{ch.text}</small>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ───────────── Penaltis ─────────────

const DIR_TEXT = { L: 'izquierda', C: 'centro', R: 'derecha' } as const

function Penalties({ run, m }: { run: RunState; m: MatchState }) {
  const act = useGame(s => s.act)
  const busy = useGame(s => s.busy)
  const pens = m.pens!
  const rd = rivalDef(m.rival.def)
  const sc = penaltyScore(pens.kicks)
  const last = pens.kicks[pens.kicks.length - 1]
  useEffect(() => {
    if (!last) return
    audio.play('kick')
    window.setTimeout(() => audio.play(last.goal ? 'net' : 'parada'), 250)
  }, [pens.kicks.length, last])
  const shooting = pens.next === 'player'
  const mine = pens.kicks.filter(k => k.side === 'player')
  const theirs = pens.kicks.filter(k => k.side === 'rival')
  const dots = (list: typeof mine) => (
    <div className="pen-dots">
      {Array.from({ length: Math.max(5, list.length) }, (_, i) => (
        <span key={i} className={`pen-dot ${list[i] ? (list[i].goal ? 'g' : 'f') : ''}`} />
      ))}
    </div>
  )
  return (
    <div className="modal-back">
      <div className="modal" style={{ width: 760, alignItems: 'center' }}>
        <div className="chalk-title" style={{ fontSize: 44 }}>
          Tanda de penaltis
        </div>
        <div className="row" style={{ gap: 30, fontSize: 20 }}>
          <div className="col" style={{ alignItems: 'center' }}>
            <span className="display">{clubDef(run.club).short}</span>
            {dots(mine)}
          </div>
          <span className="display" style={{ fontSize: 40 }}>
            {sc.f} - {sc.a}
          </span>
          <div className="col" style={{ alignItems: 'center' }}>
            <span className="display">{rd.short}</span>
            {dots(theirs)}
          </div>
        </div>
        {last && (
          <div className="muted" style={{ fontSize: 18 }}>
            Último: {last.side === 'player' ? 'tiraste' : 'tiró'} a la {DIR_TEXT[last.dir]}, el portero se lanzó a la {DIR_TEXT[last.dive]} → {last.goal ? 'GOL' : 'FALLO'}
          </div>
        )}
        {m.phase === 'penalties' && !pens.done && (
          <>
            <div style={{ fontSize: 22 }}>
              {shooting ? (
                <>
                  Tiras tú. El portero rival parece inclinarse hacia su <b style={{ color: 'var(--gold)' }}>{DIR_TEXT[pens.tell]}</b>.
                </>
              ) : (
                <>
                  Te toca parar. El lanzador abre el pie hacia la <b style={{ color: 'var(--gold)' }}>{DIR_TEXT[pens.tell]}</b>.
                </>
              )}
            </div>
            <div className="penalty-goal">
              <div className="penalty-dirs">
                {(['L', 'C', 'R'] as const).map(d => (
                  <button key={d} disabled={busy} onClick={() => act({ t: 'penalty', dir: d })}>
                    {shooting ? 'Tirar' : 'Lanzarse'} a la {DIR_TEXT[d]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ───────────── Fin de partido ─────────────

function MatchEnd({ run, m }: { run: RunState; m: MatchState }) {
  const act = useGame(s => s.act)
  const rd = rivalDef(m.rival.def)
  useEffect(() => {
    audio.play(m.result === 'victoria' ? 'victory' : m.result === 'derrota' ? 'defeat' : 'whistleTriple')
  }, [m.result])
  const title = m.result === 'victoria' ? '¡Victoria!' : m.result === 'empate' ? 'Empate' : run.forma <= 0 ? 'Equipo exhausto' : 'Derrota'
  const pens = m.pens ? penaltyScore(m.pens.kicks) : null
  return (
    <div className="modal-back">
      <motion.div className="modal" style={{ width: 560, alignItems: 'center' }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="chalk-title" style={{ fontSize: 60, color: m.result === 'victoria' ? 'var(--gold)' : m.result === 'derrota' ? '#ff9aa5' : 'var(--chalk)' }}>
          {title}
        </div>
        <div className="display" style={{ fontSize: 30 }}>
          {clubDef(run.club).short} {m.score.f} - {m.score.a} {rd.short}
          {pens ? ` (pen. ${pens.f}-${pens.a})` : ''}
        </div>
        <div className="row muted" style={{ fontSize: 18, gap: 18 }}>
          <span>Turnos: {m.turn}</span>
          <span>Paradas: {m.stats.paradas}</span>
          <span>Forma perdida: {m.stats.formaLost}</span>
        </div>
        {m.result === 'derrota' && m.tier !== 'final' && m.tier !== 'amistoso' && run.forma > 0 && (
          <p className="muted" style={{ textAlign: 'center', margin: 0, fontSize: 18 }}>
            Una derrota cuesta Forma, añade una Crisis a tu mazo y suma un aviso de la directiva.
          </p>
        )}
        <button className="btn primary big" autoFocus onClick={() => act({ t: 'proceed' })}>
          Continuar
        </button>
      </motion.div>
    </div>
  )
}
