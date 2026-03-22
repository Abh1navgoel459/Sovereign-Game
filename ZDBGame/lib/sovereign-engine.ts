import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { saveGameEvent, saveNPCMemory, saveWorldEvent } from '@/lib/data';
import { generateAINationNarrative } from '@/lib/sovereign-ai';
import { buildDeterministicNarrative } from '@/lib/sovereign-narrative';
import type {
  Commodity,
  DealProposal,
  DealResponse,
  MarketShock,
  NationId,
  NationState,
  RoundSummary,
  ScenarioId,
  SessionResult,
  SovereignState,
} from '@/lib/sovereign-types';

const DATA_DIR = path.join(process.cwd(), '.data');
const MAX_ROUNDS = 5;

const COMMODITIES: Commodity[] = ['energy', 'food', 'tech', 'rare_earths'];

const BASE_PRICES: Record<Commodity, number> = {
  energy: 100,
  food: 70,
  tech: 130,
  rare_earths: 160,
};

const BASE_PLAYER_INVENTORY: Record<Commodity, number> = {
  energy: 18,
  food: 18,
  tech: 18,
  rare_earths: 18,
};

const BASE_DEMAND: Record<Commodity, number> = {
  energy: 14,
  food: 12,
  tech: 11,
  rare_earths: 10,
};

const SCENARIOS: Record<
  ScenarioId,
  {
    id: ScenarioId;
    name: string;
    description: string;
    priceMultiplier: Partial<Record<Commodity, number>>;
    initialShockCommodity: Commodity;
  }
> = {
  energy_crunch: {
    id: 'energy_crunch',
    name: 'Energy Crunch 2035',
    description: 'Energy volatility ripples through all trade corridors.',
    priceMultiplier: { energy: 1.2, tech: 1.08 },
    initialShockCommodity: 'energy',
  },
  food_shock: {
    id: 'food_shock',
    name: 'Food Security Spiral',
    description: 'Food supply pressure destabilizes global bargaining power.',
    priceMultiplier: { food: 1.25, energy: 1.06 },
    initialShockCommodity: 'food',
  },
  tech_arms_race: {
    id: 'tech_arms_race',
    name: 'Tech Arms Race',
    description: 'High-end component scarcity drives premium deals.',
    priceMultiplier: { tech: 1.3, rare_earths: 1.15 },
    initialShockCommodity: 'tech',
  },
};

const SHOCK_HEADLINES: Record<Commodity, string[]> = {
  energy: [
    'Pipeline maintenance disrupts major export corridor',
    'New LNG terminal opens, easing short-term scarcity',
    'Unexpected refinery outage tightens supply outlook',
  ],
  food: [
    'Heatwave pressures crop output across key regions',
    'Harvest rebound increases short-term grain availability',
    'Shipping bottlenecks delay staple food deliveries',
  ],
  tech: [
    'Chip fabrication upgrades boost premium component output',
    'Export controls tighten advanced hardware flow',
    'Factory downtime raises lead times for core processors',
  ],
  rare_earths: [
    'Mining strike slows rare earth concentrate shipments',
    'New extraction capacity comes online ahead of schedule',
    'Port congestion delays magnet input delivery timelines',
  ],
};

const NATION_BLUEPRINTS: Record<NationId, NationState> = {
  usa: {
    id: 'usa',
    name: 'United States',
    publicObjective: 'Stabilize advanced manufacturing and energy costs',
    hiddenAgenda: 'Lock in tech dominance through long-term access contracts',
    style: 'direct and leverage-focused',
    inventory: { energy: 22, food: 18, tech: 26, rare_earths: 11 },
  },
  china: {
    id: 'china',
    name: 'China',
    publicObjective: 'Maintain export momentum while reducing volatility',
    hiddenAgenda: 'Increase downstream control of strategic materials',
    style: 'patient and volume-oriented',
    inventory: { energy: 14, food: 16, tech: 24, rare_earths: 28 },
  },
  eu: {
    id: 'eu',
    name: 'EU Bloc',
    publicObjective: 'Keep supply chains resilient and contract risk low',
    hiddenAgenda: 'Diversify away from concentrated suppliers',
    style: 'risk-controlled and policy-heavy',
    inventory: { energy: 10, food: 20, tech: 21, rare_earths: 9 },
  },
  india: {
    id: 'india',
    name: 'India',
    publicObjective: 'Sustain growth through affordable imports',
    hiddenAgenda: 'Use demand growth to renegotiate global terms',
    style: 'adaptive and opportunistic',
    inventory: { energy: 12, food: 24, tech: 14, rare_earths: 10 },
  },
  opec: {
    id: 'opec',
    name: 'OPEC+',
    publicObjective: 'Protect producer margins in volatile markets',
    hiddenAgenda: 'Convert energy leverage into strategic trade access',
    style: 'quota-driven and tactical',
    inventory: { energy: 34, food: 9, tech: 8, rare_earths: 7 },
  },
};

const HIDDEN_AGENDA_VECTOR: Record<
  NationId,
  { wants: Commodity; avoids: Commodity; signal: string }
> = {
  usa: {
    wants: 'rare_earths',
    avoids: 'tech',
    signal: 'They keep referencing supply security for strategic manufacturing lanes.',
  },
  china: {
    wants: 'energy',
    avoids: 'rare_earths',
    signal: 'They repeatedly emphasize control of processing depth and throughput.',
  },
  eu: {
    wants: 'food',
    avoids: 'tech',
    signal: 'They prioritize diversification language over absolute price wins.',
  },
  india: {
    wants: 'tech',
    avoids: 'food',
    signal: 'They frame deals around growth acceleration and scaling reliability.',
  },
  opec: {
    wants: 'tech',
    avoids: 'energy',
    signal: 'They trade energy only when it expands downstream strategic leverage.',
  },
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function sessionPath(sessionId: string): string {
  return path.join(DATA_DIR, `sovereign_session_${sessionId}.json`);
}

function atomicWrite(filePath: string, payload: SovereignState): void {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

function readSession(sessionId: string): SovereignState | null {
  const filePath = sessionPath(sessionId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SovereignState;
}

function writeSession(state: SovereignState): SovereignState {
  ensureDataDir();
  const filePath = sessionPath(state.sessionId);
  atomicWrite(filePath, state);
  return state;
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomFrom<T>(list: T[]): T {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function resolveScenario(scenarioId?: string): (typeof SCENARIOS)[ScenarioId] {
  if (scenarioId && scenarioId in SCENARIOS) {
    return SCENARIOS[scenarioId as ScenarioId];
  }

  return SCENARIOS.energy_crunch;
}

function generateShock(round: number, preferred?: Commodity): MarketShock {
  const commodity = preferred || randomFrom(COMMODITIES);
  const polarity = Math.random() > 0.5 ? 1 : -1;
  const magnitude = 0.08 + Math.random() * 0.14;
  const deltaPct = Number((polarity * magnitude).toFixed(3));
  const headline = `${randomFrom(SHOCK_HEADLINES[commodity])} (Round ${round})`;

  return { commodity, deltaPct, headline };
}

function applyShock(state: SovereignState, shock: MarketShock): void {
  const base = state.marketPrices[shock.commodity];
  const adjusted = base * (1 + shock.deltaPct);
  state.marketPrices[shock.commodity] = Number(clamp(40, adjusted, 320).toFixed(2));
}

function calculateFairness(state: SovereignState, proposal: DealProposal): number {
  const offerValue = proposal.offerAmount * state.marketPrices[proposal.offerCommodity];
  const requestValue = proposal.requestAmount * state.marketPrices[proposal.requestCommodity];

  if (requestValue <= 0) {
    return 0;
  }

  return Number((offerValue / requestValue).toFixed(3));
}

function deficitScore(inventory: Record<Commodity, number>, commodity: Commodity): number {
  return clamp(0, BASE_DEMAND[commodity] - inventory[commodity], 20);
}

function agendaAlignment(nationId: NationId, proposal: DealProposal): number {
  const vector = HIDDEN_AGENDA_VECTOR[nationId];
  let score = 0;

  if (proposal.offerCommodity === vector.wants) {
    score += 0.35;
  }

  if (proposal.requestCommodity === vector.avoids) {
    score -= 0.35;
  }

  if (proposal.requestCommodity === vector.wants) {
    score -= 0.15;
  }

  if (proposal.offerCommodity === vector.avoids) {
    score += 0.1;
  }

  return score;
}

function makeCounterTerms(
  trustScore: number,
  fairnessRatio: number,
  proposal: DealProposal,
  nationId: NationId
): { minOfferAmount: number; maxRequestAmount: number; rationale: string } {
  const agenda = HIDDEN_AGENDA_VECTOR[nationId];
  const trustPenalty = trustScore < 0 ? Math.ceil(Math.abs(trustScore) / 28) : 0;
  const fairnessPenalty = fairnessRatio < 1 ? Math.ceil((1 - fairnessRatio) * 4) : 0;

  let minOfferAmount = proposal.offerAmount + trustPenalty + fairnessPenalty;
  let maxRequestAmount = proposal.requestAmount - trustPenalty;

  if (proposal.offerCommodity === agenda.wants) {
    minOfferAmount = Math.max(1, minOfferAmount - 1);
  }

  if (proposal.requestCommodity === agenda.avoids) {
    maxRequestAmount = Math.max(1, maxRequestAmount - 1);
  }

  if (trustScore > 35) {
    maxRequestAmount += 1;
  }

  const rationale =
    trustScore < -15
      ? 'Rebuild credibility first: stronger collateral and tighter ask required.'
      : proposal.offerCommodity === agenda.wants
      ? 'Closer to current procurement priorities; improve ratio slightly to close.'
      : 'Terms need better balance against current portfolio pressures.';

  return {
    minOfferAmount: Math.max(1, minOfferAmount),
    maxRequestAmount: Math.max(1, maxRequestAmount),
    rationale,
  };
}

function evaluateDeal(state: SovereignState, proposal: DealProposal): DealResponse {
  const nation = state.nations[proposal.nationId];
  const trustScore = state.trustScores[proposal.nationId];

  if (!nation) {
    return {
      accepted: false,
      reason: 'Counterparty unavailable for this round.',
      trustDelta: -4,
      trustScore,
      fairnessRatio: 0,
      agendaSignal: 'Routing instability detected in this market corridor.',
    };
  }

  if (proposal.offerAmount <= 0 || proposal.requestAmount <= 0) {
    return {
      accepted: false,
      reason: 'Deal quantities must be positive.',
      trustDelta: -3,
      trustScore,
      fairnessRatio: 0,
      agendaSignal: HIDDEN_AGENDA_VECTOR[proposal.nationId].signal,
    };
  }

  if (state.playerInventory[proposal.offerCommodity] < proposal.offerAmount) {
    return {
      accepted: false,
      reason: `You do not hold enough ${proposal.offerCommodity.replace('_', ' ')} to honor this contract.`,
      trustDelta: -5,
      trustScore,
      fairnessRatio: 0,
      agendaSignal: HIDDEN_AGENDA_VECTOR[proposal.nationId].signal,
    };
  }

  if (nation.inventory[proposal.requestCommodity] < proposal.requestAmount) {
    return {
      accepted: false,
      reason: `${nation.name} cannot release that quantity of ${proposal.requestCommodity.replace('_', ' ')} this round.`,
      trustDelta: -2,
      trustScore,
      fairnessRatio: 0,
      agendaSignal: HIDDEN_AGENDA_VECTOR[proposal.nationId].signal,
    };
  }

  const fairnessRatio = calculateFairness(state, proposal);
  const trustFactor = trustScore / 100;
  const needForOffer = deficitScore(nation.inventory, proposal.offerCommodity);
  const painOfGiving = deficitScore(nation.inventory, proposal.requestCommodity);
  const agendaBias = agendaAlignment(proposal.nationId, proposal);

  const acceptanceThreshold = 1.04 - trustFactor * 0.12 - agendaBias * 0.08;
  const dealSignal = fairnessRatio * 0.85 + trustFactor * 0.6 + (needForOffer - painOfGiving) * 0.05 + agendaBias;
  const accepted = dealSignal >= acceptanceThreshold;

  if (accepted) {
    const trustDelta = fairnessRatio >= 1.08 ? 7 : fairnessRatio >= 0.98 ? 4 : 2;

    return {
      accepted: true,
      reason: `${nation.name} accepts. Terms align with current constraints and confidence levels.`,
      trustDelta,
      trustScore,
      fairnessRatio,
      agendaSignal: HIDDEN_AGENDA_VECTOR[proposal.nationId].signal,
    };
  }

  return {
    accepted: false,
    reason: `${nation.name} rejects. Terms do not meet current risk-adjusted thresholds.`,
    trustDelta: fairnessRatio < 0.92 ? -7 : -3,
    trustScore,
    fairnessRatio,
    agendaSignal: HIDDEN_AGENDA_VECTOR[proposal.nationId].signal,
    counterOffer: makeCounterTerms(trustScore, fairnessRatio, proposal, proposal.nationId),
  };
}

function transferIfAccepted(state: SovereignState, proposal: DealProposal, response: DealResponse): void {
  if (!response.accepted) {
    return;
  }

  const nation = state.nations[proposal.nationId];

  state.playerInventory[proposal.offerCommodity] -= proposal.offerAmount;
  state.playerInventory[proposal.requestCommodity] += proposal.requestAmount;

  nation.inventory[proposal.offerCommodity] += proposal.offerAmount;
  nation.inventory[proposal.requestCommodity] -= proposal.requestAmount;
}

function applyConsumption(state: SovereignState): void {
  (Object.keys(state.nations) as NationId[]).forEach((nationId) => {
    const nation = state.nations[nationId];

    COMMODITIES.forEach((commodity) => {
      const consumption = BASE_DEMAND[commodity] * (0.85 + Math.random() * 0.3);
      nation.inventory[commodity] = Number(clamp(0, nation.inventory[commodity] - consumption, 80).toFixed(2));

      if (nation.inventory[commodity] < BASE_DEMAND[commodity] * 0.65) {
        state.marketPrices[commodity] = Number(clamp(40, state.marketPrices[commodity] * 1.05, 320).toFixed(2));
      }
    });
  });
}

function updateTrustAndMemory(
  state: SovereignState,
  proposal: DealProposal,
  response: DealResponse
): void {
  const nation = state.nations[proposal.nationId];
  const trustScore = clamp(-100, state.trustScores[proposal.nationId] + response.trustDelta, 100);
  state.trustScores[proposal.nationId] = trustScore;
  const offerValue = proposal.offerAmount * state.marketPrices[proposal.offerCommodity];
  const requestValue = proposal.requestAmount * state.marketPrices[proposal.requestCommodity];
  const valueWeight = (offerValue + requestValue) / 220;
  const trustWeight = Math.abs(response.trustDelta) * 0.7;
  const fairnessWeight = Math.abs(1 - response.fairnessRatio) * 4.5;
  const rawImportance = 2 + valueWeight + trustWeight + fairnessWeight;
  const importance = clamp(1, Math.round(rawImportance), 10);

  saveNPCMemory({
    npc_id: nation.id,
    player_id: state.playerId,
    memory: `Round ${state.round}: ${response.accepted ? 'Accepted' : 'Rejected'} ${proposal.offerAmount} ${proposal.offerCommodity} for ${proposal.requestAmount} ${proposal.requestCommodity}.`,
    importance,
    metadata: {
      fairnessRatio: response.fairnessRatio,
      trustDelta: response.trustDelta,
      trustScore,
      playerNote: proposal.note || '',
      counterOffer: response.counterOffer || null,
    },
  });
}

function detectMarketEvents(
  state: SovereignState,
  proposal: DealProposal,
  response: DealResponse
): string[] {
  const events: string[] = [];
  const trustScore = state.trustScores[proposal.nationId];
  const nation = state.nations[proposal.nationId];

  (Object.keys(state.marketPrices) as Commodity[]).forEach((commodity) => {
    const price = state.marketPrices[commodity];
    if (price >= 190) {
      events.push(`${commodity.replace('_', ' ')} price spike reshapes procurement urgency.`);
    } else if (price <= 65) {
      events.push(`${commodity.replace('_', ' ')} glut creates opportunistic arbitrage windows.`);
    }
  });

  if (response.accepted && trustScore >= 35) {
    events.push(`${nation.name} opens a preferred trade corridor due to sustained trust.`);
  }

  if (!response.accepted && trustScore <= -30) {
    events.push(`${nation.name} imposes stricter counterparty controls after repeated friction.`);
  }

  const unique = Array.from(new Set(events)).slice(0, 3);
  unique.forEach((description) => {
    saveWorldEvent({
      event_name: 'Sovereign Market Event',
      description,
      trigger_source: state.playerId,
      metadata: {
        round: state.round,
        nationId: proposal.nationId,
        trustScore,
      },
    });
  });

  return unique;
}

function logTelemetry(state: SovereignState, proposal: DealProposal, response: DealResponse): void {
  saveGameEvent({
    player_id: state.playerId,
    event_type: 'deal_proposed',
    location: proposal.nationId,
    metadata: {
      round: state.round,
      proposal,
      response,
      shock: state.activeShock,
      trustScore: state.trustScores[proposal.nationId],
    },
  });

  saveGameEvent({
    player_id: state.playerId,
    event_type: response.accepted ? 'deal_accepted' : 'deal_rejected',
    location: proposal.nationId,
    metadata: {
      round: state.round,
      fairnessRatio: response.fairnessRatio,
      trustDelta: response.trustDelta,
      trustScore: state.trustScores[proposal.nationId],
      agendaSignal: response.agendaSignal,
    },
  });
}

function cloneNations(): Record<NationId, NationState> {
  return {
    usa: { ...NATION_BLUEPRINTS.usa, inventory: { ...NATION_BLUEPRINTS.usa.inventory } },
    china: { ...NATION_BLUEPRINTS.china, inventory: { ...NATION_BLUEPRINTS.china.inventory } },
    eu: { ...NATION_BLUEPRINTS.eu, inventory: { ...NATION_BLUEPRINTS.eu.inventory } },
    india: { ...NATION_BLUEPRINTS.india, inventory: { ...NATION_BLUEPRINTS.india.inventory } },
    opec: { ...NATION_BLUEPRINTS.opec, inventory: { ...NATION_BLUEPRINTS.opec.inventory } },
  };
}

function calculateScore(state: SovereignState): { score: number; avgTrust: number; tier: SovereignState['outcomeTier'] } {
  const portfolioValue = Object.entries(state.playerInventory).reduce((sum, [commodity, amount]) => {
    const key = commodity as Commodity;
    return sum + amount * state.marketPrices[key];
  }, 0);

  const trustValues = Object.values(state.trustScores);
  const avgTrust = trustValues.reduce((acc, value) => acc + value, 0) / trustValues.length;
  const score = Math.round(portfolioValue + avgTrust * 22);

  let tier: SovereignState['outcomeTier'] = 'Bronze';
  if (score >= 5100) tier = 'Sovereign';
  else if (score >= 4400) tier = 'Gold';
  else if (score >= 3700) tier = 'Silver';

  return { score, avgTrust, tier };
}

export function createSovereignSession(playerName: string, scenarioId?: string): SessionResult {
  const sessionId = randomUUID();
  const playerId = randomUUID();
  const scenario = resolveScenario(scenarioId);
  const marketPrices: Record<Commodity, number> = { ...BASE_PRICES };

  (Object.keys(scenario.priceMultiplier) as Commodity[]).forEach((commodity) => {
    const multiplier = scenario.priceMultiplier[commodity] || 1;
    marketPrices[commodity] = Number((marketPrices[commodity] * multiplier).toFixed(2));
  });

  const state: SovereignState = {
    sessionId,
    playerId,
    playerName: playerName.trim() || 'Trader',
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    round: 1,
    maxRounds: MAX_ROUNDS,
    isComplete: false,
    score: 0,
    marketPrices,
    activeShock: generateShock(1, scenario.initialShockCommodity),
    playerInventory: { ...BASE_PLAYER_INVENTORY },
    nations: cloneNations(),
    trustScores: {
      usa: 0,
      china: 0,
      eu: 0,
      india: 0,
      opec: 0,
    },
    roundHistory: [],
    updatedAt: new Date().toISOString(),
  };

  applyShock(state, state.activeShock);
  state.score = calculateScore(state).score;

  saveGameEvent({
    player_id: state.playerId,
    event_type: 'session_started',
    location: 'sovereign',
    metadata: {
      sessionId,
      playerName: state.playerName,
      scenarioId: scenario.id,
      round: 1,
      shock: state.activeShock,
    },
  });

  writeSession(state);
  return { state };
}

export function getSovereignSession(sessionId: string): SessionResult | null {
  const state = readSession(sessionId);
  if (!state) {
    return null;
  }

  return { state };
}

export async function proposeSovereignDeal(sessionId: string, proposal: DealProposal): Promise<SessionResult> {
  const state = readSession(sessionId);

  if (!state) {
    throw new Error('Session not found');
  }

  if (state.isComplete) {
    throw new Error('Game already complete');
  }

  const response = evaluateDeal(state, proposal);
  const deterministicNarrative = buildDeterministicNarrative({
    nation: state.nations[proposal.nationId],
    trustScore: state.trustScores[proposal.nationId],
    proposal,
    response,
  });

  response.reason = deterministicNarrative.reason;
  response.agendaSignal = deterministicNarrative.agendaSignal;
  if (response.counterOffer && deterministicNarrative.counterRationale) {
    response.counterOffer = {
      ...response.counterOffer,
      rationale: deterministicNarrative.counterRationale,
    };
  }

  const aiNarrative = await generateAINationNarrative({
    nation: state.nations[proposal.nationId],
    trustScore: state.trustScores[proposal.nationId],
    proposal,
    response,
    marketPrices: state.marketPrices,
    round: state.round,
    shockHeadline: state.activeShock.headline,
  });

  if (aiNarrative?.reason) {
    response.reason = aiNarrative.reason;
  }
  if (aiNarrative?.agendaSignal) {
    response.agendaSignal = aiNarrative.agendaSignal;
  }
  if (response.counterOffer && aiNarrative?.counterRationale) {
    response.counterOffer = {
      ...response.counterOffer,
      rationale: aiNarrative.counterRationale,
    };
  }

  transferIfAccepted(state, proposal, response);
  updateTrustAndMemory(state, proposal, response);
  logTelemetry(state, proposal, response);
  applyConsumption(state);
  const marketEvents = detectMarketEvents(state, proposal, response);
  const scoring = calculateScore(state);
  state.score = scoring.score;

  const summary: RoundSummary = {
    round: state.round,
    shock: state.activeShock,
    proposal,
    response,
    marketEvents,
    marketSnapshot: { ...state.marketPrices },
    playerSnapshot: { ...state.playerInventory },
    scoreAfterRound: scoring.score,
    avgTrustAfterRound: Number(scoring.avgTrust.toFixed(2)),
    createdAt: new Date().toISOString(),
  };

  state.roundHistory = [summary, ...state.roundHistory].slice(0, 30);

  if (state.round >= state.maxRounds) {
    state.isComplete = true;
    state.outcomeTier = scoring.tier;
  } else {
    state.round += 1;
    state.activeShock = generateShock(state.round);
    applyShock(state, state.activeShock);
  }

  state.updatedAt = new Date().toISOString();

  writeSession(state);
  return { state, summary };
}
