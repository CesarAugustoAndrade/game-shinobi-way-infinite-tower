/**
 * T-019 probe — Sealing Tag drain xor Silence.
 */

import { CombatRange, EffectType, ModeRuntimeState } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SealingTagDrainProbe {
  drainNoSilence: boolean;
  silenceWhenEmpty: boolean;
  noPackagedSilence: boolean;
}

export function runSealingTagDrainProbe(): SealingTagDrainProbe {
  const sealing = Object.values(SKILLS).find((entry) => entry.id === 'sealing_tag_chakra_lock');
  if (!sealing) {
    return { drainNoSilence: false, silenceWhenEmpty: false, noPackagedSilence: false };
  }
  const state = (enemyModes: ResolveSkillState['enemyModes']): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [sealing],
    playerBuffs: [],
    enemyHp: 50,
    enemyModes,
    enemyBuffs: [],
  });
  const on = resolveSkill(
    { skill: sealing },
    state({
      instances: [
        { id: 'shadow_clone', family: 'CLONES', charges: 3, state: ModeRuntimeState.ON },
      ],
    }),
  );
  const off = resolveSkill({ skill: sealing }, state(emptyModeBoard()));
  const silenced = (s: ResolveSkillState) =>
    (s.enemyBuffs ?? []).some((buff) => buff.effect.type === EffectType.SILENCE);
  return {
    drainNoSilence:
      on.ok &&
      on.state.enemyModes?.instances.find((m) => m.id === 'shadow_clone')?.charges === 2 &&
      !silenced(on.state),
    silenceWhenEmpty: off.ok && silenced(off.state),
    noPackagedSilence: !sealing.effects?.some((effect) => effect.type === EffectType.SILENCE),
  };
}

export function printSealingTagDrainProbe(probe: SealingTagDrainProbe): void {
  console.log('\n── T-019 Sealing Tag drain/silence probe ──');
  console.log(`  drain no Silence:     ${probe.drainNoSilence}`);
  console.log(`  Silence when empty:   ${probe.silenceWhenEmpty}`);
  console.log(`  no packaged Silence:  ${probe.noPackagedSilence}`);
}
