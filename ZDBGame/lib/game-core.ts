import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { saveGameEvent, saveNPCMemory } from '@/lib/data';
import { aiCopilotDealSuggestion, aiCounterStrategyShift, aiFlavorDealOutcome, aiGenerateDomesticScenario, aiNarrateRound } from '@/lib/game-ai';
import type {
  Commodity,
  Deal,
  DealSuggestion,
  DomesticDecisionRecord,
  DomesticScenario,
  Difficulty,
  GameMetrics,
  GameSession,
  MarketState,
  Nation,
  NationId,
  ProgressionProfile,
  RoundMission,
  RoundNarration,
  RoundOutcome,
  TradeCorridor,
  TurnEvent,
  TurnEventRecord,
} from '@/lib/game-types';

const DATA_DIR = path.join(process.cwd(), '.data');
const COMMODITIES: Commodity[] = ['energy', 'food', 'tech', 'rare_earths'];
const NATION_IDS: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];

const COLLECTIONS = {
  sessions: 'game_sessions',
  progression: 'game_progression',
  nationMemory: 'nation_memory',
  trustHistory: 'trust_history',
  globalState: 'global_world_state',
} as const;

const BASE_DEMAND: Record<Commodity, number> = {
  energy: 14,
  food: 12,
  tech: 11,
  rare_earths: 10,
};

const BASE_MARKET: Record<Commodity, number> = {
  energy: 100,
  food: 70,
  tech: 130,
  rare_earths: 160,
};

const BASE_PLAYER: Record<Commodity, number> = {
  energy: 18,
  food: 18,
  tech: 18,
  rare_earths: 18,
};

const DIFFICULTY_CONFIG: Record<Difficulty, { maxRounds: number; thresholdBonus: number; scoreMultiplier: number; varianceScale: number }> = {
  analyst: { maxRounds: 5, thresholdBonus: 0, scoreMultiplier: 1, varianceScale: 0.9 },
  director: { maxRounds: 6, thresholdBonus: 0.06, scoreMultiplier: 1.2, varianceScale: 1.1 },
  grandmaster: { maxRounds: 7, thresholdBonus: 0.12, scoreMultiplier: 1.35, varianceScale: 1.3 },
};

const NATIONS: Record<NationId, Omit<Nation, 'trustScore' | 'pressure'>> = {
  usa: {
    id: 'usa',
    name: 'United States',
    publicObjective: 'Stabilize advanced manufacturing and energy costs',
    hiddenAgenda: 'Lock in tech and rare-earth dominance',
    bargainingStyle: 'hardline',
    riskTolerance: 0.35,
    priorityCommodity: 'tech',
    inventory: { energy: 22, food: 18, tech: 26, rare_earths: 11 },
    publicNeeds: { energy: 14, food: 12, tech: 12, rare_earths: 9 },
    publicStability: 66,
  },
  china: {
    id: 'china',
    name: 'China',
    publicObjective: 'Maintain export momentum while reducing volatility',
    hiddenAgenda: 'Increase processing control in strategic commodities',
    bargainingStyle: 'opportunistic',
    riskTolerance: 0.58,
    priorityCommodity: 'rare_earths',
    inventory: { energy: 14, food: 16, tech: 24, rare_earths: 28 },
    publicNeeds: { energy: 13, food: 12, tech: 11, rare_earths: 10 },
    publicStability: 69,
  },
  eu: {
    id: 'eu',
    name: 'EU Bloc',
    publicObjective: 'Keep supply chains resilient and contract risk low',
    hiddenAgenda: 'Diversify concentrated dependencies quickly',
    bargainingStyle: 'balanced',
    riskTolerance: 0.25,
    priorityCommodity: 'energy',
    inventory: { energy: 10, food: 20, tech: 21, rare_earths: 9 },
    publicNeeds: { energy: 14, food: 13, tech: 11, rare_earths: 9 },
    publicStability: 64,
  },
  india: {
    id: 'india',
    name: 'India',
    publicObjective: 'Sustain growth through affordable imports',
    hiddenAgenda: 'Trade demand for long-term industrial leverage',
    bargainingStyle: 'opportunistic',
    riskTolerance: 0.52,
    priorityCommodity: 'food',
    inventory: { energy: 12, food: 24, tech: 14, rare_earths: 10 },
    publicNeeds: { energy: 12, food: 14, tech: 10, rare_earths: 8 },
    publicStability: 62,
  },
  opec: {
    id: 'opec',
    name: 'OPEC+',
    publicObjective: 'Protect producer margins in volatile markets',
    hiddenAgenda: 'Exchange energy access for strategic influence',
    bargainingStyle: 'hardline',
    riskTolerance: 0.4,
    priorityCommodity: 'energy',
    inventory: { energy: 34, food: 9, tech: 8, rare_earths: 7 },
    publicNeeds: { energy: 11, food: 11, tech: 9, rare_earths: 8 },
    publicStability: 63,
  },
};

const SHOCKS: Record<Commodity, string[]> = {
  energy: ['Pipeline outage tightens fuel exports', 'LNG surplus eases short-term prices'],
  food: ['Crop stress cuts staple output', 'Harvest rebound raises inventory visibility'],
  tech: ['Chip lead-times extend unexpectedly', 'New fab line boosts component supply'],
  rare_earths: ['Mining strike compresses supply', 'Refinery expansion improves rare-earth flow'],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeAtomic(filePath: string, data: unknown) {
  const tmp = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function sessionPath(id: string) {
  return path.join(DATA_DIR, `game_session_${id}.json`);
}

function metricsPath() {
  return path.join(DATA_DIR, 'game_metrics.json');
}

function progressionPath() {
  return path.join(DATA_DIR, 'game_progression.json');
}

function globalDriftPath() {
  return path.join(DATA_DIR, 'global_market_drift.json');
}

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomCommodity(): Commodity {
  return randomFrom(COMMODITIES);
}

function randomStyle(): Nation['bargainingStyle'] {
  return randomFrom(['hardline', 'balanced', 'opportunistic']);
}

function computeDeficits(prices: Record<Commodity, number>): Record<Commodity, number> {
  return {
    energy: Number((BASE_DEMAND.energy - prices.energy / 12).toFixed(2)),
    food: Number((BASE_DEMAND.food - prices.food / 10).toFixed(2)),
    tech: Number((BASE_DEMAND.tech - prices.tech / 14).toFixed(2)),
    rare_earths: Number((BASE_DEMAND.rare_earths - prices.rare_earths / 16).toFixed(2)),
  };
}

function styleThresholdModifier(style: Nation['bargainingStyle']): number {
  if (style === 'hardline') return 0.08;
  if (style === 'opportunistic') return 0.03;
  return 0;
}

function applyShockToNationInventories(session: GameSession, commodity: Commodity, deltaPct: number): string[] {
  const bulletins: string[] = [];
  const spillovers: Record<Commodity, Commodity[]> = {
    energy: ['food', 'tech'],
    food: ['energy'],
    tech: ['rare_earths'],
    rare_earths: ['tech'],
  };

  for (const nationId of NATION_IDS) {
    const nation = session.nations[nationId];
    const styleResilience = nation.bargainingStyle === 'hardline' ? 0.9 : nation.bargainingStyle === 'balanced' ? 1 : 1.08;
    const priorityExposure = nation.priorityCommodity === commodity ? 1.28 : 1;
    const baseInventoryImpactPct = clamp(-0.18, -deltaPct * 0.55 * styleResilience * priorityExposure, 0.18);

    nation.inventory[commodity] = Number(clamp(0, nation.inventory[commodity] * (1 + baseInventoryImpactPct), 120).toFixed(2));

    for (const spill of spillovers[commodity]) {
      const spillImpactPct = clamp(-0.08, baseInventoryImpactPct * 0.35, 0.08);
      nation.inventory[spill] = Number(clamp(0, nation.inventory[spill] * (1 + spillImpactPct), 120).toFixed(2));
    }

    const direction = baseInventoryImpactPct < 0 ? 'tightened' : 'eased';
    bulletins.push(`${nation.name} ${commodityLabel(commodity)} reserves ${direction} (${Math.round(baseInventoryImpactPct * 100)}%).`);
  }

  return bulletins;
}

function applyDomesticNeeds(session: GameSession): string[] {
  const summaries: string[] = [];

  for (const nationId of NATION_IDS) {
    const nation = session.nations[nationId];
    let totalNeed = 0;
    let totalShortage = 0;

    for (const c of COMMODITIES) {
      const need = nation.publicNeeds[c];
      totalNeed += need;
      totalShortage += Math.max(0, need - nation.inventory[c]);
    }

    const shortageRatio = totalNeed > 0 ? totalShortage / totalNeed : 0;
    const stabilityDelta = shortageRatio > 0 ? -(shortageRatio * 15) : 1.5;
    nation.publicStability = Number(clamp(0, nation.publicStability + stabilityDelta, 100).toFixed(1));
    nation.pressure = Number(clamp(0, nation.pressure + shortageRatio * 1.8 - 0.25, 10).toFixed(2));

    if (shortageRatio > 0.2) {
      summaries.push(`${nation.name} faces domestic shortages; leaders prioritize essential imports.`);
    } else if (shortageRatio < 0.05) {
      summaries.push(`${nation.name} keeps domestic demand mostly satisfied this round.`);
    }
  }

  return summaries;
}

function commodityLabel(c: Commodity): string {
  return c === 'rare_earths' ? 'rare earths' : c;
}

function buildHiddenAgendaSignal(nation: Nation, accepted: boolean, fairnessRatio: number) {
  const hints: Record<NationId, string[]> = {
    usa: ['quietly prioritizes tech chain insulation', 'leans into semiconductor certainty'],
    china: ['nudges processing control in upstream lanes', 'protects conversion bottlenecks'],
    eu: ['seeks diversified counterpart exposure', 'avoids concentrated supplier lock-in'],
    india: ['trades near-term volume for capacity growth', 'balances affordability against leverage'],
    opec: ['prices access for diplomatic concessions', 'uses energy corridors as influence tools'],
  };
  const hint = randomFrom(hints[nation.id]);
  if (accepted) return fairnessRatio >= 1.1 ? `${nation.name} signals goodwill but ${hint}.` : `${nation.name} agrees cautiously and ${hint}.`;
  return `${nation.name} stalls this corridor and ${hint}.`;
}

function deterministicNarration(session: GameSession, outcome: RoundOutcome, nation: Nation): RoundNarration {
  const stressCommodity = [...COMMODITIES].sort((a, b) => session.market.deficits[b] - session.market.deficits[a])[0];
  return {
    title: outcome.accepted ? 'Trade Corridor Stabilized' : 'Talks Break Under Pressure',
    marketBulletin: `${commodityLabel(stressCommodity)} remains the top stress channel as ${session.market.shockHeadline.toLowerCase()}.`,
    diplomaticSignal: outcome.accepted
      ? `${nation.name} accepts terms, signaling tactical cooperation this round.`
      : `${nation.name} rejects terms, signaling stricter bargaining posture.`,
    riskOutlook: outcome.accepted
      ? `If trust persists, next-round spreads may tighten in ${commodityLabel(stressCommodity)} routes.`
      : `If pressure keeps climbing, counterparty thresholds will harden in ${commodityLabel(stressCommodity)} routes.`,
  };
}

function createShock(round: number, varianceScale: number, preferred?: Commodity) {
  const commodity = preferred || randomCommodity();
  const amplitude = 0.08 * varianceScale;
  const delta = Number((((Math.random() > 0.5 ? 1 : -1) * (amplitude + Math.random() * amplitude))).toFixed(3));
  return {
    commodity,
    delta,
    headline: `${randomFrom(SHOCKS[commodity])} (Round ${round})`,
  };
}

function scenarioPrices(scenarioId: GameSession['scenarioId']) {
  const prices = { ...BASE_MARKET };
  if (scenarioId === 'energy_embargo') prices.energy = Number((prices.energy * 1.28).toFixed(2));
  if (scenarioId === 'food_panic') prices.food = Number((prices.food * 1.32).toFixed(2));
  if (scenarioId === 'chip_chokepoint') {
    prices.tech = Number((prices.tech * 1.34).toFixed(2));
    prices.rare_earths = Number((prices.rare_earths * 1.12).toFixed(2));
  }
  return prices;
}

function preferredScenarioShock(scenarioId: GameSession['scenarioId']): Commodity {
  if (scenarioId === 'energy_embargo') return 'energy';
  if (scenarioId === 'food_panic') return 'food';
  return 'tech';
}

function applyScenarioModifiers(session: GameSession) {
  if (session.scenarioId === 'energy_embargo') {
    for (const id of NATION_IDS) {
      if (id !== 'opec') {
        session.nations[id].inventory.energy = Math.max(2, session.nations[id].inventory.energy - 3);
      }
      session.nations[id].publicNeeds.energy = Number(clamp(6, session.nations[id].publicNeeds.energy + 1.2, 24).toFixed(1));
    }
  }
  if (session.scenarioId === 'food_panic') {
    for (const id of NATION_IDS) {
      session.nations[id].inventory.food = Math.max(2, session.nations[id].inventory.food - 2.5);
      session.nations[id].publicNeeds.food = Number(clamp(6, session.nations[id].publicNeeds.food + 1.9, 24).toFixed(1));
    }
  }
  if (session.scenarioId === 'chip_chokepoint') {
    for (const id of NATION_IDS) {
      session.nations[id].inventory.tech = Math.max(2, session.nations[id].inventory.tech - 3.2);
      session.nations[id].publicNeeds.tech = Number(clamp(6, session.nations[id].publicNeeds.tech + 2.1, 24).toFixed(1));
    }
  }
}

function createNations(varianceScale: number): Record<NationId, Nation> {
  const nations: Record<NationId, Nation> = {
    usa: { ...NATIONS.usa, trustScore: 0, pressure: 0 },
    china: { ...NATIONS.china, trustScore: 0, pressure: 0 },
    eu: { ...NATIONS.eu, trustScore: 0, pressure: 0 },
    india: { ...NATIONS.india, trustScore: 0, pressure: 0 },
    opec: { ...NATIONS.opec, trustScore: 0, pressure: 0 },
  };
  for (const id of NATION_IDS) {
    const nation = nations[id];
    nation.bargainingStyle = randomStyle();
    nation.riskTolerance = Number(clamp(0.12, nation.riskTolerance + randomBetween(-0.18, 0.18) * varianceScale, 0.9).toFixed(2));
    nation.priorityCommodity = randomCommodity();
    for (const c of COMMODITIES) {
      nation.inventory[c] = Math.max(3, nation.inventory[c] + randomInt(Math.floor(-4 * varianceScale), Math.ceil(4 * varianceScale)));
      nation.publicNeeds[c] = Number(clamp(6, nation.publicNeeds[c] + randomBetween(-1.8, 1.8) * varianceScale, 22).toFixed(1));
    }
    nation.publicStability = Number(clamp(35, nation.publicStability + randomBetween(-8, 8) * varianceScale, 86).toFixed(1));
  }
  return nations;
}

function randomizePlayerInventory(varianceScale: number): Record<Commodity, number> {
  const out: Record<Commodity, number> = { ...BASE_PLAYER };
  for (const c of COMMODITIES) out[c] = Math.max(6, out[c] + randomInt(Math.floor(-5 * varianceScale), Math.ceil(5 * varianceScale)));
  return out;
}

function applyRoundVariance(session: GameSession) {
  const variance = DIFFICULTY_CONFIG[session.difficulty].varianceScale;
  for (const id of NATION_IDS) {
    const nation = session.nations[id];
    if (Math.random() < 0.72) nation.bargainingStyle = randomStyle();
    nation.riskTolerance = Number(clamp(0.08, nation.riskTolerance + randomBetween(-0.12, 0.12) * variance, 0.92).toFixed(2));
    if (Math.random() < 0.58) nation.priorityCommodity = randomCommodity();
    for (const c of COMMODITIES) {
      nation.inventory[c] = Math.max(2, Number((nation.inventory[c] + randomBetween(-2.2, 2.2) * variance).toFixed(1)));
      nation.publicNeeds[c] = Number(clamp(6, nation.publicNeeds[c] + randomBetween(-0.8, 0.8) * variance, 24).toFixed(1));
    }
    nation.publicStability = Number(clamp(0, nation.publicStability + randomBetween(-2.8, 1.8) * variance, 100).toFixed(1));
  }
  for (const c of COMMODITIES) {
    session.playerInventory[c] = Math.max(2, Number((session.playerInventory[c] + randomBetween(-1.8, 1.8) * variance).toFixed(1)));
  }
}

function createMission(round: number): RoundMission {
  const kind = randomFrom<RoundMission['kind']>(['accepted_deal', 'fairness_floor', 'trust_gain', 'commodity_trade']);
  const targetCommodity = kind === 'commodity_trade' ? randomCommodity() : undefined;
  const threshold = kind === 'fairness_floor' ? 1.05 : kind === 'trust_gain' ? 4 : 1;
  const rewardScore = kind === 'fairness_floor' ? 24 : kind === 'commodity_trade' ? 20 : 16;
  const title =
    kind === 'accepted_deal'
      ? 'Secure a Deal'
      : kind === 'fairness_floor'
        ? 'Premium Terms'
        : kind === 'trust_gain'
          ? 'Build Confidence'
          : `Move ${commodityLabel(targetCommodity || 'energy')}`;
  const description =
    kind === 'accepted_deal'
      ? 'Close one accepted deal this round.'
      : kind === 'fairness_floor'
        ? `Hit fairness ratio >= ${threshold.toFixed(2)}.`
        : kind === 'trust_gain'
          ? `Gain trust delta of at least +${threshold}.`
          : `Complete an accepted trade requesting ${commodityLabel(targetCommodity || 'energy')}.`;
  return { id: randomUUID(), title, description, kind, targetCommodity, threshold, rewardScore, completed: false };
}

function evaluateMission(mission: RoundMission | undefined, deal: Deal, outcome: RoundOutcome): RoundMission | undefined {
  if (!mission) return undefined;
  if (mission.kind === 'accepted_deal') mission.completed = outcome.accepted;
  if (mission.kind === 'fairness_floor') mission.completed = outcome.accepted && outcome.fairnessRatio >= mission.threshold;
  if (mission.kind === 'trust_gain') mission.completed = outcome.accepted && outcome.trustDelta >= mission.threshold;
  if (mission.kind === 'commodity_trade') mission.completed = outcome.accepted && mission.targetCommodity === deal.requestCommodity;
  return mission;
}

function averageNationStability(session: GameSession): number {
  const total = NATION_IDS.reduce((sum, id) => sum + session.nations[id].publicStability, 0);
  return total / NATION_IDS.length;
}

function recomputeDeficits(session: GameSession) {
  session.market.deficits = computeDeficits(session.market.prices);
}

function spendTreasury(session: GameSession, amount: number): { treasuryImpact: number; debtImpact: number } {
  if (amount <= 0) return { treasuryImpact: 0, debtImpact: 0 };
  const beforeTreasury = session.treasury;
  if (session.treasury >= amount) {
    session.treasury = Number((session.treasury - amount).toFixed(2));
    return { treasuryImpact: Number((-amount).toFixed(2)), debtImpact: 0 };
  }
  const borrowed = amount - session.treasury;
  session.treasury = 0;
  session.debt = Number((session.debt + borrowed).toFixed(2));
  return { treasuryImpact: Number((-beforeTreasury).toFixed(2)), debtImpact: Number(borrowed.toFixed(2)) };
}

function applyDebtLifecycle(session: GameSession): string | null {
  if (session.debt <= 0) return null;
  const interest = Number((session.debt * session.debtRate).toFixed(2));
  session.debt = Number((session.debt + interest).toFixed(2));
  const service = Number(Math.min(session.treasury, session.debt * 0.12).toFixed(2));
  if (service > 0) {
    session.treasury = Number((session.treasury - service).toFixed(2));
    session.debt = Number((session.debt - service).toFixed(2));
  }
  return `Debt service processed: +${interest} interest, -${service} repayment.`;
}

function applyPlayerResourceImpact(
  session: GameSession,
  impact: Partial<Record<Commodity, number>>
): Partial<Record<Commodity, number>> {
  const applied: Partial<Record<Commodity, number>> = {};
  for (const c of COMMODITIES) {
    const delta = impact[c];
    if (!delta || Math.abs(delta) < 0.001) continue;
    const before = session.playerInventory[c];
    const next = clamp(0, before + delta, 999);
    session.playerInventory[c] = Number(next.toFixed(1));
    const effective = Number((session.playerInventory[c] - before).toFixed(1));
    if (Math.abs(effective) >= 0.1) applied[c] = effective;
  }
  return applied;
}

const CORRIDOR_PAIRS: Array<[NationId, NationId]> = [
  ['usa', 'eu'],
  ['usa', 'opec'],
  ['usa', 'china'],
  ['eu', 'opec'],
  ['eu', 'india'],
  ['opec', 'india'],
  ['opec', 'china'],
  ['india', 'china'],
];

function corridorId(a: NationId, b: NationId): string {
  return [a, b].sort().join('__');
}

function createInitialCorridors(): Record<string, TradeCorridor> {
  const out: Record<string, TradeCorridor> = {};
  const now = new Date().toISOString();
  for (const [a, b] of CORRIDOR_PAIRS) {
    const id = corridorId(a, b);
    out[id] = {
      id,
      a,
      b,
      health: Number(clamp(25, 58 + randomBetween(-12, 12), 95).toFixed(1)),
      capacity: Number(clamp(20, 62 + randomBetween(-10, 10), 95).toFixed(1)),
      activity: 0,
      history: [],
      lastUpdatedAt: now,
    };
  }
  return out;
}

function updateCorridor(
  session: GameSession,
  id: string,
  delta: number,
  note: string,
  round = session.round
) {
  const c = session.corridors[id];
  if (!c) return;
  c.health = Number(clamp(0, c.health + delta, 100).toFixed(1));
  c.activity = Number(clamp(0, c.activity + Math.abs(delta) * 3.2, 100).toFixed(1));
  c.lastUpdatedAt = new Date().toISOString();
  c.history = [{ round, delta, note, createdAt: c.lastUpdatedAt }, ...c.history].slice(0, 10);
}

function applyCorridorRoundDrift(session: GameSession) {
  for (const id of Object.keys(session.corridors)) {
    const c = session.corridors[id];
    c.health = Number(clamp(0, c.health - randomBetween(0.3, 1.4), 100).toFixed(1));
    c.activity = Number(clamp(0, c.activity * 0.64, 100).toFixed(1));
    c.lastUpdatedAt = new Date().toISOString();
  }
}

function impactCorridorsForNation(session: GameSession, nationId: NationId, delta: number, note: string) {
  for (const id of Object.keys(session.corridors)) {
    const c = session.corridors[id];
    if (c.a === nationId || c.b === nationId) {
      updateCorridor(session, id, delta, note);
    }
  }
}

function createTurnEvent(session: GameSession): TurnEvent {
  const stress = primaryStressCommodity(session);
  const incidentCity = randomFrom(['Port Meridian', 'Delta Freeport', 'Novaya Terminal', 'Kintara Bay', 'Ravenna Gate']);
  const detainedCount = randomInt(11, 39);
  const seizedContainers = randomInt(180, 920);
  const sabotageHours = randomInt(12, 56);
  const voteMargin = randomInt(2, 9);
  const producerDefections = randomInt(2, 5);
  const outageHours = randomInt(6, 28);
  const banksFrozen = randomInt(2, 7);
  const borderQueueKm = randomInt(14, 86);
  const workersOnStrike = randomInt(2800, 16200);
  const sanctionDockets = randomInt(3, 11);
  const severity: TurnEvent['severity'] = randomFrom([2, 3, 3, 4, 4, 5]);

  const optionsByType: Record<TurnEvent['type'], { title: string; description: string; options: TurnEvent['options'] }> = {
    shipping_disruption: {
      title: 'Shipping Disruption',
      description: `Armed crews blocked loading access at ${incidentCity}, and ${detainedCount} dock workers are being held inside a bonded zone. ${seizedContainers} containers of ${commodityLabel(stress)} are now stranded.`,
      options: [
        { id: 'reroute_subsidy', label: 'Emergency Airlift + Convoy', description: 'Fund emergency reroutes and private convoy security to release trapped workers and cargo.' },
        { id: 'priority_ports', label: 'Limited Port Intervention', description: 'Secure only top-priority lanes; accept delays on secondary routes.' },
        { id: 'wait_market', label: 'Containment Posture', description: 'Issue statements and wait for local authorities; cheapest option with the highest disruption risk.' },
      ],
    },
    election_surprise: {
      title: 'Election Surprise',
      description: `A snap coalition vote passed by ${voteMargin}% and triggered a policy reversal overnight. Street protests spread to logistics districts, and import contracts are being challenged in court.`,
      options: [
        { id: 'stability_message', label: 'National Stabilization Address', description: 'Deploy emergency subsidies and clear messaging to prevent panic buying and strikes.' },
        { id: 'elite_compact', label: 'Parliamentary Backroom Pact', description: 'Trade concessions to power brokers for temporary calm and contract continuity.' },
        { id: 'fiscal_hold', label: 'Hard Budget Stance', description: 'Preserve cash and debt headroom, but risk escalation in public unrest.' },
      ],
    },
    cartel_fracture: {
      title: 'Cartel Fracture',
      description: `${producerDefections} producer blocs broke from cartel discipline after allegations of smuggling profits and off-ledger deals. Rival enforcers are threatening export managers, and shipments of ${commodityLabel(stress)} face coordinated slowdowns for the next ${sabotageHours} hours.`,
      options: [
        { id: 'backchannel', label: 'Quiet Security Guarantees', description: 'Finance backchannel security + compliance guarantees to keep core exports moving.' },
        { id: 'hedge_position', label: 'Structured Hedge Program', description: 'Split risk across futures and backup suppliers to limit downside.' },
        { id: 'speculate', label: 'Exploit Price Chaos', description: 'Hold liquidity and trade volatility aggressively; large upside but unstable corridors.' },
      ],
    },
    cyber_breach: {
      title: 'Clearinghouse Cyber Breach',
      description: `A coordinated ransomware attack hit customs + payment systems. Transaction queues are delayed by ${outageHours} hours, and manifests for ${commodityLabel(stress)} lanes were tampered with.`,
      options: [
        { id: 'zero_trust_lockdown', label: 'Zero-Trust Lockdown', description: 'Pay for emergency cyber incident response and hard isolation of affected networks.' },
        { id: 'manual_fallback', label: 'Manual Fallback Ops', description: 'Shift to manual verification for key lanes at moderate operational cost.' },
        { id: 'accept_latency', label: 'Accept Latency', description: 'Avoid immediate spend and let queues clear naturally with elevated fraud risk.' },
      ],
    },
    border_closure: {
      title: 'Border Closure Cascade',
      description: `Security incidents triggered snap border controls, with truck queues stretching ${borderQueueKm} km. Priority commodities face hard caps at crossings.`,
      options: [
        { id: 'green_corridor', label: 'Green Corridor Deal', description: 'Broker emergency bilateral waivers for essential shipments.' },
        { id: 'alternate_hubs', label: 'Alternate Hub Routing', description: 'Use secondary hubs and rail transfer with moderate slowdown.' },
        { id: 'ration_internally', label: 'Ration Internally', description: 'Conserve reserves domestically and accept lower import throughput.' },
      ],
    },
    labor_uprising: {
      title: 'Labor Uprising',
      description: `${workersOnStrike.toLocaleString()} logistics and refinery workers launched coordinated strikes over wage and safety demands. Loading windows for ${commodityLabel(stress)} were cut in half.`,
      options: [
        { id: 'rapid_concessions', label: 'Rapid Concessions', description: 'Approve expedited labor package to restore operations quickly.' },
        { id: 'phased_deal', label: 'Phased Settlement', description: 'Negotiate staged concessions and partial restarts.' },
        { id: 'hardline_response', label: 'Hardline Response', description: 'Delay concessions and maintain spending discipline at social risk.' },
      ],
    },
    sanctions_leak: {
      title: 'Sanctions Leak',
      description: `Leaked sanctions draft names ${sanctionDockets} shipping and brokerage entities. Counterparties are pre-emptively canceling forward contracts.`,
      options: [
        { id: 'compliance_taskforce', label: 'Compliance Taskforce', description: 'Fund rapid legal/compliance response to keep lanes authorized.' },
        { id: 'partner_rotation', label: 'Partner Rotation', description: 'Shift to lower-risk intermediaries with moderate friction.' },
        { id: 'hold_exposure', label: 'Hold Exposure', description: 'Pause new commitments and absorb near-term contract losses.' },
      ],
    },
    banking_freeze: {
      title: 'Banking Liquidity Freeze',
      description: `${banksFrozen} regional trade-finance banks halted USD clearing overnight. Letters of credit are being rejected and settlement risk is climbing.`,
      options: [
        { id: 'central_backstop', label: 'Central Backstop', description: 'Deploy emergency guarantee facility to restore settlement confidence.' },
        { id: 'limited_guarantees', label: 'Limited Guarantees', description: 'Guarantee only strategic contracts to cap fiscal exposure.' },
        { id: 'cash_preservation', label: 'Cash Preservation', description: 'Avoid guarantees and preserve liquidity while trade contracts slip.' },
      ],
    },
  };

  const weighted: TurnEvent['type'][] =
    session.scenarioId === 'energy_embargo'
      ? ['cartel_fracture', 'shipping_disruption', 'banking_freeze', 'sanctions_leak', 'cyber_breach', 'border_closure', 'labor_uprising', 'election_surprise']
      : session.scenarioId === 'food_panic'
        ? ['shipping_disruption', 'labor_uprising', 'border_closure', 'election_surprise', 'sanctions_leak', 'banking_freeze', 'cartel_fracture', 'cyber_breach']
        : ['cyber_breach', 'sanctions_leak', 'election_surprise', 'shipping_disruption', 'banking_freeze', 'cartel_fracture', 'border_closure', 'labor_uprising'];
  const type = Math.random() < 0.44 ? weighted[0] : randomFrom(weighted);
  const pick = optionsByType[type];

  return {
    id: randomUUID(),
    type,
    severity,
    title: `${pick.title} (Round ${session.round})`,
    description: pick.description,
    options: pick.options,
    createdAt: new Date().toISOString(),
  };
}

function applyTurnEventDecision(
  session: GameSession,
  event: TurnEvent,
  optionId: string
): {
  treasuryImpact: number;
  sentimentImpact: number;
  corridorImpact: number;
  resourceImpact: Partial<Record<Commodity, number>>;
  summary: string;
} {
  let treasuryImpact = 0;
  let sentimentImpact = 0;
  let corridorImpact = 0;
  const spending = (amount: number) => {
    const before = session.treasury;
    if (session.treasury >= amount) {
      session.treasury = Number((session.treasury - amount).toFixed(2));
      treasuryImpact -= amount;
      return;
    }
    const borrow = amount - session.treasury;
    session.treasury = 0;
    session.debt = Number((session.debt + borrow).toFixed(2));
    treasuryImpact -= before;
  };

  const optionRank = Math.max(0, event.options.findIndex((o) => o.id === optionId));
  const severityScale = event.severity / 5;
  const stress = primaryStressCommodity(session);
  const secondary = secondaryCommodityForStress(stress);

  if (optionRank === 0) {
    spending(Math.round(8 + event.severity * 2.8));
    sentimentImpact += Math.round(2 + severityScale * 3);
    corridorImpact += Math.round(4 + severityScale * 6);
  } else if (optionRank === 1) {
    spending(Math.round(5 + event.severity * 1.6));
    sentimentImpact += Math.round(1 + severityScale * 1.8);
    corridorImpact += Math.round(2 + severityScale * 3.6);
  } else {
    const cashHold = Math.round(2 + event.severity * 0.8);
    session.treasury = Number((session.treasury + cashHold).toFixed(2));
    treasuryImpact += cashHold;
    sentimentImpact -= Math.round(1 + severityScale * 3.2);
    corridorImpact -= Math.round(2 + severityScale * 4.2);
  }

  let resourceImpact: Partial<Record<Commodity, number>> = {};
  if (event.type === 'shipping_disruption') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { energy: -1.8, tech: -1.2 } : optionRank === 1 ? { energy: -1 } : {});
  } else if (event.type === 'election_surprise') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { food: -1.4, energy: -0.8 } : optionRank === 1 ? { tech: -0.9 } : {});
    session.publicSentiment = Number(clamp(0, session.publicSentiment + (optionRank === 2 ? -2 : optionRank === 0 ? 3 : 1), 100).toFixed(1));
  } else if (event.type === 'cartel_fracture') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { [stress]: -1.5, [secondary]: -0.9 } : optionRank === 1 ? { tech: -1 } : {});
    session.market.prices.energy = Number(clamp(35, session.market.prices.energy * (optionRank === 2 ? 1.02 : optionRank === 0 ? 0.97 : 0.985), 340).toFixed(2));
    recomputeDeficits(session);
  } else if (event.type === 'cyber_breach') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { tech: -2 } : optionRank === 1 ? { tech: -1.1 } : {});
  } else if (event.type === 'border_closure') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { [stress]: -1.1 } : optionRank === 1 ? { energy: -0.8 } : {});
  } else if (event.type === 'labor_uprising') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { food: -1.2 } : optionRank === 1 ? { food: -0.8 } : {});
  } else if (event.type === 'sanctions_leak') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { rare_earths: -1.1, tech: -0.8 } : optionRank === 1 ? { tech: -0.7 } : {});
  } else if (event.type === 'banking_freeze') {
    resourceImpact = applyPlayerResourceImpact(session, optionRank === 0 ? { energy: -1.1 } : optionRank === 1 ? { energy: -0.6 } : {});
  }

  const corridorNote = optionRank === 0 ? `${event.title}: aggressive response improved lane resilience.` : optionRank === 1 ? `${event.title}: partial response stabilized key lanes.` : `${event.title}: low response increased lane volatility.`;
  Object.keys(session.corridors).forEach((id) => {
    const randomized = optionRank === 2 ? randomBetween(-Math.abs(corridorImpact) - 2, 1) : randomBetween(corridorImpact * 0.5, corridorImpact + 1.5);
    updateCorridor(session, id, randomized, corridorNote);
  });

  const summary =
    optionRank === 0
      ? `${event.options[0].label} executed under severity ${event.severity}. Strong stabilization at high resource cost.`
      : optionRank === 1
        ? `${event.options[1].label} executed under severity ${event.severity}. Controlled response with moderate cost.`
        : `${event.options[2].label} selected under severity ${event.severity}. Lower spend but higher systemic risk.`;

  return { treasuryImpact, sentimentImpact, corridorImpact, resourceImpact, summary };
}

type DomesticOptionId = 'stabilize' | 'targeted' | 'austerity';

function primaryStressCommodity(session: GameSession): Commodity {
  return [...COMMODITIES].sort((a, b) => session.market.deficits[b] - session.market.deficits[a])[0];
}

function secondaryCommodityForStress(c: Commodity): Commodity {
  if (c === 'energy') return 'food';
  if (c === 'food') return 'energy';
  if (c === 'tech') return 'rare_earths';
  return 'tech';
}

function buildDomesticOptions(
  scenarioId: GameSession['scenarioId'],
  category: DomesticScenario['category'],
  stressedCommodity: Commodity
) {
  const stress = commodityLabel(stressedCommodity);
  const scenarioTone =
    scenarioId === 'energy_embargo'
      ? 'import security'
      : scenarioId === 'food_panic'
        ? 'household affordability'
        : 'industrial continuity';
  const categoryTone =
    category === 'social'
      ? 'public services'
      : category === 'infrastructure'
        ? 'critical infrastructure'
        : category === 'political'
          ? 'coalition alignment'
          : 'economic stabilization';

  return [
    {
      id: 'stabilize' as DomesticOptionId,
      label: `Emergency ${stress} Package`,
      description: `Deploy broad spending to protect ${scenarioTone} and reduce immediate ${stress} pressure across ${categoryTone}.`,
    },
    {
      id: 'targeted' as DomesticOptionId,
      label: `Targeted ${stress} Relief`,
      description: `Direct limited support to the highest-risk sectors to control shortages while preserving fiscal flexibility.`,
    },
    {
      id: 'austerity' as DomesticOptionId,
      label: 'Fiscal Guardrails + Messaging',
      description: `Conserve treasury and debt headroom, but accept higher short-term social and market tension.`,
    },
  ];
}

function isGenericDomesticLabel(label: string) {
  return /^(Stabilize Markets|Targeted Relief|Austerity \+ Messaging)$/i.test(label.trim());
}

async function createDomesticScenario(session: GameSession): Promise<DomesticScenario> {
  const round = session.round;
  const scenarioId = session.scenarioId;
  const pool: Array<{ title: string; description: string; category: DomesticScenario['category'] }> = [
    {
      title: 'Transit Strike Wave',
      description: 'Logistics unions are threatening a 48-hour strike over cost-of-living pressures.',
      category: 'infrastructure',
    },
    {
      title: 'Food Price Protests',
      description: 'Urban districts are seeing protests over staple price spikes and supply anxiety.',
      category: 'social',
    },
    {
      title: 'Cabinet Budget Split',
      description: 'Your coalition is divided on emergency spending versus debt discipline.',
      category: 'political',
    },
    {
      title: 'Industrial Power Shortage',
      description: 'Factory regions report rolling outages and demand immediate intervention.',
      category: 'economic',
    },
  ];

  const bias =
    scenarioId === 'energy_embargo'
      ? pool[3]
      : scenarioId === 'food_panic'
        ? pool[1]
        : scenarioId === 'chip_chokepoint'
          ? pool[2]
          : randomFrom(pool);
  const base = Math.random() < 0.55 ? bias : randomFrom(pool);
  const avgPressure = Object.values(session.nations).reduce((sum, n) => sum + n.pressure, 0) / Math.max(1, NATION_IDS.length);
  const stressedCommodity = [...COMMODITIES].sort((a, b) => session.market.deficits[b] - session.market.deficits[a])[0];
  const tensionTag =
    session.publicSentiment < 42 || avgPressure > 5.2
      ? 'high-alert'
      : session.debt > session.treasury * 1.1
        ? 'fiscal-fragile'
        : 'contained';
  const variant = randomFrom([
    'urgent policy debate',
    'unexpected ministerial report',
    'rapid public sentiment shift',
    'regional coordination challenge',
  ]);
  const fallbackOptions = buildDomesticOptions(session.scenarioId, base.category, stressedCommodity);

  const fallback: DomesticScenario = {
    id: randomUUID(),
    title: `${base.title} (Round ${round})`,
    description: `${base.description} Main pressure is ${commodityLabel(stressedCommodity)}. Current update: ${variant}.`,
    category: base.category,
    options: fallbackOptions,
    createdAt: new Date().toISOString(),
  };

  const aiScenario = await aiGenerateDomesticScenario({
    session,
    seedHint: `${scenarioId}|r${round}|${tensionTag}|${stressedCommodity}|${Math.round(session.treasury)}:${Math.round(session.debt)}`,
  });
  if (!aiScenario) return fallback;
  return {
    id: randomUUID(),
    title: `${aiScenario.title} (Round ${round})`,
    description: aiScenario.description,
    category: aiScenario.category,
    options: aiScenario.options.map((option) => {
      const fallbackOption = fallbackOptions.find((o) => o.id === option.id) || fallbackOptions[0];
      return {
        id: option.id,
        label: !option.label || isGenericDomesticLabel(option.label) ? fallbackOption.label : option.label,
        description:
          !option.description || /Spend aggressively to calm prices and shortages|Narrow intervention focused on highest pain points|Protect treasury, accept short-term social strain/i.test(option.description)
            ? fallbackOption.description
            : option.description,
      };
    }),
    createdAt: new Date().toISOString(),
  };
}

function applyDomesticDecision(
  session: GameSession,
  scenario: DomesticScenario,
  optionId: string
): {
  treasuryImpact: number;
  debtImpact: number;
  sentimentImpact: number;
  resourceImpact: Partial<Record<Commodity, number>>;
  summary: string;
} {
  let treasuryImpact = 0;
  let debtImpact = 0;
  let sentimentImpact = 0;

  const adjustByCategory = (category: DomesticScenario['category']) => {
    if (category === 'social') {
      session.nations.india.publicNeeds.food = Number(clamp(6, session.nations.india.publicNeeds.food + 0.7, 24).toFixed(1));
      session.nations.eu.publicNeeds.food = Number(clamp(6, session.nations.eu.publicNeeds.food + 0.4, 24).toFixed(1));
    }
    if (category === 'infrastructure') {
      session.nations.usa.publicNeeds.energy = Number(clamp(6, session.nations.usa.publicNeeds.energy + 0.5, 24).toFixed(1));
      session.nations.china.publicNeeds.energy = Number(clamp(6, session.nations.china.publicNeeds.energy + 0.5, 24).toFixed(1));
    }
  };
  adjustByCategory(scenario.category);
  const stressedCommodity = primaryStressCommodity(session);
  const secondaryCommodity = secondaryCommodityForStress(stressedCommodity);
  const stressedLabel = commodityLabel(stressedCommodity);
  const stressIntensity = clamp(0.75, 1 + Math.max(0, session.market.deficits[stressedCommodity]) / 12, 1.55);
  const categoryCostBoost =
    scenario.category === 'infrastructure' ? 4 : scenario.category === 'economic' ? 3 : scenario.category === 'political' ? 2 : 1;
  const stabilizeSpend = Math.round(24 * stressIntensity + categoryCostBoost);
  const targetedSpend = Math.round(13 * stressIntensity + Math.max(0, categoryCostBoost - 1));

  if (optionId === 'stabilize') {
    const spend = spendTreasury(session, stabilizeSpend);
    treasuryImpact += spend.treasuryImpact;
    debtImpact += spend.debtImpact;
    sentimentImpact += Math.round(4 + stressIntensity * 2);
    for (const id of NATION_IDS) {
      const n = session.nations[id];
      const shortage = Math.max(0, n.publicNeeds[stressedCommodity] - n.inventory[stressedCommodity]);
      n.publicStability = Number(clamp(0, n.publicStability + 1.8 + Math.min(1.3, shortage * 0.18), 100).toFixed(1));
      n.pressure = Number(clamp(0, n.pressure - (0.35 + Math.min(0.25, shortage * 0.04)), 10).toFixed(2));
    }
    session.market.prices[stressedCommodity] = Number(clamp(35, session.market.prices[stressedCommodity] * 0.95, 340).toFixed(2));
    session.market.prices[secondaryCommodity] = Number(clamp(35, session.market.prices[secondaryCommodity] * 0.975, 340).toFixed(2));
    recomputeDeficits(session);
    const resourceImpact = applyPlayerResourceImpact(session, {
      [stressedCommodity]: -2.2,
      [secondaryCommodity]: -1.1,
    });
    return {
      treasuryImpact,
      debtImpact,
      sentimentImpact,
      resourceImpact,
      summary: `Broad intervention approved for ${stressedLabel}. Stability improved, but fiscal pressure and reserve drawdown increased.`,
    };
  }

  if (optionId === 'targeted') {
    const spend = spendTreasury(session, targetedSpend);
    treasuryImpact += spend.treasuryImpact;
    debtImpact += spend.debtImpact;
    sentimentImpact += Math.round(1 + stressIntensity);
    for (const id of NATION_IDS) {
      const n = session.nations[id];
      const shortage = Math.max(0, n.publicNeeds[stressedCommodity] - n.inventory[stressedCommodity]);
      if (shortage >= 2) {
        n.publicStability = Number(clamp(0, n.publicStability + 1.6, 100).toFixed(1));
        n.pressure = Number(clamp(0, n.pressure - 0.25, 10).toFixed(2));
      } else {
        n.publicStability = Number(clamp(0, n.publicStability + 0.4, 100).toFixed(1));
      }
    }
    session.market.prices[stressedCommodity] = Number(clamp(35, session.market.prices[stressedCommodity] * 0.98, 340).toFixed(2));
    session.market.prices[secondaryCommodity] = Number(clamp(35, session.market.prices[secondaryCommodity] * 0.992, 340).toFixed(2));
    recomputeDeficits(session);
    const resourceImpact = applyPlayerResourceImpact(session, {
      [stressedCommodity]: -1.1,
    });
    return {
      treasuryImpact,
      debtImpact,
      sentimentImpact,
      resourceImpact,
      summary: `Targeted measures deployed around ${stressedLabel} bottlenecks. Moderate relief with controlled spend.`,
    };
  }

  sentimentImpact -= Math.round(3 + stressIntensity * 2);
  const fiscalBufferGain = Math.round(4 + Math.max(0, session.market.deficits[stressedCommodity]) * 0.35);
  session.treasury = Number((session.treasury + fiscalBufferGain).toFixed(2));
  treasuryImpact += fiscalBufferGain;
  for (const id of NATION_IDS) {
    const n = session.nations[id];
    const shortage = Math.max(0, n.publicNeeds[stressedCommodity] - n.inventory[stressedCommodity]);
    n.publicStability = Number(clamp(0, n.publicStability - (1.1 + Math.min(1.5, shortage * 0.2)), 100).toFixed(1));
    n.pressure = Number(clamp(0, n.pressure + 0.25 + Math.min(0.35, shortage * 0.05), 10).toFixed(2));
  }
  const resourceImpact = applyPlayerResourceImpact(session, {});
  return {
    treasuryImpact,
    debtImpact,
    sentimentImpact,
    resourceImpact,
    summary: `Fiscal guardrails enacted during ${stressedLabel} stress. Treasury preserved, social strain increased.`,
  };
}

function normalizePlayerName(name: string) {
  return name.trim().toLowerCase();
}

function defaultMetrics(): GameMetrics {
  return {
    sessionsStarted: 0,
    sessionsCompleted: 0,
    sessionsWon: 0,
    roundsCompleted: 0,
    dealsMade: 0,
    domesticDecisions: 0,
    turnEventsResolved: 0,
    totalFinalScore: 0,
    returnUsers: 0,
  };
}

function unlockedDifficultiesForRuns(runs: number): Difficulty[] {
  const out: Difficulty[] = ['analyst'];
  if (runs >= 2) out.push('director');
  if (runs >= 5) out.push('grandmaster');
  return out;
}

function unlockedScenarioModsForRuns(runs: number): string[] {
  const out = ['none'];
  if (runs >= 2) out.push('volatility_dampener');
  if (runs >= 4) out.push('liquidity_surge');
  return out;
}

function unlockedAdvisorsForRuns(runs: number): string[] {
  const out = ['none'];
  if (runs >= 1) out.push('diplomat');
  if (runs >= 3) out.push('hawk');
  if (runs >= 5) out.push('technocrat');
  return out;
}

function unlockedPerksForRuns(runs: number): string[] {
  const out = ['none'];
  if (runs >= 1) out.push('strategic_reserves');
  if (runs >= 3) out.push('public_safety_net');
  if (runs >= 5) out.push('credit_facility');
  return out;
}

function loadProgressionFallbackMap(): Record<string, ProgressionProfile> {
  ensureDataDir();
  return readJson<Record<string, ProgressionProfile>>(progressionPath()) || {};
}

function saveProgressionFallbackMap(map: Record<string, ProgressionProfile>) {
  ensureDataDir();
  writeAtomic(progressionPath(), map);
}

function updateMetrics(mutator: (m: GameMetrics) => GameMetrics) {
  ensureDataDir();
  const existing = readJson<Partial<GameMetrics>>(metricsPath()) || {};
  const current = { ...defaultMetrics(), ...existing };
  writeAtomic(metricsPath(), mutator(current));
}

function trackSessionStart(playerName: string) {
  ensureDataDir();
  const sessionFiles = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('game_session_') && f.endsWith('.json'));
  const previousUsers = new Set(
    sessionFiles
      .map((file) => readJson<GameSession>(path.join(DATA_DIR, file)))
      .filter((s): s is GameSession => Boolean(s))
      .map((s) => s.playerName.toLowerCase())
  );
  updateMetrics((m) => ({
    ...m,
    sessionsStarted: m.sessionsStarted + 1,
    returnUsers: m.returnUsers + (previousUsers.has(playerName.toLowerCase()) ? 1 : 0),
  }));
}

type ZeroDBConfig = { baseUrl: string; apiKey: string } | null;

function getZeroDBConfig(): ZeroDBConfig {
  const apiKey = process.env.ZERODB_API_KEY || '';
  if (!apiKey) return null;
  const direct = process.env.ZERODB_API_URL || '';
  const projectId = process.env.ZERODB_PROJECT_ID || '';
  const baseUrl = direct || (projectId ? `https://zerodb.ainative.studio/api/v1/projects/${projectId}` : '');
  if (!baseUrl) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

async function zerodbRequest(method: string, pathSuffix: string, body?: unknown): Promise<any | null> {
  const cfg = getZeroDBConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.baseUrl}${pathSuffix}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unwrapDoc<T>(raw: any): T | null {
  if (!raw) return null;
  if (raw.document && typeof raw.document === 'object') return raw.document as T;
  if (raw.data && typeof raw.data === 'object') return raw.data as T;
  if (raw.item && typeof raw.item === 'object') return raw.item as T;
  if (typeof raw === 'object') return raw as T;
  return null;
}

async function zerodbUpsert(collection: string, id: string, doc: Record<string, unknown>): Promise<boolean> {
  const put = await zerodbRequest('PUT', `/collections/${collection}/documents/${id}`, doc);
  if (put) return true;
  const post = await zerodbRequest('POST', `/collections/${collection}/documents`, { id, ...doc });
  return Boolean(post);
}

async function zerodbGet<T>(collection: string, id: string): Promise<T | null> {
  const raw = await zerodbRequest('GET', `/collections/${collection}/documents/${id}`);
  return unwrapDoc<T>(raw);
}

async function persistZeroDB(collection: string, payload: Record<string, unknown>): Promise<void> {
  const id = String(payload.id || randomUUID());
  await zerodbUpsert(collection, id, payload);
}

async function saveSession(session: GameSession) {
  ensureDataDir();
  const payload = { ...session, zerodbSyncedAt: new Date().toISOString() } as Record<string, unknown>;
  const synced = await zerodbUpsert(COLLECTIONS.sessions, session.id, payload);
  // local cache fallback/read-through
  writeAtomic(sessionPath(session.id), { ...session, zeroDbPrimary: synced });
}

async function getProgression(playerName: string): Promise<ProgressionProfile> {
  const key = `player_${normalizePlayerName(playerName)}`;
  const remote = await zerodbGet<ProgressionProfile>(COLLECTIONS.progression, key);
  if (remote) {
    return {
      ...remote,
      unlockedScenarioMods: remote.unlockedScenarioMods?.length ? remote.unlockedScenarioMods : ['none'],
      unlockedAdvisors: remote.unlockedAdvisors?.length ? remote.unlockedAdvisors : ['none'],
      unlockedPerks: remote.unlockedPerks?.length ? remote.unlockedPerks : ['none'],
    };
  }

  const map = loadProgressionFallbackMap();
  const existing = map[normalizePlayerName(playerName)];
  if (existing) {
    return {
      ...existing,
      unlockedScenarioMods: existing.unlockedScenarioMods?.length ? existing.unlockedScenarioMods : ['none'],
      unlockedAdvisors: existing.unlockedAdvisors?.length ? existing.unlockedAdvisors : ['none'],
      unlockedPerks: existing.unlockedPerks?.length ? existing.unlockedPerks : ['none'],
    };
  }
  return {
    playerName,
    completedRuns: 0,
    bestScore: 0,
    totalScore: 0,
    unlockedDifficulties: ['analyst'],
    unlockedScenarioMods: ['none'],
    unlockedAdvisors: ['none'],
    unlockedPerks: ['none'],
    achievements: [],
    updatedAt: new Date().toISOString(),
  };
}

async function saveProgression(profile: ProgressionProfile) {
  const key = normalizePlayerName(profile.playerName);
  const map = loadProgressionFallbackMap();
  map[key] = profile;
  saveProgressionFallbackMap(map);
  await zerodbUpsert(COLLECTIONS.progression, `player_${key}`, profile as unknown as Record<string, unknown>);
}

type GlobalDrift = Record<Commodity, number>;

const EMPTY_DRIFT: GlobalDrift = { energy: 0, food: 0, tech: 0, rare_earths: 0 };

async function getGlobalDrift(): Promise<GlobalDrift> {
  const remote = await zerodbGet<GlobalDrift>(COLLECTIONS.globalState, 'market_drift_global');
  if (remote && typeof remote === 'object') return { ...EMPTY_DRIFT, ...remote };
  const local = readJson<GlobalDrift>(globalDriftPath());
  return local ? { ...EMPTY_DRIFT, ...local } : { ...EMPTY_DRIFT };
}

async function saveGlobalDrift(drift: GlobalDrift): Promise<void> {
  ensureDataDir();
  writeAtomic(globalDriftPath(), drift);
  await zerodbUpsert(COLLECTIONS.globalState, 'market_drift_global', drift as unknown as Record<string, unknown>);
}

function hydrateSession(session: GameSession): GameSession {
  if (!session.corridors || !Object.keys(session.corridors).length) {
    session.corridors = createInitialCorridors();
  }
  if (!session.turnEventLog) session.turnEventLog = [];
  if (!session.currentTurnEvent && !session.isComplete) {
    session.currentTurnEvent = createTurnEvent(session);
    session.turnEventResolvedRound = undefined;
  }
  if (session.currentTurnEvent && !session.currentTurnEvent.severity) {
    session.currentTurnEvent.severity = 3;
  }
  if (typeof session.judgeMode !== 'boolean') session.judgeMode = false;
  if (!session.advisorId) session.advisorId = 'none';
  if (!session.perkId) session.perkId = 'none';
  if (!session.scenarioModId) session.scenarioModId = 'none';
  return session;
}

export async function getGameState(id: string): Promise<GameSession | null> {
  const remote = await zerodbGet<GameSession>(COLLECTIONS.sessions, id);
  if (remote) {
    const hydrated = hydrateSession(remote);
    ensureDataDir();
    writeAtomic(sessionPath(id), hydrated);
    return hydrated;
  }
  const local = readJson<GameSession>(sessionPath(id));
  if (!local) return null;
  return hydrateSession(local);
}

export function applyShock(market: MarketState, commodity: Commodity, deltaPct: number, headline: string): MarketState {
  const next = { ...market, prices: { ...market.prices } };
  next.prices[commodity] = Number(clamp(40, next.prices[commodity] * (1 + deltaPct), 320).toFixed(2));
  next.shockCommodity = commodity;
  next.shockDeltaPct = deltaPct;
  next.shockHeadline = headline;
  next.deficits = computeDeficits(next.prices);
  return next;
}

export function evaluateDeal(session: GameSession, deal: Deal): RoundOutcome {
  return evaluateDealWithShift(session, deal, 0);
}

function nationNeedsGap(nation: Nation): number {
  const totalNeed = COMMODITIES.reduce((sum, c) => sum + nation.publicNeeds[c], 0);
  if (totalNeed <= 0) return 0;
  const shortage = COMMODITIES.reduce((sum, c) => sum + Math.max(0, nation.publicNeeds[c] - nation.inventory[c]), 0);
  return shortage / totalNeed;
}

function crisisCount(session: GameSession): number {
  return NATION_IDS.filter((id) => {
    const nation = session.nations[id];
    const gap = nationNeedsGap(nation);
    // Crisis means either very low stability, or severe shortages plus already weakened stability.
    return nation.publicStability < 24 || (gap > 0.5 && nation.publicStability < 46);
  }).length;
}

function deterministicCounterOffer(session: GameSession, deal: Deal): DealSuggestion {
  const nation = session.nations[deal.nationId];
  const domesticChoice = session.domesticResolvedRound === session.round ? session.domesticLog?.[0]?.optionId : undefined;
  const needCommodity = [...COMMODITIES].sort((a, b) => {
    const gapA = nation.publicNeeds[a] - nation.inventory[a] + Math.max(0, session.market.deficits[a]);
    const gapB = nation.publicNeeds[b] - nation.inventory[b] + Math.max(0, session.market.deficits[b]);
    return gapB - gapA;
  })[0];
  const offerCommodity =
    [...COMMODITIES]
      .filter((c) => c !== needCommodity)
      .sort((a, b) => nation.inventory[b] - nation.inventory[a])[0] || 'energy';

  const urgency = nationNeedsGap(nation);
  const demandMultiplier = clamp(0.82, 1.1 + urgency * 0.4 - nation.trustScore / 500, 1.45);
  const requestAmount = Math.max(1, Math.round(Math.max(1, deal.requestAmount) * demandMultiplier));
  const requestValue = requestAmount * session.market.prices[needCommodity];
  let offerAmount = Math.max(1, Math.round((requestValue / session.market.prices[offerCommodity]) * (0.94 - urgency * 0.08)));

  if (domesticChoice === 'stabilize' && (needCommodity === 'food' || needCommodity === 'energy')) offerAmount += 1;
  if (domesticChoice === 'targeted' && needCommodity === nation.priorityCommodity) offerAmount += 1;
  if (domesticChoice === 'austerity') offerAmount = Math.max(1, offerAmount - 1);

  const confidence = Math.round(clamp(45, 70 + urgency * 22 - nation.trustScore * 0.05 + nation.pressure * 1.3, 95));
  return {
    nationId: deal.nationId,
    offerCommodity,
    offerAmount,
    requestCommodity: needCommodity,
    requestAmount,
    confidence,
    rationale: `Adjusted for trust (${Math.round(nation.trustScore)}), needs pressure (${Math.round(urgency * 100)}%), and domestic decision context.`,
  };
}

function evaluateDealWithShift(session: GameSession, deal: Deal, strategyShift: number): RoundOutcome {
  const nation = session.nations[deal.nationId];
  const offerValue = deal.offerAmount * session.market.prices[deal.offerCommodity];
  const requestValue = deal.requestAmount * session.market.prices[deal.requestCommodity];
  const fairnessRatio = requestValue > 0 ? Number((offerValue / requestValue).toFixed(3)) : 0;

  const hasPlayerInventory = session.playerInventory[deal.offerCommodity] >= deal.offerAmount;
  const hasNationInventory = nation.inventory[deal.requestCommodity] >= deal.requestAmount;

  const trustBias = nation.trustScore / 100;
  const pressureBias = nation.pressure * 0.03;
  const styleBias = styleThresholdModifier(nation.bargainingStyle);
  const priorityBias = deal.requestCommodity === nation.priorityCommodity ? 0.05 : -0.03;
  const riskBias = (0.5 - nation.riskTolerance) * 0.05;
  const domesticUrgencyBias = (nation.publicStability - 50) * 0.0012;
  const difficultyBias = DIFFICULTY_CONFIG[session.difficulty].thresholdBonus;
  const advisorBias = session.advisorId === 'diplomat' ? -0.02 : session.advisorId === 'hawk' ? 0.015 : session.advisorId === 'technocrat' ? -0.01 : 0;
  const threshold =
    1.02 -
    trustBias * 0.12 +
    pressureBias +
    styleBias +
    priorityBias +
    riskBias +
    domesticUrgencyBias +
    difficultyBias +
    advisorBias +
    clamp(-0.08, strategyShift, 0.08);

  const accepted = hasPlayerInventory && hasNationInventory && fairnessRatio >= threshold;
  const trustDelta = accepted ? (fairnessRatio >= 1.1 ? 7 : 4) : fairnessRatio < 0.9 ? -7 : -3;
  const rawScore = accepted ? Math.round(offerValue * 0.08 + Math.max(0, trustDelta) * 7) : -12;
  const scoreDelta = Math.round(rawScore * DIFFICULTY_CONFIG[session.difficulty].scoreMultiplier);

  return {
    round: session.round,
    accepted,
    reason: accepted ? `${nation.name} accepts. Terms clear current thresholds.` : `${nation.name} rejects. Terms fail current thresholds.`,
    fairnessRatio,
    trustDelta,
    scoreDelta,
    statusUpdates: accepted
      ? [`${nation.name} accepted under current trust conditions.`, `Route pressure eased for ${deal.requestCommodity.replace('_', ' ')}.`]
      : [`${nation.name} rejected due to risk-adjusted terms.`, 'Counterpart confidence dropped in this corridor.'],
    hiddenAgendaSignal: buildHiddenAgendaSignal(nation, accepted, fairnessRatio),
    marketSnapshot: { ...session.market.prices },
    createdAt: new Date().toISOString(),
  };
}

export function updateTrust(session: GameSession, nationId: NationId, trustDelta: number) {
  const nation = session.nations[nationId];
  nation.trustScore = clamp(-100, nation.trustScore + trustDelta, 100);
  nation.pressure = Number(clamp(0, nation.pressure + (trustDelta < 0 ? 1.5 : -0.4), 10).toFixed(2));
}

export async function resolveRound(session: GameSession): Promise<GameSession> {
  if (!session.pendingDeal || !session.pendingOutcome) throw new Error('No pending deal/outcome to resolve');
  const deal = session.pendingDeal;
  const outcome = session.pendingOutcome;
  const nation = session.nations[deal.nationId];
  outcome.nationId = deal.nationId;
  outcome.offerCommodity = deal.offerCommodity;
  outcome.requestCommodity = deal.requestCommodity;

  if (outcome.accepted) {
    session.playerInventory[deal.offerCommodity] -= deal.offerAmount;
    session.playerInventory[deal.requestCommodity] += deal.requestAmount;
    nation.inventory[deal.offerCommodity] += deal.offerAmount;
    nation.inventory[deal.requestCommodity] -= deal.requestAmount;
  }

  if (outcome.accepted) {
    impactCorridorsForNation(session, deal.nationId, 6, `${nation.name} accepted terms; corridor reliability improved.`);
  } else {
    impactCorridorsForNation(session, deal.nationId, -3, `${nation.name} rejected terms; corridor confidence fell.`);
  }

  updateTrust(session, deal.nationId, outcome.trustDelta);
  session.intelLevels[deal.nationId] = clamp(0, (session.intelLevels[deal.nationId] || 0) + 1, 3);

  const mission = evaluateMission(session.currentMission, deal, outcome);
  if (mission?.completed) {
    session.score += mission.rewardScore;
    outcome.statusUpdates = [`Mission complete: +${mission.rewardScore} score`, ...outcome.statusUpdates];
  }
  if (mission) session.missionLog = [mission, ...session.missionLog].slice(0, 20);

  session.score = Math.max(0, session.score + outcome.scoreDelta);
  session.outcomeLog = [outcome, ...session.outcomeLog].slice(0, 25);

  saveNPCMemory({
    npc_id: deal.nationId,
    player_id: session.playerId,
    memory: `Round ${session.round}: ${outcome.accepted ? 'accepted' : 'rejected'} ${deal.offerAmount} ${deal.offerCommodity} for ${deal.requestAmount} ${deal.requestCommodity}`,
    importance: clamp(1, Math.round(2 + Math.abs(outcome.trustDelta) + Math.abs(1 - outcome.fairnessRatio) * 4), 10),
    metadata: { trustDelta: outcome.trustDelta, fairnessRatio: outcome.fairnessRatio },
  });

  saveGameEvent({
    player_id: session.playerId,
    event_type: 'round_resolved',
    location: deal.nationId,
    metadata: { round: session.round, accepted: outcome.accepted, score: session.score },
  });

  await persistZeroDB(COLLECTIONS.nationMemory, {
    id: randomUUID(),
    session_id: session.id,
    player_id: session.playerId,
    nation_id: deal.nationId,
    round: session.round,
    accepted: outcome.accepted,
    trust_delta: outcome.trustDelta,
    fairness_ratio: outcome.fairnessRatio,
    signal: outcome.hiddenAgendaSignal || '',
    created_at: new Date().toISOString(),
  });

  await persistZeroDB(COLLECTIONS.trustHistory, {
    id: randomUUID(),
    session_id: session.id,
    nation_id: deal.nationId,
    round: session.round,
    trust_score: session.nations[deal.nationId].trustScore,
    pressure: session.nations[deal.nationId].pressure,
    created_at: new Date().toISOString(),
  });

  const globalDrift = await getGlobalDrift();
  if (outcome.accepted) {
    globalDrift[deal.requestCommodity] = Number(clamp(-0.15, globalDrift[deal.requestCommodity] + 0.01, 0.15).toFixed(3));
    globalDrift[deal.offerCommodity] = Number(clamp(-0.15, globalDrift[deal.offerCommodity] - 0.006, 0.15).toFixed(3));
  } else {
    globalDrift[deal.requestCommodity] = Number(clamp(-0.15, globalDrift[deal.requestCommodity] + 0.004, 0.15).toFixed(3));
  }
  await saveGlobalDrift(globalDrift);

  const avgStability = averageNationStability(session);
  const crises = crisisCount(session);
  const catastrophicEarly = avgStability < 22;
  const severeCollapse = avgStability < 30 || (crises >= 3 && avgStability < 50);
  const collapseAllowedThisRound = session.round >= 3 || catastrophicEarly;
  const reachedFinalRound = session.round >= session.maxRounds;

  if ((severeCollapse && collapseAllowedThisRound) || reachedFinalRound) {
    session.isComplete = true;
    const domesticScoreDelta = Math.round((avgStability - 50) * 3);
    session.score = Math.max(0, session.score + domesticScoreDelta);

    const winScoreThreshold = session.difficulty === 'grandmaster' ? 280 : session.difficulty === 'director' ? 235 : 190;
    const winStabilityThreshold = session.difficulty === 'grandmaster' ? 60 : 56;
    const won = !severeCollapse && session.score >= winScoreThreshold && avgStability >= winStabilityThreshold;
    session.endState = won ? 'win' : 'lose';
    session.endReason = severeCollapse && collapseAllowedThisRound
      ? `Severe domestic collapse detected (avg stability ${Math.round(avgStability)}, ${crises} nations in crisis).`
      : won
        ? 'Strategic targets met: score and stability thresholds cleared.'
        : 'Final evaluation failed to meet score/stability victory thresholds.';
    outcome.statusUpdates = [
      ...outcome.statusUpdates,
      `Domestic stability score: ${Math.round(avgStability)} (${domesticScoreDelta >= 0 ? '+' : ''}${domesticScoreDelta} final score).`,
      session.endReason,
    ].slice(0, 7);

    const fairnessSamples = session.outcomeLog.map((o) => o.fairnessRatio).filter((v) => Number.isFinite(v));
    session.runRecap = {
      outcome: won ? 'win' : 'lose',
      reason: session.endReason,
      avgStability: Number(avgStability.toFixed(1)),
      domesticScoreDelta,
      bestDealFairness: fairnessSamples.length ? Number(Math.max(...fairnessSamples).toFixed(3)) : undefined,
      worstDealFairness: fairnessSamples.length ? Number(Math.min(...fairnessSamples).toFixed(3)) : undefined,
      domesticDecisions: (session.domesticLog || []).length,
      endingDebt: Number(session.debt.toFixed(2)),
      endingTreasury: Number(session.treasury.toFixed(2)),
      endingSentiment: Number(session.publicSentiment.toFixed(1)),
    };
  } else {
    session.round += 1;
    const debtUpdate = applyDebtLifecycle(session);
    applyRoundVariance(session);
    applyCorridorRoundDrift(session);
    const nextShock = createShock(session.round, DIFFICULTY_CONFIG[session.difficulty].varianceScale);
    session.market = applyShock(session.market, nextShock.commodity, nextShock.delta, nextShock.headline);
    const shockUpdates = applyShockToNationInventories(session, nextShock.commodity, nextShock.delta);
    const needsUpdates = applyDomesticNeeds(session);
    session.currentMission = createMission(session.round);
    session.currentTurnEvent = createTurnEvent(session);
    session.turnEventResolvedRound = undefined;
    session.currentDomesticScenario = await createDomesticScenario(session);
    session.domesticResolvedRound = undefined;
    session.publicSentiment = Number(clamp(0, session.publicSentiment - 0.6, 100).toFixed(1));
    outcome.statusUpdates = [
      ...outcome.statusUpdates,
      ...(debtUpdate ? [debtUpdate] : []),
      ...shockUpdates.slice(0, 1),
      ...needsUpdates.slice(0, 1),
    ].slice(0, 6);
  }

  session.pendingDeal = undefined;
  session.pendingOutcome = undefined;
  session.latestNarration = deterministicNarration(session, outcome, nation);
  const aiNarration = await aiNarrateRound({ session, outcome, nation });
  if (aiNarration) session.latestNarration = aiNarration;

  if (session.isComplete) {
    updateMetrics((m) => ({
      ...m,
      sessionsCompleted: m.sessionsCompleted + 1,
      sessionsWon: m.sessionsWon + (session.endState === 'win' ? 1 : 0),
      totalFinalScore: m.totalFinalScore + session.score,
    }));

    const progression = await getProgression(session.playerName);
    progression.completedRuns += 1;
    progression.totalScore += session.score;
    progression.bestScore = Math.max(progression.bestScore, session.score);
    progression.unlockedDifficulties = unlockedDifficultiesForRuns(progression.completedRuns);
    progression.unlockedScenarioMods = unlockedScenarioModsForRuns(progression.completedRuns);
    progression.unlockedAdvisors = unlockedAdvisorsForRuns(progression.completedRuns);
    progression.unlockedPerks = unlockedPerksForRuns(progression.completedRuns);
    if (progression.completedRuns >= 3 && !progression.achievements.includes('veteran-negotiator')) {
      progression.achievements.push('veteran-negotiator');
    }
    progression.updatedAt = new Date().toISOString();
    await saveProgression(progression);
    session.progression = progression;
  }

  session.updatedAt = new Date().toISOString();
  return session;
}

export async function startGame(
  playerName: string,
  scenarioId: GameSession['scenarioId'],
  difficulty: Difficulty = 'analyst',
  options?: { judgeMode?: boolean; scenarioModId?: string; advisorId?: string; perkId?: string }
): Promise<GameSession> {
  ensureDataDir();
  const normalizedName = playerName.trim() || 'Trader';
  const progression = await getProgression(normalizedName);
  const allowedDifficulty = progression.unlockedDifficulties.includes(difficulty) ? difficulty : 'analyst';
  const allowedScenarioMod = progression.unlockedScenarioMods.includes(options?.scenarioModId || '') ? options?.scenarioModId : 'none';
  const allowedAdvisor = progression.unlockedAdvisors.includes(options?.advisorId || '') ? options?.advisorId : 'none';
  const allowedPerk = progression.unlockedPerks.includes(options?.perkId || '') ? options?.perkId : 'none';
  const cfg = DIFFICULTY_CONFIG[allowedDifficulty];

  const id = randomUUID();
  const playerId = randomUUID();
  const prices = scenarioPrices(scenarioId);
  const globalDrift = await getGlobalDrift();
  for (const c of COMMODITIES) {
    prices[c] = Number(clamp(35, prices[c] * (1 + globalDrift[c]), 340).toFixed(2));
  }
  const firstShock = createShock(1, cfg.varianceScale, preferredScenarioShock(scenarioId));

  const market: MarketState = applyShock(
    {
      prices,
      deficits: computeDeficits(prices),
      shockCommodity: firstShock.commodity,
      shockDeltaPct: firstShock.delta,
      shockHeadline: firstShock.headline,
    },
    firstShock.commodity,
    firstShock.delta,
    firstShock.headline
  );

  const session: GameSession = {
    id,
    playerId,
    playerName: normalizedName,
    difficulty: allowedDifficulty,
    scenarioId,
    round: 1,
    maxRounds: cfg.maxRounds,
    isComplete: false,
    endState: 'in_progress',
    score: 0,
    market,
    nations: createNations(cfg.varianceScale),
    intelLevels: { usa: 0, china: 0, eu: 0, india: 0, opec: 0 },
    playerInventory: randomizePlayerInventory(cfg.varianceScale),
    treasury: 120,
    debt: 0,
    publicSentiment: 56,
    debtRate: 0.05,
    currentMission: createMission(1),
    currentTurnEvent: undefined,
    turnEventResolvedRound: undefined,
    currentDomesticScenario: undefined,
    domesticLog: [],
    turnEventLog: [],
    corridors: createInitialCorridors(),
    missionLog: [],
    outcomeLog: [],
    progression,
    judgeMode: Boolean(options?.judgeMode),
    advisorId: allowedAdvisor,
    perkId: allowedPerk,
    scenarioModId: allowedScenarioMod,
    updatedAt: new Date().toISOString(),
  };

  applyScenarioModifiers(session);
  if (options?.judgeMode) {
    session.treasury = 145;
    session.publicSentiment = 64;
    for (const id of NATION_IDS) {
      session.nations[id].trustScore = Number(clamp(-100, session.nations[id].trustScore + 8, 100).toFixed(1));
      session.nations[id].pressure = Number(clamp(0, session.nations[id].pressure - 0.35, 10).toFixed(2));
      session.nations[id].publicStability = Number(clamp(0, session.nations[id].publicStability + 2.8, 100).toFixed(1));
    }
    for (const c of COMMODITIES) {
      session.playerInventory[c] = Number((session.playerInventory[c] + 2).toFixed(1));
    }
  }
  if (allowedScenarioMod === 'volatility_dampener') {
    session.market.shockDeltaPct = Number((session.market.shockDeltaPct * 0.82).toFixed(3));
    session.market.prices[session.market.shockCommodity] = Number(clamp(35, session.market.prices[session.market.shockCommodity] * 0.96, 340).toFixed(2));
    recomputeDeficits(session);
  }
  if (allowedScenarioMod === 'liquidity_surge') {
    session.treasury = Number((session.treasury + 18).toFixed(2));
  }
  if (allowedAdvisor === 'diplomat') {
    for (const id of NATION_IDS) session.nations[id].trustScore = Number(clamp(-100, session.nations[id].trustScore + 6, 100).toFixed(1));
  } else if (allowedAdvisor === 'hawk') {
    session.score += 8;
    for (const id of NATION_IDS) session.nations[id].pressure = Number(clamp(0, session.nations[id].pressure + 0.4, 10).toFixed(2));
  } else if (allowedAdvisor === 'technocrat') {
    session.publicSentiment = Number(clamp(0, session.publicSentiment + 2, 100).toFixed(1));
    session.debtRate = 0.045;
  }
  if (allowedPerk === 'strategic_reserves') {
    for (const c of COMMODITIES) session.playerInventory[c] = Number((session.playerInventory[c] + 3).toFixed(1));
  } else if (allowedPerk === 'public_safety_net') {
    session.publicSentiment = Number(clamp(0, session.publicSentiment + 5, 100).toFixed(1));
  } else if (allowedPerk === 'credit_facility') {
    session.debtRate = 0.04;
    session.treasury = Number((session.treasury + 10).toFixed(2));
  }
  session.currentTurnEvent = createTurnEvent(session);
  session.currentDomesticScenario = await createDomesticScenario(session);
  // Round-1 shock should immediately affect real inventories, not just prices.
  applyShockToNationInventories(session, market.shockCommodity, market.shockDeltaPct);
  applyDomesticNeeds(session);

  await saveSession(session);
  trackSessionStart(session.playerName);
  saveGameEvent({
    player_id: playerId,
    event_type: 'session_started',
    location: 'game',
    metadata: {
      sessionId: id,
      scenarioId,
      difficulty: allowedDifficulty,
      scenarioModId: allowedScenarioMod,
      advisorId: allowedAdvisor,
      perkId: allowedPerk,
      judgeMode: Boolean(options?.judgeMode),
    },
  });
  return session;
}

export async function createDeal(id: string, deal: Deal): Promise<{ session: GameSession; outcome: RoundOutcome }> {
  const session = await getGameState(id);
  if (!session) throw new Error('Game not found');
  if (session.isComplete) throw new Error('Game already complete');
  if (session.turnEventResolvedRound !== session.round) {
    throw new Error('Resolve the turn event for this round before submitting trade proposals');
  }
  if (session.domesticResolvedRound !== session.round) {
    throw new Error('Resolve the domestic scenario for this round before submitting trade proposals');
  }
  if (session.pendingOutcome) throw new Error('Advance current round before creating a new deal');

  const strategy = await aiCounterStrategyShift({ session, nation: session.nations[deal.nationId], deal });
  const outcome = evaluateDealWithShift(session, deal, strategy?.thresholdShift || 0);
  if (!outcome.accepted) {
    outcome.counterOffer = deterministicCounterOffer(session, deal);
  }
  if (strategy?.strategyNote) {
    outcome.statusUpdates = [strategy.strategyNote, ...outcome.statusUpdates].slice(0, 3);
  }
  const ai = await aiFlavorDealOutcome({ nation: session.nations[deal.nationId], deal, outcome, session });
  if (ai?.reason) outcome.reason = ai.reason;
  if (ai?.statusUpdates?.length) outcome.statusUpdates = ai.statusUpdates;
  if (ai?.hiddenAgendaSignal) outcome.hiddenAgendaSignal = ai.hiddenAgendaSignal;
  if (ai?.counterOffer?.offerCommodity && ai?.counterOffer?.requestCommodity && ai?.counterOffer?.offerAmount && ai?.counterOffer?.requestAmount) {
    outcome.counterOffer = {
      nationId: deal.nationId,
      offerCommodity: ai.counterOffer.offerCommodity as Commodity,
      offerAmount: Math.max(1, Math.round(ai.counterOffer.offerAmount)),
      requestCommodity: ai.counterOffer.requestCommodity as Commodity,
      requestAmount: Math.max(1, Math.round(ai.counterOffer.requestAmount)),
      confidence: typeof ai.counterOffer.confidence === 'number' ? Math.max(0, Math.min(100, ai.counterOffer.confidence)) : 60,
      rationale: typeof ai.counterOffer.rationale === 'string' ? ai.counterOffer.rationale : 'Counter-offer generated by nation strategy model.',
    };
  }

  session.pendingDeal = deal;
  session.pendingOutcome = outcome;
  session.updatedAt = new Date().toISOString();
  await saveSession(session);

  updateMetrics((m) => ({ ...m, dealsMade: m.dealsMade + 1 }));
  saveGameEvent({
    player_id: session.playerId,
    event_type: 'deal_submitted',
    location: deal.nationId,
    metadata: { round: session.round, deal },
  });

  return { session, outcome };
}

export async function resolveDomesticScenario(
  id: string,
  optionId: string
): Promise<{ session: GameSession; decision: DomesticDecisionRecord }> {
  const session = await getGameState(id);
  if (!session) throw new Error('Game not found');
  if (session.isComplete) throw new Error('Game already complete');
  const scenario = session.currentDomesticScenario;
  if (!scenario) throw new Error('No domestic scenario available');
  if (session.domesticResolvedRound === session.round) throw new Error('Domestic scenario already resolved this round');
  const option = scenario.options.find((o) => o.id === optionId);
  if (!option) throw new Error('Invalid domestic option');

  const applied = applyDomesticDecision(session, scenario, option.id);
  session.publicSentiment = Number(clamp(0, session.publicSentiment + applied.sentimentImpact, 100).toFixed(1));
  session.score = Math.max(0, session.score + (option.id === 'stabilize' ? 6 : option.id === 'targeted' ? 4 : 2));

  const decision: DomesticDecisionRecord = {
    id: randomUUID(),
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    round: session.round,
    optionId: option.id,
    optionLabel: option.label,
    treasuryImpact: applied.treasuryImpact,
    debtImpact: applied.debtImpact,
    sentimentImpact: applied.sentimentImpact,
    resourceImpact: applied.resourceImpact,
    summary: applied.summary,
    createdAt: new Date().toISOString(),
  };
  session.domesticResolvedRound = session.round;
  session.domesticLog = [decision, ...(session.domesticLog || [])].slice(0, 30);
  session.updatedAt = new Date().toISOString();

  saveGameEvent({
    player_id: session.playerId,
    event_type: 'domestic_decision',
    location: 'domestic',
    metadata: { round: session.round, scenarioId: scenario.id, optionId: option.id, treasuryImpact: applied.treasuryImpact, debtImpact: applied.debtImpact },
  });

  updateMetrics((m) => ({ ...m, domesticDecisions: m.domesticDecisions + 1 }));
  await saveSession(session);
  return { session, decision };
}

export async function resolveTurnEvent(
  id: string,
  optionId: string
): Promise<{ session: GameSession; decision: TurnEventRecord }> {
  const session = await getGameState(id);
  if (!session) throw new Error('Game not found');
  if (session.isComplete) throw new Error('Game already complete');
  const event = session.currentTurnEvent;
  if (!event) throw new Error('No turn event available');
  if (session.turnEventResolvedRound === session.round) throw new Error('Turn event already resolved this round');
  const option = event.options.find((o) => o.id === optionId);
  if (!option) throw new Error('Invalid turn event option');

  const applied = applyTurnEventDecision(session, event, option.id);
  session.publicSentiment = Number(clamp(0, session.publicSentiment + applied.sentimentImpact, 100).toFixed(1));
  session.turnEventResolvedRound = session.round;

  const decision: TurnEventRecord = {
    id: randomUUID(),
    eventId: event.id,
    eventType: event.type,
    round: session.round,
    optionId: option.id,
    optionLabel: option.label,
    treasuryImpact: Number(applied.treasuryImpact.toFixed(2)),
    sentimentImpact: applied.sentimentImpact,
    corridorImpact: applied.corridorImpact,
    resourceImpact: applied.resourceImpact,
    summary: applied.summary,
    createdAt: new Date().toISOString(),
  };

  session.turnEventLog = [decision, ...(session.turnEventLog || [])].slice(0, 30);
  session.updatedAt = new Date().toISOString();

  saveGameEvent({
    player_id: session.playerId,
    event_type: 'turn_event',
    location: 'turn',
    metadata: { round: session.round, eventType: event.type, severity: event.severity, optionId: option.id, corridorImpact: applied.corridorImpact },
  });

  updateMetrics((m) => ({ ...m, turnEventsResolved: m.turnEventsResolved + 1 }));
  await saveSession(session);
  return { session, decision };
}

export async function advanceRound(id: string): Promise<{ session: GameSession; outcome: RoundOutcome }> {
  const session = await getGameState(id);
  if (!session) throw new Error('Game not found');
  if (!session.pendingOutcome) throw new Error('No pending deal. Submit a deal first.');

  const outcome = session.pendingOutcome;
  const resolved = await resolveRound(session);
  await saveSession(resolved);
  updateMetrics((m) => ({ ...m, roundsCompleted: m.roundsCompleted + 1 }));

  return { session: resolved, outcome };
}

function deterministicCopilotSuggestion(session: GameSession, nationId: NationId): DealSuggestion {
  const nation = session.nations[nationId];
  const needCommodity = [...COMMODITIES].sort((a, b) => session.market.deficits[b] - session.market.deficits[a])[0];
  const offerCommodity =
    [...COMMODITIES]
      .sort((a, b) => session.playerInventory[b] * session.market.prices[b] - session.playerInventory[a] * session.market.prices[a])
      .find((c) => c !== needCommodity) || 'energy';
  const baseRequest = needCommodity === nation.priorityCommodity ? 4 : 3;
  const requestAmount = Math.max(1, Math.min(baseRequest, Math.floor(nation.inventory[needCommodity] * 0.25)));
  const offerAmount = Math.max(1, Math.round((requestAmount * session.market.prices[needCommodity]) / session.market.prices[offerCommodity]));
  const confidence = Math.max(45, Math.min(90, Math.round(62 + nation.trustScore * 0.2 - nation.pressure * 2)));
  return {
    nationId,
    offerCommodity,
    offerAmount,
    requestCommodity: needCommodity,
    requestAmount,
    confidence,
    rationale: `Targets ${commodityLabel(needCommodity)} deficit while staying near fair value for ${nation.name}.`,
  };
}

export async function getCopilotSuggestion(id: string, preferredNationId?: NationId): Promise<DealSuggestion> {
  const session = await getGameState(id);
  if (!session) throw new Error('Game not found');
  if (session.isComplete) throw new Error('Game already complete');
  const orderedNations = [...NATION_IDS].sort((a, b) => session.nations[b].trustScore - session.nations[a].trustScore);
  const nationId = preferredNationId || orderedNations[0] || 'usa';
  const deterministic = deterministicCopilotSuggestion(session, nationId);
  const aiSuggestion = await aiCopilotDealSuggestion({ session, nation: session.nations[nationId] });
  if (!aiSuggestion) return deterministic;
  return {
    ...deterministic,
    ...aiSuggestion,
    nationId,
    offerAmount: Math.max(1, aiSuggestion.offerAmount || deterministic.offerAmount),
    requestAmount: Math.max(1, aiSuggestion.requestAmount || deterministic.requestAmount),
  };
}

export async function getProgressionPreview(playerName: string): Promise<ProgressionProfile> {
  return getProgression(playerName);
}

export function getGameMetrics(): GameMetrics {
  const existing = readJson<Partial<GameMetrics>>(metricsPath()) || {};
  return { ...defaultMetrics(), ...existing };
}

export function getGameMetricsSummary() {
  const m = getGameMetrics();
  const completionRate = m.sessionsStarted > 0 ? m.sessionsCompleted / m.sessionsStarted : 0;
  const winRate = m.sessionsCompleted > 0 ? m.sessionsWon / m.sessionsCompleted : 0;
  const averageScore = m.sessionsCompleted > 0 ? m.totalFinalScore / m.sessionsCompleted : 0;
  return {
    ...m,
    completionRate: Number((completionRate * 100).toFixed(2)),
    winRate: Number((winRate * 100).toFixed(2)),
    averageScore: Number(averageScore.toFixed(2)),
  };
}
