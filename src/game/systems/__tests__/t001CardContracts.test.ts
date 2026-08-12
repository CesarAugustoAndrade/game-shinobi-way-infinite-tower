/**
 * T-001 AC tests: CardRole / Mode / Mark / SkillConfig contracts.
 * Role is authored, never inferred from damage.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatTrigger,
  Mark,
  MarkConsumeTiming,
  ModeDefinition,
  ModeEndKind,
  SkillConfig,
  SkillTag,
  TargetScope,
} from '../../types';
import {
  actionTypeForCardRole,
  defaultBaseWeight,
  ensureMainAttack,
  isHandPlayableRole,
  resolveCardRole,
  withAddedSkill,
} from '../CardContractSystem';
import { createMockSkill } from './testFixtures';

describe('T-001 taxonomy compile surface', () => {
  it('exports CardRole members SUPPORT | MODE | SIDE_ATTACK | ATTACK', () => {
    expect(CardRole.SUPPORT).toBe('SUPPORT');
    expect(CardRole.MODE).toBe('MODE');
    expect(CardRole.SIDE_ATTACK).toBe('SIDE_ATTACK');
    expect(CardRole.ATTACK).toBe('ATTACK');
    expect(Object.values(CardRole)).toEqual([
      CardRole.SUPPORT,
      CardRole.MODE,
      CardRole.SIDE_ATTACK,
      CardRole.ATTACK,
    ]);
  });

  it('exports TargetScope members MAIN_ATTACK | ATTACK | SIDE_ATTACK | OFFENSIVE_SKILL', () => {
    expect(TargetScope.MAIN_ATTACK).toBe('MAIN_ATTACK');
    expect(TargetScope.ATTACK).toBe('ATTACK');
    expect(TargetScope.SIDE_ATTACK).toBe('SIDE_ATTACK');
    expect(TargetScope.OFFENSIVE_SKILL).toBe('OFFENSIVE_SKILL');
  });

  it('accepts a ModeDefinition fixture with required SOUL fields', () => {
    const mode: ModeDefinition = {
      id: 'sage-mode',
      family: 'sage',
      stage: 1,
      maxCharges: 3,
      activationCost: { ap: 2, chakra: 10 },
      upkeep: { ap: 1, chakra: 4 },
      cooldown: 2,
      weightModifiers: [{ role: CardRole.ATTACK, delta: 1 }],
      enhancements: [{ targetScope: TargetScope.MAIN_ATTACK, note: 'Main hits harder' }],
      endClauses: [{ kind: ModeEndKind.ZERO_CHARGES }],
    };
    expect(mode.id).toBe('sage-mode');
    expect(mode.family).toBe('sage');
    expect(mode.maxCharges).toBe(3);
    expect(mode.activationCost.ap).toBe(2);
    expect(mode.upkeep.chakra).toBe(4);
    expect(mode.cooldown).toBe(2);
    expect(mode.weightModifiers).toHaveLength(1);
    expect(mode.enhancements[0].targetScope).toBe(TargetScope.MAIN_ATTACK);
    expect(mode.endClauses[0].kind).toBe(ModeEndKind.ZERO_CHARGES);
  });

  it('accepts a Mark fixture with required fields', () => {
    const mark: Mark = {
      id: 'curse-mark',
      sourceSkillId: 'curse-seal',
      owner: CombatActor.PLAYER,
      target: CombatActor.ENEMY,
      duration: 2,
      stacks: 1,
      trigger: CombatTrigger.ON_HIT,
      consume: MarkConsumeTiming.IMPACT,
    };
    expect(mark.sourceSkillId).toBe('curse-seal');
    expect(mark.owner).toBe(CombatActor.PLAYER);
    expect(mark.target).toBe(CombatActor.ENEMY);
    expect(mark.duration).toBe(2);
    expect(mark.stacks).toBe(1);
  });

  it('accepts a SkillConfig with mainAttackId and modeUpkeepPriority', () => {
    const config: SkillConfig = {
      mainAttackId: 'rasengan',
      modeUpkeepPriority: ['sage-mode', 'sharingan'],
    };
    expect(config.mainAttackId).toBe('rasengan');
    expect(config.modeUpkeepPriority).toEqual(['sage-mode', 'sharingan']);
  });

  it('covers required SkillTag contract members', () => {
    const required = [
      SkillTag.TOOL,
      SkillTag.WEAPON,
      SkillTag.TAIJUTSU,
      SkillTag.NINJUTSU,
      SkillTag.GENJUTSU,
      SkillTag.MODE,
      SkillTag.MARK,
      SkillTag.DISCOVER,
      SkillTag.MULTI_HIT,
      SkillTag.PASSIVE,
    ];
    for (const tag of required) {
      expect(typeof tag).toBe('string');
    }
  });
});

describe('T-001 cardRole not inferred from damage', () => {
  it('resolves the same authored role when only baseDamage differs', () => {
    const supportLow = createMockSkill({
      id: 'heal-low',
      cardRole: CardRole.SUPPORT,
      baseDamage: 1,
    });
    const supportHigh = createMockSkill({
      id: 'heal-high',
      cardRole: CardRole.SUPPORT,
      baseDamage: 99,
    });
    const lowRole = resolveCardRole(supportLow);
    const highRole = resolveCardRole(supportHigh);
    expect(lowRole).toEqual({ ok: true, role: CardRole.SUPPORT });
    expect(highRole).toEqual({ ok: true, role: CardRole.SUPPORT });
    expect(lowRole).toEqual(highRole);
  });

  it('does not infer ATTACK from high damage when cardRole is missing', () => {
    const low = createMockSkill({ id: 'scratch', baseDamage: 1 });
    const high = createMockSkill({ id: 'nuke', baseDamage: 200 });
    expect(low.cardRole).toBeUndefined();
    expect(high.cardRole).toBeUndefined();
    expect(resolveCardRole(low)).toEqual({ ok: false, reason: 'incomplete-authoring' });
    expect(resolveCardRole(high)).toEqual({ ok: false, reason: 'incomplete-authoring' });
  });

  it('accepts an explicit authoring map and still ignores damage', () => {
    const skill = createMockSkill({ id: 'kunai', baseDamage: 80 });
    expect(resolveCardRole(skill, { kunai: CardRole.SIDE_ATTACK })).toEqual({
      ok: true,
      role: CardRole.SIDE_ATTACK,
    });
    expect(resolveCardRole(skill)).toEqual({ ok: false, reason: 'incomplete-authoring' });
  });
});

describe('T-001 Main Attack invariants', () => {
  const attackA = createMockSkill({ id: 'rasengan', cardRole: CardRole.ATTACK });
  const attackB = createMockSkill({ id: 'chidori', cardRole: CardRole.ATTACK });
  const side = createMockSkill({ id: 'shuriken', cardRole: CardRole.SIDE_ATTACK });
  const emptyConfig = (): SkillConfig => ({ mainAttackId: null, modeUpkeepPriority: [] });

  it('assigns one ATTACK via injected rng and notified:true when Main is empty', () => {
    const config = emptyConfig();
    const result = ensureMainAttack(config, [attackA, side, attackB], () => 0.6);
    expect(result.notified).toBe(true);
    expect(result.config.mainAttackId).toBe('chidori');
    expect(result.config).not.toBe(config);
  });

  it('never leaves Main empty when an ATTACK exists', () => {
    const result = ensureMainAttack(
      { mainAttackId: '', modeUpkeepPriority: ['sage'] },
      [side, attackA],
      () => 0,
    );
    expect(result.config.mainAttackId).toBe('rasengan');
    expect(result.config.mainAttackId).not.toBe('');
    expect(result.config.mainAttackId).not.toBeNull();
    expect(result.notified).toBe(true);
  });

  it('keeps a valid Main and does not notify', () => {
    const config: SkillConfig = { mainAttackId: 'chidori', modeUpkeepPriority: [] };
    const result = ensureMainAttack(config, [attackA, attackB], () => 0);
    expect(result.notified).toBe(false);
    expect(result.config.mainAttackId).toBe('chidori');
  });

  it('reassigns and notifies when Main is not an ATTACK in the loadout', () => {
    const config: SkillConfig = { mainAttackId: 'shuriken', modeUpkeepPriority: [] };
    const result = ensureMainAttack(config, [side, attackA], () => 0);
    expect(result.notified).toBe(true);
    expect(result.config.mainAttackId).toBe('rasengan');
  });

  it('withAddedSkill does not change an already-set Main', () => {
    const config: SkillConfig = { mainAttackId: 'rasengan', modeUpkeepPriority: ['mode-a'] };
    const next = withAddedSkill(config, 'chidori');
    expect(next.mainAttackId).toBe('rasengan');
    expect(next).not.toBe(config);
    expect(next.modeUpkeepPriority).toEqual(['mode-a']);
    expect(next.modeUpkeepPriority).not.toBe(config.modeUpkeepPriority);
  });
});

describe('T-001 compat helpers', () => {
  it('defaultBaseWeight is 2', () => {
    expect(defaultBaseWeight()).toBe(2);
  });

  it('maps MODE to TOGGLE and other roles to ACTIVE', () => {
    expect(actionTypeForCardRole(CardRole.MODE)).toBe(ActionType.TOGGLE);
    expect(actionTypeForCardRole(CardRole.SUPPORT)).toBe(ActionType.ACTIVE);
    expect(actionTypeForCardRole(CardRole.SIDE_ATTACK)).toBe(ActionType.ACTIVE);
    expect(actionTypeForCardRole(CardRole.ATTACK)).toBe(ActionType.ACTIVE);
  });

  it('treats all CardRoles as hand-playable', () => {
    expect(isHandPlayableRole(CardRole.SUPPORT)).toBe(true);
    expect(isHandPlayableRole(CardRole.MODE)).toBe(true);
    expect(isHandPlayableRole(CardRole.SIDE_ATTACK)).toBe(true);
    expect(isHandPlayableRole(CardRole.ATTACK)).toBe(true);
  });
});
