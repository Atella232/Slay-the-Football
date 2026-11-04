import { useGame } from './store/game'
import { renderState } from '../engine/debug/textRender'
import { legalActions } from '../engine/api'
import type { Action } from '../engine/model/types'
import { greedyDecide } from './debugBot'

declare global {
  interface Window {
    render_game_to_text?: () => string
    advanceTime?: (ms: number) => void
    __stf?: unknown
  }
}

/** Ganchos para automatización (Playwright) — sólo con ?debug=1. */
export function installDebugHooks(): void {
  window.render_game_to_text = () => {
    const s = useGame.getState()
    if (!s.run) return JSON.stringify({ screen: 'home', home: s.home, unlocked: s.profile.unlocked })
    return JSON.stringify({ ...renderState(s.run), busy: s.busy })
  }
  window.advanceTime = () => useGame.getState().skip()
  window.__stf = {
    state: () => useGame.getState().run,
    legal: () => {
      const r = useGame.getState().run
      return r ? legalActions(r) : []
    },
    act: (a: Action) => useGame.getState().act(a),
    start: (club: 'athletic' | 'barcelona' | 'madrid', seed?: string, exig = 0) => useGame.getState().startRun(club, exig, { seed }),
    botStep: () => {
      const r = useGame.getState().run
      if (!r || r.screen.k === 'ended') return false
      useGame.getState().act(greedyDecide(r))
      return true
    },
    skip: () => useGame.getState().skip(),
  }
}
