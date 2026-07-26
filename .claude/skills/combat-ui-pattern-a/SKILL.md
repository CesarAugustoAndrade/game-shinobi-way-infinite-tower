---
name: combat-ui-pattern-a
description: Implement Split-Panel Combat UI (Pattern A) for SHINOBI WAY game. Use when user wants to create the horizontal confrontation combat layout, character panels, action dock, phase header, VS divider, or any component from the Pattern A combat UI system. Guides through component creation following the established architecture.
---

# Combat UI Pattern A - Split-Panel Implementation

This skill guides implementation of the Split-Panel Combat UI, transforming the vertical theater mode into a horizontal confrontation layout.

## Architecture Overview

```
┌───────────────────────────────────────────────────┐
│  TURN INDICATOR  │  PHASE PIPELINE  │  MODIFIERS  │  ← PhaseHeader
├──────────────────┴───────┬───────────┴────────────┤
│                          │                        │
│     PLAYER PANEL         │     ENEMY PANEL        │  ← ConfrontationZone
│     (CharacterPanel)     │     (CharacterPanel)   │
│                          │                        │
├──────────────────────────┴────────────────────────┤
│  QUICK ACTIONS (SIDE/TOGGLE)  │   MAIN ACTIONS    │  ← ActionDock
└───────────────────────────────┴───────────────────┘
```

## Component Hierarchy & File Structure

→ See `references/architecture.md` for the full component tree and the `src/components/combat/` file layout.

## Implementation Workflow

### Step 1: Identify Target Component

Ask user which component to implement:

1. **CombatLayout** - Start here for new implementation
2. **PhaseHeader** - Top status bar
3. **ConfrontationZone** - Battle area with both panels
4. **CharacterPanel** - Individual character display
5. **VSDivider** - Center emblem and effects
6. **ActionDock** - Bottom skill bar
7. **QuickActionCard** - Compact skill card variant
8. **MainActionCard** - Large skill card variant

### Step 2: Load Component Reference

Based on selection, load the appropriate reference:

- **Layout/Structure**: See [layout-specs.md](references/layout-specs.md)
- **Component Props**: See [component-interfaces.md](references/component-interfaces.md)
- **Styling Guide**: See [styling-tokens.md](references/styling-tokens.md)
- **Animation Specs**: See [animations.md](references/animations.md)

### Step 3: Generate Component Code

Follow the component template pattern → copy from `templates/component-template.tsx`.

### Step 4: Wire to Combat.tsx

After component creation:

1. Export from `components/combat/index.ts`
2. Import in `Combat.tsx`
3. Replace corresponding section
4. Pass required props from existing state

## Quick Implementation Commands

→ See `templates/scaffolding.md` for the `mkdir`/`touch` scaffolding commands and the barrel export template.

## Props Mapping from Existing Code

→ See `references/props-mapping.md` for App.tsx→Combat.tsx props and the Combat.tsx→new-component prop wiring.

## Migration Strategy

### Phase 1: Layout Foundation
1. Create `CombatLayout.tsx` with CSS Grid
2. Create placeholder components
3. Add feature flag in Combat.tsx

### Phase 2: Component Extraction
4. Implement `CharacterPanel` (extract from PlayerHUD + CinematicViewscreen)
5. Implement `ActionDock` (extract from skill grids)
6. Implement `PhaseHeader` (extract from inline indicators)

### Phase 3: Visual Polish
7. Add `VSDivider` with effects
8. Implement animations
9. Adjust floating text positions

### Phase 4: Cleanup
10. Remove old theater mode code
11. Remove feature flag
12. Update tests

## Reference Files

- [layout-specs.md](references/layout-specs.md) - CSS Grid structure, responsive breakpoints
- [component-interfaces.md](references/component-interfaces.md) - TypeScript interfaces for all components
- [styling-tokens.md](references/styling-tokens.md) - Colors, spacing, typography tokens
- [animations.md](references/animations.md) - Animation keyframes and transitions

## Output Format

Generate TypeScript React components with:

1. **TypeScript interface** for props
2. **Tailwind CSS** for styling (matching existing codebase)
3. **Responsive classes** (mobile fallback to vertical)
4. **Memoization** where appropriate (React.memo for cards)
5. **Accessibility** attributes (aria-labels, roles)

## Existing Code References

→ See `references/props-mapping.md` (Existing Code References table) for which existing file to extract each new component from.
