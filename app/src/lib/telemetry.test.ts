import { beforeEach, describe, expect, it } from 'vitest';

import {
  appendRewardChoice,
  appendRewardOffers,
  buildCardDominanceRows,
  buildRewardChoiceRows,
  buildTelemetryInsights,
  createRunSession,
  loadTelemetryData,
  persistFinishedRun,
  type TelemetryRewardChoice,
  type TelemetryRewardOffer,
  type TelemetryRunSummary,
} from '@/lib/telemetry';

describe('telemetry reward instrumentation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes reward telemetry arrays on new sessions', () => {
    const session = createRunSession('athletic', 3);

    expect(session.rewardOffers).toEqual([]);
    expect(session.rewardChoices).toEqual([]);
  });

  it('appends reward offers and choices to the in-memory session', () => {
    const session = createRunSession('barcelona', 1);
    const offers: TelemetryRewardOffer[] = [
      {
        kind: 'card',
        rewardType: 'combat',
        itemId: 'card_1',
        name: 'Posesion Vertical',
        team: 'barcelona',
        rarity: 'uncommon',
        runId: session.runId,
        act: 1,
        atTurn: 4,
      },
    ];
    const choice: TelemetryRewardChoice = {
      kind: 'card',
      rewardType: 'combat',
      itemId: 'card_1',
      name: 'Posesion Vertical',
      team: 'barcelona',
      rarity: 'uncommon',
      runId: session.runId,
      act: 1,
      atTurn: 4,
    };

    const nextSession = appendRewardChoice(appendRewardOffers(session, offers), choice);

    expect(nextSession.rewardOffers).toHaveLength(1);
    expect(nextSession.rewardChoices).toHaveLength(1);
    expect(nextSession.rewardChoices[0].kind).toBe('card');
  });

  it('persists reward offers and reward choices with the finished run', () => {
    const session = createRunSession('madrid', 5);
    const withOffers = appendRewardOffers(session, [
      {
        kind: 'gold',
        rewardType: 'combat',
        itemId: 'gold_36',
        name: 'Oro directo',
        rarity: 'resource',
        runId: session.runId,
        act: 2,
        atTurn: 8,
      },
    ]);
    const completed = appendRewardChoice(withOffers, {
      kind: 'gold',
      rewardType: 'combat',
      itemId: 'gold_36',
      name: 'Oro directo',
      rarity: 'resource',
      runId: session.runId,
      act: 2,
      atTurn: 8,
    });
    const summary: TelemetryRunSummary = {
      runId: session.runId,
      team: 'madrid',
      ascension: 5,
      startedAt: session.startedAt,
      endedAt: session.startedAt,
      result: 'victory',
      actReached: 2,
      floorsVisited: 8,
      turns: 8,
      totalDamageDealt: 88,
      totalDamageTaken: 20,
      avgDamageDealtPerTurn: 11,
      avgDamageTakenPerTurn: 2.5,
      deckSize: 14,
      attackCards: 6,
      skillCards: 6,
      powerCards: 2,
      relicCount: 3,
      potionCount: 1,
      goldAtEnd: 99,
    };

    persistFinishedRun(completed, summary);
    const data = loadTelemetryData();

    expect(data.runs).toHaveLength(1);
    expect(data.rewardOffers).toHaveLength(1);
    expect(data.rewardChoices).toHaveLength(1);
    expect(data.rewardChoices[0].kind).toBe('gold');
  });

  it('computes dominance rows from reward offers, reward picks, and run outcomes', () => {
    const rows = buildCardDominanceRows({
      runs: [
        {
          runId: 'run_win',
          team: 'athletic',
          ascension: 0,
          startedAt: '2026-03-08T10:00:00.000Z',
          endedAt: '2026-03-08T10:20:00.000Z',
          result: 'victory',
          actReached: 2,
          floorsVisited: 7,
          turns: 10,
          totalDamageDealt: 100,
          totalDamageTaken: 30,
          avgDamageDealtPerTurn: 10,
          avgDamageTakenPerTurn: 3,
          deckSize: 15,
          attackCards: 7,
          skillCards: 6,
          powerCards: 2,
          relicCount: 2,
          potionCount: 1,
          goldAtEnd: 80,
        },
        {
          runId: 'run_loss',
          team: 'athletic',
          ascension: 0,
          startedAt: '2026-03-08T11:00:00.000Z',
          endedAt: '2026-03-08T11:12:00.000Z',
          result: 'defeat',
          actReached: 1,
          floorsVisited: 4,
          turns: 6,
          totalDamageDealt: 42,
          totalDamageTaken: 38,
          avgDamageDealtPerTurn: 7,
          avgDamageTakenPerTurn: 6.33,
          deckSize: 12,
          attackCards: 6,
          skillCards: 5,
          powerCards: 1,
          relicCount: 1,
          potionCount: 0,
          goldAtEnd: 24,
        },
      ],
      rewardOffers: [
        {
          kind: 'card',
          rewardType: 'combat',
          itemId: 'c1',
          name: 'Muro Rojiblanco',
          team: 'athletic',
          rarity: 'common',
          runId: 'run_win',
          act: 1,
          atTurn: 3,
        },
        {
          kind: 'card',
          rewardType: 'combat',
          itemId: 'c2',
          name: 'Muro Rojiblanco',
          team: 'athletic',
          rarity: 'common',
          runId: 'run_loss',
          act: 1,
          atTurn: 3,
        },
        {
          kind: 'card',
          rewardType: 'combat',
          itemId: 'c3',
          name: 'Ajuste Tactico',
          team: 'athletic',
          rarity: 'uncommon',
          runId: 'run_loss',
          act: 1,
          atTurn: 3,
        },
      ],
      cardPicks: [
        {
          id: 'pick_1',
          name: 'Muro Rojiblanco',
          team: 'athletic',
          rarity: 'common',
          source: 'reward',
          runId: 'run_win',
          atTurn: 3,
        },
        {
          id: 'shop_pick',
          name: 'Muro Rojiblanco',
          team: 'athletic',
          rarity: 'common',
          source: 'shop',
          runId: 'run_loss',
          atTurn: 5,
        },
      ],
    });

    expect(rows[0].name).toBe('Muro Rojiblanco');
    expect(rows[0].offers).toBe(2);
    expect(rows[0].picks).toBe(1);
    expect(rows[0].pickrate).toBeCloseTo(0.5, 5);
    expect(rows[0].winrateWhenPicked).toBe(1);
  });

  it('builds reward choice mix rows by count and share', () => {
    const rows = buildRewardChoiceRows([
      {
        kind: 'card',
        rewardType: 'combat',
        itemId: 'card_1',
        name: 'Cobertura',
        team: 'athletic',
        rarity: 'common',
        runId: 'run_1',
        act: 1,
        atTurn: 2,
      },
      {
        kind: 'gold',
        rewardType: 'combat',
        itemId: 'gold_20',
        name: 'Oro directo',
        rarity: 'resource',
        runId: 'run_1',
        act: 1,
        atTurn: 2,
      },
      {
        kind: 'gold',
        rewardType: 'combat',
        itemId: 'gold_22',
        name: 'Oro directo',
        rarity: 'resource',
        runId: 'run_2',
        act: 1,
        atTurn: 2,
      },
      {
        kind: 'skip',
        rewardType: 'combat',
        itemId: 'skip_reward',
        name: 'Saltar recompensa',
        rarity: 'resource',
        runId: 'run_3',
        act: 1,
        atTurn: 2,
      },
    ]);

    expect(rows[0]).toMatchObject({ kind: 'gold', count: 2 });
    expect(rows[0].share).toBeCloseTo(0.5, 5);
    expect(rows.find(row => row.kind === 'skip')?.count).toBe(1);
  });

  it('builds actionable insights for team gaps, dominant cards and reward drift', () => {
    const runs: TelemetryRunSummary[] = [
      {
        runId: 'a_win_1',
        team: 'athletic',
        ascension: 0,
        startedAt: '2026-03-08T09:00:00.000Z',
        endedAt: '2026-03-08T09:20:00.000Z',
        result: 'victory',
        actReached: 3,
        floorsVisited: 12,
        turns: 22,
        totalDamageDealt: 210,
        totalDamageTaken: 60,
        avgDamageDealtPerTurn: 9.5,
        avgDamageTakenPerTurn: 2.7,
        deckSize: 18,
        attackCards: 7,
        skillCards: 8,
        powerCards: 3,
        relicCount: 4,
        potionCount: 1,
        goldAtEnd: 90,
      },
      {
        runId: 'a_win_2',
        team: 'athletic',
        ascension: 0,
        startedAt: '2026-03-08T10:00:00.000Z',
        endedAt: '2026-03-08T10:20:00.000Z',
        result: 'victory',
        actReached: 3,
        floorsVisited: 12,
        turns: 21,
        totalDamageDealt: 204,
        totalDamageTaken: 58,
        avgDamageDealtPerTurn: 9.7,
        avgDamageTakenPerTurn: 2.8,
        deckSize: 18,
        attackCards: 7,
        skillCards: 8,
        powerCards: 3,
        relicCount: 4,
        potionCount: 1,
        goldAtEnd: 84,
      },
      {
        runId: 'a_win_3',
        team: 'athletic',
        ascension: 0,
        startedAt: '2026-03-08T11:00:00.000Z',
        endedAt: '2026-03-08T11:18:00.000Z',
        result: 'victory',
        actReached: 2,
        floorsVisited: 9,
        turns: 18,
        totalDamageDealt: 160,
        totalDamageTaken: 42,
        avgDamageDealtPerTurn: 8.9,
        avgDamageTakenPerTurn: 2.3,
        deckSize: 16,
        attackCards: 7,
        skillCards: 7,
        powerCards: 2,
        relicCount: 3,
        potionCount: 1,
        goldAtEnd: 76,
      },
      {
        runId: 'm_loss_1',
        team: 'madrid',
        ascension: 0,
        startedAt: '2026-03-08T12:00:00.000Z',
        endedAt: '2026-03-08T12:12:00.000Z',
        result: 'defeat',
        actReached: 1,
        floorsVisited: 5,
        turns: 8,
        totalDamageDealt: 49,
        totalDamageTaken: 43,
        avgDamageDealtPerTurn: 6.1,
        avgDamageTakenPerTurn: 5.4,
        deckSize: 13,
        attackCards: 6,
        skillCards: 6,
        powerCards: 1,
        relicCount: 1,
        potionCount: 0,
        goldAtEnd: 28,
      },
      {
        runId: 'm_loss_2',
        team: 'madrid',
        ascension: 0,
        startedAt: '2026-03-08T13:00:00.000Z',
        endedAt: '2026-03-08T13:09:00.000Z',
        result: 'defeat',
        actReached: 1,
        floorsVisited: 4,
        turns: 7,
        totalDamageDealt: 38,
        totalDamageTaken: 40,
        avgDamageDealtPerTurn: 5.4,
        avgDamageTakenPerTurn: 5.7,
        deckSize: 12,
        attackCards: 6,
        skillCards: 5,
        powerCards: 1,
        relicCount: 1,
        potionCount: 0,
        goldAtEnd: 18,
      },
      {
        runId: 'm_loss_3',
        team: 'madrid',
        ascension: 0,
        startedAt: '2026-03-08T14:00:00.000Z',
        endedAt: '2026-03-08T14:08:00.000Z',
        result: 'defeat',
        actReached: 1,
        floorsVisited: 4,
        turns: 6,
        totalDamageDealt: 36,
        totalDamageTaken: 39,
        avgDamageDealtPerTurn: 6,
        avgDamageTakenPerTurn: 6.5,
        deckSize: 12,
        attackCards: 6,
        skillCards: 5,
        powerCards: 1,
        relicCount: 1,
        potionCount: 0,
        goldAtEnd: 16,
      },
    ];

    const insights = buildTelemetryInsights({
      runs,
      cardDominance: [
        {
          key: 'Muro Rojiblanco|athletic|common',
          name: 'Muro Rojiblanco',
          team: 'athletic',
          rarity: 'common',
          offers: 8,
          picks: 6,
          pickrate: 0.75,
          pickedRuns: 4,
          winrateWhenPicked: 0.75,
        },
      ],
      rewardMix: [
        { kind: 'gold', count: 5, share: 0.42 },
        { kind: 'skip', count: 3, share: 0.25 },
        { kind: 'card', count: 4, share: 0.33 },
      ],
    });

    expect(insights.map(insight => insight.id)).toContain('team-gap');
    expect(insights.map(insight => insight.id)).toContain('dominant-card');
    expect(insights.map(insight => insight.id)).toContain('skip-heavy');
    expect(insights.map(insight => insight.id)).toContain('gold-heavy');
  });

  it('falls back to a stable signal when there are no clear alerts', () => {
    const insights = buildTelemetryInsights({
      runs: [
        {
          runId: 'balanced_1',
          team: 'athletic',
          ascension: 0,
          startedAt: '2026-03-08T09:00:00.000Z',
          endedAt: '2026-03-08T09:18:00.000Z',
          result: 'victory',
          actReached: 2,
          floorsVisited: 8,
          turns: 14,
          totalDamageDealt: 120,
          totalDamageTaken: 34,
          avgDamageDealtPerTurn: 8.5,
          avgDamageTakenPerTurn: 2.4,
          deckSize: 15,
          attackCards: 6,
          skillCards: 7,
          powerCards: 2,
          relicCount: 2,
          potionCount: 1,
          goldAtEnd: 55,
        },
        {
          runId: 'balanced_2',
          team: 'barcelona',
          ascension: 0,
          startedAt: '2026-03-08T10:00:00.000Z',
          endedAt: '2026-03-08T10:17:00.000Z',
          result: 'defeat',
          actReached: 2,
          floorsVisited: 8,
          turns: 13,
          totalDamageDealt: 112,
          totalDamageTaken: 41,
          avgDamageDealtPerTurn: 8.6,
          avgDamageTakenPerTurn: 3.1,
          deckSize: 15,
          attackCards: 6,
          skillCards: 7,
          powerCards: 2,
          relicCount: 2,
          potionCount: 1,
          goldAtEnd: 44,
        },
        {
          runId: 'balanced_3',
          team: 'madrid',
          ascension: 0,
          startedAt: '2026-03-08T11:00:00.000Z',
          endedAt: '2026-03-08T11:19:00.000Z',
          result: 'victory',
          actReached: 2,
          floorsVisited: 8,
          turns: 14,
          totalDamageDealt: 116,
          totalDamageTaken: 37,
          avgDamageDealtPerTurn: 8.3,
          avgDamageTakenPerTurn: 2.6,
          deckSize: 15,
          attackCards: 6,
          skillCards: 7,
          powerCards: 2,
          relicCount: 2,
          potionCount: 1,
          goldAtEnd: 48,
        },
        {
          runId: 'balanced_4',
          team: 'athletic',
          ascension: 0,
          startedAt: '2026-03-08T12:00:00.000Z',
          endedAt: '2026-03-08T12:20:00.000Z',
          result: 'defeat',
          actReached: 2,
          floorsVisited: 8,
          turns: 15,
          totalDamageDealt: 109,
          totalDamageTaken: 44,
          avgDamageDealtPerTurn: 7.3,
          avgDamageTakenPerTurn: 2.9,
          deckSize: 15,
          attackCards: 6,
          skillCards: 7,
          powerCards: 2,
          relicCount: 2,
          potionCount: 1,
          goldAtEnd: 42,
        },
        {
          runId: 'balanced_5',
          team: 'barcelona',
          ascension: 0,
          startedAt: '2026-03-08T13:00:00.000Z',
          endedAt: '2026-03-08T13:19:00.000Z',
          result: 'victory',
          actReached: 2,
          floorsVisited: 8,
          turns: 14,
          totalDamageDealt: 118,
          totalDamageTaken: 33,
          avgDamageDealtPerTurn: 8.4,
          avgDamageTakenPerTurn: 2.3,
          deckSize: 15,
          attackCards: 6,
          skillCards: 7,
          powerCards: 2,
          relicCount: 2,
          potionCount: 1,
          goldAtEnd: 46,
        },
      ],
      cardDominance: [
        {
          key: 'Cobertura|athletic|common',
          name: 'Cobertura',
          team: 'athletic',
          rarity: 'common',
          offers: 5,
          picks: 2,
          pickrate: 0.4,
          pickedRuns: 2,
          winrateWhenPicked: 0.5,
        },
      ],
      rewardMix: [
        { kind: 'card', count: 6, share: 0.5 },
        { kind: 'gold', count: 3, share: 0.25 },
        { kind: 'skip', count: 1, share: 0.08 },
        { kind: 'relic', count: 2, share: 0.17 },
      ],
    });

    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({ id: 'stable-signal', tone: 'good' });
  });

  it('loads legacy telemetry payloads without crashing on new arrays', () => {
    localStorage.setItem('climb-the-league-telemetry-v1', JSON.stringify({
      runs: [],
      cardPicks: [],
      relicPicks: [],
      damageTimeline: [],
    }));

    const data = loadTelemetryData();

    expect(data.rewardOffers).toEqual([]);
    expect(data.rewardChoices).toEqual([]);
  });
});
