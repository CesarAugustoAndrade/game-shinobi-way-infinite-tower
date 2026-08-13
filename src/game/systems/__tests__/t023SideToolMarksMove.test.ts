/**
 * T-023 AC: SIDE tools plant marks, next-card % from attempt marks, skill band move.
 *
 * Mark mults are floor on total: Off-Balance ×1.20; Exposed ×1.15 if RANGED.
 */

import { describe, it, expect } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatActor,
  CombatRange,
  MarkConsumeTiming,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const wire = SKILLS.WIRE_KUNAI_REEL;
const blastback = SKILLS.EXPLOSIVE_KUNAI_BLASTBACK;
const backstep = SKILLS.BACKSTEP_SHURIKEN;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  };
}

const attemptMark = (id: string) => ({
  id,
  sourceSkillId: 'setup',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 1,
  stacks: 1,
  consume: MarkConsumeTiming.ATTEMPT,
});

const hit = (skill: { baseDamage: number }) => ({
  rollHit: () => ({ hit: true, damage: skill.baseDamage }),
});
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

const nextAttack = createMockSkill({
  id: 'next_attack',
  cardRole: CardRole.ATTACK,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.MELEE,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const nextRanged = createMockSkill({
  id: 'next_ranged',
  cardRole: CardRole.ATTACK,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  hitCount: 1,
  attackMethod: AttackMethod.RANGED,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

describe('T-023 wire mark pull', () => {
  it('plants off_balance and PULLs one band without spending voluntary move', () => {
    const result = resolveSkill({ skill: wire }, baseState({ range: CombatRange.MEDIUM }), hit(wire));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.marks.some((m) => m.id === 'off_balance')).toBe(true);
    expect(result.state.range).toBe(CombatRange.CLOSE);
    expect(result.state.playerMoveUsedThisTurn).toBe(false);
  });
});

describe('T-023 off-balance mult', () => {
  it('deals 120% then consumes the mark even on a full miss', () => {
    const armed = baseState({ marks: [attemptMark('off_balance')] });
    const boosted = resolveSkill({ skill: nextAttack }, armed, hit(nextAttack));
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(Math.floor(10 * 1.2));
    expect(boosted.state.marks.find((m) => m.id === 'off_balance')).toBeUndefined();

    const missed = resolveSkill(
      { skill: nextAttack },
      baseState({ marks: [attemptMark('off_balance')] }),
      miss,
    );
    expect(missed.ok).toBe(true);
    if (!missed.ok) return;
    expect(missed.damageDealt).toBe(0);
    expect(missed.state.marks.find((m) => m.id === 'off_balance')).toBeUndefined();
  });
});

describe('T-023 exposed push backstep', () => {
  it('boosts only ranged, PUSHes Blastback, and backsteps without voluntary spend', () => {
    const exposed = [attemptMark('exposed')];
    const ranged = resolveSkill({ skill: nextRanged }, baseState({ marks: exposed }), hit(nextRanged));
    expect(ranged.ok).toBe(true);
    if (!ranged.ok) return;
    expect(ranged.damageDealt).toBe(Math.floor(10 * 1.15));

    const melee = resolveSkill({ skill: nextAttack }, baseState({ marks: exposed }), hit(nextAttack));
    expect(melee.ok).toBe(true);
    if (!melee.ok) return;
    expect(melee.damageDealt).toBe(10);

    const push = resolveSkill(
      { skill: blastback },
      baseState({ range: CombatRange.CLOSE }),
      hit(blastback),
    );
    expect(push.ok).toBe(true);
    if (!push.ok) return;
    expect(push.state.range).toBe(CombatRange.MEDIUM);
    expect(push.state.marks.some((m) => m.id === 'exposed')).toBe(true);

    const step = resolveSkill(
      { skill: backstep },
      baseState({ range: CombatRange.CLOSE, playerMoveUsedThisTurn: false }),
      hit(backstep),
    );
    expect(step.ok).toBe(true);
    if (!step.ok) return;
    expect(step.state.range).toBe(CombatRange.MEDIUM);
    expect(step.state.playerMoveUsedThisTurn).toBe(false);
  });
});
