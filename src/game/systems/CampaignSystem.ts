/**
 * Campaign boons + heal helpers (T-023).
 * Pure functions — no React.
 */

import {
  Player,
  PrimaryStat,
  Item,
  Skill,
  Rarity,
  ComponentId,
} from '../types';
import { getPlayerFullStats } from './StatSystem';
import { COMPONENT_DEFINITIONS } from '../constants/components';
import { SKILLS } from '../constants/skills';
import { pick } from '../utils/rng';

export type BoonKind = 'stat' | 'item' | 'skill';

export interface CampaignBoon {
  id: string;
  kind: BoonKind;
  title: string;
  description: string;
  /** For stat boons */
  stat?: PrimaryStat;
  statAmount?: number;
  /** For item boons */
  item?: Item;
  /** For skill boons */
  skill?: Skill;
}

const STAT_POOL: PrimaryStat[] = [
  PrimaryStat.WILLPOWER,
  PrimaryStat.CHAKRA,
  PrimaryStat.STRENGTH,
  PrimaryStat.SPIRIT,
  PrimaryStat.INTELLIGENCE,
  PrimaryStat.CALMNESS,
  PrimaryStat.SPEED,
  PrimaryStat.ACCURACY,
  PrimaryStat.DEXTERITY,
];

function makeId(): string {
  return `boon-${Math.random().toString(36).slice(2, 9)}`;
}

function rollStatBoon(): CampaignBoon {
  const stat = pick(STAT_POOL) ?? PrimaryStat.STRENGTH;
  const amount = 2 + Math.floor(Math.random() * 2); // 2–3
  return {
    id: makeId(),
    kind: 'stat',
    title: `+${amount} ${stat}`,
    description: `Permanently raise ${stat} by ${amount}.`,
    stat,
    statAmount: amount,
  };
}

function rollItemBoon(): CampaignBoon {
  const ids = Object.values(ComponentId).filter((id) => id !== ComponentId.HASHIRAMA_CELL);
  const componentId = pick(ids) ?? ComponentId.NINJA_STEEL;
  const def = COMPONENT_DEFINITIONS[componentId];
  const item: Item = {
    id: `boon-item-${makeId()}`,
    name: def.name,
    rarity: Rarity.COMMON,
    stats: { [def.primaryStat]: def.baseValue },
    value: def.baseValue * 15,
    description: `${def.description} (Interlude boon)`,
    isComponent: true,
    componentId,
    icon: def.icon,
  };
  return {
    id: makeId(),
    kind: 'item',
    title: item.name,
    description: `Gain a ${item.rarity} component: ${item.description}`,
    item,
  };
}

function rollSkillBoon(player: Player): CampaignBoon {
  const owned = new Set(player.skills.map((s) => s.id));
  const candidates = Object.values(SKILLS).filter((s) => !owned.has(s.id));
  const skill =
    pick(candidates.length > 0 ? candidates : Object.values(SKILLS)) ??
    SKILLS.BASIC_ATTACK;
  return {
    id: makeId(),
    kind: 'skill',
    title: skill.name,
    description: skill.description || `Learn ${skill.name}.`,
    skill: { ...skill, currentCooldown: 0 },
  };
}

/** Generate 3 distinct-kind boons (stat / item / skill) for interlude choice. */
export function generateInterludeBoons(player: Player): CampaignBoon[] {
  return [rollStatBoon(), rollItemBoon(), rollSkillBoon(player)];
}

/** Full heal to derived max HP/chakra. */
export function fullHealPlayer(player: Player): Player {
  const { derived } = getPlayerFullStats(player);
  return {
    ...player,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
  };
}

const STAT_KEY: Record<PrimaryStat, keyof Player['primaryStats']> = {
  [PrimaryStat.WILLPOWER]: 'willpower',
  [PrimaryStat.CHAKRA]: 'chakra',
  [PrimaryStat.STRENGTH]: 'strength',
  [PrimaryStat.SPIRIT]: 'spirit',
  [PrimaryStat.INTELLIGENCE]: 'intelligence',
  [PrimaryStat.CALMNESS]: 'calmness',
  [PrimaryStat.SPEED]: 'speed',
  [PrimaryStat.ACCURACY]: 'accuracy',
  [PrimaryStat.DEXTERITY]: 'dexterity',
};

/** Apply a chosen boon. */
export function applyCampaignBoon(player: Player, boon: CampaignBoon): Player {
  let next = { ...player };

  if (boon.kind === 'stat' && boon.stat && boon.statAmount) {
    const key = STAT_KEY[boon.stat];
    next = {
      ...next,
      primaryStats: {
        ...next.primaryStats,
        [key]: next.primaryStats[key] + boon.statAmount,
      },
    };
  }

  if (boon.kind === 'item' && boon.item) {
    const bag = [...next.bag];
    const empty = bag.findIndex((s) => s == null);
    if (empty >= 0) {
      bag[empty] = boon.item;
    } else {
      // Bag full: sell-value ryo consolation
      next = { ...next, ryo: next.ryo + (boon.item.value ?? 50) };
    }
    next = { ...next, bag };
  }

  if (boon.kind === 'skill' && boon.skill) {
    if (!next.skills.some((s) => s.id === boon.skill!.id)) {
      next = { ...next, skills: [...next.skills, { ...boon.skill, currentCooldown: 0 }] };
    }
  }

  return fullHealPlayer(next);
}

export interface RunSummary {
  clan: string;
  level: number;
  ryo: number;
  locationsCleared: number;
  regionsCompleted: number;
  regionName: string;
}
