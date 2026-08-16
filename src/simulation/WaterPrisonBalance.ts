/**
 * T-080 probe — Water Prison 9 MEDIUM; 70% Stun 1 + range-up lock; vs unused STUN×2 / Sweeping Kick.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
  RangeMoveDirection,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import {
  WATER_PRISON_LOCK_ID,
  voluntaryRangeIncreaseBlocked,
} from '../game/systems/RangeSystem';

export interface WaterPrisonProbe {
  authoring: boolean;
  stunOn: boolean;
  stunOff: boolean;
  missSafe: boolean;
  lockOn: boolean;
  lockOff: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    chipDamage: number;
    stunChance: number;
    stunDuration: number;
    kickChip: number;
    kickChance: number;
    leftoverStun2: boolean;
    missDamage: number;
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

export function runWaterPrisonProbe(): WaterPrisonProbe {
  const skill = SKILLS.WATER_PRISON;
  const kick = SKILLS.SWEEPING_KICK;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const win = resolveSkill({ skill }, state(), { ...hit, rng: () => 0 });
  const lose = resolveSkill({ skill }, state(), { ...hit, rng: () => 0.7 });
  const whiff = resolveSkill({ skill }, state(), { ...miss, rng: () => 0 });
  const lockMarks = win.ok ? win.state.marks : [];
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 6 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 9 &&
      skill.impactStun?.chance === 0.7 &&
      skill.impactStun.duration === 1 &&
      skill.impactStun.lockVoluntaryRangeUp === true &&
      !skill.effects?.some((e) => e.type === EffectType.STUN && e.duration === 2),
    stunOn: win.ok === true && win.damageDealt === 9 && hasStun(win.state.enemyBuffs, 1),
    stunOff: lose.ok === true && lose.damageDealt === 9 && !hasStun(lose.state.enemyBuffs, 1),
    missSafe: whiff.ok === true && whiff.damageDealt === 0 && !hasStun(whiff.state.enemyBuffs, 1),
    lockOn:
      lockMarks.some((m) => m.id === WATER_PRISON_LOCK_ID) &&
      voluntaryRangeIncreaseBlocked(lockMarks, RangeMoveDirection.RETREAT) &&
      !voluntaryRangeIncreaseBlocked(lockMarks, RangeMoveDirection.APPROACH),
    lockOff:
      lose.ok === true &&
      !lose.state.marks.some((m) => m.id === WATER_PRISON_LOCK_ID) &&
      !voluntaryRangeIncreaseBlocked(lose.state.marks, RangeMoveDirection.RETREAT),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      chipDamage: win.ok ? win.damageDealt : 0,
      stunChance: skill.impactStun?.chance ?? 0,
      stunDuration: skill.impactStun?.duration ?? 0,
      kickChip: kick.baseDamage,
      kickChance: kick.impactStun?.chance ?? 0,
      leftoverStun2:
        skill.effects?.some((e) => e.type === EffectType.STUN && e.duration === 2) === true,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
    },
  };
}

export function printWaterPrisonProbe(probe: WaterPrisonProbe): void {
  const m = probe.metrics;
  console.log('\n── T-080 Water Prison probe ──');
  console.log(`  authoring SIDE MEDIUM:  ${probe.authoring}`);
  console.log(`  hit rng 0 → Stun 1:     ${probe.stunOn}`);
  console.log(`  hit rng 0.7 → no stun:  ${probe.stunOff}`);
  console.log(`  miss clean:             ${probe.missSafe}`);
  console.log(`  lock blocks RETREAT:    ${probe.lockOn}`);
  console.log(`  no lock on stun fail:   ${probe.lockOff}`);
  console.log('  ── balance vs unused STUN×2 @0.7 / Sweeping Kick 7/40% ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 6)`);
  console.log(`  chip:                   ${m.chipDamage}  (kick ${m.kickChip}; was 9 + unused STUN 2)`);
  console.log(`  stun:                   ${m.stunChance}×${m.stunDuration}  (was unused 0.7×2; kick ${m.kickChance}×1)`);
  console.log(`  leftover STUN×2:        ${m.leftoverStun2}`);
  console.log(`  miss damage:            ${m.missDamage}`);
}
