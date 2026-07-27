# A8 WAVE2 — INTEGRACIÓN residual

**Agent:** A8 WAVE2  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after parallel WAVE2 agents (A2–A7b). No feature rewrites.

---

## Summary

Post-WAVE2 integration pass: waited for peer agents, re-ran typecheck, audited art paths + parchment shell callers, mirrored orphaned public assets into `assets/`, aligned `ART_BACKLOG_NOTES` / CHANGELOG / out-of-scope. **`npx tsc --noEmit` → exit 0.** No large feature rewrites.

---

## 1. Typecheck / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (final) | **exit 0** |
| Broken imports (App + manifests + artRegistry) | None found |
| FloatingText dtype/element props | Intact (wave1 glue still valid) |
| Bag `getCompatibleRecipes` / `recipe.recipe` | Clean at audit time (transient parallel noise during mid-flight; no residual TS error) |

**Action:** No code glue required for tsc.

---

## 2. Parchment-panel callers

| Surface | Status |
|---------|--------|
| `App.tsx` center shell | Uses `center-stage` + `--explore` / `--mission` only |
| TSX className `parchment-panel` | **0 callers** |
| `App.css` `.parchment-panel` | Dead void-alias (safe CSS leftover) |
| Beige/parchment flash risk | Mitigated — void/abyss underlays; comments only mention parchment as anti-pattern |

**Action:** Left CSS alias (harmless). Deletion is optional cleanup, not blocker.

---

## 3. Art path audit (WAVE2 landings)

### Skills (`skill_*.png`)

| Metric | Count |
|--------|-------|
| On disk `public/assets/skill_*.png` | **20** |
| Manifest `painted-png` srcs | **20** |
| Missing vs manifest | **0** |
| Still imagine-jpg | **~94** of 114 |

Painted set (wave1+2):  
`taijutsu`, `shuriken`, `fireball`, `gentle_fist`, `primary_lotus`, `shadow_clones`, `chidori`, `mind_body_disturbing`, `rasengan`, `basic_medical`, `shunshin`, `phoenix_flower`, `sharingan_2`, `64_palms`, `kaiten`, `byakugan`, `leaf_whirlwind`, `dynamic_entry`, `mind_transfer`, `hell_viewing`.

### Laminas (`lamina_*`)

| Layer | Count | Notes |
|-------|-------|-------|
| `lamina_mid_*` | **14** | Full R1 slug set (A3 WAVE2 filled 7 residual biomes) |
| `lamina_fg_*` | **14** | Same |
| `resolveLaminaPaths` | OK | Convention unchanged; `LAMINA_ASSET_REV=r2wave2a3` |
| `BIOME_SLUG_ALIASES` | OK | prose/location-id → painted plates |

### Enemy cutouts (`enemy_cut_*` / mist)

| Item | Status |
|------|--------|
| `enemy_mist_ninja.png` | Present |
| `enemy_cut_mist_ninja.png` | **Present** (A3 WAVE2) — Combat rewrite picks it up |
| Cutout convention | `/assets/enemy_X` → `/assets/enemy_cut_X` (A2 verified) |
| Pool portraits (dock_worker, gato, sea_spirit, bridge_saboteur, hired_assassin, missing_nin, …) | Portrait + cutout pairs present under `public/assets` |
| Root `assets/` mirror gaps | **Fixed this pass** — mirrored 3 cutouts + 12 wave2 skills |

---

## 4. Glue fixes landed (this agent)

| Change | Why |
|--------|-----|
| Mirror 12 wave2 `skill_*.png` → `assets/` | Project mirror lagged public runtime tree |
| Mirror `enemy_cut_{bridge_saboteur,hired_assassin,missing_nin}.png` → `assets/` | Same |
| `ART_BACKLOG_NOTES` refresh | T020/T021 counts + `T_laminas_r1` closed note |
| `CHANGELOG.md` WAVE2 integration block | Actual residual polish only |
| `out-of-scope.md` | OOS-A8-02 partial; OOS-A8-03 closed for R1 |

**Not done (out of glue scope):** deleting `.parchment-panel` CSS; painting remaining 94 skills; R2+ enemy cast.

---

## 5. Peer WAVE2 reports observed

| Report | Theme |
|--------|-------|
| A2-wave2-combat | Cutout fallback harden, lamina onError, intent chip, hand clarity |
| A3-wave2-laminas | 7 mid+fg biomes + mist cutout |
| A4-wave2-explore | Neon→instrument dial, location scan chips, veiled routes |
| A5-wave2-events | 4 residual Waves side events + flag payoffs |
| A6-wave2-ux | Dual-language tooltips → abyss; menu residual; reduced-motion |
| A7a-wave2-loot | Scroll void plates, bag StS result-first synth |
| A7b-wave2-skills | +12 painted clan-loadout skill faces (20 total) |

---

## Residual product gaps (for human)

1. **~94 skill cards still imagine-jpg** — R1 clan loadouts are mostly painted (18/35 unique loadout ids); utility/passive/side leftovers + non-starting kit still jpg tiles.  
2. **Genre stack tension** — RegionMap is CRT/ops instrument (A4 dialed neon down); combat stage is mist/void painted. Still two languages by design; watch any reintroduction of party cyan into world plates.  
3. **Enemy pool sharing** — R1 has more dedicated plates than wave1, but some jobs still share archetype/pool art; R2+ cast is OOS-A8-01.  
4. **Lamina compositing quality** — mid/fg use solid black void centers (not true alpha). Fine for stage stack; future pass may want real transparency.  
5. **Legacy `.parchment-panel` CSS** — zero callers; optional delete in a cleanup PR.  
6. **Event art still thin** — residual side events (A5) reuse existing plates; only `meet_tazuna` is a dedicated painted event PNG.  
7. **Multi-agent residual risk** — if more agents land after this report, re-run `npx tsc --noEmit` before parent stages.

---

## Verification

```text
npx tsc --noEmit  →  exit 0
public skill_*.png  →  20 / 20 manifest painted
public lamina_mid_  →  14
public lamina_fg_   →  14
public enemy_cut_mist_ninja.png  →  present
assets/ skill_ + cut mirrors  →  aligned
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE2)

- `assets/skill_*.png` (12 mirrored from public)
- `assets/enemy_cut_{bridge_saboteur,hired_assassin,missing_nin}.png` (mirrored)
- `src/game/constants/artRegistry.ts` (`ART_BACKLOG_NOTES`)
- `CHANGELOG.md`
- `out-of-scope.md`
- `.agents/swarm-grok/reports/A8-wave2-integration.md` (this file)
