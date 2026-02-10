import type { GameEvent } from '@/types/game';

export const allEvents: GameEvent[] = [
    {
        id: 'rueda_prensa',
        title: 'Rueda de Prensa',
        description: 'Los periodistas te acorralan con preguntas difíciles sobre tu último partido. ¿Cómo reaccionas?',
        image: '🎤',
        options: [
            {
                text: 'Responder con calma',
                effect: {
                    type: 'heal',
                    value: 10,
                    description: 'Recupera 10 HP.'
                }
            },
            {
                text: 'Generar polémica',
                effect: {
                    type: 'gold',
                    value: 50,
                    description: 'Gana 50 de oro.'
                }
            },
            {
                text: 'Ignorarlos',
                effect: {
                    type: 'max_hp',
                    value: -5,
                    description: 'Pierde 5 de HP Máximo, pero te quitas estrés (Elimina una carta).',
                }
            }
        ]
    },
    {
        id: 'ojeador',
        title: 'El Ojeador',
        description: 'Un ojeador de un equipo rival te ofrece un trato por uno de tus jugadores suplentes.',
        image: '🕵️',
        options: [
            {
                text: 'Vender jugador',
                effect: {
                    type: 'remove_card',
                    value: 1,
                    description: 'Elimina una carta de tu mazo. Gana 30 de oro.'
                }
            },
            {
                text: 'Rechazar oferta',
                effect: {
                    type: 'heal',
                    value: 0,
                    description: 'No pasa nada.'
                }
            }
        ]
    },
    {
        id: 'apuestas',
        title: 'Apuestas Clandestinas',
        description: 'Te encuentras con unos aficionados apostando sobre el próximo partido.',
        image: '🎲',
        options: [
            {
                text: 'Apostar a lo seguro',
                condition: { type: 'gold_min', value: 20 },
                effect: {
                    type: 'gold',
                    value: 40, // Net +20
                    description: 'Paga 20 oro, gana 40 oro.'
                }
            },
            {
                text: 'Apostar fuerte',
                condition: { type: 'gold_min', value: 50 },
                effect: {
                    type: 'relic',
                    description: 'Paga 50 oro, gana una Reliquia aleatoria.'
                }
            },
            {
                text: 'Alejarse',
                effect: { type: 'gold', value: 0, description: 'Te vas sin hacer nada.' }
            }
        ]
    }
];
