# Props Mapping from Existing Code

## From App.tsx → Combat.tsx (unchanged)

```typescript
player: Player
enemy: Enemy
turnState: 'PLAYER' | 'ENEMY_TURN'
turnPhase: TurnPhaseState
combatState: CombatState
onUseSkill: (skill: Skill) => void
onPassTurn: () => void
onToggleAutoCombat: () => void
autoCombatEnabled: boolean
```

## Combat.tsx → New Components

```typescript
// PhaseHeader
turnState, turnPhase, combatState.approach

// ConfrontationZone
player, enemy, playerStats, enemyStats

// CharacterPanel (player)
character: player, stats: playerStats, variant: 'player'

// CharacterPanel (enemy)
character: enemy, stats: enemyStats, variant: 'enemy'

// ActionDock
skills: player.skills, turnPhase, onUseSkill, onPassTurn
```

## Existing Code References

When implementing, reference these existing files:

| New Component | Reference From |
|---------------|----------------|
| CharacterPanel (player) | `src/components/PlayerHUD.tsx` |
| CharacterPanel (enemy) | `src/scenes/Combat.tsx` lines 113-305 |
| ActionDock | `src/scenes/Combat.tsx` lines 308-607 |
| QuickActionCard | `src/components/SkillCard.tsx` |
| MainActionCard | `src/components/SkillCard.tsx` |
| PhaseHeader | `src/scenes/Combat.tsx` lines 311-328 |
