/**
 * T-081 probe — 1000 Years 9 CLOSE; independent 45% Stun/Confusion; vs unused 100%/60%×2.
 */

import { CardRole, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ThousandYearsProbe {
  authoring: boolean;
  damage: boolean;
  confusionOnly: boolean;
  stunOnly: boolean;
  both: boolean;
  neither: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    chipDamage: number;
    stunChance: number;
    confusionChance: number;
    pBoth: number;
    pAtLeastOne: number;
    leftoverStun100: boolean;
    leftoverConfusion2: boolean;
  };
}

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

function hasEffect(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  type: EffectType,
  duration: number,
): boolean {
  return (buffs ?? []).some((b) => b.effect.type === type && b.duration === duration);
}

export function runThousandYearsProbe(): ThousandYearsProbe {
  const skill = SKILLS.THOUSAND_YEARS;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
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
  const landed = resolveSkill({ skill }, state(), { ...hit, rng: seqRng([0.99, 0.99]) });
  const whiff = resolveSkill({ skill }, state(), { ...miss, rng: seqRng([0, 0]) });
  const confusionOnly = resolveSkill({ skill }, state(), { ...hit, rng: seqRng([0, 0.45]) });
  const stunOnly = resolveSkill({ skill }, state(), { ...hit, rng: seqRng([0.45, 0]) });
  const both = resolveSkill({ skill }, state(), { ...hit, rng: seqRng([0, 0]) });
  const neither = resolveSkill({ skill }, state(), { ...hit, rng: seqRng([0.45, 0.45]) });
  const stunP = skill.impactStun?.chance ?? 0;
  const confP = skill.controlConfusion?.chance ?? 0;
  return {
    authoring:
      skill.id === '1000_years' &&
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 9 &&
      skill.impactStun?.chance === 0.45 &&
      skill.impactStun.duration === 1 &&
      skill.controlConfusion?.chance === 0.45 &&
      skill.controlConfusion.enemyDuration === 1 &&
      !skill.effects?.some((e) => e.type === EffectType.STUN && e.chance === 1) &&
      !skill.effects?.some((e) => e.type === EffectType.CONFUSION && e.duration === 2),
    damage:
      landed.ok === true &&
      landed.damageDealt === 9 &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !hasEffect(whiff.state.enemyBuffs, EffectType.STUN, 1),
    confusionOnly:
      confusionOnly.ok === true &&
      hasEffect(confusionOnly.state.enemyBuffs, EffectType.CONFUSION, 1) &&
      !hasEffect(confusionOnly.state.enemyBuffs, EffectType.STUN, 1),
    stunOnly:
      stunOnly.ok === true &&
      hasEffect(stunOnly.state.enemyBuffs, EffectType.STUN, 1) &&
      !hasEffect(stunOnly.state.enemyBuffs, EffectType.CONFUSION, 1),
    both:
      both.ok === true &&
      hasEffect(both.state.enemyBuffs, EffectType.STUN, 1) &&
      hasEffect(both.state.enemyBuffs, EffectType.CONFUSION, 1),
    neither:
      neither.ok === true &&
      !hasEffect(neither.state.enemyBuffs, EffectType.STUN, 1) &&
      !hasEffect(neither.state.enemyBuffs, EffectType.CONFUSION, 1),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      chipDamage: landed.ok ? landed.damageDealt : 0,
      stunChance: stunP,
      confusionChance: confP,
      pBoth: stunP * confP,
      pAtLeastOne: 1 - (1 - stunP) * (1 - confP),
      leftoverStun100: skill.effects?.some((e) => e.type === EffectType.STUN && e.chance === 1) === true,
      leftoverConfusion2:
        skill.effects?.some((e) => e.type === EffectType.CONFUSION && e.duration === 2) === true,
    },
  };
}

export function printThousandYearsProbe(probe: ThousandYearsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-081 1000 Years probe ──');
  console.log(`  authoring SIDE CLOSE:   ${probe.authoring}`);
  console.log(`  hit 9 / miss 0:         ${probe.damage}`);
  console.log(`  confusion-only:         ${probe.confusionOnly}`);
  console.log(`  stun-only:              ${probe.stunOnly}`);
  console.log(`  both / neither:         ${probe.both} / ${probe.neither}`);
  console.log('  ── balance vs unused STUN 100% + CONFUSION 60%×2 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 1)`);
  console.log(`  chip:                   ${m.chipDamage}  (was 9 + guaranteed stun)`);
  console.log(
    `  stun / conf / both:     ${m.stunChance} / ${m.confusionChance} / ${m.pBoth.toFixed(3)}  (was 1.0 / 0.6×2 / 0.6)`,
  );
  console.log(`  P(≥1 control):          ${m.pAtLeastOne.toFixed(3)}  (was 1.0)`);
  console.log(`  leftover 100% / ×2:     ${m.leftoverStun100} / ${m.leftoverConfusion2}`);
}
