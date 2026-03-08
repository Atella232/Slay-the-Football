import { createRandomId } from '@/lib/rng';
import type { Card, Relic, TeamType } from '@/types/game';

export type CardPickSource = 'reward' | 'shop' | 'event' | 'generated' | 'other';
export type RelicPickSource = 'reward' | 'shop' | 'treasure' | 'boss' | 'event' | 'other';
export type RunResult = 'victory' | 'defeat' | 'abandoned';
export type TelemetryRewardOfferKind = 'card' | 'relic' | 'potion' | 'gold' | 'boss_relic';
export type TelemetryRewardChoiceKind = TelemetryRewardOfferKind | 'skip';

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

export interface TelemetryRewardOffer {
  kind: TelemetryRewardOfferKind;
  rewardType: 'combat' | 'boss';
  itemId: string;
  name: string;
  team?: Card['team'] | TeamType;
  rarity?: Card['rarity'] | Relic['rarity'] | 'resource';
  runId: string;
  act: number;
  atTurn: number;
}

export interface TelemetryRewardChoice {
  kind: TelemetryRewardChoiceKind;
  rewardType: 'combat' | 'boss';
  itemId: string;
  name: string;
  team?: Card['team'] | TeamType;
  rarity?: Card['rarity'] | Relic['rarity'] | 'resource';
  runId: string;
  act: number;
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
  rewardOffers: TelemetryRewardOffer[];
  rewardChoices: TelemetryRewardChoice[];
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
  rewardOffers: TelemetryRewardOffer[];
  rewardChoices: TelemetryRewardChoice[];
}

export interface TelemetryCardDominanceRow {
  key: string;
  name: string;
  team: Card['team'];
  rarity: Card['rarity'];
  offers: number;
  picks: number;
  pickrate: number;
  pickedRuns: number;
  winrateWhenPicked: number;
}

export interface TelemetryRewardChoiceRow {
  kind: TelemetryRewardChoiceKind;
  count: number;
  share: number;
}

export interface TelemetryInsight {
  id: string;
  tone: 'good' | 'warn' | 'info';
  title: string;
  body: string;
}

const STORAGE_KEY = 'climb-the-league-telemetry-v1';

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function teamLabel(team: TeamType): string {
  if (team === 'athletic') return 'Athletic';
  if (team === 'barcelona') return 'Barcelona';
  return 'Madrid';
}

export function createRunSession(team: TeamType, ascension: number): TelemetryRunSession {
  return {
    runId: createRandomId('run'),
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
    rewardOffers: [],
    rewardChoices: [],
  };
}

function getEmptyData(): TelemetryStoreData {
  return {
    runs: [],
    cardPicks: [],
    relicPicks: [],
    rewardOffers: [],
    rewardChoices: [],
    damageTimeline: [],
  };
}

export function loadTelemetryData(): TelemetryStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyData();
    const parsed = JSON.parse(raw) as Partial<TelemetryStoreData>;
    return {
      runs: parsed.runs || [],
      cardPicks: parsed.cardPicks || [],
      relicPicks: parsed.relicPicks || [],
      rewardOffers: parsed.rewardOffers || [],
      rewardChoices: parsed.rewardChoices || [],
      damageTimeline: parsed.damageTimeline || [],
    };
  } catch {
    return getEmptyData();
  }
}

export function saveTelemetryData(data: TelemetryStoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function appendRewardOffers(session: TelemetryRunSession, offers: TelemetryRewardOffer[]): TelemetryRunSession {
  if (offers.length === 0) return session;
  return {
    ...session,
    rewardOffers: [...session.rewardOffers, ...offers],
  };
}

export function appendRewardChoice(session: TelemetryRunSession, choice: TelemetryRewardChoice): TelemetryRunSession {
  return {
    ...session,
    rewardChoices: [...session.rewardChoices, choice],
  };
}

export function persistFinishedRun(session: TelemetryRunSession, summary: TelemetryRunSummary): void {
  const data = loadTelemetryData();
  data.runs.push(summary);
  data.cardPicks.push(...session.cardPicks);
  data.relicPicks.push(...session.relicPicks);
  data.rewardOffers.push(...session.rewardOffers);
  data.rewardChoices.push(...session.rewardChoices);
  data.damageTimeline.push({
    runId: session.runId,
    points: session.damageByTurn,
  });
  saveTelemetryData(data);
}

export function buildCardDominanceRows(params: {
  runs: TelemetryRunSummary[];
  rewardOffers: TelemetryRewardOffer[];
  cardPicks: TelemetryCardPick[];
}): TelemetryCardDominanceRow[] {
  const runResultById = new Map(params.runs.map(run => [run.runId, run.result]));
  const offerMap = new Map<string, { name: string; team: Card['team']; rarity: Card['rarity']; offers: number }>();
  const pickMap = new Map<string, { picks: number; runIds: Set<string> }>();

  for (const offer of params.rewardOffers) {
    if (offer.kind !== 'card' || !offer.rarity) continue;
    const rarity = offer.rarity as Card['rarity'];
    const team = (offer.team || 'neutral') as Card['team'];
    const key = `${offer.name}|${team}|${rarity}`;
    const current = offerMap.get(key);
    if (current) {
      current.offers += 1;
    } else {
      offerMap.set(key, { name: offer.name, team, rarity, offers: 1 });
    }
  }

  for (const pick of params.cardPicks) {
    if (pick.source !== 'reward') continue;
    const key = `${pick.name}|${pick.team}|${pick.rarity}`;
    const current = pickMap.get(key) || { picks: 0, runIds: new Set<string>() };
    current.picks += 1;
    current.runIds.add(pick.runId);
    pickMap.set(key, current);
  }

  return [...offerMap.entries()]
    .map(([key, offer]) => {
      const pick = pickMap.get(key);
      const pickedRuns = pick ? pick.runIds.size : 0;
      const winsWhenPicked = pick
        ? [...pick.runIds].filter(runId => runResultById.get(runId) === 'victory').length
        : 0;

      return {
        key,
        name: offer.name,
        team: offer.team,
        rarity: offer.rarity,
        offers: offer.offers,
        picks: pick?.picks || 0,
        pickrate: offer.offers > 0 ? (pick?.picks || 0) / offer.offers : 0,
        pickedRuns,
        winrateWhenPicked: pickedRuns > 0 ? winsWhenPicked / pickedRuns : 0,
      };
    })
    .filter(row => row.offers > 0)
    .sort((a, b) => {
      if (b.picks !== a.picks) return b.picks - a.picks;
      if (b.winrateWhenPicked !== a.winrateWhenPicked) return b.winrateWhenPicked - a.winrateWhenPicked;
      return b.pickrate - a.pickrate;
    });
}

export function buildRewardChoiceRows(choices: TelemetryRewardChoice[]): TelemetryRewardChoiceRow[] {
  const total = choices.length;
  const counts = new Map<TelemetryRewardChoiceKind, number>();

  for (const choice of choices) {
    counts.set(choice.kind, (counts.get(choice.kind) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([kind, count]) => ({
      kind,
      count,
      share: total > 0 ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildTelemetryInsights(params: {
  runs: TelemetryRunSummary[];
  cardDominance: TelemetryCardDominanceRow[];
  rewardMix: TelemetryRewardChoiceRow[];
}): TelemetryInsight[] {
  const insights: TelemetryInsight[] = [];
  const totalRuns = params.runs.length;

  if (totalRuns === 0) {
    return [
      {
        id: 'empty-sample',
        tone: 'info',
        title: 'Sin muestra todavia',
        body: 'Juega algunas runs completas para activar alertas de balance y economia.',
      },
    ];
  }

  if (totalRuns < 5) {
    insights.push({
      id: 'sample-size',
      tone: 'info',
      title: 'Muestra corta',
      body: `Solo hay ${totalRuns} runs filtradas. Usa esto como pista, no como conclusion.`,
    });
  }

  const teamRows = ['athletic', 'barcelona', 'madrid']
    .map(team => {
      const teamRuns = params.runs.filter(run => run.team === team);
      const wins = teamRuns.filter(run => run.result === 'victory').length;
      return {
        team: team as TeamType,
        runs: teamRuns.length,
        winrate: teamRuns.length > 0 ? wins / teamRuns.length : 0,
      };
    })
    .filter(row => row.runs >= 3)
    .sort((a, b) => b.winrate - a.winrate);

  if (teamRows.length >= 2) {
    const strongest = teamRows[0];
    const weakest = teamRows[teamRows.length - 1];
    const gap = strongest.winrate - weakest.winrate;

    if (gap >= 0.2) {
      insights.push({
        id: 'team-gap',
        tone: 'warn',
        title: 'Brecha clara entre equipos',
        body: `${teamLabel(strongest.team)} marca ${formatPct(strongest.winrate)} de winrate y ${teamLabel(weakest.team)} cae a ${formatPct(weakest.winrate)} con al menos 3 runs por equipo.`,
      });
    }
  }

  const dominantCard = params.cardDominance.find(card => card.offers >= 6 && card.picks >= 4 && card.pickrate >= 0.6 && card.winrateWhenPicked >= 0.65);
  if (dominantCard) {
    insights.push({
      id: 'dominant-card',
      tone: 'warn',
      title: 'Carta demasiado eficiente',
      body: `${dominantCard.name} acumula ${dominantCard.picks} picks sobre ${dominantCard.offers} ofertas, con ${formatPct(dominantCard.pickrate)} de pickrate y ${formatPct(dominantCard.winrateWhenPicked)} de winrate al llevarla.`,
    });
  }

  const skipRow = params.rewardMix.find(row => row.kind === 'skip');
  if (skipRow && skipRow.count >= 3 && skipRow.share >= 0.18) {
    insights.push({
      id: 'skip-heavy',
      tone: 'warn',
      title: 'Se estan saltando demasiadas recompensas',
      body: `El skip ya representa ${formatPct(skipRow.share)} de las decisiones registradas. Puede haber ofertas flojas o economia demasiado comoda.`,
    });
  }

  const goldRow = params.rewardMix.find(row => row.kind === 'gold');
  if (goldRow && goldRow.count >= 4 && goldRow.share >= 0.4) {
    insights.push({
      id: 'gold-heavy',
      tone: 'info',
      title: 'El oro esta compitiendo demasiado bien',
      body: `El oro supone ${formatPct(goldRow.share)} de las elecciones. Revisa si la curva de shop o el valor medio de carta se ha quedado corta.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'stable-signal',
      tone: 'good',
      title: 'Sin alertas fuertes',
      body: 'La muestra actual no enseña una dominancia evidente por equipo, carta o tipo de recompensa.',
    });
  }

  return insights.slice(0, 4);
}
