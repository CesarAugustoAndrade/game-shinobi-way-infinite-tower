/**
 * combatSkillViewModel — pure combat UI helpers for skill cards.
 *
 * Formats machine-readable playability gates and damage previews so Hand /
 * Combat do not reimplement the PlayerTurn post-calc stack.
 * Zero React / DOM.
 */

import {
  Player,
  Enemy,
  Skill,
  CharacterStats,
  Posture,
  TerrainDefinition,
  CardRole,
  ActionType,
  type TypedCost,
} from '../types';
import { getApCost } from '../constants/combatCards';
import { getElementEffectiveness } from '../constants';
import { LaunchProperties } from '../../config/featureFlags';
import {
  canPlaySkill,
  getSkillBlockReason,
  type SkillPlayContext,
  type SkillBlockReason,
} from './skillPlayability';
import { outOfRangeBlockReason } from './RangeSystem';
import {
  previewDamage,
  resolvePassiveDamageBonus,
} from './StatSystem';
import {
  getTotalDefenseBypass,
  getCritDefenseBypass,
  hasAllElementsPassive,
  getConvertToElementalPercent,
  applyClanTraitToDamageContext,
} from './EquipmentPassiveSystem';
import { getEventFlagRunModifiers } from './EventSystem';
import {
  postureDamageMod,
  stanceBonusDamageMult,
} from './PostureSystem';
import {
  skillLocationDamageMult,
  applyEnemyDefenseBonus,
  type LocationTerrainMods,
} from './LocationTerrainSystem';
import { getTerrainElementAmplification } from './CombatCalculationSystem';
import { applyDamageMultipliers } from './SkillResolutionSystem';

// ============================================================================
// BLOCK REASON FORMATTING
// ============================================================================

/**
 * Human-readable block reason for greyed skill cards (matches Combat.tsx copy).
 * Returns null when `reason` is null (skill is playable).
 */
export function formatSkillBlockReason(
  reason: SkillBlockReason,
  ctx: SkillPlayContext,
): string | null {
  if (reason === null) return null;

  const { skill } = ctx;

  switch (reason) {
    case 'stun':
      return 'Stunned — end turn';
    case 'silence':
      return 'Silenced — chakra jutsu blocked';
    case 'cooldown':
      return `On cooldown (${skill.currentCooldown})`;
    case 'range':
      if (ctx.currentRange !== undefined) {
        return outOfRangeBlockReason(skill, ctx.currentRange);
      }
      return 'Out of range';
    case 'ap': {
      const ap = getApCost(skill);
      const have = ctx.currentAp ?? 0;
      return `Need ${ap} AP (have ${have})`;
    }
    case 'chakra': {
      const chakraCost = ctx.skipFirstSkillCost ? 0 : skill.chakraCost;
      return `Need ${chakraCost} chakra`;
    }
    case 'hp':
      return `Need more HP (costs ${skill.hpCost})`;
    case 'mode-required': {
      const mi = skill.modeInteraction;
      const modeName = modePanelDisplayName(mi?.modeId ?? mi?.requireFamily ?? mi?.family ?? 'Mode');
      if (mi?.consumeAllCharges) {
        return `Need ${modeName} ON with ≥1 charge`;
      }
      const need = mi?.consumeCharges ?? 1;
      return need > 1
        ? `Need ${modeName} ON with ${need} charges`
        : `Requires ${modeName} ON`;
    }
    case 'mark-required': {
      const markId = skill.modeInteraction?.requireMarkId ?? 'mark';
      return `Requires ${markPanelDisplayName(markId)} on enemy`;
    }
    default:
      return 'Cannot play this card';
  }
}

// ============================================================================
// DAMAGE PREVIEW
// ============================================================================

/** Inputs for UI damage prediction (mirrors Hand.tsx / PlayerTurn stack). */
export interface SkillDamagePreviewInput {
  player: Player;
  playerStats: CharacterStats;
  enemy: Enemy;
  enemyStats: CharacterStats;
  skill: Skill;
  posture?: Posture;
  isFirstTurn?: boolean;
  firstHitMultiplier?: number;
  locationTerrainMods?: LocationTerrainMods | null;
  roomTerrain?: TerrainDefinition | null;
}

/**
 * Stable damage preview for skill cards / tooltips.
 *
 * Replicates Hand.tsx:
 * clan traits → event flag dmg → passives/defense bypass → previewDamage
 * → firstHit → terrain amp → location mult → enemy def bonus
 * → PLAYER_DAMAGE_MULTIPLIER → posture → stance bonus.
 *
 * `previewDamage` forces hit + non-crit so UI does not flicker miss/CRIT.
 */
export function previewSkillDamageForUi(input: SkillDamagePreviewInput): {
  predictedDamage: number;
  isSuperEffective: boolean;
  basePreview: number;
} {
  const {
    player,
    playerStats,
    enemy,
    enemyStats,
    skill,
    posture = Posture.BALANCED,
    isFirstTurn = false,
    firstHitMultiplier = 1,
    locationTerrainMods = null,
    roomTerrain = null,
  } = input;

  const clanCtx = applyClanTraitToDamageContext(
    player,
    playerStats.derived,
    enemyStats.effectivePrimary,
    enemyStats.derived,
  );
  const flagDmg = getEventFlagRunModifiers(player).damageBonus;

  const prediction = previewDamage(
    playerStats.effectivePrimary,
    clanCtx.attackerDerived,
    clanCtx.defenderPrimary,
    clanCtx.defenderDerived,
    skill,
    player.element,
    enemy.element,
    {
      damageBonus:
        resolvePassiveDamageBonus(playerStats.passiveBonuses, skill.element, skill.tags) + flagDmg,
      defenseBypass: getTotalDefenseBypass(player),
      critDefenseBypass: getCritDefenseBypass(player),
      forceSuperEffective: hasAllElementsPassive(player),
      convertToElementalPercent: getConvertToElementalPercent(player),
    },
  );

  const basePreview = prediction.finalDamage;
  let modified = basePreview;

  if (isFirstTurn && firstHitMultiplier > 1) {
    modified = Math.floor(modified * firstHitMultiplier);
  }
  if (roomTerrain && player.element) {
    const terrainAmp = getTerrainElementAmplification(roomTerrain, player.element);
    if (terrainAmp > 1) {
      modified = Math.floor(modified * terrainAmp);
    }
  }
  if (locationTerrainMods) {
    const locMult = skillLocationDamageMult(skill, locationTerrainMods);
    if (locMult !== 1) {
      modified = Math.floor(modified * locMult);
    }
    modified = applyEnemyDefenseBonus(modified, locationTerrainMods);
  }

  // Match PlayerTurn resolveSuccessfulHit preMitigation stack:
  // launch → posture → stance, floor after each (not product then one floor).
  const predictedDamage = applyDamageMultipliers(modified, [
    LaunchProperties.PLAYER_DAMAGE_MULTIPLIER,
    postureDamageMod(posture),
    stanceBonusDamageMult(skill, posture),
  ]);

  const effectiveness = getElementEffectiveness(skill.element, enemy.element);
  const isSuperEffective = effectiveness > 1.0;

  return { predictedDamage, isSuperEffective, basePreview };
}

// ============================================================================
// COMPOSITE CARD VIEW-MODEL
// ============================================================================

/**
 * Optional composite: playability + damage preview + costs for one skill card.
 */
export function buildSkillCardViewModel(
  playCtx: SkillPlayContext,
  dmgInput: SkillDamagePreviewInput,
): {
  canPlay: boolean;
  blockReason: string | null;
  predictedDamage: number;
  apCost: number;
  effectiveChakraCost: number;
} {
  const reason = getSkillBlockReason(playCtx);
  const { predictedDamage } = previewSkillDamageForUi(dmgInput);

  return {
    canPlay: canPlaySkill(playCtx),
    blockReason: formatSkillBlockReason(reason, playCtx),
    predictedDamage,
    apCost: getApCost(playCtx.skill),
    effectiveChakraCost: playCtx.skipFirstSkillCost ? 0 : playCtx.skill.chakraCost,
  };
}

export type RoleBadgeLabel = 'SUPPORT' | 'MODE' | 'SIDE' | 'ATTACK' | 'PASSIVE' | '—';

/** Face badge from authored cardRole. Never inferred from damage. */
export function roleBadgeLabel(skill: Pick<Skill, 'cardRole' | 'actionType'>, opts?: { passiveDisplay?: boolean }): RoleBadgeLabel {
  if (opts?.passiveDisplay) return 'PASSIVE';
  if (skill.cardRole === CardRole.SUPPORT) return 'SUPPORT';
  if (skill.cardRole === CardRole.MODE) return 'MODE';
  if (skill.cardRole === CardRole.SIDE_ATTACK) return 'SIDE';
  if (skill.cardRole === CardRole.ATTACK) return 'ATTACK';
  if (skill.actionType === ActionType.PASSIVE) return 'PASSIVE';
  return '—';
}

export function isMainAttackRibbon(skillId: string, mainAttackId?: string | null): boolean {
  return Boolean(mainAttackId) && skillId === mainAttackId;
}

export interface PreviewSource {
  name: string;
  bonus: number;
}

export interface HonestyPreview {
  base: number;
  enhanced: number | null;
  sources: PreviewSource[];
}

/** Enhanced shown only when at least one named source has a non-zero bonus. */
export function buildHonestyPreview(base: number, sources: readonly PreviewSource[] = []): HonestyPreview {
  const active = sources.filter((source) => source.bonus !== 0);
  if (active.length === 0) {
    return { base, enhanced: null, sources: [] };
  }
  const enhanced = Math.max(0, Math.floor(base + active.reduce((sum, source) => sum + source.bonus, 0)));
  return { base, enhanced, sources: [...active] };
}

export function chargeConsumeWarning(skill: Pick<Skill, 'modeInteraction'>): string | null {
  const mi = skill.modeInteraction;
  if (!mi) return null;
  if (mi.consumeAllCharges) {
    return 'Consumes all Mode charges — Mode closes';
  }
  const n = mi.consumeCharges;
  if (!n || n <= 0) return null;
  return `Consumes ${n} Mode charge${n === 1 ? '' : 's'}`;
}

/** Title-case machine ids (`custom_foo_bar` → `Custom Foo Bar`). T-136/T-138. */
export function prettifyId(id: string): string {
  return id
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Human Mode name: skill registry name, else title-cased id (never a fake number). */
export function modePanelDisplayName(modeId: string, skillName?: string): string {
  const trimmed = skillName?.trim();
  if (trimmed) return trimmed;
  return prettifyId(modeId);
}

const KNOWN_MARK_LABELS: Readonly<Record<string, string>> = {
  bleed: 'Bleed',
  poison: 'Poison',
  burn: 'Burn',
  mud_wall_shield: 'Mud Wall',
  sand_shield: 'Sand Shield',
  counter_reflect: 'Counter',
  rotation_reflect: 'Rotation',
  bound: 'Bound',
  decoy: 'Decoy',
  mist: 'Mist',
  substitution: 'Substitution',
  reanimation: 'Reanimation',
  c4: 'C4',
};

/** Human Mark name: known CTS map, else prettifyId. */
export function markPanelDisplayName(markId: string, override?: string): string {
  const trimmed = override?.trim();
  if (trimmed) return trimmed;
  return KNOWN_MARK_LABELS[markId] ?? prettifyId(markId);
}

/** Upkeep as `4 CP` / `8 HP` / `4 CP + 8 HP`. Empty/unknown → undefined (panel hides). */
export function formatModeUpkeep(upkeep: TypedCost | undefined): string | undefined {
  if (!upkeep) return undefined;
  const parts: string[] = [];
  if ((upkeep.chakra ?? 0) > 0) parts.push(`${upkeep.chakra} CP`);
  if ((upkeep.hp ?? 0) > 0) parts.push(`${upkeep.hp} HP`);
  if ((upkeep.ap ?? 0) > 0) parts.push(`${upkeep.ap} AP`);
  return parts.length > 0 ? parts.join(' + ') : undefined;
}
