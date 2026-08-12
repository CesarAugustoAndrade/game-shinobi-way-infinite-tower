# Component Hierarchy & File Structure

## Component Hierarchy

```
Combat.tsx (scene orchestrator)
├── CombatLayout.tsx (CSS Grid container)
│   ├── PhaseHeader.tsx (top status bar)
│   │   ├── TurnIndicator
│   │   ├── PhasePipeline
│   │   ├── SideActionCounter
│   │   └── ApproachModifier
│   │
│   ├── ConfrontationZone.tsx (battle area)
│   │   ├── CharacterPanel.tsx (player variant)
│   │   │   ├── CharacterSprite
│   │   │   ├── IdentityBar
│   │   │   ├── ResourceBars (HP/CP)
│   │   │   └── BuffBar
│   │   │
│   │   ├── VSDivider.tsx (center emblem)
│   │   │
│   │   └── CharacterPanel.tsx (enemy variant)
│   │       ├── CharacterSprite
│   │       ├── IdentityBar (name, tier, element)
│   │       ├── HealthBar
│   │       ├── DefenseStats
│   │       └── BuffBar
│   │
│   └── ActionDock.tsx (skill bar)
│       ├── QuickActionsSection
│       │   ├── QuickActionCard (SIDE skills)
│       │   └── QuickActionCard (TOGGLE skills)
│       ├── MainActionsSection
│       │   └── MainActionCard (MAIN skills)
│       └── ControlButtons (Auto, End Turn)
│
└── FloatingTextLayer (z-50, unchanged)
```

## File Structure

```
src/components/combat/
├── index.ts                  # Barrel exports
├── CombatLayout.tsx          # Grid container
├── PhaseHeader.tsx           # Top status bar
├── ConfrontationZone.tsx     # Player vs Enemy area
├── CharacterPanel.tsx        # Reusable character display
├── VSDivider.tsx             # Center VS emblem
├── ActionDock.tsx            # Bottom skill bar
├── QuickActionCard.tsx       # Compact SIDE/TOGGLE card
└── MainActionCard.tsx        # Large MAIN skill card
```
