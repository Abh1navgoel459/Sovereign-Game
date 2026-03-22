export type Commodity = 'energy' | 'food' | 'tech' | 'rare_earths';
export type NationId = 'usa' | 'china' | 'eu' | 'india' | 'opec';
export type Difficulty = 'analyst' | 'director' | 'grandmaster';

export interface Nation {
  id: NationId;
  name: string;
  publicObjective: string;
  hiddenAgenda: string;
  bargainingStyle: 'hardline' | 'balanced' | 'opportunistic';
  riskTolerance: number;
  priorityCommodity: Commodity;
  trustScore: number;
  pressure: number;
  inventory: Record<Commodity, number>;
  publicNeeds: Record<Commodity, number>;
  publicStability: number; // 0-100, higher means domestic conditions are stable
}

export interface MarketState {
  prices: Record<Commodity, number>;
  deficits: Record<Commodity, number>;
  shockCommodity: Commodity;
  shockDeltaPct: number;
  shockHeadline: string;
}

export interface Deal {
  nationId: NationId;
  offerCommodity: Commodity;
  offerAmount: number;
  requestCommodity: Commodity;
  requestAmount: number;
  note?: string;
}

export interface RoundOutcome {
  round: number;
  nationId?: NationId;
  offerCommodity?: Commodity;
  requestCommodity?: Commodity;
  accepted: boolean;
  reason: string;
  fairnessRatio: number;
  trustDelta: number;
  scoreDelta: number;
  statusUpdates: string[];
  hiddenAgendaSignal?: string;
  counterOffer?: DealSuggestion;
  marketSnapshot: Record<Commodity, number>;
  createdAt: string;
}

export interface DealSuggestion {
  nationId: NationId;
  offerCommodity: Commodity;
  offerAmount: number;
  requestCommodity: Commodity;
  requestAmount: number;
  confidence: number;
  rationale: string;
}

export interface RoundNarration {
  title: string;
  marketBulletin: string;
  diplomaticSignal: string;
  riskOutlook: string;
}

export interface RoundMission {
  id: string;
  title: string;
  description: string;
  kind: 'accepted_deal' | 'fairness_floor' | 'trust_gain' | 'commodity_trade';
  targetCommodity?: Commodity;
  threshold: number;
  rewardScore: number;
  completed: boolean;
}

export interface ProgressionProfile {
  playerName: string;
  completedRuns: number;
  bestScore: number;
  totalScore: number;
  unlockedDifficulties: Difficulty[];
  unlockedScenarioMods: string[];
  unlockedAdvisors: string[];
  unlockedPerks: string[];
  achievements: string[];
  updatedAt: string;
}

export interface DomesticOption {
  id: string;
  label: string;
  description: string;
}

export interface DomesticScenario {
  id: string;
  title: string;
  description: string;
  category: 'political' | 'social' | 'economic' | 'infrastructure';
  options: DomesticOption[];
  createdAt: string;
}

export interface DomesticDecisionRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  round: number;
  optionId: string;
  optionLabel: string;
  treasuryImpact: number;
  debtImpact: number;
  sentimentImpact: number;
  resourceImpact: Partial<Record<Commodity, number>>;
  summary: string;
  createdAt: string;
}

export interface TurnEventOption {
  id: string;
  label: string;
  description: string;
}

export interface TurnEvent {
  id: string;
  type:
    | 'shipping_disruption'
    | 'election_surprise'
    | 'cartel_fracture'
    | 'cyber_breach'
    | 'border_closure'
    | 'labor_uprising'
    | 'sanctions_leak'
    | 'banking_freeze';
  severity: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  options: TurnEventOption[];
  createdAt: string;
}

export interface TurnEventRecord {
  id: string;
  eventId: string;
  eventType: TurnEvent['type'];
  round: number;
  optionId: string;
  optionLabel: string;
  treasuryImpact: number;
  sentimentImpact: number;
  corridorImpact: number;
  resourceImpact: Partial<Record<Commodity, number>>;
  summary: string;
  createdAt: string;
}

export interface CorridorHistoryEntry {
  round: number;
  delta: number;
  note: string;
  createdAt: string;
}

export interface TradeCorridor {
  id: string;
  a: NationId;
  b: NationId;
  health: number; // 0-100
  capacity: number; // 0-100
  activity: number; // 0-100
  lastUpdatedAt: string;
  history: CorridorHistoryEntry[];
}

export interface MemoryEvent {
  id: string;
  nationId: NationId;
  playerId: string;
  round: number;
  type: 'deal_accepted' | 'deal_rejected' | 'trust_shift';
  text: string;
  importance: number;
  createdAt: string;
}

export interface GameSession {
  id: string;
  playerId: string;
  playerName: string;
  difficulty: Difficulty;
  scenarioId: 'energy_embargo' | 'food_panic' | 'chip_chokepoint';
  round: number;
  maxRounds: number;
  isComplete: boolean;
  endState?: 'in_progress' | 'win' | 'lose';
  endReason?: string;
  score: number;
  market: MarketState;
  nations: Record<NationId, Nation>;
  intelLevels: Record<NationId, number>;
  playerInventory: Record<Commodity, number>;
  treasury: number;
  debt: number;
  publicSentiment: number;
  debtRate: number;
  currentDomesticScenario?: DomesticScenario;
  domesticResolvedRound?: number;
  currentTurnEvent?: TurnEvent;
  turnEventResolvedRound?: number;
  pendingDeal?: Deal;
  pendingOutcome?: RoundOutcome;
  currentMission?: RoundMission;
  domesticLog: DomesticDecisionRecord[];
  turnEventLog: TurnEventRecord[];
  corridors: Record<string, TradeCorridor>;
  missionLog: RoundMission[];
  outcomeLog: RoundOutcome[];
  advisorId?: string;
  perkId?: string;
  scenarioModId?: string;
  runRecap?: {
    outcome: 'win' | 'lose';
    reason: string;
    avgStability: number;
    domesticScoreDelta: number;
    bestDealFairness?: number;
    worstDealFairness?: number;
    domesticDecisions: number;
    endingDebt: number;
    endingTreasury: number;
    endingSentiment: number;
  };
  judgeMode?: boolean;
  latestNarration?: RoundNarration;
  progression?: ProgressionProfile;
  updatedAt: string;
}

export interface GameMetrics {
  sessionsStarted: number;
  sessionsCompleted: number;
  sessionsWon: number;
  roundsCompleted: number;
  dealsMade: number;
  domesticDecisions: number;
  turnEventsResolved: number;
  totalFinalScore: number;
  returnUsers: number;
}
