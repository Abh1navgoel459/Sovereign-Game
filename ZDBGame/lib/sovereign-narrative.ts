import type { DealProposal, DealResponse, NationState } from '@/lib/sovereign-types';

interface NarrativeInput {
  nation: NationState;
  trustScore: number;
  proposal: DealProposal;
  response: DealResponse;
}

const styleOpeners = [
  'After a quick internal review,',
  'Based on our current portfolio posture,',
  'Given our latest risk committee guidance,',
];

const rejectOpeners = [
  'At this stage,',
  'Under current market pressure,',
  'With present counterparty risk,',
];

function pickFrom(texts: string[], seed: number): string {
  const index = Math.abs(seed) % texts.length;
  return texts[index];
}

export function buildDeterministicNarrative(input: NarrativeInput): {
  reason: string;
  agendaSignal: string;
  counterRationale?: string;
} {
  const { nation, trustScore, proposal, response } = input;
  const seed = Math.round(response.fairnessRatio * 1000) + trustScore + proposal.offerAmount * 7;
  const trustLabel =
    trustScore > 30 ? 'high-confidence' : trustScore > 5 ? 'stable' : trustScore > -20 ? 'fragile' : 'defensive';

  const offerName = proposal.offerCommodity.replace('_', ' ');
  const requestName = proposal.requestCommodity.replace('_', ' ');

  const reason = response.accepted
    ? `${pickFrom(styleOpeners, seed)} ${nation.name} accepts under a ${trustLabel} channel. The ${offerName} for ${requestName} terms fit this round's constraints.`
    : `${pickFrom(rejectOpeners, seed)} ${nation.name} declines under a ${trustLabel} channel. The ${offerName} to ${requestName} structure does not satisfy current thresholds.`;

  const agendaSignal = `Their delegations keep emphasizing ${nation.style}, while repeatedly steering discussion toward ${nation.publicObjective.toLowerCase()}.`;

  const counterRationale = response.counterOffer
    ? `Improve collateral on ${offerName} and reduce pressure on ${requestName} to re-open this corridor.`
    : undefined;

  return { reason, agendaSignal, counterRationale };
}

