/**
 * T-078 probe — Demon Slash 15 CLOSE + Bleed 6×3; vs Sword Slash 10/4×2 and unused BLEED 15.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  DamageProperty,
  EffectType,
  MarkFamily,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface DemonSlashProbe {
  authoring: boolean;
  hit: boolean;
  missCosts: boolean;
  mediumIllegal: boolean;
  metrics: {
    apCost: number;
    hitDamage: number;
    bleedStacks: number;
    bleedDuration: number;
    bleedPackage: number;
    swordChip: number;
    swordBleedPackage: number;
    dmgPerAp: number;
    missDamage: number;
    apAfterMiss: number;
    leftoverPiercing: boolean;
    leftoverBleed15: boolean;
  };
}

export function runDemonSlashProbe(): DemonSlashProbe {
  const skill = SKILLS.DEMON_SLASH;
  const sword = SKILLS.SWORD_SLASH;
  const state = (range: CombatRange): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill }, state(CombatRange.CLOSE), hit);
  const whiff = resolveSkill({ skill }, state(CombatRange.CLOSE), miss);
  const mid = resolveSkill({ skill }, state(CombatRange.MEDIUM), hit);
  const bleed = landed.ok ? landed.state.marks.find((m) => m.id === 'bleed') : undefined;
  const swordBleed = sword.markEffects?.find((m) => m.id === 'bleed');
  const chip = landed.ok ? landed.damageDealt : 0;
  const apCost = skill.apCost ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 3 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 15 &&
      skill.damageProperty === DamageProperty.NORMAL &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'bleed' &&
          m.stacks === 6 &&
          m.duration === 3 &&
          m.family === MarkFamily.DOT &&
          m.perHit === true,
      ) === true &&
      !skill.effects?.some((e) => e.type === EffectType.BLEED),
    hit:
      landed.ok === true &&
      landed.damageDealt === 15 &&
      bleed?.target === CombatActor.ENEMY &&
      bleed.stacks === 6 &&
      bleed.duration === 3,
    missCosts:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'bleed') &&
      whiff.state.pools.ap === 3,
    mediumIllegal: mid.ok === false,
    metrics: {
      apCost,
      hitDamage: chip,
      bleedStacks: bleed?.stacks ?? 0,
      bleedDuration: bleed?.duration ?? 0,
      bleedPackage: (bleed?.stacks ?? 0) * (bleed?.duration ?? 0),
      swordChip: sword.baseDamage,
      swordBleedPackage: (swordBleed?.stacks ?? 0) * (swordBleed?.duration ?? 0),
      dmgPerAp: apCost > 0 ? chip / apCost : 0,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      apAfterMiss: whiff.ok ? whiff.state.pools.ap : -1,
      leftoverPiercing: skill.damageProperty === DamageProperty.PIERCING,
      leftoverBleed15:
        skill.effects?.some((e) => e.type === EffectType.BLEED && e.value === 15) === true,
    },
  };
}

export function printDemonSlashProbe(probe: DemonSlashProbe): void {
  const m = probe.metrics;
  console.log('\n── T-078 Demon Slash probe ──');
  console.log(`  authoring ATTACK 15:    ${probe.authoring}`);
  console.log(`  hit 15 + Bleed 6×3:     ${probe.hit}`);
  console.log(`  miss no plant AP−3:     ${probe.missCosts}`);
  console.log(`  MEDIUM illegal:         ${probe.mediumIllegal}`);
  console.log('  ── balance vs Sword Slash 10/4×2 / unused BLEED 15 + PIERCING ──');
  console.log(`  AP:                     ${m.apCost}  (sword ${SKILLS.SWORD_SLASH.apCost ?? 0}; was 2)`);
  console.log(`  chip:                   ${m.hitDamage}  (sword ${m.swordChip}; was 15 + unused BLEED 15)`);
  console.log(`  dmg/AP:                 ${m.dmgPerAp.toFixed(1)}  (sword ${(m.swordChip / 2).toFixed(1)})`);
  console.log(
    `  bleed package:          ${m.bleedStacks}×${m.bleedDuration}=${m.bleedPackage}  (sword ${m.swordBleedPackage}; was unused 15×3)`,
  );
  console.log(`  leftover PIERCING / 15: ${m.leftoverPiercing} / ${m.leftoverBleed15}`);
  console.log(`  miss dmg / AP after:    ${m.missDamage} / ${m.apAfterMiss}`);
}
