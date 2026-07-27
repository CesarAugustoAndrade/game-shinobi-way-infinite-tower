# A8 — INTEGRACIÓN & COHERENCIA (product pass)

**Agent:** A8  
**Date:** 2026-07-23  
**Branch:** develop (no commit)  
**Goal:** Freeze genre stack for Region 1 vertical slice — glue App shell + art registries + CHANGELOG

---

## Summary

Center panel no longer flashes parchment beige. Exploration vs mission states use distinct dark underlays; Event/Loot/Combat always get a painted lamina path (Coastal Harbor default). Manifests prefer on-disk painted PNGs for hero skills, Tazuna event, and mist beach bandit. `npx tsc --noEmit` clean after unblocking a parallel-agent FloatingText prop mismatch.

---

## Fixes landed

### 1. App shell coherence

| File | Change |
|------|--------|
| `src/App.css` | Replaced parchment chassis with `.center-stage` void/abyss; variants `--explore` (map plate) and `--mission` (deep void). Legacy `.parchment-panel` kept as void alias. |
| `src/App.tsx` | `isMissionScene` + `centerStageClass` routing; Event gets `background={combatBackground}`; lamina always resolves (no `undefined` plate). |
| `src/scenes/activities/Event.tsx` | Already wrapped in `SceneBackdrop` (parallel work); App wiring completed. |

**Routing:** GameState early returns (MENU / GUIDE / CHAR_SELECT / GAME_OVER / INTERLUDE / VICTORY) unchanged. In-shell: COMBAT, EVENT, ELITE, LOOT, MERCHANT, TRAINING, SCROLL, TREASURE*, REGION_MAP, LOCATION_EXPLORE still solid.

### 2. artRegistry / manifests

| Asset | Before | After |
|-------|--------|-------|
| 8 skills (`basic_atk`, `shuriken`, `fireball`, `gentle_fist`, `mind_destruction`, `shadow_clone`, `primary_lotus`, `chidori`) | `/assets/icons/skills/*.jpg` | `/assets/skill_*.png` (`painted-png`) |
| `event:meet_tazuna` | icons jpg | `/assets/event_meet_tazuna.png` |
| `enemy:pool_beach_bandit` | shared samurai | `/assets/enemy_mist_ninja.png` |
| `getEnemyArt` | — | mist keyword → mist plate before generic ninja |
| `ART_BACKLOG_NOTES` | stale SVG note | reflects painted set |

Registry rebuilds from manifests at module load — no structural rewrite of `artRegistry.ts` lookup cascade.

### 3. Lamina / colorHelpers

- `DEFAULT_BIOME_SLUG = coastal_harbor` when biome blank
- Small `BIOME_SLUG_ALIASES` for prose/location-id mismatches → painted plates
- App always calls `resolveLaminaPaths` (no early `undefined`)

### 4. Build unblock (parallel agent)

- `FloatingText.tsx`: optional `damageType` / `element` on item + props (Combat was already passing them → tsc break). Minimal glue, no combat rewrite.

### 5. Docs

- `CHANGELOG.md` `[Unreleased]`: A8 integration block (actual fixes only)
- `out-of-scope.md`: OOS-A8-01…03 (R2+ cutouts, remaining skill tiles, missing mid/fg laminas)

---

## Residual product gaps (for human)

1. **Genre stack still multi-era under the hood** — pixel-arcade chrome + neon RegionMap + painted R1 plates. Shell is coherent; map neon vs Waves mist mood still intentional “visor vs world” tension — watch for neon bleeding into combat stage.
2. **Enemy pool identity** — many pools still share painted plates (samurai/monk/puppeteer/shinobi). Combat works; visual cast of Waves is thinner than prose.
3. **`enemy_mist_ninja.png` has no cutout** — stage falls back to masked portrait (not transparent sprite).
4. **~106 skill cards remain imagine-jpg** — only 8 painted.
5. **Lamina mid/fg missing** for fortified_camp, shipwreck, underground_cavern, underwater_temple, ruined_estate, secret_harbor, fortified_mansion — onError hides; parallax depth uneven.
6. **Legacy class name** `.parchment-panel` still aliased — safe to delete once no callers remain (App uses `center-stage` only).
7. **Multi-agent race** — Event backdrop, skill paints, and FloatingText options were mid-flight from other agents; this pass completed glue only.

---

## Verification

```text
npx tsc --noEmit  →  exit 0
```

No git commit (per brief). Tree ready for parent to stage.

---

## Files touched (A8)

- `src/App.css`
- `src/App.tsx`
- `src/utils/colorHelpers.ts`
- `src/game/constants/artRegistry.ts`
- `src/game/constants/enemyArtManifest.ts`
- `src/game/constants/eventArtManifest.ts`
- `src/game/constants/skillArtManifest.ts` (verified painted; may overlap parallel agent)
- `src/components/combat/FloatingText.tsx`
- `CHANGELOG.md`
- `out-of-scope.md`
- `.agents/swarm-grok/reports/A8-integration.md` (this file)
