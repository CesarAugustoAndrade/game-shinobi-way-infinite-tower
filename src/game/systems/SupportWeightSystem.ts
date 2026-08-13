/**
 * SupportWeightSystem — one-shot next-draw support bonuses (T-016).
 * SkillId path only. No React. No Math.random.
 */

export interface PendingSupportWeight {
  skillId: string;
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
): { bonuses: Readonly<Record<string, number>>; bag: PendingSupportWeight[] } {
  const bonuses: Record<string, number> = {};
  for (const entry of bag) {
    bonuses[entry.skillId] = (bonuses[entry.skillId] ?? 0) + entry.delta;
  }
  return { bonuses, bag: [] };
}

/**
 * Entries to enqueue after a successful play. Unknown ids yield [].
 * Does not mutate skill.baseWeight.
 */
export function applySupportWeightOnPlay(
  skill: { id: string },
  ctx: SupportWeightPlayContext = {},
): PendingSupportWeight[] {
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
