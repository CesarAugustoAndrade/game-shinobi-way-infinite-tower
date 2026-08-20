/**
 * T-136 probe — Modes panel names/upkeep honesty vs raw snake_case ids.
 */

import { SKILLS } from '../game/constants/skills';
import { getModeDefinition } from '../game/constants/modes';
import {
  formatModeUpkeep,
  modePanelDisplayName,
} from '../game/systems/combatSkillViewModel';

export interface ModesPanelLabelsProbe {
  name: boolean;
  upkeep: boolean;
  fallback: boolean;
  metrics: {
    sharinganName: string;
    sharinganUpkeep: string | undefined;
    gateUpkeep: string | undefined;
    rawIdFallback: string;
  };
}

export function runModesPanelLabelsProbe(): ModesPanelLabelsProbe {
  const sharinganName = Object.values(SKILLS).find((s) => s.id === 'sharingan_2')?.name ?? '';
  const sharinganUpkeep = formatModeUpkeep(getModeDefinition('sharingan_2')?.upkeep);
  const gateUpkeep = formatModeUpkeep(getModeDefinition('gate_of_limit')?.upkeep);
  const rawIdFallback = modePanelDisplayName('unknown_mode');
  return {
    name:
      modePanelDisplayName('sharingan_2', sharinganName) === 'Sharingan (2-Tomoe)' &&
      sharinganName === 'Sharingan (2-Tomoe)',
    upkeep: sharinganUpkeep === '4 CP' && gateUpkeep === '12 HP',
    fallback: rawIdFallback === 'Unknown Mode' && formatModeUpkeep({}) === undefined,
    metrics: {
      sharinganName: modePanelDisplayName('sharingan_2', sharinganName),
      sharinganUpkeep,
      gateUpkeep,
      rawIdFallback,
    },
  };
}

export function printModesPanelLabelsProbe(probe: ModesPanelLabelsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-136 Modes panel labels probe ──');
  console.log(`  sharingan display name: ${probe.name}`);
  console.log(`  upkeep 4 CP / 12 HP:    ${probe.upkeep}`);
  console.log(`  fallback title-case:    ${probe.fallback}`);
  console.log('  ── honesty vs raw ids ──');
  console.log(`  visible name:  ${m.sharinganName}  (was sharingan_2)`);
  console.log(`  sharingan upkeep: ${m.sharinganUpkeep}  (was hidden)`);
  console.log(`  gate_of_limit:    ${m.gateUpkeep}  (was hidden)`);
  console.log(`  unknown fallback: ${m.rawIdFallback}`);
  console.log('  ── equilibrium ──');
  console.log('  Presentation only. No combat math. WR/TTK unchanged. Players can now see Mode peaje.');
}
