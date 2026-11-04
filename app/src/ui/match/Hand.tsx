import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MatchState, RunState } from '../../engine/model/types'
import { Ctx } from '../../engine/match/ctx'
import { baseCostOf, costOf, playability } from '../../engine/match/cards'
import { cardDef } from '../../engine/registry'
import { cardText } from '../../engine/text/cardText'
import { CardView, ownColor } from '../components/Card'
import { useGame } from '../store/game'
import { useStage } from '../Stage'
import { audio } from '../../platform/audio'

const PLAY_DY = -150

interface Drag {
  uid: number
  sx: number
  sy: number
  dx: number
  dy: number
  moved: boolean
}

export function Hand({ run, m, cambioMode, setCambioMode, onPlay }: { run: RunState; m: MatchState; cambioMode: boolean; setCambioMode: (v: boolean) => void; onPlay: (uid: number) => void }) {
  const { scale, touch } = useStage()
  const busy = useGame(s => s.busy)
  const act = useGame(s => s.act)
  const setOverlay = useGame(s => s.setOverlay)
  const [hover, setHover] = useState<number | null>(null)
  const [selRaw, setSel] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const longPress = useRef<number | null>(null)
  const ctx = new Ctx(run)
  const hand = m.piles.hand
  const n = hand.length
  const canAct = m.phase === 'player' && !m.pending

  const sel = selRaw !== null && hand.includes(selRaw) ? selRaw : null

  const tryPlay = useCallback(
    (uid: number) => {
      const p = playability(ctx, uid)
      if (!p.ok) {
        audio.play('error')
        useGame.getState().flash(p.reason ?? 'No se puede jugar')
        return
      }
      setSel(null)
      setHover(null)
      onPlay(uid)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, onPlay],
  )

  const tap = (uid: number) => {
    if (!canAct) return
    if (cambioMode) {
      act({ t: 'cambio', uid })
      setCambioMode(false)
      return
    }
    if (sel === uid) tryPlay(uid)
    else {
      setSel(uid)
      audio.play('hover')
    }
  }

  // teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().overlay) return
      if (!canAct) return
      if (/^[0-9]$/.test(e.key)) {
        const idx = e.key === '0' ? 9 : Number(e.key) - 1
        const uid = hand[idx]
        if (uid !== undefined) {
          if (cambioMode) {
            act({ t: 'cambio', uid })
            setCambioMode(false)
          } else setSel(uid)
        }
      } else if ((e.key === 'Enter' || e.key === ' ') && sel !== null) {
        e.preventDefault()
        tryPlay(sel)
      } else if (e.key === 'Escape') {
        setSel(null)
        setCambioMode(false)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const i = sel === null ? -1 : hand.indexOf(sel)
        const ni = e.key === 'ArrowRight' ? Math.min(n - 1, i + 1) : Math.max(0, i - 1)
        if (hand[ni] !== undefined) setSel(hand[ni])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hand, sel, canAct, cambioMode, act, setCambioMode, tryPlay, n])

  const onPointerDown = (uid: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canAct || cambioMode) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const d: Drag = { uid, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false }
    dragRef.current = d
    setDrag(d)
    if (e.pointerType === 'touch') {
      longPress.current = window.setTimeout(() => {
        const def = cardDef(m.cards[uid].def)
        setOverlay({ k: 'inspect', def: def.id, up: m.cards[uid].up, uid })
        dragRef.current = null
        setDrag(null)
      }, 520)
    }
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = (e.clientX - d.sx) / scale
      const dy = (e.clientY - d.sy) / scale
      const moved = d.moved || Math.hypot(dx, dy) > 10
      if (moved && longPress.current) {
        clearTimeout(longPress.current)
        longPress.current = null
      }
      const nd = { ...d, dx, dy, moved }
      dragRef.current = nd
      setDrag(nd)
    }
    const up = () => {
      const d = dragRef.current
      if (longPress.current) {
        clearTimeout(longPress.current)
        longPress.current = null
      }
      dragRef.current = null
      setDrag(null)
      if (!d) return
      if (d.moved) {
        if (d.dy < PLAY_DY) tryPlay(d.uid)
      } else tap(d.uid)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  })

  const spacing = Math.min(132, 820 / Math.max(1, n))
  return (
    <>
      <div className={`play-line ${drag?.moved ? 'show' : ''}`} style={{ top: 270 + PLAY_DY - 40 }} />
      <div className="hand" aria-label="Tu mano">
        <AnimatePresence custom={m}>
          {hand.map((uid, i) => {
            const inst = m.cards[uid]
            const def = cardDef(inst.def)
            const mid = (n - 1) / 2
            const off = i - mid
            const isHover = hover === uid && !drag
            const isSel = sel === uid
            const isDrag = drag?.uid === uid && drag.moved
            const lifted = isHover || isSel
            const x = off * spacing + (isDrag ? drag!.dx : 0)
            const y = Math.abs(off) * Math.abs(off) * 3 - (lifted ? (touch ? 120 : 96) : 0) + (isDrag ? drag!.dy : 0)
            const rot = isDrag || lifted ? 0 : off * 3.2
            const sc = isDrag ? 1.05 : lifted ? (touch ? 1.45 : 1.3) : 1
            const playable = canAct && playability(ctx, uid).ok
            return (
              <motion.div
                key={uid}
                className="hand-card"
                style={{ zIndex: isDrag ? 100 : lifted ? 90 : i + 1 }}
                initial={{ x: -620, y: 60, rotate: -20, scale: 0.6, opacity: 0 }}
                animate={{ x, y, rotate: rot, scale: sc, opacity: 1 }}
                variants={{ exit: (mm: MatchState) => exitFor(mm, uid) }}
                exit="exit"
                transition={isDrag ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
                onPointerEnter={() => !touch && setHover(uid)}
                onPointerLeave={() => setHover(h => (h === uid ? null : h))}
              >
                <CardView
                  def={def}
                  up={inst.up || !!inst.tmpUp}
                  text={cardText(def, inst.up || !!inst.tmpUp, ctx)}
                  cost={costOf(ctx, uid)}
                  baseCost={baseCostOf(inst)}
                  playable={playable && !busy}
                  selected={isSel}
                  dim={cambioMode ? false : !playable && canAct}
                  own={ownColor(def.club, run.club)}
                  onPointerDown={onPointerDown(uid)}
                  tabIndex={0}
                />
                {cambioMode && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '3px dashed var(--gold)', pointerEvents: 'none' }} />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}

function exitFor(m: MatchState, uid: number) {
  if (m.piles.discard.includes(uid)) return { x: 560, y: 80, rotate: 30, scale: 0.4, opacity: 0, transition: { duration: 0.3 } }
  if (m.piles.agotadas.includes(uid)) return { y: -120, scale: 0.8, opacity: 0, filter: 'blur(4px)', transition: { duration: 0.35 } }
  if (m.piles.draw.includes(uid)) return { x: -560, y: 80, scale: 0.4, opacity: 0, transition: { duration: 0.3 } }
  // jugada: sube hacia el campo
  return { y: -330, scale: 0.85, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' as const } }
}
