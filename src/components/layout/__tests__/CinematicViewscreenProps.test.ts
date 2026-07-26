import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CinematicViewscreen: stage composition (enemy-only)', () => {
  const cssPath = join(process.cwd(), 'src/components/layout/CinematicViewscreen.css');
  const tsxPath = join(process.cwd(), 'src/components/layout/CinematicViewscreen.tsx');

  it('does not render a player hero sprite on the combat stage', () => {
    const tsxContent = readFileSync(tsxPath, 'utf-8');
    expect(tsxContent).not.toContain('heroImage');
    expect(tsxContent).not.toContain('heroCutout');
    expect(tsxContent).not.toContain('cinematic__hero-sprite');
    expect(tsxContent).toContain('enemyImage');
    expect(tsxContent).toContain('enemyCutout');
    expect(tsxContent).toContain('cinematic__enemy-sprite');
  });

  it('places scanlines (z=25) and crt-frame (z=26) above enemy sprites (z=10)', () => {
    const cssContent = readFileSync(cssPath, 'utf-8');

    const scanlinesBlock = cssContent.match(/\.cinematic__scanlines\s*\{[^}]*\}/)?.[0] || '';
    expect(scanlinesBlock).toContain('z-index: 25;');
    expect(scanlinesBlock).toContain('pointer-events: none;');

    const crtFrameBlock = cssContent.match(/\.cinematic__crt-frame\s*\{[^}]*\}/)?.[0] || '';
    expect(crtFrameBlock).toContain('z-index: 26;');
    expect(crtFrameBlock).toContain('pointer-events: none;');

    // Hero sprite classes must be gone
    expect(cssContent).not.toContain('.cinematic__hero-sprite');

    const panelSlotBlock = cssContent.match(/\.cinematic__panel-slot\s*\{[^}]*\}/)?.[0] || '';
    expect(panelSlotBlock).toContain('z-index: 30;');
  });
});
