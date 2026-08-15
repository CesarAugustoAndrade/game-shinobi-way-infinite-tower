/**
 * T-064 probe — Mud Wall plant Shield 35; AP1/CP4; vs legacy SHIELD 40×3.
 */

import { CardRole, CombatRange, EffectType, MarkFamily, Posture } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface MudWallProbe {
  authoring: boolean;
  plant: boolean;
  costs: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    shieldStacks: number;
    apAfter: number;
    cpAfter: number;
    readyOnTurn: number;
  };
}

export function runMudWallProbe(): MudWallProbe {
  const skill = SKILLS.MUD_WALL;
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
    ? planted.state.marks.find((m) => m.id === 'mud_wall_shield')
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 4 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 0 &&
      skill.stanceShift === Posture.DEFENSIVE &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'mud_wall_shield' &&
          m.stacks === 35 &&
          m.family === MarkFamily.SHIELD &&
          m.targetActor === 'self',
      ) === true &&
      !skill.effects?.some((e) => e.type === EffectType.SHIELD),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      shield?.stacks === 35 &&
      shield.family === MarkFamily.SHIELD,
    costs:
      planted.ok === true &&
      planted.state.pools.ap === 5 &&
      planted.state.pools.chakra === 16 &&
      used?.readyOnTurn === 7,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      shieldStacks: shield?.stacks ?? 0,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
      readyOnTurn: used?.readyOnTurn ?? -1,
    },
  };
}

export function printMudWallProbe(probe: MudWallProbe): void {
  const m = probe.metrics;
  console.log('\n── T-064 Mud Wall probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant Shield 35:        ${probe.plant}`);
  console.log(`  AP−1 CP−4 readyOn 7:    ${probe.costs}`);
  console.log('  ── balance vs legacy SHIELD 40×3 effects[] ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 4)`);
  console.log(`  plant dmg / stacks:     ${m.plantDamage} / ${m.shieldStacks}  (was 0 / 40 unused)`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log(`  readyOnTurn:            ${m.readyOnTurn}  (T=2 CD=4 → 7)`);
}
