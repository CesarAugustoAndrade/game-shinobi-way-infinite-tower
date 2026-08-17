/**
 * T-098 probe — Byakugan Scan SUPPORT; Mode gate; Tenketsu 2; HYUGA ATTACK +2.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { effectiveWeight } from '../game/systems/DeckSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { Posture } from '../game/types';

export interface ByakuganScanProbe {
  authoring: boolean;
  modeGate: boolean;
  setup: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    tenketsuDuration: number;
    weightDelta: number;
    chargesAfter: number;
    predictAp: number;
  };
}

export function runByakuganScanProbe(): ByakuganScanProbe {
  const scan = SKILLS.BYAKUGAN_SCAN;
  const fist = SKILLS.GENTLE_FIST;
  const predict = SKILLS.SHARINGAN_PREDICT;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [scan],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  });
  const onBoard = {
    instances: [
      {
        id: 'byakugan',
        family: MODE_FAMILY.HYUGA,
        charges: 2,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const off = resolveSkill({ skill: scan }, state());
  const on = resolveSkill({ skill: scan }, state({ modes: onBoard }));
  const mark = on.ok ? on.state.marks.find((m) => m.id === 'tenketsu_exposed') : undefined;
  const bag = on.ok ? consumeSupportWeightBonuses(on.state.pendingSupportWeights ?? []) : null;
  const ctx = { posture: Posture.BALANCED };
  const baseW = effectiveWeight(fist, { ...ctx, supportBonuses: {} });
  const boostW = bag ? effectiveWeight(fist, { ...ctx, supportBonuses: bag.bonuses }) : baseW;
  return {
    authoring:
      scan.cardRole === CardRole.SUPPORT &&
      scan.apCost === 1 &&
      scan.chakraCost === 3 &&
      scan.cooldown === 3 &&
      scan.baseDamage === 0 &&
      scan.modeInteraction?.requireOn === true &&
      scan.modeInteraction.modeId === 'byakugan' &&
      scan.modeInteraction.consumeCharges === undefined &&
      scan.markEffects?.some((m) => m.id === 'tenketsu_exposed' && m.duration === 2) === true &&
      scan.nextDrawSkillBonuses?.some((e) => e.skillId === 'gentle_fist' && e.delta === 2) === true,
    modeGate:
      off.ok === false &&
      on.ok === true &&
      on.damageDealt === 0 &&
      on.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 2,
    setup: mark?.duration === 2 && mark.stacks === 30 && boostW === baseW + 2,
    metrics: {
      apCost: scan.apCost ?? 0,
      chakraCost: scan.chakraCost,
      tenketsuDuration: mark?.duration ?? 0,
      weightDelta: boostW - baseW,
      chargesAfter: on.ok ? (on.state.modes.instances.find((m) => m.id === 'byakugan')?.charges ?? 0) : 0,
      predictAp: predict.apCost ?? 0,
    },
  };
}

export function printByakuganScanProbe(probe: ByakuganScanProbe): void {
  const m = probe.metrics;
  console.log('\n── T-098 Byakugan Scan probe ──');
  console.log(`  authoring SUPPORT require Byakugan + Tenketsu +2: ${probe.authoring}`);
  console.log(`  OFF reject / ON no charge spend:                  ${probe.modeGate}`);
  console.log(`  Tenketsu 2 + Gentle Fist weight +2:               ${probe.setup}`);
  console.log('  ── balance vs legacy ACC +30% and Predict 1/3 ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 3; Predict ${m.predictAp})`);
  console.log(`  Tenketsu duration:  ${m.tenketsuDuration}  (was mute ACC +30%×1)`);
  console.log(`  HYUGA ATTACK Δw:    ${m.weightDelta}  (was 0)`);
  console.log(`  charges after scan: ${m.chargesAfter}  (must stay 2)`);
}
