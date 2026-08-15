/**
 * T-061 probe — Poison Coat plant; SIDE/ATTACK Poison 5×3 consume; miss/SUPPORT leave.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface PoisonCoatProbe {
  authoring: boolean;
  plant: boolean;
  sidePayoff: boolean;
  attackPayoff: boolean;
  missKeeps: boolean;
  supportLeaves: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    sideWith: number;
    attackWith: number;
    attackMiss: number;
    supportDamage: number;
    poisonStacks: number;
    poisonDuration: number;
    plantPoisonStacks: number;
  };
}

export function runPoisonCoatProbe(): PoisonCoatProbe {
  const skill = SKILLS.POISON_COAT;
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
  const attack = createMockSkill({
    id: 'probe_attack',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const side = createMockSkill({
    id: 'probe_side',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const support = createMockSkill({
    id: 'probe_support',
    cardRole: CardRole.SUPPORT,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 0,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: 10 }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const planted = resolveSkill({ skill }, state());
  const sideArmed = planted.ok
    ? resolveSkill({ skill: side }, planted.state, hit)
    : planted;
  const attackPlant = resolveSkill({ skill }, state());
  const attackArmed = attackPlant.ok
    ? resolveSkill({ skill: attack }, attackPlant.state, hit)
    : attackPlant;
  const whiffPlant = resolveSkill({ skill }, state());
  const whiff = whiffPlant.ok
    ? resolveSkill({ skill: side }, whiffPlant.state, miss)
    : whiffPlant;
  const supportPlant = resolveSkill({ skill }, state());
  const supportPlay = supportPlant.ok
    ? resolveSkill({ skill: support }, supportPlant.state)
    : supportPlant;
  const poison = sideArmed.ok
    ? sideArmed.state.marks.find((m) => m.id === 'poison')
    : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 0 &&
      skill.markEffects?.some(
        (m) => m.id === 'coated' && m.duration === 2 && m.targetActor === 'self',
      ) === true &&
      !skill.effects?.some((e) => e.type === EffectType.POISON),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.marks.some(
        (m) => m.id === 'coated' && m.duration === 2 && m.family === MarkFamily.STAT,
      ) &&
      !planted.state.marks.some((m) => m.id === 'poison'),
    sidePayoff:
      sideArmed.ok === true &&
      sideArmed.damageDealt === 10 &&
      !sideArmed.state.marks.some((m) => m.id === 'coated') &&
      poison?.stacks === 5 &&
      poison.duration === 3 &&
      poison.family === MarkFamily.DOT,
    attackPayoff:
      attackArmed.ok === true &&
      attackArmed.damageDealt === 10 &&
      !attackArmed.state.marks.some((m) => m.id === 'coated') &&
      attackArmed.state.marks.some(
        (m) => m.id === 'poison' && m.stacks === 5 && m.duration === 3,
      ),
    missKeeps:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.marks.some((m) => m.id === 'coated') &&
      !whiff.state.marks.some((m) => m.id === 'poison'),
    supportLeaves:
      supportPlay.ok === true &&
      supportPlay.damageDealt === 0 &&
      supportPlay.state.marks.some((m) => m.id === 'coated') &&
      !supportPlay.state.marks.some((m) => m.id === 'poison'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      sideWith: sideArmed.ok ? sideArmed.damageDealt : -1,
      attackWith: attackArmed.ok ? attackArmed.damageDealt : -1,
      attackMiss: whiff.ok ? whiff.damageDealt : -1,
      supportDamage: supportPlay.ok ? supportPlay.damageDealt : -1,
      poisonStacks: poison?.stacks ?? 0,
      poisonDuration: poison?.duration ?? 0,
      plantPoisonStacks: planted.ok
        ? planted.state.marks.find((m) => m.id === 'poison')?.stacks ?? 0
        : -1,
    },
  };
}

export function printPoisonCoatProbe(probe: PoisonCoatProbe): void {
  const m = probe.metrics;
  console.log('\n── T-061 Poison Coat probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant coat no poison:   ${probe.plant}`);
  console.log(`  SIDE 10 + Poison 5×3:   ${probe.sidePayoff}`);
  console.log(`  ATTACK 10 + consume:    ${probe.attackPayoff}`);
  console.log(`  miss keeps coat:        ${probe.missKeeps}`);
  console.log(`  SUPPORT leaves coat:    ${probe.supportLeaves}`);
  console.log('  ── balance vs legacy immediate Poison 8×3 ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 1)`);
  console.log(`  plant dmg / poison:     ${m.plantDamage} / ${m.plantPoisonStacks}  (was 0 / 8 immediate)`);
  console.log(`  SIDE/ATTACK with coat:  ${m.sideWith} / ${m.attackWith}  (dmg unchanged)`);
  console.log(`  poison on consume:      ${m.poisonStacks}×${m.poisonDuration}  (was 8×3 on cast)`);
  console.log(`  miss / SUPPORT dmg:     ${m.attackMiss} / ${m.supportDamage}`);
}
