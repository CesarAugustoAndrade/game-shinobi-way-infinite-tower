# W5-integrate — Enemy painted PNG wire-up

**Agent:** W5-integrate  
**Date:** 2026-07-22  
**Tasks:** R1-400 (partial, assets on disk) · R1-407 (manifest integrate)  
**Files changed:** `src/game/constants/enemyArtManifest.ts`, `region1-polish-backlog.md`, `SWARM-STATE.md`

---

## Summary

Wired lead-installed painted enemy PNGs into `ENEMY_ART_MANIFEST` so pool combat portraits resolve to `/assets/enemy_*.png` and Combat cutout rewrite produces `/assets/enemy_cut_*.png`. No new image generation. `ART_REGISTRY` rebuilds from manifest at module load (no artRegistry code change). `npx tsc --noEmit` clean.

---

## Manifest updates (`enemyArtManifest.ts`)

| Pool key | Before | After | quality |
|----------|--------|-------|---------|
| `enemy:pool_missing_nin` | `/assets/icons/enemies/missing_nin.jpg` | `/assets/enemy_missing_nin.png` | `painted-png` |
| `enemy:pool_hired_assassin` | `/assets/enemy_exhausted_shinobi.png` | `/assets/enemy_hired_assassin.png` | `painted-png` |
| `enemy:pool_bridge_saboteur` | `/assets/enemy_exhausted_shinobi.png` | `/assets/enemy_bridge_saboteur.png` | `painted-png` |
| `enemy:pool_assassin` | `/assets/enemy_exhausted_shinobi.png` | `/assets/enemy_hired_assassin.png` | `painted-png` |
| `enemy:pool_gato` | `/assets/icons/enemies/gato.jpg` | `/assets/enemy_gato.png` | `painted-png` |
| `enemy:pool_guard_dog` | `/assets/enemy_exhausted_shinobi.png` | `/assets/icons/enemies/war_dog.jpg` | `imagine-jpg` |

**Notes:**
- `pool_assassin` aliases `enemy_hired_assassin.png` (has matching cutout). `enemy_mist_ninja.png` exists but **no** `enemy_cut_mist_ninja.png`, so hired_assassin preferred for cutout stage.
- `pool_guard_dog`: no dedicated `guard_dog` asset; aliased to existing `war_dog.jpg` (no cutout — jpg path does not match cutout rewrite).

---

## Cutout verification (`Combat.tsx`)

```ts
// Convention: /assets/enemy_<id>.png  →  /assets/enemy_cut_<id>.png
const enemyCutout = enemy.image?.startsWith('/assets/enemy_')
  ? enemy.image.replace('/assets/enemy_', '/assets/enemy_cut_')
  : undefined;
```

| Portrait src | Derived cutout | On disk |
|--------------|----------------|---------|
| `enemy_missing_nin.png` | `enemy_cut_missing_nin.png` | ✓ |
| `enemy_hired_assassin.png` | `enemy_cut_hired_assassin.png` | ✓ |
| `enemy_bridge_saboteur.png` | `enemy_cut_bridge_saboteur.png` | ✓ |
| `enemy_gato.png` | `enemy_cut_gato.png` | ✓ |

Icons under `/assets/icons/enemies/` do **not** start with `/assets/enemy_` → cutout stays `undefined` (CinematicViewscreen falls back to portrait + mask).

---

## ART_REGISTRY

```ts
// artRegistry.ts — rebuilds automatically from ENEMY_ART_MANIFEST
const ENEMY_ENTRIES = Object.fromEntries(
  ENEMY_ART_MANIFEST.map((m) => [m.key, entry(m.emoji, m.label, m.src)]),
);
// ...merged into ART_REGISTRY
```

No change required in `artRegistry.ts`. `getEnemyArt` / pool cascade uses `enemy:pool_${poolId}` keys.

---

## Remaining placeholders on `exhausted_shinobi`

Still using `/assets/enemy_exhausted_shinobi.png` (shared cutout `enemy_cut_exhausted_shinobi.png`):

### Jobs
- `job_ninja`, `job_shinobi`

### Pool IDs (still placeholder) — 20
| pool id | location(s) |
|---------|-------------|
| `dock_worker` | the_docks |
| `corrupt_guard` | the_docks |
| `smuggler` | the_docks |
| `beach_bandit` | misty_beach |
| `forest_bandit` | coastal_forest |
| `cave_smuggler` | smugglers_cave |
| `village_thug` | fishing_village |
| `corrupt_merchant` | fishing_village |
| `hired_muscle` | fishing_village |
| `river_bandit` | riverside_camp |
| `camp_raider` | riverside_camp |
| `desperate_traveler` | riverside_camp |
| `treasure_guardian` | sunken_ship |
| `corrupt_foreman` | bridge_construction |
| `bandit_captain` | bandit_outpost |
| `elite_mercenary` | bandit_outpost |
| `manor_guardian` | abandoned_manor |
| `cove_smuggler` | hidden_cove |
| `hidden_guard` | hidden_cove |
| `eldritch_guardian` | drowned_shrine |

### Dedicated but non-cutout (imagine-jpg / shared painted)

| pool | src | note |
|------|-----|------|
| sea_spirit, wild_boar, trap_master, drowned_sailor, water_spirit, war_dog, vengeful_ghost, cursed_servant, sea_creature, shrine_demon, corrupted_priest | icons jpg | dedicated, no cutout |
| guard_dog | war_dog.jpg | aliased this wave |
| stranded_ronin, elite_guard, ronin | enemy_samurai.png | shared job; has cutout |
| missing_nin, hired_assassin, bridge_saboteur, assassin, gato | painted PNG | **this wave** |

### Coverage delta (Region 1 pools, n=40)

| Metric | Before (E5) | After W5 |
|--------|------------:|---------:|
| On exhausted_shinobi | ~24 | **20** |
| Painted dedicated `/assets/enemy_*.png` (unique id) | 0 pool (only jobs/bosses) | **4** (+ assassin shares hired) |
| Non-shinobi resolve | ~16 | **19** |

---

## Unused on disk (not in manifest)

| File | Note |
|------|------|
| `enemy_mist_ninja.png` | No cutout; not wired (assassin uses hired_assassin) |

---

## Verification

- [x] Manifest src paths match files under `public/assets/`
- [x] Cutout rewrite naming confirmed in `Combat.tsx` L319–322
- [x] ART_REGISTRY maps from `ENEMY_ART_MANIFEST` (no dual source)
- [x] `npx tsc --noEmit` exit 0
- [x] Backlog R1-400 / R1-407 claimed + done

---

## Next for A3-enemy / future integrate

1. Generate remaining Priority A/B portraits (see E5-assets §4).
2. Prefer painted PNG + cutout for high-frequency Wave locations (docks, village, bridge).
3. Optionally wire `enemy_mist_ninja.png` if cutout is produced.
4. `eldritch_guardian` remains high-priority identity gap (drowned shrine).
