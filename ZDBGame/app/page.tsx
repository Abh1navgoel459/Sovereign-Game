'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Commodity,
  Deal,
  DealSuggestion,
  Difficulty,
  DomesticDecisionRecord,
  GameMetrics,
  GameSession,
  NationId,
  ProgressionProfile,
  RoundOutcome,
  TurnEventRecord,
} from '@/lib/game-types';
import type { A2UICardSpec } from '@/lib/a2ui';
import { A2UINationCard } from '@/components/A2UINationCard';

const commodityLabels: Record<Commodity, string> = {
  energy: 'Energy',
  food: 'Food',
  tech: 'Tech',
  rare_earths: 'Rare Earths',
};

const nationLabels: Record<NationId, string> = {
  usa: 'United States',
  china: 'China',
  eu: 'EU Bloc',
  india: 'India',
  opec: 'OPEC+',
};

const nationMapMeta: Record<
  NationId,
  { x: number; y: number; hue: string; region: string; descriptor: string; links: NationId[] }
> = {
  usa: {
    x: 19,
    y: 34,
    hue: '#60a5fa',
    region: 'North Atlantic Corridor',
    descriptor: 'High-tech importer and alliance anchor',
    links: ['eu', 'opec', 'china'],
  },
  eu: {
    x: 44,
    y: 28,
    hue: '#a78bfa',
    region: 'European Trade Ring',
    descriptor: 'Regulation-heavy market balancer',
    links: ['usa', 'opec', 'india'],
  },
  opec: {
    x: 51,
    y: 49,
    hue: '#f59e0b',
    region: 'Energy Belt',
    descriptor: 'Energy hub with leverage over supply',
    links: ['eu', 'india', 'china', 'usa'],
  },
  india: {
    x: 67,
    y: 50,
    hue: '#34d399',
    region: 'Growth Arc',
    descriptor: 'Demand growth and flexible contracts',
    links: ['opec', 'china', 'eu'],
  },
  china: {
    x: 79,
    y: 35,
    hue: '#f87171',
    region: 'Pacific Manufacturing Spine',
    descriptor: 'Export engine and processing center',
    links: ['india', 'opec', 'usa'],
  },
};

const commodityOptions: Commodity[] = ['energy', 'food', 'tech', 'rare_earths'];
const nationOptions: NationId[] = ['usa', 'china', 'eu', 'india', 'opec'];

type ScenarioId = 'energy_embargo' | 'food_panic' | 'chip_chokepoint';
type AppScreen = 'setup' | 'game';
type GameScreen = 'briefing' | 'negotiation' | 'intel';
type SfxEvent = 'accept' | 'reject' | 'advance' | 'launch' | 'alert';
type DomesticOptionId = 'stabilize' | 'targeted' | 'austerity';

interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  location: string;
  description: string;
}

interface MemoryItem {
  id: string;
  npcId: string;
  memory: string;
  importance: number;
  createdAt: string;
}

interface ScenarioVisual {
  title: string;
  subtitle: string;
  toneClass: string;
  accentClass: string;
  glyph: string;
}

type MetricsView = GameMetrics & {
  completionRate: number;
  winRate: number;
  averageScore: number;
};

function routeId(a: NationId, b: NationId): string {
  return [a, b].sort().join('__');
}

function pressureLabel(value: number): string {
  if (value >= 7) return 'Critical';
  if (value >= 4) return 'Elevated';
  if (value >= 2) return 'Moderate';
  return 'Low';
}

function nationInitials(label: string): string {
  const words = label.split(' ');
  return (words[0]?.[0] || '') + (words[1]?.[0] || '');
}

function titleCase(input: string): string {
  return input
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function parseDomesticScenarioDescription(description?: string): { summary: string; stressChannel?: string; signal?: string } {
  const raw = (description || '').trim();
  if (!raw) return { summary: 'Resolve this event before entering trade negotiations.' };

  const stressMatch = raw.match(/Current stress channel:\s*([^.\n]+)/i);
  const signalMatch = raw.match(/Signal:\s*([^.\n]+)/i);

  const summary = raw
    .replace(/Current stress channel:\s*[^.\n]+\.?/gi, '')
    .replace(/Signal:\s*[^.\n]+\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    summary: summary || raw,
    stressChannel: stressMatch?.[1]?.trim(),
    signal: signalMatch?.[1]?.trim(),
  };
}

function scenarioVisual(scenarioId: ScenarioId): ScenarioVisual {
  if (scenarioId === 'energy_embargo') {
    return {
      title: 'Energy Embargo',
      subtitle: 'Fuel routes tighten and volatility spikes.',
      toneClass: 'from-amber-500/20 via-orange-500/10 to-slate-950',
      accentClass: 'text-amber-200 border-amber-400/40 bg-amber-500/10',
      glyph: 'ENERGY',
    };
  }
  if (scenarioId === 'food_panic') {
    return {
      title: 'Food Panic',
      subtitle: 'Staples destabilize public sentiment fast.',
      toneClass: 'from-emerald-500/20 via-lime-500/10 to-slate-950',
      accentClass: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10',
      glyph: 'FOOD',
    };
  }
  return {
    title: 'Chip Chokepoint',
    subtitle: 'Tech supply bottlenecks reshape leverage.',
    toneClass: 'from-cyan-500/20 via-indigo-500/10 to-slate-950',
    accentClass: 'text-cyan-200 border-cyan-400/40 bg-cyan-500/10',
    glyph: 'TECH',
  };
}

export default function Home() {
  const [appScreen, setAppScreen] = useState<AppScreen>('setup');
  const [gameScreen, setGameScreen] = useState<GameScreen>('briefing');
  const [showGuide, setShowGuide] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundResultStep, setRoundResultStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Configure your run and launch.');

  const [playerName, setPlayerName] = useState('Abhinav');
  const [conflictName, setConflictName] = useState('Strait of Supply');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('energy_embargo');
  const [difficulty, setDifficulty] = useState<Difficulty>('analyst');
  const [playerCount, setPlayerCount] = useState(1);
  const [judgeMode, setJudgeMode] = useState(false);
  const [dismissTutorial, setDismissTutorial] = useState(false);
  const [progressionPreview, setProgressionPreview] = useState<ProgressionProfile | null>(null);
  const [selectedScenarioMod, setSelectedScenarioMod] = useState('none');
  const [selectedAdvisor, setSelectedAdvisor] = useState('none');
  const [selectedPerk, setSelectedPerk] = useState('none');

  const [session, setSession] = useState<GameSession | null>(null);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [metrics, setMetrics] = useState<MetricsView | null>(null);
  const [selectedNation, setSelectedNation] = useState<NationId>('usa');
  const [copilotStatus, setCopilotStatus] = useState('');
  const [routePulseNation, setRoutePulseNation] = useState<NationId | null>(null);
  const [routePulseOn, setRoutePulseOn] = useState(false);
  const [showRoundInterstitial, setShowRoundInterstitial] = useState(false);
  const [showDomesticInterstitial, setShowDomesticInterstitial] = useState(false);
  const [showDomesticScenarioModal, setShowDomesticScenarioModal] = useState(false);
  const [showDomesticOutcomeModal, setShowDomesticOutcomeModal] = useState(false);
  const [latestDomesticDecision, setLatestDomesticDecision] = useState<DomesticDecisionRecord | null>(null);
  const [showTurnEventModal, setShowTurnEventModal] = useState(false);
  const [latestTurnEventDecision, setLatestTurnEventDecision] = useState<TurnEventRecord | null>(null);
  const [selectedTurnEventOption, setSelectedTurnEventOption] = useState<string>('');
  const [showTransmission, setShowTransmission] = useState(false);
  const [decisionReveal, setDecisionReveal] = useState<{ open: boolean; accepted: boolean | null }>({ open: false, accepted: null });
  const [selectedDomesticOption, setSelectedDomesticOption] = useState<DomesticOptionId>('targeted');
  const [showRecap, setShowRecap] = useState(false);
  const [actionToast, setActionToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [dealFlash, setDealFlash] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<{
    master?: GainNode;
    pad1?: OscillatorNode;
    pad2?: OscillatorNode;
    pulse?: OscillatorNode;
    pulseGain?: GainNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    intervalId?: number;
    tension?: number;
    step?: number;
    mode?: 'calm' | 'tense';
  }>({});
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [a2uiSpec, setA2uiSpec] = useState<A2UICardSpec | null>(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string | null>(null);
  const exportedJudgeRunRef = useRef<string | null>(null);

  const [deal, setDeal] = useState<Deal>({
    nationId: 'china',
    offerCommodity: 'energy',
    offerAmount: 5,
    requestCommodity: 'tech',
    requestAmount: 3,
  });

  const playerValue = useMemo(() => {
    if (!session) return 0;
    return Object.entries(session.playerInventory).reduce((sum, [commodity, amount]) => {
      const key = commodity as Commodity;
      return sum + amount * session.market.prices[key];
    }, 0);
  }, [session]);

  const rankedDeficits = useMemo(() => {
    if (!session) return [];
    return [...commodityOptions]
      .map((c) => ({ commodity: c, deficit: session.market.deficits[c], price: session.market.prices[c] }))
      .sort((a, b) => b.deficit - a.deficit);
  }, [session]);

  const mood = useMemo(() => {
    const commodity = session?.market.shockCommodity;
    if (commodity === 'energy') return { a: 'rgba(245,158,11,0.22)', b: 'rgba(251,191,36,0.16)', c: 'rgba(180,83,9,0.12)' };
    if (commodity === 'food') return { a: 'rgba(16,185,129,0.22)', b: 'rgba(74,222,128,0.14)', c: 'rgba(6,95,70,0.12)' };
    if (commodity === 'tech') return { a: 'rgba(56,189,248,0.22)', b: 'rgba(99,102,241,0.16)', c: 'rgba(30,64,175,0.12)' };
    if (commodity === 'rare_earths') return { a: 'rgba(244,63,94,0.2)', b: 'rgba(217,70,239,0.15)', c: 'rgba(126,34,206,0.11)' };
    return { a: 'rgba(6,182,212,0.16)', b: 'rgba(99,102,241,0.13)', c: 'rgba(16,185,129,0.1)' };
  }, [session?.market.shockCommodity]);

  const tickerItems = useMemo(() => {
    if (!session) return ['Initialize a run to begin live market feed.'];
    const items = [
      `Round ${session.round}/${session.maxRounds}`,
      `Shock: ${session.market.shockHeadline}`,
      `Portfolio ${Math.round(playerValue)}`,
    ];
    if (lastOutcome) items.push(`Last decision ${lastOutcome.accepted ? 'ACCEPTED' : 'REJECTED'} (trust ${lastOutcome.trustDelta > 0 ? '+' : ''}${lastOutcome.trustDelta})`);
    if (session.latestNarration?.marketBulletin) items.push(session.latestNarration.marketBulletin);
    return items;
  }, [session, lastOutcome, playerValue]);

  const domesticResolvedThisRound = !!session && session.domesticResolvedRound === session.round;
  const turnEventResolvedThisRound = !!session && session.turnEventResolvedRound === session.round;
  const domesticScenarioDisplay = useMemo(
    () => parseDomesticScenarioDescription(session?.currentDomesticScenario?.description),
    [session?.currentDomesticScenario?.description]
  );
  const scenarioArt = useMemo(() => scenarioVisual((session?.scenarioId as ScenarioId) || scenarioId), [session?.scenarioId, scenarioId]);
  const eventSeverity = session?.currentTurnEvent?.severity || 0;
  const avgStability = useMemo(() => {
    if (!session) return 0;
    const nations = Object.values(session.nations);
    if (!nations.length) return 0;
    return nations.reduce((sum, n) => sum + n.publicStability, 0) / nations.length;
  }, [session]);
  const crisisCount = useMemo(() => {
    if (!session) return 0;
    return Object.values(session.nations).filter((n) => n.publicStability < 28 || n.pressure >= 7).length;
  }, [session]);
  const runTrack = useMemo(() => {
    if (!session) return { label: 'No Run', detail: 'Start a run.', pct: 0, tone: 'text-slate-300', bar: 'bg-slate-500' };
    const scoreGoal = session.difficulty === 'grandmaster' ? 280 : session.difficulty === 'director' ? 235 : 190;
    const stabilityGoal = session.difficulty === 'grandmaster' ? 60 : 56;
    const scorePct = Math.min(1, session.score / scoreGoal);
    const stabilityPct = Math.min(1, avgStability / stabilityGoal);
    const crisisPenalty = Math.min(0.4, crisisCount * 0.12);
    const pct = Math.max(0, Math.min(1, scorePct * 0.55 + stabilityPct * 0.45 - crisisPenalty));
    if (pct >= 0.72) return { label: 'On Track', detail: 'Pace is strong for a winning finish.', pct, tone: 'text-emerald-300', bar: 'bg-emerald-400' };
    if (pct >= 0.48) return { label: 'At Risk', detail: 'One strong accepted round can recover trajectory.', pct, tone: 'text-amber-300', bar: 'bg-amber-400' };
    return { label: 'Off Track', detail: 'Stabilize domestically and secure fair deals now.', pct, tone: 'text-rose-300', bar: 'bg-rose-400' };
  }, [session, avgStability, crisisCount]);
  const aiWowLine = useMemo(() => {
    if (!session) return 'Strategy brief will appear after your first decision.';
    const domestic = session.domesticLog?.[0];
    const outcome = session.outcomeLog?.[0];
    const nation = outcome ? nationLabels[session.pendingDeal?.nationId || deal.nationId] : '';
    const prefix = session.latestNarration?.diplomaticSignal || session.latestNarration?.marketBulletin || '';
    if (!domestic && !outcome) return `Brief: ${prefix || 'Run started. Resolve the domestic step to unlock guidance.'}`;
    if (domestic && !outcome) return `Brief: After "${domestic.optionLabel}", prioritize ${domestic.sentimentImpact >= 0 ? 'high-confidence deals' : 'defensive trades'} before pressure compounds.`;
    return `Brief: ${prefix || `${nation || 'Counterpart'} reacted to your last move`}. Domestic impact: ${domestic?.summary || 'no domestic signal'}.`;
  }, [session, deal.nationId]);
  const tutorialStep = useMemo(() => {
    if (!session || dismissTutorial || session.round !== 1 || session.isComplete) return null;
    if (!turnEventResolvedThisRound) return { title: 'Step 1', body: 'Resolve the turn event. It changes corridors, treasury, and sentiment.' };
    if (!domesticResolvedThisRound) return { title: 'Step 2', body: 'Resolve the domestic scenario. It changes treasury, debt, and negotiation posture.' };
    if (!session.pendingOutcome) return { title: 'Step 3', body: 'Use Copilot or the Fair Template, then submit one proposal.' };
    return { title: 'Step 4', body: 'Advance round to apply results and open the result sequence.' };
  }, [session, dismissTutorial, domesticResolvedThisRound, turnEventResolvedThisRound]);

  const selectedCorridor = useMemo(() => {
    if (!session || !selectedCorridorId) return null;
    return session.corridors[selectedCorridorId] || null;
  }, [session, selectedCorridorId]);

  const playSfx = (event: SfxEvent) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1600;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const presets: Record<SfxEvent, { f0: number; f1: number; dur: number; type: OscillatorType; vol: number }> = {
        accept: { f0: 440, f1: 660, dur: 0.14, type: 'triangle', vol: 0.04 },
        reject: { f0: 240, f1: 120, dur: 0.16, type: 'sawtooth', vol: 0.04 },
        advance: { f0: 310, f1: 500, dur: 0.12, type: 'square', vol: 0.03 },
        launch: { f0: 280, f1: 560, dur: 0.18, type: 'triangle', vol: 0.04 },
        alert: { f0: 700, f1: 520, dur: 0.2, type: 'square', vol: 0.025 },
      };
      const p = presets[event];
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.f0, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, p.f1), now + p.dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(p.vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);
      osc.start(now);
      osc.stop(now + p.dur + 0.01);
    } catch {
      // If WebAudio is unavailable, silently skip.
    }
  };

  const stopMusic = () => {
    const nodes = musicRef.current;
    if (nodes.intervalId) {
      window.clearInterval(nodes.intervalId);
      nodes.intervalId = undefined;
    }

    for (const osc of [nodes.pad1, nodes.pad2, nodes.pulse, nodes.lfo]) {
      try {
        osc?.stop();
      } catch {
        // no-op
      }
      try {
        osc?.disconnect();
      } catch {
        // no-op
      }
    }

    try {
      nodes.pulseGain?.disconnect();
      nodes.lfoGain?.disconnect();
      nodes.master?.disconnect();
    } catch {
      // no-op
    }
    musicRef.current = {};
  };

  const startMusic = async () => {
    if (typeof window === 'undefined' || !musicEnabled) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (musicRef.current.master) return;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const pad1 = ctx.createOscillator();
    const pad2 = ctx.createOscillator();
    pad1.type = 'sine';
    pad2.type = 'triangle';
    pad1.frequency.value = 261.63;
    pad2.frequency.value = 392.0;

    const padGain1 = ctx.createGain();
    const padGain2 = ctx.createGain();
    padGain1.gain.value = 0.2;
    padGain2.gain.value = 0.12;
    pad1.connect(padGain1);
    pad2.connect(padGain2);
    padGain1.connect(master);
    padGain2.connect(master);

    const pulse = ctx.createOscillator();
    pulse.type = 'sine';
    pulse.frequency.value = 261.63;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.0001;
    pulse.connect(pulseGain);
    pulseGain.connect(master);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 2.5;
    lfo.connect(lfoGain);
    lfoGain.connect(pad1.frequency);

    const now = ctx.currentTime;
    master.gain.exponentialRampToValueAtTime(0.022, now + 1.8);
    pad1.start(now);
    pad2.start(now);
    pulse.start(now);
    lfo.start(now);

    const progression = [
      { root: 261.63, fifth: 392.0, melody: [261.63, 329.63, 392.0, 523.25] }, // C
      { root: 196.0, fifth: 293.66, melody: [246.94, 293.66, 392.0, 493.88] }, // G
      { root: 174.61, fifth: 261.63, melody: [220.0, 261.63, 349.23, 440.0] }, // F
      { root: 261.63, fifth: 392.0, melody: [329.63, 392.0, 523.25, 659.25] }, // C
    ];
    musicRef.current.tension = 0;
    musicRef.current.step = 0;
    musicRef.current.mode = 'calm';
    const intervalId = window.setInterval(() => {
      const t = ctx.currentTime;
      const tension = Math.max(0, Math.min(1, musicRef.current.tension || 0));
      const step = (musicRef.current.step || 0) + 1;
      musicRef.current.step = step;
      const chord = progression[step % progression.length];
      const note = chord.melody[step % chord.melody.length];

      pad1.frequency.exponentialRampToValueAtTime(chord.root, t + 0.45);
      pad2.frequency.exponentialRampToValueAtTime(chord.fifth, t + 0.45);
      pulse.frequency.setValueAtTime(note, t);
      pulseGain.gain.cancelScheduledValues(t);
      pulseGain.gain.setValueAtTime(0.0001, t);
      pulseGain.gain.linearRampToValueAtTime(0.006 + tension * 0.008, t + 0.035);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);

      master.gain.exponentialRampToValueAtTime(0.02 + tension * 0.012, t + 0.35);
      lfo.frequency.exponentialRampToValueAtTime(0.05 + tension * 0.08, t + 0.3);
    }, 1450);

    musicRef.current = { master, pad1, pad2, pulse, pulseGain, lfo, lfoGain, intervalId };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTurnEventModal) {
          setShowTurnEventModal(false);
          return;
        }
        if (showGuide) {
          setShowGuide(false);
          return;
        }
        if (showRoundResult) {
          setShowRoundResult(false);
          return;
        }
        setShowDomesticOutcomeModal(false);
        return;
      }

      if (e.code === 'Space') {
        if (showRoundResult) {
          e.preventDefault();
          if (roundResultStep < 4) {
            setRoundResultStep((s) => Math.min(4, s + 1));
          } else {
            setShowRoundResult(false);
          }
          return;
        }
        if (showGuide) {
          e.preventDefault();
          setShowGuide(false);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showGuide, showRoundResult, showTurnEventModal, roundResultStep]);

  useEffect(() => {
    if (!routePulseNation) return;
    setRoutePulseOn(true);
    const timer = setTimeout(() => {
      setRoutePulseOn(false);
      setRoutePulseNation(null);
    }, 2200);
    return () => clearTimeout(timer);
  }, [routePulseNation]);

  useEffect(() => {
    const composeA2UI = async () => {
      if (!session) {
        setA2uiSpec(null);
        return;
      }
      try {
        const res = await fetch('/api/game/a2ui/nation-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nationId: selectedNation,
            nation: session.nations[selectedNation],
            intelLevel: session.intelLevels[selectedNation] || 0,
            hasMission: Boolean(session.currentMission),
          }),
        });
        const payload = (await res.json()) as { spec?: A2UICardSpec };
        setA2uiSpec(res.ok && payload.spec ? payload.spec : null);
      } catch {
        setA2uiSpec(null);
      }
    };
    void composeA2UI();
  }, [session, selectedNation]);

  useEffect(() => {
    if (!decisionReveal.open) return;
    const timer = setTimeout(() => setDecisionReveal({ open: false, accepted: null }), 1100);
    return () => clearTimeout(timer);
  }, [decisionReveal.open]);

  useEffect(() => {
    if (!actionToast.open) return;
    const timer = setTimeout(() => setActionToast({ open: false, message: '' }), 1600);
    return () => clearTimeout(timer);
  }, [actionToast.open]);

  useEffect(() => {
    if (!dealFlash) return;
    const timer = setTimeout(() => setDealFlash(false), 900);
    return () => clearTimeout(timer);
  }, [dealFlash]);

  useEffect(() => {
    if (!session || appScreen !== 'game') {
      setShowTurnEventModal(false);
      setShowDomesticScenarioModal(false);
      setShowDomesticOutcomeModal(false);
      return;
    }
    if (!session.isComplete && session.turnEventResolvedRound !== session.round) {
      setShowTurnEventModal(true);
      setShowDomesticScenarioModal(false);
      return;
    }
    setShowTurnEventModal(false);
    if (!session.isComplete && session.domesticResolvedRound !== session.round) {
      setShowDomesticScenarioModal(true);
    } else {
      setShowDomesticScenarioModal(false);
    }
  }, [session?.id, session?.round, session?.turnEventResolvedRound, session?.domesticResolvedRound, session?.isComplete, appScreen]);

  useEffect(() => {
    if (!showTurnEventModal || eventSeverity < 4) return;
    playSfx('alert');
    const pulse = window.setInterval(() => playSfx('alert'), 1800);
    return () => window.clearInterval(pulse);
  }, [showTurnEventModal, eventSeverity]);

  useEffect(() => {
    const options = session?.currentTurnEvent?.options || [];
    if (!options.length) {
      setSelectedTurnEventOption('');
      return;
    }
    if (!selectedTurnEventOption || !options.some((o) => o.id === selectedTurnEventOption)) {
      setSelectedTurnEventOption(options[0].id);
    }
  }, [session?.currentTurnEvent?.id, selectedTurnEventOption]);

  useEffect(() => {
    if (appScreen === 'game' && musicEnabled) {
      void startMusic();
    }
    if (!musicEnabled || appScreen !== 'game') {
      stopMusic();
    }
  }, [appScreen, musicEnabled]);

  useEffect(() => {
    return () => stopMusic();
  }, []);

  useEffect(() => {
    if (!session) return;
    const nations = Object.values(session.nations);
    if (!nations.length) return;
    const avgPressure = nations.reduce((sum, n) => sum + n.pressure, 0) / nations.length;
    const crisisCount = nations.filter((n) => n.publicStability < 35 || n.pressure >= 7).length;
    const shockWeight = session.market.shockCommodity === 'energy' || session.market.shockCommodity === 'rare_earths' ? 0.08 : 0.03;
    const tension = Math.max(0, Math.min(1, avgPressure / 10 * 0.72 + crisisCount * 0.12 + shockWeight));
    musicRef.current.tension = tension;
  }, [session]);

  useEffect(() => {
    if (!session?.isComplete || !session.judgeMode) return;
    if (exportedJudgeRunRef.current === session.id) return;
    exportedJudgeRunRef.current = session.id;
    void autoExportJudgeArtifacts(session);
  }, [session]);

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/game/metrics');
      const payload = (await res.json()) as { metrics?: MetricsView };
      if (res.ok && payload.metrics) setMetrics(payload.metrics);
    } catch {
      // no-op
    }
  };

  const loadProgressionPreview = async (name: string) => {
    try {
      const res = await fetch('/api/game/progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name }),
      });
      const payload = (await res.json()) as { progression?: ProgressionProfile };
      if (!res.ok || !payload.progression) return;
      setProgressionPreview(payload.progression);
      const scenarioMods = payload.progression.unlockedScenarioMods?.length ? payload.progression.unlockedScenarioMods : ['none'];
      const advisors = payload.progression.unlockedAdvisors?.length ? payload.progression.unlockedAdvisors : ['none'];
      const perks = payload.progression.unlockedPerks?.length ? payload.progression.unlockedPerks : ['none'];
      if (!scenarioMods.includes(selectedScenarioMod)) setSelectedScenarioMod(scenarioMods[0]);
      if (!advisors.includes(selectedAdvisor)) setSelectedAdvisor(advisors[0]);
      if (!perks.includes(selectedPerk)) setSelectedPerk(perks[0]);
    } catch {
      // no-op
    }
  };

  const loadWorkshopFeeds = async (playerId: string) => {
    try {
      const [eventsRes, memoriesRes] = await Promise.all([
        fetch(`/api/events?playerId=${encodeURIComponent(playerId)}`),
        fetch(`/api/memories?playerId=${encodeURIComponent(playerId)}`),
      ]);

      if (eventsRes.ok) {
        const events = (await eventsRes.json()) as TimelineEvent[];
        setTimelineEvents(Array.isArray(events) ? events.slice(0, 8) : []);
      }
      if (memoriesRes.ok) {
        const memories = (await memoriesRes.json()) as MemoryItem[];
        setMemoryItems(Array.isArray(memories) ? memories.slice(0, 8) : []);
      }
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (appScreen !== 'setup') return;
    const name = (playerName || '').trim();
    if (!name) return;
    void loadProgressionPreview(name);
  }, [appScreen, playerName]);

  const downloadTextFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const autoExportJudgeArtifacts = async (completedSession: GameSession) => {
    try {
      const [jsonRes, csvRes] = await Promise.all([
        fetch('/api/game/metrics/export?format=json'),
        fetch('/api/game/metrics/export?format=csv'),
      ]);
      if (jsonRes.ok) {
        const text = await jsonRes.text();
        downloadTextFile(`sovereign-metrics-${completedSession.id}.json`, text, 'application/json');
      }
      if (csvRes.ok) {
        const text = await csvRes.text();
        downloadTextFile(`sovereign-metrics-${completedSession.id}.csv`, text, 'text/csv');
      }
      downloadTextFile(
        `sovereign-recap-${completedSession.id}.json`,
        JSON.stringify(
          {
            sessionId: completedSession.id,
            scenarioId: completedSession.scenarioId,
            difficulty: completedSession.difficulty,
            score: completedSession.score,
            endState: completedSession.endState,
            endReason: completedSession.endReason,
            runRecap: completedSession.runRecap || null,
          },
          null,
          2
        ),
        'application/json'
      );
      setActionToast({ open: true, message: 'Demo artifacts exported (metrics JSON/CSV + run recap).' });
    } catch {
      setActionToast({ open: true, message: 'Auto-export failed. You can still export from the metrics buttons.' });
    }
  };

  const start = async (forceJudgeMode?: boolean) => {
    setLoading(true);
    setStatus('Booting simulation...');
    try {
      const launchJudgeMode = typeof forceJudgeMode === 'boolean' ? forceJudgeMode : judgeMode;
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          scenarioId,
          difficulty,
          judgeMode: launchJudgeMode,
          scenarioModId: selectedScenarioMod,
          advisorId: selectedAdvisor,
          perkId: selectedPerk,
        }),
      });
      const payload = (await res.json()) as { session?: GameSession; error?: string };
      if (!res.ok || !payload.session) throw new Error(payload.error || 'Failed to start');
      setSession(payload.session);
      setSelectedCorridorId(Object.keys(payload.session.corridors || {})[0] || null);
      exportedJudgeRunRef.current = null;
      setLastOutcome(null);
      setSelectedNation('usa');
      setShowRecap(false);
      setDismissTutorial(false);
      setShowDomesticScenarioModal(true);
      playSfx('launch');
      if (musicEnabled) void startMusic();
      setAppScreen('game');
      setGameScreen('briefing');
      setStatus(`Round ${payload.session.round} live: ${payload.session.market.shockHeadline}`);
      await loadMetrics();
      await loadWorkshopFeeds(payload.session.playerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start';
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const submitDeal = async () => {
    if (!session || session.isComplete) return;
    const submittedNation = deal.nationId;
    setLoading(true);
    setStatus('Sending proposal...');
    setShowTransmission(true);
    try {
      const res = await fetch(`/api/game/${session.id}/deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal),
      });
      const payload = (await res.json()) as { session?: GameSession; outcome?: RoundOutcome; error?: string };
      if (!res.ok || !payload.session || !payload.outcome) throw new Error(payload.error || 'Failed to submit deal');
      setSession(payload.session);
      setLastOutcome(payload.outcome);
      setStatus(`Proposal evaluated: ${payload.outcome.accepted ? 'Accepted' : 'Rejected'}`);
      setDecisionReveal({ open: true, accepted: payload.outcome.accepted });
      playSfx(payload.outcome.accepted ? 'accept' : 'reject');
      if (payload.outcome.accepted) {
        setSelectedNation(submittedNation);
        setRoutePulseNation(submittedNation);
      }
      await loadMetrics();
      await loadWorkshopFeeds(payload.session.playerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit deal';
      setStatus(message);
    } finally {
      setShowTransmission(false);
      setLoading(false);
    }
  };

  const advance = async () => {
    if (!session || session.isComplete) return;
    const resolvingNation = session.pendingDeal?.nationId || deal.nationId;
    setLoading(true);
    setStatus('Advancing round...');
    try {
      const res = await fetch(`/api/game/${session.id}/advance`, { method: 'POST' });
      const payload = (await res.json()) as { session?: GameSession; outcome?: RoundOutcome; error?: string };
      if (!res.ok || !payload.session) throw new Error(payload.error || 'Failed to advance round');
      setSession(payload.session);
      if (payload.outcome) setLastOutcome(payload.outcome);
      if (payload.outcome?.accepted) {
        setSelectedNation(resolvingNation);
        setRoutePulseNation(resolvingNation);
      }
      setRoundResultStep(0);
      setShowRoundInterstitial(true);
      playSfx('advance');
      setTimeout(() => {
        setShowRoundInterstitial(false);
        setShowDomesticInterstitial(true);
      }, 1200);
      setTimeout(() => {
        setShowDomesticInterstitial(false);
        setShowRoundResult(true);
      }, 2100);
      setStatus(
        payload.session.isComplete
          ? `Run ${payload.session.endState === 'win' ? 'WON' : 'LOST'}: ${payload.session.endReason || 'Finalized'}. Score ${payload.session.score}.`
          : `Round ${payload.session.round} live: ${payload.session.market.shockHeadline}`
      );
      if (payload.session.isComplete) {
        setTimeout(() => setShowRecap(true), 700);
      }
      await loadMetrics();
      await loadWorkshopFeeds(payload.session.playerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to advance';
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const askCopilot = async (nationIdOverride?: NationId) => {
    if (!session || session.isComplete) return;
    const targetNation = nationIdOverride || deal.nationId;
    setLoading(true);
    setCopilotStatus('Copilot is drafting a suggestion...');
    try {
      const res = await fetch(`/api/game/${session.id}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationId: targetNation }),
      });
      const payload = (await res.json()) as { suggestion?: DealSuggestion; error?: string };
      if (!res.ok || !payload.suggestion) throw new Error(payload.error || 'Failed to get suggestion');

      setDeal({
        nationId: payload.suggestion.nationId,
        offerCommodity: payload.suggestion.offerCommodity,
        offerAmount: payload.suggestion.offerAmount,
        requestCommodity: payload.suggestion.requestCommodity,
        requestAmount: payload.suggestion.requestAmount,
      });
      setDealFlash(true);
      setCopilotStatus(`Applied suggestion (${payload.suggestion.confidence}% confidence): ${payload.suggestion.rationale}`);
      setActionToast({ open: true, message: 'Copilot suggestion loaded.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Copilot unavailable right now';
      setCopilotStatus(message);
      setActionToast({ open: true, message });
    } finally {
      setLoading(false);
    }
  };

  const applyFairTemplate = () => {
    if (!session) return;
    const nation = session.nations[selectedNation];
    const requestCommodity = nation.priorityCommodity;
    const requestAmount = Math.max(1, Math.min(4, Math.floor(nation.inventory[requestCommodity] * 0.15)));
    const requestValue = requestAmount * session.market.prices[requestCommodity];
    const offerCommodity =
      commodityOptions
        .filter((c) => c !== requestCommodity)
        .sort((a, b) => session.playerInventory[b] * session.market.prices[b] - session.playerInventory[a] * session.market.prices[a])[0] || 'energy';
    const offerAmount = Math.max(1, Math.round(requestValue / session.market.prices[offerCommodity]));
    setDeal({
      nationId: selectedNation,
      offerCommodity,
      offerAmount,
      requestCommodity,
      requestAmount,
    });
    setDealFlash(true);
    setCopilotStatus('Loaded fair-value template.');
    setActionToast({ open: true, message: 'Fair-value template applied.' });
  };

  const resolveDomestic = async () => {
    if (!session || session.isComplete) return;
    setLoading(true);
    setStatus('Resolving domestic scenario...');
    try {
      const res = await fetch(`/api/game/${session.id}/domestic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedDomesticOption }),
      });
      const payload = (await res.json()) as { session?: GameSession; decision?: DomesticDecisionRecord; error?: string };
      if (!res.ok || !payload.session || !payload.decision) throw new Error(payload.error || 'Failed to resolve domestic scenario');
      setSession(payload.session);
      setLatestDomesticDecision(payload.decision);
      setCopilotStatus(`Domestic decision logged: ${payload.decision.summary}`);
      setStatus('Domestic step resolved. Trading is now unlocked.');
      setActionToast({ open: true, message: 'Domestic step resolved. Proceed to trade.' });
      setShowDomesticScenarioModal(false);
      setShowDomesticOutcomeModal(true);
      await loadMetrics();
      await loadWorkshopFeeds(payload.session.playerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve domestic step';
      setStatus(message);
      setCopilotStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const resolveTurnEvent = async () => {
    if (!session || session.isComplete || !selectedTurnEventOption) return;
    setLoading(true);
    setStatus('Resolving turn event...');
    try {
      const res = await fetch(`/api/game/${session.id}/turn-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedTurnEventOption }),
      });
      const payload = (await res.json()) as { session?: GameSession; decision?: TurnEventRecord; error?: string };
      if (!res.ok || !payload.session || !payload.decision) throw new Error(payload.error || 'Failed to resolve turn event');
      setSession(payload.session);
      setLatestTurnEventDecision(payload.decision);
      setShowTurnEventModal(false);
      setActionToast({ open: true, message: 'Turn event resolved. Domestic step unlocked.' });
      setStatus('Turn event resolved. Continue to domestic decision.');
      await loadMetrics();
      await loadWorkshopFeeds(payload.session.playerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Turn event resolution failed';
      setStatus(message);
      setActionToast({ open: true, message });
    } finally {
      setLoading(false);
    }
  };

  const onA2UIAction = (id: 'ask_copilot' | 'apply_fair_template' | 'open_mission_brief' | 'focus_intel') => {
    if (id === 'ask_copilot') {
      setGameScreen('negotiation');
      void askCopilot(selectedNation);
      return;
    }
    if (id === 'apply_fair_template') {
      applyFairTemplate();
      setGameScreen('negotiation');
      return;
    }
    if (id === 'open_mission_brief') {
      setGameScreen('briefing');
      setActionToast({ open: true, message: 'Moved to Overview.' });
      return;
    }
    if (id === 'focus_intel') {
      setGameScreen('intel');
      setActionToast({ open: true, message: `Focused view on ${nationLabels[selectedNation]}.` });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-700">
      <div className="pointer-events-none absolute -left-32 -top-28 h-80 w-80 rounded-full blur-3xl animate-pulse transition-colors duration-700" style={{ background: mood.a }} />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full blur-3xl animate-pulse transition-colors duration-700" style={{ background: mood.b }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full blur-3xl animate-pulse transition-colors duration-700" style={{ background: mood.c }} />
      {showTurnEventModal && eventSeverity >= 4 ? (
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent ${eventSeverity >= 5 ? 'animate-pulse' : ''}`} />
      ) : null}
      <div className={`mx-auto max-w-6xl p-4 transition-all duration-300 ${showGuide || showRoundResult || showRoundInterstitial || showDomesticInterstitial || showTurnEventModal || showDomesticScenarioModal || showDomesticOutcomeModal || showTransmission || decisionReveal.open ? 'blur-md opacity-40 pointer-events-none select-none' : ''}`}>
        {appScreen === 'setup' ? (
          <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Sovereign</p>
            <h1 className="mt-2 text-3xl font-bold">Configure Operation</h1>
            <p className="mt-2 text-sm text-slate-300">
              Set your run parameters first. Hit launch to enter round-based trade negotiation.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Conflict Name</span>
                <input
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={conflictName}
                  onChange={(e: any) => setConflictName(String(e?.target?.value || ''))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Lead Player</span>
                <input
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={playerName}
                  onChange={(e: any) => setPlayerName(String(e?.target?.value || ''))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Conflict Type</span>
                <select
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={scenarioId}
                  onChange={(e: any) => setScenarioId(e?.target?.value as ScenarioId)}
                >
                  <option value="energy_embargo">Energy Embargo</option>
                  <option value="food_panic">Food Panic</option>
                  <option value="chip_chokepoint">Chip Chokepoint</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Players</span>
                <select
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={playerCount}
                  onChange={(e: any) => setPlayerCount(Number(e?.target?.value) || 1)}
                >
                  <option value={1}>1 (Solo Command)</option>
                  <option value={2}>2 (Co-op Trade Desk)</option>
                  <option value={3}>3 (Team Command)</option>
                  <option value={4}>4 (Squad Command)</option>
                </select>
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-slate-300">Difficulty</span>
                <select
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e?.target?.value as Difficulty)}
                >
                  <option value="analyst">Analyst (Recommended)</option>
                  <option value="director">Director (Unlocked after 2 runs)</option>
                  <option value="grandmaster">Grandmaster (Unlocked after 5 runs)</option>
                </select>
                <p className="text-xs text-slate-500">
                  Unlocked now: {(session?.progression?.unlockedDifficulties || ['analyst']).join(', ')}. Locked choices auto-fallback to Analyst.
                </p>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Scenario Modifier</span>
                <select
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={selectedScenarioMod}
                  onChange={(e: any) => setSelectedScenarioMod(String(e?.target?.value || 'none'))}
                >
                  {(progressionPreview?.unlockedScenarioMods || ['none']).map((id) => (
                    <option key={id} value={id}>{titleCase(id)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Advisor</span>
                <select
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={selectedAdvisor}
                  onChange={(e: any) => setSelectedAdvisor(String(e?.target?.value || 'none'))}
                >
                  {(progressionPreview?.unlockedAdvisors || ['none']).map((id) => (
                    <option key={id} value={id}>{titleCase(id)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-slate-300">Starting Perk</span>
                <select
                  className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                  value={selectedPerk}
                  onChange={(e: any) => setSelectedPerk(String(e?.target?.value || 'none'))}
                >
                  {(progressionPreview?.unlockedPerks || ['none']).map((id) => (
                    <option key={id} value={id}>{titleCase(id)}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Progression: {progressionPreview ? `${progressionPreview.completedRuns} completed runs` : 'loading...'}
                </p>
              </label>
            </div>

            <div className={`mt-4 rounded border p-3 bg-gradient-to-br ${scenarioArt.toneClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`inline-flex items-center gap-2 rounded border px-2 py-1 text-xs ${scenarioArt.accentClass}`}>
                    <span>{scenarioArt.glyph}</span>
                    <span>{scenarioArt.title}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">{scenarioArt.subtitle}</p>
                </div>
                <button
                  onClick={() => setJudgeMode((v) => !v)}
                  className={`rounded border px-3 py-2 text-xs font-semibold ${judgeMode ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200' : 'border-slate-600 text-slate-300'}`}
                >
                  {judgeMode ? 'Demo Mode: On' : 'Demo Mode: Off'}
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Status: {status}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => void start()}
                  disabled={loading}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {loading ? 'Launching...' : 'Launch Run'}
                </button>
                <button
                  onClick={() => {
                    setPlayerName('Demo Session');
                    setConflictName('Demo Playthrough');
                    setScenarioId('energy_embargo');
                    setDifficulty('analyst');
                    setJudgeMode(true);
                    void start(true);
                  }}
                  disabled={loading}
                  className="rounded-lg border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-60"
                >
                  1-Click Demo Run
                </button>
              </div>
            </div>

            <div className="mt-4 rounded border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
              <p>Operation: {conflictName || 'Untitled Run'}</p>
              <p>Mode: {scenarioId.replace(/_/g, ' ')}</p>
              <p>Team Size: {playerCount}</p>
              <p>Difficulty: {difficulty}</p>
              <p>Modifier: {titleCase(selectedScenarioMod)}</p>
              <p>Advisor: {titleCase(selectedAdvisor)}</p>
              <p>Perk: {titleCase(selectedPerk)}</p>
              <p>Demo Mode: {judgeMode ? 'Enabled (auto recap export on completion)' : 'Disabled'}</p>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <header className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{conflictName}</p>
                  <h1 className="text-2xl font-bold">Round {session?.round}/{session?.maxRounds}</h1>
                  <p className="mt-1 text-sm text-slate-300">{status}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Difficulty: {session?.difficulty || difficulty}
                    {session?.progression ? ` | Runs ${session.progression.completedRuns} | Best ${session.progression.bestScore}` : ''}
                  </p>
                  {session ? (
                    <div className="mt-2 max-w-md rounded border border-slate-700 bg-slate-950/50 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-300">Run Trajectory</p>
                        <p className={`font-semibold ${runTrack.tone}`}>{runTrack.label}</p>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full ${runTrack.bar}`} style={{ width: `${Math.round(runTrack.pct * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-slate-400">{runTrack.detail}</p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setMusicEnabled((v) => !v)}
                    className={`rounded border px-3 py-2 text-sm ${musicEnabled ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200' : 'border-slate-600 text-slate-300'}`}
                  >
                    {musicEnabled ? 'Music: On' : 'Music: Off'}
                  </button>
                  <button
                    onClick={() => setShowGuide(true)}
                    className="rounded border border-cyan-400/70 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200"
                  >
                    Metrics Guide
                  </button>
                  {session?.isComplete ? (
                    <button
                      onClick={() => setShowRecap(true)}
                      className="rounded border border-emerald-400/70 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200"
                    >
                      Run Recap
                    </button>
                  ) : null}
                    <button
                      onClick={() => {
                        setAppScreen('setup');
                        setShowGuide(false);
                        setShowRoundResult(false);
                        setShowRecap(false);
                        setShowDomesticOutcomeModal(false);
                        setLatestDomesticDecision(null);
                        setShowTurnEventModal(false);
                        setLatestTurnEventDecision(null);
                        setSelectedCorridorId(null);
                        setTimelineEvents([]);
                        setMemoryItems([]);
                      }}
                    className="rounded border border-slate-600 px-3 py-2 text-sm"
                  >
                    New Run
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setGameScreen('briefing')}
                  className={`rounded px-3 py-1.5 ${gameScreen === 'briefing' ? 'bg-cyan-400 text-slate-950' : 'border border-slate-600 text-slate-300'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setGameScreen('negotiation')}
                  className={`rounded px-3 py-1.5 ${gameScreen === 'negotiation' ? 'bg-cyan-400 text-slate-950' : 'border border-slate-600 text-slate-300'}`}
                >
                  Negotiation
                </button>
                <button
                  onClick={() => setGameScreen('intel')}
                  className={`rounded px-3 py-1.5 ${gameScreen === 'intel' ? 'bg-cyan-400 text-slate-950' : 'border border-slate-600 text-slate-300'}`}
                >
                  Nations
                </button>
              </div>
            </header>

            <div className="relative min-h-[440px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <div className={`absolute inset-4 overflow-y-auto pr-1 transition-all duration-300 ${gameScreen === 'briefing' ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0 pointer-events-none'}`}>
                {session ? (
                  <div className={`space-y-3 rounded-lg p-1 transition ${dealFlash ? 'deal-flash ring-2 ring-cyan-300/70' : ''}`}>
                    <h2 className="text-lg font-semibold">Market Overview</h2>
                    <div className={`rounded border p-3 bg-gradient-to-r ${scenarioArt.toneClass}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`inline-flex items-center gap-2 rounded border px-2 py-1 text-xs ${scenarioArt.accentClass}`}>
                          <span>{scenarioArt.glyph}</span>
                          <span>{scenarioArt.title}</span>
                        </p>
                        {session.judgeMode ? (
                          <p className="rounded border border-emerald-400/60 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                            Demo Mode
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-300">{scenarioArt.subtitle}</p>
                    </div>
                    <p className="text-sm text-slate-300">Shock: {session.market.shockHeadline}</p>
                    <div className="rounded border border-violet-400/40 bg-violet-500/5 p-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-violet-200">Strategy Brief</p>
                      <p className="mt-1 text-slate-200">{aiWowLine}</p>
                    </div>
                    {session.currentMission ? (
                      <div className="rounded border border-amber-400/50 bg-amber-500/10 p-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Round Mission</p>
                        <p className="mt-1 font-semibold">{session.currentMission.title}</p>
                        <p className="text-slate-200">{session.currentMission.description}</p>
                        <p className="mt-1 text-xs text-amber-100">Reward: +{session.currentMission.rewardScore} score</p>
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {rankedDeficits.map((entry) => (
                        <div key={entry.commodity} className="rounded border border-slate-700 bg-slate-950/60 p-3 text-sm">
                          <p className="font-semibold">{commodityLabels[entry.commodity]}</p>
                          <p className="text-slate-300">Price: {Math.round(entry.price)}</p>
                          <p className="text-slate-300">Deficit Signal: {entry.deficit}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded border border-slate-700 p-2">Score: {session.score}</div>
                      <div className="rounded border border-slate-700 p-2">Portfolio: {Math.round(playerValue)}</div>
                      <div className="rounded border border-slate-700 p-2">Lead: {playerName}</div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded border border-slate-700 bg-slate-950/50 p-3 text-xs">
                        <p className="font-semibold">Workshop-Style Event Timeline</p>
                        {timelineEvents.length ? (
                          <div className="mt-2 space-y-1">
                            {timelineEvents.slice(0, 5).map((event) => (
                              <p key={event.id}>
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.type} • {event.location}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-slate-400">No timeline events yet.</p>
                        )}
                      </div>
                      <div className="rounded border border-slate-700 bg-slate-950/50 p-3 text-xs">
                        <p className="font-semibold">Workshop-Style NPC Memory Feed</p>
                        {memoryItems.length ? (
                          <div className="mt-2 space-y-1">
                            {memoryItems.slice(0, 5).map((m) => (
                              <p key={m.id}>[{m.npcId}] ({m.importance}) {m.memory}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-slate-400">No memories logged yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={`absolute inset-4 overflow-y-auto pr-1 transition-all duration-300 ${gameScreen === 'negotiation' ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'}`}>
                {session ? (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Deal Composer</h2>
                    <div className="grid gap-2 md:grid-cols-2">
                      <select
                        className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
                        value={deal.nationId}
                        onChange={(e: any) => setDeal((d) => ({ ...d, nationId: e?.target?.value as NationId }))}
                      >
                        {nationOptions.map((id) => (
                          <option key={id} value={id}>{nationLabels[id]}</option>
                        ))}
                      </select>
                      <div className="rounded border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm">
                        <p className="font-semibold">{nationLabels[deal.nationId]}</p>
                        <p className="text-xs text-slate-300">
                          Trust: {Math.round(session.nations[deal.nationId].trustScore)} | Pressure: {session.nations[deal.nationId].pressure.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div className={`grid grid-cols-2 gap-2 ${dealFlash ? 'animate-pulse' : ''}`}>
                        <select
                          className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
                          value={deal.offerCommodity}
                          onChange={(e: any) => setDeal((d) => ({ ...d, offerCommodity: e?.target?.value as Commodity }))}
                        >
                          {commodityOptions.map((c) => <option key={c} value={c}>Offer {commodityLabels[c]}</option>)}
                        </select>
                        <input
                          type="number"
                          min={1}
                          className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
                          value={deal.offerAmount}
                          onChange={(e: any) => setDeal((d) => ({ ...d, offerAmount: Number(e?.target?.value) || 0 }))}
                        />
                      </div>
                      <div className={`grid grid-cols-2 gap-2 ${dealFlash ? 'animate-pulse' : ''}`}>
                        <select
                          className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
                          value={deal.requestCommodity}
                          onChange={(e: any) => setDeal((d) => ({ ...d, requestCommodity: e?.target?.value as Commodity }))}
                        >
                          {commodityOptions.map((c) => <option key={c} value={c}>Request {commodityLabels[c]}</option>)}
                        </select>
                        <input
                          type="number"
                          min={1}
                          className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
                          value={deal.requestAmount}
                          onChange={(e: any) => setDeal((d) => ({ ...d, requestAmount: Number(e?.target?.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                      <button
                        onClick={submitDeal}
                        disabled={loading || session.isComplete || !turnEventResolvedThisRound || !domesticResolvedThisRound}
                        className="rounded bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
                      >
                        Submit Proposal
                      </button>
                      <button
                        onClick={advance}
                        disabled={loading || session.isComplete || !session.pendingOutcome}
                        className="rounded bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
                      >
                        Advance Round
                      </button>
                      <button
                        onClick={() => {
                          void askCopilot();
                        }}
                        disabled={loading || session.isComplete}
                        className="rounded border border-violet-400/70 bg-violet-400/10 px-3 py-2 text-sm font-semibold text-violet-200 disabled:opacity-60"
                      >
                        Copilot
                      </button>
                    </div>
                    {copilotStatus ? <p className="text-xs text-violet-200">{copilotStatus}</p> : null}
                    {!turnEventResolvedThisRound ? <p className="text-xs text-amber-200">Resolve the turn event first to unlock domestic actions.</p> : null}
                    {turnEventResolvedThisRound && !domesticResolvedThisRound ? <p className="text-xs text-amber-200">Resolve the domestic step to unlock trading this round.</p> : null}

                    <div className="rounded border border-slate-700 bg-slate-950/60 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">Domestic Status</p>
                        <p className={`${domesticResolvedThisRound ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {domesticResolvedThisRound ? 'Resolved for current round' : 'Pending domestic step'}
                        </p>
                      </div>
                      <div className="mt-2 rounded border border-slate-700 bg-slate-900/70 p-2">
                        Turn Event: <span className={turnEventResolvedThisRound ? 'text-emerald-300' : 'text-amber-300'}>{turnEventResolvedThisRound ? 'Resolved' : 'Pending'}</span>
                        {!turnEventResolvedThisRound ? (
                          <button
                            onClick={() => setShowTurnEventModal(true)}
                            className="ml-2 rounded border border-cyan-400/60 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-200"
                          >
                            Open Event
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <div className="rounded border border-slate-700 bg-slate-900/70 p-2">
                          Treasury: {Math.round(session.treasury)}
                        </div>
                        <div className="rounded border border-slate-700 bg-slate-900/70 p-2">
                          Debt: {Math.round(session.debt)}
                        </div>
                        <div className="rounded border border-slate-700 bg-slate-900/70 p-2">
                          Sentiment: {Math.round(session.publicSentiment)}
                        </div>
                      </div>
                      {!domesticResolvedThisRound ? (
                        <button
                          onClick={() => setShowDomesticScenarioModal(true)}
                          disabled={!turnEventResolvedThisRound}
                          className="mt-3 rounded border border-amber-400/70 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 disabled:opacity-50"
                        >
                          {turnEventResolvedThisRound ? 'Open Domestic Step' : 'Resolve Turn Event First'}
                        </button>
                      ) : null}
                    </div>

                    {lastOutcome ? (
                      <div className="rounded border border-slate-700 bg-slate-950/50 p-3 text-xs">
                        <p className="font-semibold">Latest Evaluation</p>
                        <p className="mt-1">{lastOutcome.accepted ? 'Accepted' : 'Rejected'} | Fairness {lastOutcome.fairnessRatio}</p>
                        <p className="text-slate-300">{lastOutcome.reason}</p>
                        <p className="mt-1 text-slate-400">Detailed updates appear in the round transition screens after you advance.</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className={`absolute inset-4 overflow-y-auto pr-1 transition-all duration-300 ${gameScreen === 'intel' ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'}`}>
                {session ? (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Nations</h2>
                    <p className="text-xs text-slate-400">Click nations for profiles. Click route lines for corridor health, activity, and lane history.</p>

                    <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                      <div className="rounded border border-slate-700 bg-slate-950/50 p-3">
                        <div className="relative h-[300px] overflow-hidden rounded border border-slate-700 bg-[radial-gradient(circle_at_20%_10%,#1f2937_0%,#0f172a_45%,#020617_100%)]">
                          <svg viewBox="0 0 100 64" className="absolute inset-0 h-full w-full">
                            {nationOptions.flatMap((id) =>
                              nationMapMeta[id].links
                                .filter((target) => nationOptions.indexOf(target) > nationOptions.indexOf(id))
                                .map((target) => {
                                  const idKey = routeId(id, target);
                                  const corridor = session.corridors[idKey];
                                  const health = corridor?.health ?? 50;
                                  const isLaneActive = Boolean(corridor && corridor.activity >= 12);
                                  const isSelectedLane = selectedCorridorId === idKey;
                                  const stroke =
                                    health >= 70 ? '#34d399' : health >= 45 ? '#22d3ee' : health >= 25 ? '#f59e0b' : '#ef4444';
                                  return (
                                    <line
                                      key={`${id}-${target}`}
                                      x1={nationMapMeta[id].x}
                                      y1={nationMapMeta[id].y}
                                      x2={nationMapMeta[target].x}
                                      y2={nationMapMeta[target].y}
                                      onClick={() => setSelectedCorridorId(idKey)}
                                      stroke={isSelectedLane ? '#f8fafc' : stroke}
                                      strokeWidth={isSelectedLane ? 1.4 : isLaneActive ? 1.1 : 0.65}
                                      strokeDasharray={isLaneActive ? '1.1 0.9' : '1.5 1'}
                                      className={`${isLaneActive || isSelectedLane ? 'route-flow cursor-pointer' : 'cursor-pointer'}`}
                                    />
                                  );
                                })
                            )}
                          </svg>

                          {nationOptions.map((id) => {
                            const isSelected = selectedNation === id;
                            const isPulsing = routePulseOn && routePulseNation === id;
                            return (
                              <button
                                key={id}
                                onClick={() => setSelectedNation(id)}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-semibold transition ${isSelected ? 'z-20 scale-105 border border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-lg shadow-cyan-500/20' : 'z-10 border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500'} ${isPulsing ? 'ring-2 ring-emerald-300 shadow-lg shadow-emerald-400/30 animate-pulse' : ''}`}
                                style={{ left: `${nationMapMeta[id].x}%`, top: `${nationMapMeta[id].y}%` }}
                                aria-label={`Select ${nationLabels[id]}`}
                              >
                                <span
                                  className={`mr-1 inline-block h-2 w-2 rounded-full ${isSelected ? 'animate-pulse' : ''}`}
                                  style={{ backgroundColor: nationMapMeta[id].hue }}
                                />
                                {nationLabels[id]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded border border-slate-700 bg-slate-950/50 p-3 text-sm">
                        {(() => {
                          const intelLevel = session.intelLevels[selectedNation] || 0;
                          return (
                            <p className="mb-2 text-[11px] text-slate-400">Intel Level {intelLevel}/3 - higher levels reveal deeper strategy signals.</p>
                          );
                        })()}
                        <div className="mb-3 flex items-center gap-3 rounded border border-slate-700 bg-slate-900/70 p-2">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold text-white animate-pulse"
                            style={{ backgroundColor: nationMapMeta[selectedNation].hue, borderColor: nationMapMeta[selectedNation].hue }}
                          >
                            {nationInitials(nationLabels[selectedNation])}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Nation Profile</p>
                            <p className="text-xs text-slate-400">Live strategic posture updates every round</p>
                          </div>
                        </div>
                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Selected Nation</p>
                        <p className="mt-1 text-lg font-semibold">{nationLabels[selectedNation]}</p>
                        <p className="text-xs text-slate-400">{nationMapMeta[selectedNation].region}</p>
                        <p className="mt-2 text-slate-300">{nationMapMeta[selectedNation].descriptor}</p>

                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                          <div className="rounded border border-slate-700 p-2">
                            Trust: {Math.round(session.nations[selectedNation].trustScore)}
                          </div>
                          <div className="rounded border border-slate-700 p-2">
                            Pressure: {session.nations[selectedNation].pressure.toFixed(1)} ({pressureLabel(session.nations[selectedNation].pressure)})
                          </div>
                        </div>

                        <div className="mt-3">
                          <A2UINationCard spec={a2uiSpec} onAction={onA2UIAction} />
                        </div>

                        <div className="mt-3 rounded border border-slate-700 p-2 text-xs">
                          <p className="font-semibold text-slate-100">Commodity Holdings</p>
                          <div className="mt-1 grid grid-cols-2 gap-1 text-slate-300">
                            {commodityOptions.map((c) => (
                              <p key={`${selectedNation}-${c}`}>{commodityLabels[c]}: {Math.round(session.nations[selectedNation].inventory[c] * 10) / 10}</p>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 rounded border border-slate-700 bg-slate-900/65 p-2 text-xs">
                          <p className="font-semibold text-slate-100">Trade Corridor</p>
                          {selectedCorridor ? (
                            <div className="mt-1 space-y-1 text-slate-300">
                              <p>{nationLabels[selectedCorridor.a]} ↔ {nationLabels[selectedCorridor.b]}</p>
                              <p>Health: {Math.round(selectedCorridor.health)} | Capacity: {Math.round(selectedCorridor.capacity)} | Activity: {Math.round(selectedCorridor.activity)}</p>
                              <p className="text-slate-400">Recent lane events:</p>
                              <div className="max-h-24 overflow-y-auto space-y-1">
                                {(selectedCorridor.history || []).slice(0, 4).map((h, i) => (
                                  <p key={`${selectedCorridor.id}-${i}`}>R{h.round}: {h.delta > 0 ? '+' : ''}{Math.round(h.delta)} • {h.note}</p>
                                ))}
                                {!selectedCorridor.history?.length ? <p>No recent changes.</p> : null}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-slate-400">Click a route line on the map to inspect lane health and history.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-slate-700 bg-slate-950/50 p-3 text-xs">
                      <p className="font-semibold">Recent Responses</p>
                      {session.outcomeLog.length ? (
                        <div className="mt-2 space-y-1">
                          {session.outcomeLog.slice(0, 8).map((o, i) => (
                            <p key={`${o.createdAt}-${i}`}>Round {o.round}: {o.accepted ? 'Accepted' : 'Rejected'} | Trust {o.trustDelta > 0 ? '+' : ''}{o.trustDelta}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-slate-400">No completed rounds yet.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {metrics ? (
              <div className="grid gap-2 text-xs sm:grid-cols-3 lg:grid-cols-7">
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Sessions: {metrics.sessionsStarted}</div>
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Completed: {metrics.sessionsCompleted}</div>
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Rounds: {metrics.roundsCompleted}</div>
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Deals: {metrics.dealsMade}</div>
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Turn Events: {metrics.turnEventsResolved}</div>
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Completion: {metrics.completionRate}%</div>
                <div className="rounded border border-slate-700 bg-slate-900/80 p-2">Avg Score: {metrics.averageScore}</div>
              </div>
            ) : null}

            {metrics ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <a href="/api/game/metrics/export?format=json" target="_blank" rel="noreferrer" className="rounded border border-slate-700 bg-slate-900/80 px-3 py-1.5 hover:bg-slate-800">
                  Export JSON
                </a>
                <a href="/api/game/metrics/export?format=csv" target="_blank" rel="noreferrer" className="rounded border border-slate-700 bg-slate-900/80 px-3 py-1.5 hover:bg-slate-800">
                  Export CSV
                </a>
              </div>
            ) : null}
          </section>
        )}
      </div>

      {appScreen === 'game' && tutorialStep ? (
        <div className="fixed left-4 top-24 z-40 w-[320px] rounded-xl border border-cyan-400/40 bg-slate-900/95 p-3 shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Guided Run</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{tutorialStep.title}</p>
          <p className="mt-1 text-xs text-slate-300">{tutorialStep.body}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setDismissTutorial(true)}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                if (!turnEventResolvedThisRound) {
                  setShowTurnEventModal(true);
                  return;
                }
                if (!domesticResolvedThisRound) {
                  setShowDomesticScenarioModal(true);
                  return;
                }
                if (!session?.pendingOutcome) {
                  setGameScreen('negotiation');
                  return;
                }
                void advance();
              }}
              className="rounded border border-cyan-400/70 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200"
            >
              Take Me There
            </button>
          </div>
        </div>
      ) : null}

      {appScreen === 'game' ? (
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/70 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300 ${showGuide || showRoundResult || showRoundInterstitial || showDomesticInterstitial || showTurnEventModal || showDomesticScenarioModal || showDomesticOutcomeModal ? 'opacity-0' : 'opacity-100'}`}>
          <div className="ticker-wrap whitespace-nowrap py-2 text-xs text-slate-200">
            <div className="ticker-track inline-block">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span key={`${item}-${i}`} className="mx-6 inline-block">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 ${showTransmission ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="rounded-xl border border-cyan-400/40 bg-slate-900/95 p-6 text-center shadow-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Secure Link</p>
          <p className="mt-2 text-xl font-bold">Transmitting Proposal...</p>
          <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-1/2 rounded-full bg-cyan-400 transmission-bar" />
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300 ${decisionReveal.open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`rounded-xl border px-8 py-6 text-center shadow-2xl transition-all duration-300 ${decisionReveal.accepted ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/60 bg-rose-500/10 text-rose-200'}`}>
          <p className="text-xs uppercase tracking-[0.2em]">Diplomatic Response</p>
          <p className="mt-2 text-3xl font-black">{decisionReveal.accepted ? 'ACCEPTED' : 'REJECTED'}</p>
        </div>
      </div>

      <div className={`fixed right-4 top-4 z-[60] transition-all duration-300 ${actionToast.open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'}`}>
        <div className="rounded-lg border border-cyan-400/40 bg-slate-900/95 px-4 py-2 text-sm text-cyan-100 shadow-xl">
          {actionToast.message}
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 transition-opacity duration-300 ${showRoundInterstitial ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="w-full max-w-xl rounded-2xl border border-cyan-400/40 bg-slate-900/95 p-8 text-center shadow-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Transition</p>
          <p className="mt-3 text-4xl font-black">{session ? `ROUND ${session.round}` : 'NEXT ROUND'}</p>
          <p className="mt-2 text-sm text-slate-300">{session?.market.shockHeadline || 'Updating global market state...'}</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-1/3 rounded-full bg-cyan-400 interstitial-bar" />
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 transition-opacity duration-300 ${showDomesticInterstitial ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="w-full max-w-xl rounded-2xl border border-emerald-400/40 bg-slate-900/95 p-8 text-center shadow-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Domestic Brief</p>
          <p className="mt-3 text-3xl font-black">STATUS UPDATE</p>
          <p className="mt-2 text-sm text-slate-300">Reviewing civilian demand, shortages, and stability before next action window.</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-1/2 rounded-full bg-emerald-400 interstitial-bar" />
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${showTurnEventModal ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`w-full max-w-2xl rounded-xl border bg-slate-900 p-5 shadow-2xl transition-all duration-300 ${eventSeverity >= 5 ? 'border-rose-400/50' : eventSeverity >= 4 ? 'border-amber-400/50' : 'border-cyan-400/40'} ${showTurnEventModal ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Turn Event</p>
          <h2 className="mt-1 text-2xl font-bold">{session?.currentTurnEvent?.title || 'Operational Event'}</h2>
          <p className="mt-1 text-sm text-slate-300">{session?.currentTurnEvent?.description || 'Resolve this event to continue the round.'}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className={`rounded border px-2 py-1 ${eventSeverity >= 5 ? 'border-rose-500/50 bg-rose-500/10 text-rose-200' : eventSeverity >= 4 ? 'border-amber-500/50 bg-amber-500/10 text-amber-200' : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'}`}>
              Severity {eventSeverity || '-'} {eventSeverity >= 5 ? 'Critical' : eventSeverity >= 4 ? 'High' : eventSeverity >= 3 ? 'Elevated' : 'Moderate'}
            </span>
            <span className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1">Treasury {Math.round(session?.treasury || 0)}</span>
            <span className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1">Sentiment {Math.round(session?.publicSentiment || 0)}</span>
            {latestTurnEventDecision ? (
              <span className="rounded border border-cyan-400/50 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                Last: {latestTurnEventDecision.optionLabel}
              </span>
            ) : null}
          </div>
          {latestTurnEventDecision ? (
            <div className="mt-2 rounded border border-slate-700 bg-slate-950/50 p-2 text-xs text-slate-300">
              <p>{latestTurnEventDecision.summary}</p>
              <p className="mt-1">
                Treasury {latestTurnEventDecision.treasuryImpact >= 0 ? '+' : ''}{Math.round(latestTurnEventDecision.treasuryImpact)} | Sentiment {latestTurnEventDecision.sentimentImpact >= 0 ? '+' : ''}{latestTurnEventDecision.sentimentImpact} | Corridor {latestTurnEventDecision.corridorImpact >= 0 ? '+' : ''}{latestTurnEventDecision.corridorImpact}
              </p>
              {latestTurnEventDecision.resourceImpact && Object.keys(latestTurnEventDecision.resourceImpact).length ? (
                <p className="mt-1">
                  Resource impact: {commodityOptions
                    .filter((c) => typeof latestTurnEventDecision.resourceImpact?.[c] === 'number' && Math.abs(latestTurnEventDecision.resourceImpact?.[c] || 0) > 0.01)
                    .map((c) => `${commodityLabels[c]} ${(latestTurnEventDecision.resourceImpact?.[c] || 0) >= 0 ? '+' : ''}${(latestTurnEventDecision.resourceImpact?.[c] || 0).toFixed(1)}`)
                    .join(' • ')}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(session?.currentTurnEvent?.options || []).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedTurnEventOption(opt.id)}
                className={`rounded border p-3 text-left transition ${
                  selectedTurnEventOption === opt.id ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                }`}
              >
                <p className="font-semibold">{opt.label}</p>
                <p className="mt-1 text-xs text-slate-300">{opt.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resolveTurnEvent}
              disabled={loading || !session || session.isComplete || turnEventResolvedThisRound || !selectedTurnEventOption}
              className="rounded border border-cyan-400/70 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-50"
            >
              Confirm Event Response
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${showDomesticScenarioModal ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`w-full max-w-2xl rounded-xl border border-amber-400/40 bg-slate-900 p-5 shadow-2xl transition-all duration-300 ${showDomesticScenarioModal ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Domestic Overview</p>
          <h2 className="mt-1 text-2xl font-bold">{session?.currentDomesticScenario?.title || 'Domestic Event'}</h2>
          <p className="mt-1 text-sm text-slate-300">{domesticScenarioDisplay.summary}</p>
          <div className="mt-2 flex gap-2 text-[11px]">
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-200">
              {titleCase(session?.currentDomesticScenario?.category || 'social')}
            </span>
            {domesticScenarioDisplay.stressChannel ? (
              <span className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-rose-200">
                Pressure: {titleCase(domesticScenarioDisplay.stressChannel)}
              </span>
            ) : null}
            {domesticScenarioDisplay.signal ? (
              <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                Signal: {titleCase(domesticScenarioDisplay.signal)}
              </span>
            ) : null}
            <span className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1">Treasury {Math.round(session?.treasury || 0)}</span>
            <span className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1">Debt {Math.round(session?.debt || 0)}</span>
            <span className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1">Sentiment {Math.round(session?.publicSentiment || 0)}</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(session?.currentDomesticScenario?.options || []).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedDomesticOption(opt.id as DomesticOptionId)}
                className={`rounded border p-3 text-left transition ${
                  selectedDomesticOption === opt.id ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                }`}
              >
                <p className="font-semibold">{opt.label}</p>
                <p className="mt-1 text-xs text-slate-300">{opt.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resolveDomestic}
              disabled={loading || !session || session.isComplete || domesticResolvedThisRound}
              className="rounded border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
            >
              Confirm Decision
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 transition-opacity duration-300 ${showDomesticOutcomeModal ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`w-full max-w-2xl rounded-xl border border-emerald-400/40 bg-slate-900 p-5 shadow-2xl transition-all duration-300 ${showDomesticOutcomeModal ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Domestic Consequences</p>
          <h2 className="mt-1 text-2xl font-bold">{latestDomesticDecision?.optionLabel || 'Decision Applied'}</h2>
          <p className="mt-1 text-sm text-slate-300">{latestDomesticDecision?.summary || 'Impacts processed for this round.'}</p>

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Treasury Impact</p>
              <p className={`mt-1 text-lg font-semibold ${Number(latestDomesticDecision?.treasuryImpact || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {Number(latestDomesticDecision?.treasuryImpact || 0) >= 0 ? '+' : ''}{Math.round(Number(latestDomesticDecision?.treasuryImpact || 0))}
              </p>
            </div>
            <div className="rounded border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Debt Impact</p>
              <p className={`mt-1 text-lg font-semibold ${Number(latestDomesticDecision?.debtImpact || 0) <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {Number(latestDomesticDecision?.debtImpact || 0) >= 0 ? '+' : ''}{Math.round(Number(latestDomesticDecision?.debtImpact || 0))}
              </p>
            </div>
            <div className="rounded border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Sentiment Impact</p>
              <p className={`mt-1 text-lg font-semibold ${Number(latestDomesticDecision?.sentimentImpact || 0) >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {Number(latestDomesticDecision?.sentimentImpact || 0) >= 0 ? '+' : ''}{Math.round(Number(latestDomesticDecision?.sentimentImpact || 0))}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded border border-slate-700 bg-slate-950/60 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Resource Impact</p>
            {latestDomesticDecision?.resourceImpact && Object.keys(latestDomesticDecision.resourceImpact).length ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {commodityOptions
                  .filter((c) => typeof latestDomesticDecision.resourceImpact?.[c] === 'number' && Math.abs(latestDomesticDecision.resourceImpact?.[c] || 0) > 0.01)
                  .map((c) => {
                    const delta = Number(latestDomesticDecision.resourceImpact?.[c] || 0);
                    return (
                      <div key={`domestic-impact-${c}`} className="rounded border border-slate-700 bg-slate-900/70 p-2 text-xs">
                        <p className="font-semibold">{commodityLabels[c]}</p>
                        <p className={delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No strategic reserves were consumed for this choice.</p>
            )}
          </div>

          <div className="mt-4 rounded border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Updated Domestic Position</p>
            <p className="mt-1">Treasury {Math.round(session?.treasury || 0)} | Debt {Math.round(session?.debt || 0)} | Sentiment {Math.round(session?.publicSentiment || 0)}</p>
            <p className="mt-1 text-xs text-slate-400">
              Reserves: {commodityOptions.map((c) => `${commodityLabels[c]} ${Math.round(((session?.playerInventory?.[c] || 0) as number) * 10) / 10}`).join(' • ')}
            </p>
            <p className="mt-1 text-xs text-slate-400">Use this to adjust the next trade proposal before submitting.</p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowDomesticOutcomeModal(false)}
              className="rounded border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200"
            >
              Continue To Negotiation
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 transition-opacity duration-300 ${showGuide ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl transition-all duration-300 ${showGuide ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">How Metrics Work</h2>
              <p className="mt-1 text-sm text-slate-300">
                Improve these to get better deal acceptance, stronger trust, and higher final score.
              </p>
              <p className="mt-1 text-xs text-slate-500">Keyboard: `Esc` close</p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Trust Score</p>
              <p className="mt-1 text-slate-300">Per nation. Higher trust lowers acceptance thresholds.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Pressure</p>
              <p className="mt-1 text-slate-300">High pressure makes terms harsher and rejections more likely.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Fairness Ratio</p>
              <p className="mt-1 text-slate-300">Offer value divided by request value. Keep around 1.0+.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Deficit Signal</p>
              <p className="mt-1 text-slate-300">Shows shortage pressure for each commodity.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Public Stability</p>
              <p className="mt-1 text-slate-300">Nation-level social stability. Low values increase crisis risk and can lose runs.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Needs Gap</p>
              <p className="mt-1 text-slate-300">Difference between what a nation needs and what it has in inventory.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Treasury</p>
              <p className="mt-1 text-slate-300">Cash buffer for domestic actions. Running low pushes you toward debt.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Debt</p>
              <p className="mt-1 text-slate-300">Borrowed funds. Interest and servicing reduce future flexibility.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Public Sentiment</p>
              <p className="mt-1 text-slate-300">Domestic approval mood. Better sentiment supports stability and trade posture.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Intel Level</p>
              <p className="mt-1 text-slate-300">How much you know about each nation. Higher intel reveals stronger strategic signals.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Mission Reward</p>
              <p className="mt-1 text-slate-300">Per-round objective bonus. Completing missions gives direct score boosts.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Run Score</p>
              <p className="mt-1 text-slate-300">Primary performance metric from deals, missions, and domestic stability at endgame.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Portfolio Value</p>
              <p className="mt-1 text-slate-300">Your inventory valued at current market prices. Tracks strategic inventory strength.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Completion Rate</p>
              <p className="mt-1 text-slate-300">Percent of started sessions that finish.</p>
            </div>
            <div className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-semibold">Win Rate</p>
              <p className="mt-1 text-slate-300">Percent of completed sessions that reach victory thresholds.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 transition-opacity duration-300 ${showRoundResult ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`w-full max-w-2xl rounded-xl border border-emerald-500/40 bg-slate-900 p-5 shadow-2xl transition-all duration-300 ${showRoundResult ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Round Resolution</p>
          <h2 className="mt-1 text-2xl font-bold">
            {lastOutcome ? `Round ${lastOutcome.round} ${lastOutcome.accepted ? 'Accepted' : 'Rejected'}` : 'Round Complete'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Keyboard: `Space` next • `Esc` close</p>
          <div className="mt-3 flex gap-2 text-[11px]">
            {['Outcome', 'Market', 'Domestic', 'Intel', 'Story'].map((step, i) => (
              <div
                key={step}
                className={`rounded px-2 py-1 transition ${roundResultStep === i ? 'bg-emerald-400 text-slate-950' : 'border border-slate-700 text-slate-300'}`}
              >
                {step}
              </div>
            ))}
          </div>

          {lastOutcome ? (
            <div className="mt-4 min-h-[230px] text-sm transition-all duration-300">
              {roundResultStep === 0 ? (
                <div className="space-y-2">
                  <p><span className="text-slate-400">Result:</span> {lastOutcome.reason}</p>
                  <p><span className="text-slate-400">Impact:</span> Score {lastOutcome.scoreDelta > 0 ? '+' : ''}{lastOutcome.scoreDelta}, Trust {lastOutcome.trustDelta > 0 ? '+' : ''}{lastOutcome.trustDelta}</p>
                  {session?.missionLog?.[0]?.completed ? (
                    <p className="text-amber-200">
                      Mission complete: {session.missionLog[0].title} (+{session.missionLog[0].rewardScore})
                    </p>
                  ) : null}
                  <div className="rounded border border-slate-700 bg-slate-950/50 p-3">
                    <p className="font-semibold">Status Updates</p>
                    <div className="mt-1 space-y-1 text-slate-300">
                      {lastOutcome.statusUpdates.map((line, i) => (
                        <p key={`${line}-${i}`}>- {line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {roundResultStep === 1 ? (
                <div className="space-y-2">
                  <p className="text-slate-300">New shock: {session?.market.shockHeadline}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {commodityOptions.map((c) => (
                      <div key={`impact-${c}`} className="rounded border border-slate-700 bg-slate-950/50 p-2 text-xs">
                        <p className="font-semibold">{commodityLabels[c]}</p>
                        <p>Price: {session ? Math.round(session.market.prices[c]) : '-'}</p>
                        <p>Deficit: {session ? session.market.deficits[c] : '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {roundResultStep === 2 ? (
                <div className="space-y-2">
                  <p className="text-slate-300">Domestic demand and stability snapshot:</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {nationOptions.map((id) => {
                      const nation = session?.nations[id];
                      if (!nation) return null;
                      const needTotal = commodityOptions.reduce((sum, c) => sum + nation.publicNeeds[c], 0);
                      const shortage = commodityOptions.reduce((sum, c) => sum + Math.max(0, nation.publicNeeds[c] - nation.inventory[c]), 0);
                      const gapPct = needTotal > 0 ? Math.round((shortage / needTotal) * 100) : 0;
                      return (
                        <div key={`domestic-${id}`} className="rounded border border-slate-700 bg-slate-950/50 p-2 text-xs">
                          <p className="font-semibold">{nationLabels[id]}</p>
                          <p>Stability: {Math.round(nation.publicStability)}</p>
                          <p>Needs Gap: {gapPct}%</p>
                        </div>
                      );
                    })}
                  </div>
                  {session?.domesticLog?.[0] ? (
                    <div className="rounded border border-emerald-400/40 bg-emerald-500/5 p-2 text-xs text-emerald-200">
                      Last domestic decision: {session.domesticLog[0].summary}
                    </div>
                  ) : null}
                  {session?.turnEventLog?.[0] ? (
                    <div className="rounded border border-cyan-400/40 bg-cyan-500/5 p-2 text-xs text-cyan-200">
                      Last turn event: {session.turnEventLog[0].summary}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {roundResultStep === 3 ? (
                <div className="space-y-3">
                  {lastOutcome.hiddenAgendaSignal ? (
                    <p><span className="text-slate-400">Signal:</span> {lastOutcome.hiddenAgendaSignal}</p>
                  ) : (
                    <p className="text-slate-400">No strong hidden-agenda signal this round.</p>
                  )}
                  {lastOutcome.counterOffer ? (
                    <div className="rounded border border-slate-700 bg-slate-950/50 p-3">
                      <p className="font-semibold">Counter-Offer</p>
                      <p className="mt-1 text-slate-300">
                        Offer {lastOutcome.counterOffer.offerAmount} {commodityLabels[lastOutcome.counterOffer.offerCommodity]} for {lastOutcome.counterOffer.requestAmount} {commodityLabels[lastOutcome.counterOffer.requestCommodity]}
                      </p>
                      <p className="text-slate-400">Confidence: {lastOutcome.counterOffer.confidence}%</p>
                      <p className="text-slate-400">{lastOutcome.counterOffer.rationale}</p>
                      <button
                        onClick={() =>
                          {
                            setDeal({
                              nationId: lastOutcome.counterOffer!.nationId,
                              offerCommodity: lastOutcome.counterOffer!.offerCommodity,
                              offerAmount: lastOutcome.counterOffer!.offerAmount,
                              requestCommodity: lastOutcome.counterOffer!.requestCommodity,
                              requestAmount: lastOutcome.counterOffer!.requestAmount,
                            });
                            setGameScreen('negotiation');
                            setDealFlash(true);
                            setActionToast({ open: true, message: 'Counter-offer loaded into deal composer.' });
                          }
                        }
                        className="mt-2 rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
                      >
                        Load Into Negotiation
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400">No formal counter-offer issued.</p>
                  )}
                </div>
              ) : null}

              {roundResultStep === 4 ? (
                <div className="space-y-2">
                  {session?.latestNarration ? (
                    <div className="rounded border border-cyan-400/40 bg-cyan-500/5 p-3">
                      <p className="font-semibold text-cyan-200">{session.latestNarration.title}</p>
                      <p className="mt-1 text-slate-200">{session.latestNarration.marketBulletin}</p>
                      <p className="mt-1 text-slate-300">{session.latestNarration.diplomaticSignal}</p>
                      <p className="mt-1 text-slate-300">{session.latestNarration.riskOutlook}</p>
                    </div>
                  ) : null}
                  {session ? (
                    <p className="text-slate-300">
                      Next state: Round {session.round}/{session.maxRounds}
                      {session.isComplete ? ' (Finalized)' : ` | Shock primed for next turn`}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex justify-between">
            <button
              onClick={() => setRoundResultStep((s) => Math.max(0, s - 1))}
              disabled={roundResultStep === 0}
              className="rounded border border-slate-600 px-4 py-2 text-sm disabled:opacity-40"
            >
              Back
            </button>
            {roundResultStep < 4 ? (
              <button
                onClick={() => setRoundResultStep((s) => Math.min(4, s + 1))}
                className="rounded bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setShowRoundResult(false)}
                className="rounded bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 transition-opacity duration-300 ${showRecap ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className={`w-full max-w-2xl rounded-xl border border-emerald-500/40 bg-slate-900 p-5 shadow-2xl transition-all duration-300 ${showRecap ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Run Recap</p>
              <h2 className="mt-1 text-2xl font-bold">{session?.runRecap?.outcome === 'win' ? 'Victory' : 'Run Ended'}</h2>
              <p className="mt-1 text-sm text-slate-300">{session?.runRecap?.reason || session?.endReason || 'No recap available yet.'}</p>
            </div>
            <button onClick={() => setShowRecap(false)} className="rounded border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800">Close</button>
          </div>
          {session?.runRecap ? (
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Final Score: {session.score}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Avg Stability: {session.runRecap.avgStability}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Domestic Score Delta: {session.runRecap.domesticScoreDelta >= 0 ? '+' : ''}{session.runRecap.domesticScoreDelta}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Domestic Decisions: {session.runRecap.domesticDecisions}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Ending Treasury: {session.runRecap.endingTreasury}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Ending Debt: {session.runRecap.endingDebt}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Ending Sentiment: {session.runRecap.endingSentiment}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Best Deal Fairness: {session.runRecap.bestDealFairness ?? '-'}</div>
              <div className="rounded border border-slate-700 bg-slate-950/50 p-3">Worst Deal Fairness: {session.runRecap.worstDealFairness ?? '-'}</div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
