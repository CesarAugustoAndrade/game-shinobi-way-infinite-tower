/**
 * T-102 probe — Puppet Crow ATTACK 22 M/L; Poison 4×2 + Bleed 4×2; no TRUE poison.
 */

import { CardRole, CombatRange, DamageType, EffectType, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface PuppetCrowProbe {
  authoring: boolean;
  impact: boolean;
  miss: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    poisonStacks: number;
    bleedStacks: number;
    swarmDmg: number;
    dmgPerAp: number;
  };
}

export function runPuppetCrowProbe(): PuppetCrowProbe {
  const crow = SKILLS.PUPPET_CROW;
  const swarm = SKILLS.BUG_SWARM;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [crow],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: crow.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: crow }, state(), hit);
  const whiff = resolveSkill({ skill: crow }, state(), miss);
  const ap = crow.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const poison = landed.ok ? landed.state.marks.find((m) => m.id === 'poison') : undefined;
  const bleed = landed.ok ? landed.state.marks.find((m) => m.id === 'bleed') : undefined;
  return {
    authoring:
      crow.cardRole === CardRole.ATTACK &&
      crow.apCost === 3 &&
      crow.chakraCost === 6 &&
      crow.cooldown === 4 &&
      crow.baseDamage === 22 &&
      (crow.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (crow.allowedRanges ?? []).includes(CombatRange.LONG) &&
      crow.markEffects?.some(
        (m) => m.id === 'poison' && m.stacks === 4 && m.duration === 2 && m.requireHit === true,
      ) === true &&
      crow.markEffects?.some(
        (m) => m.id === 'bleed' && m.stacks === 4 && m.duration === 2 && m.requireHit === true,
      ) === true &&
      crow.effects?.some(
        (e) => e.type === EffectType.POISON && e.value === 10 && e.damageType === DamageType.TRUE,
      ) !== true,
    impact:
      landed.ok === true &&
      landed.damageDealt === 22 &&
      poison?.stacks === 4 &&
      poison.duration === 2 &&
      poison.family === MarkFamily.DOT &&
      bleed?.stacks === 4 &&
      bleed.duration === 2 &&
      bleed.family === MarkFamily.DOT,
    miss:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'poison' || m.id === 'bleed'),
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: crow.chakraCost,
      poisonStacks: poison?.stacks ?? 0,
      bleedStacks: bleed?.stacks ?? 0,
      swarmDmg: swarm.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printPuppetCrowProbe(probe: PuppetCrowProbe): void {
  const m = probe.metrics;
  console.log('\n── T-102 Puppet Crow probe ──');
  console.log(`  authoring ATTACK 22 + poison 4×2 + bleed 4×2: ${probe.authoring}`);
  console.log(`  hit dual DoT once:                            ${probe.impact}`);
  console.log(`  miss no poison / no bleed:                    ${probe.miss}`);
  console.log('  ── balance vs mute AP2 + TRUE poison 10×3 / bleed 10×3 and Swarm 8 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 22 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 6)`);
  console.log(`  poison / bleed:     ${m.poisonStacks}×2 / ${m.bleedStacks}×2  (was mute 10×3 TRUE / 10×3)`);
  console.log(`  Swarm sibling:      ${m.swarmDmg} dmg SIDE Poison 3×3 no Bleed`);
}
