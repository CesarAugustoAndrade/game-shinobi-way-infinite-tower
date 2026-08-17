/**
 * T-095 probe — Great Breakthrough ATTACK 16; PUSH 1; +20% Setup if band changes.
 */

import { CardRole, CombatRange, EffectType, PrimaryStat } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface GreatBreakthroughProbe {
  authoring: boolean;
  movedBonus: boolean;
  longBoundary: boolean;
  metrics: {
    baseDamage: number;
    movedDamage: number;
    longDamage: number;
    apCost: number;
    chakraCost: number;
    airBulletDmg: number;
    dmgPerApMoved: number;
    dmgPerApLong: number;
  };
}

export function runGreatBreakthroughProbe(): GreatBreakthroughProbe {
  const gust = SKILLS.GREAT_BREAKTHROUGH;
  const bullet = SKILLS.AIR_BULLET;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [gust],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: true,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: gust.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const moved = resolveSkill({ skill: gust }, state(), hit);
  const atLong = resolveSkill({ skill: gust }, state({ range: CombatRange.LONG }), hit);
  const whiff = resolveSkill({ skill: gust }, state(), miss);
  const ap = gust.apCost ?? 0;
  const movedDmg = moved.ok ? moved.damageDealt : 0;
  const longDmg = atLong.ok ? atLong.damageDealt : 0;
  return {
    authoring:
      gust.id === 'great_breakthrough' &&
      gust.cardRole === CardRole.ATTACK &&
      gust.apCost === 3 &&
      gust.chakraCost === 5 &&
      gust.cooldown === 3 &&
      gust.baseDamage === 16 &&
      (gust.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (gust.allowedRanges ?? []).includes(CombatRange.LONG) &&
      gust.bandMove?.kind === 'PUSH' &&
      gust.bandMove.requireHit === true &&
      gust.setupMultIfBandMoved === 0.2 &&
      gust.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.ACCURACY &&
          e.value === 0.25,
      ) !== true,
    movedBonus:
      moved.ok === true &&
      moved.damageDealt === Math.floor(16 * 1.2) &&
      moved.state.range === CombatRange.LONG &&
      moved.state.playerMoveUsedThisTurn === true,
    longBoundary:
      atLong.ok === true &&
      atLong.damageDealt === 16 &&
      atLong.state.range === CombatRange.LONG &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.range === CombatRange.MEDIUM,
    metrics: {
      baseDamage: gust.baseDamage,
      movedDamage: movedDmg,
      longDamage: longDmg,
      apCost: ap,
      chakraCost: gust.chakraCost,
      airBulletDmg: bullet.baseDamage,
      dmgPerApMoved: ap > 0 ? movedDmg / ap : 0,
      dmgPerApLong: ap > 0 ? longDmg / ap : 0,
    },
  };
}

export function printGreatBreakthroughProbe(probe: GreatBreakthroughProbe): void {
  const m = probe.metrics;
  console.log('\n── T-095 Great Breakthrough probe ──');
  console.log(`  authoring ATTACK 16 + PUSH + Setup 0.2: ${probe.authoring}`);
  console.log(`  MEDIUM hit floor(16*1.2) → LONG:        ${probe.movedBonus}`);
  console.log(`  LONG hit 16 no move / miss no PUSH:     ${probe.longBoundary}`);
  console.log('  ── balance vs legacy AP2 + ACC −25% and Air Bullet 13 PUSH ──');
  console.log(`  dmg moved / LONG:   ${m.movedDamage} / ${m.longDamage}  (was mute 16 / 16)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 5)`);
  console.log(`  dmg/AP moved / LONG:${m.dmgPerApMoved.toFixed(2)} / ${m.dmgPerApLong.toFixed(2)}  (was 8.00)`);
  console.log(`  Air Bullet sibling: ${m.airBulletDmg} dmg PUSH no Setup`);
}
