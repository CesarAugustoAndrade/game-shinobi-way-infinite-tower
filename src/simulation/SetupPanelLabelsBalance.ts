/**
 * T-138 probe — Setup panel human labels vs raw snake_case mark ids.
 */

import {
  markPanelDisplayName,
  prettifyId,
} from '../game/systems/combatSkillViewModel';

export interface SetupPanelLabelsProbe {
  known: boolean;
  fallback: boolean;
  metrics: {
    bleed: string;
    mudWall: string;
    counter: string;
    unknown: string;
  };
}

export function runSetupPanelLabelsProbe(): SetupPanelLabelsProbe {
  return {
    known:
      markPanelDisplayName('bleed') === 'Bleed' &&
      markPanelDisplayName('mud_wall_shield') === 'Mud Wall' &&
      markPanelDisplayName('counter_reflect') === 'Counter',
    fallback:
      markPanelDisplayName('custom_foo_bar') === 'Custom Foo Bar' &&
      prettifyId('unknown_mode') === 'Unknown Mode',
    metrics: {
      bleed: markPanelDisplayName('bleed'),
      mudWall: markPanelDisplayName('mud_wall_shield'),
      counter: markPanelDisplayName('counter_reflect'),
      unknown: markPanelDisplayName('custom_foo_bar'),
    },
  };
}

export function printSetupPanelLabelsProbe(probe: SetupPanelLabelsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-138 Setup panel labels probe ──');
  console.log(`  known CTS labels:     ${probe.known}`);
  console.log(`  prettify fallback:    ${probe.fallback}`);
  console.log('  ── honesty vs raw ids ──');
  console.log(`  bleed:            ${m.bleed}  (was bleed)`);
  console.log(`  mud_wall_shield:  ${m.mudWall}  (was mud_wall_shield)`);
  console.log(`  counter_reflect:  ${m.counter}  (was counter_reflect)`);
  console.log(`  custom_foo_bar:   ${m.unknown}`);
  console.log('  ── equilibrium ──');
  console.log('  Presentation only. No combat math. WR/TTK unchanged.');
}
