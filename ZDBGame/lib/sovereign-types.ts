export type Commodity = 'energy' | 'food' | 'tech' | 'rare_earths';

export type NationId = 'usa' | 'china' | 'eu' | 'india' | 'opec';
export type ScenarioId = 'energy_crunch' | 'food_shock' | 'tech_arms_race';

export interface MarketShock {
  commodity: Commodity;
  deltaPct: number;
  headline: string;
}

export interface DealProposal {
  nationId: NationId;
  offerCommodity: Commodity;
  offerAmount: number;
  requestCommodity: Commodity;
  requestAmount: number;
  note?: string;
}

export interface DealResponse {
  accepted: boolean;
  reason: string;
  trustDelta: number;
  trustScore: number;
  fairnessRatio: number;
  agendaSignal: string;
  counterOffer?: {
    minOfferAmount: number;
    maxRequestAmount: number;
    rationale: string;
  };
}

export interface RoundSummary {
  round: number;
  shock: MarketShock;
  proposal: DealProposal;
  response: DealResponse;
  marketEvents: string[];
  marketSnapshot: Record<Commodity, number>;
  playerSnapshot: Record<Commodity, number>;
  scoreAfterRound: number;
  avgTrustAfterRound: number;
  createdAt: string;
}

export interface NationState {
  id: NationId;
  name: string;
  publicObjective: string;
  hiddenAgenda: string;
  style: string;
  inventory: Record<Commodity, number>;
}

export interface SovereignState {
  sessionId: string;
  playerId: string;
  playerName: string;
  scenarioId: ScenarioId;
  scenarioName: string;
  round: number;
  maxRounds: number;
  isComplete: boolean;
  score: number;
  outcomeTier?: 'Bronze' | 'Silver' | 'Gold' | 'Sovereign';
  marketPrices: Record<Commodity, number>;
  activeShock: MarketShock;
  playerInventory: Record<Commodity, number>;
  nations: Record<NationId, NationState>;
  trustScores: Record<NationId, number>;
  roundHistory: RoundSummary[];
  updatedAt: string;
}

export interface SessionResult {
  state: SovereignState;
  summary?: RoundSummary;
}
