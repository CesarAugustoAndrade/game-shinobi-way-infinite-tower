/**
 * T-008 AC tests: 12 SOUL v1 techniques — presence, roles/costs, distribution.
 */

import { describe, it, expect } from 'vitest';
import { ActionType, CardRole, Clan, SkillTier } from '../../types';
import { SKILLS, SKILLS_CLASSIC_COUNT } from '../skills';
import {
  getClanStartingSkills,
  resolveSkillById,
} from '../index';
import {
  SKILLS_COMBAT_V1_NEW,
  V1_CLAN_SKILL_IDS,
  V1_NEW_TECHNIQUE_IDS,
  V1_NEW_TECHNIQUE_NAMES,
  V1_UNIVERSAL_SKILL_IDS,
} from '../skillsCombatV1New';

const byId = (id: string) => {
  const skill = resolveSkillById(id);
  if (!skill) throw new Error(`missing skill ${id}`);
  return skill;
};

describe('T-008 twelve present', () => {
  it('adds exactly 12 new ids and grows the playable catalog by 12', () => {
    expect(V1_NEW_TECHNIQUE_IDS).toHaveLength(12);
    expect(new Set(V1_NEW_TECHNIQUE_IDS).size).toBe(12);
    expect(Object.keys(SKILLS_COMBAT_V1_NEW)).toHaveLength(12);
    expect(SKILLS_CLASSIC_COUNT).toBe(116);
    expect(Object.keys(SKILLS).length).toBe(SKILLS_CLASSIC_COUNT + 12);

    for (const id of V1_NEW_TECHNIQUE_IDS) {
      expect(resolveSkillById(id)?.id).toBe(id);
    }
    for (const name of V1_NEW_TECHNIQUE_NAMES) {
      expect(Object.values(SKILLS).some((skill) => skill.name === name)).toBe(true);
    }
  });
});

describe('T-008 roles costs', () => {
  it('authors SOUL §12 cardRole and AP/CD/CP/HP', () => {
    const table: Array<{
      id: string;
      role: CardRole;
      ap: number;
      cd: number;
      chakra: number;
      hp: number;
      action: ActionType;
    }> = [
      { id: 'tactical_scroll_rehearsal', role: CardRole.SUPPORT, ap: 1, cd: 5, chakra: 0, hp: 0, action: ActionType.ACTIVE },
      { id: 'chakra_control_drill', role: CardRole.SUPPORT, ap: 1, cd: 3, chakra: 0, hp: 0, action: ActionType.ACTIVE },
      { id: 'wire_kunai_reel', role: CardRole.SIDE_ATTACK, ap: 1, cd: 2, chakra: 0, hp: 0, action: ActionType.ACTIVE },
      { id: 'explosive_kunai_blastback', role: CardRole.SIDE_ATTACK, ap: 1, cd: 3, chakra: 1, hp: 0, action: ActionType.ACTIVE },
      { id: 'backstep_shuriken', role: CardRole.SIDE_ATTACK, ap: 1, cd: 2, chakra: 0, hp: 0, action: ActionType.ACTIVE },
      { id: 'sealing_tag_chakra_lock', role: CardRole.SUPPORT, ap: 2, cd: 6, chakra: 4, hp: 0, action: ActionType.ACTIVE },
      { id: 'tripwire_perimeter', role: CardRole.SUPPORT, ap: 1, cd: 4, chakra: 0, hp: 0, action: ActionType.ACTIVE },
      { id: 'sharingan_3', role: CardRole.MODE, ap: 3, cd: 5, chakra: 6, hp: 0, action: ActionType.TOGGLE },
      { id: 'uzumaki_barrage', role: CardRole.SIDE_ATTACK, ap: 2, cd: 3, chakra: 0, hp: 0, action: ActionType.ACTIVE },
      { id: 'twin_lion_fists', role: CardRole.ATTACK, ap: 4, cd: 5, chakra: 9, hp: 0, action: ActionType.ACTIVE },
      { id: 'morning_peacock', role: CardRole.ATTACK, ap: 5, cd: 7, chakra: 0, hp: 10, action: ActionType.ACTIVE },
      { id: 'mind_reading', role: CardRole.SUPPORT, ap: 1, cd: 4, chakra: 4, hp: 0, action: ActionType.ACTIVE },
    ];

    for (const row of table) {
      const skill = byId(row.id);
      expect(skill.cardRole).toBe(row.role);
      expect(skill.apCost).toBe(row.ap);
      expect(skill.cooldown).toBe(row.cd);
      expect(skill.chakraCost).toBe(row.chakra);
      expect(skill.hpCost).toBe(row.hp);
      expect(skill.actionType).toBe(row.action);
      expect(skill.baseWeight).toBe(2);
    }
  });
});

describe('T-008 distribution', () => {
  it('keeps the 12 out of starters and splits 7 universal / 5 clan', () => {
    for (const clan of Object.values(Clan)) {
      const starterIds = getClanStartingSkills(clan).map((skill) => skill.id);
      for (const id of V1_NEW_TECHNIQUE_IDS) {
        expect(starterIds).not.toContain(id);
      }
    }

    const clanGated = V1_NEW_TECHNIQUE_IDS.filter((id) => byId(id).requirements?.clan);
    const universal = V1_NEW_TECHNIQUE_IDS.filter((id) => !byId(id).requirements?.clan);
    expect(clanGated).toEqual([...V1_CLAN_SKILL_IDS]);
    expect(universal).toEqual([...V1_UNIVERSAL_SKILL_IDS]);
    expect(clanGated).toHaveLength(5);
    expect(universal).toHaveLength(7);

    expect(byId('sharingan_3').requirements?.clan).toBe(Clan.UCHIHA);
    expect(byId('uzumaki_barrage').requirements?.clan).toBe(Clan.UZUMAKI);
    expect(byId('twin_lion_fists').requirements?.clan).toBe(Clan.HYUGA);
    expect(byId('morning_peacock').requirements?.clan).toBe(Clan.LEE);
    expect(byId('mind_reading').requirements?.clan).toBe(Clan.YAMANAKA);

    const vendorTiers = new Set([SkillTier.BASIC, SkillTier.ADVANCED]);
    const vendorPool = Object.values(SKILLS).filter(
      (skill) => vendorTiers.has(skill.tier) && !skill.requirements?.clan,
    );
    for (const id of V1_UNIVERSAL_SKILL_IDS) {
      expect(vendorPool.some((skill) => skill.id === id)).toBe(true);
    }
  });
});
