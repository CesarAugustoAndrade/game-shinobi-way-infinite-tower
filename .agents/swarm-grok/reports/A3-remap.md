# A3-enemy — Diversity Remap (R1-401)

**Agent:** A3-enemy  
**Date:** 2026-07-22  
**Task:** R1-401 — Remap Wave Country pool portraits off shared `exhausted_shinobi`  
**File:** `src/game/constants/enemyArtManifest.ts`  
**No new images generated** — reuse existing painted PNGs + enemy icons.

---

## Goal

Improve combat identity without asset generation by spreading pool entries across diverse painted cutouts and thematic icons so not every fight is the exhausted shinobi face.

## Coordination

- **Preserved W5-integrate (R1-407) mappings:**  
  `missing_nin`, `bridge_saboteur`, `hired_assassin`, `assassin` → dedicated painted;  
  `gato` → `enemy_gato.png`;  
  `guard_dog` → `war_dog.jpg`.
- Concurrent W5 also wired `dock_worker`, `sea_spirit` painted paths — left intact / completed diversity around them.
- Re-read manifest before final edits to avoid clobbering W5.

---

## Theme rules applied

| Theme | Asset family |
|-------|----------------|
| Bandits / armed thugs / captains / guards | `enemy_samurai.png` |
| Smugglers / corrupt merchants | `enemy_clumsy_puppeteer.png` |
| Elite / guardians / muscle-elite | `enemy_monk.png` |
| Ragged thugs / raiders / desperate | `enemy_exhausted_shinobi.png` |
| Stealth / hidden / missing-nin | `enemy_missing_nin.png` |
| Assassins | `enemy_hired_assassin.png` |
| Bridge saboteur | `enemy_bridge_saboteur.png` |
| Dock labor | `enemy_dock_worker.png` |
| Spirits | `enemy_sea_spirit.png` (painted) / spirit icons |
| Dogs | `icons/enemies/war_dog.jpg` |
| Ghosts / curses / demons | dedicated `icons/enemies/*` |
| Boss-tier named | `enemy_gato.png` |

Prefer **painted PNG** when available so `Combat.tsx` cutout rewrite (`enemy_` → `enemy_cut_`) works.

---

## Full pool mapping table (final)

| pool id | src | quality | notes |
|---------|-----|---------|-------|
| `dock_worker` | `/assets/enemy_dock_worker.png` | painted-png | dedicated + cutout |
| `corrupt_guard` | `/assets/enemy_samurai.png` | painted-png | armed authority |
| `smuggler` | `/assets/enemy_clumsy_puppeteer.png` | painted-png | shady dealer |
| `beach_bandit` | `/assets/enemy_samurai.png` | painted-png | armed bandit |
| `sea_spirit` | `/assets/enemy_sea_spirit.png` | painted-png | upgraded from jpg icon |
| `stranded_ronin` | `/assets/enemy_samurai.png` | painted-png | unchanged |
| `forest_bandit` | `/assets/enemy_exhausted_shinobi.png` | painted-png | ragged intentional |
| `wild_boar` | `/assets/icons/enemies/wild_boar.jpg` | imagine-jpg | animal icon |
| `missing_nin` | `/assets/enemy_missing_nin.png` | painted-png | **W5 preserved** |
| `cave_smuggler` | `/assets/enemy_clumsy_puppeteer.png` | painted-png | smuggler family |
| `trap_master` | `/assets/icons/enemies/trap_master.jpg` | imagine-jpg | dedicated icon |
| `guard_dog` | `/assets/icons/enemies/war_dog.jpg` | imagine-jpg | **W5 preserved** |
| `village_thug` | `/assets/enemy_exhausted_shinobi.png` | painted-png | common thug |
| `corrupt_merchant` | `/assets/enemy_clumsy_puppeteer.png` | painted-png | schemer |
| `hired_muscle` | `/assets/enemy_monk.png` | painted-png | heavy elite stance |
| `river_bandit` | `/assets/enemy_samurai.png` | painted-png | armed bandit |
| `camp_raider` | `/assets/enemy_exhausted_shinobi.png` | painted-png | ragged raider |
| `desperate_traveler` | `/assets/enemy_exhausted_shinobi.png` | painted-png | thematic fit |
| `drowned_sailor` | `/assets/icons/enemies/drowned_sailor.jpg` | imagine-jpg | undead icon |
| `water_spirit` | `/assets/enemy_sea_spirit.png` | painted-png | spirit painted alias |
| `treasure_guardian` | `/assets/enemy_monk.png` | painted-png | guardian |
| `bridge_saboteur` | `/assets/enemy_bridge_saboteur.png` | painted-png | **W5 preserved** |
| `hired_assassin` | `/assets/enemy_hired_assassin.png` | painted-png | **W5 preserved** |
| `corrupt_foreman` | `/assets/enemy_samurai.png` | painted-png | armed boss |
| `bandit_captain` | `/assets/enemy_samurai.png` | painted-png | captain |
| `elite_mercenary` | `/assets/enemy_monk.png` | painted-png | elite |
| `war_dog` | `/assets/icons/enemies/war_dog.jpg` | imagine-jpg | dog |
| `vengeful_ghost` | `/assets/icons/enemies/vengeful_ghost.jpg` | imagine-jpg | ghost |
| `manor_guardian` | `/assets/enemy_monk.png` | painted-png | guardian |
| `cursed_servant` | `/assets/icons/enemies/cursed_servant.jpg` | imagine-jpg | curse icon |
| `cove_smuggler` | `/assets/enemy_clumsy_puppeteer.png` | painted-png | smuggler family |
| `sea_creature` | `/assets/icons/enemies/sea_creature.jpg` | imagine-jpg | beast icon |
| `hidden_guard` | `/assets/enemy_missing_nin.png` | painted-png | stealth alias |
| `shrine_demon` | `/assets/icons/enemies/shrine_demon.jpg` | imagine-jpg | demon |
| `corrupted_priest` | `/assets/icons/enemies/corrupted_priest.jpg` | imagine-jpg | priest |
| `eldritch_guardian` | `/assets/enemy_monk.png` | painted-png | mystic guardian cutout |
| `elite_guard` | `/assets/enemy_monk.png` | painted-png | elite (differs from ronin) |
| `ronin` | `/assets/enemy_samurai.png` | painted-png | unchanged |
| `assassin` | `/assets/enemy_hired_assassin.png` | painted-png | **W5 preserved** |
| `gato` | `/assets/enemy_gato.png` | painted-png | **W5 preserved** |

---

## Coverage delta

| Metric | Before (E5) | After R1-401 |
|--------|-------------|--------------|
| Pool on `exhausted_shinobi` | ~24 / 40 | **4 / 40** |
| Distinct painted PNG faces in pool | ~3–6 | **10** (`dock_worker`, `samurai`, `puppeteer`, `monk`, `exhausted`, `sea_spirit`, `missing_nin`, `bridge_saboteur`, `hired_assassin`, `gato`) |
| Pool with cutout-eligible `/assets/enemy_*.png` | low | **high** (all humanoids above) |
| Icon-only (no cutout) | spirits/animals/ghosts | same intentional set |

### Still on exhausted (intentional)

1. `forest_bandit` — ragged forest thug  
2. `village_thug` — common ruffian  
3. `camp_raider` — desperate raider  
4. `desperate_traveler` — exhausted traveler  

Jobs `job_ninja` / `job_shinobi` also keep exhausted (fallback cascade).

---

## Per-location visual diversity (Land of Waves)

| Location | Pool trio faces |
|----------|-----------------|
| the_docks | dock_worker / samurai / puppeteer |
| misty_beach | samurai / sea_spirit / samurai(ronin) |
| coastal_forest | exhausted / wild_boar / missing_nin |
| smugglers_cave | puppeteer / trap_master / war_dog |
| fishing_village | exhausted / puppeteer / monk |
| riverside_camp | samurai / exhausted / exhausted |
| sunken_ship | drowned_sailor / sea_spirit / monk |
| bridge_construction | bridge_saboteur / hired_assassin / samurai |
| bandit_outpost | samurai / monk / war_dog |
| abandoned_manor | vengeful_ghost / monk / cursed_servant |
| hidden_cove | puppeteer / sea_creature / missing_nin |
| drowned_shrine | shrine_demon / corrupted_priest / monk |
| gatos_compound | monk / samurai / hired_assassin / gato |

---

## Verification

- Manifest only edited; no game logic changes.
- W5 dedicated paths for gato/assassin/saboteur/missing_nin/guard_dog retained.
- Cutout convention: painted `/assets/enemy_X.png` → `/assets/enemy_cut_X.png` when file exists.
- Remaining gaps (optional future art): dedicated portraits for thugs/bandits that still share samurai/exhausted; cutouts for animals/ghosts still portrait-mask only.

---

## Done when

- [x] Pool no longer dominated by single shinobi sprite  
- [x] Thematic remap table documented  
- [x] W5 gato/assassin mappings preserved  
- [x] Report at `.agents/swarm-grok/reports/A3-remap.md`  
- [x] Claim R1-401 in region1-polish-backlog.md  
