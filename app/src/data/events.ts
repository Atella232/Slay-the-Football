import type { GameEvent } from '@/types/game';

export const allEvents: GameEvent[] = [
  {
    id: 'rueda_prensa',
    title: 'Rueda de Prensa',
    description: 'Los focos aprietan tras el ultimo partido y cualquier respuesta puede marcar el ambiente de la semana.',
    image: 'MIC',
    options: [
      {
        text: 'Responder con calma',
        effect: {
          type: 'heal',
          value: 10,
          description: 'Recupera 10 HP.',
        },
      },
      {
        text: 'Generar polemica',
        effect: {
          type: 'gold',
          value: 50,
          description: 'Gana 50 de oro.',
        },
      },
      {
        text: 'Cerrar filas en el vestuario',
        effect: {
          type: 'max_hp',
          value: -5,
          removeCard: true,
          description: 'Pierde 5 de HP maximo. Elimina una carta.',
        },
      },
    ],
  },
  {
    id: 'ojeador',
    title: 'El Ojeador',
    description: 'Un club rival pregunta por una pieza secundaria de tu plantilla y pone dinero encima de la mesa.',
    image: 'EYE',
    options: [
      {
        text: 'Vender fondo de armario',
        effect: {
          type: 'remove_card',
          bonusGold: 30,
          description: 'Elimina una carta. Gana 30 de oro.',
        },
      },
      {
        text: 'Pedir apoyo medico',
        effect: {
          type: 'heal',
          value: 8,
          description: 'Recupera 8 HP.',
        },
      },
      {
        text: 'Rechazar la oferta',
        effect: {
          type: 'gold',
          value: 0,
          description: 'No pasa nada.',
        },
      },
    ],
  },
  {
    id: 'apuestas',
    title: 'Apuestas Clandestinas',
    description: 'El entorno del estadio hierve con una apuesta que promete dinero rapido o problemas serios.',
    image: 'BET',
    options: [
      {
        text: 'Apostar a lo seguro',
        effect: {
          type: 'gold',
          value: 40,
          costGold: 20,
          description: 'Paga 20 de oro y gana 40 de oro.',
        },
      },
      {
        text: 'Ir con todo',
        condition: { type: 'gold_min', value: 50 },
        effect: {
          type: 'relic',
          costGold: 50,
          description: 'Paga 50 de oro y gana una reliquia aleatoria.',
        },
      },
      {
        text: 'Marcharte',
        effect: {
          type: 'gold',
          value: 0,
          description: 'Te vas sin intervenir.',
        },
      },
    ],
  },
  {
    id: 'cuerpo_tecnico',
    title: 'Reunion del Cuerpo Tecnico',
    description: 'La semana deja dudas tacticas y el staff propone una decision con impacto inmediato sobre la plantilla.',
    image: 'COACH',
    options: [
      {
        text: 'Sesion extra de video',
        effect: {
          type: 'remove_card',
          description: 'Elimina una carta.',
        },
      },
      {
        text: 'Arenga motivacional',
        effect: {
          type: 'heal',
          value: 12,
          description: 'Recupera 12 HP.',
        },
      },
      {
        text: 'Negociar una prima',
        effect: {
          type: 'gold',
          value: 35,
          description: 'Gana 35 de oro.',
        },
      },
    ],
  },
    {
    id: 'patrocinador',
    title: 'Patrocinador Principal',
    description: 'La marca quiere visibilidad ya, pero tambien esta dispuesta a invertir si aceptas sus condiciones.',
    image: 'AD',
    options: [
      {
        text: 'Grabar la campana',
        effect: {
          type: 'gold',
          value: 75,
          description: 'Gana 75 de oro.',
        },
      },
      {
        text: 'Invertir en instalaciones',
        condition: { type: 'gold_min', value: 30 },
        effect: {
          type: 'max_hp',
          value: 6,
          costGold: 30,
          description: 'Paga 30 de oro. Gana 6 de HP maximo.',
        },
      },
      {
        text: 'Firmar clausula de rendimiento',
        effect: {
          type: 'relic',
          description: 'Gana una reliquia aleatoria.',
        },
      },
    ],
  },
  {
    id: 'cantera_abierta',
    title: 'Cantera Abierta',
    description: 'Los entrenadores de base ofrecen una ayuda puntual: aligerar plantilla o dar aire fresco al grupo.',
    image: 'KID',
    options: [
      {
        text: 'Promocionar a un juvenil',
        effect: {
          type: 'max_hp',
          value: 5,
          description: 'Gana 5 de HP maximo.',
        },
      },
      {
        text: 'Hacer hueco en el vestuario',
        effect: {
          type: 'remove_card',
          bonusGold: 20,
          description: 'Elimina una carta. Gana 20 de oro.',
        },
      },
      {
        text: 'Mantener el bloque',
        effect: {
          type: 'heal',
          value: 6,
          description: 'Recupera 6 HP.',
        },
      },
    ],
  },
  {
    id: 'noche_concentracion',
    title: 'Noche de Concentracion',
    description: 'El hotel ofrece una noche tranquila, pero cada miembro del staff empuja hacia un plan distinto.',
    image: 'HOTEL',
    options: [
      {
        text: 'Dormir ocho horas',
        effect: {
          type: 'heal',
          value: 14,
          description: 'Recupera 14 HP.',
        },
      },
      {
        text: 'Repasar automatismos',
        effect: {
          type: 'relic',
          description: 'Gana una reliquia aleatoria.',
        },
      },
      {
        text: 'Romper la rutina',
        effect: {
          type: 'gold',
          value: 25,
          description: 'Gana 25 de oro.',
        },
      },
    ],
  },
  {
    id: 'mercado_invierno',
    title: 'Mercado de Invierno',
    description: 'Se mueve el telefono sin parar y aparecen oportunidades rapidas para reordenar la plantilla.',
    image: 'MKT',
    options: [
      {
        text: 'Vender un descarte',
        effect: {
          type: 'remove_card',
          bonusGold: 40,
          description: 'Elimina una carta. Gana 40 de oro.',
        },
      },
      {
        text: 'Cerrar patrocinio express',
        effect: {
          type: 'gold',
          value: 60,
          description: 'Gana 60 de oro.',
        },
      },
      {
        text: 'Fichar un veterano util',
        condition: { type: 'gold_min', value: 45 },
        effect: {
          type: 'relic',
          costGold: 45,
          description: 'Paga 45 de oro. Gana una reliquia aleatoria.',
        },
      },
    ],
  },
  {
    id: 'aficion_desplazada',
    title: 'Aficion Desplazada',
    description: 'La grada visitante ya esta cantando antes del partido y te obliga a decidir como responder.',
    image: 'BUS',
    options: [
      {
        text: 'Devolver el apoyo',
        effect: {
          type: 'max_hp',
          value: 4,
          description: 'Gana 4 de HP maximo.',
        },
      },
      {
        text: 'Subirte al autobus con ellos',
        effect: {
          type: 'heal',
          value: 10,
          description: 'Recupera 10 HP.',
        },
      },
      {
        text: 'Aceptar regalos',
        effect: {
          type: 'gold',
          value: 30,
          description: 'Gana 30 de oro.',
        },
      },
    ],
  },
  {
    id: 'fisios',
    title: 'Sala de Fisios',
    description: 'Los recuperadores detectan fatiga acumulada, pero tambien una ventana para mejorar el fisico.',
    image: 'MED',
    options: [
      {
        text: 'Tratamiento completo',
        effect: {
          type: 'heal',
          value: 18,
          description: 'Recupera 18 HP.',
        },
      },
      {
        text: 'Plan de fuerza especifico',
        effect: {
          type: 'max_hp',
          value: 7,
          description: 'Gana 7 de HP maximo.',
        },
      },
      {
        text: 'Ahorrar presupuesto',
        effect: {
          type: 'gold',
          value: 30,
          description: 'Gana 30 de oro.',
        },
      },
    ],
  },
  {
    id: 'derbi_caliente',
    title: 'Derbi Caliente',
    description: 'La previa del derbi se complica y cualquier decision puede dejar secuelas o crear una ventaja rara.',
    image: 'RIV',
    options: [
      {
        text: 'Pagar la multa antes de tiempo',
        effect: {
          type: 'gold',
          value: -25,
          description: 'Pierde 25 de oro.',
        },
      },
      {
        text: 'Bajar revoluciones',
        effect: {
          type: 'heal',
          value: 9,
          description: 'Recupera 9 HP.',
        },
      },
      {
        text: 'Canalizar la tension',
        condition: { type: 'hp_min', value: 20 },
        effect: {
          type: 'relic',
          description: 'Gana una reliquia aleatoria.',
        },
      },
    ],
  },
  {
    id: 'pretemporada_exigente',
    title: 'Pretemporada Exigente',
    description: 'Una sesion extra deja al grupo al limite, pero tambien puede subir el techo del equipo para el resto de la run.',
    image: 'SUN',
    options: [
      {
        text: 'Dobles sesiones',
        condition: { type: 'hp_min', value: 25 },
        effect: {
          type: 'max_hp',
          value: 8,
          description: 'Gana 8 de HP maximo.',
        },
      },
      {
        text: 'Cuidar las piernas',
        effect: {
          type: 'heal',
          value: 12,
          description: 'Recupera 12 HP.',
        },
      },
      {
        text: 'Vender amistosos',
        effect: {
          type: 'gold',
          value: 45,
          description: 'Gana 45 de oro.',
        },
      },
    ],
  },
];


