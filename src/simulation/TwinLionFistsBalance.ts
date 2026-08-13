/**
 * T-022 probe — Twin Lion Byakugan+CP 1.5× + consume; miss keeps; base without setup.
 */

import { CombatActor, CombatRange, MarkConsumeTiming, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface TwinLionFistsProbe {
  enhance: boolean;
  missKeep: boolean;
  base: boolean;
}

export function runTwinLionFistsProbe(): TwinLionFistsProbe {
  const lions = SKILLS.TWIN_LION_FISTS;
  const state = (
    modes: ResolveSkillState['modes'],
    marks: ResolveSkillState['marks'] = [],
  ): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks,
    modes,
    skills: [lions],
    playerBuffs: [],
    enemyHp: 80,
  });
  const byakugan = {
    instances: [
      { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 3, state: ModeRuntimeState.ON },
    ],
  };
  const cp = {
    id: 'chakra_point',
    sourceSkillId: 'air_palm',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 1,
    consume: MarkConsumeTiming.IMPACT,
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: lions.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const baseline = lions.baseDamage * (lions.hitCount ?? 1);
  const enhanced = resolveSkill({ skill: lions }, state(byakugan, [cp]), hit);
  const missed = resolveSkill({ skill: lions }, state(byakugan, [cp]), miss);
  const noMode = resolveSkill({ skill: lions }, state(emptyModeBoard(), [cp]), hit);
  return {
    enhance:
      enhanced.ok &&
      enhanced.damageDealt === Math.floor(baseline * 1.5) &&
      !enhanced.state.marks.some((m) => m.id === 'chakra_point') &&
      enhanced.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 3,
    missKeep:
      missed.ok &&
      missed.damageDealt === 0 &&
      missed.state.marks.some((m) => m.id === 'chakra_point'),
    base: noMode.ok && noMode.damageDealt === baseline,
  };
}

export function printTwinLionFistsProbe(probe: TwinLionFistsProbe): void {
  console.log('\n── T-022 Twin Lion Fists probe ──');
  console.log(`  Byakugan+CP 1.5×:  ${probe.enhance}`);
  console.log(`  miss keeps CP:     ${probe.missKeep}`);
  console.log(`  base no setup:     ${probe.base}`);
}
