# Creating New Combat Phases

### Existing Turn Phases

**Player Turn:**
1. TURN_START → Reset flags
2. UPKEEP → Toggle costs, passive regen
3. MAIN_ACTION → Skill execution
4. DEATH_CHECK → Victory/defeat
5. TURN_END → Mark turn complete

**Enemy Turn:**
1. DOT_ENEMY → Process enemy DoTs
2. DOT_PLAYER → Process player DoTs (through shield)
3. DEATH_CHECK_DOT → Check DoT kills
4. ENEMY_ACTION → AI skill selection + execution
5. DEATH_CHECK_ATTACK → Check combat kills
6. RESOURCE_RECOVERY → Cooldowns, chakra regen
7. TERRAIN_HAZARDS → Environmental damage
8. FINAL_DEATH_CHECK → Hazard kills

### Adding New Phase

```typescript
// 1. Add to CombatPhase enum
enum CombatPhase {
  // ... existing
  NEW_PHASE,
}

// 2. Create calculation function
function calculateNewPhaseEffects(state: CombatWorkflowState): NewPhaseResult;

// 3. Create workflow handler
function processNewPhase(state: CombatWorkflowState): CombatWorkflowState;

// 4. Insert into turn flow in processEnemyTurn or executePlayerAction
```
