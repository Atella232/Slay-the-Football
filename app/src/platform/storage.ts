import type { RunState } from '../engine/model/types'
import type { Profile } from '../engine/meta/profile'
import { newProfile, PROFILE_VERSION } from '../engine/meta/profile'
import { SAVE_VERSION } from '../engine/run/run'
import { C } from '../engine/registry'

const RUN_KEY = 'stf.run.v1'
const PROFILE_KEY = 'stf.profile.v1'
const SETTINGS_KEY = 'stf.settings.v1'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, val: string | null): void {
  try {
    if (val === null) localStorage.removeItem(key)
    else localStorage.setItem(key, val)
  } catch {
    /* almacenamiento no disponible: el juego sigue sin guardar */
  }
}

export function saveRun(run: RunState | null): void {
  write(RUN_KEY, run ? JSON.stringify(run) : null)
}

/** Migraciones por versión de guardado. */
const MIGRATIONS: Record<number, (r: Record<string, unknown>) => Record<string, unknown>> = {}

export function loadRun(): RunState | null {
  const raw = read(RUN_KEY)
  if (!raw) return null
  try {
    let obj = JSON.parse(raw) as Record<string, unknown>
    let v = Number(obj.v ?? 0)
    while (v < SAVE_VERSION && MIGRATIONS[v]) {
      obj = MIGRATIONS[v](obj)
      v++
    }
    if (v !== SAVE_VERSION) throw new Error('versión incompatible')
    const run = obj as unknown as RunState
    // validación ligera: el contenido referenciado existe
    const c = C()
    for (const card of run.deck) if (!c.cards[card.def]) throw new Error(`carta desconocida ${card.def}`)
    for (const t of run.trofeos) if (!c.trofeos[t.id]) throw new Error(`trofeo desconocido ${t.id}`)
    return run
  } catch (e) {
    write('stf.run.backup', raw)
    write(RUN_KEY, null)
    console.warn('Partida guardada no válida, se ha descartado:', e)
    return null
  }
}

export function saveProfile(p: Profile): void {
  write(PROFILE_KEY, JSON.stringify(p))
}

export function loadProfile(): Profile {
  const raw = read(PROFILE_KEY)
  if (!raw) return newProfile()
  try {
    const p = JSON.parse(raw) as Profile
    if (p.v !== PROFILE_VERSION) return { ...newProfile(), ...p, v: PROFILE_VERSION }
    return { ...newProfile(), ...p }
  } catch {
    return newProfile()
  }
}

export interface Settings {
  master: number
  sfx: number
  crowd: number
  music: number
  speed: 1 | 1.5 | 2 | 99
  reducedMotion: boolean
  confirmEndTurn: boolean
  largeText: boolean
  leftHanded: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  sfx: 0.8,
  crowd: 0.5,
  music: 0.35,
  speed: 1,
  reducedMotion: false,
  confirmEndTurn: true,
  largeText: false,
  leftHanded: false,
}

export function loadSettings(): Settings {
  const raw = read(SETTINGS_KEY)
  let s = { ...DEFAULT_SETTINGS }
  try {
    if (raw) s = { ...s, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    /* ignorar */
  }
  try {
    if (!raw && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) s.reducedMotion = true
  } catch {
    /* ignorar */
  }
  return s
}

export function saveSettings(s: Settings): void {
  write(SETTINGS_KEY, JSON.stringify(s))
}
