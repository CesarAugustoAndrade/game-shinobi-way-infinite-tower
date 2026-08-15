/**
 * T-065 probe — Brace plant Shield 20/1; AP1 CP0; vs legacy WIL +30%.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
  MarkFamily,
  Posture,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface BraceProbe {
  authoring: boolean;
  plant: boolean;
  costs: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    shieldStacks: number;
    shieldDuration: number;
    apAfter: number;
    cpAfter: number;
    readyOnTurn: number;
  };
}

export function runBraceProbe(): BraceProbe {
  const skill = SKILLS.BRACE;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const planted = resolveSkill({ skill }, state());
  const shield = planted.ok
    ? planted.state.marks.find((m) => m.id === 'brace_shield')
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 0 &&
      skill.stanceShift === Posture.DEFENSIVE &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'brace_shield' &&
          m.stacks === 20 &&
          m.duration === 1 &&
          m.family === MarkFamily.SHIELD,
      ) === true &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.WILLPOWER,
      ),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      shield?.stacks === 20 &&
      shield.duration === 1,
    costs:
      planted.ok === true &&
      planted.state.pools.ap === 5 &&
      planted.state.pools.chakra === 20 &&
      used?.readyOnTurn === 6,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      shieldStacks: shield?.stacks ?? 0,
      shieldDuration: shield?.duration ?? 0,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
      readyOnTurn: used?.readyOnTurn ?? -1,
    },
  };
}

export function printBraceProbe(probe: BraceProbe): void {
  const m = probe.metrics;
  console.log('\n── T-065 Brace probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant Shield 20/1:      ${probe.plant}`);
  console.log(`  AP−1 CP0 readyOn 6:     ${probe.costs}`);
  console.log('  ── balance vs legacy WIL +30%×1 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 0)`);
  console.log(`  plant dmg / shield:     ${m.plantDamage} / ${m.shieldStacks}×${m.shieldDuration}  (was 0 / unused WIL %)`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log(`  readyOnTurn:            ${m.readyOnTurn}  (T=2 CD=3 → 6)`);
}
