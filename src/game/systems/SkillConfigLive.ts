/**
 * SkillConfigLive — R0 adapters for live Player Skill Config (T-013).
 * Reuses CardContractSystem. Never infers Main from damage.
 */

import { GameState, Player, Skill, SkillConfig } from '../types';
import { ensureMainAttack, withAddedSkill } from './CardContractSystem';

export const EMPTY_SKILL_CONFIG: SkillConfig = {
  mainAttackId: null,
  modeUpkeepPriority: [],
};

export function normalizeSkillConfig(config?: SkillConfig | null): SkillConfig {
  return {
    mainAttackId: config?.mainAttackId ?? null,
    modeUpkeepPriority: [...(config?.modeUpkeepPriority ?? [])],
  };
}

export function isSkillConfigEditable(gameState: GameState): boolean {
  return gameState !== GameState.COMBAT;
}

export interface SkillConfigMutation {
  player: Player;
  notified: boolean;
  refused: boolean;
}

export function bootstrapPlayerSkillConfig(
  player: Player,
  rng: () => number,
): SkillConfigMutation {
  const ensured = ensureMainAttack(normalizeSkillConfig(player.skillConfig), player.skills, rng);
  return {
    player: { ...player, skillConfig: ensured.config },
    notified: ensured.notified,
    refused: false,
  };
}

export function rewriteSkillConfig(
  player: Player,
  next: SkillConfig,
  gameState: GameState,
): SkillConfigMutation {
  if (!isSkillConfigEditable(gameState)) {
    return {
      player,
      notified: false,
      refused: true,
    };
  }
  return {
    player: { ...player, skillConfig: normalizeSkillConfig(next) },
    notified: false,
    refused: false,
  };
}

export function applyLearnSkill(
  player: Player,
  skill: Skill,
  gameState: GameState,
): SkillConfigMutation {
  if (!isSkillConfigEditable(gameState)) {
    return { player, notified: false, refused: true };
  }
  if (player.skills.some((entry) => entry.id === skill.id)) {
    return {
      player: { ...player, skillConfig: withAddedSkill(normalizeSkillConfig(player.skillConfig), skill.id) },
      notified: false,
      refused: false,
    };
  }
  return {
    player: {
      ...player,
      skills: [...player.skills, skill],
      skillConfig: withAddedSkill(normalizeSkillConfig(player.skillConfig), skill.id),
    },
    notified: false,
    refused: false,
  };
}

export function applyForgetSkill(
  player: Player,
  skillId: string,
  gameState: GameState,
  rng: () => number,
): SkillConfigMutation {
  if (!isSkillConfigEditable(gameState)) {
    return { player, notified: false, refused: true };
  }
  const skills = player.skills.filter((entry) => entry.id !== skillId);
  const ensured = ensureMainAttack(normalizeSkillConfig(player.skillConfig), skills, rng);
  return {
    player: { ...player, skills, skillConfig: ensured.config },
    notified: ensured.notified,
    refused: false,
  };
}
