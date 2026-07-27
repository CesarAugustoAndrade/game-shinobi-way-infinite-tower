# E4-events — Region 1 Narrative Audit (WAVES_ARC)

**Agent:** E4-events (narrative)  
**Date:** 2026-07-22  
**Scope:** Read-only analysis + backlog FEATURE proposals (no architecture rewrite)  
**Backlog tasks added:** R1-001 … R1-015 (**15 tasks**)

---

## Executive summary

Region 1 has a **complete skeleton** of story event IDs wired to locations, but narrative quality is **one-shot RPG menu events**, not a Land of Waves arc. Event Engine 2.0 (`chainTo`, `requiresFlags`, `grantSkillById`, `curse`) is **fully implemented** and used heavily in Rogue/War arcs — **Waves uses almost none of it**.

**Tone target:** sober terror, mist, poverty, Gato tyranny (seinen-sublime).  
**Current tone:** mixed functional copy + cartoon hero beats (“legendary savior”, “Ninja Creed”, “eternal gratitude”).

---

## Inventory

### WAVES_ARC events (`src/game/constants/events/wavesArcEvents.ts`)

| id | rarity | setFlags | chainTo | requiresFlags | grantSkill / curse |
|----|--------|----------|---------|---------------|--------------------|
| bridge_worker_plea | COMMON | — | — | — | — |
| mist_ambush_cache | RARE | sunken_ship / hidden_cove | — | — | — |
| tazuna_request | COMMON | — | — | — | — |
| meet_tazuna | UNCOMMON | drowned_shrine_discovered | — | — | — |
| protect_village | UNCOMMON | — | — | — | — |
| meet_inari | UNCOMMON | — | — | — | — |
| protect_bridge | RARE | — | — | — | — |
| final_showdown_setup | RARE | — | — | — | — |
| final_confrontation | RARE | — | — | — | — |
| gato_defeat | RARE | — | — | — | — |

**10 events total. Zero `chainTo`. Zero `requiresFlags` / `excludesFlags`. Zero skill grants. Zero curses.**

Only flags written: secret-location unlocks (`sunken_ship_discovered`, `hidden_cove_discovered`, `drowned_shrine_discovered`).

### `tiedStoryEvents` vs event IDs (`landOfWaves.ts`)

| Location | tiedStoryEvents | Status |
|----------|-----------------|--------|
| the_docks | meet_tazuna | IDs exist |
| fishing_village | protect_village, meet_inari | IDs exist |
| bridge_construction | protect_bridge, final_showdown_setup | IDs exist; **no order** |
| gatos_compound | final_confrontation, gato_defeat | IDs exist; **victory can fire first** |
| All others | *(none)* | Story density sparse |

**Orphans (arc pool only, never preferred):**

- `bridge_worker_plea`
- `mist_ambush_cache`
- `tazuna_request`

### Atmosphere

`atmosphereEvents` are **snake_case tags**, not GameEvents. `pickAtmosphereFlavor` → `Atmosphere: Dock brawl` (humanized tags). No prose dictionary → **thin ambient**.

### Event selection (`EventSystem` + `LocationSystem.pickEventForLocation`)

1. Filter by `allowedArcs` (WAVES_ARC + generics with no arc restriction).
2. Filter by `isEventAvailableForPlayer` (flag gates — unused in Waves).
3. If `preferredEventIds` (from `tiedStoryEvents`) match, **weighted pick among preferred only**.
4. Else rarity-weighted full arc pool (`EVENT_RARITY_WEIGHTS`).

**Implication:** At compound, preferred pool = confrontation + defeat equally → **anti-climax possible**.

### Interlude / Victory

- **Interlude** (`campaign.ts` land_of_waves):  
  *“Gato falls. The bridge stands. Wave Country breathes again — but the road of the shinobi never ends. A sealed scroll points toward the Forest of Death…”*  
  Functional, short; not bad but not earned sensory aftermath.
- **Victory** (`Victory.tsx`): generic clan/region stats; story chips from `getEventFlagRunModifiers`.
- **Waves chips today:** only “Secret intel +5% Ryō” if ship/cove flags; **no Tazuna/Inari/bridge/Gato chips**.

### Boss / event identity clash

- Location boss: **Gato’s Compound** + events about Gato’s treasury/mercenaries.
- `BOSS_BY_ARC.WAVES_ARC[7]`: **“Zabuza & Haku”**.
- Bridge events name Zabuza/Haku; compound names Gato. **Two climaxes without spine.**

---

## Tone audit (cheesy / thin)

| Text / pattern | Problem |
|----------------|---------|
| “eternal gratitude of the family” | Cartoon reward |
| “legendary savior of Wave Country” | Fanfare, not poverty |
| “Inspire Him with Ninja Creed” | Cheesy |
| “Your muscles ache but your spirit feels lighter” | Soft self-help |
| “The Clashing of Wills” | Anime title card |
| “youre looting” | Typo / unpolished |
| Walk away → “screams in the distance that haunt you for days” | OK seed, **no lasting flag** |
| gato_defeat choices all SAFE loot/exp | No moral weight / curse / heat |

**Better direction (examples for workers):** mist that tastes of iron, unpaid bridge wages, Gato’s seal on fish crates, workers who won’t meet your eyes, cold that isn’t weather.

---

## Suggested event chain designs (no rewrite of engine)

Pattern already proven in `rogueArcEvents.ts` / `warArcEvents.ts`.

### Chain A — Tazuna (docks → labor → bridge stakes)

```
meet_tazuna
  Accept escort → setFlags{ met_tazuna:1, tazuna_escorted:1, drowned_shrine_discovered:1 }
                 → chainTo: tazuna_request  (or new tazuna_night_watch)
  Decline → excludes later “trusted by builder” choices

tazuna_request (requiresFlags: met_tazuna)
  Full shift / negotiate → setFlags{ bridge_labor:1 }
  Payoff log: unpaid wages, Gato’s tax men counting boards — not “spirit lighter”
```

**Locations:** `the_docks` preferred; optional re-tie labor to `bridge_construction` with flags.

### Chain B — Bridge mist (workers → showdown)

```
protect_bridge
  Stand guard (combat or deter) → setFlags{ bridge_held:1 }
  → chainTo: final_showdown_setup

final_showdown_setup (requiresFlags: bridge_held OR chain-only)
  Challenge / analyze / shield Tazuna
  Optional rare: grantSkillById 'hidden_mist' + hpChange or light curse
  setFlags{ mist_showdown:1 }
```

**Tone:** drop “Clashing of Wills”; open on frozen hammers, breath-fog, executioner’s blade edge.

### Chain C — Compound climax (order fix)

```
final_confrontation (compound preferred only this until flag)
  Storm / infiltrate success → setFlags{ compound_breached:1 }
  → chainTo: gato_defeat

gato_defeat (requiresFlags: compound_breached)
  Treasury / distribute / bridge commemorate
  Branch labels if inspired_inari / village_defended
```

**Critical:** remove unguarded `gato_defeat` from equal preferred weight without flags.

### Chain D — Inari (despair → echo)

```
meet_inari
  Inspire / demonstrate → setFlags{ inspired_inari:1 }
  Leave alone → no flag (hollow later)

Later (gato_defeat or new fishing_village echo):
  requiresFlags inspired_inari → villagers push with you / Inari on bridge
  Run modifier: “Inari’s hope +5% Ryō” (or calmness label only)
```

### Chain E — Drowned Shrine (curse skill)

```
drowned_shrine_rite (tied on drowned_shrine; optional requiresFlags drowned_shrine_discovered)
  Study / refuse clean → grantSkillById suijinheki|water_prison, exp
  Drink black tide → grantSkillById hidden_mist|water_clone + curse{0.4–0.5, 3}
  → chainTo: drowned_shrine_aftermath (flag-branched)

Mirror orochimaru_experiment_result structure (anti-softlock safe exit).
```

### Chain F — Worker’s child (orphan → meaning)

```
bridge_worker_plea
  Hunt → combat OR rescue → chainTo: bridge_worker_aftermath
  Walk away → setFlags{ ignored_plea:1 }
aftermath / shoreline echo later uses ignored_plea for corpse flavor or Inari hardness
```

### Run modifiers (extend `getEventFlagRunModifiers`)

| Flag | Suggested chip |
|------|----------------|
| village_defended | +5% Ryō “Village shield” |
| bridge_held | +5% DMG “Bridge watch” |
| inspired_inari | +5% Ryō or label-only “Hope kept” |
| mist_showdown | +5% DMG “Mist survivor” |
| (existing) sunken/cove | keep Secret intel |

---

## Location wiring recommendations

| Event | Prefer location |
|-------|-----------------|
| mist_ambush_cache | misty_beach, smugglers_cave |
| tazuna_request | the_docks (after met_tazuna) or bridge |
| bridge_worker_plea | bridge_construction, fishing_village |
| drowned_shrine_* | drowned_shrine |
| gato_defeat | chain-only or requiresFlags, not equal preferred |

---

## Interlude / victory elevation (copy only)

**Interlude stretch (draft):**

> The mist does not lift when Gato’s men run. It thins enough to show the bridge’s wet timber and the empty places where workers should have been. Someone nails a board where a body fell. The road out of Wave Country is open — and the scroll in your pack points toward a forest that eats genin whole.

Optional flag clause: if `inspired_inari`, one sentence of a boy standing with a spear he cannot use.

---

## Top narrative gaps (priority)

1. **No multi-scene chains** — Engine ready; Waves is flat one-shots.  
2. **`gato_defeat` can appear before the fight** — story order broken.  
3. **Boss name vs Gato compound contradiction** — dual climax without spine.  
4. **Cheesy / thin copy** — undercuts sober terror art direction.  
5. **Atmosphere is tag soup** — “Atmosphere: Tax collection” not prose.  
6. **No grantSkill / curse moments** in R1 — secrets unlock maps only, no moral power cost.  
7. **Orphan events** miss preferred pools → low story density mid-region.  
8. **Inari / Tazuna / bridge lack lasting flags** — choices don’t echo on Interlude chips.

---

## Backlog map

| ID | Title | Category | Pri |
|----|-------|----------|-----|
| R1-001 | Waves story flag spine | Feature | P1 |
| R1-002 | Gate gato_defeat order | Confuso | P1 |
| R1-003 | Multi-scene Tazuna chain | Feature | P1 |
| R1-004 | Bridge ambush chain | Feature | P1 |
| R1-005 | Inari multi-beat | Feature | P2 |
| R1-006 | Drowned Shrine curse/skill | Feature | P2 |
| R1-007 | Copy tone pass | Pulido | P1 |
| R1-008 | Atmosphere prose dictionary | Feature | P2 |
| R1-009 | Worker plea chain | Feature | P2 |
| R1-010 | Waves run-modifier chips | Feature | P2 |
| R1-011 | Interlude/Victory copy | Pulido | P2 |
| R1-012 | Align Gato vs Zabuza/Haku | Confuso | P1 |
| R1-013 | Cache heat flag pressure | Feature | P3 |
| R1-014 | Wire orphan preferred pools | Feature | P2 |
| R1-015 | Mist showdown grantSkill | Feature | P3 |

**Suggested worker order:** R1-001 → R1-002 → R1-012 → R1-003/R1-004 → R1-007 → remaining FEATURE polish.

---

## Files of record

- `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\src\game\constants\events\wavesArcEvents.ts`
- `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\src\game\constants\regions\landOfWaves.ts`
- `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\src\game\systems\EventSystem.ts`
- `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\src\game\systems\LocationSystem.ts` (`pickEventForLocation`)
- `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\src\game\systems\RegionSystem.ts` (`pickAtmosphereFlavor`)
- `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower\src\game\constants\regions\campaign.ts`
- Reference chains: `rogueArcEvents.ts`, `warArcEvents.ts`
