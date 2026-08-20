/**
 * T-136 AC: Modes panel shows skill names + upkeep, not raw mode.id only.
 */

import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ModeRuntimeState } from '../../../game/types';
import { SKILLS } from '../../../game/constants/skills';
import { getModeDefinition } from '../../../game/constants/modes';
import {
  formatModeUpkeep,
  modePanelDisplayName,
} from '../../../game/systems/combatSkillViewModel';
import { CombatModesPanel } from '../CombatModesPanel';

const sharinganName = Object.values(SKILLS).find((s) => s.id === 'sharingan_2')?.name;
const sharinganUpkeep = formatModeUpkeep(getModeDefinition('sharingan_2')?.upkeep);

function renderModes(
  extra: {
    displayName?: string;
    upkeepLabel?: string;
    id?: string;
    charges?: number;
    maxCharges?: number;
  } = {},
): string {
  return renderToStaticMarkup(
    createElement(CombatModesPanel, {
      modes: [
        {
          id: extra.id ?? 'sharingan_2',
          family: 'SHARINGAN',
          charges: extra.charges ?? 2,
          maxCharges: extra.maxCharges ?? 3,
          state: ModeRuntimeState.ON,
          stage: 2,
          displayName: extra.displayName ?? modePanelDisplayName('sharingan_2', sharinganName),
          upkeepLabel: extra.upkeepLabel ?? sharinganUpkeep,
        },
      ],
      upkeepPriority: ['sharingan_2'],
    }),
  );
}

describe('T-136 name', () => {
  it('shows Sharingan (2-Tomoe) as visible text, not only raw id', () => {
    expect(sharinganName).toBe('Sharingan (2-Tomoe)');
    const html = renderModes();
    expect(html).toContain('Sharingan (2-Tomoe)');
    expect(html).toContain('data-mode-id="sharingan_2"');
    const nameSpan = html.match(/combat-modes-panel__name"[^>]*>([^<]*)/);
    expect(nameSpan?.[1]).toContain('Sharingan (2-Tomoe)');
    expect(nameSpan?.[1]).not.toBe('sharingan_2');
  });
});

describe('T-136 upkeep', () => {
  it('shows 4 CP from ModeDefinition.upkeep', () => {
    expect(sharinganUpkeep).toBe('4 CP');
    const html = renderModes();
    expect(html).toContain('4 CP');
    expect(html).toContain('combat-modes-panel__upkeep');
  });
});

describe('T-136 regress', () => {
  it('still renders charges/max and priority (T-010 testids)', () => {
    const html = renderModes();
    expect(html).toContain('data-testid="combat-modes-panel"');
    expect(html).toContain('data-testid="combat-mode-row"');
    expect(html).toContain('data-testid="mode-charges"');
    expect(html).toContain('2/3');
    expect(html).toContain('pri 1');
  });
});
