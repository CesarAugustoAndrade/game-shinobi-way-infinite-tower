/**
 * T-049 AC: Kunai Throw — SIDE 7 MEDIUM/LONG; TOOL weight +1 on hit.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatRange,
  Posture,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { effectiveWeight } from '../DeckSystem';
import { consumeSupportWeightBonuses } from '../SupportWeightSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const thrown = SKILLS.KUNAI_THROW;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [thrown],
    playerBuffs: [],
    enemyHp: 80,
    pendingSupportWeights: [],
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: thrown.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

const tool = createMockSkill({
  id: 'tool_chip',
  cardRole: CardRole.SIDE_ATTACK,
  actionType: ActionType.ACTIVE,
  tags: [SkillTag.TOOL],
  currentCooldown: 0,
});
const nonTool = createMockSkill({
  id: 'smash',
  cardRole: CardRole.ATTACK,
  actionType: ActionType.ACTIVE,
  tags: [SkillTag.TAIJUTSU],
  currentCooldown: 0,
});

describe('T-049 authoring', () => {
  it('declares SIDE AP1 CD1 7 at MEDIUM/LONG + TOOL +1', () => {
    expect(thrown.cardRole).toBe(CardRole.SIDE_ATTACK);
    expect(thrown.apCost).toBe(1);
    expect(thrown.chakraCost).toBe(0);
    expect(thrown.cooldown).toBe(1);
    expect(thrown.baseDamage).toBe(7);
    expect(thrown.allowedRanges).toEqual([CombatRange.MEDIUM, CombatRange.LONG]);
    expect(thrown.allowedRanges).not.toContain(CombatRange.CLOSE);
    expect(thrown.tags).toEqual(expect.arrayContaining([SkillTag.TOOL, SkillTag.WEAPON]));
    expect(thrown.nextDrawTagBonus).toEqual({ tag: SkillTag.TOOL, delta: 1 });
  });
});

describe('T-049 hit weight', () => {
  it('deals 7 at MEDIUM and enqueues TOOL +1', () => {
    const result = resolveSkill({ skill: thrown }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damageDealt).toBe(7);
    const first = consumeSupportWeightBonuses(result.state.pendingSupportWeights ?? []);
    expect(first.tagBonuses[SkillTag.TOOL]).toBe(1);

    const close = resolveSkill({ skill: thrown }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(false);
  });
});

describe('T-049 effectiveWeight', () => {
  it('boosts TOOL +1 once; miss enqueues nothing; non-TOOL unchanged', () => {
    const landed = resolveSkill({ skill: thrown }, baseState(), hit);
    expect(landed.ok).toBe(true);
    if (!landed.ok) return;
    const first = consumeSupportWeightBonuses(landed.state.pendingSupportWeights ?? []);
    const ctx = { posture: Posture.BALANCED };
    const toolBase = effectiveWeight(tool, { ...ctx, supportTagBonuses: {} });
    const toolBoost = effectiveWeight(tool, { ...ctx, supportTagBonuses: first.tagBonuses });
    expect(toolBoost).toBe(toolBase + 1);
    expect(effectiveWeight(nonTool, { ...ctx, supportTagBonuses: first.tagBonuses })).toBe(
      effectiveWeight(nonTool, { ...ctx, supportTagBonuses: {} }),
    );
    const second = consumeSupportWeightBonuses(first.bag);
    expect(second.tagBonuses[SkillTag.TOOL]).toBeUndefined();

    const whiff = resolveSkill({ skill: thrown }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    const empty = consumeSupportWeightBonuses(whiff.state.pendingSupportWeights ?? []);
    expect(empty.tagBonuses[SkillTag.TOOL]).toBeUndefined();
  });
});
