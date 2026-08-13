/**
 * T-007 AC tests: resolveSkill commit — invalid consume-nothing, attempt vs impact, roles.
 */

import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  Mark,
  MarkConsumeTiming,
} from '../../types';
import { emptyModeBoard } from '../CombatModeSystem';
import { listMarks } from '../MarkSystem';
import {
  resolveSkill,
  type ResolveSkillIntent,
  type ResolveSkillState,
} from '../ResolveSkillSystem';
import { createMockSkill } from './testFixtures';

const mark = (overrides: Partial<Mark> & Pick<Mark, 'id'>): Mark => ({
  sourceSkillId: 'src',
  owner: CombatActor.PLAYER,
  target: CombatActor.ENEMY,
  duration: 2,
  stacks: 1,
  ...overrides,
});

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

const attackSkill = createMockSkill({
  id: 'chidori',
  name: 'Chidori',
  cardRole: CardRole.ATTACK,
  apCost: 2,
  chakraCost: 6,
  hpCost: 0,
  cooldown: 1,
  currentCooldown: 0,
  baseDamage: 10,
  hitCount: 2,
  allowedRanges: [CombatRange.CLOSE],
});

describe('T-007 invalid no consume', () => {
  const attempt = mark({
    id: 'focus',
    owner: CombatActor.PLAYER,
    consume: MarkConsumeTiming.ATTEMPT,
  });
  const impact = mark({
    id: 'brand',
    consume: MarkConsumeTiming.IMPACT,
  });

  it('AP, range, or CD reject leaves pools, enemy HP, marks, charges, and readiness unchanged', () => {
    const readySkill = { ...attackSkill, readyOnTurn: 0 };
    const cases: Array<{ skill: typeof attackSkill; state: ResolveSkillState; reason: string }> = [
      {
        skill: { ...readySkill, apCost: 9 },
        state: baseState({
          marks: [attempt, impact],
          modes: { instances: [{ id: 'byakugan', family: 'HYUGA', charges: 4 }] },
          skills: [readySkill],
        }),
        reason: 'ap',
      },
      {
        skill: { ...readySkill, allowedRanges: [CombatRange.CLOSE] },
        state: baseState({
          range: CombatRange.LONG,
          marks: [attempt, impact],
          modes: { instances: [{ id: 'byakugan', family: 'HYUGA', charges: 4 }] },
          skills: [readySkill],
        }),
        reason: 'range',
      },
      {
        skill: { ...readySkill, currentCooldown: 2 },
        state: baseState({
          marks: [attempt, impact],
          modes: { instances: [{ id: 'byakugan', family: 'HYUGA', charges: 4 }] },
          skills: [{ ...readySkill, currentCooldown: 2 }],
        }),
        reason: 'cooldown',
      },
    ];

    for (const fixture of cases) {
      const before = structuredClone(fixture.state);
      const intent: ResolveSkillIntent = { skill: fixture.skill };
      const result = resolveSkill(intent, fixture.state, { rollHit: () => ({ hit: true, damage: 9 }) });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe(fixture.reason);
      expect(result.state).toEqual(before);
      expect(fixture.state).toEqual(before);
    }
  });
});

describe('T-007 attempt impact', () => {
  const setup = [
    mark({ id: 'focus', owner: CombatActor.PLAYER, consume: MarkConsumeTiming.ATTEMPT }),
    mark({ id: 'brand', consume: MarkConsumeTiming.IMPACT }),
  ];

  it('all miss spends attempt-mark, keeps impact-mark, and commits AP/CP', () => {
    const skill = { ...attackSkill, readyOnTurn: 0 };
    const state = baseState({ marks: setup, skills: [skill] });
    const result = resolveSkill(
      { skill },
      state,
      { rollHit: () => ({ hit: false, damage: 0 }) },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(0);
    expect(result.state.pools.ap).toBe(4);
    expect(result.state.pools.chakra).toBe(14);
    expect(listMarks(result.state.marks, { id: 'focus' })).toEqual([]);
    expect(listMarks(result.state.marks, { id: 'brand' })).toHaveLength(1);
    expect(result.attemptSpent.map((m) => m.id)).toEqual(['focus']);
    expect(result.impactSpent).toEqual([]);
    expect(result.state.skills.find((s) => s.id === skill.id)?.readyOnTurn).toBe(5);
  });

  it('≥1 hit consumes the impact-mark once', () => {
    const skill = { ...attackSkill, readyOnTurn: 0 };
    const state = baseState({ marks: setup, skills: [skill] });
    let rolls = 0;
    const result = resolveSkill(
      { skill },
      state,
      {
        rollHit: () => {
          rolls += 1;
          return { hit: rolls === 2, damage: rolls === 2 ? 8 : 0 };
        },
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hitsLanded).toBe(1);
    expect(rolls).toBe(2);
    expect(listMarks(result.state.marks, { id: 'focus' })).toEqual([]);
    expect(listMarks(result.state.marks, { id: 'brand' })).toEqual([]);
    expect(result.impactSpent.map((m) => m.id)).toEqual(['brand']);
    expect(result.state.enemyHp).toBe(42);
  });
});

describe('T-007 roles', () => {
  it('SUPPORT with 0 baseDamage applies a mark without offensive damage classification', () => {
    const support = createMockSkill({
      id: 'cloak',
      cardRole: CardRole.SUPPORT,
      baseDamage: 0,
      apCost: 1,
      chakraCost: 2,
      markEffects: [{ id: 'aim', duration: 2, stacks: 1, consume: MarkConsumeTiming.ATTEMPT }],
    });
    const state = baseState({ skills: [support] });
    const result = resolveSkill({ skill: support }, state, {
      rollHit: () => ({ hit: true, damage: 99 }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.role).toBe(CardRole.SUPPORT);
    expect(result.hitsLanded).toBe(0);
    expect(result.damageDealt).toBe(0);
    expect(result.state.enemyHp).toBe(50);
    expect(listMarks(result.state.marks, { id: 'aim' })).toHaveLength(1);
  });

  it('MODE fixture calls the activation port once', () => {
    const modeSkill = createMockSkill({
      id: 'byakugan',
      cardRole: CardRole.MODE,
      actionType: ActionType.TOGGLE,
      apCost: 2,
      chakraCost: 4,
    });
    let calls = 0;
    const result = resolveSkill(
      { skill: modeSkill },
      baseState({ skills: [modeSkill] }),
      {
        activateMode: (board, def, pools, turn) => {
          calls += 1;
          expect(def.id).toBe('byakugan');
          expect(turn).toBe(3);
          return { ok: true, board, pools };
        },
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.role).toBe(CardRole.MODE);
    expect(calls).toBe(1);
    expect(result.modeActivations).toBe(1);
    expect(result.state.pools.ap).toBe(4);
    expect(result.state.pools.chakra).toBe(16);
  });

  it('PASSIVE intent is rejected and consumes nothing', () => {
    const passive = createMockSkill({
      id: 'inner-gates-passive',
      actionType: ActionType.PASSIVE,
      cardRole: undefined,
      apCost: 0,
      chakraCost: 0,
    });
    const state = baseState({
      skills: [passive],
      marks: [mark({ id: 'focus', consume: MarkConsumeTiming.ATTEMPT })],
    });
    const before = structuredClone(state);
    const result = resolveSkill({ skill: passive }, state);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('passive');
    expect(result.state).toEqual(before);
  });
});
