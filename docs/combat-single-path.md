# Combat Single Path (Sprint B)

Contract for consolidating the three combat entry points onto one shared hit core.
Does **not** change combat math — only where the hit pipeline lives.

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
```

## Wiring status (Sprint B — done)

| Module | `checkLethalDamage` | `resolveSuccessfulHit` / shared hit | Notes |
|--------|---------------------|--------------------------------------|--------|
| **SurvivalSystem** | ✅ | n/a | Extracted from EnemyTurn |
| **SkillResolutionSystem** | n/a | ✅ | Pure hit core |
| **skillPlayability** | n/a | n/a | ✅ gates ready; UI not fully switched yet |
| **PlayerTurnSystem** | ✅ reflection lethal | ✅ pre mults + defense bonus → `resolveSuccessfulHit` | Live player hits |
| **EnemyTurnSystem** | ✅ attacks + DoT lethal | ✅ pre/post mults → `resolveSuccessfulHit` | Live enemy hits |
| **CombatSimulationService** | ✅ hits + DoT | ✅ | Auto-resolve in-run |
| **BattleSimulator** | ✅ hits + DoT | ✅ | Balance CLI path |

## Formal subset (honest gaps remaining)

Sprint B delivers a **shared hit core**, not full turn-orchestrator identity.

| Area | Live | Auto (`simulateGameCombat`) | Balance (`resolveBattle`) | Notes |
|------|------|-----------------------------|---------------------------|--------|
| Hit core | **`resolveSuccessfulHit`** | **`resolveSuccessfulHit`** | **`resolveSuccessfulHit`** | Mult *lists* still built per caller (order documented) |
| Guts / lethal | **`checkLethalDamage`** | **`checkLethalDamage`** | **`checkLethalDamage`** | Shared SurvivalSystem |
| Turn orchestration | PlayerTurn / EnemyTurn | Parallel auto loop | Parallel sim loop | Not merged end-to-end |
| Deck / hand / AP | Full T-004 | **Not full deck** (skill list select) | Mirrors deck/hand/AP | Auto is weaker formal subset |
| Playability gates | Partial (Combat.tsx / useSkill) | skillAllowedAt filters | skillAllowedAt | Prefer `skillPlayability` next |
| Effects / DoT / passives | Full live phases | Simplified ticks | Simplified ticks | Outside hit-core scope |

### Follow-ups (post Sprint B)

1. Switch Combat UI / Hand gates to `skillPlayability`.
2. Optionally drive auto-combat via `useSkill` / `processEnemyTurn` end-to-end for full parity.
3. Align mult-list construction helpers so player/enemy/sim build stacks from one factory.

**Bottom line:** Live, auto, and balance all share **Survival + SkillResolution** for connected hits and lethal. Orchestration loops remain separate; auto deck/AP remains a documented subset.

## Out of scope for this doc

- Changing formulas in `docs/FORMULAS.md` / `CombatCalculationSystem` / `StatSystem`
- Forcing auto onto `useSkill`/`processEnemyTurn` end-to-end
- Unit tests (add only when explicitly requested)
