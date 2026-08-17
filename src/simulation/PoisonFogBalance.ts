/**
 * T-106 probe — Poison Fog SIDE 9 M/L; Poison 6×3; +1 duration if Mist.
 */

import { CardRole, CombatActor, CombatRange, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface PoisonFogProbe {
  authoring: boolean;
  basePoison: boolean;
  mistBonus: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    poisonStacks: number;
    poisonDur: number;
    mistDur: number;
    swarmPoisonTotal: number;
    dmgPerAp: number;
  };
}

export function runPoisonFogProbe(): PoisonFogProbe {
  const fog = SKILLS.POISON_FOG;
  const swarm = SKILLS.BUG_SWARM;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fog],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const mist = {
    id: 'mist',
    sourceSkillId: 'hidden_mist',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 20,
    family: MarkFamily.STAT,
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: fog.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const base = resolveSkill({ skill: fog }, state(), hit);
  const misted = resolveSkill({ skill: fog }, state({ marks: [mist] }), hit);
  const whiff = resolveSkill({ skill: fog }, state({ marks: [mist] }), miss);
  const ap = fog.apCost ?? 0;
  const dmg = base.ok ? base.damageDealt : 0;
  const poison = base.ok ? base.state.marks.find((m) => m.id === 'poison') : undefined;
  const mistPoison = misted.ok ? misted.state.marks.find((m) => m.id === 'poison') : undefined;
  return {
    authoring:
      fog.cardRole === CardRole.SIDE_ATTACK &&
      fog.apCost === 2 &&
      fog.chakraCost === 5 &&
      fog.cooldown === 3 &&
      fog.baseDamage === 9 &&
      fog.markEffects?.some(
        (m) =>
          m.id === 'poison' &&
          m.stacks === 6 &&
          m.duration === 3 &&
          m.durationBonusIfEnemyMark?.markId === 'mist' &&
          m.durationBonusIfEnemyMark.bonus === 1,
      ) === true,
    basePoison: base.ok === true && dmg === 9 && poison?.stacks === 6 && poison.duration === 3,
    mistBonus:
      misted.ok === true &&
      mistPoison?.stacks === 6 &&
      mistPoison.duration === 4 &&
      misted.state.marks.some((m) => m.id === 'mist') &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !(whiff.state.marks ?? []).some((m) => m.id === 'poison'),
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: fog.chakraCost,
      poisonStacks: poison?.stacks ?? 0,
      poisonDur: poison?.duration ?? 0,
      mistDur: mistPoison?.duration ?? 0,
      swarmPoisonTotal: (swarm.markEffects?.find((m) => m.id === 'poison')?.stacks ?? 0) *
        (swarm.markEffects?.find((m) => m.id === 'poison')?.duration ?? 0),
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printPoisonFogProbe(probe: PoisonFogProbe): void {
  const m = probe.metrics;
  console.log('\n── T-106 Poison Fog probe ──');
  console.log(`  authoring SIDE 9 + Poison 6×3 mist +1: ${probe.authoring}`);
  console.log(`  hit no mist 9 + Poison 6×3:            ${probe.basePoison}`);
  console.log(`  mist → duration 4 / miss no plant:     ${probe.mistBonus}`);
  console.log('  ── balance vs mute TRUE 18×4 and Bug Swarm Poison 3×3 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 9 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 5)`);
  console.log(`  live poison:        ${m.poisonStacks}×${m.poisonDur}  (was mute TRUE 18×4; mist ${m.mistDur})`);
  console.log(`  Swarm sibling:      ${m.swarmPoisonTotal} poison package SIDE 8 drain`);
}
