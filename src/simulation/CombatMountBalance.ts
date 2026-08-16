/**
 * T-087 probe — Combat mounts Modes/Setup; grantedRanges opens Chidori MEDIUM.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { CombatRange } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { canPlaySkill, type SkillPlayContext } from '../game/systems/skillPlayability';

export interface CombatMountProbe {
  panelsMounted: boolean;
  ribbonWired: boolean;
  grantedOpensMedium: boolean;
  metrics: {
    blockedWithoutGrant: boolean;
    playableWithGrant: boolean;
    closeStillPlayable: boolean;
  };
}

const baseCtx = (range: CombatRange, granted?: CombatRange[]): SkillPlayContext => ({
  skill: SKILLS.CHIDORI,
  currentChakra: 20,
  currentHp: 80,
  maxHp: 80,
  currentAp: 6,
  currentRange: range,
  activeBuffs: [],
  grantedRanges: granted,
});

export function runCombatMountProbe(): CombatMountProbe {
  const combatSrc = readFileSync(join(process.cwd(), 'src/scenes/combat/Combat.tsx'), 'utf-8');
  const handSrc = readFileSync(join(process.cwd(), 'src/components/combat/Hand.tsx'), 'utf-8');
  const blockedWithoutGrant = !canPlaySkill(baseCtx(CombatRange.MEDIUM));
  const playableWithGrant = canPlaySkill(baseCtx(CombatRange.MEDIUM, [CombatRange.MEDIUM]));
  const closeStillPlayable = canPlaySkill(baseCtx(CombatRange.CLOSE));
  return {
    panelsMounted:
      combatSrc.includes('<CombatModesPanel') && combatSrc.includes('<TacticalSetupPanel'),
    ribbonWired:
      /mainAttackId=\{player\.skillConfig\?\.mainAttackId/.test(combatSrc) &&
      handSrc.includes('mainAttackId={mainAttackId}'),
    grantedOpensMedium: blockedWithoutGrant && playableWithGrant,
    metrics: {
      blockedWithoutGrant,
      playableWithGrant,
      closeStillPlayable,
    },
  };
}

export function printCombatMountProbe(probe: CombatMountProbe): void {
  const m = probe.metrics;
  console.log('\n── T-087 Combat mount / grantedRanges probe ──');
  console.log(`  Modes+Setup mounted:    ${probe.panelsMounted}`);
  console.log(`  Main ribbon wired:      ${probe.ribbonWired}`);
  console.log(`  Chidori MEDIUM grant:   ${probe.grantedOpensMedium}`);
  console.log('  ── balance vs no grant ──');
  console.log(`  MEDIUM without grant:   blocked=${m.blockedWithoutGrant}  (CLOSE-only melee)`);
  console.log(`  MEDIUM with grant:      playable=${m.playableWithGrant}  (Sharingan 3 payoff)`);
  console.log(`  CLOSE still playable:   ${m.closeStillPlayable}`);
}
