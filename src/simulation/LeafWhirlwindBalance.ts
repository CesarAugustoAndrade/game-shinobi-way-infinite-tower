/**
 * T-051 probe — Leaf Whirlwind authoring; 14 + spd_down on hit; miss clean.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface LeafWhirlwindProbe {
  authoring: boolean;
  hit: boolean;
  miss: boolean;
  metrics: {
    apCost: number;
    cooldown: number;
    hitDamage: number;
    spdStacks: number;
    spdDuration: number;
  };
}

export function runLeafWhirlwindProbe(): LeafWhirlwindProbe {
  const skill = SKILLS.LEAF_WHIRLWIND;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const landed = resolveSkill(
    { skill },
    state(),
    { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) },
  );
  const whiff = resolveSkill(
    { skill },
    state(),
    { rollHit: () => ({ hit: false as const, damage: 0 }) },
  );
  const mark = landed.ok ? landed.state.marks.find((m) => m.id === 'spd_down') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 14 &&
      skill.allowedRanges?.[0] === CombatRange.CLOSE &&
      skill.markEffects?.some(
        (m) => m.id === 'spd_down' && m.stacks === 1 && m.duration === 2 && m.family === MarkFamily.STAT,
      ) === true &&
      !skill.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.ACCURACY &&
          e.value === 0.15 &&
          e.chance === 0.3,
      ),
    hit:
      landed.ok &&
      landed.damageDealt === 14 &&
      mark?.target === CombatActor.ENEMY &&
      mark.stacks === 1 &&
      mark.duration === 2,
    miss: whiff.ok === true && whiff.damageDealt === 0 && !whiff.state.marks.some((m) => m.id === 'spd_down'),
    metrics: {
      apCost: skill.apCost ?? 0,
      cooldown: skill.cooldown,
      hitDamage: landed.ok ? landed.damageDealt : 0,
      spdStacks: mark?.stacks ?? 0,
      spdDuration: mark?.duration ?? 0,
    },
  };
}

export function printLeafWhirlwindProbe(probe: LeafWhirlwindProbe): void {
  const m = probe.metrics;
  console.log('\n── T-051 Leaf Whirlwind probe ──');
  console.log(`  authoring ATTACK:   ${probe.authoring}`);
  console.log(`  hit 14 + SPD −1×2:  ${probe.hit}`);
  console.log(`  miss no plant:      ${probe.miss}`);
  console.log('  ── balance vs legacy ACC −15% @30% ──');
  console.log(`  AP / CD:            ${m.apCost} / ${m.cooldown}  (unchanged 2 / 2)`);
  console.log(`  hit dmg:            ${m.hitDamage}  (was 14)`);
  console.log(`  SPD plant:          −${m.spdStacks} ×${m.spdDuration}  (was ACC −15% @30%)`);
}
