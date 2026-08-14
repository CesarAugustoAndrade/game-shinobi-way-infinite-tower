/**
 * SupportWeightSystem — one-shot next-draw support bonuses (T-016 / T-038).
 * SkillId and optional cardRole entries. No React. No Math.random.
 */

import { CardRole } from '../types';

export interface PendingSupportWeight {
  skillId?: string;
  role?: CardRole;
  /** T-041: one-shot MENTAL ATTACK weight. */
  kind?: 'mental-attack';
  delta: number;
}

export const CHAKRA_CONTROL_DRILL_ID = 'chakra_control_drill';
export const GATE_PREP_ID = 'gate_prep';
export const GATE_PREP_TARGET_IDS = ['gate_of_life', 'gate_of_limit'] as const;

export interface SupportWeightPlayContext {
  mainAttackId?: string | null;
}

export function enqueueSupportWeightBonuses(
  bag: readonly PendingSupportWeight[],
  entries: readonly PendingSupportWeight[],
): PendingSupportWeight[] {
  return [...bag, ...entries];
}

export function consumeSupportWeightBonuses(
  bag: readonly PendingSupportWeight[],
): {
  bonuses: Readonly<Record<string, number>>;
  roleBonuses: Readonly<Partial<Record<CardRole, number>>>;
  mentalAttackBonus: number;
  bag: PendingSupportWeight[];
} {
  const bonuses: Record<string, number> = {};
  const roleBonuses: Partial<Record<CardRole, number>> = {};
  let mentalAttackBonus = 0;
  for (const entry of bag) {
    if (entry.skillId) {
      bonuses[entry.skillId] = (bonuses[entry.skillId] ?? 0) + entry.delta;
    }
    if (entry.role) {
      roleBonuses[entry.role] = (roleBonuses[entry.role] ?? 0) + entry.delta;
    }
    if (entry.kind === 'mental-attack') {
      mentalAttackBonus += entry.delta;
    }
  }
  return { bonuses, roleBonuses, mentalAttackBonus, bag: [] };
}

/**
 * Entries to enqueue after a successful play. Unknown ids yield [].
 * Does not mutate skill.baseWeight.
 */
export function applySupportWeightOnPlay(
  skill: {
    id: string;
    nextDrawRoleBonus?: { role: CardRole; delta: number };
    nextDrawMentalAttackBonus?: number;
    nextDrawSkillBonuses?: { skillId: string; delta: number }[];
  },
  ctx: SupportWeightPlayContext = {},
): PendingSupportWeight[] {
  if (skill.nextDrawSkillBonuses?.length) {
    return skill.nextDrawSkillBonuses.map((entry) => ({
      skillId: entry.skillId,
      delta: entry.delta,
    }));
  }
  if (skill.nextDrawMentalAttackBonus) {
    return [{ kind: 'mental-attack', delta: skill.nextDrawMentalAttackBonus }];
  }
  if (skill.nextDrawRoleBonus) {
    return [{ role: skill.nextDrawRoleBonus.role, delta: skill.nextDrawRoleBonus.delta }];
  }
  if (skill.id === CHAKRA_CONTROL_DRILL_ID) {
    const main = ctx.mainAttackId;
    if (!main) return [];
    return [{ skillId: main, delta: 2 }];
  }
  if (skill.id === GATE_PREP_ID) {
    return GATE_PREP_TARGET_IDS.map((id) => ({ skillId: id, delta: 3 }));
  }
  return [];
}
