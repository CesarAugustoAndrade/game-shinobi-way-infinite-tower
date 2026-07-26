# A3 WAVE9 — ARTE last R1 enemy jpg closeout

**Agent:** A3 WAVE9  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Dedicated enemy portraits + cutouts for last R1 jpg residuals (`shrine_demon`, `corrupted_priest`); soft elite alias remaps using existing plates only (no extra gen).

---

## Goal

Close the last R1 pool faces still on `icons/enemies/*.jpg`:
- **REQUIRED:** `shrine_demon`, `corrupted_priest` (drowned_shrine pool)
- **OPTIONAL:** remap soft elite aliases off wrong monk/mist_ninja plates → better existing cast

Style: seinen-sublime cyber-terror mist coast · full figure on void `#050608` · rust `#a65d3f` accents · fog `#8a9199` · bone `#e8e4dc` · abyss `#1a2633`. No parchment, no bright neon city, no western clergy.

---

## 1. Selection (2 jpg residual closeout)

| id | R1 traffic | prior src | notes |
|----|------------|-----------|-------|
| `shrine_demon` | drowned_shrine pool | `icons/enemies/shrine_demon.jpg` | red oni shrine guardian; upgrade from cartoon jpg |
| `corrupted_priest` | drowned_shrine pool | `icons/enemies/corrupted_priest.jpg` | fallen **Japanese** shrine priest (kannushi), not western cross clergy |

**Not this wave:** mass endgame skills/enemies; new event plates; dedicated paint for residual soft shares (river_bandit, hidden_guard, elite_mercenary).

---

## 2. New enemy assets (2 identities × portrait + cutout)

| id | portrait | cutout | prior |
|----|----------|--------|-------|
| `shrine_demon` | `public/assets/enemy_shrine_demon.png` | `enemy_cut_shrine_demon.png` | `shrine_demon.jpg` |
| `corrupted_priest` | `public/assets/enemy_corrupted_priest.png` | `enemy_cut_corrupted_priest.png` | `corrupted_priest.jpg` |

All mirrored to `assets/` root (byte-match verified). Portrait + cutout share solid void `#050608` full-figure (WAVE5–8 cut convention). Combat rewrite `enemy_` → `enemy_cut_` applies when cut files exist.

### Identity notes
- **shrine_demon** — muscular red-rust oni, black horns with ofuda paper tags, wooden shrine mallet + shimenawa/shide, black beads + rust bell, torn indigo haori, clawed feet in coastal mist; pure drowned-shrine guardian (not boss_demon_brothers, not treasure_guardian).
- **corrupted_priest** — gaunt purple-ash kannushi, ruined eboshi with burned seals, torn indigo/gold ceremonial robes, ofuda on chest/sleeve, broken juzu with falling beads, violet curse smoke, thin cruel smile; Japanese fallen clergy (**not** western collar/cross, **not** yellow martial monk).

**Running totals after WAVE9:** 39 dedicated enemy portraits + 39 cutouts (was 37).

---

## 3. Manifest wiring — `enemyArtManifest.ts`

| pool key | new `src` | quality |
|----------|-----------|---------|
| `pool_shrine_demon` | `/assets/enemy_shrine_demon.png` | painted-png |
| `pool_corrupted_priest` | `/assets/enemy_corrupted_priest.png` | painted-png |

### Soft elite alias remaps (existing plates only — no gen)

| pool key | prior soft share | new soft share | rationale |
|----------|------------------|----------------|-----------|
| `pool_manor_guardian` | `enemy_monk.png` | `enemy_corrupt_guard.png` | Manor Warden ≠ yellow monk; rust armored spear guard |
| `pool_elite_guard` | `enemy_monk.png` | `enemy_corrupt_guard.png` | Compound Guard ≠ monk; armored naginata enforcer |
| `pool_eldritch_guardian` | `enemy_monk.png` | `enemy_treasure_guardian.png` | Eldritch Warden ≠ monk; spectral cargo-chain undead (same-pool shrine faces stay distinct) |
| `pool_assassin` | `enemy_mist_ninja.png` | `enemy_hired_assassin.png` | assassin id already has dedicated plate |

### Preserved residual soft shares
- `river_bandit` / `hidden_guard` → `mist_ninja`
- `elite_mercenary` → `bridge_saboteur`

Jobs / bosses / other pools unchanged. R1 jpg residual: **none**.

`artRegistry.ts` `T021_enemies_events` inventory string updated to 39 portraits / 11 event plates.

---

## 4. Event plates

No new event plates this wave (still 11 dedicated `event_*.png`). Residual side events on jpg/reuse left for A5/A3 event pass.

---

## 5. Files touched

| Path | Change |
|------|--------|
| `public/assets/enemy_{shrine_demon,corrupted_priest}.png` | NEW portraits |
| `public/assets/enemy_cut_{shrine_demon,corrupted_priest}.png` | NEW cutouts |
| `assets/*` (same 4 names) | mirror (byte-match) |
| `src/game/constants/enemyArtManifest.ts` | 2 pool painted-png + 4 soft remaps |
| `src/game/constants/artRegistry.ts` | T021 inventory string |
| `.agents/swarm-grok/reports/A3-wave9-cast.md` | this report |

No combat math, no systems, no unit tests, no git commit.

---

## 6. Typecheck

```
npx tsc --noEmit
```

**Result:** exit 0 (clean).

---

## 7. Residual backlog (not this wave)

Still plate-sharing (soft, existing plates only):
- `river_bandit` / `hidden_guard` → mist_ninja
- `elite_mercenary` → bridge_saboteur
- Optional future: dedicated paint for those if they remain high-traffic

R1 enemy **jpg residual: closed**.

Events still on jpg / reuse: residual sides (corrupt_merchant_scales, riverside_traveler_pact, bandit_outpost_toll, hidden_cove_silent_drop, drowned_shrine_black_tide).
