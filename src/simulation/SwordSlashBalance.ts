/**
 * T-059 probe — Sword Slash authoring; 10 + Bleed 4×2 on hit; miss clean.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  SkillTag,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SwordSlashProbe {
  authoring: boolean;
  hit: boolean;
  miss: boolean;
  mediumIllegal: boolean;
  metrics: {
    apCost: number;
    hitDamage: number;
    bleedStacks: number;
    bleedDuration: number;
    missDamage: number;
  };
}

export function runSwordSlashProbe(): SwordSlashProbe {
  const skill = SKILLS.SWORD_SLASH;
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
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 2 &&
      skill.cooldown === 1 &&
      skill.baseDamage === 10 &&
      skill.tags?.includes(SkillTag.WEAPON) === true &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'bleed' &&
          m.stacks === 4 &&
          m.duration === 2 &&
          m.family === MarkFamily.DOT,
      ) === true &&
      !skill.effects?.some((e) => e.type === EffectType.BLEED && e.value === 7 && e.chance === 0.3),
    hit:
      landed.ok === true &&
      landed.damageDealt === 10 &&
      bleed?.target === CombatActor.ENEMY &&
      bleed.stacks === 4 &&
      bleed.duration === 2,
    miss:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'bleed'),
    mediumIllegal: mid.ok === false,
    metrics: {
      apCost: skill.apCost ?? 0,
      hitDamage: landed.ok ? landed.damageDealt : 0,
      bleedStacks: bleed?.stacks ?? 0,
      bleedDuration: bleed?.duration ?? 0,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
    },
  };
}

export function printSwordSlashProbe(probe: SwordSlashProbe): void {
  const m = probe.metrics;
  console.log('\n── T-059 Sword Slash probe ──');
  console.log(`  authoring ATTACK 10:    ${probe.authoring}`);
  console.log(`  hit 10 + Bleed 4×2:     ${probe.hit}`);
  console.log(`  miss no plant:          ${probe.miss}`);
  console.log(`  MEDIUM illegal:         ${probe.mediumIllegal}`);
  console.log('  ── balance vs legacy 30% Bleed 7 ──');
  console.log(`  AP:                     ${m.apCost}  (was 2)`);
  console.log(`  chip:                   ${m.hitDamage}  (was 10)`);
  console.log(`  bleed plant:            ${m.bleedStacks}×${m.bleedDuration}  (was 0 under resolve / 30% of 7)`);
  console.log(`  miss damage:            ${m.missDamage}`);
}
