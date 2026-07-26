# A3 WAVE10 — ARTE production verification (no mass gen)

**Agent:** A3 WAVE10  
**Date:** 2026-07-23  
**Branch:** develop (**no commit**)  
**Scope:** Audit only — enemy pools / laminas / skills. Prefer zero gen. Remap jpg pools only if needed.

---

## Verdict

| Check | Result |
|-------|--------|
| R1 pool still on `icons/enemies/*.jpg` | **NONE** |
| Soft-share remaps required this wave | **NONE** (already painted plates) |
| New image_gen | **0** |
| Code / manifest edits | **0** |
| `npx tsc --noEmit` | **exit 0** |

Inventory confirmed on disk (`public/assets` ≡ `assets/` mirror): **39** enemy portraits + **39** cutouts, **11** event plates, **93** skill painted PNG, **14** location + **14** mid + **14** fg laminas.

---

## 1. enemyArtManifest — R1 pools

- **52** manifest entries; **all pool/job/boss** `src` → `/assets/enemy_*.png`, quality `painted-png`.
- **0 missing files** for any manifest `src`.
- **0 R1 pools** still on `icons/enemies/*.jpg`.

### Soft shares (existing painted plates only — residual backlog, not broken)

| pool / job | shares plate | note |
|------------|--------------|------|
| `job_shinobi` | `enemy_exhausted_shinobi.png` (w/ `job_ninja`) | intentional job alias |
| `pool_guard_dog` / `pool_war_dog` | `enemy_war_dog.png` | same face, OK |
| `pool_river_bandit` / `pool_hidden_guard` | `enemy_mist_ninja.png` | optional dedicated paint later |
| `pool_elite_mercenary` | `enemy_bridge_saboteur.png` | optional dedicated paint later |
| `pool_manor_guardian` / `pool_elite_guard` | `enemy_corrupt_guard.png` | WAVE9 remap |
| `pool_eldritch_guardian` | `enemy_treasure_guardian.png` | WAVE9 remap |
| `pool_assassin` | `enemy_hired_assassin.png` | WAVE9 remap |

### Non-pool residual (out of R1 face closeout)

- **5 archetype** fallbacks still `imagine-jpg` under `/assets/icons/enemies/archetype_*.jpg` (tank / assassin / balanced / caster / genjutsu). Used when no pool face resolves — not R1 pool traffic.

---

## 2. Laminas + locations (14 R1 biomes)

`landOfWaves.ts` biomes (14 unique) all resolve via `getBiomeSlug` / `resolveLaminaPaths` (`LAMINA_ASSET_REV=r2wave2a3`) to full stack on disk:

`coastal_harbor`, `foggy_shoreline`, `dense_forest`, `underground_cavern`, `rural_village`, `river_banks`, `shipwreck`, `great_bridge`, `fortified_camp`, `ruined_estate`, `secret_harbor`, `underwater_temple`, `fortified_mansion`, `mist_covered_bridge`

- **42/42** plates present (`location_` + `lamina_mid_` + `lamina_fg_` × 14) in `public/assets` and root `assets/`.
- **Residual: none** for R1 laminas.

---

## 3. Skills — painted-png on disk

| quality | count | disk |
|---------|-------|------|
| `painted-png` → `/assets/skill_*.png` | **93** | **93 present, 0 missing** |
| `imagine-jpg` → `/assets/icons/skills/*.jpg` | **21** | files present (endgame residual) |

### Residual skill faces (endgame / non-R1 priority — not painted)

`bug_swarm`, `expansion`, `sand_burial`, `sand_shield`, `summon_manda`, `puppet_crow`, `sand_coffin`, `curse_mark_2`, `curse_surge`, `tsukuyomi`, `reaper_death_seal`, `edo_tensei`, `gate_of_limit`, `shukaku_arm`, `c4_karura`, `rasenshuriken`, `amaterasu`, `kirin`, `shinra_tensei`, `kamui_impact`, `tengai_shinsei`

---

## 4. Residual backlog only (next waves)

1. **Soft-share optional dedicated paint** (if high-traffic UX demands uniqueness): `river_bandit`, `hidden_guard`, `elite_mercenary`.
2. **Archetype jpg → painted** only if fallback portraits ship in UI without pool resolve.
3. **21 endgame skill** imagine-jpg → painted-png (post-R1).
4. **Events** (A5/A3 event pass): side events still on `icons/events/*.jpg` / reuse; dedicated R1 story plates already **11**.

**R1 enemy jpg residual: closed (WAVE9).**  
**R1 lamina residual: closed (WAVE2).**  
**R1 skill painted residual for quality=painted-png: closed (93/93).**

No code changes. No commit.
