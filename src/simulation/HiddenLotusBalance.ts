/**
 * T-031 probe — Hidden Lotus authoring; reject no Limit; scale + close + self Vulnerable.
 */

import { CardRole, CombatActor, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface HiddenLotusProbe {
  authoring: boolean;
  requireLimit: boolean;
  scaleCloseVulnerable: boolean;
}

export function runHiddenLotusProbe(): HiddenLotusProbe {
  const lotus = SKILLS.HIDDEN_LOTUS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 10, chakra: 20, hp: 80, maxHp: 80 },
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
  const life = resolveSkill({ skill: lotus }, state({ modes: gates('gate_of_life', 3) }), hit);
  const limit = resolveSkill({ skill: lotus }, state({ modes: gates('gate_of_limit', 3) }), hit);
  const vuln = limit.ok ? limit.state.marks.find((m) => m.id === 'vulnerable') : undefined;
  return {
    authoring:
      lotus.cardRole === CardRole.ATTACK &&
      lotus.hitCount === 5 &&
      lotus.baseDamage === 6 &&
      lotus.apCost === 6 &&
      lotus.hpCost === 50 &&
      lotus.modeInteraction?.modeId === 'gate_of_limit' &&
      lotus.modeInteraction.requireOn === true &&
      lotus.modeInteraction.consumeAllCharges === true &&
      lotus.modeInteraction.damagePerChargeBonus === 0.15 &&
      lotus.markEffects?.some((m) => m.id === 'vulnerable' && m.duration === 2 && m.targetActor === 'self') ===
        true,
    requireLimit:
      !off.ok &&
      off.reason === 'mode-required' &&
      !life.ok &&
      life.reason === 'mode-required' &&
      life.state.modes.instances.find((m) => m.id === 'gate_of_life')?.charges === 3,
    scaleCloseVulnerable:
      limit.ok &&
      limit.damageDealt === Math.floor(baseline * (1 + 0.15 * 3)) &&
      limit.state.modes.instances.find((m) => m.id === 'gate_of_limit')?.state ===
        ModeRuntimeState.COOLDOWN &&
      vuln?.target === CombatActor.PLAYER &&
      vuln.duration === 2,
  };
}

export function printHiddenLotusProbe(probe: HiddenLotusProbe): void {
  console.log('\n── T-031 Hidden Lotus probe ──');
  console.log(`  authoring 5×6 Limit:    ${probe.authoring}`);
  console.log(`  require Limit:          ${probe.requireLimit}`);
  console.log(`  scale+close+vulnerable: ${probe.scaleCloseVulnerable}`);
}
