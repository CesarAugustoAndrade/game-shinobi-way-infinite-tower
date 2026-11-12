# Keyboard Shortcuts Audit & Implementation Plan (In-Flow Game Choices)

## Goal
Conduct a comprehensive audit of all keyboard shortcuts across the core game flow (excluding inventory) in *Shinobi Way: Infinite Tower*. Ensure that **every** choice/decision screen in the main gameplay loop has functional, intuitive, and clearly indicated keyboard shortcuts with zero conflicts.

---

## Findings & Gap Analysis

| Game Scene / Component | Current Keyboard Shortcuts | Audit Verdict & Identified Gaps | Proposed Action |
|---|---|---|---|
| **MainMenu** (`src/scenes/menu/MainMenu.tsx`) | `Enter` (Start), `I` (Infinite Ascent) | **Gap:** Missing shortcut for "Shinobi Handbook" (Guide). | Add `H` / `G` shortcut for Shinobi Handbook + UI shortcut badge. |
| **CharacterSelect** (`src/scenes/menu/CharacterSelect.tsx`) | `1..5` (Select Clan), `Esc`/`Backspace` (Back) | **Pass:** Clear visual hints (`[1]–[5]`, `[Esc]`). | No changes needed. |
| **RegionMap** (`src/components/exploration/RegionMap.tsx`) | `1..3` (Select Location), `Space`/`Enter` (Deploy) | **Pass:** Handled via `keydown` capture. | No changes needed. |
| **LocationMap** (`src/components/exploration/LocationMap.tsx`) | `1..4` (Select Path/Room), `Space`/`Enter` (Enter / Return to Region) | **Minor Gap:** When floor is complete, `Esc` does not trigger "Return to Region". | Add `Esc` to trigger `onLeaveLocation` when location is complete + UI hint. |
| **ApproachSelector** (`src/components/combat/ApproachSelector.tsx`) | `1..6`, `A`,`S`,`D`,`Z`,`X`,`C` (Select Approach), `Esc` (Retreat) | **Pass:** Comprehensive shortcuts and badges. | No changes needed. |
| **Combat** (`src/scenes/combat/Combat.tsx`) | `Space` (End Turn), `Tab` (Auto-pass), `A`/`S` (Range), `D`/`F`/`G` (Posture), `Z`/`X`/`C`/`V` (Hand Slots 0..3) | **Gap:** Digit keys `1..4` / `1..5` are not mapped to hand slots (players expect `1..4` in addition to `Z`/`X`/`C`/`V`). | Map `1..4` (and Numpad `1..4`) as aliases for hand card slots 0..3. |
| **EliteChallenge** (`src/scenes/combat/EliteChallenge.tsx`) | `F` (Fight), `E` (Escape) | **Gap:** Missing numeric (`1`/`2`), `Enter` (Fight), and `Esc` (Escape) support. | Support `1` / `Enter` for Fight, `2` / `Esc` for Escape + UI shortcut badges. |
| **Event** (`src/scenes/activities/Event.tsx`) | `1..9` (Focus choice), `Arrows` (Nav), `Enter` (Confirm), `Esc` (Clear) | **Gap:** Pressing `1..9` toggles selection state instead of executing choice or supporting double-press. | Allow double-press on digit key or `Enter` to confirm choice directly. |
| **Merchant** (`src/scenes/activities/Merchant.tsx`) | `Esc` (Close toast / selection / leave) | **CRITICAL GAP:** Zero shortcuts for selecting shop items (`1..6`), buying selected item (`Enter`/`B`), rerolling stock (`R`), expanding slots (`U`), or leaving shop (`L`). | Add full shortcut listener: `1..6` for stock items, `Enter`/`B` to buy, `R` to reroll, `U` to expand slots, `L` to leave. Add shortcut badges in UI. |
| **Training** (`src/scenes/activities/Training.tsx`) | `1..6` / `A,S,D,Z,X,C` (Select option), `Enter` (Confirm), `Esc` (Skip/Back) | **Pass:** Good shortcut coverage. | Ensure double-press or `Enter` confirms selected option cleanly. |
| **Loot** (`src/scenes/rewards/Loot.tsx`) | `KeyZ` (Equip 1st spoil), `KeyX` (Store 1st spoil), `Space`/`Enter` (Claim/Leave), `Esc` (Cancel leave) | **Pass:** Core flow covered. | Verify `1..N` item interaction if multiple spoils exist. |
| **TreasureChoice** (`src/scenes/rewards/TreasureChoice.tsx`) | Entry: `1` (Open), `2` (Map); Vault: `1..3` (Unseal/Claim), `R` (Random); BagFull: `T` (Stash), `L` (Leave) | **Pass:** Excellent coverage. | No changes needed. |
| **TreasureHuntReward** (`src/scenes/rewards/TreasureHuntReward.tsx`) | `Space`/`Enter`/`Esc` (Claim & Continue) | **Pass:** Handled via `ModalShell` / custom listener. | No changes needed. |
| **ScrollDiscovery** (`src/scenes/rewards/ScrollDiscovery.tsx`) | `1..3` (Buy/Pick scroll), `F` (Forget menu), `Esc` (Close/Skip) | **Pass:** Good coverage. | No changes needed. |
| **Interlude** (`src/scenes/menu/Interlude.tsx`) | `1..3` (Select Boon), `Enter` (Confirm) | **Minor Gap:** `Space` does not confirm chosen boon. | Add `Space` to confirm chosen boon + double-tap `1..3` to confirm. |
| **GameOver** (`src/scenes/menu/GameOver.tsx`) | `Enter`/`Esc` (Retry) | **Minor Gap:** `Space` is not handled for retry. | Add `Space` key alongside `Enter`/`Esc`. |
| **Victory** (`src/scenes/menu/Victory.tsx`) | `Esc`/`Enter` (Menu), `I` (Infinite Ascent) | **Minor Gap:** `Space` is not handled for return to menu. | Add `Space` key alongside `Enter`/`Esc`. |

---

## User Review Required

> [!IMPORTANT]
> **Key Mapping Standardizations:**
> 1. **Hand Slots in Combat:** Hand cards will support BOTH `1..4` and `Z, X, C, V` for max ergonomics across QWERTY/AZERTY/Spanish keyboard layouts.
> 2. **Merchant Scene:** We will introduce `1..6` for item selection, `Enter`/`B` to buy, `R` to reroll stock, `U` for slot upgrade, and `L`/`Esc` to leave.
> 3. **Modal & Result Dialog Confirmations:** All continue/confirm screens will consistently respond to `Space`, `Enter`, and `Escape`.

---

## Proposed Code Changes

### 1. `src/scenes/activities/Merchant.tsx`
#### [MODIFY] `Merchant.tsx`
- Add keyboard event listener for:
  - `1` to `6`: Select shop item index 0..5 (or buy if already selected/focused).
  - `Enter` / `b` / `B`: Buy currently selected item (`handleBuy(selectedItemId)`).
  - `r` / `R`: Trigger stock reroll (`handleReroll()`).
  - `u` / `U`: Expand merchant slot / upgrade quality (`handleUpgradeSlot()`).
  - `l` / `L`: Trigger leave shop (`onLeave()`).
- Add visible `<span className="sw-shortcut">` badges next to Shop CTA buttons (Reroll `[R]`, Upgrade `[U]`, Leave `[Esc/L]`, Item cards `[1]..[6]`).

### 2. `src/scenes/combat/Combat.tsx`
#### [MODIFY] `Combat.tsx`
- Expand `handKeyMap` to include digit keys `Digit1`..`Digit4`, `Numpad1`..`Numpad4`, and `'1'`..'4' as aliases for hand card slots `0..3`.

### 3. `src/scenes/combat/EliteChallenge.tsx`
#### [MODIFY] `EliteChallenge.tsx`
- Add `'1'` and `'Enter'` to trigger `onFight()`.
- Add `'2'` and `'Escape'` to trigger `onEscape()`.
- Add visual shortcut badges (`[1 / F]` for Fight, `[2 / E]` for Escape) in the UI buttons.

### 4. `src/scenes/activities/Event.tsx`
#### [MODIFY] `Event.tsx`
- Improve `handleKeyDown`: if digit key `1..9` is pressed for an available choice, if it's already selected OR on double-press, immediately confirm the choice via `handleConfirm(choice)`.

### 5. `src/components/exploration/LocationMap.tsx`
#### [MODIFY] `LocationMap.tsx`
- When `floorComplete` is true, map `Escape` key to `onLeaveLocation()`.

### 6. `src/scenes/menu/MainMenu.tsx`
#### [MODIFY] `MainMenu.tsx`
- Add `H` / `G` key handling to open Shinobi Handbook (`onGuide()`).
- Add `<span className="sw-shortcut">H</span>` badge on the Shinobi Handbook button.

### 7. `src/scenes/menu/Interlude.tsx`, `GameOver.tsx`, `Victory.tsx`
#### [MODIFY] `Interlude.tsx`
- Add `Space` key to confirm selected boon (`confirm()`).
- Support double-pressing digit `1..3` to select & confirm.
#### [MODIFY] `GameOver.tsx`
- Add `Space` key to trigger `handleRetry()`.
#### [MODIFY] `Victory.tsx`
- Add `Space` key to trigger `onMenu()`.

---

## Verification Plan

### Automated Verification
Run the verification suite to ensure strict TypeScript compilation, linting, unit tests, and build budgets pass cleanly:
```bash
npm run verify
```

### Manual Verification
1. **Merchant Scene:** Verify that pressing `1`..`6` selects shop items, `Enter` buys the selected item, `R` rerolls, `U` expands slots, and `L` or `Esc` leaves the shop.
2. **Combat Scene:** Verify that pressing `1`, `2`, `3`, `4` plays hand cards 0..3 in addition to `Z`, `X`, `C`, `V`.
3. **Elite Challenge:** Verify pressing `1` / `Enter` engages fight and `2` / `Esc` escapes.
4. **Main Menu / Guide:** Verify pressing `H` opens Shinobi Handbook.
5. **Location Map:** Verify pressing `Esc` on a completed floor returns to the region map.
