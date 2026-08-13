/**
 * T-021 probe — Peacock requireOn reject; C=3/4 scale + close Gate.
 */

import { CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface MorningPeacockProbe {
  requireOnReject: boolean;
  scaleCloseThree: boolean;
  fourCharges: boolean;
}

export function runMorningPeacockProbe(): MorningPeacockProbe {
  const peacock = SKILLS.MORNING_PEACOCK;
  const state = (modes: ResolveSkillState['modes']): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes,
    skills: [peacock],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: peacock.baseDamage }) };
  const baseline = peacock.baseDamage * (peacock.hitCount ?? 1);
  const scaled = (charges: number) => Math.floor(baseline * (1 + 0.15 * charges));
  const gate = (charges: number) => ({
    instances: [
      {
        id: 'gate_of_limit',
        family: MODE_FAMILY.GATES,
        charges,
        state: ModeRuntimeState.ON,
      },
    ],
  });
  const off = resolveSkill({ skill: peacock }, state(emptyModeBoard()), hit);
  const three = resolveSkill({ skill: peacock }, state(gate(3)), hit);
  const four = resolveSkill({ skill: peacock }, state(gate(4)), hit);
  const closed = (result: typeof three) =>
    result.ok &&
    result.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state ===
      ModeRuntimeState.COOLDOWN;
  return {
    requireOnReject: !off.ok && off.reason === 'mode-required',
    scaleCloseThree: three.ok && three.damageDealt === scaled(3) && closed(three),
    fourCharges: four.ok && four.damageDealt === scaled(4) && closed(four),
  };
}

export function printMorningPeacockProbe(probe: MorningPeacockProbe): void {
  console.log('\n── T-021 Morning Peacock probe ──');
  console.log(`  requireOn reject:  ${probe.requireOnReject}`);
  console.log(`  C=3 scale+close:   ${probe.scaleCloseThree}`);
  console.log(`  C=4 scale+close:   ${probe.fourCharges}`);
}
