/**
 * DeckSystem — full-pool weighted hand (T-003 / SOUL §6).
 *
 * Each turn samples without replacement from the entire playable loadout.
 * There is no combat deck pile, discard, or reshuffle. Virtual discard =
 * drop the hand; next draw uses the full pool again.
 *
 * Weights use authored `cardRole` (T-001). Never infer role from damage.
 * Injected `rng` — live callers pass Math.random.
 */

import { ActionType, CardRole, ElementType, Posture, Skill, SkillTag } from '../types';
import { LaunchProperties } from '../../config/featureFlags';
import { defaultBaseWeight, resolveCardRole, type RoleAuthoringMap } from './CardContractSystem';
import { isSkillReadyOnTurn } from './TurnClockSystem';

export type Rng = () => number;

export interface WeightContext {
  posture: Posture;
  turnIndex?: number;
  mainAttackId?: string | null;
  activeModeIds?: readonly string[];
  modeBonuses?: Readonly<Record<string, number>>;
  supportBonuses?: Readonly<Record<string, number>>;
  /** One-shot next-draw bonuses by cardRole (T-038 Smoke SIDE +1). */
  supportRoleBonuses?: Readonly<Partial<Record<CardRole, number>>>;
  authoringMap?: RoleAuthoringMap;
}

export interface HandSnapshot {
  skill: Skill;
  disabled: boolean;
  reasons: string[];
}

export interface DiscoverFilter {
  tag?: SkillTag;
  element?: ElementType;
  predicate?: (skill: Skill) => boolean;
}

export function getPlayableDeckSize(skills: Skill[]): number {
  return skills.filter((skill) => skill.actionType !== ActionType.PASSIVE).length;
}

export function canAddPlayableSkill(skills: Skill[]): boolean {
  return getPlayableDeckSize(skills) < LaunchProperties.MAX_DECK_SIZE;
}

/** Unique non-PASSIVE techniques (max loadout cap). Alias: buildDeck. */
export function playablePool(skills: readonly Skill[]): Skill[] {
  const seen = new Set<string>();
  const pool: Skill[] = [];
  for (const skill of skills) {
    if (skill.actionType === ActionType.PASSIVE) continue;
    if (seen.has(skill.id)) continue;
    seen.add(skill.id);
    pool.push(skill);
    if (pool.length >= LaunchProperties.MAX_DECK_SIZE) break;
  }
  return pool;
}

/** @deprecated name — playable pool, not a shrinking draw pile. */
export const buildDeck = playablePool;

function postureBonusForRole(role: CardRole | undefined, posture: Posture): number {
  if (role === undefined) return 0;
  if (posture === Posture.AGGRESSIVE && role === CardRole.ATTACK) return 1;
  if (posture === Posture.BALANCED && (role === CardRole.MODE || role === CardRole.SIDE_ATTACK)) {
    return 1;
  }
  if (posture === Posture.DEFENSIVE && role === CardRole.SUPPORT) return 1;
  return 0;
}

function isOnCooldown(skill: Skill, ctx: WeightContext): boolean {
  if (ctx.turnIndex !== undefined && skill.readyOnTurn !== undefined) {
    return !isSkillReadyOnTurn(skill.readyOnTurn, ctx.turnIndex);
  }
  return (skill.currentCooldown ?? 0) > 0;
}

/**
 * SOUL v1: max(1, baseWeight + postureBonus + modeBonus + supportBonus − activeSelf − cooldown).
 * Main Attack has no extra inherent weight. No cap. Never uses getCardCategory / baseDamage.
 */
export function effectiveWeight(skill: Skill, ctx: WeightContext): number {
  const resolved = resolveCardRole(skill, ctx.authoringMap);
  const role = resolved.ok ? resolved.role : undefined;
  const base = skill.baseWeight ?? defaultBaseWeight();
  const postureBonus = postureBonusForRole(role, ctx.posture);
  const modeBonus = ctx.modeBonuses?.[skill.id] ?? 0;
  const supportBonus = ctx.supportBonuses?.[skill.id] ?? 0;
  const roleSupportBonus = role ? (ctx.supportRoleBonuses?.[role] ?? 0) : 0;
  const activeSelf =
    role === CardRole.MODE && (ctx.activeModeIds ?? []).includes(skill.id) ? 1 : 0;
  const cooldownPenalty = isOnCooldown(skill, ctx) ? 1 : 0;
  return Math.max(
    1,
    base + postureBonus + modeBonus + supportBonus + roleSupportBonus - activeSelf - cooldownPenalty,
  );
}

export function snapshotSkill(skill: Skill, ctx: WeightContext): HandSnapshot {
  const reasons: string[] = [];
  if (isOnCooldown(skill, ctx)) {
    reasons.push('cooldown');
  }
  return { skill, disabled: reasons.length > 0, reasons };
}

export function isDeadHand(snapshots: readonly HandSnapshot[]): boolean {
  return snapshots.length > 0 && snapshots.every((card) => card.disabled);
}

function pickWeightedIndex(weights: readonly number[], rng: Rng): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0 || weights.length === 0) {
    return Math.max(0, weights.length - 1);
  }
  const raw = rng();
  let roll = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.999999999) * total : 0;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Weighted sample without replacement from the **full** playable pool.
 * Does not shrink a residual deck. Does not auto-redraw a dead hand.
 */
export function drawHand(
  pool: readonly Skill[],
  ctx: WeightContext,
  size: number,
  rng: Rng,
): { snapshots: HandSnapshot[]; hand: Skill[] } {
  const remaining = playablePool(pool);
  const snapshots: HandSnapshot[] = [];
  const drawCount = Math.min(Math.max(0, size), remaining.length);

  for (let i = 0; i < drawCount; i++) {
    const weights = remaining.map((skill) => effectiveWeight(skill, ctx));
    const pick = pickWeightedIndex(weights, rng);
    const skill = remaining.splice(pick, 1)[0];
    if (!skill) break;
    snapshots.push(snapshotSkill(skill, ctx));
  }

  return { snapshots, hand: snapshots.map((entry) => entry.skill) };
}

/**
 * Virtual discard + new full-pool hand. Previous hand is ignored as a pile
 * (those skills remain in `pool`).
 */
export function drawNewTurnHand(
  pool: readonly Skill[],
  ctx: WeightContext,
  size: number,
  rng: Rng,
): { snapshots: HandSnapshot[]; hand: Skill[] } {
  return drawHand(pool, ctx, size, rng);
}

function matchesDiscoverFilter(skill: Skill, filter?: DiscoverFilter): boolean {
  if (!filter) return true;
  if (filter.predicate && !filter.predicate(skill)) return false;
  if (filter.tag !== undefined && !(skill.tags ?? []).includes(filter.tag)) return false;
  if (filter.element !== undefined && skill.element !== filter.element) return false;
  return true;
}

/**
 * Discover 3: up to 3 weighted candidates from pool (exclude source + current hand).
 * CD skills may appear; the chosen snapshot is disabled if on cooldown.
 */
export function discoverThree(args: {
  pool: readonly Skill[];
  hand: readonly Skill[];
  sourceId: string;
  filter?: DiscoverFilter;
  ctx: WeightContext;
  rng: Rng;
}): { candidates: HandSnapshot[]; chosen: HandSnapshot | null } {
  const handIds = new Set(args.hand.map((skill) => skill.id));
  const eligible = playablePool(args.pool).filter(
    (skill) => skill.id !== args.sourceId && !handIds.has(skill.id) && matchesDiscoverFilter(skill, args.filter),
  );

  const bag = [...eligible];
  const candidates: HandSnapshot[] = [];
  const offer = Math.min(3, bag.length);
  for (let i = 0; i < offer; i++) {
    const weights = bag.map((skill) => effectiveWeight(skill, args.ctx));
    const pick = pickWeightedIndex(weights, args.rng);
    const skill = bag.splice(pick, 1)[0];
    if (!skill) break;
    candidates.push(snapshotSkill(skill, args.ctx));
  }

  if (candidates.length === 0) {
    return { candidates, chosen: null };
  }

  const chosenIndex = pickWeightedIndex(
    candidates.map((entry) => effectiveWeight(entry.skill, args.ctx)),
    args.rng,
  );
  return { candidates, chosen: candidates[chosenIndex] ?? null };
}
