/**
 * T-029 probe — Dynamic Entry authoring; MEDIUM→CLOSE no spend; CLOSE stay.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface DynamicEntryProbe {
  authoring: boolean;
  rushNoSpend: boolean;
  closeStay: boolean;
}

export function runDynamicEntryProbe(): DynamicEntryProbe {
  const entry = SKILLS.DYNAMIC_ENTRY;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [entry],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  });
  const gate = {
    instances: [
      { id: 'gate_of_limit', family: MODE_FAMILY.GATES, charges: 3, state: ModeRuntimeState.ON },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: entry.baseDamage }) };
  const rush = resolveSkill({ skill: entry }, state({ modes: gate }), hit);
  const stay = resolveSkill(
    { skill: entry },
    state({ range: CombatRange.CLOSE, modes: gate }),
    hit,
  );
  return {
    authoring:
      entry.cardRole === CardRole.SIDE_ATTACK &&
      entry.allowedRanges?.includes(CombatRange.MEDIUM) === true &&
      entry.allowedRanges?.includes(CombatRange.CLOSE) === true &&
      entry.bandMove?.kind === 'SELF_APPROACH',
    rushNoSpend:
      rush.ok &&
      rush.state.range === CombatRange.CLOSE &&
      rush.state.playerMoveUsedThisTurn === false &&
      rush.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.charges === 3,
    closeStay:
      stay.ok &&
      stay.state.range === CombatRange.CLOSE &&
      stay.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.charges === 3,
  };
}

export function printDynamicEntryProbe(probe: DynamicEntryProbe): void {
  console.log('\n── T-029 Dynamic Entry probe ──');
  console.log(`  authoring SIDE+MEDIUM: ${probe.authoring}`);
  console.log(`  MEDIUM→CLOSE no spend: ${probe.rushNoSpend}`);
  console.log(`  CLOSE stay no spend:   ${probe.closeStay}`);
}
