/**
 * T-128 probe — Shadow Possession SUPPORT 80% Bound 1; ATTACK 10→12 consume; miss/SIDE leave.
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

export interface ShadowPossessionProbe {
  authoring: boolean;
  plant: boolean;
  failPlant: boolean;
  payoff: boolean;
  missKeeps: boolean;
  sideLeaves: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    attackWith: number;
    attackWithout: number;
    attackMiss: number;
    sideDamage: number;
    boundDuration: number;
    legacyStunChance: number;
    legacyReflect: number;
  };
}

export function runShadowPossessionProbe(): ShadowPossessionProbe {
  const skill = SKILLS.SHADOW_POSSESSION;
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
  const hit = { rollHit: () => ({ hit: true as const, damage: 10 }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const planted = resolveSkill({ skill }, state(), { rng: () => 0 });
  const armed = planted.ok ? resolveSkill({ skill: attack }, planted.state, hit) : planted;
  const whiffPlant = resolveSkill({ skill }, state(), { rng: () => 0 });
  const whiff = whiffPlant.ok
    ? resolveSkill({ skill: attack }, whiffPlant.state, miss)
    : whiffPlant;
  const sidePlant = resolveSkill({ skill }, state(), { rng: () => 0 });
  const sideHit = sidePlant.ok
    ? resolveSkill({ skill: side }, sidePlant.state, hit)
    : sidePlant;
  const failed = resolveSkill({ skill }, state(), { rng: () => 0.8 });
  const clean = resolveSkill({ skill: attack }, { ...state(), skills: [attack] }, hit);
  const bound = planted.ok ? planted.state.marks.find((m) => m.id === 'bound') : undefined;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 2 &&
      skill.chakraCost === 6 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 0 &&
      skill.controlBound?.chance === 0.8 &&
      skill.controlBound.enemyDuration === 1 &&
      skill.controlStun === undefined &&
      !skill.effects?.some((e) => e.type === EffectType.STUN) &&
      !skill.effects?.some((e) => e.type === EffectType.REFLECTION),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      bound?.duration === 1 &&
      bound.family === MarkFamily.HARD_CONTROL,
    failPlant:
      failed.ok === true &&
      failed.damageDealt === 0 &&
      !failed.state.marks.some((m) => m.id === 'bound'),
    payoff:
      armed.ok === true &&
      armed.damageDealt === 12 &&
      !armed.state.marks.some((m) => m.id === 'bound'),
    missKeeps:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      whiff.state.marks.some((m) => m.id === 'bound'),
    sideLeaves:
      sideHit.ok === true &&
      sideHit.damageDealt === 10 &&
      sideHit.state.marks.some((m) => m.id === 'bound'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      attackWith: armed.ok ? armed.damageDealt : -1,
      attackWithout: clean.ok ? clean.damageDealt : -1,
      attackMiss: whiff.ok ? whiff.damageDealt : -1,
      sideDamage: sideHit.ok ? sideHit.damageDealt : -1,
      boundDuration: bound?.duration ?? 0,
      legacyStunChance: 0.8,
      legacyReflect: 0.3,
    },
  };
}

export function printShadowPossessionProbe(probe: ShadowPossessionProbe): void {
  const m = probe.metrics;
  console.log('\n── T-128 Shadow Possession probe ──');
  console.log(`  authoring SUPPORT AP2/CP6 Bound 80% not Stun/Reflect: ${probe.authoring}`);
  console.log(`  plant Bound 1 HARD_CONTROL dmg 0:                    ${probe.plant}`);
  console.log(`  fail plants nothing:                                 ${probe.failPlant}`);
  console.log(`  ATTACK 10→12 + consume:                              ${probe.payoff}`);
  console.log(`  miss keeps Bound:                                    ${probe.missKeeps}`);
  console.log(`  SIDE leaves Bound:                                   ${probe.sideLeaves}`);
  console.log('  ── balance vs mute Stun 0.8×2 + Reflect 0.3×2 ──');
  console.log(`  AP / CP:          ${m.apCost} / ${m.chakraCost}  (costs unchanged)`);
  console.log(`  plant dmg:        ${m.plantDamage}  (must be 0; was 0 + Stun/Reflect)`);
  console.log(
    `  ATTACK with Bound: ${m.attackWith}  vs without ${m.attackWithout}  (×1.2 Setup)`,
  );
  console.log(
    `  Bound duration:   ${m.boundDuration}  (was Stun ${m.legacyStunChance}×2 + Reflect ${m.legacyReflect}×2)`,
  );
  console.log(`  miss / SIDE dmg:  ${m.attackMiss} / ${m.sideDamage}`);
}
