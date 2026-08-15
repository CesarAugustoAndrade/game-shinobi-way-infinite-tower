/**
 * T-062 probe — Cloak plant; ATTACK 10→15+DEX consume; miss consumes; SIDE leaves.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface CloakInvisProbe {
  authoring: boolean;
  plant: boolean;
  attackPayoff: boolean;
  missConsumes: boolean;
  sideLeaves: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    attackWith: number;
    attackClean: number;
    attackMiss: number;
    sideDamage: number;
    cloakGoneOnHit: boolean;
    cloakGoneOnMiss: boolean;
  };
}

export function runCloakInvisProbe(): CloakInvisProbe {
  const skill = SKILLS.CLOAK_INVIS;
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
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.DEXTERITY,
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
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.DEXTERITY,
    hitCount: 1,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: 10 }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const planted = resolveSkill({ skill }, state());
  const armed = planted.ok
    ? resolveSkill({ skill: attack }, planted.state, hit)
    : planted;
  const clean = resolveSkill({ skill: attack }, { ...state(), skills: [attack] }, hit);
  const whiffPlant = resolveSkill({ skill }, state());
  const whiff = whiffPlant.ok
    ? resolveSkill({ skill: attack }, whiffPlant.state, miss)
    : whiffPlant;
  const sidePlant = resolveSkill({ skill }, state());
  const sideHit = sidePlant.ok
    ? resolveSkill({ skill: side }, sidePlant.state, hit)
    : sidePlant;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 3 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 0 &&
      skill.markEffects?.some(
        (m) => m.id === 'cloaked' && m.duration === 2 && m.targetActor === 'self',
      ) === true &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED,
      ) &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.DEXTERITY,
      ),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.marks.some(
        (m) => m.id === 'cloaked' && m.duration === 2 && m.family === MarkFamily.STAT,
      ) &&
      planted.state.modes.instances.length === 0,
    attackPayoff:
      armed.ok === true &&
      armed.damageDealt === 19 &&
      !armed.state.marks.some((m) => m.id === 'cloaked') &&
      clean.ok === true &&
      clean.damageDealt === 10,
    missConsumes:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'cloaked'),
    sideLeaves:
      sideHit.ok === true &&
      sideHit.damageDealt === 10 &&
      sideHit.state.marks.some((m) => m.id === 'cloaked'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      attackWith: armed.ok ? armed.damageDealt : -1,
      attackClean: clean.ok ? clean.damageDealt : -1,
      attackMiss: whiff.ok ? whiff.damageDealt : -1,
      sideDamage: sideHit.ok ? sideHit.damageDealt : -1,
      cloakGoneOnHit: armed.ok ? !armed.state.marks.some((m) => m.id === 'cloaked') : false,
      cloakGoneOnMiss: whiff.ok ? !whiff.state.marks.some((m) => m.id === 'cloaked') : false,
    },
  };
}

export function printCloakInvisProbe(probe: CloakInvisProbe): void {
  const m = probe.metrics;
  console.log('\n── T-062 Cloak of Invisibility probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant cloak no dmg:     ${probe.plant}`);
  console.log(`  ATTACK 10→19 consume:   ${probe.attackPayoff}`);
  console.log(`  miss consumes cloak:    ${probe.missConsumes}`);
  console.log(`  SIDE leaves cloak:      ${probe.sideLeaves}`);
  console.log('  ── balance vs legacy SPEED +60% / DEX +50% ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 3)`);
  console.log(`  plant dmg:              ${m.plantDamage}  (must be 0)`);
  console.log(`  ATTACK with / clean:    ${m.attackWith} / ${m.attackClean}  (15 crit +4 DEX / 10)`);
  console.log(`  miss / SIDE dmg:        ${m.attackMiss} / ${m.sideDamage}`);
  console.log(`  cloak gone hit/miss:    ${m.cloakGoneOnHit} / ${m.cloakGoneOnMiss}`);
}
