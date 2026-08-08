# Sprint C — Content & Gods (facades)

SoC splits for location/loot “gods.” Stable import paths stay on the facades; implementations live in pure subsystems.

## LocationSystem (`src/game/systems/LocationSystem.ts`)

Facade + floor generation / intel. Re-exports:

| Subsystem | Role | Public API (via LocationSystem) |
|-----------|------|----------------------------------|
| `RoomGraphSystem` | Navigation, activities, room queries | `isRoomAccessible`, `moveToRoom`, `getCurrentActivity`, `completeActivity`, `clearRoomIfSpent`, `isFloorComplete`, `getRoomById`, `getCurrentRoom`, `getChildRooms`, `getRoomsByTier`, `getCombatSetup` |
| `TreasureHuntSystem` | Map-piece hunt | `getRequiredMapPieces`, `initializeTreasureHunt`, `addMapPiece`, `getTreasureHuntReward` |
| `FloorVisitSystem` | Visit heat / hunter arm | `applyFloorHeatDelta`, `armHunterOnFloor`, `generateHunterFromGuardian` |

Related (not re-exported through LocationSystem): `HeatSystem` (clamp/tier math), `LocationTerrainSystem`.

## LootSystem (`src/game/systems/LootSystem.ts`)

Facade only. Re-exports:

| Subsystem | Role | Public API (via LootSystem) |
|-----------|------|-----------------------------|
| `ItemGenerationSystem` | Skills, components, artifacts, merchant, loot tables | `generateSkillLoot`, `generateSkillForFloor`, `parseLootTableKind`, `equipmentFocusWeightMultipliers`, `applyLootThemeGoldMultiplier`, `generateBrokenComponent`, `generateComponent`, `generateComponentByQuality`, `generateLoot`, `generateMerchantItem`, `generateRandomArtifact`, `grantHashiramaCell` (+ type `LootTableKind`) |
| `CraftSystem` | TFT synthesis / upgrades / disassemble | `getCraftCombination`, `upgradeComponent`, `synthesize`, `upgradeArtifact`, `disassemble` (+ types `CraftResult`, `CraftMode`, `CraftCombination`) |
| `InventorySystem` | Equip / sell / bag CRUD | `equipItem`, `getSellPrice`, `sellItem`, `addToBag`, `addToBagAtIndex`, `swapBagSlots`, `removeFromBag`, `bagHasItem`, `hasBagSpace` (+ type `EquipResult`) |

## Event flags

- Data: `src/game/constants/eventFlagRunModifiers.ts` (`EVENT_FLAG_RUN_MODIFIERS`)
- Effect pipeline: `getEventFlagRunModifiers` in `EventSystem.ts`

## Config direction

- Bag size: `LaunchProperties.MAX_BAG_SIZE` → `MAX_BAG_SLOTS` in types
- Stat math tables: `STAT_FORMULAS` (types; used by `StatSystem`)

Consumers should keep importing from `LocationSystem` / `LootSystem` / `EventSystem` unless intentionally depending on a subsystem.
