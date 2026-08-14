/**
 * T-037 probe — Hell Viewing authoring; 18 + Fear plant; applyFearOutgoing ×0.8.
 */

import { CardRole, CombatActor, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applyFearOutgoing } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface HellViewingProbe {
  authoring: boolean;
  fearPlant: boolean;
  fearMult: boolean;
  metrics: {
    baseDamage: number;
    fearedOutgoing: number;
    apCost: number;
    chakraCost: number;
    fearStacks: number;
  };
}

export function runHellViewingProbe(): HellViewingProbe {
  const hell = SKILLS.HELL_VIEWING;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [hell],
    playerBuffs: [],
    enemyHp: 80,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: hell.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: hell }, state(), hit);
  const whiff = resolveSkill({ skill: hell }, state(), miss);
  const fear = landed.ok ? landed.state.marks.find((m) => m.id === 'fear') : undefined;
  const feared = landed.ok ? applyFearOutgoing(100, landed.state.marks) : { damage: -1, consumed: false, marks: [] };
  const clean = applyFearOutgoing(100, []);
  return {
    authoring:
      hell.cardRole === CardRole.ATTACK &&
      hell.apCost === 2 &&
      hell.chakraCost === 6 &&
      hell.cooldown === 4 &&
      hell.baseDamage === 18 &&
      hell.markEffects?.some((m) => m.id === 'fear' && m.duration === 1 && m.stacks === 20) === true &&
      !hell.effects?.some((e) => e.type === EffectType.DEBUFF && e.value === 0.3),
    fearPlant:
      landed.ok &&
      landed.damageDealt === 18 &&
      fear?.target === CombatActor.ENEMY &&
      fear.duration === 1 &&
      whiff.ok === true &&
      !whiff.state.marks.some((m) => m.id === 'fear'),
    fearMult: feared.consumed && feared.damage === 80 && clean.damage === 100 && !clean.consumed,
    metrics: {
      baseDamage: landed.ok ? landed.damageDealt : 0,
      fearedOutgoing: feared.damage,
      apCost: hell.apCost ?? 0,
      chakraCost: hell.chakraCost,
      fearStacks: fear?.stacks ?? 0,
    },
  };
}

export function printHellViewingProbe(probe: HellViewingProbe): void {
  const m = probe.metrics;
  console.log('\n── T-037 Hell Viewing probe ──');
  console.log(`  authoring 18+Fear:  ${probe.authoring}`);
  console.log(`  plant on hit:       ${probe.fearPlant}`);
  console.log(`  outgoing ×0.8:      ${probe.fearMult}`);
  console.log('  ── balance vs legacy 18 + STR −30%×3 ──');
  console.log(`  base dmg:           ${m.baseDamage}  (was 18)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 2 / 6)`);
  console.log(`  fear stacks:        ${m.fearStacks}  (was STR −30%×3)`);
  console.log(`  next enemy 100:     ${m.fearedOutgoing}  (was no Fear / 100)`);
}
