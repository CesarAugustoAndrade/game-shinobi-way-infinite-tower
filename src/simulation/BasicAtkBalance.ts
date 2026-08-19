/**
 * T-117 probe — Basic Strike ATTACK 12 CLOSE; CD 0; no Mode; explicit cardRole.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { resolveCardRole } from '../game/systems/CardContractSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface BasicAtkProbe {
  authoring: boolean;
  hit: boolean;
  role: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    kickDmg: number;
    kickDmgPerAp: number;
    dmgPerAp: number;
  };
}

export function runBasicAtkProbe(): BasicAtkProbe {
  const strike = SKILLS.BASIC_ATTACK;
  const kick = SKILLS.HEAVY_KICK;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [strike],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const clones = {
    instances: [
      {
        id: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: strike.baseDamage }) };
  const landed = resolveSkill({ skill: strike }, state({ modes: clones }), hit);
  const mid = resolveSkill({ skill: strike }, state({ range: CombatRange.MEDIUM }), hit);
  const ap = strike.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const roleRes = resolveCardRole(strike);
  const kickAp = kick.apCost ?? 0;
  return {
    authoring:
      strike.cardRole === CardRole.ATTACK &&
      strike.apCost === 2 &&
      strike.chakraCost === 0 &&
      strike.cooldown === 0 &&
      strike.baseDamage === 12 &&
      strike.allowedRanges?.length === 1 &&
      strike.allowedRanges[0] === CombatRange.CLOSE &&
      strike.modeInteraction === undefined,
    hit:
      landed.ok === true &&
      dmg === 12 &&
      landed.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 3 &&
      mid.ok === false,
    role: roleRes.ok === true && roleRes.role === CardRole.ATTACK,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      kickDmg: kick.baseDamage,
      kickDmgPerAp: kickAp > 0 ? kick.baseDamage / kickAp : 0,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printBasicAtkProbe(probe: BasicAtkProbe): void {
  const m = probe.metrics;
  console.log('\n── T-117 Basic Strike probe ──');
  console.log(`  authoring ATTACK 12 CLOSE CD0 no Mode: ${probe.authoring}`);
  console.log(`  hit 12 / clones stay 3; MEDIUM reject: ${probe.hit}`);
  console.log(`  resolveCardRole ATTACK without map:    ${probe.role}`);
  console.log('  ── balance vs mute same 12/AP2 (honesty) and Heavy Kick 14/AP2 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; unchanged 12 / 2 = 6.00)`);
  console.log(`  Heavy Kick sibling: ${m.kickDmg} / ${m.kickDmgPerAp.toFixed(2)} dmg/AP CD1`);
}
