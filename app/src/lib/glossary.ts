import type { Enemy, Intent } from '@/types/game';

export interface GlossaryEntry {
  title: string;
  shortLabel: string;
  description: string;
}

export interface IntentPresentation {
  badge: string;
  headline: string;
  detail: string;
  severity: 'low' | 'medium' | 'high' | 'support';
}

const glossaryEntries: Record<string, GlossaryEntry> = {
  exhaust: {
    title: 'Exhaust',
    shortLabel: 'Exhaust',
    description: 'La carta sale de la rotacion del combate actual y va al exilio.',
  },
  weak: {
    title: 'Debil',
    shortLabel: 'Debil',
    description: 'Reduce el impacto ofensivo del objetivo durante sus proximos usos.',
  },
  vulnerable: {
    title: 'Vulnerable',
    shortLabel: 'Vulnerable',
    description: 'El objetivo recibe mas dano de las siguientes fuentes ofensivas.',
  },
  strength: {
    title: 'Fuerza',
    shortLabel: 'Fuerza',
    description: 'Aumenta el dano base de los ataques del portador.',
  },
  block: {
    title: 'Bloqueo',
    shortLabel: 'Bloqueo',
    description: 'Absorbe dano antes de que la vida del objetivo baje.',
  },
  garra: {
    title: 'Garra',
    shortLabel: 'Garra',
    description: 'Recurso del Athletic para convertir defensa y resistencia en ventaja.',
  },
  posesion: {
    title: 'Posesion',
    shortLabel: 'Posesion',
    description: 'Recurso del Barca para encadenar skills y valor por secuencia.',
  },
  momentum: {
    title: 'Momentum',
    shortLabel: 'Momentum',
    description: 'Recurso del Madrid para preparar ventanas cortas de burst.',
  },
  intent_attack: {
    title: 'Intencion de ataque',
    shortLabel: 'ATK',
    description: 'El enemigo planea infligir dano directo en su proxima accion.',
  },
  intent_defend: {
    title: 'Intencion de defensa',
    shortLabel: 'DEF',
    description: 'El enemigo planea ganar bloqueo en su siguiente accion.',
  },
  intent_buff: {
    title: 'Intencion de mejora',
    shortLabel: 'BUF',
    description: 'El enemigo va a potenciarse o subir su ritmo de juego.',
  },
  intent_debuff: {
    title: 'Intencion de debuff',
    shortLabel: 'DBF',
    description: 'El enemigo va a aplicar un efecto negativo al jugador.',
  },
};

const statusAliases: Record<string, string> = {
  debil: 'weak',
  'débil': 'weak',
  weak: 'weak',
  vulnerable: 'vulnerable',
  fuerza: 'strength',
  strength: 'strength',
  block: 'block',
  bloqueo: 'block',
  garra: 'garra',
  posesion: 'posesion',
  posesión: 'posesion',
  momentum: 'momentum',
  exhaust: 'exhaust',
};

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function getGlossaryEntry(key: string): GlossaryEntry | null {
  const normalized = normalizeKey(key);
  const entryKey = statusAliases[normalized] ?? normalized;
  return glossaryEntries[entryKey] ?? null;
}

export function getStatusEntry(id?: string, name?: string): GlossaryEntry | null {
  if (id) {
    const fromId = getGlossaryEntry(id);
    if (fromId) return fromId;
  }
  if (name) {
    return getGlossaryEntry(name);
  }
  return null;
}

export function getIntentEntry(intentType: Intent['type']): GlossaryEntry | null {
  return getGlossaryEntry(`intent_${intentType}`);
}

export function getIntentPresentation(enemy: Enemy): IntentPresentation {
  const { intent } = enemy;

  if (intent.type === 'attack') {
    const damage = intent.value ?? 0;
    return {
      badge: `ATK ${damage}`,
      headline: `Ataque previsto ${damage}`,
      detail: intent.description,
      severity: damage >= 18 ? 'high' : damage >= 10 ? 'medium' : 'low',
    };
  }

  if (intent.type === 'defend') {
    const block = intent.value ?? 0;
    return {
      badge: `DEF ${block}`,
      headline: `Bloqueo previsto ${block}`,
      detail: intent.description,
      severity: block >= 15 ? 'medium' : 'support',
    };
  }

  if (intent.type === 'buff') {
    const amount = intent.value ?? 0;
    return {
      badge: amount > 0 ? `BUF +${amount}` : 'BUF',
      headline: amount > 0 ? `Mejora prevista +${amount}` : 'Mejora prevista',
      detail: intent.description,
      severity: 'support',
    };
  }

  if (intent.type === 'debuff') {
    const amount = intent.value ?? 0;
    return {
      badge: amount > 0 ? `DBF ${amount}` : 'DBF',
      headline: amount > 0 ? `Debuff previsto ${amount}` : 'Debuff previsto',
      detail: intent.description,
      severity: amount >= 3 ? 'medium' : 'support',
    };
  }

  return {
    badge: '...',
    headline: 'Intencion oculta',
    detail: intent.description,
    severity: 'low',
  };
}