/**
 * T-011 AC: seven Mode skills reauthored to SOUL §8 packaging.
 */

import { describe, it, expect } from 'vitest';
import { ActionType, CardRole, EffectType, PrimaryStat } from '../../types';
import { resolveSkillById } from '../index';
import { getModeDefinition } from '../modes';
import {
  SOUL_MODE_SKILL_REAUTHOR,
  T011_MODE_SKILL_IDS,
} from '../modeSkillReauthor';

const byId = (id: string) => {
  const skill = resolveSkillById(id);
  if (!skill) throw new Error(`missing skill ${id}`);
  return skill;
};

const PERCENT_MODE_STATS = new Set<PrimaryStat>([
  PrimaryStat.SPEED,
  PrimaryStat.DEXTERITY,
  PrimaryStat.STRENGTH,
]);

describe('T-011 mode costs', () => {
  it('authors seven MODE rows with SOUL §8 AP / activation / upkeep / charges / CD', () => {
    expect(T011_MODE_SKILL_IDS).toHaveLength(7);
    expect(SOUL_MODE_SKILL_REAUTHOR).toHaveLength(7);

    for (const row of SOUL_MODE_SKILL_REAUTHOR) {
      const skill = byId(row.id);
      expect(skill.cardRole).toBe(CardRole.MODE);
      expect(skill.actionType).toBe(ActionType.TOGGLE);
      expect(skill.apCost).toBe(row.ap);
      expect(skill.chakraCost).toBe(row.activationChakra);
      expect(skill.hpCost).toBe(row.activationHp);
      expect(skill.upkeepCost).toBe(row.upkeep);
      expect(skill.cooldown).toBe(row.cooldown);
      expect(skill.baseWeight).toBe(2);

      const def = getModeDefinition(row.id);
      expect(def).toBeDefined();
      expect(def?.maxCharges).toBe(row.maxCharges);
      expect(def?.activationCost.ap).toBe(row.ap);
      expect(def?.activationCost.chakra ?? 0).toBe(row.activationChakra);
      expect(def?.activationCost.hp ?? 0).toBe(row.activationHp);
      expect((def?.upkeep.chakra ?? def?.upkeep.hp) ?? 0).toBe(row.upkeep);
    }
  });
});

describe('T-011 no percent mode buffs', () => {
  it('removes SPEED/DEX/STR percent BUFF bodies from the seven Mode skills', () => {
    const sharingan = byId('sharingan_2');
    const clone = byId('shadow_clone');
    expect(sharingan.effects ?? []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3 }),
        expect.objectContaining({ type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.25 }),
      ]),
    );
    expect(clone.effects ?? []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.6 }),
        expect.objectContaining({ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.4 }),
      ]),
    );

    for (const id of T011_MODE_SKILL_IDS) {
      const percentBuffs = (byId(id).effects ?? []).filter(
        (effect) =>
          effect.type === EffectType.BUFF &&
          effect.targetStat != null &&
          PERCENT_MODE_STATS.has(effect.targetStat) &&
          typeof effect.value === 'number' &&
          effect.value > 0 &&
          effect.value <= 2,
      );
      expect(percentBuffs).toEqual([]);
    }
  });
});

describe('T-011 mode links', () => {
  it('links each of the seven to a T-005 ModeDefinition and leaves sharingan_3 untouched', () => {
    for (const row of SOUL_MODE_SKILL_REAUTHOR) {
      const skill = byId(row.id);
      expect(skill.modeInteraction?.modeId).toBe(row.id);
      expect(skill.modeInteraction?.family).toBe(row.family);
      expect(getModeDefinition(skill.modeInteraction?.modeId ?? '')?.id).toBe(row.id);
    }

    const three = byId('sharingan_3');
    expect(three.cardRole).toBe(CardRole.MODE);
    expect(three.apCost).toBe(3);
    expect(three.chakraCost).toBe(6);
    expect(three.upkeepCost).toBe(6);
    expect(three.cooldown).toBe(5);
    expect(three.modeInteraction?.modeId).toBe('sharingan_3');
    expect(T011_MODE_SKILL_IDS).not.toContain('sharingan_3');
  });
});
