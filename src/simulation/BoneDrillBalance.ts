/**
 * T-119 probe — Bone Drill ATTACK 18 C/M; 25% phys pen; HP 10; not TRUE.
 */

import { CardRole, CombatRange, DamageType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

const DEF = 0.4;

export interface BoneDrillProbe {
  authoring: boolean;
  hit: boolean;
  pen: boolean;
  metrics: {
    legacyDmg: number;
    legacyAp: number;
    baseDamage: number;
    penDamage: number;
    noPenDamage: number;
    apCost: number;
    hpCost: number;
    twinPen: number;
    dmgPerAp: number;
    dmgPerApLegacy: number;
  };
}

export function runBoneDrillProbe(): BoneDrillProbe {
  const drill = SKILLS.BONE_DRILL;
  const lions = SKILLS.TWIN_LION_FISTS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [drill],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: drill.baseDamage }) };
  const base = resolveSkill({ skill: drill }, state(), hit);
  const armed = resolveSkill({ skill: drill }, state({ enemyDefensePercent: DEF }), hit);
  const bare = resolveSkill(
    { skill: { ...drill, penetration: 0 } },
    state({ enemyDefensePercent: DEF }),
    hit,
  );
  const long = resolveSkill({ skill: drill }, state({ range: CombatRange.LONG }), hit);
  const ap = drill.apCost ?? 0;
  const dmg = base.ok ? base.damageDealt : 0;
  const penDmg = armed.ok ? armed.damageDealt : 0;
  const noPenDmg = bare.ok ? bare.damageDealt : 0;
  return {
    authoring:
      drill.cardRole === CardRole.ATTACK &&
      drill.apCost === 3 &&
      drill.hpCost === 10 &&
      drill.chakraCost === 0 &&
      drill.cooldown === 3 &&
      drill.baseDamage === 18 &&
      drill.damageType === DamageType.PHYSICAL &&
      drill.penetration === 0.25 &&
      (drill.allowedRanges ?? []).includes(CombatRange.CLOSE) &&
      (drill.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      drill.modeInteraction === undefined,
    hit:
      base.ok === true &&
      dmg === 18 &&
      base.state.pools.hp === 30 &&
      base.state.pools.ap === 3 &&
      long.ok === false,
    pen: armed.ok === true && penDmg === 12 && noPenDmg === 10 && penDmg > noPenDmg && penDmg < 18,
    metrics: {
      legacyDmg: 15,
      legacyAp: 2,
      baseDamage: dmg,
      penDamage: penDmg,
      noPenDamage: noPenDmg,
      apCost: ap,
      hpCost: drill.hpCost ?? 0,
      twinPen: lions.penetration ?? 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
      dmgPerApLegacy: 15 / 2,
    },
  };
}

export function printBoneDrillProbe(probe: BoneDrillProbe): void {
  const m = probe.metrics;
  console.log('\n── T-119 Bone Drill probe ──');
  console.log(`  authoring ATTACK 18 C/M AP3/HP10/CD3 25% pen: ${probe.authoring}`);
  console.log(`  hit 18 / pay HP10 / LONG reject:              ${probe.hit}`);
  console.log(`  40% def: 12 with pen vs 10 without (not 18):  ${probe.pen}`);
  console.log('  ── balance vs mute TRUE 15/AP2 and Twin Lion 30% pen ──');
  console.log(
    `  package:     ${m.baseDamage} / AP${m.apCost} HP${m.hpCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was ${m.legacyDmg}/AP${m.legacyAp} TRUE = ${m.dmgPerApLegacy.toFixed(2)})`,
  );
  console.log(
    `  vs 40% def:  ${m.penDamage} with 25% pen · ${m.noPenDamage} with 0 pen · TRUE would keep ${m.baseDamage}`,
  );
  console.log(`  Twin Lion sibling pen: ${m.twinPen} (Hyuga 30%, not this spear)`);
}
