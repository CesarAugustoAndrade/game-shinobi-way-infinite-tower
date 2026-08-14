/**
 * T-047 AC: Analyze — Discover 3 ATTACK∩Main tags + Studied 2 (20% pen).
 *
 * Filter: cardRole ATTACK and ≥1 shared tag with Main. No widen if Main untagged.
 * Studied duration 2, no consume; only the chosen skill id gets pen.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  Posture,
  PrimaryStat,
  SkillTag,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  commitDiscoverChoice,
  resolveSkill,
  type ResolveSkillState,
} from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const analyze = SKILLS.ANALYZE;

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 3,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

const main = createMockSkill({
  id: 'main_fire',
  cardRole: CardRole.ATTACK,
  tags: [SkillTag.FIRE],
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  currentCooldown: 0,
});

const fireAtk = createMockSkill({
  id: 'fire_atk',
  cardRole: CardRole.ATTACK,
  tags: [SkillTag.FIRE],
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  currentCooldown: 0,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const fireAtk2 = createMockSkill({
  id: 'fire_atk_2',
  cardRole: CardRole.ATTACK,
  tags: [SkillTag.FIRE],
  apCost: 1,
  chakraCost: 0,
  baseDamage: 8,
  currentCooldown: 0,
});

const waterAtk = createMockSkill({
  id: 'water_atk',
  cardRole: CardRole.ATTACK,
  tags: [SkillTag.WATER],
  apCost: 1,
  chakraCost: 0,
  baseDamage: 10,
  currentCooldown: 0,
  allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
});

const sideFire = createMockSkill({
  id: 'side_fire',
  cardRole: CardRole.SIDE_ATTACK,
  tags: [SkillTag.FIRE],
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 6,
  currentCooldown: 0,
});

const supportFire = createMockSkill({
  id: 'support_fire',
  cardRole: CardRole.SUPPORT,
  tags: [SkillTag.FIRE],
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 0,
  currentCooldown: 0,
});

describe('T-047 authoring', () => {
  it('declares SUPPORT Discover 3 Main-tag ATTACK and drops STR +0.15×3', () => {
    expect(analyze.cardRole).toBe(CardRole.SUPPORT);
    expect(analyze.apCost).toBe(1);
    expect(analyze.chakraCost).toBe(0);
    expect(analyze.cooldown).toBe(5);
    expect(analyze.hpCost).toBe(0);
    expect(analyze.baseDamage).toBe(0);
    expect(analyze.discover).toEqual({ count: 3, matchMainAttackTags: true });
    expect(
      analyze.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.15,
      ),
    ).toBeFalsy();
  });
});

describe('T-047 filter', () => {
  it('offers only ATTACK that share a tag with Main', () => {
    const pool = [analyze, main, fireAtk, fireAtk2, waterAtk, sideFire, supportFire];
    const result = resolveSkill(
      { skill: analyze, weightContext: { posture: Posture.BALANCED, mainAttackId: 'main_fire' } },
      baseState({
        hand: [analyze, main],
        playablePool: pool,
        skills: pool,
      }),
      { rng: () => 0 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = (result.pendingDiscover?.candidates ?? []).map((c) => c.skill.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id === 'fire_atk' || id === 'fire_atk_2')).toBe(true);
    expect(ids).not.toContain('water_atk');
    expect(ids).not.toContain('side_fire');
    expect(ids).not.toContain('support_fire');
  });
});

describe('T-047 studied', () => {
  it('plants Studied 2 on commit and applies 20% pen only to the chosen ATTACK', () => {
    const pool = [analyze, main, fireAtk, fireAtk2, waterAtk];
    const offered = resolveSkill(
      { skill: analyze, weightContext: { posture: Posture.BALANCED, mainAttackId: 'main_fire' } },
      baseState({
        hand: [analyze, main],
        playablePool: pool,
        skills: pool,
      }),
      { rng: () => 0 },
    );
    expect(offered.ok).toBe(true);
    if (!offered.ok) return;
    const pick = offered.pendingDiscover?.candidates.find((c) => c.skill.id === 'fire_atk');
    expect(pick).toBeDefined();
    const committed = commitDiscoverChoice(offered.state, 'fire_atk');
    expect(committed.refused).toBe(false);
    const studied = committed.state.marks.find((m) => m.id === 'studied');
    expect(studied?.duration).toBe(2);
    expect(studied?.target).toBe(CombatActor.PLAYER);
    expect(studied?.boundSkillId).toBe('fire_atk');

    const hit = { rollHit: () => ({ hit: true, damage: 10 }) };
    const armed = resolveSkill(
      { skill: fireAtk },
      { ...committed.state, skills: [fireAtk], enemyDefensePercent: 0.5, enemyHp: 50 },
      hit,
    );
    const clean = resolveSkill(
      { skill: fireAtk },
      baseState({ skills: [fireAtk], enemyDefensePercent: 0.5 }),
      hit,
    );
    expect(armed.ok).toBe(true);
    expect(clean.ok).toBe(true);
    if (!armed.ok || !clean.ok) return;
    expect(clean.damageDealt).toBe(5);
    expect(armed.damageDealt).toBe(6);
    expect(armed.state.marks.find((m) => m.id === 'studied')?.duration).toBe(2);

    const other = resolveSkill(
      { skill: waterAtk },
      { ...committed.state, skills: [waterAtk], enemyDefensePercent: 0.5, enemyHp: 50 },
      hit,
    );
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    expect(other.damageDealt).toBe(5);
  });
});
