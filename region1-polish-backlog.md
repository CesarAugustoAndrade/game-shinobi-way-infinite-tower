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


---

## Wave 14 — Opus 5 exploration pass (2026-07-27, agent `claude-opus5-r1`)

> Re-opened after `out-of-scope.md` stamped the R1 ceiling: this pass ran 7 independent lenses with
> adversarial (refute-by-default) verification. 13 findings survived. The four Roto items share ONE
> root cause (R1-500) that is a **live P0 regression on `develop`**, so the ceiling did not hold and
> the "blocker" exception in out-of-scope.md applies.

### R1-500 — ROOT CAUSE: claim flags written inside setState updaters are read synchronously
- **status**: done
- **category**: Roto
- **priority**: P0
- **files**: src/hooks/useActivityHandlers.ts, src/hooks/useTreasureHandlers.ts, src/hooks/useInventoryHandlers.ts, src/App.tsx
- **claimed_by**: claude-opus5-r1
- **description**: 25 sites use `let claimed = false; setX(prev => { claimed = true; ... }); if (!claimed) return;`.
  React only runs a setState updater synchronously via the eager-state bailout, which requires
  `0 === fiber.lanes && (null === alternate || 0 === alternate.lanes)` (verified in
  node_modules/react-dom/cjs/react-dom-client.development.js:9143-9146). `enqueueUpdate$1` sets
  `fiber.lanes |= lane` AND `fiber.alternate.lanes |= lane`, so ANY prior setState in the same batch
  defers every later updater. The flag stays false, the handler bails out early and skips the reward
  grant — but the queued updater still commits the consumption. Net effect: **resource consumed,
  reward never granted.** React 19.2.0 + StrictMode confirmed installed.
- **done_when**: No handler decides control flow from a variable assigned inside a setState updater;
  claim decisions come from a synchronous source (closure state or ref). tsc + full Vitest green.
- **notes**: 2026-07-27 claude-opus5-r1 — DONE. **40 sites** fixed across two variants of the same root cause. The first scan only caught the primitive form (`let claimed = false`); a second scan found 15 more in an object form (`const box: { o: Outcome } = { o: 'noprev' }`) that a type annotation before `=` had hidden. Both are now zero repo-wide (verified by scanner). The object form was the more damaging half: because the outcome always read as the failure value, handlers ran their rollback (restore the listing / un-claim the chest / release the material claim / restore the drop) **while the queued updater still applied the mutation** — i.e. duplication exploits, not just dead actions. Notable: `useLocationCards.confirmLocationComplete` never called `executeLocationComplete`, so a completed location could not be left (P0 soft-lock); `handleTreasureHuntRewardClaim` lost the entire treasure-map payout; loot equip/store/craft/upgrade/forge/unequip/disassemble/drag all rolled back while applying. Fix shape: decide from the rendered value (closure state) before the write, or hoist the updater body into a function called eagerly against `player` and commit only on success — logic preserved verbatim. Verified: tsc clean, 475/475 Vitest, production build green, and a jsdom repro on the repo's own react@19.2.0 showing buy charges once (500->490, item in bag, logged once) with three further clicks changing nothing.

### R1-501 — Merchant "Buy" is a silent no-op that deletes the listing
- **status**: done
- **category**: Roto
- **priority**: P0
- **files**: src/hooks/useActivityHandlers.ts
- **claimed_by**: claude-opus5-r1
- **description**: `setIsProcessingLoot(true)` (:216) dirties the fiber before the `setMerchantItems`
  claim updater (:226), so `stockClaimed` is ALWAYS false and the handler returns at :233. The item
  disappears from the shop; no item, no ryo charged, no message. Deterministic, not a race. From 3d55294.
- **done_when**: Buying deducts ryo, puts the item in the bag, logs the purchase, removes the listing.
- **notes**: 2026-07-27 claude-opus5-r1 — stock claim now reads the rendered `merchantItems` (added to ActivityState) instead of a flag from inside the updater. Verified with a jsdom repro on the repo's own react@19.2.0: buy charges 10 ryo (500->490), item lands in bag, listing removed, logged once; a double re-click does NOT double-charge. tsc + 475 tests green.

### R1-502 — Choosing an Interlude boon never advances to Region 2
- **status**: done
- **category**: Roto
- **priority**: P0
- **files**: src/App.tsx, src/scenes/menu/Interlude.tsx
- **claimed_by**: claude-opus5-r1
- **description**: `handleInterludeBoon` (App.tsx:762-805) reads `box.meta` / `box.healed` written inside
  setState updaters. On a warmed fiber both are null, so it returns before `applyCampaignBoon` and
  `setCampaignRegionIndex` — but the queued `setInterludeMeta` still nulls meta, so the orphan guard
  (:946) dumps the player back on the cleared Land of Waves map. Region 2 unreachable. From 3d55294.
- **done_when**: Defeating Gato then picking a boon applies the boon exactly once and enters Region 2.
- **notes**: 2026-07-27 claude-opus5-r1 — handleInterludeBoon reads `interludeMeta`/`player` from the render closure and computes `applyCampaignBoon` once outside any updater (StrictMode double-invokes updaters, so applying inside risked a double-apply). Deps updated. tsc + 475 tests green.

### R1-503 — Claiming a jutsu from the loot pile destroys the drop without learning it
- **status**: done
- **category**: Roto
- **priority**: P1
- **files**: src/App.tsx
- **claimed_by**: claude-opus5-r1
- **description**: App.tsx:1391-1400 — same root cause; returns before the learn/upgrade block at
  :1405-1437 while the queued updater nulls `droppedSkill`. Blank-LOOT recovery then closes the screen.
- **done_when**: Learn/Upgrade grants the jutsu exactly once and the pile clears normally.
- **notes**: 2026-07-27 claude-opus5-r1 — removed the dead `claimed` re-check; learnSkill already guards synchronously on the rendered `droppedSkill` at the top of the handler. Consume is now an unconditional idempotent updater. tsc + 475 tests green.

### R1-504 — Treasure chest claim marks it collected but grants nothing
- **status**: done
- **category**: Roto
- **priority**: P1
- **files**: src/hooks/useTreasureHandlers.ts
- **claimed_by**: claude-opus5-r1
- **description**: useTreasureHandlers.ts:299-308 — same root cause; never reaches the setPlayer grant
  at :315-335 while `collected: true` commits. The re-entry guard at :281 then blocks retry permanently.
  The reveal charge at :244-253 has the same shape (chest reveals free).
- **done_when**: Selecting a treasure choice grants the relic/ryo exactly once; reveal charges chakra once.
- **notes**: 2026-07-27 claude-opus5-r1 — reveal and select both already guard on the rendered currentTreasure + treasureActionLockRef; removed the broken flag re-checks so the grant path is reached. tsc + 475 tests green.

### R1-505 — Main Menu "Mission Rank" slider has zero effect on Region 1
- **status**: open
- **category**: Roto
- **priority**: P1
- **files**: src/App.tsx, src/game/systems/RegionSystem.ts, src/game/constants/regions/landOfWaves.ts
- **claimed_by**: none
- **description**: `bootstrapRegionMap` (App.tsx:637) passes `config.baseDifficulty` (hard-coded 40 at
  landOfWaves.ts:505), never the player's `difficulty` state. The Infinite path (App.tsx:720) DOES use it.
  Only treasure guardians read the slider (useTreasureHandlers.ts:398), so one run mixes two sources.
- **done_when**: The chosen rank measurably changes R1 enemy scaling, from one difficulty source.
- **notes**: Needs a balance decision — flagged for human review, deliberately NOT auto-fixed.

### R1-506 — Internal event-flag ids leak into R1 choice cards ("Requires waves_mercy")
- **status**: done
- **category**: Confuso
- **priority**: P1
- **files**: src/game/constants/events/wavesArcEvents.ts, src/scenes/activities/Event.tsx
- **claimed_by**: claude-opus5-r1
- **description**: 17 choice descriptions embed raw flag keys (lines 553, 575, 597, 619, 848, 871, 1090,
  1113, 1135, 1158, 1181, 1273, 1295, 1316, 1338, 1360, 1521), rendered verbatim at Event.tsx:319.
  Gated choices are filtered out when unmet, so the clause only ever shows to players who already
  satisfy it — debug-looking AND useless. Correct convention exists at line 825 ("Requires meeting Tazuna").
- **done_when**: No player-visible string contains a raw snake_case flag id.
- **notes**: 2026-07-27 claude-opus5-r1 — All 17 raw flag ids replaced with prose callbacks (Mercy shown in Wave, Ledger sabotaged, Bridge held, Tazuna met, ...). Written as callbacks rather than gates because EventSystem.checkEventFlags filters unmet choices, so the clause only ever renders to a player who already earned it. Scanner confirms 0 snake_case tokens left in any player-visible event string. Two replacements initially broke the build (apostrophes in "Traveler's"/"Manor's" terminated the single-quoted TS strings) — caught by tsc and rephrased.

### R1-507 — Game Guide approach requirements contradict real thresholds
- **status**: done
- **category**: Confuso
- **priority**: P1
- **files**: src/game/constants/helpText.ts, src/game/constants/approaches.ts
- **claimed_by**: claude-opus5-r1
- **description**: helpText.ts:254-260 vs approaches.ts — Silent Strike 12 vs 10, Mind Trap 15 vs 11,
  Terrain Trap 14 vs 11 and +25% vs +20% XP, Shadow Passage 35 + Body Flicker vs 28 and no skill gate.
  Iron Guard missing entirely (5 of 6 documented). Combat prints the true numbers, so it self-contradicts.
- **done_when**: Guide matches approaches.ts exactly and lists all six.
- **notes**: 2026-07-27 claude-opus5-r1 — helpText APPROACHES now matches approaches.ts exactly: Silent Strike 10 (was 12), Mind Trap 11 (was 15), Terrain Trap 11 and +20% XP (was 14 / +25%), Shadow Passage 28 with the Body Flicker gate removed (was 35 + skill). Iron Guard added — Willpower 10+, shield + WIL buff, +10% XP — so all six are documented. Confirmed no approach sets requiredSkill (it exists only in the checker).

### R1-508 — Region-map cards read "No activities" for full locations
- **status**: done
- **category**: Confuso
- **priority**: P2
- **files**: src/game/systems/RegionSystem.ts, src/components/exploration/ActivityIcons.tsx
- **claimed_by**: claude-opus5-r1
- **description**: `getLocationActivities` (RegionSystem.ts:182-201) sets only amenity flags; combat/
  event/treasure/scroll are structurally unreachable. Bandit Outpost and Sunken Ship therefore render
  "No activities" beside a "Rooms 10+" / "Story Event" footer on the primary decision screen.
- **done_when**: No real location card can read "No activities" while advertising rooms/story content.
- **notes**: 2026-07-27 claude-opus5-r1 — Empty row now reads "No amenities confirmed" instead of "No activities". getLocationActivities can only ever set merchant/rest/training/infoGathering/eliteChallenge, so the old text was simply false — every site still generates combat, treasure and events.

### R1-509 — Clipboard emoji (U+1F4CB) on every region-map card
- **status**: done
- **category**: Feo
- **priority**: P2
- **files**: src/components/exploration/ActivityIcons.tsx
- **claimed_by**: claude-opus5-r1
- **description**: Lines 40 and 52 emit `<span className="activity-icons__label">` with a clipboard emoji;
  not hidden by CSS. Only colour OS emoji left on the R1 exploration spine (missed by R1-EMOJI-PASS-2).
- **done_when**: No emoji in src/components/exploration/.
- **notes**: 2026-07-27 claude-opus5-r1 — Removed the U+1F4CB span from both branches of ActivityIcons and deleted the now-dead .activity-icons__label CSS rule. Scanner confirms the only glyphs left in src/components/exploration/ are text dingbats (U+2605/2666/2726) consistent with the pixel-arcade chrome.

### R1-510 — "You are here" badge missing on arrival at every location
- **status**: done
- **category**: Feo
- **priority**: P2
- **files**: src/game/systems/LocationSystem.ts
- **claimed_by**: claude-opus5-r1
- **description**: LocationSystem.ts:1502-1505 clears `isCurrent` when `!isFirstFloor`, while :1541 makes
  that same room current. `isFirstFloor = floor === 1` is never true in R1 (dangerToFloor yields >=14).
- **done_when**: The current room shows its badge/glow on entering any R1 location.
- **notes**: 2026-07-27 claude-opus5-r1 — LocationSystem now sets tier1Left.isCurrent = true on non-first floors (it is already that floor's currentRoomId). Previously both tier-1 rooms were cleared, and since dangerToFloor yields >= 14 no R1 floor is ever floor 1, so the badge never rendered. Accessibility and roomsVisited untouched; LocationSystem 25/25 green.

### R1-511 — [R] reveal hotkey charges chakra on Treasure Hunter chambers
- **status**: done
- **category**: Roto
- **priority**: P2
- **files**: src/scenes/rewards/TreasureChoice.tsx
- **claimed_by**: claude-opus5-r1
- **description**: TreasureChoice.tsx:200-204 — the r/R branch is not gated on `isLockedChest` while every
  other hotkey is, and the visible Unseal button only renders for locked chests. Chakra spent, nothing reveals.
- **done_when**: R is a no-op on non-locked chests and never deducts chakra.
- **notes**: 2026-07-27 claude-opus5-r1 — The r/R branch is now gated on isLockedChest, matching the visible "Unseal All [R]" button and the Space/F/D hotkeys. Pressing R on a Treasure Hunter chamber is a no-op and never deducts chakra.

### R1-512 — Handbook difficulty table contradicts Main Menu bands
- **status**: done
- **category**: Confuso
- **priority**: P2
- **files**: src/game/constants/helpText.ts, src/scenes/menu/GameGuide.tsx
- **claimed_by**: claude-opus5-r1
- **description**: helpText.ts:164-169 ships four bands (D 0-29 / C 30-59 / B 60-84 / S 85-100) but
  MainMenu.tsx:57-61 uses five (25/45/65/85) including Rank A. R1-007 fixed the menu, not the handbook.
- **done_when**: Handbook lists D/C/B/A/S matching getRank thresholds.
- **notes**: 2026-07-27 claude-opus5-r1 — DIFFICULTY_RANKS rewritten to five bands matching MainMenu.getRank (D 0-24 / C 25-44 / B 45-64 / A 65-84 / S 85-100). Added a red-500 case to getRankColorClass plus the two CSS rules, using the menu's own #ef4444 for A so the handbook and slider agree.

### R1-513 — Raw hazard enum ("CHAKRA_DRAIN hazard") on every R1 exit room
- **status**: done
- **category**: Feo
- **priority**: P2
- **files**: src/components/combat/ApproachSelector.tsx, src/game/systems/LocationTerrainSystem.ts
- **claimed_by**: claude-opus5-r1
- **description**: ApproachSelector.tsx:508 and LocationTerrainSystem.ts:307 interpolate the SCREAMING_SNAKE
  union straight into player text. Every exit room is a BOSS_GATE, so R1 exposure is near-universal.
- **done_when**: A shared label map renders hazard prose at both sites.
- **notes**: 2026-07-27 claude-opus5-r1 — Added HAZARD_LABELS + getHazardLabel to constants/terrain.ts and used it at both sites (ApproachSelector and LocationTerrainSystem), so exit rooms read "Chakra drain hazard" instead of "CHAKRA_DRAIN hazard".
