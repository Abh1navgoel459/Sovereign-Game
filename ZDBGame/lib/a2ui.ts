import type { Commodity, Nation, NationId } from '@/lib/game-types';

export interface A2UIMetric {
  id: string;
  label: string;
  value: string;
  tone: 'neutral' | 'good' | 'warn' | 'critical';
}

export interface A2UICallout {
  title: string;
  body: string;
}

export interface A2UICardSpec {
  component: 'nation_status_card_v1';
  nationId: NationId;
  header: {
    title: string;
    subtitle: string;
    color: string;
  };
  metrics: A2UIMetric[];
  callouts: A2UICallout[];
  chips: string[];
  actions: Array<{
    id: 'ask_copilot' | 'apply_fair_template' | 'open_mission_brief' | 'focus_intel';
    label: string;
    disabled?: boolean;
    reason?: string;
  }>;
  footer: string;
}

function pressureTone(pressure: number): A2UIMetric['tone'] {
  if (pressure >= 7) return 'critical';
  if (pressure >= 4) return 'warn';
  return 'good';
}

function trustTone(trust: number): A2UIMetric['tone'] {
  if (trust < -20) return 'critical';
  if (trust < 5) return 'warn';
  return 'good';
}

function commodityLabel(c: Commodity): string {
  return c === 'rare_earths' ? 'Rare Earths' : c[0].toUpperCase() + c.slice(1);
}

function colorByNation(id: NationId): string {
  if (id === 'usa') return '#60a5fa';
  if (id === 'china') return '#f87171';
  if (id === 'eu') return '#a78bfa';
  if (id === 'india') return '#34d399';
  return '#f59e0b';
}

export function buildNationA2UISpec(input: {
  nationId: NationId;
  nation: Nation;
  intelLevel: number;
  hasMission?: boolean;
}): A2UICardSpec {
  const { nationId, nation, intelLevel, hasMission } = input;
  const knownStyle = intelLevel >= 1 ? nation.bargainingStyle : 'locked';
  const knownRisk = intelLevel >= 2 ? `${Math.round(nation.riskTolerance * 100)}%` : 'locked';
  const knownPriority = intelLevel >= 3 ? commodityLabel(nation.priorityCommodity) : 'locked';

  return {
    component: 'nation_status_card_v1',
    nationId,
    header: {
      title: nation.name,
      subtitle: `Intel ${intelLevel}/3`,
      color: colorByNation(nationId),
    },
    metrics: [
      { id: 'trust', label: 'Trust', value: `${Math.round(nation.trustScore)}`, tone: trustTone(nation.trustScore) },
      { id: 'pressure', label: 'Pressure', value: `${nation.pressure.toFixed(1)}`, tone: pressureTone(nation.pressure) },
      { id: 'style', label: 'Style', value: knownStyle, tone: knownStyle === 'locked' ? 'warn' : 'neutral' },
      { id: 'risk', label: 'Risk', value: knownRisk, tone: knownRisk === 'locked' ? 'warn' : 'neutral' },
      { id: 'priority', label: 'Priority', value: knownPriority, tone: knownPriority === 'locked' ? 'warn' : 'neutral' },
    ],
    callouts: [
      { title: 'Public Objective', body: nation.publicObjective },
      {
        title: 'Interpretation',
        body:
          intelLevel >= 3
            ? `Counterparty likely optimizes around ${commodityLabel(nation.priorityCommodity)} this round.`
            : 'Run more negotiations with this nation to reveal deeper behavior.',
      },
    ],
    chips: [intelLevel >= 2 ? 'deep intel' : 'partial intel', nation.bargainingStyle, `inv:${Math.round(nation.inventory.energy)}E`],
    actions: [
      { id: 'ask_copilot', label: 'Ask Copilot' },
      { id: 'apply_fair_template', label: 'Apply Fair Deal Template' },
      { id: 'open_mission_brief', label: 'Open Mission', disabled: !hasMission, reason: hasMission ? undefined : 'No active mission' },
      { id: 'focus_intel', label: 'Focus View' },
    ],
    footer: 'A2UI view spec (nation_status_card_v1)',
  };
}
