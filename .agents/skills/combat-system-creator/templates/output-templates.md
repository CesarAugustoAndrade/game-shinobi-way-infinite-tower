# Output Templates

### New Calculation Function

```typescript
/**
 * [Description of what this calculates]
 * @param attackerStats - Attacker's derived stats
 * @param defenderStats - Defender's derived stats
 * @param skill - The skill being used
 * @returns [ResultType] with all calculation details
 */
export function calculateX(
  attackerStats: DerivedStats,
  defenderStats: DerivedStats,
  skill: Skill
): XResult {
  const result: XResult = {
    // Initialize result object
  };

  // Pure calculations here
  // NO state mutation
  // Use Math.random() for rolls

  return result;
}
```

### New Workflow Function

```typescript
/**
 * [Description of what state changes this applies]
 * @param state - Current combat state
 * @param result - Calculation result to apply
 * @returns New combat state with changes applied
 */
export function applyX(
  state: CombatWorkflowState,
  result: XResult
): CombatWorkflowState {
  // Create new state object (immutable)
  const newState = { ...state };

  // Apply result values to state
  // Add combat logs
  // Check for combat end conditions

  return newState;
}
```

### New Effect Implementation

```typescript
// In constants/index.ts - Add to SKILLS
NEW_SKILL: {
  id: 'new_skill',
  name: 'New Skill Name',
  // ... other properties
  effects: [{
    type: EffectType.NEW_EFFECT,
    value: 10,
    duration: 3,
    chance: 0.8,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL
  }]
}

// In CombatSystem.ts - Handle in applyMitigation or processDoT
if (buff.effect.type === EffectType.NEW_EFFECT) {
  // Calculate effect
  // Apply to appropriate target
}
```
