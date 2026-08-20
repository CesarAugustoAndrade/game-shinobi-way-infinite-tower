/**
 * T-138 AC: Setup panel shows human mark labels, not raw snake_case ids.
 */

import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { CombatActor, MarkConsumeTiming } from '../../../game/types';
import { markPanelDisplayName } from '../../../game/systems/combatSkillViewModel';
import { TacticalSetupPanel } from '../TacticalSetupPanel';

function renderSetup(id: string): string {
  return renderToStaticMarkup(
    createElement(TacticalSetupPanel, {
      marks: [
        {
          id,
          sourceSkillId: id,
          owner: CombatActor.PLAYER,
          target: CombatActor.ENEMY,
          duration: 2,
          stacks: 3,
          consume: MarkConsumeTiming.ATTEMPT,
        },
      ],
    }),
  );
}

describe('T-138 label', () => {
  it('shows Bleed / Mud Wall as visible text, not only raw id', () => {
    expect(markPanelDisplayName('bleed')).toBe('Bleed');
    const bleed = renderSetup('bleed');
    expect(bleed).toContain('Bleed');
    expect(bleed).toContain('data-mark-id="bleed"');
    const name = bleed.match(/tactical-setup-panel__name">([^<]*)/);
    expect(name?.[1]).toBe('Bleed');
    expect(name?.[1]).not.toBe('bleed');

    const wall = renderSetup('mud_wall_shield');
    expect(wall).toContain('Mud Wall');
    expect(wall).toContain('data-mark-id="mud_wall_shield"');
  });
});

describe('T-138 fallback', () => {
  it('prettifies unknown custom_foo_bar', () => {
    expect(markPanelDisplayName('custom_foo_bar')).toBe('Custom Foo Bar');
    const html = renderSetup('custom_foo_bar');
    expect(html).toContain('Custom Foo Bar');
    expect(html).toContain('data-mark-id="custom_foo_bar"');
  });
});

describe('T-138 regress', () => {
  it('still renders owner, stacks, duration (T-010 testids)', () => {
    const html = renderSetup('bleed');
    expect(html).toContain('data-testid="tactical-setup-panel"');
    expect(html).toContain('data-testid="setup-mark-row"');
    expect(html).toContain('data-testid="mark-owner"');
    expect(html).toContain('data-testid="mark-stacks"');
    expect(html).toContain('data-testid="mark-duration"');
    expect(html).toContain('own');
    expect(html).toContain('×3');
    expect(html).toContain('2t');
  });
});
