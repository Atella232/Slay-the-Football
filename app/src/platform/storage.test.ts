import { beforeEach, describe, expect, it } from 'vitest'
import { installContent } from '../content/index'
import { newRun } from '../engine/api'
import { loadProfile, loadRun, saveProfile, saveRun } from './storage'
import { applyRunEnd, newProfile } from '../engine/meta/profile'

installContent()

describe('guardado', () => {
  beforeEach(() => localStorage.clear())

  it('guarda y recupera una temporada idéntica', () => {
    const run = newRun({ seed: 'S', club: 'athletic' })
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('descarta un guardado corrupto y conserva una copia', () => {
    localStorage.setItem('stf.run.v1', '{"v":1,"deck":[{"def":"no.existe"}],"trofeos":[]}')
    expect(loadRun()).toBeNull()
    expect(localStorage.getItem('stf.run.backup')).toBeTruthy()
    expect(localStorage.getItem('stf.run.v1')).toBeNull()
  })

  it('el perfil sobrevive y aplica desbloqueos al ganar la Final del acto 1', () => {
    const p = newProfile()
    const run = newRun({ seed: 'S', club: 'athletic' })
    run.act = 2
    run.screen = { k: 'ended', outcome: 'eliminado' }
    const r = applyRunEnd(p, run, '2026-11-04T10:00:00.000Z')
    expect(r.profile.unlocked).toContain('barcelona')
    saveProfile(r.profile)
    expect(loadProfile().unlocked).toContain('barcelona')
    expect(loadProfile().history.length).toBe(1)
  })
})
