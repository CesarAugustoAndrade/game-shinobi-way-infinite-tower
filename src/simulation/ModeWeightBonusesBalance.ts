/**
 * T-015 probe — Shadow Clone ON adds +4 Rasengan weight.
 */

import { ModeRuntimeState, Posture } from '../game/types';
import { getModeDefinition } from '../game/constants/modes';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { buildModeWeightBonuses } from '../game/systems/ModeWeightSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ModeWeightBonusesProbe {
  dataDelta4: boolean;
  onAddsFour: boolean;
  offEmpty: boolean;
  weightPlusFour: boolean;
}

export function runModeWeightBonusesProbe(): ModeWeightBonusesProbe {
  const def = getModeDefinition('shadow_clone');
  const dataDelta4 = Boolean(
    def?.weightModifiers.some((mod) => mod.skillId === 'rasengan' && mod.delta === 4),
  );
  const on = buildModeWeightBonuses([
    { id: 'shadow_clone', family: 'CLONES', charges: 3, state: ModeRuntimeState.ON },
  ]);
  const off = buildModeWeightBonuses([
    { id: 'shadow_clone', family: 'CLONES', charges: 0, state: ModeRuntimeState.COOLDOWN },
  ]);
  const rasengan = createMockSkill({ id: 'rasengan', currentCooldown: 0 });
  const ctx = { posture: Posture.BALANCED };
  const base = effectiveWeight(rasengan, { ...ctx, modeBonuses: {} });
  const boosted = effectiveWeight(rasengan, { ...ctx, modeBonuses: on });
  return {
    dataDelta4,
    onAddsFour: on.rasengan === 4,
    offEmpty: off.rasengan === undefined,
    weightPlusFour: boosted === base + 4,
  };
}

export function printModeWeightBonusesProbe(probe: ModeWeightBonusesProbe): void {
  console.log('\n── T-015 Mode weight bonuses probe ──');
  console.log(`  shadow_clone +4 data: ${probe.dataDelta4}`);
  console.log(`  ON bonuses rasengan:  ${probe.onAddsFour}`);
  console.log(`  OFF board empty:      ${probe.offEmpty}`);
  console.log(`  effectiveWeight +4:   ${probe.weightPlusFour}`);
}
