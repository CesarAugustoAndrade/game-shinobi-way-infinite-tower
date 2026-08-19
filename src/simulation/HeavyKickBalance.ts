/**
 * T-116 probe — Heavy Kick ATTACK 14 CLOSE; no Mode; explicit cardRole.
 */

import { CardRole, CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { resolveCardRole } from '../game/systems/CardContractSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface HeavyKickProbe {
  authoring: boolean;
  hit: boolean;
  role: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    slashDmg: number;
    dmgPerAp: number;
  };
}

export function runHeavyKickProbe(): HeavyKickProbe {
  const kick = SKILLS.HEAVY_KICK;
  const slash = SKILLS.SWORD_SLASH;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [kick],
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
  const hit = { rollHit: () => ({ hit: true as const, damage: kick.baseDamage }) };
  const landed = resolveSkill({ skill: kick }, state({ modes: clones }), hit);
  const mid = resolveSkill({ skill: kick }, state({ range: CombatRange.MEDIUM }), hit);
  const ap = kick.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  const roleRes = resolveCardRole(kick);
  return {
    authoring:
      kick.cardRole === CardRole.ATTACK &&
      kick.apCost === 2 &&
      kick.chakraCost === 0 &&
      kick.cooldown === 1 &&
      kick.baseDamage === 14 &&
      kick.allowedRanges?.length === 1 &&
      kick.allowedRanges[0] === CombatRange.CLOSE &&
      kick.modeInteraction === undefined,
    hit:
      landed.ok === true &&
      dmg === 14 &&
      landed.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 3 &&
      mid.ok === false,
    role: roleRes.ok === true && roleRes.role === CardRole.ATTACK,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      slashDmg: slash.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printHeavyKickProbe(probe: HeavyKickProbe): void {
  const m = probe.metrics;
  console.log('\n── T-116 Heavy Kick probe ──');
  console.log(`  authoring ATTACK 14 CLOSE no Mode: ${probe.authoring}`);
  console.log(`  hit 14 / clones stay 3; MEDIUM reject: ${probe.hit}`);
  console.log(`  resolveCardRole ATTACK without map:    ${probe.role}`);
  console.log('  ── balance vs mute same 14/AP2 (honesty) and Sword Slash 10 CLOSE ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; unchanged 14 / 2 = 7.00)`);
  console.log(`  Sword Slash:        ${m.slashDmg} CLOSE ATTACK sibling`);
}
