/**
 * T-074 probe — Bunshin Decoy 1/−20; no SIDE weight; vs unused SPEED +20%.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applyDecoyOutgoing } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface BunshinProbe {
  authoring: boolean;
  plant: boolean;
  costs: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    decoyStacks: number;
    decoyDuration: number;
    cutFrom40: number;
    leftoverSpeed: number;
    sideWeight: number;
    apAfter: number;
    cpAfter: number;
  };
}

export function runBunshinProbe(): BunshinProbe {
  const skill = SKILLS.BUNSHIN;
  const planted = resolveSkill(
    { skill },
    {
      pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
      range: CombatRange.MEDIUM,
      turnIndex: 2,
      marks: [],
      modes: emptyModeBoard(),
      skills: [skill],
      playerBuffs: [],
      enemyHp: 80,
      pendingSupportWeights: [],
    } satisfies ResolveSkillState,
  );
  const mark = planted.ok
    ? planted.state.marks.find((m) => m.id === 'decoy')
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const leftoverSpeed =
    skill.effects?.find(
      (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED,
    )?.value ?? 0;
  const cut = planted.ok
    ? applyDecoyOutgoing(40, planted.state.marks)
    : { damage: -1, consumed: false };
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 0 &&
      skill.nextDrawRoleBonus === undefined &&
      leftoverSpeed === 0,
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      mark?.stacks === 20 &&
      mark.duration === 1 &&
      planted.state.modes.instances.length === 0 &&
      (planted.state.pendingSupportWeights ?? []).length === 0,
    costs:
      planted.ok === true &&
      planted.state.pools.ap === 5 &&
      planted.state.pools.chakra === 19 &&
      used?.readyOnTurn === 6,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      decoyStacks: mark?.stacks ?? 0,
      decoyDuration: mark?.duration ?? 0,
      cutFrom40: cut.damage,
      leftoverSpeed,
      sideWeight: skill.nextDrawRoleBonus?.delta ?? 0,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
    },
  };
}

export function printBunshinProbe(probe: BunshinProbe): void {
  const m = probe.metrics;
  console.log('\n── T-074 Bunshin probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant Decoy 20/1:       ${probe.plant}`);
  console.log(`  AP−1 CP−1 readyOn 6:    ${probe.costs}`);
  console.log('  ── balance vs unused SPEED +20%×2 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 1)`);
  console.log(`  decoy stacks×dur:       ${m.decoyStacks}×${m.decoyDuration}  (was SPEED %)`);
  console.log(`  first offensive 40:     ${m.cutFrom40}  (was 40)`);
  console.log(`  leftover SPEED / SIDE:  ${m.leftoverSpeed} / ${m.sideWeight}  (was 0.2 / 0)`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log('  ── equilibrium ──');
  console.log('  cheaper than Mist (AP1/CP1/CD3 vs 2/5/5); same −20; no SIDE weight; no Mode.');
  console.log('  Healthy academy decoy vs secret SPEED %.');
}
