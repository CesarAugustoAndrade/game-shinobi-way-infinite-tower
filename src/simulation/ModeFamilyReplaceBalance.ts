/**
 * T-027 probe — Curse ascent +1; Sharingan lateral no +1; no silent downgrade.
 */

import { CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ModeFamilyReplaceProbe {
  ascent: boolean;
  lateral: boolean;
  noDowngrade: boolean;
}

export function runModeFamilyReplaceProbe(): ModeFamilyReplaceProbe {
  const curse2 = SKILLS.CURSE_MARK_2;
  const curse1 = SKILLS.CURSE_MARK_1;
  const sharingan3 = SKILLS.SHARINGAN_3TOMOE;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 10, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [curse2, curse1, sharingan3],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const on = (id: string, family: string, charges: number, stage: number) => ({
    instances: [{ id, family, charges, stage, state: ModeRuntimeState.ON }],
  });
  const up = resolveSkill(
    { skill: curse2 },
    state({ modes: on('curse_mark_1', MODE_FAMILY.CURSE, 2, 1) }),
  );
  const swap = resolveSkill(
    { skill: sharingan3 },
    state({ modes: on('sharingan_2', MODE_FAMILY.SHARINGAN, 2, 2) }),
  );
  const downStart = state({ modes: on('curse_mark_2', MODE_FAMILY.CURSE, 3, 2) });
  const down = resolveSkill({ skill: curse1 }, downStart);
  return {
    ascent:
      up.ok &&
      up.state.modes.instances.find((m) => m.id === 'curse_mark_2')?.charges === 3 &&
      !up.state.modes.instances.some(
        (m) => m.id === 'curse_mark_1' && m.state === ModeRuntimeState.ON,
      ),
    lateral:
      swap.ok &&
      swap.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges === 2 &&
      swap.state.modes.instances.find((m) => m.id === 'sharingan_2')?.state ===
        ModeRuntimeState.COOLDOWN,
    noDowngrade:
      !down.ok &&
      down.reason === 'mode-family' &&
      down.state.pools.ap === downStart.pools.ap &&
      down.state.modes.instances.find((m) => m.id === 'curse_mark_2')?.charges === 3,
  };
}

export function printModeFamilyReplaceProbe(probe: ModeFamilyReplaceProbe): void {
  console.log('\n── T-027 Mode family replace probe ──');
  console.log(`  Curse ascent +1:     ${probe.ascent}`);
  console.log(`  Sharingan lateral:   ${probe.lateral}`);
  console.log(`  no silent downgrade: ${probe.noDowngrade}`);
}
