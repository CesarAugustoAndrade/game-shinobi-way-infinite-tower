/**
 * T-131 probe — C4 Karura ATTACK delayed 35 TRUE at next enemy opportunity; vs unused instant 17.
 */

import { CardRole, CombatRange, DamageType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import {
  C4_MARK_ID,
  resolveC4AtEnemyOpportunity,
  stripC4,
} from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface C4KaruraProbe {
  authoring: boolean;
  plant: boolean;
  helper: boolean;
  strip: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    cooldown: number;
    baseDamage: number;
    castDamage: number;
    delayedTrue: number;
    unarmedTrue: number;
    leftoverInstant17: boolean;
    duration: number;
    stacks: number;
    apAfter: number;
    cpAfter: number;
  };
}

export function runC4KaruraProbe(): C4KaruraProbe {
  const skill = SKILLS.C4_KARURA;
  const hit = { rollHit: () => ({ hit: true, damage: 0 }) };
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
    hit,
  );
  const mark = planted.ok
    ? planted.state.marks.find((m) => m.id === C4_MARK_ID)
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const fired = planted.ok
    ? resolveC4AtEnemyOpportunity(planted.state.marks)
    : { trueDamage: -1, fired: false, marks: [] };
  const unarmed = resolveC4AtEnemyOpportunity([]);
  const stripped = planted.ok
    ? stripC4(planted.state.marks)
    : { stripped: false, marks: [] };
  const afterStrip = resolveC4AtEnemyOpportunity(stripped.marks);
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 5 &&
      skill.chakraCost === 18 &&
      skill.cooldown === 6 &&
      skill.baseDamage === 0 &&
      skill.scalingPerPoint === 0 &&
      skill.damageType === DamageType.TRUE &&
      skill.modeInteraction === undefined &&
      skill.markEffects?.some(
        (m) =>
          m.id === C4_MARK_ID &&
          m.duration === 1 &&
          m.stacks === 35 &&
          m.targetActor === 'enemy',
      ) === true,
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      mark?.duration === 1 &&
      mark.stacks === 35 &&
      planted.state.enemyHp === 80 &&
      used?.readyOnTurn === 9,
    helper: fired.trueDamage === 35 && fired.fired === true && unarmed.trueDamage === 0,
    strip: stripped.stripped === true && afterStrip.fired === false && afterStrip.trueDamage === 0,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      cooldown: skill.cooldown,
      baseDamage: skill.baseDamage,
      castDamage: planted.ok ? planted.damageDealt : -1,
      delayedTrue: fired.trueDamage,
      unarmedTrue: unarmed.trueDamage,
      leftoverInstant17: skill.baseDamage === 17,
      duration: mark?.duration ?? 0,
      stacks: mark?.stacks ?? 0,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
    },
  };
}

export function printC4KaruraProbe(probe: C4KaruraProbe): void {
  const m = probe.metrics;
  console.log('\n── T-131 C4 Karura probe ──');
  console.log(`  authoring ATTACK C4 1 not instant 17: ${probe.authoring}`);
  console.log(`  plant enemy duration 1 stacks 35 dmg 0: ${probe.plant}`);
  console.log(`  opportunity 35 TRUE + unarmed 0:        ${probe.helper}`);
  console.log(`  strip without fire:                     ${probe.strip}`);
  console.log('  ── balance vs unused instant TRUE 17 ──');
  console.log(`  AP / CP / CD:           ${m.apCost} / ${m.chakraCost} / ${m.cooldown}  (was 2 / 18 / 6)`);
  console.log(`  cast damage:            ${m.castDamage}  (was 17 instant TRUE)`);
  console.log(`  leftover base 17:       ${m.leftoverInstant17}`);
  console.log(`  delayed TRUE:           ${m.delayedTrue}  (was 0 delayed / 17 now)`);
  console.log(`  C4 stacks×dur:          ${m.stacks}×${m.duration}`);
  console.log(`  unarmed opportunity:    ${m.unarmedTrue}`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log('  ── equilibrium ──');
  console.log('  Delayed 35 TRUE finisher vs instant 17. Healthier honesty; stronger if it survives to enemy opportunity, weaker if cleansed or the fight ends first. AP 5 is a steep plant cost.');
}
