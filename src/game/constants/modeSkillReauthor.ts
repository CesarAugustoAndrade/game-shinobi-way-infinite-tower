/**
 * T-011 — SOUL §8 packaging for the seven pre-existing Mode skills.
 * Numbers match `MODE_DEFINITIONS` (T-005). Do not retune here.
 */

import { MODE_FAMILY } from './modes';

export const T011_MODE_SKILL_IDS = [
  'sharingan_2',
  'byakugan',
  'shadow_clone',
  'gate_of_life',
  'gate_of_limit',
  'curse_mark_1',
  'curse_mark_2',
] as const;

export type T011ModeSkillId = (typeof T011_MODE_SKILL_IDS)[number];

export interface SoulModeSkillReauthor {
  id: T011ModeSkillId;
  family: string;
  ap: number;
  activationChakra: number;
  activationHp: number;
  upkeep: number;
  maxCharges: number;
  cooldown: number;
}

export const SOUL_MODE_SKILL_REAUTHOR: readonly SoulModeSkillReauthor[] = [
  {
    id: 'sharingan_2',
    family: MODE_FAMILY.SHARINGAN,
    ap: 2,
    activationChakra: 4,
    activationHp: 0,
    upkeep: 4,
    maxCharges: 3,
    cooldown: 4,
  },
  {
    id: 'byakugan',
    family: MODE_FAMILY.HYUGA,
    ap: 2,
    activationChakra: 4,
    activationHp: 0,
    upkeep: 4,
    maxCharges: 4,
    cooldown: 4,
  },
  {
    id: 'shadow_clone',
    family: MODE_FAMILY.CLONES,
    ap: 2,
    activationChakra: 12,
    activationHp: 0,
    upkeep: 2,
    maxCharges: 3,
    cooldown: 5,
  },
  {
    id: 'gate_of_life',
    family: MODE_FAMILY.GATES,
    ap: 3,
    activationChakra: 0,
    activationHp: 15,
    upkeep: 8,
    maxCharges: 3,
    cooldown: 6,
  },
  {
    id: 'gate_of_limit',
    family: MODE_FAMILY.GATES,
    ap: 4,
    activationChakra: 0,
    activationHp: 35,
    upkeep: 12,
    maxCharges: 4,
    cooldown: 8,
  },
  {
    id: 'curse_mark_1',
    family: MODE_FAMILY.CURSE,
    ap: 2,
    activationChakra: 0,
    activationHp: 12,
    upkeep: 5,
    maxCharges: 3,
    cooldown: 5,
  },
  {
    id: 'curse_mark_2',
    family: MODE_FAMILY.CURSE,
    ap: 3,
    activationChakra: 0,
    activationHp: 25,
    upkeep: 10,
    maxCharges: 4,
    cooldown: 6,
  },
];
