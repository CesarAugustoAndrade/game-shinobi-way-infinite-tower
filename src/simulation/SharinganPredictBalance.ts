/**
 * T-039 probe — Predict authoring; require ON; restore 1 / no overcap + Read Window.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applyReadWindowOutgoing } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SharinganPredictProbe {
  authoring: boolean;
  requireOn: boolean;
  restoreCap: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    chargesFrom1: number;
    chargesAtMax: number;
    cutFrom40: number;
  };
}

export function runSharinganPredictProbe(): SharinganPredictProbe {
  const predict = SKILLS.SHARINGAN_PREDICT;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [predict],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  });
  const on = (id: string, charges: number) => ({
    instances: [{ id, family: MODE_FAMILY.SHARINGAN, charges, state: ModeRuntimeState.ON }],
  });
  const off = resolveSkill({ skill: predict }, state());
  const low = resolveSkill({ skill: predict }, state({ modes: on('sharingan_2', 1) }));
  const full = resolveSkill({ skill: predict }, state({ modes: on('sharingan_2', 3) }));
  const three = resolveSkill({ skill: predict }, state({ modes: on('sharingan_3', 1) }));
  const cut = low.ok ? applyReadWindowOutgoing(40, low.state.marks) : { damage: -1, consumed: false };
  return {
    authoring:
      predict.cardRole === CardRole.SUPPORT &&
      predict.apCost === 1 &&
      predict.chakraCost === 3 &&
      predict.cooldown === 3 &&
      predict.baseDamage === 0 &&
      predict.modeInteraction?.requireOn === true &&
      predict.modeInteraction.requireFamily === MODE_FAMILY.SHARINGAN &&
      predict.modeInteraction.restoreCharges === 1 &&
      predict.markEffects?.some((m) => m.id === 'read_window' && m.duration === 1 && m.stacks === 30) ===
        true,
    requireOn: !off.ok && off.reason === 'mode-required' && off.state.marks.length === 0,
    restoreCap:
      low.ok &&
      low.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 2 &&
      low.state.marks.some((m) => m.id === 'read_window') &&
      full.ok &&
      full.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges === 3 &&
      three.ok &&
      three.state.modes.instances.find((m) => m.id === 'sharingan_3')?.charges === 2,
    metrics: {
      apCost: predict.apCost ?? 0,
      chakraCost: predict.chakraCost,
      chargesFrom1: low.ok ? (low.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges ?? 0) : 0,
      chargesAtMax: full.ok ? (full.state.modes.instances.find((m) => m.id === 'sharingan_2')?.charges ?? 0) : 0,
      cutFrom40: cut.damage,
    },
  };
}

export function printSharinganPredictProbe(probe: SharinganPredictProbe): void {
  const m = probe.metrics;
  console.log('\n── T-039 Sharingan Predict probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  require Sharingan:  ${probe.requireOn}`);
  console.log(`  restore 1 / cap 3:  ${probe.restoreCap}`);
  console.log('  ── balance vs legacy SPEED +25% evasion ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 3)`);
  console.log(`  charges 1→ / at 3:  ${m.chargesFrom1} / ${m.chargesAtMax}  (was no restore)`);
  console.log(`  next offensive 40:  ${m.cutFrom40}  (was 40 / SPEED %)`);
}
