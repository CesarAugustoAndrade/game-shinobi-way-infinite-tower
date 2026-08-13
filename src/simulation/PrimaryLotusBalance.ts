/**
 * T-030 probe — Primary Lotus authoring; reject no Gate; Life/Limit scale + close.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface PrimaryLotusProbe {
  authoring: boolean;
  requireGates: boolean;
  scaleClose: boolean;
}

export function runPrimaryLotusProbe(): PrimaryLotusProbe {
  const lotus = SKILLS.PRIMARY_LOTUS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 10, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [lotus],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const gates = (id: string, charges: number) => ({
    instances: [{ id, family: MODE_FAMILY.GATES, charges, state: ModeRuntimeState.ON }],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: lotus.baseDamage }) };
  const baseline = lotus.baseDamage * (lotus.hitCount ?? 1);
  const off = resolveSkill({ skill: lotus }, state(), hit);
  const life = resolveSkill(
    { skill: lotus },
    state({ modes: gates('gate_of_life', 3) }),
    hit,
  );
  const limit = resolveSkill(
    { skill: lotus },
    state({ modes: gates('gate_of_limit', 2) }),
    hit,
  );
  return {
    authoring:
      lotus.cardRole === CardRole.ATTACK &&
      lotus.hitCount === 3 &&
      lotus.baseDamage === 7 &&
      lotus.apCost === 5 &&
      lotus.hpCost === 15 &&
      lotus.modeInteraction?.requireFamily === MODE_FAMILY.GATES &&
      lotus.modeInteraction.consumeAllCharges === true &&
      lotus.modeInteraction.damagePerChargeBonus === 0.15,
    requireGates: !off.ok && off.reason === 'mode-required' && off.state.modes.instances.length === 0,
    scaleClose:
      life.ok &&
      life.damageDealt === Math.floor(baseline * (1 + 0.15 * 3)) &&
      life.state.modes.instances.find((m) => m.id === 'gate_of_life')?.state ===
        ModeRuntimeState.COOLDOWN &&
      limit.ok &&
      limit.damageDealt === Math.floor(baseline * (1 + 0.15 * 2)) &&
      limit.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state ===
        ModeRuntimeState.COOLDOWN,
  };
}

export function printPrimaryLotusProbe(probe: PrimaryLotusProbe): void {
  console.log('\n── T-030 Primary Lotus probe ──');
  console.log(`  authoring 3×7 GATES:  ${probe.authoring}`);
  console.log(`  require GATES:        ${probe.requireGates}`);
  console.log(`  Life/Limit scale+off: ${probe.scaleClose}`);
}
