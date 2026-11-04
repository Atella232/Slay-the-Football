import type { EventDef } from '../../engine/model/types'

export const EVENTS: EventDef[] = [
  {
    id: 'ev.rueda_prensa', title: 'Rueda de prensa', acts: [1, 2, 3], art: 'sistema',
    text: 'Los periodistas te esperan con los micrófonos preparados. Una frase tuya mañana será portada.',
    options: [
      { label: 'Prometer goles', text: 'Titulares en todas partes. Los patrocinadores sonríen; el vestuario, no tanto.', ops: [{ op: 'gold', n: 60 }, { op: 'addCard', def: 'est.presion_mediatica' }] },
      { label: 'Discurso humilde', text: 'Bajas el balón al suelo. El grupo respira.', ops: [{ op: 'heal', n: 10 }] },
      { label: 'Cargar contra el árbitro', text: 'Multa y sanción... pero el equipo se conjura contigo.', requires: { gold: 30 }, ops: [{ op: 'gold', n: -30 }, { op: 'trofeo', tier: 'comun' }] },
    ],
  },
  {
    id: 'ev.medico', title: 'El médico del club', acts: [1, 2, 3], art: 'estado',
    text: 'El doctor revisa a la plantilla. «Puedo hacer milagros, pero todo tiene un precio».',
    options: [
      { label: 'Tratamiento completo', text: 'Una semana de fisio y hielo.', ops: [{ op: 'healPct', n: 25 }] },
      { label: 'Infiltración', text: 'Aguantarán... de momento.', ops: [{ op: 'formaMax', n: 6 }, { op: 'addCard', def: 'est.lesion' }] },
      { label: 'Revisión a fondo', text: 'Descubres a alguien que no está para jugar.', requires: { gold: 40 }, ops: [{ op: 'gold', n: -40 }, { op: 'deckPick', purpose: 'remove', n: 1 }] },
    ],
  },
  {
    id: 'ev.ojeador', title: 'El ojeador', acts: [1, 2, 3], art: 'desmarque',
    text: 'Un ojeador veterano te pasa su libreta. «Tres nombres. Uno te cambiará la temporada».',
    options: [
      { label: 'Fichar a uno', text: 'Llega con ganas de demostrar.', ops: [{ op: 'addCardChoice', pool: { club: 'own' }, n: 3 }] },
      { label: 'Ceder a un jugador', text: 'Un traspaso que alivia la plantilla y la caja.', ops: [{ op: 'gold', n: 30 }, { op: 'deckPick', purpose: 'remove', n: 1 }] },
      { label: 'Despedirte', text: 'Tal vez la próxima vez.', ops: [] },
    ],
  },
  {
    id: 'ev.cantera', title: 'Partido de la cantera', acts: [1, 2], art: 'rondo',
    text: 'Los chavales del filial juegan en el campo de al lado. Uno de ellos no para de pedir el balón.',
    options: [
      { label: 'Subirlo al primer equipo', text: 'Un canterano con hambre se une al grupo.', ops: [{ op: 'addCard', def: 'neu.canterano' }] },
      { label: 'Entrenar con ellos', text: 'Los veteranos se pican y mejoran.', ops: [{ op: 'deckPick', purpose: 'upgrade', n: 1 }] },
      { label: 'Seguir con lo tuyo', text: 'No hay tiempo para distracciones.', ops: [{ op: 'heal', n: 5 }] },
    ],
  },
  {
    id: 'ev.apuestas', title: 'La casa de apuestas', acts: [1, 2, 3], art: 'sistema',
    text: 'Un tipo con gafas de sol te ofrece «información privilegiada» sobre el próximo rival.',
    options: [
      { label: 'Apostar 30 de oro', text: 'Los dados están echados.', requires: { gold: 30 }, ops: [{ op: 'gold', n: -30 }, { op: 'random', options: [{ w: 1, text: '¡Acertaste! Doblas la apuesta y algo más.', ops: [{ op: 'gold', n: 75 }] }, { w: 1, text: 'Te la han colado. Ni rastro del tipo.', ops: [] }] }] },
      { label: 'Denunciarlo', text: 'La Federación te lo agradece con un detalle.', ops: [{ op: 'consumible' }] },
      { label: 'Ignorarlo', text: 'Mejor no mezclarse.', ops: [] },
    ],
  },
  {
    id: 'ev.amistoso', title: 'Amistoso benéfico', acts: [1, 2, 3], art: 'contra',
    text: 'Una ONG local organiza un partido benéfico. No cuenta para la liga... pero se juega.',
    options: [
      { label: 'Jugar el amistoso', text: 'Saltáis al campo. Si perdéis, no pasa nada.', ops: [{ op: 'startMatch', tier: 'amistoso' }] },
      { label: 'Donar 25 de oro', text: 'Gesto bonito. El vestuario lo nota.', requires: { gold: 25 }, ops: [{ op: 'gold', n: -25 }, { op: 'deckPick', purpose: 'upgrade', n: 1 }] },
      { label: 'Excusarse', text: 'Hay que descansar.', ops: [{ op: 'heal', n: 4 }] },
    ],
  },
  {
    id: 'ev.presidente', title: 'Reunión con el presidente', acts: [1, 2, 3], art: 'sistema',
    text: 'El presidente te cita en el palco. Fuma un puro y habla de «proyecto».',
    options: [
      { label: 'Pedir fichajes', text: 'Abre la cartera... a cambio de exigir más.', ops: [{ op: 'formaMax', n: -6 }, { op: 'addCardChoice', pool: { club: 'own', rarity: 'rara' }, n: 3 }] },
      { label: 'Pedir dinero', text: 'Te da un sobre. «Que no se entere la prensa».', ops: [{ op: 'gold', n: 90 }, { op: 'addCard', def: 'est.presion_mediatica' }] },
      { label: 'Pedir paciencia', text: 'Asiente sin mucha convicción.', ops: [{ op: 'heal', n: 8 }] },
    ],
  },
  {
    id: 'ev.fiesta', title: 'Fiesta en el vestuario', acts: [1, 2, 3], art: 'remontada',
    text: 'Tras el último partido, alguien ha traído un altavoz. La música suena fuerte.',
    options: [
      { label: 'Unirte a la fiesta', text: 'Moral por las nubes, piernas por los suelos.', ops: [{ op: 'healPct', n: 20 }, { op: 'addCard', def: 'est.cansancio' }, { op: 'addCard', def: 'est.cansancio' }] },
      { label: 'Mandar a todos a dormir', text: 'Disciplina. Mañana se nota.', ops: [{ op: 'formaMax', n: 5 }] },
      { label: 'Organizar una cena', text: 'Pagas tú, pero el grupo se une.', requires: { gold: 20 }, ops: [{ op: 'gold', n: -20 }, { op: 'consumible' }, { op: 'heal', n: 8 }] },
    ],
  },
]
