/**
 * T-045 probe — Gentle Fist authoring; Byakugan +40%; ≤2 CP + drain.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  ModeRuntimeState,
} from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface GentleFistProbe {
  authoring: boolean;
  mode: boolean;
  cpImpact: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    baseDamage: number;
    modeDamage: number;
    cpDamage: number;
    comboDamage: number;
    chargesAfter: number;
    cpRemaining: number;
    chakraAfter: number;
  };
}

export function runGentleFistProbe(): GentleFistProbe {
  const skill = SKILLS.GENTLE_FIST;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    enemyChakra: 20,
    ...overrides,
  });
  const byakugan = {
    instances: [
      { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 3, state: ModeRuntimeState.ON },
    ],
  };
  const cps = (stacks: number) => [
    {
      id: 'chakra_point',
      sourceSkillId: 'air_palm',
      owner: CombatActor.PLAYER,
      target: CombatActor.ENEMY,
      duration: 2,
      stacks,
      consume: MarkConsumeTiming.IMPACT,
    },
  ];
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const base = resolveSkill({ skill }, state(), hit);
  const mode = resolveSkill({ skill }, state({ modes: byakugan }), hit);
  const cp = resolveSkill({ skill }, state({ marks: cps(3) }), hit);
  const combo = resolveSkill({ skill }, state({ modes: byakugan, marks: cps(2) }), hit);
  const whiff = resolveSkill({ skill }, state({ marks: cps(3) }), miss);
  const missMode = resolveSkill({ skill }, state({ modes: byakugan }), miss);
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 4 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 12 &&
      skill.allowedRanges?.[0] === CombatRange.CLOSE &&
      skill.modeInteraction?.modeId === 'byakugan' &&
      skill.modeInteraction.consumeCharges === 1 &&
      skill.modeInteraction.damageMultBonus === 0.4 &&
      skill.impactMarkConsume?.maxStacks === 2 &&
      skill.impactMarkConsume.damageMultPerStack === 0.1 &&
      skill.impactMarkConsume.drainChakraPerStack === 4 &&
      !skill.effects?.some((e) => e.type === EffectType.CHAKRA_DRAIN && e.value === 20),
    mode:
      mode.ok &&
      mode.damageDealt === 16 &&
      mode.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 2 &&
      base.ok === true &&
      base.damageDealt === 12 &&
      missMode.ok === true &&
      missMode.damageDealt === 0 &&
      missMode.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 2,
    cpImpact:
      cp.ok &&
      cp.damageDealt === 14 &&
      cp.state.marks.find((m) => m.id === 'chakra_point')?.stacks === 1 &&
      cp.state.enemyChakra === 12 &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.marks.find((m) => m.id === 'chakra_point')?.stacks === 3 &&
      whiff.state.enemyChakra === 20 &&
      combo.ok === true &&
      combo.damageDealt === 20,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      baseDamage: base.ok ? base.damageDealt : 0,
      modeDamage: mode.ok ? mode.damageDealt : 0,
      cpDamage: cp.ok ? cp.damageDealt : 0,
      comboDamage: combo.ok ? combo.damageDealt : 0,
      chargesAfter: mode.ok ? mode.state.modes.instances.find((m) => m.id === 'byakugan')?.charges ?? -1 : -1,
      cpRemaining: cp.ok ? cp.state.marks.find((m) => m.id === 'chakra_point')?.stacks ?? -1 : -1,
      chakraAfter: cp.ok ? cp.state.enemyChakra ?? -1 : -1,
    },
  };
}

export function printGentleFistProbe(probe: GentleFistProbe): void {
  const m = probe.metrics;
  console.log('\n── T-045 Gentle Fist probe ──');
  console.log(`  authoring ATTACK:   ${probe.authoring}`);
  console.log(`  Byakugan +40%/1:    ${probe.mode}`);
  console.log(`  ≤2 CP + drain:      ${probe.cpImpact}`);
  console.log('  ── balance vs legacy 12 TRUE + CHAKRA_DRAIN 20% ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 2 / 4)`);
  console.log(`  base / Byakugan:    ${m.baseDamage} / ${m.modeDamage}  (was 12 / no Mode)`);
  console.log(`  2 CP / combo:       ${m.cpDamage} / ${m.comboDamage}  (was 12 + 20% drain)`);
  console.log(`  charges 3→:         ${m.chargesAfter}`);
  console.log(`  CP 3→ / chakra 20→: ${m.cpRemaining} / ${m.chakraAfter}`);
}
