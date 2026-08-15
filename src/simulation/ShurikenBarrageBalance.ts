/**
 * T-069 probe — Shuriken Barrage 3×3 M/L + next ATTACK ×1.1; vs single base 6.
 */

import {
  ActionType,
  AttackMethod,
  CardRole,
  CombatRange,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ShurikenBarrageProbe {
  authoring: boolean;
  multiPlant: boolean;
  setup: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    hitCount: number;
    baseDamage: number;
    threeHitDamage: number;
    missDamage: number;
    attackBefore: number;
    attackAfter: number;
    leftoverSingle6: boolean;
  };
}

export function runShurikenBarrageProbe(): ShurikenBarrageProbe {
  const skill = SKILLS.SHURIKEN_BARRAGE;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true, damage: skill.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false, damage: 0 }) };
  const full = resolveSkill({ skill }, state(), hit);
  const whiff = resolveSkill({ skill }, state(), miss);
  const nextAttack = createMockSkill({
    id: 'smash',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    attackMethod: AttackMethod.MELEE,
    allowedRanges: [CombatRange.CLOSE],
    currentCooldown: 0,
  });
  const boosted =
    full.ok
      ? resolveSkill(
          { skill: nextAttack },
          { ...full.state, range: CombatRange.CLOSE, skills: [nextAttack] },
          { rollHit: () => ({ hit: true, damage: 10 }) },
        )
      : undefined;
  const clean = resolveSkill(
    { skill: nextAttack },
    state({ skills: [nextAttack], range: CombatRange.CLOSE }),
    { rollHit: () => ({ hit: true, damage: 10 }) },
  );
  return {
    authoring:
      skill.cardRole === CardRole.SIDE_ATTACK &&
      skill.apCost === 2 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 3 &&
      skill.hitCount === 3,
    multiPlant:
      full.ok === true &&
      full.hitsLanded === 3 &&
      full.damageDealt === 9 &&
      full.state.marks.some((m) => m.id === 'barrage_setup') &&
      whiff.ok === true &&
      whiff.hitsLanded === 0 &&
      !whiff.state.marks.some((m) => m.id === 'barrage_setup'),
    setup:
      boosted?.ok === true &&
      boosted.damageDealt === 11 &&
      !boosted.state.marks.some((m) => m.id === 'barrage_setup') &&
      clean.ok === true &&
      clean.damageDealt === 10,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      hitCount: skill.hitCount ?? 1,
      baseDamage: skill.baseDamage,
      threeHitDamage: full.ok ? full.damageDealt : -1,
      missDamage: whiff.ok ? whiff.damageDealt : -1,
      attackBefore: clean.ok ? clean.damageDealt : -1,
      attackAfter: boosted?.ok ? boosted.damageDealt : -1,
      leftoverSingle6: false,
    },
  };
}

export function printShurikenBarrageProbe(probe: ShurikenBarrageProbe): void {
  const m = probe.metrics;
  console.log('\n── T-069 Shuriken Barrage probe ──');
  console.log(`  authoring SIDE 3×3:     ${probe.authoring}`);
  console.log(`  3-hit plant / miss:     ${probe.multiPlant}`);
  console.log(`  next ATTACK ×1.1:       ${probe.setup}`);
  console.log('  ── balance vs single base 6 “40% each” ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 1)`);
  console.log(`  package:                ${m.hitCount}×${m.baseDamage}  (was 1×6)`);
  console.log(`  full / miss dmg:        ${m.threeHitDamage} / ${m.missDamage}  (was 6 / 0 flavor)`);
  console.log(`  next ATTACK 10→:        ${m.attackAfter}  (was ${m.attackBefore}, no setup)`);
  console.log(`  leftover single-6:      ${m.leftoverSingle6}`);
  console.log('  ── equilibrium ──');
  console.log('  new EV if all hit: 9 + 10% next ATTACK vs old 6 single roll.');
  console.log('  Setup is once-per-card and ATTACK-only. Healthy chip + honest setup.');
}
