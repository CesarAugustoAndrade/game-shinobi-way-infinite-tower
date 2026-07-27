# Region 1 Polish Backlog (Swarm Shared)

> **Coordinación:** Este archivo es el backlog compartido entre agentes (agy + Grok swarm).
> Reclama tareas marcando `claimed_by` con tu agent ID. Nunca edites una tarea claimed por otro.
> Prioridad: **Roto > Confuso > Feo > Fricción > Pulido > Feature/Asset**.

## Formato de tarea

```md
### R1-XXX — título corto
- **status**: open | claimed | done | blocked
- **category**: Roto | Confuso | Feo | Fricción | Pulido | Feature | Asset
- **priority**: P0 | P1 | P2 | P3
- **files**: path1, path2
- **claimed_by**: none | agent-id
- **description**: ...
- **done_when**: ...
- **notes**: (al completar: qué se hizo + cómo se verificó)
```

## Meta

| Campo | Valor |
|-------|-------|
| Created | 2026-07-22 |
| Swarm lead (Grok) | grok-lead |
| Peer orchestrator (agy) | orchestrator en `.agents/orchestrator/` |
| Max concurrent agents | 16 |
| Aspect target | 16:9 |
| Art direction | Terror sobrio / seinen-sublime / Land of Waves mist |

## Tasks

<!-- Explorers y workers rellenan debajo. IDs: R1-001, R1-002, ... -->

### R1-000 — Seed: inventariar journey Región 1
- **status**: done
- **category**: Pulido
- **priority**: P0
- **files**: src/App.tsx, src/game/systems/RegionSystem.ts, src/scenes/*
- **claimed_by**: grok-lead
- **description**: Mapear flujo menú → char select → region map → location → rooms → combat/events → boss → región 2. Identificar huecos de assets, UX y narrativa.
- **done_when**: Lista de hallazgos priorizados en este backlog + out-of-scope.md actualizado.
- **notes**: 2026-07-22 - Journey inventory completed, all 42 Region 1 polish tasks completed and verified via tsc + Vitest.

### R1-400 — Painted enemy portraits (partial Wave arc)
- **status**: done
- **category**: Asset
- **priority**: P1
- **files**: public/assets/enemy_missing_nin.png, enemy_hired_assassin.png, enemy_bridge_saboteur.png, enemy_gato.png (+ cutouts)
- **claimed_by**: W5-integrate
- **description**: Lead-installed painted PNGs for key Wave Country pool enemies (missing nin, hired assassin, bridge saboteur, gato) with transparent cutouts for combat stage.
- **done_when**: Files on disk under public/assets; cutouts named enemy_cut_<id>.png matching Combat.tsx rewrite.
- **notes**: Partial — only 4 painted + shared assassin alias. mist_ninja PNG present but not cutout-wired (no enemy_cut_mist_ninja.png). Remaining pool still on exhausted_shinobi — see W5-integrate report.

### R1-407 — Wire enemyArtManifest to painted pool paths
- **status**: done
- **category**: Asset
- **priority**: P1
- **files**: src/game/constants/enemyArtManifest.ts
- **claimed_by**: W5-integrate
- **description**: Point pool_missing_nin, pool_hired_assassin, pool_bridge_saboteur, pool_assassin, pool_gato at /assets/enemy_*.png so Combat cutout rewrite works. Alias pool_guard_dog → war_dog.jpg.
- **done_when**: Manifest src/quality updated; ART_REGISTRY rebuilds from ENEMY_ART_MANIFEST; tsc clean.
- **notes**: 2026-07-22 W5-integrate — 6 pool entries updated. Cutout path: replace `/assets/enemy_` → `/assets/enemy_cut_`. Report: `.agents/swarm-grok/reports/W5-integrate.md`.

### R1-401 — Diversity remap enemy pool art (no new images)
- **status**: done
- **category**: Asset
- **priority**: P1
- **files**: src/game/constants/enemyArtManifest.ts
- **claimed_by**: A3-enemy
- **description**: Remap remaining pool entries off shared exhausted_shinobi onto diverse existing painted PNGs (samurai, monk, puppeteer, dock_worker, sea_spirit, missing_nin, etc.) and thematic icons (war_dog, ghosts, spirits). Prefer painted cutouts for combat. Preserve W5 gato/assassin/saboteur/missing_nin/guard_dog mappings.
- **done_when**: Pool exhausted_shinobi usage ≤ intentional ragged set; mapping table in report; W5 paths intact.
- **notes**: 2026-07-22 A3-enemy — pool on exhausted_shinobi 24→4 (forest_bandit, village_thug, camp_raider, desperate_traveler). 10 painted faces in pool. Report: `.agents/swarm-grok/reports/A3-remap.md`.

### R1-REST-FIX / R1-004 — Rest modal close never returns to map
- **status**: done
- **category**: Roto
- **priority**: P1
- **files**: src/App.tsx, src/hooks/useActivityHandler.ts, src/hooks/useExploration.ts
- **claimed_by**: W1-fix
- **description**: Rest heals + completeActivity + RestResultModal, but onClose only cleared `restResult` — no `returnToMap` / `returnToMapActivityComplete`. Multi-activity chain stall and exit-room rest never fired location complete.
- **done_when**: Rest modal Continue/Enter/Escape calls return path that chains next activity or completes floor when exit cleared.
- **notes**: 2026-07-22 W1-fix — `RestResultModal` onClose now `setRestResult(null)` then `returnToMap()` (uses fresh `locationFloor` after `completeActivity`; chains via `getCurrentActivity` + `isFloorComplete`). Same pattern applied to intel modal. Verified by code path review + `npx tsc --noEmit`. Report: `.agents/swarm-grok/reports/W1-fix.md`.

### R1-BG-PUBLIC / R1-001 / R1-002 — Public map + combat backgrounds
- **status**: done
- **category**: Asset
- **priority**: P0
- **files**: public/assets/background_map_exploring.png, public/assets/background_exploration_combat.png, src/components/exploration/LocationMap.tsx, src/App.css
- **claimed_by**: W1-fix
- **description**: LocationMap and App.css reference `/assets/background_map_exploring.png` and `/assets/background_exploration_combat.png` which must live under `public/assets/` for Vite dev/prod.
- **done_when**: Both files exist under public/assets/; code paths match; no wrong-path references.
- **notes**: 2026-07-22 W1-fix — Files present (lead copy). Code already uses `/assets/...` (Vite public root) — no path fix needed. Verified on disk + grep. Report: `.agents/swarm-grok/reports/W1-fix.md`.

### R1-003 — Merchant/Rest/Training card honesty (UI soft fix)
- **status**: done
- **category**: Confuso
- **priority**: P1
- **files**: src/game/systems/RegionSystem.ts, src/components/exploration/ActivityIcons.tsx, src/components/exploration/LocationCard.tsx
- **claimed_by**: W1-fix
- **description**: Location flags drive card chips / special feature text as if guaranteed; room gen is weighted-random and ignores flags for merchant/rest/training.
- **done_when**: UI does not promise guaranteed merchant/rest/training; generation rewrite deferred (R1-012).
- **notes**: 2026-07-22 W1-fix — Soft honesty only: special feature → "May have Merchant/Training/Rest"; flag activities status `'special'` with tooltip "May have …"; legacy LocationCard chips titled "May have …". No generation architecture change.

---

## Completed

- **R1-REST-FIX / R1-004** (Rest modal close → returnToMap): chain + floor complete on RestResultModal close. **W1-fix**
- **R1-BG-PUBLIC / R1-001 / R1-002** (Public backgrounds): files on disk; code paths already correct. **W1-fix**
- **R1-003** (Card activity honesty): "May have …" wording + special status on flag chips. **W1-fix**
- **R1-401** (Enemy pool diversity remap): Spread Wave pool off exhausted_shinobi (24→4 intentional); preserved W5 gato/assassin. **A3-enemy**
- **R1-400** (Painted enemy portraits partial): missing_nin, hired_assassin, bridge_saboteur, gato PNGs + cutouts on disk. **W5-integrate** (assets from lead)
- **R1-407** (enemyArtManifest integrate): 6 pool entries → painted PNG / war_dog alias; cutout rewrite verified. **W5-integrate**
- **R1-020** (MainMenu / CharacterSelect CTAs): Begin Journey CTA, difficulty hint, Uzumaki beginner tip. **W2-ux**
- **R1-021** (Region map entry): Auto-select first card, Select a Card First / Enter Location, coach copy. **W2-ux**
- **R1-022** (In-location first room): Auto-select current room, You are here badge, Enter Room + keyboard strip. **W2-ux**
- **R1-023** (Walk Away feedback): Narrative outcome chips, tone-aware empty result, Waves Walk Away copy. **W2-ux**
- **R1-024** (helpText FIRST_RUN): Handbook First Steps + GameGuide section. **W2-ux**
- **TASK-R06** (Region Progress Overflow): Capped progress percentage at 100% using `Math.min(100, Math.round(...))` across `RegionSystem.ts`, `RegionMap.tsx`, and `LocationCompleteModal.tsx`. Claimed and completed by `worker_roto_systems`.
- **TASK-R07** (Event Combat Difficulty Scaling): Scaled event combat difficulty relative to base region difficulty (`currentBaseDifficulty + (combatConfig.difficulty || 0)`) in `useActivityHandlers.ts`. Claimed and completed by `worker_roto_systems`.
- **TASK-R08** (Event Danger Floor Falsy Check): Handled explicit `undefined`/`null` check for `combatConfig.floor` in `useActivityHandlers.ts`. Claimed and completed by `worker_roto_systems`.
- **TASK-R11** (Medical Jutsu Healing Stat Scaling): Dynamically scaled `HEAL` effect using player Intelligence/Spirit stats (`statMult = Math.max(1, (int + spirit) / 20)`) in `PlayerTurnSystem.ts`. Claimed and completed by `worker_roto_systems`.
- **TASK-R13** (Zabuza Boss Skill Kit Rebalance): Rebalanced Zabuza Danger 4 boss kit in `index.ts` and `EnemySystem.ts` with high-threat damaging jutsu (`Water Dragon`, `Demon Slash`) alongside utility skills. Claimed and completed by `worker_roto_systems`.

## Swarm Wave 1 summary (grok-lead 2026-07-22)

### Done (high impact)
- R1-200 lamina mid/fg wired (W3) + assets installed (lead)
- R1-REST-FIX rest/intel modal → returnToMap (W1 + lead)
- R1-BG-PUBLIC backgrounds in public/assets
- R1-020–024 UX first-run CTAs (W2)
- R1-301–303 narrative chains/flags sober tone (W4)
- R1-400/401/407 enemy art diversity + painted portraits (W5, A3, lead)
- Story event plates wired in eventArtManifest (lead)

### Open next
- R1-012 merchant/rest rooms from flags (generation)
- R1-201 hero cutouts
- Remaining unique enemy faces (ASSET-QUEUE-enemies.md)
- First-run interlude/coach after clan select (beyond log line)
- agy peer explorers may still add tasks — re-triage backlog


### R1-012 — Guarantee merchant/rest/training from location flags
- **status**: done
- **category**: Confuso
- **priority**: P1
- **files**: src/game/systems/LocationSystem.ts, RegionSystem.ts, LocationCard.tsx
- **claimed_by**: grok-lead-loop
- **description**: Flags promised amenities without room gen guarantee.
- **done_when**: Floors from locationToBranchingFloor inject missing merchant/rest/training; UI wording is definitive.
- **notes**: 2026-07-22 loop tick ensureLocationFlagActivities + boss story event inject; tsc + LocationSystem 25/25.

### R1-FIRST-RUN-COACH
- **status**: done
- **category**: Confuso
- **priority**: P1
- **files**: src/App.tsx
- **claimed_by**: grok-lead-loop
- **description**: After clan select only a thin log line; new players need next-step coach.
- **done_when**: Clear post-start log with card → enter → Gato path.
- **notes**: addLog first steps after bootstrapRegionMap.


### R1-009 — LocationMap title is biome not place name
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: locationName prop + biome subtitle; exploration.css

### R1-013 — Story events need lucky event roll
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: ensureStoryEvent for any location with tiedStoryEvents

### R1-201 — Hero cutouts
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: hero_*/hero_cut_* for 5 clans; Combat uses clanArtKey slug

### R1-010 — Atmosphere flavor prose
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: ATMOSPHERE_PROSE map for Waves tags (sober terror)


### R1-016 — Path-unlock secrets set discovery eventFlags
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: unlockedRequirements from discoverSecretsFromCompletedLocation → player.eventFlags; dry-run + execute paths

### R1-002 — CharacterSelect back to menu
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: onBack + Esc/Backspace + Mission Brief button

### R1-INTERLUDE-EMOJI — Summary chips
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: text labels Ryo/Sites/Regions instead of emoji


### R1-STAGE-DARK — Combat stage too dark
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: bg opacity 0.42→0.62, softer vignette, image-rendering auto on laminas

### R1-003 — Clan card full click
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: card role=button + keyboard; CTA still works

### R1-008 — helpText activities list
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: remove duplicate Scroll Discovery; add Info Gathering

### R1-007 — Difficulty ranks skip A
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: D/C/B/A/S bands

### R1-ENEMY-REMAP2 — more pool diversity
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: forest_bandit/village_thug/camp_raider off exhausted


### R1-MAGENTA-LEAK — Combat stage solid pink blob
- **status**: done
- **category**: Roto
- **priority**: P0
- **files**: public/assets/lamina_*.png, hero_cut_*, enemy_cut_*
- **claimed_by**: grok-lead
- **description**: Mid/fg laminas kept hot-pink chroma with high alpha (mid center ~alpha 232) → solid magenta covering battle stage.
- **done_when**: Laminas have transparent sky/center; no residual pink samples; hard refresh shows biome without magenta slab.
- **notes**: Aggressive chroma nuke on all lamina + cutout PNGs. residual pink samples = 0.


### R1-LAMINA-CACHE + stage balance
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: resolveLaminaPaths ?v=r1chroma3; mid opacity 0.78; fg 0.88; scanlines softer

### R1-APPROACH-PORTRAIT
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: ApproachSelector header shows enemy.image thumbnail


### R1-004 — Clan card role + weakness on surface
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: HELP_TEXT.CLANS role/weakness on CharacterSelect cards

### R1-STUN-FEO — stun banner emoji
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: STUNNED text only

### R1-MINILOG-OVERLAP
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: mini-log narrower + z-index 22 under enemy panel

### R1-HERO-OFF — No left-stage player sprite
- **status**: done
- **notes**: Combat no longer passes heroImage/heroCutout; enemy recentered

### R1-017 — Interlude boon.kind raw strings
- **status**: done
- **notes**: Item/Jutsu/Stat labels; stat glyphs WIL/STR etc.

### R1-ELITE-CTA — Elite challenge button clarity
- **status**: done
- **notes**: Fight F / Escape E on button titles


### R1-0-DMG-LOG — Utility skills log \"for 0 dmg\"
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: PlayerTurnSystem uses \"Used X\" when damage is 0; skips crit/resist noise

### R1-DIFF-HINT — Main menu rank hints out of sync
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: Hints align with D/C/B/A/S bands

### R1-TG-ART — Treasure Guardian sprite
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: Force enemy_monk painted path when pool gave icon-only


### R1-ENEMY-NAMES — Pool ids look mechanical
- **status**: done
- **claimed_by**: grok-lead-loop
- **notes**: POOL_DISPLAY_NAMES (Gato's Enforcer, Mist Assassin, …)

### R1-INTENT-LOG — Enemy prepares wording
- **status**: done
- **notes**: \"readies X next...\"

### R1-PANEL-GLASS — Enemy panel washout
- **status**: done
- **notes**: --cb-panel-bg 0.90

### R1-REGION-GOAL-TIP
- **status**: done
- **notes**: first-run tip toward Gato Compound on region map


### R1-BOSS-GATE-UI — Compound unlock unclear
- **status**: done
- **notes**: Region map shows 75% boss gate progress / open state

### R1-LOW-INTEL-SLOT — \"No card\" placeholders
- **status**: done
- **notes**: Low intel label + tooltip

### R1-HAND-BLOCK-REASON
- **status**: done
- **notes**: SkillCard title explains AP/chakra/silence/stun when greyed


### R1-LOC-ART-KEY — Location complete wrong/mystery art
- **status**: done
- **notes**: resolveLocationArtKey strips runtime location- config-timestamp suffix

### R1-BOSS-CLEAR-CTA
- **status**: done
- **notes**: Boss clear Continue the journey; tag Region Boss Defeated

### R1-GAMEOVER-COPY
- **status**: done
- **notes**: Fallen + short recovery tip


### R1-WAVES-INTERLUDE — Soberer post-Gato copy
- **status**: done
- **notes**: Mist Lifts, Road Remains body rewrite

### R1-LOOT-CONTINUE — Leave All when empty confuses
- **status**: done
- **notes**: Continue when remainingCount=0

### R1-MERCHANT-ESC — Esc should leave shop
- **status**: done
- **notes**: toast → deselect → onLeave

### R1-REST-CTA
- **status**: done
- **notes**: Continue exploring + Enter


### R1-SCROLL-LEAVE — Leave Scrolls unclear
- **status**: done
- **notes**: Leave without learning + Esc keybinding

### R1-TRAIN-LEAVE
- **status**: done
- **notes**: Leave training + Esc

### R1-EVENT-CHAIN-COPY
- **status**: done
- **notes**: Story continues ribbon; clearer hidden-path note

### R1-INTEL-CTA
- **status**: done
- **notes**: Continue exploring parity with rest


### R1-EVENT-RESULT-CHAIN
- **status**: done
- **notes**: Story continues ribbon without emoji chain glyph

### R1-OUTCOME-ICONS
- **status**: done
- **notes**: WHAT CHANGED icons as HP/CP/RY text codes

### R1-VICTORY-COPY
- **status**: done
- **notes**: Region Path Ends Here / Wave Country behind you


### R1-EMOJI-PASS-2 — Residual emoji in R1 surfaces
- **status**: done
- **notes**: Stun STUNNED; location map IN/exit copy; LocationCard text chips; treasure titles; sheet header; floating BLK


### R1-COMBAT-IP-ICONS
- **status**: done
- **notes**: PHYS/ELEM/MND icons as P/E/M; target T

### R1-REEXPLORE-TICK16
- **status**: done
- **notes**: Core system tests 110+; laminas clean; residual emoji pass on combat IP


### R1-BAG-COUNT — Bag fullness invisible in explore
- **status**: done
- **notes**: HUD bag shows used/max + warn when full

### R1-AUTOEND-WHISPER
- **status**: done
- **notes**: SPACE end turn · TAB auto-end (pass only)

### R1-BAGFULL-ABANDON
- **status**: done
- **notes**: Treasure bag-full Leave → Abandon


### R1-ROOM-ACT-TOOLTIP
- **status**: done
- **notes**: RoomCard activity icons have title/aria-label

### R1-CHANGELOG-SYNC
- **status**: done
- **notes**: Unreleased section updated for swarm polish (amenities guaranteed)


### R1-ROOM-LOCK-TITLE
- **status**: done
- **notes**: Locked/current/exit room card titles

### R1-REWARD-ENTER
- **status**: done
- **notes**: Reward modal Enter/Space shortcut chips; Level Up tone

### R1-ACTIVITY-WRAP-CSS
- **status**: done
- **notes**: room-card__activity-wrap for tooltip hover


### R1-DANGER-BADGE — Enemy panel shows Lv as danger
- **status**: done
- **notes**: Badge reads Danger N with tooltip (1-7 scale)

### R1-GATO-CLIMAX — Compound boss was Zabuza duo
- **status**: done
- **notes**: WAVES_ARC danger 7 boss Gato + art registry + STRONG_FIST kit

