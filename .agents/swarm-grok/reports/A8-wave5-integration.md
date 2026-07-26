# A8 WAVE5 — INTEGRACIÓN residual

**Agent:** A8 WAVE5  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after WAVE5 peer landings. No feature rewrites.

---

## Summary

Post-WAVE5 residual integration. Waited for peer landings **A2 / A3 / A4 / A5 / A6 / A7a / A7b wave5**, re-ran typecheck, audited painted-png paths, verified public↔assets top-level mirror (**0 gaps**), refreshed CHANGELOG / OOS progress, smoke-tested event content. **`npx tsc --noEmit` → exit 0.** Event content tests **18/18**.

**No TS glue fixes required.** Only a stale mist-keyword comment in `artRegistry.ts` (beach_bandit no longer shares dock_worker). Peers already mirrored new plates and updated `ART_BACKLOG_NOTES` T020/T021.

---

## 1. Peer landings (WAVE5)

| Agent | Role | Status | Product delta (integration view) |
|-------|------|--------|----------------------------------|
| A2-wave5 | Combat residual | done | EliteChallenge chrome; cutout rewrite verified; no combat math |
| A3-wave5 | Cast / event art | done | +4 enemy portraits/cuts (cave/cove smuggler, corrupt merchant/foreman); +2 event plates (protect_village, final_showdown_setup) |
| A4-wave5 | Explore residual | done | Narrow-width overflow; secret-path copy |
| A5-wave5 | Events residual | done | Shonen tone kill on spine; mysteryFlavor on all R1 tiedStoryEvents |
| A6-wave5 | UX residual | done | Training + ScrollDiscovery void/rust residual |
| A7a-wave5 | Loot residual | done | Dead Tailwind sizes / merchant voice (no LootSystem balance) |
| A7b-wave5 | Skills residual | done | +12 painted tools/common → **61** skill PNGs; ~53 jpg remain |

---

## 2. Typecheck / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** (before and after comment glue) |
| Broken imports after WAVE5 | None |
| Glue TS fixes required | **None** (comment-only in artRegistry) |

---

## 3. Art tree mirror + path audit

| Check | Result |
|-------|--------|
| `skill_*.png` (public) | **61** |
| enemy portraits (non-cut) | **25** |
| `enemy_cut_*.png` | **25** (0 missing vs portraits) |
| `event_*.png` dedicated | **7** |
| `lamina_mid_*` / `lamina_fg_*` | **14 / 14** (unchanged) |
| public top-level → `assets/` gaps | **0** |
| Manifest painted-png missing on disk | **0** (enemy/event/skill) |

### Manifest quality snapshot

| Manifest | entries | painted-png | imagine-jpg | missing files |
|----------|---------|-------------|-------------|---------------|
| skillArtManifest | 114 | 61 | 53 | 0 |
| enemyArtManifest | 52 | 36* | 16 | 0 |
| eventArtManifest | 48 | 8** | 40 | 0 |

\* painted-png count includes job/boss aliases pointing at shared dedicated plates.  
\*\* 8 painted event keys = 7 dedicated files + `tazuna_road_mist` reuses `event_meet_tazuna.png`.

### Dedicated event plates (7 files)

`meet_tazuna`, `protect_bridge`, `final_confrontation`, `meet_inari`, `gato_defeat`, `protect_village`, `final_showdown_setup`.

### WAVE5 new enemy plates (4 × portrait + cut)

`cave_smuggler`, `corrupt_merchant`, `corrupt_foreman`, `cove_smuggler`.

### WAVE5 new skill faces (12)

`kunai_slash`, `kunai_throw`, `shuriken_barrage`, `windmill_shuriken`, `senbon`, `senbon_rain`, `explosive_barrage`, `flash_bomb`, `poison_coat`, `cloak_invis`, `sword_slash`, `iaido` (+ tools suite per A7b report).

**Mirror action this wave:** none required — peers already wrote both `public/assets/` and root `assets/`.

---

## 4. Glue changes (A8 WAVE5 only)

| File | Change |
|------|--------|
| `src/game/constants/artRegistry.ts` | Mist-keyword comment: stop claiming beach_bandit→dock_worker (dedicated since WAVE4). Runtime path unchanged (`pool_assassin` → mist_ninja). |
| `CHANGELOG.md` | WAVE5 integration residual block |
| `out-of-scope.md` | OOS-A8-02 / 04 / 05 progress (see §5; already accurate at audit time) |
| `.agents/swarm-grok/reports/A8-wave5-integration.md` | this report |

`ART_BACKLOG_NOTES` T020/T021 already reflect WAVE5 counts (peer A3/A7b) — not re-touched beyond mist comment.

---

## 5. Docs / OOS progress

| ID | WAVE5 status | Honest residual |
|----|--------------|-----------------|
| **OOS-A8-02** Skills art | **partial** — **61** painted; loadouts + mid-R1 water + tools closed | **~53** still imagine-jpg (late tiers / niche) |
| **OOS-A8-03** Laminas | **closed (R1)** | — |
| **OOS-A8-04** Event art | **partial** — **7** spine/key plates | Residual side events still jpg/reuse |
| **OOS-A8-05** Enemy pool share | **partial** — main R1 human cast diversified (WAVE4+5 dedicated) | `ronin`→samurai; some elite/job aliases (monk/mist_ninja); animals/spirits jpg |
| **OOS-A8-01** R2+ cast | open | Out of R1 scope |

---

## 6. Optional smoke tests

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (~734ms)
```

No CinematicViewscreen suite run (eventContent was the cheap smoke requested).

---

## 7. Residual product gaps (honest — post WAVE5)

1. **~53 skill cards still imagine-jpg** — early R1 tools/loadouts/water suite largely painted; late-tier kits remain.  
2. **Event art thin outside 7 plates** — docks ledger, mist omen, shipwreck/manor secrets, etc. still jpg/reuse.  
3. **Enemy residual shares** — `pool_ronin`→samurai; hired_muscle/treasure_guardian/etc.→monk; river_bandit/assassin→mist_ninja; animals jpg.  
4. **Lamina mid/fg** — solid black void centers (not true alpha); fine for stage stack.  
5. **Genre stack** — CRT map instrument vs mist combat stage intentional; non-map cyan/gold largely purged (A6); map tokens retained.  
6. **Mystery discoverability** — residual + secret-location events depend on preferred pools + rolls; short runs may miss flags.  
7. **Human playtest still required** — systems + art present; VISION-8 §13 mood not measured live.  
8. **Shell zinc leftovers** — A7a notes App shell / some formatters still zinc-family tokens outside loot path.

---

## 8. Production readiness vs VISION-8 §13 (20-min R1)

Checkbox status = **honest estimate** from code/art audit + peer WAVE5 reports + this glue pass — **not a live playtest**.

| # | Criterion | Est. | Notes |
|---|-----------|------|-------|
| 1 | Identidad en 30 s: ninja terror en niebla / máquina oscura | [~] **partial → likely** | Void stage + 25 painted enemies + 14 laminas; CRT map instrument. Needs human eye on first boot. |
| 2 | Combate = show; mano = mando | [x] **likely** | Enemy-focus stage, 25 cutouts, 61 skill faces, cutout rewrite generic. |
| 3 | Derrota/victoria legible; sin soft-locks | [~] **partial** | Prior soft-lock fixes landed; full defeat mood needs playtest. |
| 4 | Continuidad de tone | [~] **partial → improved** | Spine mysteryFlavor complete (A5); Training/Scroll void (A6); residual jpg tiles + CRT still two languages by design. |
| 5 | “Una sala más” sin R4 | [x] **likely** | Coach CTAs, spine events, amenities honesty, secret residuals. |
| 6 | Eventos/tooltips de producto | [~] **partial → improved** | 7 painted plates + full R1 mysteryFlavor; side residual art still thin. |

### Go / no-go

| Signal | Status |
|--------|--------|
| Builds / typechecks | **GO** (`tsc` clean) |
| Event content unit smoke | **GO** (18/18) |
| Art paths for painted manifests | **GO** (0 missing) |
| public ↔ assets top-level mirror | **GO** (0 gaps) |
| Cutout parity (25/25) | **GO** |
| Known P0 soft-lock open | **None from this audit** |
| **Ready for human playtest** | **YES — GO for 20-min R1 playtest** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first; OOS art optional polish after human verdict |

### Ready for playtest vs ship (plain language)

- **Playtest-ready:** **Yes.** Typecheck clean, event content tests green, WAVE5 peers integrated without glue breakage, painted spine/combat/tools art wired, main R1 human enemy cast diversified, 0 mirror gaps. Hand a human a 20-minute Land of Waves run.  
- **Ship-ready:** **No.** Residual jpg skill tiles (~53), thin side-event art, a few shared enemy plates, and unmeasured mood criteria mean this is a **strong playtest candidate**, not a “R1 done / release” claim.

---

## Verification

```text
npx tsc --noEmit                                              → exit 0
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 61
public enemy portraits / cuts                                 → 25 / 25
public event_*.png                                            → 7
public lamina_mid_ / _fg_                                     → 14 / 14
public → assets top-level gap                                 → 0
manifest painted-png missing                                  → 0
getEnemyArt mist keyword                                      → pool_assassin / mist_ninja
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE5)

- `src/game/constants/artRegistry.ts` — mist keyword comment accuracy  
- `CHANGELOG.md` — WAVE5 residual block  
- `out-of-scope.md` — OOS-A8-02/04/05 progress (WAVE5 counts)  
- `.agents/swarm-grok/reports/A8-wave5-integration.md` (this file)
