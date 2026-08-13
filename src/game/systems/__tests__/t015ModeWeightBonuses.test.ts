/**
 * T-015 AC: Shadow Clone weight +4 on Rasengan via ON Mode bonuses.
 */

import { describe, it, expect } from 'vitest';
import { ModeRuntimeState, Posture } from '../../types';
import { getModeDefinition } from '../../constants/modes';
import { effectiveWeight } from '../DeckSystem';
import { buildModeWeightBonuses } from '../ModeWeightSystem';
import { createMockSkill } from './testFixtures';

const rasengan = createMockSkill({
  id: 'rasengan',
  name: 'Rasengan',
  currentCooldown: 0,
});

describe('T-015 shadow_clone data', () => {
  it('authors Rasengan weight +4 on shadow_clone', () => {
    const def = getModeDefinition('shadow_clone');
    expect(def).toBeDefined();
    expect(def?.weightModifiers).toEqual(
      expect.arrayContaining([{ skillId: 'rasengan', delta: 4 }]),
    );
  });
});

describe('T-015 build bonuses', () => {
  it('sums ON Shadow Clone bonuses and ignores OFF/empty boards', () => {
    const on = buildModeWeightBonuses([
      { id: 'shadow_clone', family: 'CLONES', charges: 3, state: ModeRuntimeState.ON },
    ]);
    expect(on.rasengan).toBe(4);

    const off = buildModeWeightBonuses([
      { id: 'shadow_clone', family: 'CLONES', charges: 0, state: ModeRuntimeState.COOLDOWN },
    ]);
    expect(off.rasengan).toBeUndefined();
    expect(buildModeWeightBonuses([])).toEqual({});
  });
});

describe('T-015 weight delta', () => {
  it('raises Rasengan effectiveWeight by exactly +4 when clones are ON', () => {
    const ctx = { posture: Posture.BALANCED };
    const base = effectiveWeight(rasengan, { ...ctx, modeBonuses: {} });
    const built = buildModeWeightBonuses([
      { id: 'shadow_clone', family: 'CLONES', charges: 3, state: ModeRuntimeState.ON },
    ]);
    const boosted = effectiveWeight(rasengan, { ...ctx, modeBonuses: built });
    expect(boosted).toBe(base + 4);
  });
});
