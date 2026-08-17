/**
 * T-099 probe — Water Dragon ATTACK 18 M/L; +20% Setup under mist; no consume.
 */

import { CardRole, CombatActor, CombatRange, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface WaterDragonProbe {
  authoring: boolean;
  mistBonus: boolean;
  noMist: boolean;
  metrics: {
    baseDamage: number;
    mistDamage: number;
    apCost: number;
    chakraCost: number;
    cloneDmg: number;
    dmgPerApBase: number;
    dmgPerApMist: number;
  };
}

export function runWaterDragonProbe(): WaterDragonProbe {
  const dragon = SKILLS.WATER_DRAGON;
  const clone = SKILLS.WATER_CLONE;
  const mist = {
    id: 'mist',
    sourceSkillId: 'hidden_mist',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 20,
    family: MarkFamily.STAT,
  };
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [dragon],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: dragon.baseDamage }) };
  const bonus = resolveSkill({ skill: dragon }, state({ marks: [mist] }), hit);
  const bare = resolveSkill({ skill: dragon }, state(), hit);
  const ap = dragon.apCost ?? 0;
  const mistDmg = bonus.ok ? bonus.damageDealt : 0;
  const baseDmg = bare.ok ? bare.damageDealt : 0;
  return {
    authoring:
      dragon.cardRole === CardRole.ATTACK &&
      dragon.apCost === 3 &&
      dragon.chakraCost === 6 &&
      dragon.cooldown === 4 &&
      dragon.baseDamage === 18 &&
      (dragon.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      (dragon.allowedRanges ?? []).includes(CombatRange.LONG) &&
      dragon.setupRead?.markId === 'mist' &&
      dragon.setupRead.damageMultBonus === 0.2 &&
      dragon.setupRead.consume === false,
    mistBonus:
      bonus.ok === true &&
      bonus.damageDealt === Math.floor(18 * 1.2) &&
      bonus.state.marks.some((m) => m.id === 'mist' && m.duration === 2),
    noMist: bare.ok === true && bare.damageDealt === 18,
    metrics: {
      baseDamage: baseDmg,
      mistDamage: mistDmg,
      apCost: ap,
      chakraCost: dragon.chakraCost,
      cloneDmg: clone.baseDamage,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApMist: ap > 0 ? mistDmg / ap : 0,
    },
  };
}

export function printWaterDragonProbe(probe: WaterDragonProbe): void {
  const m = probe.metrics;
  console.log('\n── T-099 Water Dragon probe ──');
  console.log(`  authoring ATTACK 18 + setupRead mist 0.2: ${probe.authoring}`);
  console.log(`  mist hit floor(18*1.2) mark stays:        ${probe.mistBonus}`);
  console.log(`  no mist baseline 18:                      ${probe.noMist}`);
  console.log('  ── balance vs legacy 15/AP2 and Water Clone 11 ──');
  console.log(`  dmg base / mist:    ${m.baseDamage} / ${m.mistDamage}  (was mute 15 / 15)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 6)`);
  console.log(`  dmg/AP base / mist: ${m.dmgPerApBase.toFixed(2)} / ${m.dmgPerApMist.toFixed(2)}  (was 7.50)`);
  console.log(`  Clone sibling:      ${m.cloneDmg} dmg SIDE no Mist payoff`);
}
