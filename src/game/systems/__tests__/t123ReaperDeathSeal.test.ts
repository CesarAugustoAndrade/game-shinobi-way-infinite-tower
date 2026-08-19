/**
 * T-123 AC: Reaper Death Seal ATTACK — AP6; enemy ≤35% HP; mutual KO; once/combat.
 *
 * Live useSkill already returns before Guts. Pure resolve zeros both HP.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, SkillTag } from '../../types';
import { SKILLS } from '../../constants/skills';
import { resolveCardRole } from '../CardContractSystem';
import { emptyModeBoard } from '../CombatModeSystem';
import { isSkillReadyOnTurn } from '../TurnClockSystem';
import { resolveSkill, type ResolveSkillState } from '../ResolveSkillSystem';

const seal = SKILLS.REAPER_DEATH_SEAL;
const MAX = 100;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [seal],
    playerBuffs: [],
    enemyHp: 35,
    enemyMaxHp: MAX,
    ...overrides,
  };
}

const hit = { rollHit: () => ({ hit: true, damage: 0 }) };

describe('T-123 authoring', () => {
  it('declares ATTACK AP6 CD99 mutualKo 35% gate, not AP2-only', () => {
    expect(seal.id).toBe('reaper_death_seal');
    expect(seal.cardRole).toBe(CardRole.ATTACK);
    expect(seal.apCost).toBe(6);
    expect(seal.apCost).not.toBe(2);
    expect(seal.chakraCost).toBe(0);
    expect(seal.hpCost).toBe(0);
    expect(seal.cooldown).toBe(99);
    expect(seal.mutualKo).toBe(true);
    expect(seal.mutualKoMaxHpFraction).toBe(0.35);
    expect(seal.modeInteraction).toBeUndefined();
    expect(seal.tags).toEqual(expect.arrayContaining([SkillTag.NINJUTSU, SkillTag.MENTAL]));
    expect(resolveCardRole(seal)).toEqual({ ok: true, role: CardRole.ATTACK });
  });
});

describe('T-123 gate', () => {
  it('rejects above 35% max HP and spends nothing', () => {
    const start = baseState({ enemyHp: 36 });
    const result = resolveSkill({ skill: seal }, start, hit);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('hp-threshold');
    expect(result.state.pools).toEqual(start.pools);
    expect(result.state.enemyHp).toBe(36);

    const close = resolveSkill(
      { skill: seal },
      baseState({ range: CombatRange.CLOSE, enemyHp: 36 }),
      hit,
    );
    expect(close.ok).toBe(false);
  });
});

describe('T-123 ko', () => {
  it('at ≤35% zeros both HP; second cast same encounter is not ready', () => {
    const result = resolveSkill({ skill: seal }, baseState(), hit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.enemyHp).toBe(0);
    expect(result.state.pools.hp).toBe(0);
    expect(result.state.pools.ap).toBe(2);
    expect(result.damageDealt).toBe(35);

    const used = result.state.skills.find((s) => s.id === seal.id);
    expect(isSkillReadyOnTurn(used?.readyOnTurn, 2)).toBe(false);

    const again = resolveSkill(
      { skill: used ?? seal },
      {
        ...result.state,
        pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
        enemyHp: 35,
      },
      hit,
    );
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.reason).toBe('not-ready');

    const atCap = resolveSkill({ skill: seal }, baseState({ enemyHp: 35 }), hit);
    expect(atCap.ok).toBe(true);
    const long = resolveSkill(
      { skill: seal },
      baseState({ range: CombatRange.LONG, enemyHp: 20 }),
      hit,
    );
    expect(long.ok).toBe(true);
    if (!long.ok) return;
    expect(long.state.enemyHp).toBe(0);
    expect(long.state.pools.hp).toBe(0);
  });
});
