import { describe, expect, it } from 'vitest'
import { M, act, matchWith, setHand } from '../../test/kit'
import { Ctx } from './ctx'
import { ataqueValue, bloqueoValue, ocasionValue, peligroValue } from './modifiers'
import { addStatus } from './combat'
import type { MoveDef, RunState } from '../model/types'

function setIntent(run: RunState, move: MoveDef) {
  const m = M(run)
  m.rival.intent = move
  m.rival.intentId = 'test'
}

describe('pipeline de modificadores', () => {
  it('aplica Confianza, Fatiga y Desorganizado en el orden documentado', () => {
    const run = matchWith({ deck: Array(10).fill('neu.disparo') })
    const ctx = new Ctx(run)
    expect(peligroValue(ctx, 6, 'ataque')).toBe(6)
    addStatus(ctx, 'player', 'confianza', 2)
    expect(peligroValue(ctx, 6, 'ataque')).toBe(8)
    addStatus(ctx, 'rival', 'desorganizado', 1)
    expect(peligroValue(ctx, 6, 'ataque')).toBe(12)
    addStatus(ctx, 'player', 'fatiga', 1)
    // floor((6+2) * 0.75 * 1.5) = 9
    expect(peligroValue(ctx, 6, 'ataque')).toBe(9)
  })

  it('Solidez y Desconcentrado modifican el bloqueo', () => {
    const run = matchWith({ deck: Array(10).fill('neu.despeje') })
    const ctx = new Ctx(run)
    addStatus(ctx, 'player', 'solidez', 3)
    expect(bloqueoValue(ctx, 5, 'defensa')).toBe(8)
    addStatus(ctx, 'player', 'desconcentrado', 1)
    expect(bloqueoValue(ctx, 5, 'defensa')).toBe(6)
  })

  it('Desorganizado del jugador aumenta el Ataque rival pero no la Ocasión', () => {
    const run = matchWith({ deck: Array(10).fill('neu.despeje') })
    const ctx = new Ctx(run)
    const atk0 = ataqueValue(ctx, 10)
    const oc0 = ocasionValue(ctx, 10)
    addStatus(ctx, 'player', 'desorganizado', 1)
    expect(ataqueValue(ctx, 10)).toBe(Math.floor(atk0 * 1.5))
    expect(ocasionValue(ctx, 10)).toBe(oc0)
  })
})

describe('estados', () => {
  it('un estado de duración aplicado por el rival dura todo el siguiente turno del jugador', () => {
    let run = matchWith({ deck: Array(12).fill('neu.despeje') })
    setIntent(run, { name: 'x', parts: [{ k: 'presion', text: '', ops: [{ op: 'status', who: 'rival', id: 'fatiga', n: 1 }] }] })
    run = act(run, { t: 'endTurn' })
    const m = M(run)
    expect(m.player.st.find(s => s.id === 'fatiga')?.n).toBe(1)
    setIntent(run, { name: 'y', parts: [{ k: 'repliegue', n: 1 }] })
    run = act(run, { t: 'endTurn' })
    expect(M(run).player.st.find(s => s.id === 'fatiga')).toBeUndefined()
  })

  it('dos amarillas expulsan al jugador: roba una carta menos', () => {
    let run = matchWith({ deck: Array(15).fill('neu.despeje') })
    const ctx = new Ctx(run)
    addStatus(ctx, 'player', 'amarilla', 1)
    addStatus(ctx, 'player', 'amarilla', 1)
    expect(M(run).player.st.find(s => s.id === 'expulsion')?.n).toBe(1)
    setIntent(run, { name: 'y', parts: [{ k: 'repliegue', n: 1 }] })
    run = act(run, { t: 'endTurn' })
    expect(M(run).piles.hand.length).toBe(4)
  })
})

describe('Ocasión y Ataque', () => {
  it('la Ocasión se resuelve antes que el Ataque y, si no se para, el bloqueo queda para el Ataque', () => {
    let run = matchWith({ deck: Array(12).fill('neu.despeje') })
    const uids = setHand(run, ['neu.despeje', 'neu.despeje'])
    run = act(run, { t: 'play', uid: uids[0] })
    run = act(run, { t: 'play', uid: uids[1] })
    expect(M(run).player.block).toBe(10)
    setIntent(run, { name: 'combo', parts: [{ k: 'ataque', n: 6 }, { k: 'ocasion', n: 12 }] })
    const forma = run.forma
    run = act(run, { t: 'endTurn' })
    const m = M(run)
    expect(m.score.a).toBe(1)
    // el ataque de 6 lo absorbe el bloqueo de 10
    expect(run.forma).toBe(forma)
  })

  it('una Parada consume bloqueo, da Contragolpe y suma +3 al primer Ataque', () => {
    let run = matchWith({ deck: Array(12).fill('neu.disparo') })
    const uids = setHand(run, ['neu.despeje', 'neu.despeje'])
    run = act(run, { t: 'play', uid: uids[0] })
    run = act(run, { t: 'play', uid: uids[1] })
    setIntent(run, { name: 'oc', parts: [{ k: 'ocasion', n: 8 }] })
    run = act(run, { t: 'endTurn' })
    let m = M(run)
    expect(m.score.a).toBe(0)
    expect(m.stats.paradas).toBe(1)
    expect(m.player.st.some(s => s.id === 'contragolpe')).toBe(true)
    const def0 = m.rival.defensa
    const [d] = setHand(run, ['neu.disparo'])
    run = act(run, { t: 'play', uid: d })
    m = M(run)
    expect(def0 - m.rival.defensa).toBe(9)
    expect(m.player.st.some(s => s.id === 'contragolpe')).toBe(false)
  })
})

describe('goles y saque de centro', () => {
  it('tras marcar, el resto del Peligro del turno se pierde', () => {
    let run = matchWith({ deck: Array(12).fill('neu.disparo') })
    const m0 = M(run)
    m0.rival.defensa = 5
    m0.player.energy = 10
    const uids = setHand(run, ['neu.disparo', 'neu.disparo'])
    run = act(run, { t: 'play', uid: uids[0] })
    let m = M(run)
    expect(m.score.f).toBe(1)
    expect(m.rival.kickoffLock).toBe(true)
    const def = m.rival.defensa
    run = act(run, { t: 'play', uid: uids[1] })
    m = M(run)
    expect(m.rival.defensa).toBe(def)
    expect(m.stats.peligroLost).toBeGreaterThanOrEqual(6)
  })

  it('llegar a la Meta gana el partido al instante', () => {
    let run = matchWith({ deck: Array(12).fill('neu.disparo') })
    const m0 = M(run)
    m0.score.f = 1
    m0.rival.seg = 1
    m0.rival.defensa = 3
    const [u] = setHand(run, ['neu.disparo'])
    run = act(run, { t: 'play', uid: u })
    expect(M(run).phase).toBe('ended')
    expect(M(run).result).toBe('victoria')
    run = act(run, { t: 'proceed' })
    expect(run.screen.k).toBe('reward')
  })
})

describe('reloj', () => {
  function burnTurns(run: RunState, n: number): RunState {
    for (let i = 0; i < n; i++) {
      if (M(run).phase === 'charla') run = act(run, { t: 'charla', i: 0 })
      if (M(run).phase === 'ended') break
      setIntent(run, { name: 'nada', parts: [{ k: 'repliegue', n: 1 }] })
      run = act(run, { t: 'endTurn' })
    }
    return run
  }

  it('hay descanso tras el turno 4 y la Liga termina en empate al 90', () => {
    let run = matchWith({ deck: Array(30).fill('neu.despeje') })
    run = burnTurns(run, 4)
    expect(M(run).phase).toBe('charla')
    expect(M(run).charlas?.length).toBe(3)
    run = burnTurns(run, 6)
    expect(M(run).phase).toBe('ended')
    expect(M(run).result).toBe('empate')
    expect(M(run).turn).toBe(8)
  })

  it('en Copa el empate lleva a prórroga con gol de oro y después a penaltis', () => {
    let run = matchWith({ deck: Array(40).fill('neu.despeje'), rival: 'r1.rondo', tier: 'copa' })
    run = burnTurns(run, 8)
    let m = M(run)
    expect(m.prorroga).toBe(true)
    expect(m.maxTurns).toBe(10)
    run = burnTurns(run, 2)
    m = M(run)
    expect(m.phase).toBe('penalties')
    let guard = 0
    while (M(run).phase === 'penalties' && guard++ < 60) run = act(run, { t: 'penalty', dir: 'L' })
    expect(M(run).phase).toBe('ended')
    expect(['victoria', 'derrota']).toContain(M(run).result)
  })

  it('el gol de oro en la prórroga decide el partido', () => {
    let run = matchWith({ deck: Array(40).fill('neu.disparo'), rival: 'r1.rondo', tier: 'copa' })
    run = burnTurns(run, 8)
    const m = M(run)
    expect(m.prorroga).toBe(true)
    m.rival.defensa = 1
    const [u] = setHand(run, ['neu.disparo'])
    run = act(run, { t: 'play', uid: u })
    expect(M(run).result).toBe('victoria')
  })
})

describe('derrotas y destitución', () => {
  it('perder en Liga cuesta Forma, añade Crisis y suma un strike; 3 strikes destituyen', () => {
    let run = matchWith({ deck: Array(12).fill('neu.disparo') })
    const forma = run.forma
    for (let s = 1; s <= 3; s++) {
      const m = M(run)
      m.score.a = m.meta - 1
      setIntent(run, { name: 'gol', parts: [{ k: 'ocasion', n: 99 }] })
      run = act(run, { t: 'endTurn' })
      expect(M(run).result).toBe('derrota')
      run = act(run, { t: 'proceed' })
      if (s < 3) {
        expect(run.strikes).toBe(s)
        expect(run.screen.k).toBe('reward')
        expect(run.deck.filter(c => c.def === 'est.crisis').length).toBe(1)
        // volver a un partido
        run = matchWith({ deck: Array(12).fill('neu.disparo') })
        run.strikes = s
        run.forma = forma
      } else {
        expect(run.screen.k).toBe('ended')
        if (run.screen.k === 'ended') expect(run.screen.outcome).toBe('destituido')
      }
    }
  })

  it('perder una Final termina la run', () => {
    let run = matchWith({ deck: Array(12).fill('neu.disparo'), rival: 'r1.meseta', tier: 'final' })
    const m = M(run)
    m.score.a = 2
    setIntent(run, { name: 'gol', parts: [{ k: 'ocasion', n: 99 }] })
    run = act(run, { t: 'endTurn' })
    run = act(run, { t: 'proceed' })
    expect(run.screen.k).toBe('ended')
    if (run.screen.k === 'ended') expect(run.screen.outcome).toBe('eliminado')
  })
})

describe('cartas', () => {
  it('un Sistema queda en juego y su hook se dispara cada turno', () => {
    let run = matchWith({ deck: Array(12).fill('neu.despeje') })
    const [u] = setHand(run, ['ath.corazon'])
    run = act(run, { t: 'play', uid: u })
    expect(M(run).piles.sistemas).toContain(u)
    setIntent(run, { name: 'n', parts: [{ k: 'repliegue', n: 1 }] })
    const g = M(run).player.res.garra
    run = act(run, { t: 'endTurn' })
    expect(M(run).player.res.garra).toBe(g + 1)
  })

  it('una carta con elección deja una elección pendiente que se resuelve', () => {
    let run = matchWith({ deck: Array(12).fill('neu.despeje') })
    const uids = setHand(run, ['ath.cantera', 'neu.disparo', 'neu.despeje'])
    run = act(run, { t: 'play', uid: uids[0] })
    expect(M(run).pending?.kind).toBe('pick')
    run = act(run, { t: 'resolve', pick: [uids[1]] })
    const m = M(run)
    expect(m.pending).toBeNull()
    expect(m.piles.agotadas).toContain(uids[1])
    // Athletic gana Garra al agotar
    expect(m.player.res.garra).toBeGreaterThanOrEqual(1)
    expect(m.piles.hand.length).toBe(1 + 2)
  })

  it('Choque Frontal gasta Garra y escala el Peligro', () => {
    let run = matchWith({ deck: Array(12).fill('neu.despeje') })
    const m0 = M(run)
    m0.player.res.garra = 3
    m0.rival.defensa = 100
    m0.rival.segs[0] = 100
    const [u] = setHand(run, ['ath.choque'])
    run = act(run, { t: 'play', uid: u })
    const m = M(run)
    expect(m.player.res.garra).toBe(0)
    expect(100 - m.rival.defensa).toBe(11 + 3 * 4)
  })

  it('los cambios descartan una carta y roban otra', () => {
    let run = matchWith({ deck: Array(12).fill('neu.despeje') })
    const uids = setHand(run, ['est.lesion'])
    run = act(run, { t: 'cambio', uid: uids[0] })
    const m = M(run)
    expect(m.player.cambios).toBe(2)
    expect(m.piles.discard).toContain(uids[0])
    expect(m.piles.hand.length).toBe(1)
  })
})
