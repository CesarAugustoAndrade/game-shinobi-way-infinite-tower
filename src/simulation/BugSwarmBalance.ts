/**
 * T-091 probe — Bug Swarm SIDE 8; hit drain 6 + Poison 3×3; miss no package.
 */

import { CardRole, CombatRange, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface BugSwarmProbe {
  authoring: boolean;
  impact: boolean;
  miss: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    drain: number;
    poisonStacks: number;
    poisonDuration: number;
    rainPoisonTotal: number;
    dmgPerAp: number;
  };
}

export function runBugSwarmProbe(): BugSwarmProbe {
  const swarm = SKILLS.BUG_SWARM;
  const rain = SKILLS.SENBON_RAIN;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [swarm],
    playerBuffs: [],
    enemyHp: 80,
    enemyChakra: 20,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: swarm.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: swarm }, state(), hit);
  const whiff = resolveSkill({ skill: swarm }, state(), miss);
  const poison = landed.ok ? landed.state.marks.find((m) => m.id === 'poison') : undefined;
  const rainPoison = rain.markEffects?.find((m) => m.id === 'poison');
  const rainPoisonTotal = (rainPoison?.stacks ?? 0) * (rainPoison?.duration ?? 0);
  const drain = landed.ok ? 20 - (landed.state.enemyChakra ?? 20) : 0;
  const ap = swarm.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  return {
    authoring:
      swarm.cardRole === CardRole.SIDE_ATTACK &&
      swarm.apCost === 2 &&
      swarm.chakraCost === 6 &&
      swarm.cooldown === 4 &&
      swarm.baseDamage === 8 &&
      (swarm.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (swarm.allowedRanges ?? []).includes(CombatRange.LONG) &&
      swarm.impactChakraDrain === 6 &&
      swarm.markEffects?.some(
        (m) =>
          m.id === 'poison' &&
          m.stacks === 3 &&
          m.duration === 3 &&
          m.family === MarkFamily.DOT &&
          m.requireHit === true,
      ) === true,
    impact:
      landed.ok === true &&
      landed.damageDealt === 8 &&
      landed.state.enemyChakra === 14 &&
      poison?.stacks === 3 &&
      poison.duration === 3 &&
      poison.family === MarkFamily.DOT,
    miss:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.enemyChakra === 20 &&
      !whiff.state.marks.some((m) => m.id === 'poison'),
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: swarm.chakraCost,
      drain,
      poisonStacks: poison?.stacks ?? 0,
      poisonDuration: poison?.duration ?? 0,
      rainPoisonTotal,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printBugSwarmProbe(probe: BugSwarmProbe): void {
  const m = probe.metrics;
  console.log('\n── T-091 Bug Swarm probe ──');
  console.log(`  authoring SIDE 8 + drain 6 + Poison 3×3: ${probe.authoring}`);
  console.log(`  hit drain+poison:                       ${probe.impact}`);
  console.log(`  miss no package:                         ${probe.miss}`);
  console.log('  ── balance vs legacy mute drain 25 / Poison 8×3 and Senbon Rain 3×2 ──');
  console.log(`  dmg / AP:                 ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 8 / 2)`);
  console.log(`  CP cost:                  ${m.chakraCost}  (unchanged 6)`);
  console.log(`  live drain:               ${m.drain}  (was mute 25)`);
  console.log(`  poison package:           ${m.poisonStacks}×${m.poisonDuration}  (was mute 8×3; Rain ${m.rainPoisonTotal})`);
}
