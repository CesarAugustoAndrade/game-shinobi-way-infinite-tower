/**
 * T-028 probe — Rotation authoring; require Byakugan; spend 1 + self marks.
 */

import { CardRole, CombatActor, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface RotationKaitenProbe {
  authoring: boolean;
  requireOn: boolean;
  spendSelfMarks: boolean;
}

export function runRotationKaitenProbe(): RotationKaitenProbe {
  const kaiten = SKILLS.ROTATION;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kaiten],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const byakugan = {
    instances: [
      { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 4, state: ModeRuntimeState.ON },
    ],
  };
  const off = resolveSkill({ skill: kaiten }, state());
  const on = resolveSkill({ skill: kaiten }, state({ modes: byakugan }));
  return {
    authoring:
      kaiten.cardRole === CardRole.SUPPORT &&
      kaiten.modeInteraction?.modeId === 'byakugan' &&
      kaiten.modeInteraction.requireOn === true &&
      kaiten.modeInteraction.consumeCharges === 1,
    requireOn: !off.ok && off.reason === 'mode-required' && off.state.marks.length === 0,
    spendSelfMarks:
      on.ok &&
      on.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 3 &&
      on.state.marks.some(
        (m) => m.id === 'rotation_shield' && m.target === CombatActor.PLAYER && m.stacks === 50,
      ) &&
      on.state.marks.some(
        (m) => m.id === 'rotation_reflect' && m.target === CombatActor.PLAYER && m.stacks === 60,
      ),
  };
}

export function printRotationKaitenProbe(probe: RotationKaitenProbe): void {
  console.log('\n── T-028 Rotation (kaiten) probe ──');
  console.log(`  authoring SUPPORT+req: ${probe.authoring}`);
  console.log(`  require Byakugan:      ${probe.requireOn}`);
  console.log(`  spend 1 + self marks:  ${probe.spendSelfMarks}`);
}
