# T-019 Art Audit — living backlog

Generated as part of T-019 (Registry de arte + iconografía).

## Registry coverage (T-019)

| Category | Keys | `src` present | Fallback |
|----------|------|---------------|----------|
| component | 9 | 9 (SVG tiles) | emoji |
| artifact | 45 | 45 (SVG tiles) | emoji |
| location (Land of Waves) | 13 | 13 (SVG tiles) | emoji |
| activity | 9 | 9 (SVG tiles) | emoji |
| clan | 5 | 5 (SVG tiles) | emoji |

`listMissingArt()` over `ART_REGISTRY` should be **empty** for T-019 keys
(all entries declare `src` under `/assets/icons/...`).

Icon files: `public/assets/icons/{components,artifacts,locations,activities,clans}/*.svg`
Regenerate: `node scripts/generate-icon-set.mjs`

### Note on art quality
T-019 ships **arcade-framed SVG tiles** (hard border + glyph) as the first complete,
versioned icon set so every consumer can resolve `src` without 404. Full painted
16-bit PNGs via `/generar-asset` + combat-art remain a polish pass (can replace
SVGs in place keeping the same paths/keys).

## Backlog for later topics

### T-020 — Skills (~106 without dedicated art)
- Register `skill:<skillId>` keys when assets exist.
- Wire: SkillCard, Loot, ScrollDiscovery, Training.
- Source catalog: `src/game/constants/skills.ts`.

### T-021 — Enemies + events
- `enemy:<poolId>` + archetype fallbacks (TANK/ASSASSIN/BALANCED/CASTER/GENJUTSU).
- `event:<eventId>` + category fallbacks.
- Existing enemy PNGs under root `assets/enemy_*.png` are not yet in the registry.

### Other gaps (not T-019 scope)
- Biome location card art (`/assets/location_*.png`) still lives outside the registry
  (card backgrounds, not location icons).
- Room-type emoji in `roomTypes.ts` still local (UI often uses Lucide).
