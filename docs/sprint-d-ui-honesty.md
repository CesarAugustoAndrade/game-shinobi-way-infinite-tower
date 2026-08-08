# Sprint D — UI Honesty

Thin pure helpers so combat/merchant/bag UI and explore chrome read the same gates as systems (no silent double paths / DOM-only modal detection).

## Map

| Surface | Pure helper | Consumers |
|--------|-------------|-----------|
| Skill playability | `skillPlayability` (`canPlaySkill`, `getSkillBlockReason`) | Hand, Combat UI, AI filters |
| Skill card view-model | `combatSkillViewModel` | Hand / SkillCard |
| Merchant buy price | `getMerchantBuyPrice` (`InventorySystem` / Loot facade) | Merchant |
| Craft options | `listCraftOptions` (`CraftSystem` / Loot facade) | Bag synthesis |
| Modal shell | `ModalShell` + `useModalShellClose` (closedRef once-dismiss) | Intel, Rest, Event, LocationComplete, Reward |
| Explore chrome block | `isBlockingExploreChrome` (`game/ui/overlayStack`) | App A/I/C keyboard, HUD bag/char/approach, bag-close effect |

## Overlay stack (`src/game/ui/overlayStack.ts`)

- **`isBlockingExploreChrome(flags)`** — true when reward / event outcome / intel / rest / location-complete / approach is open. Prefer App React flags over `document.querySelector`.
- **`queryBlockingModal` / `BLOCKING_MODAL_SELECTOR`** — DOM fallback; LocationMap / RegionMap use `queryBlockingModal()`.
- **`OverlayKind` / `OverlayStackState`** — typed ids for a future ordered stack without rewriting App routing.

## ModalShell migration

| Modal | Status |
|-------|--------|
| IntelResultModal | ModalShell |
| RestResultModal | ModalShell |
| EventResultModal | ModalShell |
| LocationCompleteModal | ModalShell |
| RewardModal | ModalShell |

Shell owns dialog role, focus trap, Esc/Space/Enter, and once-guard dismiss. Visual chrome stays on each modal’s CSS classes.

## Non-goals (this sprint)

- Mass App routing rewrite
- Full ordered overlay stack React context
- Combat SEN / session store changes
