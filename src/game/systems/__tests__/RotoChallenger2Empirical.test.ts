import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { WAVES_ARC_EVENTS } from '../../constants/events/wavesArcEvents';
import { LAND_OF_WAVES_CONFIG } from '../../constants/regions/landOfWaves';
import { pickEventForLocation, generateBranchingFloorFromConfig } from '../LocationSystem';
import {
  resolveEventChoice,
  getAvailableEventsForPlayer,
  selectWeightedEvent,
} from '../EventSystem';
import {
  discoverSecretsFromEventFlags,
  discoverSecretByRequirement,
  locationToBranchingFloor,
} from '../RegionSystem';
import { Player, EffectType, Rarity, RiskLevel } from '../../types';

// Helper to create dummy player
function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player-1',
    name: 'Naruto',
    clan: 'UZUMAKI' as any,
    level: 5,
    exp: 100,
    ryo: 500,
    currentHp: 100,
    currentChakra: 100,
    primaryStats: {
      strength: 15,
      dexterity: 20,
      willpower: 20,
      intelligence: 18,
      speed: 20,
      chakra: 20,
      spirit: 15,
      calmness: 15,
      accuracy: 15,
    },
    activeBuffs: [],
    skills: [],
    bag: [],
    equipped: {} as any,
    eventFlags: {},
    merchantSlots: 3,
    treasureQuality: 'COMMON' as any,
    ...overrides,
  } as any;
}

describe('Roto Batch Empirical Stress Tests - Challenger 2 (TASK-R01 to TASK-R13)', () => {
  describe('1. Story Events in wavesArcEvents.ts and Event Picking Logic', () => {
    const requiredStoryEventIds = [
      'meet_tazuna',
      'protect_village',
      'meet_inari',
      'protect_bridge',
      'final_showdown_setup',
      'final_confrontation',
      'gato_defeat',
    ];

    it('All 7 story events are present in WAVES_ARC_EVENTS with correct arc and structure', () => {
      const eventIdsInArc = WAVES_ARC_EVENTS.map((e) => e.id);
      for (const storyId of requiredStoryEventIds) {
        expect(eventIdsInArc).toContain(storyId);
        const event = WAVES_ARC_EVENTS.find((e) => e.id === storyId);
        expect(event).toBeDefined();
        expect(event?.allowedArcs).toContain('WAVES_ARC');
        expect(event?.choices.length).toBeGreaterThan(0);
      }
    });

    it('pickEventForLocation prefers story events when preferredEventIds is provided', () => {
      // A5: spine events use requires/excludesFlags — open only the flags each id needs
      const flagsForPick: Record<string, Record<string, number>> = {
        final_showdown_setup: { bridge_held: 1 },
        gato_defeat: { compound_breached: 1 },
      };
      for (const storyId of requiredStoryEventIds) {
        const player = createMockPlayer({ eventFlags: flagsForPick[storyId] ?? {} });
        const picked = pickEventForLocation('WAVES_ARC', player, [storyId], () => 0.5);
        expect(picked).toBeDefined();
        expect(picked?.id).toBe(storyId);
      }
    });

    it('Location configs in Land of Waves properly tie all 7 story events', () => {
      const tiedEventsInRegion: string[] = [];
      for (const loc of LAND_OF_WAVES_CONFIG.locations) {
        if (loc.tiedStoryEvents) {
          tiedEventsInRegion.push(...loc.tiedStoryEvents);
        }
      }
      for (const storyId of requiredStoryEventIds) {
        expect(tiedEventsInRegion).toContain(storyId);
      }
    });

    it('All 7 story events can resolve choices successfully without throwing', () => {
      const player = createMockPlayer();
      const playerStats = { derived: { maxHp: 100, maxChakra: 100 } };

      for (const storyId of requiredStoryEventIds) {
        const event = WAVES_ARC_EVENTS.find((e) => e.id === storyId)!;
        const availableChoices = event.choices;
        expect(availableChoices.length).toBeGreaterThan(0);

        // Test resolving the first choice of each story event
        const choice = availableChoices[0];
        const res = resolveEventChoice(player, choice, playerStats);
        expect(res.success).toBe(true);
        expect(res.player).not.toBeNull();
      }
    });
  });

  describe('2. drowned_shrine_discovered Flag Outcome Unlocking DROWNED_SHRINE', () => {
    it('meet_tazuna choice 1 outcome sets drowned_shrine_discovered flag', () => {
      const player = createMockPlayer();
      const playerStats = { derived: { maxHp: 100, maxChakra: 100 } };
      const tazunaEvent = WAVES_ARC_EVENTS.find((e) => e.id === 'meet_tazuna')!;
      const acceptChoice = tazunaEvent.choices[0]; // Accept Escort Mission

      const res = resolveEventChoice(player, acceptChoice, playerStats);
      expect(res.success).toBe(true);
      expect(res.player?.eventFlags?.drowned_shrine_discovered).toBe(1);
    });

    it('discoverSecretsFromEventFlags unlocks DROWNED_SHRINE location when flag is set', () => {
      // Build mock Region object from LAND_OF_WAVES_CONFIG
      const mockRegion = {
        id: LAND_OF_WAVES_CONFIG.id,
        name: LAND_OF_WAVES_CONFIG.name,
        description: LAND_OF_WAVES_CONFIG.description,
        arc: LAND_OF_WAVES_CONFIG.arc,
        biome: LAND_OF_WAVES_CONFIG.biome,
        baseDifficulty: LAND_OF_WAVES_CONFIG.baseDifficulty,
        currentLocationId: 'the_docks',
        discoveredSecretIds: [],
        locations: LAND_OF_WAVES_CONFIG.locations.map((loc) => ({
          ...loc,
          isDiscovered: !loc.flags.isSecret,
          isAccessible: !loc.flags.isSecret,
          isCompleted: false,
        })),
      } as any;

      // Before flag
      const drownedBefore = mockRegion.locations.find((l: any) => l.id === 'drowned_shrine');
      expect(drownedBefore.isDiscovered).toBe(false);
      expect(drownedBefore.isAccessible).toBe(false);

      // Apply discovery with event flags
      const eventFlags = { drowned_shrine_discovered: 1 };
      const { region: updatedRegion, newlyDiscovered } = discoverSecretsFromEventFlags(
        mockRegion,
        eventFlags,
      );

      expect(newlyDiscovered).toContain('Drowned Shrine');

      const drownedAfter = updatedRegion.locations.find((l: any) => l.id === 'drowned_shrine');
      expect(drownedAfter?.isDiscovered).toBe(true);
      expect(drownedAfter?.isAccessible).toBe(true);
      expect(updatedRegion.discoveredSecretIds).toContain('drowned_shrine');
    });

    it('discoverSecretByRequirement directly unlocks DROWNED_SHRINE', () => {
      const mockRegion = {
        id: LAND_OF_WAVES_CONFIG.id,
        name: LAND_OF_WAVES_CONFIG.name,
        arc: LAND_OF_WAVES_CONFIG.arc,
        baseDifficulty: 40,
        currentLocationId: 'the_docks',
        discoveredSecretIds: [],
        locations: LAND_OF_WAVES_CONFIG.locations.map((loc) => ({
          ...loc,
          isDiscovered: !loc.flags.isSecret,
          isAccessible: !loc.flags.isSecret,
          isCompleted: false,
        })),
      } as any;

      const { region: updatedRegion, discoveredName } = discoverSecretByRequirement(
        mockRegion,
        'drowned_shrine_discovered',
      );

      expect(discoveredName).toBe('Drowned Shrine');
      const drowned = updatedRegion.locations.find((l: any) => l.id === 'drowned_shrine');
      expect(drowned?.isDiscovered).toBe(true);
      expect(drowned?.isAccessible).toBe(true);
    });
  });

  describe('3. Stunned Player State Handling & Pass Turn Button in Combat.tsx', () => {
    const combatTsxPath = join(process.cwd(), 'src/scenes/combat/Combat.tsx');
    const combatCssPath = join(process.cwd(), 'src/scenes/combat/Combat.css');

    it('Combat.tsx contains stun detection logic, banner UI, and pass turn action button', () => {
      const tsxContent = readFileSync(combatTsxPath, 'utf-8');

      // Check stun detection from player.activeBuffs
      expect(tsxContent).toMatch(/isStunned\s*=\s*player\.activeBuffs\.some/);
      expect(tsxContent).toContain('EffectType.STUN');

      // Check canUseSkill blocked when stunned
      expect(tsxContent).toContain('!isPlayerStunned');

      // Check stunned banner role and content
      expect(tsxContent).toContain('className="combat-stunned-banner"');
      expect(tsxContent).toContain('⚡ STUNNED!');
      expect(tsxContent).toContain('combat-stunned-banner__action-btn');
      expect(tsxContent).toContain('STUNNED - PASS TURN');

      // Check pass turn button modifier class
      expect(tsxContent).toContain('combat__pass-btn--stunned');
    });

    it('Combat.css defines styling for combat-stunned-banner and button animation', () => {
      const cssContent = readFileSync(combatCssPath, 'utf-8');

      expect(cssContent).toContain('.combat-stunned-banner');
      expect(cssContent).toContain('.combat-stunned-banner__action-btn');
      expect(cssContent).toContain('.combat__pass-btn--stunned');
      expect(cssContent).toContain('@keyframes combat-stunned-pulse');
    });
  });

  describe('4. CRT Overlay z-index Stacking in CinematicViewscreen.css', () => {
    const viewscreenCssPath = join(
      process.cwd(),
      'src/components/layout/CinematicViewscreen.css',
    );
    const viewscreenTsxPath = join(
      process.cwd(),
      'src/components/layout/CinematicViewscreen.tsx',
    );

    it('CinematicViewscreen.css defines correct z-index hierarchy for CRT and stage elements', () => {
      const cssContent = readFileSync(viewscreenCssPath, 'utf-8');

      // Extract z-index values
      const getZIndex = (selector: string): number => {
        const regex = new RegExp(`\\.${selector}\\s*\\{[^}]*z-index:\\s*(\\d+);`, 's');
        const match = cssContent.match(regex);
        if (!match) throw new Error(`Could not find z-index for .${selector}`);
        return parseInt(match[1], 10);
      };

      const bgZ = getZIndex('cinematic__bg-img');
      const midZ = getZIndex('cinematic__mid-img');
      const gradientZ = getZIndex('cinematic__gradient');
      const vignetteZ = getZIndex('cinematic__vignette');
      // Stage shows enemy only (no left-side player hero sprite)
      const enemyZ = getZIndex('cinematic__enemy-stage');
      const fgZ = getZIndex('cinematic__fg-img');
      const scanlinesZ = getZIndex('cinematic__scanlines');
      const crtFrameZ = getZIndex('cinematic__crt-frame');
      const panelSlotZ = getZIndex('cinematic__panel-slot');

      // Verify layer ordering
      expect(bgZ).toBe(0);
      expect(midZ).toBe(1);
      expect(gradientZ).toBe(2);
      expect(vignetteZ).toBe(3);
      expect(enemyZ).toBe(10);
      expect(fgZ).toBe(11);

      // CRT Scanlines (25) & Frame (26) sit ABOVE sprites (10) and foreground (11)
      expect(scanlinesZ).toBe(25);
      expect(crtFrameZ).toBe(26);
      expect(scanlinesZ).toBeGreaterThan(enemyZ);
      expect(scanlinesZ).toBeGreaterThan(fgZ);
      expect(crtFrameZ).toBeGreaterThan(scanlinesZ);

      // Panel Slot (30) sits ABOVE CRT frame (26)
      expect(panelSlotZ).toBe(30);
      expect(panelSlotZ).toBeGreaterThan(crtFrameZ);

      // Player hero must not occupy the stage
      expect(cssContent).not.toContain('.cinematic__hero-sprite');
    });

    it('CinematicViewscreen.tsx passes pointer-events properly and renders scanlines and crt-frame', () => {
      const tsxContent = readFileSync(viewscreenTsxPath, 'utf-8');

      expect(tsxContent).toContain('className="cinematic__scanlines"');
      expect(tsxContent).toContain('className="cinematic__crt-frame"');
      expect(tsxContent).toContain('FeatureFlags.ENABLE_CRT_OVERLAY');
      expect(tsxContent).toContain('className="cinematic__panel-slot"');
    });
  });
});
