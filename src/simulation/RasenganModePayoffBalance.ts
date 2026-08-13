/**
 * T-018 probe — Rasengan clones ON +50% + 1 charge; OFF is base.
 */

import { CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface RasenganModePayoffProbe {
  authoring: boolean;
  onEnhance: boolean;
  offBase: boolean;
}

export function runRasenganModePayoffProbe(): RasenganModePayoffProbe {
  const rasengan = SKILLS.RASENGAN;
  const authoring = Boolean(
    rasengan.cardRole === 'ATTACK' &&
      rasengan.modeInteraction?.modeId === 'shadow_clone' &&
      rasengan.modeInteraction.consumeCharges === 1 &&
      rasengan.modeInteraction.damageMultBonus === 0.5,
  );
  const state = (modes: ResolveSkillState['modes']): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes,
    skills: [rasengan],
    playerBuffs: [],
    enemyHp: 50,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: rasengan.baseDamage }) };
  const on = resolveSkill(
    { skill: rasengan },
    state({
      instances: [
        {
          id: 'shadow_clone',
          family: MODE_FAMILY.CLONES,
          charges: 3,
          state: ModeRuntimeState.ON,
        },
      ],
    }),
    hit,
  );
  const off = resolveSkill({ skill: rasengan }, state(emptyModeBoard()), hit);
  return {
    authoring,
    onEnhance:
      on.ok &&
      on.damageDealt === Math.floor(rasengan.baseDamage * 1.5) &&
      on.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 2,
    offBase: off.ok && off.damageDealt === rasengan.baseDamage,
  };
}

export function printRasenganModePayoffProbe(probe: RasenganModePayoffProbe): void {
  console.log('\n── T-018 Rasengan Mode payoff probe ──');
  console.log(`  authoring ATTACK+0.5: ${probe.authoring}`);
  console.log(`  ON 1.5× + charge:     ${probe.onEnhance}`);
  console.log(`  OFF base:             ${probe.offBase}`);
}
