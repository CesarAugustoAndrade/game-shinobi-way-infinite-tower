/**
 * T-070 probe — Senbon Rain 4×2 M/L + Poison 3×2 once; vs 6 + POISON 20%×5.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SenbonRainProbe {
  authoring: boolean;
  poison: boolean;
  once: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    hitCount: number;
    baseDamage: number;
    fourHitDamage: number;
    oneHitDamage: number;
    missDamage: number;
    poisonStacks: number;
    poisonDuration: number;
    leftoverChance: number;
  };
}

export function runSenbonRainProbe(): SenbonRainProbe {
  const skill = SKILLS.SENBON_RAIN;
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
  const hit = { rollHit: () => ({ hit: true, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false, damage: 0 }) };
  let n = 0;
  const oneHit = {
    rollHit: () => {
      n += 1;
      return n === 1
        ? { hit: true, damage: skill.baseDamage }
        : { hit: false, damage: 0 };
    },
  };
  const full = resolveSkill({ skill }, state(), hit);
  const single = resolveSkill({ skill }, state(), oneHit);
  const whiff = resolveSkill({ skill }, state(), miss);
  const leftoverChance =
    skill.effects?.find((e) => e.type === EffectType.POISON)?.chance ?? 0;
  const mark = full.ok
    ? full.state.marks.find((m) => m.id === 'poison')
    : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 3 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 2 &&
      skill.hitCount === 4 &&
      leftoverChance === 0,
    poison:
      single.ok === true &&
      single.hitsLanded === 1 &&
      single.state.marks.some(
        (m) =>
          m.id === 'poison' &&
          m.stacks === 3 &&
          m.duration === 2 &&
          m.family === MarkFamily.DOT,
      ) &&
      whiff.ok === true &&
      !whiff.state.marks.some((m) => m.id === 'poison'),
    once:
      full.ok === true &&
      full.hitsLanded === 4 &&
      full.damageDealt === 8 &&
      full.state.marks.filter((m) => m.id === 'poison').length === 1 &&
      mark?.stacks === 3,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      hitCount: skill.hitCount ?? 1,
      baseDamage: skill.baseDamage,
      fourHitDamage: full.ok ? full.damageDealt : -1,
      oneHitDamage: single.ok ? single.damageDealt : -1,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      poisonStacks: mark?.stacks ?? 0,
      poisonDuration: mark?.duration ?? 0,
      leftoverChance,
    },
  };
}

export function printSenbonRainProbe(probe: SenbonRainProbe): void {
  const m = probe.metrics;
  console.log('\n── T-070 Senbon Rain probe ──');
  console.log(`  authoring SIDE 4×2:     ${probe.authoring}`);
  console.log(`  any-hit poison / miss:  ${probe.poison}`);
  console.log(`  once-per-card 3 stacks: ${probe.once}`);
  console.log('  ── balance vs 6 + POISON 5×3 @20% ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 3)`);
  console.log(`  package:                ${m.hitCount}×${m.baseDamage}  (was 1×6 five-hit flavor)`);
  console.log(`  4-hit / 1-hit / miss:   ${m.fourHitDamage} / ${m.oneHitDamage} / ${m.missDamage}`);
  console.log(`  poison plant:           ${m.poisonStacks}×${m.poisonDuration}  (was 20% ×5×3)`);
  console.log(`  leftover POISON chance: ${m.leftoverChance}  (was 0.2)`);
  console.log('  ── equilibrium ──');
  console.log('  new EV if all hit: 8 + guaranteed Poison 3×2 vs old 6 + EV 1 poison tick.');
  console.log('  Healthy: more chip if 4 connect, honest guaranteed DoT, once per card.');
}
