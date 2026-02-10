import type { Card, Relic, TeamType } from '@/types/game';

export type CardPickSource = 'reward' | 'shop' | 'event' | 'generated' | 'other';
export type RelicPickSource = 'reward' | 'shop' | 'treasure' | 'boss' | 'event' | 'other';
export type RunResult = 'victory' | 'defeat' | 'abandoned';

export interface TelemetryTurnDamage {
  turn: number;
  dealt: number;
  taken: number;
}

export interface TelemetryCardPick {
  id: string;
  name: string;
  team: Card['team'];
  rarity: Card['rarity'];
  source: CardPickSource;
  runId: string;
  atTurn: number;
}

export interface TelemetryRelicPick {
  id: string;
  name: string;
  rarity: Relic['rarity'];
  team?: TeamType;
  source: RelicPickSource;
  runId: string;
  atTurn: number;
}

export interface TelemetryRunSummary {
  runId: string;
  team: TeamType;
  ascension: number;
  startedAt: string;
  endedAt: string;
  result: RunResult;
  actReached: number;
  floorsVisited: number;
  turns: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  avgDamageDealtPerTurn: number;
  avgDamageTakenPerTurn: number;
  deckSize: number;
  attackCards: number;
  skillCards: number;
  powerCards: number;
  relicCount: number;
  potionCount: number;
  goldAtEnd: number;
}

export interface TelemetryStoreData {
  runs: TelemetryRunSummary[];
  cardPicks: TelemetryCardPick[];
  relicPicks: TelemetryRelicPick[];
  damageTimeline: Array<{
    runId: string;
    points: TelemetryTurnDamage[];
  }>;
}

export interface TelemetryRunSession {
  runId: string;
  team: TeamType;
  ascension: number;
  startedAt: string;
  actReached: number;
  floorsVisited: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  turnDamageDealt: number;
  turnDamageTaken: number;
  turns: number;
  damageByTurn: TelemetryTurnDamage[];
  cardPicks: TelemetryCardPick[];
  relicPicks: TelemetryRelicPick[];
}

const STORAGE_KEY = 'climb-the-league-telemetry-v1';

export function createRunSession(team: TeamType, ascension: number): TelemetryRunSession {
  return {
    runId: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    team,
    ascension,
    startedAt: new Date().toISOString(),
    actReached: 1,
    floorsVisited: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    turnDamageDealt: 0,
    turnDamageTaken: 0,
    turns: 0,
    damageByTurn: [],
    cardPicks: [],
    relicPicks: [],
  };
}

function getEmptyData(): TelemetryStoreData {
  return {
    runs: [],
    cardPicks: [],
    relicPicks: [],
    damageTimeline: [],
  };
}

export function loadTelemetryData(): TelemetryStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyData();
    const parsed = JSON.parse(raw) as TelemetryStoreData;
    return {
      runs: parsed.runs || [],
      cardPicks: parsed.cardPicks || [],
      relicPicks: parsed.relicPicks || [],
      damageTimeline: parsed.damageTimeline || [],
    };
  } catch {
    return getEmptyData();
  }
}

export function saveTelemetryData(data: TelemetryStoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function persistFinishedRun(session: TelemetryRunSession, summary: TelemetryRunSummary): void {
  const data = loadTelemetryData();
  data.runs.push(summary);
  data.cardPicks.push(...session.cardPicks);
  data.relicPicks.push(...session.relicPicks);
  data.damageTimeline.push({
    runId: session.runId,
    points: session.damageByTurn,
  });
  saveTelemetryData(data);
}

