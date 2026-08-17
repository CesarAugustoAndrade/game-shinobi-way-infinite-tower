/**
 * T-101 probe — Sand Burial ATTACK 18 M/L; +50% vs Coffined/Stunned; consume Coffined only.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SandBurialProbe {
  authoring: boolean;
  coffined: boolean;
  stunBaseline: boolean;
  metrics: {
    baseDamage: number;
    setupDamage: number;
    apCost: number;
    chakraCost: number;
    coffinDmg: number;
    dmgPerApBase: number;
    dmgPerApSetup: number;
  };
}

export function runSandBurialProbe(): SandBurialProbe {
  const burial = SKILLS.SAND_BURIAL;
  const coffin = SKILLS.SAND_COFFIN;
  const coffined = {
    id: 'coffined',
    sourceSkillId: 'sand_coffin',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
  };
  const stun = {
    id: 'stun-enemy-sand_coffin',
    name: 'Stun',
    duration: 1,
    effect: { type: EffectType.STUN, duration: 1, chance: 1 },
    source: 'sand_coffin',
  };
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [burial],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: burial.baseDamage }) };
  const paid = resolveSkill({ skill: burial }, state({ marks: [coffined] }), hit);
  const stunned = resolveSkill(
    { skill: burial },
    state({ enemyBuffs: [{ ...stun, effect: { ...stun.effect } }] }),
    hit,
  );
  const bare = resolveSkill({ skill: burial }, state(), hit);
  const ap = burial.apCost ?? 0;
  const setupDmg = paid.ok ? paid.damageDealt : 0;
  const baseDmg = bare.ok ? bare.damageDealt : 0;
  return {
    authoring:
      burial.cardRole === CardRole.ATTACK &&
      burial.apCost === 3 &&
      burial.chakraCost === 6 &&
      burial.cooldown === 3 &&
      burial.baseDamage === 18 &&
      (burial.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (burial.allowedRanges ?? []).includes(CombatRange.LONG) &&
      burial.setupRead?.markId === 'coffined' &&
      burial.setupRead.damageMultBonus === 0.5 &&
      burial.setupRead.consume === true &&
      burial.setupRead.alsoIfEnemyStunned === true,
    coffined:
      paid.ok === true &&
      paid.damageDealt === Math.floor(18 * 1.5) &&
      !paid.state.marks.some((m) => m.id === 'coffined'),
    stunBaseline:
      stunned.ok === true &&
      stunned.damageDealt === Math.floor(18 * 1.5) &&
      (stunned.state.enemyBuffs ?? []).some((b) => b.effect.type === EffectType.STUN) &&
      bare.ok === true &&
      bare.damageDealt === 18,
    metrics: {
      baseDamage: baseDmg,
      setupDamage: setupDmg,
      apCost: ap,
      chakraCost: burial.chakraCost,
      coffinDmg: coffin.baseDamage,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApSetup: ap > 0 ? setupDmg / ap : 0,
    },
  };
}

export function printSandBurialProbe(probe: SandBurialProbe): void {
  const m = probe.metrics;
  console.log('\n── T-101 Sand Burial probe ──');
  console.log(`  authoring ATTACK 18 + setupRead coffined 0.5 consume: ${probe.authoring}`);
  console.log(`  coffined hit floor(18*1.5) mark gone:               ${probe.coffined}`);
  console.log(`  stun-only 1.5 keeps Stun / bare 18:                 ${probe.stunBaseline}`);
  console.log('  ── balance vs mute 15/AP2 execute and Coffin 15 SIDE ──');
  console.log(`  dmg base / setup:   ${m.baseDamage} / ${m.setupDamage}  (was mute 15 / 15)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 6)`);
  console.log(`  dmg/AP base / setup:${m.dmgPerApBase.toFixed(2)} / ${m.dmgPerApSetup.toFixed(2)}  (was 7.50)`);
  console.log(`  Coffin sibling:     ${m.coffinDmg} dmg SIDE plants coffined`);
}
