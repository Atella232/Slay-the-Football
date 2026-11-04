import type { Keyword, StatusId } from '../engine/model/types'

export const STATUS_HELP: Record<StatusId, { name: string; text: string; good: boolean }> = {
  confianza: { name: 'Confianza', text: 'Cada instancia de Peligro (o de Ocasión y Ataque si es del rival) suma tanto como su valor. No caduca en el partido.', good: true },
  solidez: { name: 'Solidez', text: 'Cada instancia de Bloqueo (o Repliegue del rival) suma tanto como su valor. No caduca en el partido.', good: true },
  fatiga: { name: 'Fatiga', text: 'Produce un 25% menos (Peligro, o Ocasión y Ataque si es el rival). Dura los turnos indicados.', good: false },
  desorganizado: { name: 'Desorganizado', text: 'Recibe un 50% más de Peligro (o de daño de Ataque). No afecta a las Ocasiones. Dura los turnos indicados.', good: false },
  desconcentrado: { name: 'Desconcentrado', text: 'Gana un 25% menos de Bloqueo (o Repliegue). Dura los turnos indicados.', good: false },
  amarilla: { name: 'Amarilla', text: 'A la segunda, expulsión. El jugador roba 1 carta menos por turno; un rival de Liga pierde un 25% de Defensa; en Copa y Final, la bronca anula su siguiente Ocasión.', good: false },
  expulsion: { name: 'Expulsión', text: 'Juegas con uno menos: robas 1 carta menos por turno durante el resto del partido.', good: false },
  contragolpe: { name: 'Contragolpe', text: 'Tu primer Ataque genera +3 de Peligro. Se gana con cada Parada.', good: true },
  reaccion: { name: 'Reacción', text: 'Tras encajar un gol, robas 1 carta más al inicio del siguiente turno.', good: true },
}

export const KEYWORD_HELP: Record<Keyword, string> = {
  agotar: 'Al jugarla, sale del partido (va a Agotadas) en vez de al descarte.',
  retener: 'No se descarta al final del turno.',
  inicial: 'Empieza siempre en tu primera mano.',
  efimera: 'Si sigue en tu mano al final del turno, se agota.',
  injugable: 'No se puede jugar. Usa un Cambio para quitártela de la mano.',
  doblete: 'Ignora el saque de centro: puedes seguir generando Peligro tras marcar con ella.',
}

export const CONCEPTS = {
  peligro: 'Peligro: lo que generan tus ataques. Primero rompe el Repliegue rival y después su Defensa. Al vaciar la Defensa, ¡gol!',
  bloqueo: 'Bloqueo: protege tu portería. Una Ocasión rival se para si tu Bloqueo es igual o mayor; lo que sobre absorbe el daño de los Ataques. Se pierde al empezar tu turno.',
  ocasion: 'Ocasión: el rival intenta marcar. Si tu Bloqueo es menor que su valor, encajas un gol (tu Bloqueo queda intacto para el Ataque).',
  ataque: 'Ataque: daño a tu Forma, reducido primero por tu Bloqueo.',
  repliegue: 'Repliegue: escudo del rival sobre su Defensa durante tu turno.',
  saque: 'Saque de centro: tras marcar, la Defensa del siguiente gol no se puede atacar hasta tu próximo turno.',
  cambios: 'Cambios: 3 por partido. Descarta una carta de tu mano y roba otra. Ideal para quitarte Estados.',
  forma: 'Forma: la vida de tu equipo durante toda la temporada. A 0, la temporada termina.',
  strikes: 'Derrotas: perder en Liga o Copa suma un aviso de la directiva (y cuesta Forma). Al tercero en el mismo acto, te destituyen. Los avisos se borran al ascender.',
  energia: 'Energía: se recarga cada turno. Cada carta cuesta la Energía indicada en su esquina.',
}
