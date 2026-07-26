# ENEMY ART AUDIT — MASTER (2026-07-24)

**Status:** BACKLOG BURNED — Fire A–E complete (loop 019f960163dd)  
**Agents:** 16 parallel visual/mapping auditors  
**Scope:** 39 painted portraits + 39 cutouts + 5 archetypes + soft-shares + residual JPGs  
**Detail reports:** `agent-01.md` … `agent-16.md` + `RUBRIC.md`  

---

## Progress (loop fire 2026-07-24 / 2026-07-25)

### Fire A — cleanup ✅
- [x] DELETE residual 15 pool JPGs under `public/assets/icons/enemies/` (only 5 `archetype_*.jpg` remain)
- [x] Fix mist-keyword `getEnemyArt` → mist plate, not hired_assassin
- [x] Update `ART_BACKLOG_NOTES.T021_enemies_events`

### Fire B — P0 identity regen ✅
- [x] `dock_worker` portrait + cut (hook enforcer, full-body)
- [x] `gato` portrait + cut (crime tycoon boss-tier)
- [x] `sea_spirit` portrait + cut (ethereal water spirit — not dock thug)
- [x] `clumsy_puppeteer` portrait + cut (isolated figure + puppet, no workshop; WAVE15 style polish)
- [x] `monk` portrait + cut (isolated combat monk, no temple scene)

### Fire C — boss cuts + P1 ✅
- [x] `boss_haku` combat cut (alpha figure; ice-mirror scene replaced)
- [x] `boss_demon_brothers` combat cut (dual figure, no black-box scene)
- [x] `bridge_saboteur` full-body regen (blank plate, wire spool, no Leaf)
- [x] `samurai` clean combat cut (no sunset battlefield)

### Fire D — dedicate soft-shares ✅
- [x] `eldritch_guardian` dedicated plate + cut (manifest wired)
- [x] `elite_mercenary` dedicated plate + cut (manifest wired)
- [x] `river_bandit` dedicated plate + cut (manifest wired)
- [x] `elite_guard` dedicated plate + cut (manifest wired)
- [x] `manor_guardian` dedicated plate + cut (manifest wired)

### Fire E — residual polish ✅
- [x] P2 `archetype_tank.jpg` regenerated as shinobi armored tank (not Western knight)
- [x] Explicit `enemy:pool_mist_ninja` plate-owner key in manifest
- [x] Mist-keyword `getEnemyArt` → `pool_mist_ninja` (fallback hidden_guard)
- [x] `clumsy_puppeteer` style polish pass + blackkey

### Pipeline
- [x] `node scripts/blackkey-enemy-cutouts.mjs` (new cuts → RGBA alpha)
- [x] KEEP-SHARE intentional: job_ninja/shinobi→exhausted_shinobi; guard_dog→war_dog; hidden_guard→mist_ninja; assassin→hired_assassin

### Fire F — re-verify (loop 019f988a393a / 2026-07-25) ✅ NO-OP
Spot-check confirmed backlog still landed; no regen required this fire:
- [x] Residual JPGs: only 5 live `archetype_*.jpg` under `public/assets/icons/enemies/`
- [x] Portrait/cut parity: 44 `enemy_*.png` + 44 `enemy_cut_*.png` (0 missing cuts)

### Fire G — re-verify (same loop, later tick) ✅ NO-OP
- [x] Re-inventory: icons only 5 archetypes; 44/44 portrait+cut; all P0/P1/DEDICATE cuts RGBA
- [x] Mist fallback still → `pool_mist_ninja` (not hired_assassin)
- [x] No open P0/P1 backlog items — skip Imagine regen this fire

### Fire H — re-verify ✅ NO-OP
- [x] Disk: 5 archetype JPGs only; 44/44 PNG plates; mist → mist_ninja
- [x] Combat/CSS layers already wired (no open P0 cut/identity work)
- [x] Skip Imagine / blackkey this fire

### Fire I — re-verify ✅ NO-OP
- [x] icons=5 residual=0; portraits=44 cuts=44; all P0/P1/DEDICATE present
- [x] mist → pool_mist_ninja; backlog idle — no Imagine this fire

### Fire J+ — idle monitor ✅
Subsequent ticks (same loop): inventory still 5 archetypes / 44+44 / mist OK. **P0–P1 backlog closed.** Stop regenerating; only re-open if files regress.
- [x] All cutouts color type RGBA (PNG color=6); portraits RGB plates OK
- [x] Manifest: 48 enemy `/assets/enemy_*` srcs, 0 missing files on disk
- [x] P0/P1 visual identity OK (dock_worker hook enforcer, gato tycoon, sea_spirit ethereal, puppeteer+puppet isolated, monk isolated, haku/demon_bros clean cuts, saboteur full-body+spool, samurai no battlefield)
- [x] DEDICATE plates present + wired (eldritch/elite_merc/river_bandit/elite_guard/manor)
- [x] `getEnemyArt` mist-keyword → `pool_mist_ninja` (not hired_assassin)
- [x] Combat resolve: `EnemySystem` stamps `image` via `poolId`; cutout via `deriveEnemyCutout`; CinematicViewscreen layers clean

---

## How the loop should use this

1. Read this `AUDIT.md` first every fire.
2. Execute **P0 DELETE** residual JPGs (safe: unreferenced).
3. **REGENERATE** portraits + cutouts listed below with Imagine + `combat-art` + `game-asset-core`.
4. After new art lands: `node scripts/blackkey-enemy-cutouts.mjs`
5. Wire new dedicated plates into `enemyArtManifest.ts` for **DEDICATE** ids.
6. Prefer `public/assets/` as runtime source of truth (mirror root `assets/` if project convention requires both).
7. Do **not** ship wrong-identity plates; delete/replace simple/cartoon mismatches.

---

## P0 — REGENERATE (simple / wrong style / wrong identity / bad cutout)

| Priority | id | Why | Action | Status |
|----------|-----|-----|--------|--------|
| P0 | **dock_worker** | Soft cartoon cyan-eyed ghost on magenta plate; not a dock enforcer (~276KB) | Replace portrait + cut; delete residual jpg | ✅ DONE |
| P0 | **gato** | Flat webtoon/NFT cartoon; not boss-tier seinene/arcade | Full regenerate portrait + cut | ✅ DONE |
| P0 | **sea_spirit** | Identity fail: frost dock thug with brass knuckles, not water spirit | New ethereal spirit art + cut | ✅ DONE |
| P0 | **clumsy_puppeteer** | Full workshop baked into “cutout”; unusable combat layer | Isolated full-body sprite + clean cut | ✅ DONE |
| P0 | **monk** | Pixel bust + temple scene baked into cut | Isolated combat sprite + clean cut | ✅ DONE |
| P0 | **boss_haku** | “Cutout” is full ice-mirror scene; not composable | Scene card OK for UI; **new combat cut** (alpha figure) | ✅ DONE |
| P0 | **boss_demon_brothers** | Portrait baked scenery; cutout opaque black-box risk | Clean combat cut + optional cleaner portrait | ✅ DONE |
| P1 | **bridge_saboteur** | Bust-only; Konoha leaf plate wrong for Wave/Gato saboteur; hot magenta plate | Full-body saboteur, no Leaf, abyss palette | ✅ DONE |
| P1 | **samurai** | Cut has baked sunset battlefield | Keep strong portrait if desired; regenerate clean cut | ✅ DONE |
| P2 | **archetype_tank.jpg** | Western plate knight ≠ shinobi tank | New archetype icon in shinobi world | ✅ DONE |

---

## P0 — DELETE residual JPGs (unreferenced; painted PNG supersedes) ✅ DONE

Deleted under `public/assets/icons/enemies/` (15 residual pool JPGs). Remaining (intentional archetype tiles):

```
archetype_assassin.jpg
archetype_balanced.jpg
archetype_caster.jpg
archetype_genjutsu.jpg
archetype_tank.jpg   ← P2 DONE (shinobi tank, WAVE15)
```

**KEEP wired:** the 5 live `archetype_*.jpg` under icons/enemies.

---

## DEDICATE — soft-shares that need own art

| Priority | Borrower id | Was sharing | Need | Status |
|----------|-------------|-------------|------|--------|
| P0 | `pool_eldritch_guardian` | treasure_guardian | Void/shrine eldritch warden + cut | ✅ `/assets/enemy_eldritch_guardian.png` |
| P0 | `pool_elite_mercenary` | bridge_saboteur | Armored elite merc + cut | ✅ `/assets/enemy_elite_mercenary.png` |
| P1 | `pool_river_bandit` | mist_ninja | Ragged river bandit + cut | ✅ `/assets/enemy_river_bandit.png` |
| P1 | `pool_elite_guard` | corrupt_guard | Gato-compound elite guard + cut | ✅ `/assets/enemy_elite_guard.png` |
| P2 | `pool_manor_guardian` | corrupt_guard | Haunted manor warden + cut | ✅ `/assets/enemy_manor_guardian.png` |

### KEEP-SHARE (OK temporary)

- `job_ninja` / `job_shinobi` → `exhausted_shinobi`
- `pool_guard_dog` → `war_dog`
- `pool_hidden_guard` → `mist_ninja` (optional later)
- `pool_assassin` → `hired_assassin`

### Code fix (manifest/registry)

- [x] `getEnemyArt` mist-keyword fallback → `pool_mist_ninja` (then hidden_guard); no longer hired_assassin.
- [x] Backlog note + residual JPG delete landed.
- [x] Explicit `enemy:pool_mist_ninja` plate-owner key (hidden_guard still soft-shares mist_ninja file).

---

## KEEP (strong cast — do not touch unless polishing)

bandit_captain, beach_bandit, camp_raider, cave_smuggler, corrupt_foreman, corrupt_guard, corrupt_merchant, corrupted_priest, cove_smuggler, cursed_servant, desperate_traveler, drowned_sailor, exhausted_shinobi, forest_bandit, hired_assassin, hired_muscle, missing_nin, mist_ninja, ronin, sea_creature, shrine_demon, smuggler, stranded_ronin, trap_master, treasure_guardian, vengeful_ghost, village_thug, war_dog, water_spirit, wild_boar

---

## Suggested work order for loop fires

### Fire A — cleanup
1. DELETE residual 15 JPGs  
2. Fix mist fallback in artRegistry/getEnemyArt  
3. Update ART_BACKLOG notes  

### Fire B — critical identity regen (Imagine)
1. dock_worker  
2. gato  
3. sea_spirit  
4. clumsy_puppeteer (portrait+cut)  
5. monk (portrait+cut)  

### Fire C — boss combat cuts
1. boss_haku combat cut (alpha figure)  
2. boss_demon_brothers combat cut  
3. bridge_saboteur full regenerate  
4. samurai cut cleanup  

### Fire D — dedicate soft-shares
1. eldritch_guardian  
2. elite_mercenary  
3. river_bandit  
4. elite_guard  
5. manor_guardian  

### Every regen
- Use skills: `imagine`, `combat-art`, `game-asset-core`  
- Style: 16-bit Neo-Retro / Neo Geo–Capcom, black outlines, cel-shading, abyss/mist Wave palette  
- Output: `public/assets/enemy_<id>.png` + `enemy_cut_<id>.png`  
- Run: `node scripts/blackkey-enemy-cutouts.mjs`  
- Update `enemyArtManifest.ts` when new dedicated files land  

---

## Counts (portrait visual audit agents 01–13)

| Verdict | Approx |
|---------|--------|
| KEEP | ~30 dedicated plates |
| REGENERATE | 9+ (dock_worker, gato, sea_spirit, clumsy_puppeteer, monk, bridge_saboteur, boss_haku, boss_demon_brothers, + cut issues samurai) |
| DEDICATE | 5 soft-share borrowers |
| DELETE residual JPG | 15 |

---

## Agent map

| Agent | Scope |
|------:|-------|
| 01–12 | Painted portrait batches |
| 13 | Bosses |
| 14 | Soft-shares + dual-path + residual JPG inventory |
| 15 | Cutouts half A |
| 16 | Cutouts half B + archetypes + DELETE list |

---

*Generated for loop job `019f960163dd`. Loop should consume this file and burn down P0 first.*
