/**
 * T-042 probe — Mind Destruction authoring; baseline 15; Read Mind Setup +50% no consume.
 */

import { CardRole, CombatActor, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface MindDestructionProbe {
  authoring: boolean;
  baseline: boolean;
  setupRead: boolean;
  metrics: {
    baseDamage: number;
    setupDamage: number;
    apCost: number;
    chakraCost: number;
    confusionChance: number;
    readMindRemains: boolean;
  };
}

export function runMindDestructionProbe(): MindDestructionProbe {
  const skill = SKILLS.MIND_DESTRUCTION;
  const state = (marks: ResolveSkillState['marks'] = []): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks,
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const win = resolveSkill({ skill }, state(), { ...hit, rng: () => 0 });
  const lose = resolveSkill({ skill }, state(), { ...hit, rng: () => 0.65 });
  const whiff = resolveSkill({ skill }, state(), { ...miss, rng: () => 0 });
  const readMind = {
    id: 'read_mind',
    sourceSkillId: 'false_surroundings',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 1,
  };
  const setup = resolveSkill({ skill }, state([readMind]), { ...hit, rng: () => 0.99 });
  const remaining = setup.ok ? setup.state.marks.find((m) => m.id === 'read_mind') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.ATTACK &&
      skill.apCost === 3 &&
      skill.chakraCost === 6 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 15 &&
      skill.controlConfusion?.chance === 0.65 &&
      skill.controlConfusion.enemyDuration === 2 &&
      skill.setupRead?.markId === 'read_mind' &&
      skill.setupRead.damageMultBonus === 0.5 &&
      skill.setupRead.consume === false &&
      !skill.effects?.some((e) => e.type === EffectType.CONFUSION && e.duration === 3 && e.chance === 1),
    baseline:
      win.ok &&
      win.damageDealt === 15 &&
      (win.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION && b.duration === 2) &&
      lose.ok &&
      lose.damageDealt === 15 &&
      !(lose.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION) &&
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !(whiff.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.CONFUSION),
    setupRead:
      setup.ok &&
      setup.damageDealt === 22 &&
      remaining?.duration === 2 &&
      remaining.stacks === 1 &&
      setup.state.modes.instances.length === 0,
    metrics: {
      baseDamage: win.ok ? win.damageDealt : 0,
      setupDamage: setup.ok ? setup.damageDealt : 0,
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      confusionChance: skill.controlConfusion?.chance ?? 0,
      readMindRemains: remaining != null,
    },
  };
}

export function printMindDestructionProbe(probe: MindDestructionProbe): void {
  const m = probe.metrics;
  console.log('\n── T-042 Mind Destruction probe ──');
  console.log(`  authoring ATTACK:   ${probe.authoring}`);
  console.log(`  baseline 15 + 65%:  ${probe.baseline}`);
  console.log(`  Setup +50% keep RM: ${probe.setupRead}`);
  console.log('  ── balance vs legacy 15 + Confusion 3@100% AP2 ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 6)`);
  console.log(`  base dmg:           ${m.baseDamage}  (was 15)`);
  console.log(`  with Read Mind:     ${m.setupDamage}  (was 15, no Setup read)`);
  console.log(`  confusion chance:   ${m.confusionChance}  (was 1.0 / 3t)`);
  console.log(`  read_mind remains:  ${m.readMindRemains}  (catalog: no consume)`);
}
