/**
 * T-076 probe — Sand Shield plant Shield 45; AP1/CP5; vs Mud Wall 35 / legacy SHIELD 80×2.
 */

import { CardRole, CombatRange, EffectType, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SandShieldProbe {
  authoring: boolean;
  plant: boolean;
  costs: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    cooldown: number;
    plantDamage: number;
    shieldStacks: number;
    mudWallStacks: number;
    braceStacks: number;
    absorbPerAp: number;
    absorbPerCp: number;
    absorbVsMudWall: number;
    absorbVsLegacy80: number;
    apAfter: number;
    cpAfter: number;
    readyOnTurn: number;
  };
}

export function runSandShieldProbe(): SandShieldProbe {
  const skill = SKILLS.SAND_SHIELD;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const planted = resolveSkill({ skill }, state());
  const shield = planted.ok
    ? planted.state.marks.find((m) => m.id === 'sand_shield')
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const stacks = shield?.stacks ?? 0;
  const mudWallStacks =
    SKILLS.MUD_WALL.markEffects?.find((m) => m.id === 'mud_wall_shield')?.stacks ?? 0;
  const braceStacks = SKILLS.BRACE.markEffects?.find((m) => m.id === 'brace_shield')?.stacks ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 5 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 0 &&
      skill.stanceShift === undefined &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'sand_shield' &&
          m.stacks === 45 &&
          m.family === MarkFamily.SHIELD &&
          m.targetActor === 'self',
      ) === true &&
      !skill.effects?.some((e) => e.type === EffectType.SHIELD),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      shield?.stacks === 45 &&
      shield.family === MarkFamily.SHIELD,
    costs:
      planted.ok === true &&
      planted.state.pools.ap === 5 &&
      planted.state.pools.chakra === 15 &&
      used?.readyOnTurn === 6,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      cooldown: skill.cooldown,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      shieldStacks: stacks,
      mudWallStacks,
      braceStacks,
      absorbPerAp: skill.apCost ? stacks / skill.apCost : 0,
      absorbPerCp: skill.chakraCost ? stacks / skill.chakraCost : 0,
      absorbVsMudWall: mudWallStacks ? stacks / mudWallStacks : 0,
      absorbVsLegacy80: stacks / 80,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
      readyOnTurn: used?.readyOnTurn ?? -1,
    },
  };
}

export function printSandShieldProbe(probe: SandShieldProbe): void {
  const m = probe.metrics;
  console.log('\n── T-076 Sand Shield probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant Shield 45:        ${probe.plant}`);
  console.log(`  AP−1 CP−5 readyOn 6:    ${probe.costs}`);
  console.log('  ── balance vs Mud Wall 35 / Brace 20 / legacy SHIELD 80×2 ──');
  console.log(`  AP / CP / CD:           ${m.apCost} / ${m.chakraCost} / ${m.cooldown}  (was 1 / 5 / 3)`);
  console.log(`  plant dmg / stacks:     ${m.plantDamage} / ${m.shieldStacks}  (was 0 / 80 unused effects[])`);
  console.log(
    `  sibling absorb:         mud_wall ${m.mudWallStacks} · brace ${m.braceStacks} · sand ${m.shieldStacks}  (Δ mud +${m.shieldStacks - m.mudWallStacks})`,
  );
  console.log(
    `  absorb efficiency:      ${m.absorbPerAp.toFixed(1)} /AP · ${m.absorbPerCp.toFixed(1)} /CP · ${m.absorbVsMudWall.toFixed(2)}× mud · ${m.absorbVsLegacy80.toFixed(2)}× legacy 80`,
  );
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log(`  readyOnTurn:            ${m.readyOnTurn}  (T=2 CD=3 → 6)`);
}
