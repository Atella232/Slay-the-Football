import type { GameEvent } from '../engine/model/types'

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** Frases del narrador a partir de los eventos del motor (cosmético). */
export function commentaryFor(ev: GameEvent, rival: string): string | null {
  switch (ev.e) {
    case 'goal':
      return ev.side === 'player'
        ? pick([`¡GOOOL! ¡${ev.f}-${ev.a}! ¡Qué manera de definir!`, `¡Golazo! El marcador dice ${ev.f}-${ev.a}.`, `¡A la red! ¡${ev.f}-${ev.a} y la grada enloquece!`, `¡Gol, gol, gol! ¡${ev.f}-${ev.a}!`])
        : pick([`Gol de ${rival}. ${ev.f}-${ev.a}. Toca reaccionar.`, `Silencio en la grada: marca ${rival}. ${ev.f}-${ev.a}.`, `${rival} no perdona. ${ev.f}-${ev.a}.`])
    case 'ocasion':
      if (ev.n === 0) return 'La jugada se queda en nada: ocasión anulada.'
      return ev.saved
        ? pick(['¡Paradón! Nos salvamos por poco.', '¡Qué defensa! Ocasión desbaratada.', '¡Al larguero no, al cuerpo! Despejada.', 'Bloqueo perfecto: aquí no pasa nadie.'])
        : null
    case 'ataque':
      if (ev.forma > 0) return pick([`Entrada dura: ${ev.forma} de Forma menos.`, 'El equipo acusa el golpe.', 'Eso ha dolido. Hay que aguantar.'])
      if (ev.blocked > 0) return pick(['Bien plantados atrás: el golpe no hace daño.', 'Muro firme. Ni un rasguño.'])
      return null
    case 'peligro':
      if (ev.lost > 0 && ev.toDefensa === 0 && ev.toRepliegue === 0) return pick(['Balón al centro: hay que esperar al saque.', 'Tras el gol, el rival saca de centro.'])
      if (ev.n >= 18) return pick(['¡Qué disparo! La defensa tiembla.', '¡Misil! Eso ha hecho mucho daño.'])
      return null
    case 'halftime':
      return pick(['Descanso. Momento para la charla del míster.', 'Final de la primera parte. Al vestuario.'])
    case 'prorroga':
      return '¡Prórroga! El próximo gol decide el partido.'
    case 'rivalPhase':
      return `${rival} cambia el plan: ${ev.name}.`
    case 'clock':
      if (ev.minute >= 79 && ev.minute < 90) return pick(['Entramos en el tramo final.', 'Últimos minutos. Cada balón vale oro.'])
      return null
    case 'penalty':
      return ev.kick.goal ? (ev.kick.side === 'player' ? '¡Dentro! Lanzamiento perfecto.' : 'Marca el rival.') : ev.kick.side === 'player' ? '¡Parada del portero! Fallamos.' : '¡LO PARA! ¡Qué intuición!'
    case 'matchEnd':
      return ev.result === 'victoria' ? '¡Final del partido! Victoria.' : ev.result === 'empate' ? 'Final del partido. Reparto de puntos.' : 'Final del partido. Derrota dolorosa.'
    case 'status':
      if (ev.id === 'expulsion' && ev.n > 0) return ev.side === 'player' ? '¡Roja! Nos quedamos con uno menos.' : `¡Roja para ${rival}!`
      return null
    default:
      return null
  }
}
