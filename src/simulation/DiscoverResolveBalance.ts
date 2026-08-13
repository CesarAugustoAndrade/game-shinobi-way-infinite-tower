/**
 * T-014 probe — Discover offer size, CD disabled commit, non-discover SUPPORT.
 */

import { ActionType, CardRole, CombatRange } from '../game/types';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import {
  commitDiscoverChoice,
  resolveSkill,
  type ResolveSkillState,
} from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface DiscoverResolveProbe {
  offerValid: boolean;
  cdDisabled: boolean;
  noDiscover: boolean;
}

const discover = createMockSkill({
  id: 'rehearsal',
  cardRole: CardRole.SUPPORT,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 0,
  discover: { count: 3 },
});

const support = createMockSkill({
  id: 'wire',
  cardRole: CardRole.SUPPORT,
  actionType: ActionType.ACTIVE,
  apCost: 1,
  chakraCost: 0,
  baseDamage: 0,
});

const atk = (id: string, extra: Partial<ReturnType<typeof createMockSkill>> = {}) =>
  createMockSkill({ id, cardRole: CardRole.ATTACK, apCost: 1, chakraCost: 0, baseDamage: 8, ...extra });

function state(overrides: Partial<ResolveSkillState> = {}): ResolveSkillState {
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

export function runDiscoverResolveProbe(): DiscoverResolveProbe {
  const pool = [discover, atk('a'), atk('b'), atk('c'), atk('d'), atk('e'), atk('f')];
  const offered = resolveSkill(
    { skill: discover },
    state({ hand: [discover, atk('a'), atk('b'), atk('c')], playablePool: pool }),
    { rng: () => 0 },
  );
  const remaining = new Set((offered.ok ? offered.state.hand ?? [] : []).map((s) => s.id));
  const candidates = offered.ok ? offered.pendingDiscover?.candidates ?? [] : [];
  const offerValid =
    offered.ok &&
    !remaining.has('rehearsal') &&
    candidates.length >= 1 &&
    candidates.length <= 3 &&
    candidates.every((entry) => entry.skill.id !== 'rehearsal' && !remaining.has(entry.skill.id));

  const cooledPool = [discover, atk('a'), atk('b'), atk('c'), atk('cooled', { currentCooldown: 2 })];
  const cooled = resolveSkill(
    { skill: discover },
    state({
      hand: [discover, atk('a'), atk('b'), atk('c')],
      playablePool: cooledPool,
    }),
    { rng: () => 0.99 },
  );
  const committed =
    cooled.ok && cooled.pendingDiscover
      ? commitDiscoverChoice(
          cooled.state,
          cooled.pendingDiscover.candidates.find((entry) => entry.skill.id === 'cooled')?.skill.id ??
            cooled.pendingDiscover.candidates[0]?.skill.id ??
            '',
        )
      : { refused: true, inserted: null };
  const cdDisabled = Boolean(committed.inserted?.disabled || committed.inserted?.reasons.includes('cooldown'));

  const plain = resolveSkill(
    { skill: support },
    state({ hand: [support], playablePool: [support, atk('z')] }),
  );
  const noDiscover = plain.ok && !plain.pendingDiscover;

  return { offerValid, cdDisabled, noDiscover };
}

export function printDiscoverResolveProbe(probe: DiscoverResolveProbe): void {
  console.log('\n── T-014 Discover resolve probe ──');
  console.log(`  offer valid:     ${probe.offerValid}`);
  console.log(`  CD disabled:     ${probe.cdDisabled}`);
  console.log(`  no-discover SUPPORT: ${probe.noDiscover}`);
}
