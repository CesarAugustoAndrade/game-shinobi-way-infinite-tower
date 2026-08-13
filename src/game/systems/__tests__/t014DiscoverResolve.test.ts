/**
 * T-014 AC: Discover 3 on resolveSkill — offer, CD disabled, non-discover SUPPORT.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatRange,
  MarkConsumeTiming,
} from '../../types';
import { emptyModeBoard } from '../CombatModeSystem';
import {
  commitDiscoverChoice,
  resolveSkill,
  type ResolveSkillState,
} from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

function baseState(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
  return {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 3,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  };
}

const discoverSupport = createMockSkill({
  id: 'rehearsal',
  name: 'Rehearsal',
  cardRole: CardRole.SUPPORT,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  hpCost: 0,
  cooldown: 5,
  currentCooldown: 0,
  baseDamage: 0,
  discover: { count: 3 },
});

const markSupport = createMockSkill({
  id: 'wire',
  name: 'Wire',
  cardRole: CardRole.SUPPORT,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  hpCost: 0,
  baseDamage: 0,
  markEffects: [
    {
      id: 'tripwire',
      duration: 2,
      stacks: 1,
      consume: MarkConsumeTiming.NONE,
    },
  ],
});

const poolSkill = (id: string, extra: Partial<ReturnType<typeof createMockSkill>> = {}) =>
  createMockSkill({
    id,
    name: id,
    cardRole: CardRole.ATTACK,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 8,
    currentCooldown: 0,
    ...extra,
  });

describe('T-014 offer', () => {
  it('frees the Discover Support slot and offers 1–3 candidates outside hand', () => {
    const a = poolSkill('a');
    const b = poolSkill('b');
    const c = poolSkill('c');
    const d = poolSkill('d');
    const e = poolSkill('e');
    const f = poolSkill('f');
    const pool = [discoverSupport, a, b, c, d, e, f];
    const hand = [discoverSupport, a, b, c];
    const result = resolveSkill(
      { skill: discoverSupport },
      baseState({ hand, playablePool: pool, skills: pool }),
      { rng: () => 0 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.hand?.some((card) => card.id === 'rehearsal')).toBe(false);
    const remainingIds = new Set((result.state.hand ?? []).map((card) => card.id));
    const candidates = result.pendingDiscover?.candidates ?? [];
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.length).toBeLessThanOrEqual(3);
    for (const entry of candidates) {
      expect(entry.skill.id).not.toBe('rehearsal');
      expect(remainingIds.has(entry.skill.id)).toBe(false);
    }
  });
});

describe('T-014 cd disabled', () => {
  it('commits a cooldown candidate as a disabled hand entry', () => {
    const a = poolSkill('a');
    const b = poolSkill('b');
    const c = poolSkill('c');
    const cooled = poolSkill('cooled', { currentCooldown: 2, readyOnTurn: 9 });
    const pool = [discoverSupport, a, b, c, cooled];
    const result = resolveSkill(
      { skill: discoverSupport },
      baseState({
        hand: [discoverSupport, a, b, c],
        playablePool: pool,
        skills: pool,
      }),
      { rng: () => 0.99 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cdOffer = result.pendingDiscover?.candidates.find((entry) => entry.skill.id === 'cooled');
    expect(cdOffer).toBeDefined();
    expect(cdOffer?.disabled || cdOffer?.reasons.includes('cooldown')).toBe(true);

    const committed = commitDiscoverChoice(result.state, 'cooled');
    expect(committed.refused).toBe(false);
    expect(committed.inserted?.disabled).toBe(true);
    expect(committed.inserted?.reasons).toContain('cooldown');
    expect(committed.state.hand?.some((card) => card.id === 'cooled')).toBe(true);
    expect(committed.state.pendingDiscover).toBeUndefined();

    const invalid = commitDiscoverChoice(result.state, 'missing');
    expect(invalid.refused).toBe(true);
    expect(invalid.state.hand?.some((card) => card.id === 'missing')).toBe(false);
  });
});

describe('T-014 no discover', () => {
  it('resolves a non-discover SUPPORT without a pending offer', () => {
    const result = resolveSkill(
      { skill: markSupport },
      baseState({
        hand: [markSupport, poolSkill('a')],
        playablePool: [markSupport, poolSkill('a'), poolSkill('b')],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pendingDiscover).toBeUndefined();
    expect(result.state.pendingDiscover).toBeUndefined();
    expect(result.state.marks.some((mark) => mark.id === 'tripwire')).toBe(true);
    expect(result.state.hand?.some((card) => card.id === 'wire')).toBe(true);
  });
});
