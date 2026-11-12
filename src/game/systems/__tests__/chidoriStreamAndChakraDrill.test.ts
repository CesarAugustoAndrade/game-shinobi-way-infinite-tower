import { describe, expect, it } from 'vitest';
import { SKILLS } from '../../constants/skills';
import { CombatRange, EffectType } from '../../types';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 10, chakra: 20, hp: 100, maxHp: 100 },
    range: CombatRange.CLOSE,
    turnIndex: 1,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 200,
    enemyMaxHp: 200,
    ...overrides,
  };
}

describe('chidori_stream impactStun', () => {
  const skill = SKILLS.CHIDORI_STREAM;

  it('authors impactStun 60%×1 and has no mute effects[] STUN', () => {
    expect(skill.impactStun).toEqual({ chance: 0.6, duration: 1 });
    expect(skill.effects ?? []).toEqual([]);
  });

  it('applies enemy Stun when rng succeeds on a hit', () => {
    const result = resolveSkill(
      { skill },
      baseState(),
      {
        rng: () => 0.01,
        rollHit: () => ({ hit: true, isCrit: false, damage: 8 }),
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBeGreaterThanOrEqual(1);
    expect((result.state.enemyBuffs ?? []).some((b) => b.effect?.type === EffectType.STUN)).toBe(true);
  });
});

describe('chakra_control_drill CP grant', () => {
  const skill = SKILLS.CHAKRA_CONTROL_DRILL;

  it('restores +4 CP on resolve (no mute effects[] regen)', () => {
    expect(skill.effects ?? []).toEqual([]);
    const result = resolveSkill(
      { skill },
      baseState({
        pools: { ap: 5, chakra: 10, hp: 100, maxHp: 100 },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.pools.chakra).toBe(10 - (skill.chakraCost ?? 0) + 4);
  });
});
