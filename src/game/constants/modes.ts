/**
 * v1 Combat Mode definitions — SOUL §8 / HTML #modes initial tuning.
 * Enhancement routes are typed stubs; the machine + costs + charges are live.
 */

import { ModeDefinition, ModeEndKind, TargetScope } from '../types';

export const MODE_FAMILY = {
  HYUGA: 'HYUGA',
  SHARINGAN: 'SHARINGAN',
  CURSE: 'CURSE',
  GATES: 'GATES',
  CLONES: 'CLONES',
} as const;

const standardEnds = [
  { kind: ModeEndKind.PAYOFF },
  { kind: ModeEndKind.MANUAL_OFF },
  { kind: ModeEndKind.ZERO_CHARGES },
  { kind: ModeEndKind.UPKEEP_FAIL },
  { kind: ModeEndKind.FAMILY_REPLACE },
] as const;

function mode(partial: ModeDefinition): ModeDefinition {
  return partial;
}

/** The eight named v1 Modes. */
export const MODE_DEFINITIONS: Record<string, ModeDefinition> = {
  byakugan: mode({
    id: 'byakugan',
    family: MODE_FAMILY.HYUGA,
    stage: 1,
    maxCharges: 4,
    activationCost: { ap: 2, chakra: 4 },
    upkeep: { chakra: 4 },
    cooldown: 4,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: 'Hyuga ATTACK weight +1' }],
    endClauses: [...standardEnds],
  }),
  sharingan_2: mode({
    id: 'sharingan_2',
    family: MODE_FAMILY.SHARINGAN,
    stage: 2,
    maxCharges: 3,
    activationCost: { ap: 2, chakra: 4 },
    upkeep: { chakra: 4 },
    cooldown: 4,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.OFFENSIVE_SKILL, note: 'Katon ATTACK weight +1' }],
    endClauses: [...standardEnds],
  }),
  sharingan_3: mode({
    id: 'sharingan_3',
    family: MODE_FAMILY.SHARINGAN,
    stage: 3,
    maxCharges: 3,
    activationCost: { ap: 3, chakra: 6 },
    upkeep: { chakra: 6 },
    cooldown: 5,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: 'Lightning / Chidori MEDIUM' }],
    endClauses: [...standardEnds],
  }),
  curse_mark_1: mode({
    id: 'curse_mark_1',
    family: MODE_FAMILY.CURSE,
    stage: 1,
    maxCharges: 3,
    activationCost: { ap: 2, hp: 12 },
    upkeep: { hp: 5 },
    cooldown: 5,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: '+40% for 1 charge' }],
    endClauses: [...standardEnds],
  }),
  curse_mark_2: mode({
    id: 'curse_mark_2',
    family: MODE_FAMILY.CURSE,
    stage: 2,
    maxCharges: 4,
    activationCost: { ap: 3, hp: 25 },
    upkeep: { hp: 10 },
    cooldown: 6,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: '+60% for 1 charge' }],
    endClauses: [...standardEnds],
  }),
  gate_of_life: mode({
    id: 'gate_of_life',
    family: MODE_FAMILY.GATES,
    stage: 3,
    maxCharges: 3,
    activationCost: { ap: 3, hp: 15 },
    upkeep: { hp: 8 },
    cooldown: 6,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: 'GATES payoff weight +1' }],
    endClauses: [...standardEnds],
  }),
  gate_of_limit: mode({
    id: 'gate_of_limit',
    family: MODE_FAMILY.GATES,
    stage: 5,
    maxCharges: 4,
    activationCost: { ap: 4, hp: 35 },
    upkeep: { hp: 12 },
    cooldown: 8,
    weightModifiers: [],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: 'Hidden Lotus / Morning Peacock' }],
    endClauses: [...standardEnds],
  }),
  shadow_clone: mode({
    id: 'shadow_clone',
    family: MODE_FAMILY.CLONES,
    stage: 1,
    maxCharges: 3,
    activationCost: { ap: 2, chakra: 12 },
    upkeep: { chakra: 2 },
    cooldown: 5,
    weightModifiers: [{ skillId: 'rasengan', delta: 4 }],
    enhancements: [{ targetScope: TargetScope.ATTACK, note: 'Rasengan weight +4' }],
    endClauses: [...standardEnds],
  }),
};

export const V1_MODE_IDS = Object.keys(MODE_DEFINITIONS);

export function getModeDefinition(id: string): ModeDefinition | undefined {
  return MODE_DEFINITIONS[id];
}
