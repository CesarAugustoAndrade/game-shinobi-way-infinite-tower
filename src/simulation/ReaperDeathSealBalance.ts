/**
 * T-123 probe — Reaper Death Seal ATTACK AP6; ≤35% HP mutual KO; once/combat.
 */

import { CardRole, CombatRange } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { isSkillReadyOnTurn } from '../game/systems/TurnClockSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ReaperDeathSealProbe {
  authoring: boolean;
  gate: boolean;
  ko: boolean;
  metrics: {
    legacyAp: number;
    apCost: number;
    gateHp: number;
    koHp: number;
    playerHpAfter: number;
    enemyHpAfter: number;
    tengaiDmg: number;
    kirinDmg: number;
  };
}

export function runReaperDeathSealProbe(): ReaperDeathSealProbe {
  const seal = SKILLS.REAPER_DEATH_SEAL;
  const tengai = SKILLS.TENGAI_SHINSEI;
  const kirin = SKILLS.KIRIN;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [seal],
    playerBuffs: [],
    enemyHp: 35,
    enemyMaxHp: 100,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: 0 }) };
  const high = resolveSkill({ skill: seal }, state({ enemyHp: 36 }), hit);
  const legal = resolveSkill({ skill: seal }, state(), hit);
  const used = legal.ok ? legal.state.skills.find((s) => s.id === seal.id) : undefined;
  const again =
    legal.ok && used
      ? resolveSkill(
          { skill: used },
          {
            ...legal.state,
            pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
            enemyHp: 35,
          },
          hit,
        )
      : { ok: false as const, reason: 'not-ready' as const, state: state() };
  return {
    authoring:
      seal.cardRole === CardRole.ATTACK &&
      seal.apCost === 6 &&
      seal.chakraCost === 0 &&
      seal.cooldown === 99 &&
      seal.mutualKo === true &&
      seal.mutualKoMaxHpFraction === 0.35,
    gate:
      high.ok === false &&
      (high.ok ? false : high.reason === 'hp-threshold') &&
      high.state.pools.hp === 40 &&
      high.state.enemyHp === 36,
    ko:
      legal.ok === true &&
      legal.state.pools.hp === 0 &&
      legal.state.enemyHp === 0 &&
      legal.damageDealt === 35 &&
      isSkillReadyOnTurn(used?.readyOnTurn, 2) === false &&
      again.ok === false,
    metrics: {
      legacyAp: 2,
      apCost: seal.apCost ?? 0,
      gateHp: 36,
      koHp: 35,
      playerHpAfter: legal.ok ? legal.state.pools.hp : -1,
      enemyHpAfter: legal.ok ? legal.state.enemyHp : -1,
      tengaiDmg: tengai.baseDamage,
      kirinDmg: kirin.baseDamage,
    },
  };
}

export function printReaperDeathSealProbe(probe: ReaperDeathSealProbe): void {
  const m = probe.metrics;
  console.log('\n── T-123 Reaper Death Seal probe ──');
  console.log(`  authoring ATTACK AP6 CD99 mutualKo ≤35%: ${probe.authoring}`);
  console.log(`  >35% reject no spend:                    ${probe.gate}`);
  console.log(`  ≤35% both HP 0; second cast not-ready:   ${probe.ko}`);
  console.log('  ── balance vs mute AP2 always-on KO and Tengai/Kirin finishers ──');
  console.log(`  AP:          ${m.apCost}  (was ${m.legacyAp})`);
  console.log(`  gate / KO:   ${m.gateHp}/100 reject · ${m.koHp}/100 both 0`);
  console.log(`  Tengai/Kirin siblings: ${m.tengaiDmg} / ${m.kirinDmg} (damage finishers, not mutual KO)`);
}
