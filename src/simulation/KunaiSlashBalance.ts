/**
 * T-048 probe — Kunai Slash authoring; 8 + Bleed 3×2 on hit; miss clean.
 */

import { CardRole, CombatActor, CombatRange, EffectType, MarkFamily, SkillTag } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface KunaiSlashProbe {
  authoring: boolean;
  hit: boolean;
  miss: boolean;
  metrics: {
    apCost: number;
    cooldown: number;
    hitDamage: number;
    bleedStacks: number;
    bleedDuration: number;
  };
}

export function runKunaiSlashProbe(): KunaiSlashProbe {
  const skill = SKILLS.KUNAI_SLASH;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const landed = resolveSkill(
    { skill },
    state(),
    { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) },
  );
  const whiff = resolveSkill(
    { skill },
    state(),
    { rollHit: () => ({ hit: false as const, damage: 0 }) },
  );
  const bleed = landed.ok ? landed.state.marks.find((m) => m.id === 'bleed') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 1 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 1 &&
      skill.baseDamage === 8 &&
      skill.allowedRanges?.[0] === CombatRange.CLOSE &&
      skill.tags?.includes(SkillTag.TOOL) === true &&
      skill.markEffects?.some((m) => m.id === 'bleed' && m.stacks === 3 && m.duration === 2 && m.family === MarkFamily.DOT) ===
        true &&
      !skill.effects?.some((e) => e.type === EffectType.BLEED && e.value === 5 && e.chance === 0.25),
    hit:
      landed.ok &&
      landed.damageDealt === 8 &&
      bleed?.target === CombatActor.ENEMY &&
      bleed.stacks === 3 &&
      bleed.duration === 2,
    miss: whiff.ok === true && whiff.damageDealt === 0 && !whiff.state.marks.some((m) => m.id === 'bleed'),
    metrics: {
      apCost: skill.apCost ?? 0,
      cooldown: skill.cooldown,
      hitDamage: landed.ok ? landed.damageDealt : 0,
      bleedStacks: bleed?.stacks ?? 0,
      bleedDuration: bleed?.duration ?? 0,
    },
  };
}

export function printKunaiSlashProbe(probe: KunaiSlashProbe): void {
  const m = probe.metrics;
  console.log('\n── T-048 Kunai Slash probe ──');
  console.log(`  authoring SIDE:     ${probe.authoring}`);
  console.log(`  hit 8 + Bleed 3×2:  ${probe.hit}`);
  console.log(`  miss no plant:      ${probe.miss}`);
  console.log('  ── balance vs legacy AP2 + 25% Bleed 5 ──');
  console.log(`  AP / CD:            ${m.apCost} / ${m.cooldown}  (was 2 / 1)`);
  console.log(`  hit dmg:            ${m.hitDamage}  (was 8)`);
  console.log(`  bleed:              ${m.bleedStacks}×${m.bleedDuration}  (was 25% ×5)`);
}
