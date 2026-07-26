# Agent 14/16 — Soft-Share / Manifest Mapping Audit

**Date:** 2026-07-24  
**Scope:** `enemyArtManifest.ts` soft-shares, residual JPGs, dual-path assets  
**Sources:**
- `src/game/constants/enemyArtManifest.ts` (full read)
- `src/game/constants/artRegistry.ts` (enemy cascade + `ART_BACKLOG_NOTES.T021_enemies_events`)
- `public/assets/icons/enemies/` (20 files)
- `public/assets/enemy_*.png` + `enemy_cut_*.png` (runtime serve tree)
- repo-root `assets/enemy_*.png` (non-public mirror / source tree)
- Pool usage: `src/game/constants/regions/landOfWaves.ts`, `EnemySystem.ts`

**No assets modified.** Report only.

---

## 1. Manifest path conventions

| Kind | Count | Path pattern | Quality | Notes |
|------|------:|--------------|---------|-------|
| archetype | 5 | `/assets/icons/enemies/archetype_*.jpg` | `imagine-jpg` | Live Imagine tiles under icons/ |
| job | 5 | `/assets/enemy_*.png` | `painted-png` | Flat public root |
| boss | 2 | `/assets/enemy_boss_*.png` | `painted-png` | Flat public root |
| pool | 41 | `/assets/enemy_*.png` | `painted-png` | Flat public root; **10 soft-share** |

**Total manifest entries:** 53  
**Dedicated painted plates on disk:** 39 portraits + 39 matching `enemy_cut_*`  
**Soft-share borrowers:** 10 ids (reuse another plate’s `src`)

---

## 2. artRegistry soft-share notes

From `ART_BACKLOG_NOTES.T021_enemies_events` (approx. lines 527–528):

| Note | Status vs current manifest |
|------|----------------------------|
| WAVE9 remaps: `manor_guardian` / `elite_guard` → `corrupt_guard` | **Confirmed** |
| WAVE9: `eldritch_guardian` → `treasure_guardian` | **Confirmed** |
| WAVE9: `assassin` → `hired_assassin` | **Confirmed** |
| Residual: `river_bandit` / `hidden_guard` → `mist_ninja` | **Confirmed** |
| Residual: `elite_mercenary` → `bridge_saboteur` | **Confirmed** |
| `R1 jpg residual: none` | **Stale** — 15 pool residual JPGs still on disk under `icons/enemies/` (unused by live manifest) |
| job_ninja / job_shinobi → exhausted_shinobi | **Present in manifest; omitted from backlog residual list** |
| guard_dog → war_dog | **Present in manifest; omitted from backlog residual list** |

**Stale cascade comment** in `getEnemyArt` (mist keyword branch, ~L423–428):

```text
// Same plate as pool_assassin / river_bandit / hidden_guard.
const mist = ART_REGISTRY['enemy:pool_assassin'];
```

- `pool_assassin` now points to **`enemy_hired_assassin.png`**, not `mist_ninja`.
- Mist-keyword name fallback therefore resolves to the hired-assassin plate, not mist_ninja.
- Recommend fix in a later code pass (out of scope for this report): point mist fallback at a plate that still owns mist art (e.g. invent `enemy:plate_mist_ninja` or route via `hidden_guard` / dedicated key).

---

## 3. Soft-share inventory (complete)

Definition: manifest `id` whose `src` basename does **not** match the logical enemy slug (or deliberately reuses another enemy’s dedicated plate).

| # | Borrower id | Manifest key | Shared portrait `src` | Plate owner | Soft-share target slug | Locations (Land of Waves) |
|---|-------------|--------------|----------------------|-------------|------------------------|---------------------------|
| 1 | `job_ninja` | `enemy:job_ninja` | `/assets/enemy_exhausted_shinobi.png` | plate only (no pool id) | `exhausted_shinobi` | Job / name fallback (`ninja` keyword) |
| 2 | `job_shinobi` | `enemy:job_shinobi` | `/assets/enemy_exhausted_shinobi.png` | plate only | `exhausted_shinobi` | Job / name fallback (`shinobi` keyword) |
| 3 | `pool_guard_dog` | `enemy:pool_guard_dog` | `/assets/enemy_war_dog.png` | `pool_war_dog` | `war_dog` | Smuggler's Cave |
| 4 | `pool_river_bandit` | `enemy:pool_river_bandit` | `/assets/enemy_mist_ninja.png` | plate only (no `pool_mist_ninja`) | `mist_ninja` | Riverside Camp; also Sasuke Retrieval river_road |
| 5 | `pool_elite_mercenary` | `enemy:pool_elite_mercenary` | `/assets/enemy_bridge_saboteur.png` | `pool_bridge_saboteur` | `bridge_saboteur` | Bandit Outpost (with captain + war_dog) |
| 6 | `pool_manor_guardian` | `enemy:pool_manor_guardian` | `/assets/enemy_corrupt_guard.png` | `pool_corrupt_guard` | `corrupt_guard` | Abandoned Manor |
| 7 | `pool_hidden_guard` | `enemy:pool_hidden_guard` | `/assets/enemy_mist_ninja.png` | plate only | `mist_ninja` | Hidden Cove |
| 8 | `pool_eldritch_guardian` | `enemy:pool_eldritch_guardian` | `/assets/enemy_treasure_guardian.png` | `pool_treasure_guardian` | `treasure_guardian` | Drowned Shrine |
| 9 | `pool_elite_guard` | `enemy:pool_elite_guard` | `/assets/enemy_corrupt_guard.png` | `pool_corrupt_guard` | `corrupt_guard` | Gato's Compound |
| 10 | `pool_assassin` | `enemy:pool_assassin` | `/assets/enemy_hired_assassin.png` | `pool_hired_assassin` | `hired_assassin` | Gato's Compound |

### Soft-share fan-in (plate → borrowers)

| Shared plate file | Owner entry | Borrowers |
|-------------------|-------------|-----------|
| `enemy_exhausted_shinobi.png` | (plate; cut exists) | `job_ninja`, `job_shinobi` |
| `enemy_war_dog.png` | `pool_war_dog` | `pool_guard_dog` |
| `enemy_mist_ninja.png` | (plate; **no pool id**) | `pool_river_bandit`, `pool_hidden_guard` |
| `enemy_bridge_saboteur.png` | `pool_bridge_saboteur` | `pool_elite_mercenary` |
| `enemy_corrupt_guard.png` | `pool_corrupt_guard` | `pool_manor_guardian`, `pool_elite_guard` |
| `enemy_treasure_guardian.png` | `pool_treasure_guardian` | `pool_eldritch_guardian` |
| `enemy_hired_assassin.png` | `pool_hired_assassin` | `pool_assassin` |

### Cutout behavior for soft-shares

Combat rewrites `/assets/enemy_<slug>.png` → `/assets/enemy_cut_<slug>.png` from the **portrait path**, not the pool id. Soft-shares therefore reuse the owner’s cutout (e.g. river_bandit combat sprite = `enemy_cut_mist_ninja.png`). No missing-cutout 404 for current soft-shares, provided the owner plate cut exists (all seven plates above have `enemy_cut_*`).

---

## 4. Soft-share verdicts: DEDICATE vs KEEP-SHARE

| Borrower | → Plate | Verdict | Reason |
|----------|---------|---------|--------|
| `job_ninja` | `exhausted_shinobi` | **KEEP-SHARE** | Generic job/name fallback, not a pool enemy identity. Exhausted shinobi plate is a reasonable default ninja face. Dedicate only if job-tagged fights become a primary cast. |
| `job_shinobi` | `exhausted_shinobi` | **KEEP-SHARE** | Same plate as `job_ninja`; synonym job tags. Acceptable temporary / permanent generic fallback. |
| `pool_guard_dog` | `war_dog` | **KEEP-SHARE** | Same species / combat role (canine companion). Display names differ (`War Hound` vs war dog) but silhouette needs match. Low priority; optional recolor/armor variant later. |
| `pool_river_bandit` | `mist_ninja` | **DEDICATE** | Identity mismatch: river raider / bandit fantasy vs Mist Village shinobi plate. Appears in Riverside Camp (core Wave route) and Sasuke Retrieval — high visibility. Needs ragged river-bandit portrait + cut. |
| `pool_elite_mercenary` | `bridge_saboteur` | **DEDICATE** | Role clash: bandit-outpost elite merc vs bridge demo/saboteur kit. Shares elite stage with captain; players will notice clone art. Needs armored mercenary plate + cut. |
| `pool_manor_guardian` | `corrupt_guard` | **DEDICATE** | Manor haunt cast (ghost / warden / cursed servant). Dock “corrupt guard” reads bribed municipal, not haunted estate warden. Ghost-manor palette + armor would sell Abandoned Manor. |
| `pool_hidden_guard` | `mist_ninja` | **KEEP-SHARE** | Stealth ninja silhouette fits Hidden Cove sentry fantasy. Same plate also used by river_bandit — once river_bandit is dedicated, mist plate can remain acceptable for hidden_guard temporary; still optional later dedicate for cove-specific kit. |
| `pool_eldritch_guardian` | `treasure_guardian` | **DEDICATE** | Drowned Shrine climax trio (demon / priest / **eldritch**). Treasure-guardian plate is construct/loot-warden, not void/shrine corruption. Strong identity gap; dedicate with eldritch/abyss motif + cut. |
| `pool_elite_guard` | `corrupt_guard` | **DEDICATE** | Compound climax (with gato / assassin / ronin). “Elite/compound” should look cleaner, heavier, Gato-loyal — not the same dock bribe-guard. Soft-sharing devalues final location cast. |
| `pool_assassin` | `hired_assassin` | **KEEP-SHARE** | Near-synonym roles (assassin vs hired assassin). Acceptable temporary; only dedicate if compound needs a second distinct assassin silhouette. |

### Priority order for new plates (DEDICATE)

1. **P0** `pool_eldritch_guardian` — shrine climax identity  
2. **P0** `pool_elite_mercenary` — outpost elite clone of saboteur  
3. **P1** `pool_river_bandit` — high traffic + cross-region  
4. **P1** `pool_elite_guard` — compound finale  
5. **P2** `pool_manor_guardian` — manor trio cohesion  

**KEEP-SHARE (no paint required now):** `job_ninja`, `job_shinobi`, `pool_guard_dog`, `pool_hidden_guard`, `pool_assassin`

### Prompt hints (DEDICATE only)

| id | prompt_hint |
|----|-------------|
| `eldritch_guardian` | 16-bit arcade portrait, black outline, cel 4–5 tones; drowned-shrine eldritch warden, void-coral armor, sickly cyan glow, non-human eyes; Land of Waves mist palette; no photoreal |
| `elite_mercenary` | Elite sellsword, heavy armor plates, bandit-outpost colors, dual blades or nodachi; distinct from bridge demo charges / tags; combat cutout ready |
| `river_bandit` | Ragged riverside raider, wet cloak, scavenged gear, river mud; **not** Mist Village headband ninja; readable silhouette |
| `elite_guard` | Gato compound elite: polished armor, corporate thug heraldry, spear/halberd; cleaner than corrupt dock guard |
| `manor_guardian` | Haunted manor warden, faded livery, spectral dust, lantern or naginata; cold manor interior lighting |

---

## 5. Residual JPGs under `public/assets/icons/enemies/`

Live pool/job/boss art uses **painted PNG** paths (`/assets/enemy_*.png`). Residual Imagine JPGs below are **not referenced** by `enemyArtManifest.ts` (only archetype_*.jpg remain live).

### 5a. Residual JPG that duplicates a painted PNG → recommend **DELETE**

| Residual JPG | Painted PNG (live) | Manifest uses painted? | Recommendation |
|--------------|--------------------|------------------------|----------------|
| `corrupted_priest.jpg` | `enemy_corrupted_priest.png` | Yes | **DELETE** residual JPG |
| `cursed_servant.jpg` | `enemy_cursed_servant.png` | Yes | **DELETE** residual JPG |
| `dock_worker.jpg` | `enemy_dock_worker.png` | Yes | **DELETE** residual JPG |
| `drowned_sailor.jpg` | `enemy_drowned_sailor.png` | Yes | **DELETE** residual JPG |
| `gato.jpg` | `enemy_gato.png` | Yes | **DELETE** residual JPG |
| `hired_assassin.jpg` | `enemy_hired_assassin.png` | Yes | **DELETE** residual JPG |
| `missing_nin.jpg` | `enemy_missing_nin.png` | Yes | **DELETE** residual JPG |
| `sea_creature.jpg` | `enemy_sea_creature.png` | Yes | **DELETE** residual JPG |
| `sea_spirit.jpg` | `enemy_sea_spirit.png` | Yes | **DELETE** residual JPG |
| `shrine_demon.jpg` | `enemy_shrine_demon.png` | Yes | **DELETE** residual JPG |
| `trap_master.jpg` | `enemy_trap_master.png` | Yes | **DELETE** residual JPG |
| `vengeful_ghost.jpg` | `enemy_vengeful_ghost.png` | Yes | **DELETE** residual JPG |
| `war_dog.jpg` | `enemy_war_dog.png` | Yes | **DELETE** residual JPG |
| `water_spirit.jpg` | `enemy_water_spirit.png` | Yes | **DELETE** residual JPG |
| `wild_boar.jpg` | `enemy_wild_boar.png` | Yes | **DELETE** residual JPG |

**Count:** 15 residual pool JPGs safe to delete after confirming no external/tooling references (grep: live `src` only hits archetypes under `icons/enemies/`; `todos/enemy-art-manifest.json` still lists old `.svg` paths — historical, not runtime).

### 5b. Live archetype JPGs → **KEEP** (not residual)

| File | Manifest id | Recommendation |
|------|-------------|----------------|
| `archetype_tank.jpg` | `archetype_TANK` | **KEEP** (live fallback) |
| `archetype_assassin.jpg` | `archetype_ASSASSIN` | **KEEP** |
| `archetype_balanced.jpg` | `archetype_BALANCED` | **KEEP** |
| `archetype_caster.jpg` | `archetype_CASTER` | **KEEP** |
| `archetype_genjutsu.jpg` | `archetype_GENJUTSU` | **KEEP** |

### 5c. Note on backlog claim

`ART_BACKLOG_NOTES` claims `R1 jpg residual: none`. Disk still has the 15 pool residual JPGs above. Update backlog when cleanup lands.

---

## 6. Dual-path issues

### 6a. Two URL roots in the live manifest

| Path root | Used by | Physical dir |
|-----------|---------|--------------|
| `/assets/icons/enemies/*` | 5 archetypes only | `public/assets/icons/enemies/` |
| `/assets/enemy_*.png` | all job / boss / pool | `public/assets/` (flat) |

This is intentional post-paint migration but creates **split convention**:
- Cutout rewrite only understands flat `/assets/enemy_*` (see `Combat.tsx` `enemy_cut_` helper).
- Archetypes have **no** `enemy_cut_archetype_*` — combat falls back or uses portrait as-is for archetype-only fights.
- Future archetype paint should either stay icons-only (no cut needed) or move to flat `enemy_archetype_*.png` + cut for consistency.

### 6b. Repo-root `assets/` vs `public/assets/`

| Tree | Enemy portraits | Enemy cutouts | icons/enemies |
|------|-----------------|---------------|---------------|
| `public/assets/` | 39 `enemy_*.png` | 39 `enemy_cut_*.png` | 20 JPGs (5 archetype + 15 residual) |
| repo-root `assets/` | 39 `enemy_*.png` (mirror) | 39 `enemy_cut_*.png` (mirror) | **missing** (`assets/icons/enemies` does not exist) |

**Issues:**
1. **Duplicate storage:** painted enemy plates exist in both `assets/` and `public/assets/`. Vite serves **only** `public/`. Root `assets/` is a non-served mirror (or build-source) — risk of drift if one side is updated alone.
2. **Icons only under public:** residual + archetype JPGs live solely in `public/assets/icons/enemies/`; no root-`assets/icons` twin.
3. **No `assets/icons/enemies` at repo root** — dual-path is asymmetric (painted mirrored; icons not).

**Recommendation (ops, not this agent):**
- Treat `public/assets/` as source of truth for runtime.
- Either symlink/copy-sync root `assets/` enemy plates or stop maintaining the root mirror.
- DELETE the 15 residual JPGs under `public/assets/icons/enemies/` once confirmed unused.
- Keep 5 archetype JPGs until replaced by painted archetype plates (if ever).

### 6c. Soft-share plate with no pool id

`enemy_mist_ninja.png` (+ cut) is a **first-class plate** on disk and is the soft-share target for two pool ids, but there is **no** `pool_mist_ninja` / `enemy:pool_mist_ninja` manifest entry. Same for `exhausted_shinobi` (job-only plate).

| Plate | Manifest owner key | Implication |
|-------|--------------------|-------------|
| `mist_ninja` | none | Plate is “orphan owner”; only reachable via soft-share or direct path |
| `exhausted_shinobi` | none as pool | Owned by job entries only |

Optional cleanup: add explicit plate keys or rename soft-share documentation so audits can treat owners as first-class.

---

## 7. Manifest completeness cross-check (non soft-share)

Every non-soft-share pool/job/boss `src` basename matches an on-disk painted file under `public/assets/`. Soft-share borrowers intentionally point at another slug’s file. No soft-share points at a missing file.

Dedicated examples (sample): `pool_dock_worker` → `enemy_dock_worker.png` ✓, `boss_haku` → `enemy_boss_haku.png` ✓, `pool_beach_bandit` → `enemy_beach_bandit.png` ✓.

---

## 8. Batch summary

### Soft-share verdicts

| Verdict | Count | Ids |
|---------|------:|-----|
| **DEDICATE** | 5 | `river_bandit`, `elite_mercenary`, `manor_guardian`, `eldritch_guardian`, `elite_guard` |
| **KEEP-SHARE** | 5 | `job_ninja`, `job_shinobi`, `guard_dog`, `hidden_guard`, `assassin` |

### Residual JPG

| Action | Count | Files |
|--------|------:|-------|
| **DELETE** residual (painted exists) | 15 | corrupted_priest, cursed_servant, dock_worker, drowned_sailor, gato, hired_assassin, missing_nin, sea_creature, sea_spirit, shrine_demon, trap_master, vengeful_ghost, war_dog, water_spirit, wild_boar |
| **KEEP** live archetype | 5 | archetype_{tank,assassin,balanced,caster,genjutsu}.jpg |

### Dual-path flags

| Flag | Severity | Detail |
|------|----------|--------|
| Split URL roots icons/ vs flat `/assets/enemy_*` | Medium | Archetypes vs painted cast |
| Root `assets/` mirror of painted enemies | Medium | Drift risk; not served by Vite |
| Root missing `assets/icons/enemies` | Low | Asymmetric dual-path |
| Stale mist→assassin fallback comment | Medium | Code resolves wrong plate for “mist” names |
| Backlog “jpg residual: none” | Low | Docs wrong; 15 residuals remain |
| mist_ninja / exhausted_shinobi plates lack pool ids | Low | Soft-share owners not first-class in manifest |

### Suggested next art wave (this agent’s slice)

1. Paint **DEDICATE ×5** with matching `enemy_cut_*`.  
2. Remap manifest `src` for those five to dedicated paths.  
3. DELETE 15 residual JPGs under `public/assets/icons/enemies/`.  
4. Fix `getEnemyArt` mist-keyword fallback; refresh `ART_BACKLOG_NOTES` residual list (include job/guard_dog shares or mark intentional).

---

## 9. Per-borrower cards (rubric-shaped)

### job_ninja
- paths: portrait=`/assets/enemy_exhausted_shinobi.png` cutout=`/assets/enemy_cut_exhausted_shinobi.png` (shared)
- scores: n/a (soft-share mapping agent — no visual scoring)
- verdict: **KEEP-SHARE**
- why: Generic job fallback; exhausted shinobi plate is acceptable default ninja identity.
- prompt_hint: —

### job_shinobi
- paths: portrait=`/assets/enemy_exhausted_shinobi.png` cutout=`/assets/enemy_cut_exhausted_shinobi.png` (shared)
- scores: n/a
- verdict: **KEEP-SHARE**
- why: Synonym of job_ninja; same plate intentional.
- prompt_hint: —

### pool_guard_dog
- paths: portrait=`/assets/enemy_war_dog.png` cutout=`/assets/enemy_cut_war_dog.png` (shared with war_dog)
- scores: n/a
- verdict: **KEEP-SHARE**
- why: Canine companion variant; silhouette role matches war dog.
- prompt_hint: —

### pool_river_bandit
- paths: portrait=`/assets/enemy_mist_ninja.png` cutout=`/assets/enemy_cut_mist_ninja.png` (shared)
- scores: n/a
- verdict: **DEDICATE**
- why: River raider identity ≠ Mist ninja plate; high-traffic riverside + cross-region pool.
- prompt_hint: ragged river raider, wet cloak, scavenged weapons, mud/river palette; arcade cel outline; not Mist headband

### pool_elite_mercenary
- paths: portrait=`/assets/enemy_bridge_saboteur.png` cutout=`/assets/enemy_cut_bridge_saboteur.png` (shared)
- scores: n/a
- verdict: **DEDICATE**
- why: Elite merc at bandit outpost must not clone bridge saboteur kit.
- prompt_hint: heavy mercenary armor, sellsword kit, outpost colors; distinct from demolitions saboteur

### pool_manor_guardian
- paths: portrait=`/assets/enemy_corrupt_guard.png` cutout=`/assets/enemy_cut_corrupt_guard.png` (shared)
- scores: n/a
- verdict: **DEDICATE**
- why: Haunted manor warden should not reuse dock corrupt-guard plate.
- prompt_hint: faded livery, spectral dust, manor lantern, cold interior light

### pool_hidden_guard
- paths: portrait=`/assets/enemy_mist_ninja.png` cutout=`/assets/enemy_cut_mist_ninja.png` (shared)
- scores: n/a
- verdict: **KEEP-SHARE**
- why: Stealth guard fantasy fits mist-ninja silhouette; lower priority than river_bandit split.
- prompt_hint: (optional later) cove sentry, damp dark gear, silent posture

### pool_eldritch_guardian
- paths: portrait=`/assets/enemy_treasure_guardian.png` cutout=`/assets/enemy_cut_treasure_guardian.png` (shared)
- scores: n/a
- verdict: **DEDICATE**
- why: Shrine eldritch identity vs treasure-warden plate is a hard fantasy mismatch at climax.
- prompt_hint: void/abyss shrine warden, coral-curse armor, cyan eldritch glow

### pool_elite_guard
- paths: portrait=`/assets/enemy_corrupt_guard.png` cutout=`/assets/enemy_cut_corrupt_guard.png` (shared)
- scores: n/a
- verdict: **DEDICATE**
- why: Gato compound elite needs distinct polished guard identity from dock corruption.
- prompt_hint: polished compound armor, Gato-loyal heraldry, spear/halberd

### pool_assassin
- paths: portrait=`/assets/enemy_hired_assassin.png` cutout=`/assets/enemy_cut_hired_assassin.png` (shared)
- scores: n/a
- verdict: **KEEP-SHARE**
- why: Near-duplicate role names; same assassin fantasy is acceptable temporary share.
- prompt_hint: —

---

*End of Agent 14 report.*
