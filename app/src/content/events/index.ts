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

  {
    id: 'ev.representante', title: 'El representante', acts: [1, 2, 3], art: 'sistema',
    text: 'Un agente con traje brillante quiere «ayudarte a crecer». Tiene contactos... y comisiones.',
    options: [
      { label: 'Aceptar su fichaje', text: 'Llega una estrella. El agente se lleva su parte.', requires: { gold: 60 }, ops: [{ op: 'gold', n: -60 }, { op: 'addCardChoice', pool: { club: 'any', rarity: 'rara' }, n: 3 }] },
      { label: 'Vender a un suplente', text: 'Negocio redondo para el club.', ops: [{ op: 'deckPick', purpose: 'remove', n: 1 }, { op: 'gold', n: 45 }] },
      { label: 'Echarlo del hotel', text: 'Se va murmurando. El vestuario aplaude.', ops: [{ op: 'heal', n: 6 }] },
    ],
  },
  {
    id: 'ev.lesion', title: 'Lesión en el calentamiento', acts: [1, 2, 3], art: 'estado',
    text: 'Un titular se resiente en el calentamiento. El fisio te mira esperando una decisión.',
    options: [
      { label: 'Que juegue infiltrado', text: 'Aguantará, pero no del todo bien.', ops: [{ op: 'addCard', def: 'est.lesion' }, { op: 'gold', n: 25 }] },
      { label: 'Tratamiento caro', text: 'Pagas al mejor especialista de la ciudad.', requires: { gold: 50 }, ops: [{ op: 'gold', n: -50 }, { op: 'formaMax', n: 4 }] },
      { label: 'Darle descanso', text: 'Juegas con la plantilla corta, pero sana.', ops: [{ op: 'loseForma', n: 6 }, { op: 'deckPick', purpose: 'upgrade', n: 1 }] },
    ],
  },
  {
    id: 'ev.ultras', title: 'La grada de animación', acts: [1, 2, 3], art: 'remontada',
    text: 'Los ultras han preparado un tifo enorme y piden reunirse con el entrenador.',
    options: [
      { label: 'Pagar las bengalas', text: 'El estadio será un infierno para el rival.', requires: { gold: 40 }, ops: [{ op: 'gold', n: -40 }, { op: 'trofeo', id: 'tro.grada' }] },
      { label: 'Saludar desde el césped', text: 'Gesto sencillo. Los jugadores se crecen.', ops: [{ op: 'heal', n: 8 }] },
      { label: 'Pedir calma', text: 'No les sienta bien. Hay pitos en el siguiente partido.', ops: [{ op: 'gold', n: 20 }, { op: 'addCard', def: 'est.presion_mediatica' }] },
    ],
  },
  {
    id: 'ev.var', title: 'Llamada del comité arbitral', acts: [2, 3], art: 'falta',
    text: 'El comité revisa una jugada polémica de tu último partido. Puedes recurrir... o callar.',
    options: [
      { label: 'Recurrir la sanción', text: 'La apelación sale bien: te devuelven la multa y algo más.', requires: { gold: 30 }, ops: [{ op: 'gold', n: -30 }, { op: 'random', options: [{ w: 2, text: 'Recurso aceptado. Te devuelven el doble.', ops: [{ op: 'gold', n: 70 }] }, { w: 1, text: 'Recurso rechazado. Dinero perdido.', ops: [] }] }] },
      { label: 'Aceptar la amarilla', text: 'Una tarjeta te acompañará un tiempo.', ops: [{ op: 'addCard', def: 'est.tarjeta' }, { op: 'consumible' }] },
      { label: 'No decir nada', text: 'Silencio prudente.', ops: [] },
    ],
  },
  {
    id: 'ev.penaltis', title: 'Entrenamiento de penaltis', acts: [1, 2, 3], art: 'disparo',
    text: 'El preparador propone una sesión extra desde los once metros antes de la eliminatoria.',
    options: [
      { label: 'Sesión intensa', text: 'Piernas cansadas, cabeza fría.', ops: [{ op: 'loseForma', n: 5 }, { op: 'deckPick', purpose: 'upgrade', n: 1 }, { op: 'deckPick', purpose: 'upgrade', n: 1 }] },
      { label: 'Sesión ligera', text: 'Lo justo para afinar.', ops: [{ op: 'deckPick', purpose: 'upgrade', n: 1 }] },
      { label: 'Saltársela', text: 'Prefieres descansar.', ops: [{ op: 'heal', n: 7 }] },
    ],
  },
  {
    id: 'ev.mercado_invierno', title: 'Mercado de invierno', acts: [2, 3], art: 'cambio',
    text: 'Se abre la ventana de fichajes. El director deportivo te enseña dos opciones.',
    options: [
      { label: 'Cambiar un jugador', text: 'Uno sale, otro entra.', ops: [{ op: 'deckPick', purpose: 'transform', n: 1 }] },
      { label: 'Fichar un neutral de nivel', text: 'Llega un profesional fiable.', requires: { gold: 45 }, ops: [{ op: 'gold', n: -45 }, { op: 'addCardChoice', pool: { club: 'neutral' }, n: 3 }] },
      { label: 'Cerrar el mercado', text: 'El grupo está bien como está.', ops: [{ op: 'gold', n: 25 }] },
    ],
  },
  {
    id: 'ev.autobus', title: 'Avería del autobús', acts: [1, 2, 3], art: 'autobus',
    text: 'El autobús del equipo se queda tirado en mitad de la autovía. Faltan horas para el partido.',
    options: [
      { label: 'Pagar un taxi para todos', text: 'Caro, pero llegáis frescos.', requires: { gold: 35 }, ops: [{ op: 'gold', n: -35 }, { op: 'heal', n: 10 }] },
      { label: 'Ir andando hasta el pueblo', text: 'Llegáis agotados... y unidos.', ops: [{ op: 'loseForma', n: 7 }, { op: 'addCard', def: 'neu.canterano' }] },
      { label: 'Esperar a la grúa', text: 'Calentamiento en el arcén.', ops: [{ op: 'addCard', def: 'est.cansancio' }] },
    ],
  },
  {
    id: 'ev.patrocinador', title: 'Nuevo patrocinador', acts: [1, 2, 3], art: 'sistema',
    text: 'Una marca de bebidas quiere su logo en vuestra camiseta. Pagan bien, pero exigen promoción.',
    options: [
      { label: 'Firmar', text: 'Dinero fresco y algún regalo.', ops: [{ op: 'gold', n: 70 }, { op: 'consumible', id: 'con.bebida' }, { op: 'addCard', def: 'est.presion_mediatica' }] },
      { label: 'Negociar mejor', text: 'Aceptan la mitad, sin exigencias.', ops: [{ op: 'gold', n: 35 }] },
      { label: 'Rechazar', text: 'La camiseta sigue limpia. La afición lo valora.', ops: [{ op: 'formaMax', n: 3 }] },
    ],
  },
  {
    id: 'ev.leyenda', title: 'Visita de una leyenda', acts: [2, 3], art: 'remontada',
    text: 'Una leyenda del club baja al vestuario. Los jóvenes no se atreven ni a mirarle.',
    options: [
      { label: 'Pedirle una charla', text: 'Sus palabras se quedan grabadas.', ops: [{ op: 'deckPick', purpose: 'upgrade', n: 1 }, { op: 'heal', n: 5 }] },
      { label: 'Pedirle consejo táctico', text: 'Te enseña un viejo truco.', ops: [{ op: 'addCardChoice', pool: { club: 'own', rarity: 'poco' }, n: 3 }] },
      { label: 'Foto y autógrafos', text: 'Moral alta para todos.', ops: [{ op: 'formaMax', n: 4 }] },
    ],
  },
  {
    id: 'ev.cesped', title: 'Césped en mal estado', acts: [1, 2], art: 'despeje',
    text: 'El campo del próximo rival parece un patatal. Hay que adaptar el plan.',
    options: [
      { label: 'Jugar en largo', text: 'Balones al espacio y a correr.', ops: [{ op: 'addCard', def: 'neu.tiro_lejano' }] },
      { label: 'Duplicar al más fiable', text: 'El que nunca falla, por partida doble.', ops: [{ op: 'deckPick', purpose: 'duplicate', n: 1 }] },
      { label: 'Ignorarlo', text: 'Fútbol es fútbol.', ops: [{ op: 'gold', n: 15 }] },
    ],
  },
  {
    id: 'ev.tunel', title: 'Bronca en el túnel', acts: [2, 3], art: 'falta',
    text: 'En el túnel de vestuarios, un rival provoca a tu capitán. La tensión se corta con cuchillo.',
    options: [
      { label: 'Plantar cara', text: 'El equipo sale encendido... y apercibido.', ops: [{ op: 'addCard', def: 'est.tarjeta' }, { op: 'trofeo', tier: 'comun' }] },
      { label: 'Separarlos', text: 'Eres el adulto de la habitación.', ops: [{ op: 'heal', n: 8 }] },
      { label: 'Usarlo como motivación', text: 'Lo apuntas en la pizarra.', ops: [{ op: 'gold', n: 20 }, { op: 'deckPick', purpose: 'upgrade', n: 1 }] },
    ],
  },
  {
    id: 'ev.gira', title: 'Gira de pretemporada', acts: [1], art: 'tiki',
    text: 'Os invitan a un torneo veraniego al otro lado del mundo. Mucho viaje, mucho dinero.',
    options: [
      { label: 'Ir a la gira', text: 'Caja llena, piernas cargadas.', ops: [{ op: 'gold', n: 80 }, { op: 'addCard', def: 'est.cansancio' }, { op: 'addCard', def: 'est.cansancio' }] },
      { label: 'Concentración en la montaña', text: 'Altitud, sudor y kilómetros.', ops: [{ op: 'formaMax', n: 6 }, { op: 'loseForma', n: 4 }] },
      { label: 'Quedarse en casa', text: 'Entrenamientos tranquilos.', ops: [{ op: 'deckPick', purpose: 'upgrade', n: 1 }] },
    ],
  },
]
