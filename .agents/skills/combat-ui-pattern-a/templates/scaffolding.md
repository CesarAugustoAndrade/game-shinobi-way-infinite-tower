# Quick Implementation Commands

## Create All Files (Scaffolding)

```bash
# Create directory
mkdir -p src/components/combat

# Create all component files
touch src/components/combat/{index,CombatLayout,PhaseHeader,ConfrontationZone,CharacterPanel,VSDivider,ActionDock,QuickActionCard,MainActionCard}.tsx
```

## Barrel Export Template

```typescript
// src/components/combat/index.ts
export { CombatLayout } from './CombatLayout';
export { PhaseHeader } from './PhaseHeader';
export { ConfrontationZone } from './ConfrontationZone';
export { CharacterPanel } from './CharacterPanel';
export { VSDivider } from './VSDivider';
export { ActionDock } from './ActionDock';
export { QuickActionCard } from './QuickActionCard';
export { MainActionCard } from './MainActionCard';
```
