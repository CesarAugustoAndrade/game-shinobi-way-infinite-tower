/**
 * T-120 AC: Kamui Impact ATTACK — 27 ANY; 50% pen; Spatial Tear 2 → next ATTACK +20%.
 *
 * Tear plants on resolve (hit or miss). SIDE does not consume.
 */

import { describe, it, expect } from 'vitest';
import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageType,
  EffectType,
  MarkConsumeTiming,
  MarkFamily,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const kamui = SKILLS.KAMUI_IMPACT;
const strike = SKILLS.BASIC_ATTACK;
const slash = SKILLS.KUNAI_SLASH;
const DEF = 0.4;
/** floor(27 * (1 - 0.4 * (1 - 0.5))) = floor(27 * 0.8) = 21 */
const PEN_DMG = Math.floor(27 * (1 - DEF * (1 - 0.5)));
/** floor(27 * (1 - 0.4)) = 16 */
const NO_PEN_DMG = Math.floor(27 * (1 - DEF));

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kamui],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: kamui.baseDamage }) };
const miss = { rollHit: () => ({ hit: false, damage: 0 }) };

describe('T-120 authoring', () => {
  it('declares ATTACK AP5 CP11 CD4 27 ANY 50% pen + Spatial Tear, not TRUE+SPD', () => {
    expect(kamui.id).toBe('kamui_impact');
    expect(kamui.cardRole).toBe(CardRole.ATTACK);
    expect(kamui.apCost).toBe(5);
    expect(kamui.chakraCost).toBe(11);
    expect(kamui.hpCost).toBe(0);
    expect(kamui.cooldown).toBe(4);
    expect(kamui.baseDamage).toBe(27);
    expect(kamui.damageType).toBe(DamageType.PHYSICAL);
    expect(kamui.damageType).not.toBe(DamageType.TRUE);
    expect(kamui.penetration).toBe(0.5);
    expect(kamui.modeInteraction).toBeUndefined();
    expect(kamui.allowedRanges).toBeUndefined();
    expect(kamui.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.UCHIHA]));
    expect(kamui.markEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spatial_tear',
          duration: 2,
          stacks: 1,
          consume: MarkConsumeTiming.ATTEMPT,
          family: MarkFamily.STAT,
          targetActor: 'self',
        }),
      ]),
    );
    expect(
      kamui.effects?.some(
        (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.SPEED,
      ),
    ).toBeFalsy();
    expect(resolveCardRole(kamui)).toEqual({ ok: true, role: CardRole.ATTACK });
  });
});

describe('T-120 hit pen', () => {
  it('deals 27 at any band and 50% pen beats zero-pen without TRUE strip', () => {
    const mid = resolveSkill({ skill: kamui }, baseState(), hit);
    expect(mid.ok).toBe(true);
    if (!mid.ok) return;
    expect(mid.hitsLanded).toBe(1);
    expect(mid.damageDealt).toBe(27);
    expect(mid.state.pools.ap).toBe(3);
    expect(mid.state.pools.chakra).toBe(9);

    const close = resolveSkill({ skill: kamui }, baseState({ range: CombatRange.CLOSE }), hit);
    expect(close.ok).toBe(true);
    const long = resolveSkill({ skill: kamui }, baseState({ range: CombatRange.LONG }), hit);
    expect(long.ok).toBe(true);

    const armed = resolveSkill({ skill: kamui }, baseState({ enemyDefensePercent: DEF }), hit);
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.damageDealt).toBe(PEN_DMG);

    const bare = resolveSkill(
      { skill: { ...kamui, penetration: 0 } },
      baseState({ enemyDefensePercent: DEF }),
      hit,
    );
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    expect(bare.damageDealt).toBe(NO_PEN_DMG);
    expect(armed.damageDealt).toBeGreaterThan(bare.damageDealt);
    expect(armed.damageDealt).toBeLessThan(27);
  });
});

describe('T-120 tear', () => {
  it('plants Tear on resolve (miss too); next ATTACK +20% and consumes; SIDE does not', () => {
    const planted = resolveSkill({ skill: kamui }, baseState(), hit);
    expect(planted.ok).toBe(true);
    if (!planted.ok) return;
    const tear = planted.state.marks.find((m) => m.id === 'spatial_tear');
    expect(tear?.duration).toBe(2);
    expect(tear?.stacks).toBe(1);
    expect(tear?.target).toBe(CombatActor.PLAYER);
    expect(tear?.consume).toBe(MarkConsumeTiming.ATTEMPT);

    const whiff = resolveSkill({ skill: kamui }, baseState(), miss);
    expect(whiff.ok).toBe(true);
    if (!whiff.ok) return;
    expect(whiff.damageDealt).toBe(0);
    expect(whiff.state.marks.some((m) => m.id === 'spatial_tear')).toBe(true);
    expect(whiff.state.pools.ap).toBe(3);

    const side = resolveSkill(
      { skill: slash },
      { ...planted.state, range: CombatRange.CLOSE, skills: [slash] },
      { rollHit: () => ({ hit: true, damage: slash.baseDamage }) },
    );
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.state.marks.some((m) => m.id === 'spatial_tear')).toBe(true);

    const boosted = resolveSkill(
      { skill: strike },
      { ...side.state, range: CombatRange.CLOSE, skills: [strike] },
      { rollHit: () => ({ hit: true, damage: strike.baseDamage }) },
    );
    expect(boosted.ok).toBe(true);
    if (!boosted.ok) return;
    expect(boosted.damageDealt).toBe(Math.floor(strike.baseDamage * 1.2));
    expect(boosted.state.marks.find((m) => m.id === 'spatial_tear')).toBeUndefined();

    const bare = resolveSkill(
      { skill: strike },
      baseState({ range: CombatRange.CLOSE, skills: [strike] }),
      { rollHit: () => ({ hit: true, damage: strike.baseDamage }) },
    );
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    expect(bare.damageDealt).toBe(strike.baseDamage);
  });
});
