import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from './Stage'
import { useGame } from './store/game'
import { Home } from './scenes/Home'
import { MapScene } from './scenes/MapScene'
import { MatchScene } from './match/MatchScene'
import { ActEndScene, CardChoiceScene, DeckPickScene, EventScene, RestScene, RewardScene, RunEndScene, ShopScene, TreasureScene } from './scenes/RunScenes'
import { TopBar } from './components/TopBar'
import { Overlays } from './components/Overlays'
import { TooltipLayer } from './components/Tooltip'
import { installFxAudio } from './fxAudio'
import { audio } from '../platform/audio'
import type { RunState } from '../engine/model/types'

function RunView({ run }: { run: RunState }) {
  const k = run.screen.k
  let scene: React.ReactNode = null
  switch (k) {
    case 'match': scene = <MatchScene run={run} />; break
    case 'map': scene = <MapScene run={run} />; break
    case 'reward': scene = <RewardScene run={run} />; break
    case 'shop': scene = <ShopScene run={run} />; break
    case 'event': scene = <EventScene run={run} />; break
    case 'rest': scene = <RestScene run={run} />; break
    case 'treasure': scene = <TreasureScene run={run} />; break
    case 'deckPick': scene = <DeckPickScene run={run} />; break
    case 'cardChoice': scene = <CardChoiceScene run={run} />; break
    case 'actEnd': scene = <ActEndScene run={run} />; break
    case 'ended': scene = <RunEndScene run={run} />; break
  }
  const sceneKey = k === 'match' ? `match-${run.screen.k === 'match' ? run.screen.m.nodeId : ''}` : k
  return (
    <>
      <div className="chalkboard" />
      <AnimatePresence mode="wait">
        <motion.div key={sceneKey} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {scene}
        </motion.div>
      </AnimatePresence>
      <TopBar run={run} />
    </>
  )
}

export function App() {
  const view = useGame(s => s.view)
  const toast = useGame(s => s.toast)
  const settings = useGame(s => s.settings)
  const busy = useGame(s => s.busy)
  const skip = useGame(s => s.skip)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => installFxAudio(), [])
  useEffect(() => {
    const unlock = () => audio.ensure()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
  useEffect(() => {
    if (view?.screen.k === 'match') audio.setMusic('match', 0.3)
    else if (!view) audio.setMusic('menu')
  }, [view?.screen.k, view])

  return (
    <Stage>
      <div
        ref={root}
        className={`${settings.reducedMotion ? 'reduced-motion' : ''} ${settings.largeText ? 'large-text' : ''}`}
        style={{ position: 'absolute', inset: 0 }}
        onPointerDownCapture={() => {
          if (busy) skip()
        }}
      >
        {view ? <RunView run={view} /> : <Home />}
        <Overlays />
        <TooltipLayer root={root} />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Stage>
  )
}
