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

## Out of scope for this doc

- Changing formulas in `docs/FORMULAS.md` / `CombatCalculationSystem` / `StatSystem`
- Forcing auto onto `useSkill`/`processEnemyTurn` end-to-end (listed as optional follow-up only)
- Unit tests (add only when explicitly requested)
