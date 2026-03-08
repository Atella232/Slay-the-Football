import type { Card } from '@/types/game';

type CardArtLookup = Pick<Card, 'id' | 'name' | 'team'>;

const CARD_ART_BY_ID: Record<string, string> = {
  strike: '/card-art/golpeo-horizontal.png',
  athletic_strike: '/card-art/golpeo-horizontal.png',
  defend: '/card-art/cobertura-horizontal.png',
  athletic_defend: '/card-art/cobertura-horizontal.png',
  barca_strike: '/card-art/pase-corto-horizontal-v2.png',
  barca_defend: '/card-art/posicionamiento-horizontal-v2.png',
  madrid_strike: '/card-art/disparo-horizontal-v2.png',
  madrid_defend: '/card-art/marcaje-horizontal-v2.png',
  todo_o_nada: '/card-art/todo-o-nada-horizontal.png',
  muro_rojiblanco: '/card-art/muro-rojiblanco-horizontal.png',
  tiki_taka: '/card-art/tiki-taka-horizontal.png',
  galactico: '/card-art/galactico-horizontal.png',
  entrada_dura: '/card-art/entrada-dura-horizontal.png',
  lectura_partido: '/card-art/lectura-partido-horizontal.png',
  cambio_banda: '/card-art/cambio-banda-horizontal.png',
  pase_seguro: '/card-art/pase-seguro-horizontal.png',
  falta_tactica: '/card-art/falta-tactica-horizontal.png',
  toque_balon: '/card-art/toque-balon-horizontal.png',
  contraataque: '/card-art/contraataque-horizontal-v2.png',
  contraataque_madrid: '/card-art/contraataque-horizontal-v2.png',
};

const CARD_ART_BY_NAME: Record<string, string> = {
  golpeo: '/card-art/golpeo-horizontal.png',
  cobertura: '/card-art/cobertura-horizontal.png',
  'todo o nada': '/card-art/todo-o-nada-horizontal.png',
  'muro rojiblanco': '/card-art/muro-rojiblanco-horizontal.png',
  'tiki-taka': '/card-art/tiki-taka-horizontal.png',
  galactico: '/card-art/galactico-horizontal.png',
  'entrada dura': '/card-art/entrada-dura-horizontal.png',
  'lectura de partido': '/card-art/lectura-partido-horizontal.png',
  'cambio de banda': '/card-art/cambio-banda-horizontal.png',
  'pase seguro': '/card-art/pase-seguro-horizontal.png',
  'falta táctica': '/card-art/falta-tactica-horizontal.png',
  'toque de balon': '/card-art/toque-balon-horizontal.png',
  contraataque: '/card-art/contraataque-horizontal-v2.png',
  'pase corto': '/card-art/pase-corto-horizontal-v2.png',
  posicionamiento: '/card-art/posicionamiento-horizontal-v2.png',
  disparo: '/card-art/disparo-horizontal-v2.png',
  marcaje: '/card-art/marcaje-horizontal.png',
};

const CARD_ART_KEYS = Object.keys(CARD_ART_BY_ID).sort((left, right) => right.length - left.length);

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function getCardArtSrc(card: CardArtLookup): string | null {
  for (const key of CARD_ART_KEYS) {
    if (card.id === key || card.id.startsWith(`${key}_`) || card.id.startsWith(`generated_${key}`)) {
      return CARD_ART_BY_ID[key];
    }
  }

  if (card.id.startsWith('strike_')) {
    if (card.team === 'barcelona') return CARD_ART_BY_ID.barca_strike;
    if (card.team === 'madrid') return CARD_ART_BY_ID.madrid_strike;
    return CARD_ART_BY_ID.strike;
  }

  if (card.id.startsWith('defend_')) {
    if (card.team === 'barcelona') return CARD_ART_BY_ID.barca_defend;
    if (card.team === 'madrid') return CARD_ART_BY_ID.madrid_defend;
    return CARD_ART_BY_ID.defend;
  }

  return CARD_ART_BY_NAME[normalizeName(card.name)] ?? null;
}

