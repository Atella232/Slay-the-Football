import { fxBus } from './store/fx'
import { audio } from '../platform/audio'

let lastBlock = 0

/** Traduce eventos del motor a sonido. */
export function installFxAudio(): () => void {
  return fxBus.on(ev => {
    switch (ev.e) {
      case 'draw': return audio.play('draw')
      case 'play': return audio.play('card')
      case 'shuffle': return audio.play('shuffle')
      case 'exhaust': return audio.play('swish')
      case 'peligro': if (ev.n > 0) audio.play('kick'); return
      case 'goal': return audio.play(ev.side === 'player' ? 'goal' : 'concede')
      case 'ocasion': if (ev.saved && ev.n > 0) audio.play('parada'); return
      case 'ataque': return audio.play(ev.forma > 0 ? 'hit' : 'block')
      case 'block':
        if (ev.side === 'player') {
          if (ev.n > lastBlock) audio.play('block')
          lastBlock = ev.n
        }
        return
      case 'status': return audio.play(ev.side === 'player' ? (['fatiga', 'desorganizado', 'desconcentrado', 'amarilla', 'expulsion'].includes(ev.id) ? 'debuff' : 'buff') : 'debuff')
      case 'clock': if (ev.minute >= 79) audio.play('tick'); return
      case 'prorroga': return audio.play('whistleTriple')
      case 'gold': if (ev.n > 0) audio.play('coin'); return
      case 'heal': return audio.play('buff')
      case 'turnStart': lastBlock = 0; return
      case 'rivalTurn': return audio.play('whistle')
    }
  })
}
