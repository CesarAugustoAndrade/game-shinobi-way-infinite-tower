/**
 * T-025 probe — Chidori authoring; MEDIUM + spend 2; OFF/short reject; CLOSE no spend.
 */

import { CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ChidoriSharingan3Probe {
  authoring: boolean;
  onMediumSpend: boolean;
  offAndShort: boolean;
}

export function runChidoriSharingan3Probe(): ChidoriSharingan3Probe {
  const chidori = SKILLS.CHIDORI;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [chidori],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const sharingan = (charges: number) => ({
    instances: [
      { id: 'sharingan_3', family: MODE_FAMILY.SHARINGAN, charges, state: ModeRuntimeState.ON },
    ],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: chidori.baseDamage }) };
  const on = resolveSkill(
    { skill: chidori },
    state({ range: CombatRange.MEDIUM, modes: sharingan(3) }),
    hit,
  );
  const off = resolveSkill({ skill: chidori }, state({ range: CombatRange.MEDIUM }), hit);
  const short = resolveSkill(
    { skill: chidori },
    state({ range: CombatRange.MEDIUM, modes: sharingan(1) }),
    hit,
  );
  const close = resolveSkill({ skill: chidori }, state(), hit);
  return {
    authoring:
      chidori.cardRole === 'ATTACK' &&
      chidori.modeInteraction?.modeId === 'sharingan_3' &&
      chidori.modeInteraction.consumeCharges === 2 &&
      chidori.modeInteraction.grantRanges?.[0] === CombatRange.MEDIUM,
    onMediumSpend:
      on.ok && on.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges === 1,
    offAndShort:
      !off.ok &&
      off.reason === 'range' &&
      !short.ok &&
      short.reason === 'range' &&
      close.ok === true &&
      close.state.modes.instances.length === 0,
  };
}

export function printChidoriSharingan3Probe(probe: ChidoriSharingan3Probe): void {
  console.log('\n── T-025 Chidori Sharingan 3 probe ──');
  console.log(`  authoring 2+MEDIUM:  ${probe.authoring}`);
  console.log(`  ON MEDIUM spend 2:   ${probe.onMediumSpend}`);
  console.log(`  OFF/short + CLOSE:   ${probe.offAndShort}`);
}
