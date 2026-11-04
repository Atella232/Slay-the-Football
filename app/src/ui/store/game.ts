import { create } from 'zustand'
import type { Action, ClubId, RunState } from '../../engine/model/types'
import type { Frame } from '../../engine/match/ctx'
import { dispatch, newRun } from '../../engine/api'
import { applyRunEnd, clubLevel, type Profile, type RunEndResult } from '../../engine/meta/profile'
import { loadProfile, loadRun, loadSettings, saveProfile, saveRun, saveSettings, type Settings } from '../../platform/storage'
import { audio } from '../../platform/audio'
import { durationOf, fxBus } from './fx'

export type Overlay =
  | { k: 'deck' }
  | { k: 'pile'; pile: 'draw' | 'discard' | 'agotadas' | 'sistemas' }
  | { k: 'settings' }
  | { k: 'pause' }
  | { k: 'inspect'; def: string; up: boolean; uid?: number }
  | { k: 'confirm'; text: string; yes: Action }

export type Home = 'title' | 'clubs' | 'album' | 'history' | 'credits'

interface GameStore {
  profile: Profile
  settings: Settings
  run: RunState | null
  view: RunState | null
  busy: boolean
  home: Home
  overlay: Overlay | null
  toast: string | null
  endResult: RunEndResult | null
  setHome(h: Home): void
  setOverlay(o: Overlay | null): void
  startRun(club: ClubId, exig: number, opts?: { seed?: string; daily?: boolean }): void
  continueRun(): void
  act(a: Action): void
  skip(): void
  toTitle(): void
  updateSettings(p: Partial<Settings>): void
  flash(msg: string): void
  markTutorial(key: string): void
}

let queue: Frame[] = []
let playing = false
let skipFlag = false
let toastTimer: number | null = null

function speed(): number {
  const s = useGame.getState().settings
  if (s.reducedMotion) return Math.max(2, s.speed)
  return s.speed
}

async function playQueue(): Promise<void> {
  if (playing) return
  playing = true
  useGame.setState({ busy: true })
  while (queue.length) {
    const f = queue.shift()!
    if (skipFlag) continue
    useGame.setState({ view: f.snap })
    fxBus.emit(f.ev)
    const d = durationOf(f.ev) / speed()
    if (d > 4 && speed() < 50) await new Promise(r => setTimeout(r, d))
  }
  skipFlag = false
  playing = false
  const truth = useGame.getState().run
  useGame.setState({ busy: false, view: truth })
}

function persist(run: RunState | null): void {
  saveRun(run && run.screen.k !== 'ended' ? run : null)
}

function today(): string {
  return new Date().toISOString()
}

export const useGame = create<GameStore>((set, get) => ({
  profile: loadProfile(),
  settings: loadSettings(),
  run: null,
  view: null,
  busy: false,
  home: 'title',
  overlay: null,
  toast: null,
  endResult: null,

  setHome: h => set({ home: h }),
  setOverlay: o => set({ overlay: o }),

  startRun(club, exig, opts = {}) {
    const p = get().profile
    const seed = opts.seed ?? Math.random().toString(36).slice(2, 10).toUpperCase()
    const run = newRun({ seed, club, exig, daily: opts.daily, clubLevel: clubLevel(p.clubXp[club]) })
    queue = []
    set({ run, view: run, endResult: null, overlay: null })
    persist(run)
    audio.play('whistle')
  },

  continueRun() {
    const run = loadRun()
    if (!run) {
      get().flash('No hay ninguna temporada guardada')
      return
    }
    queue = []
    set({ run, view: run, endResult: null, overlay: null })
  },

  act(a) {
    const s = get()
    if (!s.run) return
    if (playing) {
      skipFlag = true
      queue = []
    }
    const res = dispatch(s.run, a, { frames: true })
    if (res.error) {
      audio.play('error')
      get().flash(res.error)
      return
    }
    const run = res.state
    set({ run })
    persist(run)
    if (run.screen.k === 'ended' && s.run.screen.k !== 'ended') {
      const r = applyRunEnd(get().profile, run, today())
      saveProfile(r.profile)
      set({ profile: r.profile, endResult: r })
    }
    queue.push(...(res.frames ?? []))
    if (!queue.length) {
      set({ view: run })
      return
    }
    skipFlag = false
    void playQueue()
  },

  skip() {
    if (!playing) return
    skipFlag = true
  },

  toTitle() {
    queue = []
    skipFlag = true
    set({ run: null, view: null, home: 'title', overlay: null, endResult: null })
    audio.crowdBed(false)
  },

  updateSettings(p) {
    const settings = { ...get().settings, ...p }
    saveSettings(settings)
    audio.apply(settings)
    set({ settings })
  },

  flash(msg) {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = window.setTimeout(() => set({ toast: null }), 2200)
  },

  markTutorial(key) {
    const p = get().profile
    if (p.tutorial[key]) return
    const profile = { ...p, tutorial: { ...p.tutorial, [key]: true } }
    saveProfile(profile)
    set({ profile })
  },
}))

audio.apply(useGame.getState().settings)

export function hasSavedRun(): boolean {
  try {
    return !!localStorage.getItem('stf.run.v1')
  } catch {
    return false
  }
}
