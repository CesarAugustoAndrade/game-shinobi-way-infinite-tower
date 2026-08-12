/**
 * CardContractSystem — R0 authoring contracts for CardRole / Main Attack (T-001).
 *
 * Pure helpers. Role comes only from explicit `cardRole` (or an explicit
 * id→role map). Never infer role from damage, ActionType, or getCardCategory.
 * Zero React/DOM. Injected rng only — no Math.random.
 */

import {
  ActionType,
  CardRole,
  Skill,
  SkillConfig,
} from '../types';

export const DEFAULT_SKILL_BASE_WEIGHT = 2 as const;

export function defaultBaseWeight(): typeof DEFAULT_SKILL_BASE_WEIGHT {
  return DEFAULT_SKILL_BASE_WEIGHT;
}

export function actionTypeForCardRole(role: CardRole): ActionType {
  if (role === CardRole.MODE) {
    return ActionType.TOGGLE;
  }
  return ActionType.ACTIVE;
}

/** All four CardRoles are hand-playable. PASSIVE is ActionType-only, not a CardRole. */
export function isHandPlayableRole(role: CardRole): boolean {
  return (
    role === CardRole.SUPPORT ||
    role === CardRole.MODE ||
    role === CardRole.SIDE_ATTACK ||
    role === CardRole.ATTACK
  );
}

export type RoleResolution =
  | { ok: true; role: CardRole }
  | { ok: false; reason: 'incomplete-authoring' };

export type RoleAuthoringMap = Readonly<Record<string, CardRole>>;

/**
 * Resolve a skill's CardRole. Reads only `skill.cardRole` or `authoringMap[id]`.
 * Does not inspect baseDamage, effects, or combatCards.
 */
export function resolveCardRole(
  skill: Pick<Skill, 'id' | 'cardRole'>,
  authoringMap?: RoleAuthoringMap,
): RoleResolution {
  if (skill.cardRole !== undefined) {
    return { ok: true, role: skill.cardRole };
  }
  const mapped = authoringMap?.[skill.id];
  if (mapped !== undefined) {
    return { ok: true, role: mapped };
  }
  return { ok: false, reason: 'incomplete-authoring' };
}

export interface EnsureMainAttackResult {
  config: SkillConfig;
  notified: boolean;
}

function attackIdsInLoadout(loadout: ReadonlyArray<Pick<Skill, 'id' | 'cardRole'>>): string[] {
  return loadout
    .filter((skill) => skill.cardRole === CardRole.ATTACK)
    .map((skill) => skill.id);
}

function pickUniform(ids: readonly string[], rng: () => number): string {
  const roll = rng();
  const unit = Number.isFinite(roll) ? Math.min(Math.max(roll, 0), 0.999999999) : 0;
  return ids[Math.floor(unit * ids.length)] ?? ids[0];
}

/**
 * Ensure Skill Config Main is a designated ATTACK id.
 * Empty / invalid Main + ≥1 ATTACK → uniform pick via injected rng + notified.
 * Never leaves Main empty when an ATTACK exists. Does not call Math.random.
 */
export function ensureMainAttack(
  config: SkillConfig,
  loadout: ReadonlyArray<Pick<Skill, 'id' | 'cardRole'>>,
  rng: () => number,
): EnsureMainAttackResult {
  const attackIds = attackIdsInLoadout(loadout);
  if (attackIds.length === 0) {
    return { config: { ...config, modeUpkeepPriority: [...config.modeUpkeepPriority] }, notified: false };
  }

  const current = config.mainAttackId;
  if (current !== null && current !== '' && attackIds.includes(current)) {
    return {
      config: { ...config, mainAttackId: current, modeUpkeepPriority: [...config.modeUpkeepPriority] },
      notified: false,
    };
  }

  return {
    config: {
      ...config,
      mainAttackId: pickUniform(attackIds, rng),
      modeUpkeepPriority: [...config.modeUpkeepPriority],
    },
    notified: true,
  };
}

/** Learning / adding a skill never reassigns an already-set Main. */
export function withAddedSkill(config: SkillConfig, _skillId: string): SkillConfig {
  return {
    ...config,
    mainAttackId: config.mainAttackId,
    modeUpkeepPriority: [...config.modeUpkeepPriority],
  };
}
