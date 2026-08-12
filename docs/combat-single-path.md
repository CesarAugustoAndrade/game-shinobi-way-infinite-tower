# Combat Single Path (Sprint B + D)

Contract for consolidating the three combat entry points onto one shared hit core,
plus Sprint D UI honesty for playability / skill-card view-models.
Does **not** change combat math — only where the hit pipeline and UI gates live.

## Three entry paths

| Path | Entry | Role |
|------|--------|------|
| **Live** | `PlayerTurnSystem.useSkill` / `EnemyTurnSystem.processEnemyTurn` | Manual combat; full deck/AP/posture, UI-driven |
| **Auto** | `CombatSimulationService.simulateGameCombat` | In-run auto-resolve when manual combat is off |
| **Balance** | `BattleSimulator.resolveBattle` | CLI / location / campaign balance sims |

`CombatWorkflowSystem` remains the barrel for live init (`createCombatState`) and re-exports of turn systems, Survival, SkillResolution, and playability.

## Sprint B goal

All three paths call the same pure hit core for connected hits and lethal survival:

1. **`SurvivalSystem.checkLethalDamage`** — guts (stat + artifact) when HP would drop to ≤ 0  
2. **`SkillResolutionSystem.resolveSuccessfulHit`** (or the staged helpers below) — post-`calculateDamage` damage stack

### Hit pipeline (intended)

After a successful damage roll (`StatSystem.calculateDamage` → not miss/evade):

```
rawDamage
  → applyDamageMultipliers(preMitigationMultipliers)
  → resolveMitigatedHit (wraps CombatCalculationSystem.applyMitigation)
  → applyPostMitigationMultipliers(postMitigationMultipliers)
  → (optional) SurvivalSystem.checkLethalDamage on defender / reflection
```

Convenience wrapper: **`resolveSuccessfulHit`**.

Suggested pre-mitigation stacks (product of mults; floor after each — see `SkillResolutionSystem` header):

- **Player → enemy:** firstHit, terrainAmp, location skill mult, `LaunchProperties.PLAYER_DAMAGE_MULTIPLIER`, postureDamageMod, stanceBonus  
  Location enemy defense uses `applyEnemyDefenseBonusToDamage` (not a pure mult).
- **Enemy → player:** `LaunchProperties.ENEMY_DAMAGE_MULTIPLIER`, ambush mult, `(1 + enemyAttackBonus)`  
  Post defender: damage reduction % then postureDefenseMod.

Playability gates for UI/AI (not part of damage math): **`skillPlayability.canPlaySkill` / `getSkillBlockReason`**.  
Skill-card damage preview / block copy: **`combatSkillViewModel`** (`previewSkillDamageForUi`, `formatSkillBlockReason`, …).

### Import surface

Prefer:

```ts
import {
  checkLethalDamage,
  resolveSuccessfulHit,
  applyDamageMultipliers,
  resolveMitigatedHit,
  canPlaySkill,
} from './CombatWorkflowSystem';
// or directly from SurvivalSystem / SkillResolutionSystem / skillPlayability
// UI preview helpers: combatSkillViewModel
```

## Wiring status (Sprint B hit core ✅ · Sprint D UI ✅)

| Module | `checkLethalDamage` | `resolveSuccessfulHit` / shared hit | Notes |
|--------|---------------------|--------------------------------------|--------|
| **SurvivalSystem** | ✅ | n/a | Extracted from EnemyTurn |
| **SkillResolutionSystem** | n/a | ✅ | Pure hit core |
| **skillPlayability** | n/a | n/a | ✅ gates; **Combat UI uses** `canPlaySkill` / `getSkillBlockReason` |
| **combatSkillViewModel** | n/a | n/a | ✅ **Hand** damage preview + block-reason formatting |
| **PlayerTurnSystem** | ✅ reflection lethal | ✅ pre mults + defense bonus → `resolveSuccessfulHit` | Live player hits |
| **EnemyTurnSystem** | ✅ attacks + DoT lethal | ✅ pre/post mults → `resolveSuccessfulHit` | Live enemy hits |
| **CombatSimulationService** | ✅ hits + DoT | ✅ | Auto-resolve in-run |
| **BattleSimulator** | ✅ hits + DoT | ✅ | Balance CLI path |

## Formal subset (honest gaps remaining)

Sprint B delivers a **shared hit core**, not full turn-orchestrator identity.  
Sprint D closes live **playability / hand preview** onto pure helpers; auto/balance still use lighter filters.

| Area | Live | Auto (`simulateGameCombat`) | Balance (`resolveBattle`) | Notes |
|------|------|-----------------------------|---------------------------|--------|
| Hit core | **`resolveSuccessfulHit`** | **`resolveSuccessfulHit`** | **`resolveSuccessfulHit`** | Mult lists via `buildPlayer/Enemy*Mults` factories where wired |
| Guts / lethal | **`checkLethalDamage`** | **`checkLethalDamage`** | **`checkLethalDamage`** | Shared SurvivalSystem (incl. hazards + sim reflection) |
| Turn orchestration | PlayerTurn / EnemyTurn | Parallel auto loop | Parallel sim loop | Not merged end-to-end |
| Deck / hand / AP | Full T-004 | **Not full deck** (skill list select) | Mirrors deck/hand/AP | **Auto remains the weaker formal subset** |
| Playability gates | **`skillPlayability`** via Combat.tsx → Hand | `skillAllowedAt` (+ local filters) | `skillAllowedAt` / AI select | Live UI switched; sims keep range/skillAllowedAt |
| Skill card preview | **`combatSkillViewModel`** | n/a | n/a | Hand only |
| Effects / DoT / passives | Full live phases | Simplified ticks | Simplified ticks | Outside hit-core scope |

### Adjacent residuals (not combat-hit-core, still open)

| Residual | Status |
|----------|--------|
| **Auto deck subset** | Auto combat still selects from a skill list rather than full live draw/hand/AP economy. Documented formal gap above. |
| **VisitContext** | Treasure / scroll / event / elite / approach / victory / merchant / training use VisitContext single-floor. App still dual-*holds* floors in state (legacy); rest/infoGather may still complete via room-enter path. |
| **RoomGraph cycle** | **Fixed.** `RoomGraphSystem.moveToRoom` is pure graph; `LocationSystem.moveToRoom` wraps graph + `ensureGrandchildrenExist`. One-way: Location → RoomGraph. |

### Follow-ups (remaining)

1. ~~Switch Combat UI / Hand gates to `skillPlayability`.~~ **Done (Sprint D).**
2. Optionally drive auto-combat via `useSkill` / `processEnemyTurn` end-to-end for full deck/AP parity.
3. ~~Mult-list factory.~~ **Done** (`buildPlayerPreMitigationMults` / `buildEnemyPreMitigationMults` / `buildPlayerDefensePostMults`); wire remaining sim callers optionally.
4. ~~Break RoomGraph ↔ Location cycle.~~ **Done.** VisitContext residual: rest/infoGather enter-complete only.

**Bottom line:** Live, auto, and balance all share **Survival + SkillResolution** for connected hits and lethal (incl. hazard/sim reflection guts). Live Combat/Hand share **skillPlayability + combatSkillViewModel**. Orchestration loops remain separate; **auto deck/AP remains a documented subset**.

## Next convergence steps (integration readiness)

Prioritized file-level checklist to move **auto** (`CombatSimulationService.simulateGameCombat`) and **balance** (`BattleSimulator.resolveBattle`) onto the live command/turn path (`PlayerTurnSystem` / `EnemyTurnSystem` / `CombatState`), without inventing new public APIs. Hit core is already shared; this is orchestration + formal subset.

### P0 — close known mult / factory drift (same hit core, fewer hand-rolled stacks)

1. **`src/game/systems/CombatSimulationService.ts` — `executeAttack`**  
   Replace the local `preMitigationMultipliers` / `postMitigationMultipliers` push lists with the existing factories re-exported from `CombatWorkflowSystem` / defined in `SkillResolutionSystem`: `buildPlayerPreMitigationMults`, `buildEnemyPreMitigationMults`, `buildPlayerDefensePostMults`. Keep `resolveSuccessfulHit` / `checkLethalDamage` as today. Align enemy-defense location handling with live: live uses `applyEnemyDefenseBonusToDamage` mid-stack in `PlayerTurnSystem.useSkill`; auto currently folds `enemyDefenseBonus` into the pre-mult list — pick the live helper when rewiring so order matches `PlayerTurnSystem`.

2. **`src/simulation/BattleSimulator.ts` — `executeSkill`**  
   Same factory swap as auto. Balance currently stacks terrain amp, `LaunchProperties.*`, first-hit, and `postureDamageMod` / `postureDefenseMod` by hand and **does not** pass `locationTerrainMods` (auto’s `SimulationContext` does). Either thread an optional location-mods field into `BattleContext` / `resolveBattle` callers (`LocationSimulator`, `CampaignSimulator`) or document intentional 1v1 omission — do not leave silent drift.

3. **`src/simulation/BattleSimulator.ts` — FREE_FIRST / combat-start flags**  
   Live + auto honor `processPassivesOnCombatStart(...).skipFirstSkillCost` (`CombatState.skipFirstSkillCost` / `SimulationContext.skipFirstSkillCost`). `resolveBattle` already calls `processPassivesOnCombatStart` but never stores or spends that flag in `executeSkill`. Wire the returned flag onto `BattleContext` and waive chakra on the first accepted player skill the same way `PlayerTurnSystem.useSkill` / auto do.

### P1 — auto formal subset: deck / hand / AP / posture

4. **`src/game/systems/CombatSimulationService.ts` — player economy**  
   Auto is still the weaker subset: `selectSkill` over `player.skills` (CD/chakra/HP/`skillAllowedAt` only), no deck/hand/AP/posture. Mirror what balance already does in `BattleSimulator.executePlayerTurn`:
   - `buildDeck` / `drawNewTurnHand` from `DeckSystem` (also re-exported by `CombatWorkflowSystem`)
   - `getApCost` from `combatCards`, posture open from approach (live/balance: successful `STEALTH_AMBUSH` → `Posture.AGGRESSIVE`)
   - Prefer calling **`processUpkeep`** (`PlayerTurnSystem`) with a real **`CombatState`** (`createCombatState` + fields live already sets in `useCombat.startCombat`) instead of re-copying toggle-upkeep + hand draw (balance’s `executePlayerTurn` still duplicates toggle upkeep today).

5. **`src/simulation/SkillSelectionAI.ts` + auto `selectSkill`**  
   Gate candidates with **`canPlaySkill` / `getSkillBlockReason`** (`skillPlayability`) by building a `SkillPlayContext` from current chakra/HP/AP/range/buffs/`skipFirstSkillCost`. Keep `selectBestCard` scoring; replace parallel local CD/chakra/HP/`skillAllowedAt` filters so AI and live UI share one gate surface (Sprint D already did this for `Combat.tsx` / `Hand`).

6. **`src/game/systems/CombatSimulationService.ts` — enemy action**  
   Stop using the shared `selectSkill` list heuristic for enemies. Call **`planEnemyAction`** (`EnemyAISystem`) the way `BattleSimulator.executeEnemyTurn` and live `EnemyTurnSystem` / `executeEnemyAction` already do (move via `shiftRange`, then skill or Guard; never fire OOR).

### P2 — command path: call live turn functions instead of parallel hit loops

7. **Player command path**  
   After auto has a `CombatState` with hand/AP (P1), resolve player cards through **`PlayerTurnSystem.useSkill(player, playerStats, enemy, enemyStats, skill, combatState)`** rather than `executeAttack(..., true)`. AP spend, hand→discard, and `stanceShiftFromSkill` stay in the orchestrator the same way `useCombat.useSkill` does today (those bookkeeping steps are in the hook, not inside `useSkill`). Balance’s `executePlayerTurn` should eventually do the same: `selectBestCard` → `useSkill` → apply `CombatResult` + update hand/AP/posture on `CombatState` / `BattleContext`.

8. **Enemy full turn path**  
   Replace auto/balance parallel enemy tick+attack with **`processEnemyTurn(...)`** (or at least **`executeEnemyAction`** for the action phase if DoT/hazard phases stay separate). That reuses live DoT order, deferred defensive buffs, terrain hazards (`applyTerrainHazardsPhase`), post-turn chakra/cooldowns, and guts via `EnemyTurnSystem` instead of local `processBuffEffects` / regen / CD loops in each sim.

9. **Optional thin headless driver (no new math)**  
   Extract a pure, non-React loop that sequences what `useCombat` already calls: `createCombatState` + approach/room seeding → per round `processUpkeep` → N× (`canPlaySkill` / AI pick → `useSkill`) → `processEnemyTurn`, reading HP/chakra from returned results. Point `simulateGameCombat` and `resolveBattle` at that driver; leave `useCombat` as the React adapter (timers, locks, floating text, `setGameState`). Prefer a module next to the turn systems (e.g. under `src/game/systems/`) only if extraction is necessary — do not fork a fourth damage pipeline.

### P3 — open-encounter parity helpers (shared setup, not hit math)

10. **Combat open** — Live seeds via `useCombat.startCombat` (`createCombatState`, `resolveInitialRange`, `applyRoomCombatModifiers`, `determineTurnOrder`, `processPassivesOnCombatStart`, deck build, posture). Auto and balance each re-implement large slices inside `simulateGameCombat` / `resolveBattle`. Collapse duplicated open steps onto the same helpers already used live (`createCombatState`, `applyRoomCombatModifiers`, `resolveInitialRange`, `determineTurnOrder`, `processPassivesOnCombatStart`, `buildDeck`) without changing `docs/FORMULAS.md` math.

11. **`src/simulation/simulatorUtils.ts` — `prepareForCombat`**  
   Already mirrors live encounter hygiene for attrition sims. Keep as the pre-`resolveBattle` player scrub; ensure any headless driver (P2) still resets cooldowns/toggles the same way `useCombat.startCombat` does.

### Explicit non-goals (until requested)

- Changing `CombatCalculationSystem` / `StatSystem` formulas or `docs/FORMULAS.md`
- Merging React `useCombat` UI locks/timers into sims
- Unit tests unless explicitly requested
- Inventing a second playability API beyond `skillPlayability` / `CombatState` fields already on the live path

**Suggested order:** P0 factories + FREE_FIRST → P1 auto deck/AP + `planEnemyAction` + `canPlaySkill` in AI → P2 `useSkill` / `processEnemyTurn` in both loops → P3 open-encounter DRY. After P2, auto ceases to be the weaker formal subset for deck/AP; remaining gaps should be call-site omissions only.

## Out of scope for this doc

- Changing formulas in `docs/FORMULAS.md` / `CombatCalculationSystem` / `StatSystem`
- Forcing auto onto `useSkill`/`processEnemyTurn` end-to-end (listed as optional follow-up only; see **Next convergence steps** for the staged path)
- Unit tests (add only when explicitly requested)
