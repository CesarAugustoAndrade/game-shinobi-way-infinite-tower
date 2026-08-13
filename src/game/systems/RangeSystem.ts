/**
 * RangeSystem — pure combat distance helpers (F2)
 * ============================================================================
 * Distance only gates skill legality. No global damage/crit/accuracy modifiers.
 * Zero React/DOM. Shared by live combat, UI, AI, auto-combat, and sims.
 */

import {
  ApproachType,
  AttackMethod,
  CombatRange,
  Enemy,
  RangeMoveDirection,
  RangeMoveTrigger,
  RangeReactionDef,
  Skill,
} from '../types';

const BAND_ORDER: CombatRange[] = [
  CombatRange.CLOSE,
  CombatRange.MEDIUM,
  CombatRange.LONG,
];

const ALL_RANGES: CombatRange[] = [
  CombatRange.CLOSE,
  CombatRange.MEDIUM,
  CombatRange.LONG,
];

/** Base AP cost for one voluntary band move. */
export const VOLUNTARY_MOVE_AP_COST = 1;

// ============================================================================
// Defaults & legality
// ============================================================================

/** Default allowed bands from AttackMethod (Skill.allowedRanges overrides). */
export function defaultsForAttackMethod(method: AttackMethod): CombatRange[] {
  switch (method) {
    case AttackMethod.MELEE:
      return [CombatRange.CLOSE];
    case AttackMethod.RANGED:
      return [CombatRange.MEDIUM, CombatRange.LONG];
    case AttackMethod.AUTO:
    default:
      return [...ALL_RANGES];
  }
}

/** Allowed ranges for a skill (override or AttackMethod defaults). */
export function skillAllowedRanges(skill: Skill): CombatRange[] {
  if (skill.allowedRanges && skill.allowedRanges.length > 0) {
    return skill.allowedRanges;
  }
  return defaultsForAttackMethod(skill.attackMethod);
}

/** Base allowed bands plus optional Mode-granted extras (Chidori MEDIUM). */
export function effectiveAllowedRanges(
  skill: Skill,
  granted: readonly CombatRange[] = [],
): CombatRange[] {
  const base = skillAllowedRanges(skill);
  if (granted.length === 0) return [...base];
  return [...new Set([...base, ...granted])];
}

/** True if skill may be cast at the current band. */
export function skillAllowedAt(
  skill: Skill,
  range: CombatRange,
  granted: readonly CombatRange[] = [],
): boolean {
  return effectiveAllowedRanges(skill, granted).includes(range);
}

/** Human label for UI. */
export function formatCombatRange(range: CombatRange): string {
  switch (range) {
    case CombatRange.CLOSE:
      return 'Close';
    case CombatRange.MEDIUM:
      return 'Medium';
    case CombatRange.LONG:
      return 'Long';
    default:
      return String(range);
  }
}

/** Out-of-range block reason for cards. */
export function outOfRangeBlockReason(skill: Skill, range: CombatRange): string {
  const allowed = skillAllowedRanges(skill).map(formatCombatRange).join('/');
  return `Out of range (need ${allowed}; at ${formatCombatRange(range)})`;
}

// ============================================================================
// Preferred range
// ============================================================================

/**
 * Preferred band by enemy archetype (plan mapping).
 * Override via Enemy.preferredRange when set.
 */
export function preferredRangeForEnemy(enemy: Pick<Enemy, 'archetype' | 'preferredRange' | 'isBoss'>): CombatRange {
  if (enemy.preferredRange) return enemy.preferredRange;
  const arch = (enemy.archetype || 'BALANCED').toUpperCase();
  switch (arch) {
    case 'TANK':
    case 'ASSASSIN':
      return CombatRange.CLOSE;
    case 'CASTER':
    case 'GENJUTSU':
      return CombatRange.LONG;
    case 'BALANCED':
    default:
      return CombatRange.MEDIUM;
  }
}

// ============================================================================
// Initial band from approach
// ============================================================================

/** Success band table (plan §2). Shadow success skips combat — not used here. */
export function approachSuccessRange(approach: ApproachType): CombatRange {
  switch (approach) {
    case ApproachType.STEALTH_AMBUSH:
      return CombatRange.CLOSE;
    case ApproachType.GENJUTSU_SETUP:
    case ApproachType.ENVIRONMENTAL_TRAP:
      return CombatRange.LONG;
    case ApproachType.FRONTAL_ASSAULT:
    case ApproachType.IRON_GUARD:
    case ApproachType.SHADOW_BYPASS:
    default:
      return CombatRange.MEDIUM;
  }
}

/**
 * Resolve opening band for combat.
 * Success → approach table (with F3 heat bias); fail / shadow fail → enemy preferred.
 *
 * Heat bias (success only):
 * - 0–49: no change
 * - 50–74: one band step toward enemy preferred
 * - 75–100: force enemy preferred
 * Fail always → preferred.
 *
 * `heat` is the visit heat number (0–100). `heatTier` accepted as alias for heat value.
 */
export function resolveInitialRange(opts: {
  approach: ApproachType;
  success: boolean;
  enemy: Pick<Enemy, 'archetype' | 'preferredRange' | 'isBoss'>;
  /** F3 visit heat 0–100 (or legacy heatTier alias). */
  heat?: number | null;
  /** @deprecated use heat — kept for call-site compat */
  heatTier?: number | null;
}): CombatRange {
  const preferred = preferredRangeForEnemy(opts.enemy);
  if (!opts.success) {
    return preferred;
  }
  // Shadow success should not start combat; if called, use preferred fallback
  if (opts.approach === ApproachType.SHADOW_BYPASS) {
    return preferred;
  }

  let band = approachSuccessRange(opts.approach);
  const heat = opts.heat ?? opts.heatTier ?? 0;
  const h = typeof heat === 'number' && Number.isFinite(heat) ? heat : 0;

  if (h >= 75) {
    return preferred;
  }
  if (h >= 50) {
    // One step toward preferred
    const dir = directionToward(band, preferred);
    if (dir) {
      const shifted = shiftRange(band, dir);
      if (shifted.moved) band = shifted.range;
    }
  }
  return band;
}

// ============================================================================
// Band geometry
// ============================================================================

export function bandIndex(range: CombatRange): number {
  return BAND_ORDER.indexOf(range);
}

export function clampBand(index: number): CombatRange {
  const i = Math.max(0, Math.min(BAND_ORDER.length - 1, index));
  return BAND_ORDER[i];
}

/**
 * Shift engagement band by one step.
 * APPROACH → lower index (toward CLOSE); RETREAT → higher (toward LONG).
 * Returns whether the band actually changed (false at boundary).
 */
export function shiftRange(
  current: CombatRange,
  direction: RangeMoveDirection
): { range: CombatRange; moved: boolean } {
  const idx = bandIndex(current);
  const next =
    direction === RangeMoveDirection.APPROACH ? idx - 1 : idx + 1;
  if (next < 0 || next >= BAND_ORDER.length) {
    return { range: current, moved: false };
  }
  return { range: BAND_ORDER[next], moved: true };
}

/** Direction from current toward a preferred band (or null if already there). */
export function directionToward(
  current: CombatRange,
  preferred: CombatRange
): RangeMoveDirection | null {
  const a = bandIndex(current);
  const b = bandIndex(preferred);
  if (a === b) return null;
  return a > b ? RangeMoveDirection.APPROACH : RangeMoveDirection.RETREAT;
}

/** Base AP cost for voluntary move (terrain surcharges added by caller). */
export function voluntaryMoveCost(_extra: number = 0): number {
  return VOLUNTARY_MOVE_AP_COST + Math.max(0, _extra);
}

/**
 * Forced PUSH (away) or PULL (closer). Does not consume voluntary move.
 * Boundary: no move, no reactions.
 */
export function applyForcedMove(
  current: CombatRange,
  kind: 'PUSH' | 'PULL'
): { range: CombatRange; moved: boolean; trigger: RangeMoveTrigger } {
  const direction =
    kind === 'PUSH' ? RangeMoveDirection.RETREAT : RangeMoveDirection.APPROACH;
  const { range, moved } = shiftRange(current, direction);
  return {
    range,
    moved,
    trigger: kind === 'PUSH' ? RangeMoveTrigger.PUSH : RangeMoveTrigger.PULL,
  };
}

/**
 * Reactions after a real band change. Empty when `moved` is false (PUSH@LONG / PULL@CLOSE)
 * or safeMovement. Optional `sources` is the registry (Marks / authored reactions).
 */
export function collectRangeReactions(
  trigger: RangeMoveTrigger,
  moved: boolean,
  safeMovement?: boolean,
  sources: readonly RangeReactionDef[] = [],
): RangeReactionDef[] {
  if (!moved || safeMovement) return [];
  return sources.filter(
    (entry) => entry.trigger === trigger || entry.trigger === RangeMoveTrigger.OTHER,
  );
}

/** Mode activation range: omitted / empty allowedRanges = any band. */
export function canActivateModeAt(
  allowedRanges: readonly CombatRange[] | undefined,
  range: CombatRange,
): boolean {
  if (!allowedRanges || allowedRanges.length === 0) return true;
  return allowedRanges.includes(range);
}

export function canPlayNonModeSkillAt(skill: Skill, range: CombatRange): boolean {
  return skillAllowedAt(skill, range);
}

/**
 * Forced PUSH/PULL: never consumes the voluntary-move flag.
 * Reactions only if the band actually changed.
 */
export function resolveForcedMove(
  current: CombatRange,
  kind: 'PUSH' | 'PULL',
  voluntaryUsed: boolean,
  sources: readonly RangeReactionDef[] = [],
): {
  range: CombatRange;
  moved: boolean;
  playerMoveUsedThisTurn: boolean;
  reactions: RangeReactionDef[];
} {
  const forced = applyForcedMove(current, kind);
  return {
    range: forced.range,
    moved: forced.moved,
    playerMoveUsedThisTurn: voluntaryUsed,
    reactions: collectRangeReactions(forced.trigger, forced.moved, false, sources),
  };
}

/**
 * Plan AI step: if skill is in-range, no move; else one-band move if that lands skill in range.
 */
export function planMoveForSkill(
  current: CombatRange,
  skill: Skill
): { needMove: boolean; direction: RangeMoveDirection | null; afterRange: CombatRange } {
  if (skillAllowedAt(skill, current)) {
    return { needMove: false, direction: null, afterRange: current };
  }
  // Try approach then retreat
  for (const dir of [RangeMoveDirection.APPROACH, RangeMoveDirection.RETREAT]) {
    const { range, moved } = shiftRange(current, dir);
    if (moved && skillAllowedAt(skill, range)) {
      return { needMove: true, direction: dir, afterRange: range };
    }
  }
  return { needMove: false, direction: null, afterRange: current };
}
