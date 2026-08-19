/**
 * T-119 AC: Bone Drill ATTACK — 18 C/M; 25% phys pen; HP 10; not TRUE.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, DamageType, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const drill = SKILLS.BONE_DRILL;
const DEF = 0.4;
/** floor(18 * (1 - 0.4 * (1 - 0.25))) = floor(18 * 0.7) = 12 */
const PEN_DMG = Math.floor(18 * (1 - DEF * (1 - 0.25)));
/** floor(18 * (1 - 0.4)) = 10 */
const NO_PEN_DMG = Math.floor(18 * (1 - DEF));

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [drill],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: drill.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-119 authoring', () => {
  it('declares ATTACK AP3 HP10 CD3 18 CLOSE·MEDIUM 25% pen and not TRUE', () => {
    expect(drill.id).toBe('bone_drill');
    expect(drill.cardRole).toBe(CardRole.ATTACK);
    expect(drill.apCost).toBe(3);
    expect(drill.chakraCost).toBe(0);
    expect(drill.hpCost).toBe(10);
    expect(drill.cooldown).toBe(3);
    expect(drill.baseDamage).toBe(18);
    expect(drill.baseDamage).not.toBe(15);
    expect(drill.allowedRanges).toEqual(
      expect.arrayContaining([CombatRange.CLOSE, CombatRange.MEDIUM]),
    );
    expect(drill.allowedRanges).not.toContain(CombatRange.LONG);
    expect(drill.damageType).toBe(DamageType.PHYSICAL);
    expect(drill.damageType).not.toBe(DamageType.TRUE);
    expect(drill.penetration).toBe(0.25);
    expect(drill.modeInteraction).toBeUndefined();
    expect(drill.tags).toEqual(expect.arrayContaining([SkillTag.TAIJUTSU, SkillTag.PHYSICAL]));
    expect(resolveCardRole(drill)).toEqual({ ok: true, role: CardRole.ATTACK });
  });
});

describe('T-119 hit', () => {
  it('from CLOSE deals 18 with no enemy % defense and pays AP3/HP10', () => {
    const result = resolveSkill({ skill: drill }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(result.damageDealt).toBe(18);
    expect(result.state.pools.ap).toBe(3);
    expect(result.state.pools.hp).toBe(30);

    const mid = resolveSkill({ skill: drill }, baseState({ range: CombatRange.MEDIUM }), hit);
    expect(mid.ok).toBe(true);
    if (!mid.ok) return;
    expect(mid.damageDealt).toBe(18);

    const long = resolveSkill({ skill: drill }, baseState({ range: CombatRange.LONG }), hit);
    expect(long.ok).toBe(false);

    const whiff = resolveSkill({ skill: drill }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.pools.hp).toBe(30);
  });
});

describe('T-119 pen', () => {
  it('beats zero-pen against % defense and is not TRUE full-ignore', () => {
    const armed = resolveSkill(
      { skill: drill },
      baseState({ enemyDefensePercent: DEF }),
      hit,
    );
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(PEN_DMG);

    const bare = resolveSkill(
      { skill: { ...drill, penetration: 0 } },
      baseState({ enemyDefensePercent: DEF }),
      hit,
    );
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    expect(bare.damageDealt).toBe(NO_PEN_DMG);
    expect(armed.damageDealt).toBeGreaterThan(bare.damageDealt);
    expect(armed.damageDealt).toBeLessThan(18);
    expect(armed.damageDealt).not.toBe(18);
  });
});
