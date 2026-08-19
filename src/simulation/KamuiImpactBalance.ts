/**
 * T-120 probe — Kamui Impact ATTACK 27 ANY; 50% pen; Spatial Tear 2 → next ATTACK +20%.
 */

import { CardRole, CombatRange, DamageType, EffectType, PrimaryStat } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

const DEF = 0.4;

export interface KamuiImpactProbe {
  authoring: boolean;
  hitPen: boolean;
  tear: boolean;
  metrics: {
    legacyAp: number;
    baseDamage: number;
    penDamage: number;
    noPenDamage: number;
    tearBoost: number;
    apCost: number;
    chakraCost: number;
    bonePen: number;
    dmgPerAp: number;
    dmgPerApLegacy: number;
  };
}

export function runKamuiImpactProbe(): KamuiImpactProbe {
  const kamui = SKILLS.KAMUI_IMPACT;
  const strike = SKILLS.BASIC_ATTACK;
  const slash = SKILLS.KUNAI_SLASH;
  const bone = SKILLS.BONE_DRILL;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kamui],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: kamui.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const base = resolveSkill({ skill: kamui }, state(), hit);
  const close = resolveSkill({ skill: kamui }, state({ range: CombatRange.CLOSE }), hit);
  const long = resolveSkill({ skill: kamui }, state({ range: CombatRange.LONG }), hit);
  const armed = resolveSkill({ skill: kamui }, state({ enemyDefensePercent: DEF }), hit);
  const barePen = resolveSkill(
    { skill: { ...kamui, penetration: 0 } },
    state({ enemyDefensePercent: DEF }),
    hit,
  );
  const whiff = resolveSkill({ skill: kamui }, state(), miss);
  const side =
    base.ok
      ? resolveSkill(
          { skill: slash },
          { ...base.state, range: CombatRange.CLOSE, skills: [slash] },
          { rollHit: () => ({ hit: true as const, damage: slash.baseDamage }) },
        )
      : base;
  const boosted =
    side.ok
      ? resolveSkill(
          { skill: strike },
          { ...side.state, range: CombatRange.CLOSE, skills: [strike] },
          { rollHit: () => ({ hit: true as const, damage: strike.baseDamage }) },
        )
      : side;
  const ap = kamui.apCost ?? 0;
  const dmg = base.ok ? base.damageDealt : 0;
  const penDmg = armed.ok ? armed.damageDealt : 0;
  const noPenDmg = barePen.ok ? barePen.damageDealt : 0;
  const tearDmg = boosted.ok ? boosted.damageDealt : 0;
  return {
    authoring:
      kamui.cardRole === CardRole.ATTACK &&
      kamui.apCost === 5 &&
      kamui.chakraCost === 11 &&
      kamui.cooldown === 4 &&
      kamui.baseDamage === 27 &&
      kamui.damageType === DamageType.PHYSICAL &&
      kamui.penetration === 0.5 &&
      kamui.modeInteraction === undefined &&
      kamui.markEffects?.some((m) => m.id === 'spatial_tear' && m.duration === 2) === true &&
      kamui.effects?.some(
        (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.SPEED,
      ) !== true,
    hitPen:
      base.ok === true &&
      dmg === 27 &&
      close.ok === true &&
      long.ok === true &&
      penDmg === 21 &&
      noPenDmg === 16 &&
      penDmg > noPenDmg &&
      penDmg < 27,
    tear:
      base.ok === true &&
      base.state.marks.some((m) => m.id === 'spatial_tear') &&
      whiff.ok === true &&
      whiff.state.marks.some((m) => m.id === 'spatial_tear') &&
      side.ok === true &&
      side.state.marks.some((m) => m.id === 'spatial_tear') &&
      boosted.ok === true &&
      tearDmg === Math.floor(strike.baseDamage * 1.2) &&
      !boosted.state.marks.some((m) => m.id === 'spatial_tear'),
    metrics: {
      legacyAp: 2,
      baseDamage: dmg,
      penDamage: penDmg,
      noPenDamage: noPenDmg,
      tearBoost: tearDmg,
      apCost: ap,
      chakraCost: kamui.chakraCost ?? 0,
      bonePen: bone.penetration ?? 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
      dmgPerApLegacy: 27 / 2,
    },
  };
}

export function printKamuiImpactProbe(probe: KamuiImpactProbe): void {
  const m = probe.metrics;
  console.log('\n── T-120 Kamui Impact probe ──');
  console.log(`  authoring ATTACK 27 ANY AP5/CP11/CD4 50% pen + Tear: ${probe.authoring}`);
  console.log(`  hit 27 any band; 40% def 21 vs 16 (not 27 TRUE):     ${probe.hitPen}`);
  console.log(`  Tear on miss too; SIDE keeps; next ATTACK +20%:      ${probe.tear}`);
  console.log('  ── balance vs mute TRUE 27/AP2 + SPD −50% and Bone Drill 25% pen ──');
  console.log(
    `  package:     ${m.baseDamage} / AP${m.apCost} CP${m.chakraCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 27/AP${m.legacyAp} TRUE = ${m.dmgPerApLegacy.toFixed(2)})`,
  );
  console.log(
    `  vs 40% def:  ${m.penDamage} with 50% pen · ${m.noPenDamage} with 0 pen · TRUE would keep ${m.baseDamage}`,
  );
  console.log(
    `  Tear payoff: next Strike ${m.tearBoost} (12×1.2); Bone sibling pen ${m.bonePen}`,
  );
}
