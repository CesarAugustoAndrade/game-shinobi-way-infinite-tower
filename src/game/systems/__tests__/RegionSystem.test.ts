/**
 * RegionSystem Unit Tests (A-013)
 * Card deck draw, completion updates, markLocationComplete.
 */

import { describe, it, expect } from 'vitest';
import {
  generateRegion,
  enterLocationFromCard,
  markLocationComplete,
  getCurrentLocation,
  initializeLocationDeck,
  updateDeckAfterCompletion,
  drawLocationCards,
  createInitialIntelPool,
  addIntel,
  isRegionBossDefeated,
  discoverSecretsFromEventFlags,
  discoverSecretsFromCompletedLocation,
  humanizeAtmosphereEventId,
  pickAtmosphereFlavor,
  getCardDisplayInfo,
} from '../RegionSystem';
import {
  LAND_OF_WAVES_CONFIG,
  CHUNIN_EXAMS_CONFIG,
  SASUKE_RETRIEVAL_CONFIG,
  GREAT_NINJA_WAR_CONFIG,
  REGION_ORDER,
  getPlayableRegionCount,
} from '../../constants/regions';
import { IntelRevealLevel } from '../../types';
import { createMockPlayer } from './testFixtures';
import type { LocationCard } from '../../types';

function makeRegion() {
  const player = createMockPlayer({ locationsCleared: 0 });
  return generateRegion(LAND_OF_WAVES_CONFIG, 40, player);
}

describe('CHUNIN_EXAMS_CONFIG (T-024)', () => {
  it('has 13 locations with two entries and a boss', () => {
    expect(CHUNIN_EXAMS_CONFIG.locations.length).toBe(13);
    expect(CHUNIN_EXAMS_CONFIG.entryLocationIds.length).toBe(2);
    expect(CHUNIN_EXAMS_CONFIG.bossLocationId).toBe('orochimaru_arena');
    expect(CHUNIN_EXAMS_CONFIG.arc).toBe('EXAMS_ARC');
    expect(CHUNIN_EXAMS_CONFIG.baseDifficulty).toBe(55);
    const secrets = CHUNIN_EXAMS_CONFIG.locations.filter(l => l.flags.isSecret);
    expect(secrets.length).toBe(3);
    const boss = CHUNIN_EXAMS_CONFIG.locations.find(l => l.id === 'orochimaru_arena');
    expect(boss?.flags.isBoss).toBe(true);
    expect(boss?.dangerLevel).toBe(7);
  });

  it('generates a playable region with boss detectable after clear', () => {
    const player = createMockPlayer({ locationsCleared: 5 });
    const region = generateRegion(CHUNIN_EXAMS_CONFIG, 55, player);
    expect(region.locations.length).toBe(13);
    expect(region.arc).toBe('EXAMS_ARC');
    const boss = region.locations.find(l => l.flags.isBoss);
    expect(boss).toBeDefined();
    const entered = enterLocationFromCard(region, boss!.id);
    const completed = markLocationComplete(entered);
    expect(isRegionBossDefeated(completed)).toBe(true);
  });

  it('registers four playable campaign regions after T-026', () => {
    expect(getPlayableRegionCount()).toBe(4);
    expect(REGION_ORDER.every((e) => e.config != null)).toBe(true);
  });
});

describe('SASUKE_RETRIEVAL_CONFIG (T-025)', () => {
  it('has 13 locations with two entries and Valley of the End boss', () => {
    expect(SASUKE_RETRIEVAL_CONFIG.locations.length).toBe(13);
    expect(SASUKE_RETRIEVAL_CONFIG.entryLocationIds).toEqual(['leaf_gate', 'river_road']);
    expect(SASUKE_RETRIEVAL_CONFIG.bossLocationId).toBe('valley_of_the_end');
    expect(SASUKE_RETRIEVAL_CONFIG.arc).toBe('ROGUE_ARC');
    expect(SASUKE_RETRIEVAL_CONFIG.baseDifficulty).toBe(70);
    expect(SASUKE_RETRIEVAL_CONFIG.locations.filter(l => l.flags.isSecret).length).toBe(3);
    const boss = SASUKE_RETRIEVAL_CONFIG.locations.find(l => l.id === 'valley_of_the_end');
    expect(boss?.flags.isBoss).toBe(true);
    expect(boss?.dangerLevel).toBe(7);
  });

  it('generates region and detects boss clear', () => {
    const player = createMockPlayer({ locationsCleared: 10 });
    const region = generateRegion(SASUKE_RETRIEVAL_CONFIG, 70, player);
    expect(region.locations.length).toBe(13);
    const boss = region.locations.find(l => l.flags.isBoss)!;
    const completed = markLocationComplete(enterLocationFromCard(region, boss.id));
    expect(isRegionBossDefeated(completed)).toBe(true);
  });
});

describe('GREAT_NINJA_WAR_CONFIG (T-026)', () => {
  it('has 13 locations, WAR_ARC, campaign finale boss', () => {
    expect(GREAT_NINJA_WAR_CONFIG.locations.length).toBe(13);
    expect(GREAT_NINJA_WAR_CONFIG.entryLocationIds).toEqual(['alliance_camp', 'outer_trenches']);
    expect(GREAT_NINJA_WAR_CONFIG.bossLocationId).toBe('god_tree_heart');
    expect(GREAT_NINJA_WAR_CONFIG.arc).toBe('WAR_ARC');
    expect(GREAT_NINJA_WAR_CONFIG.baseDifficulty).toBe(85);
    expect(GREAT_NINJA_WAR_CONFIG.locations.filter((l) => l.flags.isSecret).length).toBe(3);
    const boss = GREAT_NINJA_WAR_CONFIG.locations.find((l) => l.id === 'god_tree_heart');
    expect(boss?.flags.isBoss).toBe(true);
    expect(boss?.dangerLevel).toBe(7);
  });

  it('generates and boss clear completes region', () => {
    const player = createMockPlayer({ locationsCleared: 15 });
    const region = generateRegion(GREAT_NINJA_WAR_CONFIG, 85, player);
    expect(region.biome).toBe('Divine Tree Roots');
    const boss = region.locations.find((l) => l.flags.isBoss)!;
    const completed = markLocationComplete(enterLocationFromCard(region, boss.id));
    expect(isRegionBossDefeated(completed)).toBe(true);
    expect(completed.isCompleted).toBe(true);
  });
});

describe('isRegionBossDefeated', () => {
  it('is false until the boss location is completed', () => {
    const region = makeRegion();
    expect(isRegionBossDefeated(region)).toBe(false);
  });

  it('is true after the boss location is marked complete (flags.isBoss)', () => {
    const region = makeRegion();
    const boss = region.locations.find(l => l.flags.isBoss);
    expect(boss).toBeDefined();
    const entered = enterLocationFromCard(region, boss!.id);
    const completed = markLocationComplete(entered);
    expect(isRegionBossDefeated(completed)).toBe(true);
    expect(completed.isCompleted).toBe(true);
  });
});

describe('markLocationComplete', () => {
  it('marks the current location completed and increments locationsCompleted', () => {
    const region = makeRegion();
    // Generated location ids are `location-<configId>-…`; enter via card path
    // (does not require the config-id entryLocationIds match).
    const entryLoc = region.locations.find(l => l.flags.isEntry) ?? region.locations[0];
    const entered = enterLocationFromCard(region, entryLoc.id);
    const before = entered.locationsCompleted;

    expect(getCurrentLocation(entered)?.id).toBe(entryLoc.id);

    const completed = markLocationComplete(entered);
    const loc = getCurrentLocation(completed);

    expect(loc?.isCompleted).toBe(true);
    expect(completed.locationsCompleted).toBe(before + 1);
    // Other locations remain incomplete
    const others = completed.locations.filter(l => l.id !== loc?.id);
    expect(others.every(l => l.isCompleted === false)).toBe(true);
  });

  it('is a no-op when there is no current location', () => {
    const region = makeRegion();
    expect(region.currentLocationId).toBeNull();
    const result = markLocationComplete(region);
    expect(result).toEqual(region);
    expect(result.locationsCompleted).toBe(0);
  });
});

describe('initializeLocationDeck / updateDeckAfterCompletion', () => {
  it('builds a deck entry per region location with base weights', () => {
    const region = makeRegion();
    const deck = initializeLocationDeck(region);

    expect(deck.regionId).toBe(region.id);
    expect(deck.locations.length).toBe(region.locations.length);
    for (const entry of deck.locations) {
      expect(entry.baseWeight).toBe(10 - entry.dangerLevel);
      expect(entry.isCompleted).toBe(false);
      expect(entry.completionPenalty).toBe(1.0);
    }
  });

  it('marks a location completed and applies 0.3 completion penalty', () => {
    const region = makeRegion();
    const deck = initializeLocationDeck(region);
    const targetId = deck.locations[0].locationId;

    const updated = updateDeckAfterCompletion(deck, targetId);
    const entry = updated.locations.find(l => l.locationId === targetId)!;

    expect(entry.isCompleted).toBe(true);
    expect(entry.completionPenalty).toBe(0.3);
    // Unrelated entries unchanged
    const others = updated.locations.filter(l => l.locationId !== targetId);
    expect(others.every(l => l.isCompleted === false && l.completionPenalty === 1.0)).toBe(true);
  });
});

describe('drawLocationCards', () => {
  it('draws the requested number of cards from the deck', () => {
    const region = makeRegion();
    const deck = initializeLocationDeck(region);
    const intel = createInitialIntelPool();

    const cards = drawLocationCards(region, deck, intel, 3);

    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.locationId).toBeTruthy();
      expect(card.location).toBeDefined();
      expect(card.location.id).toBe(card.locationId);
      expect(Object.values(IntelRevealLevel)).toContain(card.intelLevel);
    }
  });

  it('honors revealedCount override (first N FULL, rest NONE)', () => {
    const region = makeRegion();
    const deck = initializeLocationDeck(region);
    const intel = createInitialIntelPool(); // 0 intel

    const cards = drawLocationCards(region, deck, intel, 3, 1);

    expect(cards.length).toBe(3);
    expect(cards[0].intelLevel).toBe(IntelRevealLevel.FULL);
    expect(cards[1].intelLevel).toBe(IntelRevealLevel.NONE);
    expect(cards[2].intelLevel).toBe(IntelRevealLevel.NONE);
  });

  it('uses intel pool for reveal level when revealedCount is omitted', () => {
    const region = makeRegion();
    const deck = initializeLocationDeck(region);
    let intel = createInitialIntelPool();
    intel = addIntel(intel, 3); // FULL threshold

    const cards = drawLocationCards(region, deck, intel, 2);

    expect(cards.length).toBe(2);
    expect(cards.every(c => c.intelLevel === IntelRevealLevel.FULL)).toBe(true);
  });

  it('flags revisit when drawing a completed deck entry', () => {
    const region = makeRegion();
    let deck = initializeLocationDeck(region);
    const targetId = deck.locations[0].locationId;
    deck = updateDeckAfterCompletion(deck, targetId);

    // Draw many cards until we hit the completed one (weight still > 0)
    const intel = addIntel(createInitialIntelPool(), 5);
    let sawRevisit = false;
    for (let i = 0; i < 40; i++) {
      const cards = drawLocationCards(region, deck, intel, 3);
      if (cards.some(c => c.locationId === targetId && c.isRevisit)) {
        sawRevisit = true;
        break;
      }
    }
    expect(sawRevisit).toBe(true);
  });
});

describe('card display description (T-047)', () => {
  it('hides description at NONE intel and reveals at PARTIAL/FULL', () => {
    const region = makeRegion();
    const loc = region.locations.find((l) => l.flags.isEntry) ?? region.locations[0];
    expect(loc.description?.length).toBeGreaterThan(0);

    const base: LocationCard = {
      locationId: loc.id,
      location: loc,
      intelLevel: IntelRevealLevel.NONE,
      isRevisit: false,
    };

    expect(getCardDisplayInfo(base).description).toBeNull();
    expect(getCardDisplayInfo(base).atmosphereLine).toBeNull();

    const partial = getCardDisplayInfo({ ...base, intelLevel: IntelRevealLevel.PARTIAL });
    expect(partial.description).toBe(loc.description);
    expect(partial.atmosphereLine).toBeNull();

    const full = getCardDisplayInfo({ ...base, intelLevel: IntelRevealLevel.FULL });
    expect(full.description).toBe(loc.description);
    // FULL may surface atmosphere if location has atmosphereEvents
    if ((loc.atmosphereEvents?.length ?? 0) > 0) {
      expect(full.atmosphereLine).toMatch(/^Atmosphere:/);
    }
  });
});

describe('atmosphere flavor (T-046)', () => {
  it('humanizes snake_case atmosphere ids', () => {
    expect(humanizeAtmosphereEventId('scroll_rules')).toBe('Scroll rules');
    expect(humanizeAtmosphereEventId('false-ally')).toBe('False ally');
  });

  it('picks a flavor line when atmosphereEvents exist', () => {
    const flavor = pickAtmosphereFlavor(
      { atmosphereEvents: ['wire_trap', 'screams_deeper'], name: 'Test' },
      () => 0,
    );
    expect(flavor).toBe('Atmosphere: Wire trap');
  });

  it('returns null when no atmosphere events', () => {
    expect(pickAtmosphereFlavor({ atmosphereEvents: [], name: 'Empty' })).toBeNull();
    expect(pickAtmosphereFlavor({ name: 'None' })).toBeNull();
  });
});

describe('secret discovery (T-030)', () => {
  it('keeps secrets at weight 0 until discovered', () => {
    const region = makeRegion();
    const secret = region.locations.find((l) => l.flags.isSecret);
    expect(secret).toBeDefined();
    expect(secret!.isDiscovered).toBe(false);

    const deck = initializeLocationDeck(region);
    const intel = addIntel(createInitialIntelPool(), 5);
    const drawnIds = new Set<string>();
    for (let i = 0; i < 30; i++) {
      drawLocationCards(region, deck, intel, 4).forEach((c) => drawnIds.add(c.locationId));
    }
    // Secret config id is embedded in location id as location-<configId>-…
    expect([...drawnIds].some((id) => id.includes(secret!.id.split('-')[1] ?? 'sunken'))).toBe(false);
  });

  it('eventFlags unlock secrets so they can appear in card draws', () => {
    const region = makeRegion();
    const secret = region.locations.find(
      (l) => l.flags.isSecret && l.unlockCondition?.requirement === 'sunken_ship_discovered',
    );
    expect(secret).toBeDefined();

    const { region: unlocked, newlyDiscovered } = discoverSecretsFromEventFlags(region, {
      sunken_ship_discovered: 1,
    });
    expect(newlyDiscovered.length).toBeGreaterThanOrEqual(1);
    const unlockedSecret = unlocked.locations.find((l) => l.id === secret!.id);
    expect(unlockedSecret?.isDiscovered).toBe(true);
    expect(unlocked.discoveredSecretIds).toContain(secret!.id);

    // Deterministic eligibility: discovered secrets are in the deck with base weight,
    // and appear when we draw the full deck size (no RNG miss among competitors).
    const deck = initializeLocationDeck(unlocked);
    const deckEntry = deck.locations.find((e) => e.locationId === secret!.id);
    expect(deckEntry).toBeDefined();
    expect(deckEntry!.baseWeight).toBeGreaterThan(0);
    expect(unlockedSecret!.isDiscovered).toBe(true);
    expect(unlockedSecret!.flags.isBoss).toBe(false);

    const intel = addIntel(createInitialIntelPool(), 5);
    const allCards = drawLocationCards(unlocked, deck, intel, deck.locations.length);
    // Not every location is always drawn (weights/filters), but a full-size draw
    // of an unlocked secret should be possible — force inclusion via many tries
    // with count=all eligible is still weighted. Prefer: secret appears when we
    // only offer that entry.
    const secretOnlyDeck = {
      ...deck,
      locations: deck.locations.filter((e) => e.locationId === secret!.id),
    };
    const forced = drawLocationCards(unlocked, secretOnlyDeck, intel, 1);
    expect(forced.some((c) => c.locationId === secret!.id)).toBe(true);
    expect(allCards.length).toBeGreaterThan(0);
  });

  it('completing a location with secretPaths discovers the secret target', () => {
    const region = makeRegion();
    // Sunken Ship has secret path to drowned_shrine
    const ship = region.locations.find((l) => l.id.includes('sunken_ship'));
    expect(ship?.secretPaths?.length).toBeGreaterThan(0);

    // First unlock ship so we can treat it as a real secret-origin (ship itself is secret)
    const { region: withShip } = discoverSecretsFromEventFlags(region, {
      sunken_ship_discovered: 1,
    });
    const shipLoc = withShip.locations.find((l) => l.id.includes('sunken_ship'))!;
    const { region: afterPaths, newlyDiscovered } = discoverSecretsFromCompletedLocation(
      withShip,
      shipLoc.id,
    );
    expect(newlyDiscovered.length).toBeGreaterThanOrEqual(1);
    const shrine = afterPaths.locations.find((l) => l.id.includes('drowned_shrine'));
    expect(shrine?.isDiscovered).toBe(true);
  });
});
