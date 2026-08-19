/**
 * T-118 probe — Fang Over Fang ATTACK 2×7 CLOSE; +15% Setup if entered CLOSE this turn.
 */

import { CardRole, CombatRange } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface FangOverFangProbe {
  authoring: boolean;
  multiHit: boolean;
  setup: boolean;
  metrics: {
    legacySingle: number;
    baseDamage: number;
    setupDamage: number;
    apCost: number;
    chakraCost: number;
    strikeDmg: number;
    kickDmg: number;
    dmgPerAp: number;
    setupDmgPerAp: number;
  };
}

export function runFangOverFangProbe(): FangOverFangProbe {
  const fang = SKILLS.FANG_OVER_FANG;
  const strike = SKILLS.BASIC_ATTACK;
  const kick = SKILLS.HEAVY_KICK;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [fang],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: fang.baseDamage }) };
  const base = resolveSkill({ skill: fang }, state(), hit);
  const armed = resolveSkill({ skill: fang }, state({ enteredCloseThisTurn: true }), hit);
  const mid = resolveSkill({ skill: fang }, state({ range: CombatRange.MEDIUM }), hit);
  const ap = fang.apCost ?? 0;
  const dmg = base.ok ? base.damageDealt : 0;
  const setupDmg = armed.ok ? armed.damageDealt : 0;
  return {
    authoring:
      fang.cardRole === CardRole.ATTACK &&
      fang.apCost === 2 &&
      fang.chakraCost === 5 &&
      fang.cooldown === 3 &&
      fang.hitCount === 2 &&
      fang.baseDamage === 7 &&
      fang.allowedRanges?.length === 1 &&
      fang.allowedRanges[0] === CombatRange.CLOSE &&
      fang.modeInteraction === undefined &&
      fang.setupMultIfEnteredCloseThisTurn === 0.15,
    multiHit:
      base.ok === true &&
      base.hitsLanded === 2 &&
      dmg === 14 &&
      mid.ok === false,
    setup:
      armed.ok === true &&
      setupDmg === Math.floor(14 * 1.15) &&
      dmg === 14,
    metrics: {
      legacySingle: 13,
      baseDamage: dmg,
      setupDamage: setupDmg,
      apCost: ap,
      chakraCost: fang.chakraCost ?? 0,
      strikeDmg: strike.baseDamage,
      kickDmg: kick.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
      setupDmgPerAp: ap > 0 ? setupDmg / ap : 0,
    },
  };
}

export function printFangOverFangProbe(probe: FangOverFangProbe): void {
  const m = probe.metrics;
  console.log('\n── T-118 Fang Over Fang probe ──');
  console.log(`  authoring ATTACK 2×7 CLOSE AP2/CP5/CD3: ${probe.authoring}`);
  console.log(`  multi-hit 14 / MEDIUM reject:           ${probe.multiHit}`);
  console.log(`  Setup +15% only if entered CLOSE:       ${probe.setup}`);
  console.log('  ── balance vs mute single 13 and floor CLOSE pair ──');
  console.log(
    `  package:     ${m.baseDamage} (was ${m.legacySingle} single) / AP${m.apCost} CP${m.chakraCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 13/2 = 6.50)`,
  );
  console.log(
    `  Setup on:    ${m.setupDamage}  (dmg/AP ${m.setupDmgPerAp.toFixed(2)}; floor(14*1.15)=16)`,
  );
  console.log(`  floor pair:  Strike ${m.strikeDmg}/AP2=6.00 · Kick ${m.kickDmg}/AP2=7.00 (no CP)`);
}
