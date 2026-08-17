/**
 * T-103 probe — Water Vortex ATTACK 20 M/L; PUSH 1; −2 SPD×2; no SPEED %.
 */

import { CardRole, CombatRange, EffectType, MarkFamily, PrimaryStat } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface WaterVortexProbe {
  authoring: boolean;
  mediumPush: boolean;
  longMiss: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    spdStacks: number;
    bulletDmg: number;
    dmgPerAp: number;
  };
}

export function runWaterVortexProbe(): WaterVortexProbe {
  const vortex = SKILLS.WATER_VORTEX;
  const bullet = SKILLS.AIR_BULLET;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [vortex],
    playerBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: vortex.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const pushed = resolveSkill({ skill: vortex }, state(), hit);
  const atLong = resolveSkill({ skill: vortex }, state({ range: CombatRange.LONG }), hit);
  const whiff = resolveSkill({ skill: vortex }, state(), miss);
  const ap = vortex.apCost ?? 0;
  const dmg = pushed.ok ? pushed.damageDealt : 0;
  const spd = pushed.ok ? pushed.state.marks.find((m) => m.id === 'spd_down') : undefined;
  return {
    authoring:
      vortex.cardRole === CardRole.ATTACK &&
      vortex.apCost === 4 &&
      vortex.chakraCost === 8 &&
      vortex.cooldown === 5 &&
      vortex.baseDamage === 20 &&
      (vortex.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (vortex.allowedRanges ?? []).includes(CombatRange.LONG) &&
      vortex.bandMove?.kind === 'PUSH' &&
      vortex.bandMove.steps === 1 &&
      vortex.bandMove.requireHit === true &&
      vortex.markEffects?.some(
        (m) => m.id === 'spd_down' && m.stacks === 2 && m.duration === 2 && m.requireHit === true,
      ) === true &&
      vortex.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.SPEED &&
          e.value === 0.4,
      ) !== true,
    mediumPush:
      pushed.ok === true &&
      pushed.damageDealt === 20 &&
      pushed.state.range === CombatRange.LONG &&
      pushed.state.playerMoveUsedThisTurn === true &&
      spd?.stacks === 2 &&
      spd.duration === 2 &&
      spd.family === MarkFamily.STAT,
    longMiss:
      atLong.ok === true &&
      atLong.state.range === CombatRange.LONG &&
      atLong.state.marks.some((m) => m.id === 'spd_down') &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.range === CombatRange.MEDIUM &&
      !whiff.state.marks.some((m) => m.id === 'spd_down'),
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: vortex.chakraCost,
      spdStacks: spd?.stacks ?? 0,
      bulletDmg: bullet.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printWaterVortexProbe(probe: WaterVortexProbe): void {
  const m = probe.metrics;
  console.log('\n── T-103 Water Vortex probe ──');
  console.log(`  authoring ATTACK 20 + PUSH + spd_down 2×2: ${probe.authoring}`);
  console.log(`  MEDIUM→LONG + −2 SPD no move spend:        ${probe.mediumPush}`);
  console.log(`  LONG stay + miss clean:                    ${probe.longMiss}`);
  console.log('  ── balance vs mute AP2 + SPEED −40%×3 and Air Bullet 13 PUSH ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 20 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 8)`);
  console.log(`  SPD stacks / dur:   ${m.spdStacks} / 2  (was mute SPEED −40%×3)`);
  console.log(`  Air Bullet sibling: ${m.bulletDmg} dmg SIDE PUSH no SPD`);
}
