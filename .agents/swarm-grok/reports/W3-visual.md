# W3-visual — Combat lamina mid/fg wiring

**Agent:** W3-visual  
**Date:** 2026-07-22  
**Tasks:** R1-200 (done), R1-201 (documented open)

## Problem

`CinematicViewscreen` already supported optional parallax layers:

- Lámina 2: `midgroundImage` → `/assets/lamina_mid_<biomeSlug>.png`
- Lámina 3: `foregroundImage` → `/assets/lamina_fg_<biomeSlug>.png`

…but `Combat.tsx` only passed `backgroundImage`. Mid/fg were never wired, so the three-layer stage could not light up when assets land under `public/assets/`.

## Solution (minimal)

Prefer App → Combat prop path (same pattern as `background`):

1. **`resolveLaminaPaths(biome)`** in `src/utils/colorHelpers.ts`  
   Returns `{ background, midground, foreground }` using `getBiomeSlug`.

2. **`App.tsx`**  
   - Replaced ad-hoc `combatBackground` string builder with `combatLamina = resolveLaminaPaths(biome)`.  
   - Biome source unchanged: `currentLocation?.biome || region?.biome`.  
   - Passes `midgroundImage` / `foregroundImage` into `<Combat />` only (other scenes still get Lámina 1 via `background={combatBackground}`).

3. **`Combat.tsx`**  
   - New optional props `midgroundImage`, `foregroundImage`.  
   - Forwarded to `CinematicViewscreen`.

4. **16:9**  
   - Did **not** force `aspect-ratio: 16/9` on `.combat__stage` — stage is grid `1fr` above deck `auto`; hard aspect ratio breaks layout.  
   - Assets are 1024×576; CSS already uses `object-fit: cover`. Comment noted in `Combat.css`.

## Hero cutout (R1-201, not implemented)

```ts
const heroImage = (player as any).image || getClanArt(player.clan)?.src;
const heroCutout = heroImage?.startsWith('/assets/hero_')
  ? heroImage.replace('/assets/hero_', '/assets/hero_cut_')
  : undefined;
```

Clan art paths are `/assets/icons/clans/<clan>.jpg` — so `heroCutout` is always `undefined` and the portrait + mask path is used. Inventing cutout paths from jpg icons would 404. Backlog task **R1-201** filed for real transparent `hero_cut_*` assets + registry wiring.

## Safety

Missing mid/fg PNGs: `CinematicViewscreen` only renders `<img>` when props are set; `onError` sets local error state and hides the layer. No layout crash when assets are absent.

## Verification

- `npx tsc --noEmit` — clean (exit 0).

## Files changed

| File | Change |
|------|--------|
| `src/utils/colorHelpers.ts` | `LaminaPaths` + `resolveLaminaPaths` |
| `src/App.tsx` | `combatLamina` / mid / fg; import `resolveLaminaPaths` |
| `src/scenes/combat/Combat.tsx` | props + CinematicViewscreen wire |
| `src/scenes/combat/Combat.css` | 16:9 note (no forced ratio) |
| `region1-polish-backlog.md` | R1-200 done, R1-201 open |
| `.agents/swarm-grok/reports/W3-visual.md` | this report |

## Not done / follow-ups

- Generate `lamina_mid_*.png` / `lamina_fg_*.png` per R1 biome (asset agents).
- R1-201 hero cutouts.
- No image generation by this worker.
