---
name: combat-system-creator
description: Create and modify combat system components for SHINOBI WAY game following the dual-system architecture (CombatCalculationSystem + CombatWorkflowSystem). Use when user wants to add new combat mechanics, damage formulas, status effects, mitigation logic, turn phases, or refactor existing combat code. Guides through proper separation of pure calculations vs state management.
---

# Combat System Creator - SHINOBI WAY

Create combat system components following the **dual-system architecture**: pure calculations separated from state workflow.

## Architecture Principle

```
Player Action → CombatCalculationSystem (pure math) → CombatWorkflowSystem (apply to state)
```

**CombatCalculationSystem**: Pure functions, no mutations, returns complete results
**CombatWorkflowSystem**: State management, applies calculated results, controls flow

## When to Use

- Add new damage calculations or formulas
- Create new status effects or mitigation mechanics
- Add new combat phases or turn logic
- Refactor existing combat code
- Balance or modify combat math

## Quick Reference

→ See `references/quick-reference.md` for the damage pipeline (5 steps), mitigation pipeline (priority order), defense formulas, and damage-property tables — open when writing damage/mitigation math.

## Workflow: Adding New Mechanics

### Step 1: Identify System

Ask: **Is this pure math or state management?**

| CombatCalculationSystem | CombatWorkflowSystem |
|------------------------|---------------------|
| Damage formulas | Applying damage to HP |
| Hit/miss/evasion rolls | Turn order management |
| Crit calculations | Buff duration tracking |
| Defense reduction | Phase transitions |
| Effect chance rolls | Combat log generation |

### Step 2: Design the Calculation Interface

For new calculations, define the result interface:

```typescript
interface NewMechanicResult {
  // All values needed to apply this mechanic
  value: number;
  triggered: boolean;
  // Metadata for logging
  logs: CombatLogEntry[];
}
```

### Step 3: Implement Pure Function

```typescript
// In CombatCalculationSystem
function calculateNewMechanic(
  attackerStats: DerivedStats,
  defenderStats: DerivedStats,
  context: CombatContext
): NewMechanicResult {
  // Pure calculation - NO state mutation
  return { value, triggered, logs };
}
```

### Step 4: Implement Workflow Application

```typescript
// In CombatWorkflowSystem
function applyNewMechanic(
  state: CombatWorkflowState,
  result: NewMechanicResult
): CombatWorkflowState {
  // Apply result to state - returns NEW state
  return { ...state, /* updated values */ };
}
```

## Creating New Status Effects

→ See `references/status-effects.md` for available effect types, the `SkillEffect` interface, and the DoT damage formula — open when adding a status effect.

## Creating New Combat Phases

→ See `references/combat-phases.md` for the existing player/enemy turn phase order and the 4-step "add a new phase" recipe — open when adding or reordering turn phases.

## Output Templates

→ See `templates/output-templates.md` for copy-paste boilerplate: new calculation function, new workflow function, and new effect implementation — open when scaffolding the actual code.

## Reference Files

- [combat-mechanics.md](references/combat-mechanics.md) - Full combat formulas and constants
- [architecture.md](references/architecture.md) - Dual-system architecture details

## Balance Constants

→ See `references/balance-constants.md` for resource-pool formulas, combat constants (hit/crit/def caps), and survival formulas (guts, status resist, evasion) — open when balancing numbers.
