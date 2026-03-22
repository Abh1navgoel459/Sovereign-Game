import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
import type { Commodity, Deal, DealSuggestion, DomesticScenario, GameSession, Nation, NationId, RoundNarration, RoundOutcome } from '@/lib/game-types';

interface AIDealResult {
  reason?: string;
  statusUpdates?: string[];
  hiddenAgendaSignal?: string;
  counterOffer?: Partial<DealSuggestion>;
}

interface AIStrategyShift {
  thresholdShift: number; // + makes nation stricter, - makes it more permissive
  strategyNote: string;
}

const VALID_COMMODITIES: Commodity[] = ['energy', 'food', 'tech', 'rare_earths'];
const VALID_NATIONS: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];

function isCommodity(value: unknown): value is Commodity {
  return typeof value === 'string' && VALID_COMMODITIES.includes(value as Commodity);
}

function isNationId(value: unknown): value is NationId {
  return typeof value === 'string' && VALID_NATIONS.includes(value as NationId);
}

function isAIEnabled(): boolean {
  return String(process.env.AIKIT_ENABLED || '').toLowerCase() === 'true';
}

function aiClient() {
  const provider: 'openai' | 'anthropic' =
    (process.env.AIKIT_PROVIDER || 'openai').toLowerCase() === 'anthropic' ? 'anthropic' : 'openai';
  const apiKey = process.env.AIKIT_API_KEY || '';
  if (!apiKey) return null;

  return {
    provider,
    apiKey,
    model: process.env.AIKIT_MODEL || (provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 'gpt-4o-mini'),
    baseUrl: process.env.AIKIT_BASE_URL || undefined,
  };
}

function parseJsonMaybe(text: string): Record<string, unknown> | null {
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1 || e <= s) return null;
  try {
    return JSON.parse(text.slice(s, e + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function runAgent(prompt: string, systemPrompt: string, maxTokens = 220): Promise<Record<string, unknown> | null> {
  if (!isAIEnabled()) return null;
  const client = aiClient();
  if (!client) return null;

  const agent = new Agent({
    id: `game-ai-${Date.now()}`,
    name: 'Sovereign AI',
    systemPrompt,
    llm: {
      provider: client.provider,
      model: client.model,
      apiKey: client.apiKey,
      baseUrl: client.baseUrl,
      temperature: 0.35,
      maxTokens,
    },
    tools: [],
    maxSteps: 1,
  });

  try {
    const result = await new AgentExecutor(agent).execute(prompt);
    if (!result.success || !result.response) return null;
    return parseJsonMaybe(result.response);
  } catch {
    return null;
  }
}

export async function aiFlavorDealOutcome(input: {
  nation: Nation;
  deal: Deal;
  outcome: RoundOutcome;
  session: GameSession;
}): Promise<AIDealResult | null> {
  const obj = await runAgent(
    JSON.stringify({
      nation: {
        name: input.nation.name,
        publicObjective: input.nation.publicObjective,
        hiddenAgenda: input.nation.hiddenAgenda,
        bargainingStyle: input.nation.bargainingStyle,
        riskTolerance: input.nation.riskTolerance,
        trustScore: input.nation.trustScore,
        pressure: input.nation.pressure,
        publicStability: input.nation.publicStability,
        publicNeeds: input.nation.publicNeeds,
      },
      deal: input.deal,
      outcome: {
        accepted: input.outcome.accepted,
        fairnessRatio: input.outcome.fairnessRatio,
        trustDelta: input.outcome.trustDelta,
      },
      round: input.session.round,
      market: input.session.market,
      recentDomesticDecision: input.session.domesticResolvedRound === input.session.round ? input.session.domesticLog?.[0] : null,
    }),
    'Return strict JSON: reason (string), statusUpdates (string[] up to 3), hiddenAgendaSignal (string), counterOffer ({offerCommodity,offerAmount,requestCommodity,requestAmount,rationale,confidence}). Counter-offer must reflect trust, domestic needs pressure, and recent domestic decision. Keep strategic and concise.',
    260
  );

  if (!obj) return null;

  const counter = obj.counterOffer as Record<string, unknown> | undefined;
  const counterOffer = counter
    ? {
        offerCommodity: isCommodity(counter.offerCommodity) ? counter.offerCommodity : undefined,
        offerAmount: typeof counter.offerAmount === 'number' ? counter.offerAmount : undefined,
        requestCommodity: isCommodity(counter.requestCommodity) ? counter.requestCommodity : undefined,
        requestAmount: typeof counter.requestAmount === 'number' ? counter.requestAmount : undefined,
        rationale: typeof counter.rationale === 'string' ? counter.rationale : undefined,
        confidence: typeof counter.confidence === 'number' ? counter.confidence : undefined,
      }
    : undefined;

  return {
    reason: typeof obj.reason === 'string' ? obj.reason : undefined,
    statusUpdates: Array.isArray(obj.statusUpdates)
      ? obj.statusUpdates.filter((v): v is string => typeof v === 'string').slice(0, 3)
      : undefined,
    hiddenAgendaSignal: typeof obj.hiddenAgendaSignal === 'string' ? obj.hiddenAgendaSignal : undefined,
    counterOffer,
  };
}

export async function aiNarrateRound(input: {
  session: GameSession;
  outcome: RoundOutcome;
  nation: Nation;
}): Promise<RoundNarration | null> {
  const obj = await runAgent(
    JSON.stringify({
      round: input.session.round,
      outcome: {
        accepted: input.outcome.accepted,
        trustDelta: input.outcome.trustDelta,
        scoreDelta: input.outcome.scoreDelta,
      },
      shockHeadline: input.session.market.shockHeadline,
      nation: { name: input.nation.name, hiddenAgenda: input.nation.hiddenAgenda },
      deficits: input.session.market.deficits,
    }),
    'Return strict JSON with title, marketBulletin, diplomaticSignal, riskOutlook. 1 sentence per field, clear and factual.',
    190
  );

  if (!obj) return null;
  if (
    typeof obj.title !== 'string' ||
    typeof obj.marketBulletin !== 'string' ||
    typeof obj.diplomaticSignal !== 'string' ||
    typeof obj.riskOutlook !== 'string'
  ) {
    return null;
  }

  return {
    title: obj.title,
    marketBulletin: obj.marketBulletin,
    diplomaticSignal: obj.diplomaticSignal,
    riskOutlook: obj.riskOutlook,
  };
}

export async function aiCopilotDealSuggestion(input: {
  session: GameSession;
  nation: Nation;
}): Promise<DealSuggestion | null> {
  const obj = await runAgent(
    JSON.stringify({
      playerInventory: input.session.playerInventory,
      marketPrices: input.session.market.prices,
      marketDeficits: input.session.market.deficits,
      nation: {
        id: input.nation.id,
        trustScore: input.nation.trustScore,
        pressure: input.nation.pressure,
        inventory: input.nation.inventory,
        bargainingStyle: input.nation.bargainingStyle,
        priorityCommodity: input.nation.priorityCommodity,
      },
    }),
    'Return strict JSON with nationId, offerCommodity, offerAmount, requestCommodity, requestAmount, confidence (0-100), rationale. Keep values realistic and integers.',
    180
  );

  if (!obj) return null;

  if (!isNationId(obj.nationId) || !isCommodity(obj.offerCommodity) || !isCommodity(obj.requestCommodity) || typeof obj.offerAmount !== 'number' || typeof obj.requestAmount !== 'number') {
    return null;
  }

  return {
    nationId: obj.nationId,
    offerCommodity: obj.offerCommodity,
    offerAmount: Math.max(1, Math.round(obj.offerAmount)),
    requestCommodity: obj.requestCommodity,
    requestAmount: Math.max(1, Math.round(obj.requestAmount)),
    confidence: typeof obj.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(obj.confidence))) : 60,
    rationale: typeof obj.rationale === 'string' ? obj.rationale : 'Suggested by copilot.',
  };
}

export async function aiCounterStrategyShift(input: {
  session: GameSession;
  nation: Nation;
  deal: Deal;
}): Promise<AIStrategyShift | null> {
  const obj = await runAgent(
    JSON.stringify({
      round: input.session.round,
      difficulty: input.session.difficulty,
      deal: input.deal,
      nation: {
        id: input.nation.id,
        trustScore: input.nation.trustScore,
        pressure: input.nation.pressure,
        bargainingStyle: input.nation.bargainingStyle,
        riskTolerance: input.nation.riskTolerance,
        priorityCommodity: input.nation.priorityCommodity,
        publicStability: input.nation.publicStability,
        publicNeeds: input.nation.publicNeeds,
        inventory: input.nation.inventory,
      },
      deficits: input.session.market.deficits,
      prices: input.session.market.prices,
      recentDomesticDecision: input.session.domesticResolvedRound === input.session.round ? input.session.domesticLog?.[0] : null,
    }),
    'Return strict JSON with thresholdShift (number between -0.08 and 0.08) and strategyNote (short sentence). Shift should reflect trust, domestic needs pressure, and recent domestic decision.',
    120
  );

  if (!obj) return null;
  if (typeof obj.thresholdShift !== 'number') return null;
  return {
    thresholdShift: Math.max(-0.08, Math.min(0.08, Number(obj.thresholdShift))),
    strategyNote: typeof obj.strategyNote === 'string' ? obj.strategyNote : 'Counterparty adjusted stance this round.',
  };
}

export async function aiGenerateDomesticScenario(input: {
  session: GameSession;
  seedHint: string;
}): Promise<Pick<DomesticScenario, 'title' | 'description' | 'category' | 'options'> | null> {
  const obj = await runAgent(
    JSON.stringify({
      seedHint: input.seedHint,
      round: input.session.round,
      scenarioId: input.session.scenarioId,
      treasury: input.session.treasury,
      debt: input.session.debt,
      publicSentiment: input.session.publicSentiment,
      marketDeficits: input.session.market.deficits,
      marketPrices: input.session.market.prices,
      avgStability:
        Object.values(input.session.nations).reduce((sum, n) => sum + n.publicStability, 0) /
        Math.max(1, Object.values(input.session.nations).length),
      maxPressure: Math.max(...Object.values(input.session.nations).map((n) => n.pressure)),
      recentDomesticDecision: input.session.domesticLog?.[0] || null,
    }),
    'Return strict JSON for one domestic scenario: title, description, category (political|social|economic|infrastructure), options (exactly 3 items with ids stabilize, targeted, austerity, each with label and description). Keep it grounded and actionable.',
    260
  );

  if (!obj) return null;
  const category = obj.category;
  const optionsRaw = obj.options;
  if (
    typeof obj.title !== 'string' ||
    typeof obj.description !== 'string' ||
    (category !== 'political' && category !== 'social' && category !== 'economic' && category !== 'infrastructure') ||
    !Array.isArray(optionsRaw)
  ) {
    return null;
  }
  const normalize = (id: 'stabilize' | 'targeted' | 'austerity', fallbackLabel: string, fallbackDesc: string) => {
    const found = optionsRaw.find((o) => o && typeof o === 'object' && (o as any).id === id) as Record<string, unknown> | undefined;
    return {
      id,
      label: typeof found?.label === 'string' ? found.label : fallbackLabel,
      description: typeof found?.description === 'string' ? found.description : fallbackDesc,
    };
  };

  return {
    title: obj.title,
    description: obj.description,
    category,
    options: [
      normalize('stabilize', 'Stabilize Markets', 'Spend aggressively to calm prices and shortages.'),
      normalize('targeted', 'Targeted Relief', 'Narrow intervention focused on highest pain points.'),
      normalize('austerity', 'Austerity + Messaging', 'Protect treasury, accept short-term social strain.'),
    ],
  };
}
