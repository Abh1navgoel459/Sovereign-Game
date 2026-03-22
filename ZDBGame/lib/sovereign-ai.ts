import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
import type { Commodity, DealProposal, DealResponse, NationState } from '@/lib/sovereign-types';

interface AIEnrichmentInput {
  nation: NationState;
  trustScore: number;
  proposal: DealProposal;
  response: DealResponse;
  marketPrices: Record<Commodity, number>;
  round: number;
  shockHeadline: string;
}

interface AIEnrichmentOutput {
  reason?: string;
  agendaSignal?: string;
  counterRationale?: string;
}

function extractJSONObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function parseAIOutput(raw: string): AIEnrichmentOutput | null {
  const jsonText = extractJSONObject(raw);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    return {
      reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : undefined,
      agendaSignal: typeof parsed.agendaSignal === 'string' ? parsed.agendaSignal.trim() : undefined,
      counterRationale:
        typeof parsed.counterRationale === 'string' ? parsed.counterRationale.trim() : undefined,
    };
  } catch {
    return null;
  }
}

function resolveProviderConfig(): {
  enabled: boolean;
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  baseUrl?: string;
} {
  const enabled = String(process.env.AIKIT_ENABLED || '').toLowerCase() === 'true';
  const provider = (process.env.AIKIT_PROVIDER || 'openai').toLowerCase() === 'anthropic'
    ? 'anthropic'
    : 'openai';

  const model =
    process.env.AIKIT_MODEL || (provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 'gpt-4o-mini');

  const apiKey =
    process.env.AIKIT_API_KEY ||
    process.env.AINATIVE_API_TOKEN ||
    (provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY) ||
    '';

  const baseUrl = process.env.AIKIT_BASE_URL || undefined;

  return { enabled, provider, model, apiKey, baseUrl };
}

export async function generateAINationNarrative(input: AIEnrichmentInput): Promise<AIEnrichmentOutput | null> {
  const config = resolveProviderConfig();
  if (!config.enabled || !config.apiKey) {
    return null;
  }

  const systemPrompt = [
    'You are the negotiation voice for a nation in a trade strategy game.',
    'Return STRICT JSON only with keys: reason, agendaSignal, counterRationale.',
    'Keep each value under 35 words.',
    'Do not reveal hidden agenda explicitly. Only provide subtle hints.',
    'Never change acceptance outcome; describe terms only.',
  ].join(' ');

  const userPrompt = JSON.stringify(
    {
      nation: {
        id: input.nation.id,
        name: input.nation.name,
        style: input.nation.style,
        publicObjective: input.nation.publicObjective,
        hiddenAgendaPrivate: input.nation.hiddenAgenda,
      },
      market: {
        round: input.round,
        shockHeadline: input.shockHeadline,
        prices: input.marketPrices,
      },
      trustScore: input.trustScore,
      proposal: input.proposal,
      evaluation: {
        accepted: input.response.accepted,
        fairnessRatio: input.response.fairnessRatio,
        trustDelta: input.response.trustDelta,
        counterOffer: input.response.counterOffer || null,
      },
      outputRules: {
        reason: 'explain acceptance/rejection in nation voice',
        agendaSignal: 'subtle clue hinting strategic preferences',
        counterRationale: 'if rejected, explain adjustment logic in one sentence',
      },
    },
    null,
    2
  );

  try {
    const agent = new Agent({
      id: `nation-${input.nation.id}`,
      name: `${input.nation.name} Negotiator`,
      systemPrompt,
      llm: {
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        temperature: 0.3,
        maxTokens: 220,
      },
      tools: [],
      maxSteps: 1,
    });

    const executor = new AgentExecutor(agent);
    const result = await executor.execute(userPrompt, { maxSteps: 1 });

    if (!result.success || !result.response) {
      return null;
    }

    return parseAIOutput(result.response);
  } catch {
    return null;
  }
}
