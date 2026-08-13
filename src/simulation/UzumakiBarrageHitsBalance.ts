/**
 * T-020 probe — Barrage clones ON 5 rolls + charge; OFF 3 rolls.
 */

import { CombatRange, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface UzumakiBarrageHitsProbe {
  authoring: boolean;
  onFiveRolls: boolean;
  offThreeRolls: boolean;
}

export function runUzumakiBarrageHitsProbe(): UzumakiBarrageHitsProbe {
  const barrage = Object.values(SKILLS).find((entry) => entry.id === 'uzumaki_barrage');
  if (!barrage) {
    return { authoring: false, onFiveRolls: false, offThreeRolls: false };
  }
  const state = (modes: ResolveSkillState['modes']): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes,
    skills: [barrage],
    playerBuffs: [],
    enemyHp: 50,
  });
  const countHits = (modes: ResolveSkillState['modes']) => {
    let rolls = 0;
    const result = resolveSkill(
      { skill: barrage },
      state(modes),
      {
        rollHit: () => {
          rolls += 1;
          return { hit: true, damage: barrage.baseDamage };
        },
      },
    );
    return { result, rolls };
  };
  const on = countHits({
    instances: [
      { id: 'shadow_clone', family: MODE_FAMILY.CLONES, charges: 3, state: ModeRuntimeState.ON },
    ],
  });
  const off = countHits(emptyModeBoard());
  return {
    authoring:
      barrage.hitCount === 3 &&
      barrage.modeInteraction?.modeId === 'shadow_clone' &&
      barrage.modeInteraction.consumeCharges === 1 &&
      barrage.modeInteraction.bonusHits === 2,
    onFiveRolls:
      on.result.ok &&
      on.rolls === 5 &&
      on.result.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges === 2,
    offThreeRolls: off.result.ok && off.rolls === 3,
  };
}

export function printUzumakiBarrageHitsProbe(probe: UzumakiBarrageHitsProbe): void {
  console.log('\n── T-020 Uzumaki Barrage hits probe ──');
  console.log(`  authoring 3+2:   ${probe.authoring}`);
  console.log(`  ON 5 rolls:      ${probe.onFiveRolls}`);
  console.log(`  OFF 3 rolls:     ${probe.offThreeRolls}`);
}
