# Region 1 Combat System — Deep Analysis Report

**Explorer**: Explorer 3 (Region 1 Polish)  
**Scope**: Region 1 (Land of Waves / Waves Arc) Combat System — Hero abilities, Enemy AI & stats, Region 1 Bosses, Chakra/Auras, Turn flow, Status effects, Combat HUD/UI, battle rewards, win/loss conditions, CRT/combat art visuals, sound effects.

---

## Executive Summary

This report provides a comprehensive analysis of the Region 1 Combat System in *Shinobi Way: The Infinite Tower*. The investigation examined codebase components across `src/components/combat/`, `src/scenes/combat/`, `src/components/layout/`, `src/game/systems/`, `src/game/entities/`, `src/game/constants/`, `docs/guia_direccion_de_arte_combate.md`, and the `combat-art` skill (`.agents/skills/combat-art/SKILL.md`).

Issues are categorized by priority: **Roto** (Softlocks, Crashes, Broken Math/Logic), **Confuso** (Unclear Feedback/UI), **Feo** (Visual & Layering Mismatches), **Fricción** (UX Delays & Redundant Actions), and **Pulido** (Juice, SFX, Animations).

---

## 1. ROTO (Softlocks, Illegal Turn States, Broken Math & Logic)

### [ROTO-01] Missing Hero Sprite on Combat Stage
- **File Path**: `src/components/layout/CinematicViewscreen.tsx` (Lines 149–166), `src/scenes/combat/Combat.tsx` (Lines 613–627)
- **Severity**: HIGH
- **Description**: The 16:9 combat viewscreen (`CinematicViewscreen`) only receives and renders `enemyImage` / `enemyCutout`. The Hero character (Hikaru / Player protagonist) is completely absent from the stage render! Only the right side of the stage has a character sprite, leaving the left side of the battle scene empty and failing the 2-combatant composition requirement.
- **Recommended Fix**: Extend `CinematicViewscreenProps` and `CinematicViewscreen` to accept `heroImage` / `heroCutout` and `heroChakraAuraColor`. Render the hero sprite left-anchored (`bottom: 0; left: 0;`) with green/yellow chakra aura drop-shadow (`#22c55e`).

---

### [ROTO-02] CRT Scanlines & Screen Frame Rendered UNDER Sprites
- **File Path**: `src/components/layout/CinematicViewscreen.css` (Lines 150–181 vs Lines 190–203)
- **Severity**: HIGH
- **Description**: In `CinematicViewscreen.css`, `.cinematic__scanlines` (z-index: 4) and `.cinematic__crt-frame` (z-index: 5) are stacked BELOW `.cinematic__enemy-sprite` (z-index: 10), `.cinematic__fg-img` (z-index: 11), and `.cinematic__panel-slot` (z-index: 20). This violates the core art direction (`docs/guia_direccion_de_arte_combate.md` and `combat-art` skill), which mandates that scanlines and CRT curvature must sit ON TOP OF ALL STAGE CONTENT to unify the scene into a tube monitor screen.
- **Recommended Fix**: Update `z-index` of `.cinematic__scanlines` to 30 and `.cinematic__crt-frame` to 35 (above sprites at z=10 and foreground at z=11, but within the stage's stacking context below UI overlays).

---

### [ROTO-03] Medical Jutsu / Healing Effect Does Not Scale with Stats
- **File Path**: `src/game/systems/PlayerTurnSystem.ts` (Lines 587–598), `src/game/constants/skills.ts` (Lines 741–753)
- **Severity**: HIGH
- **Description**: In `useSkill`, when `eff.type === EffectType.HEAL`, the heal amount is calculated purely as `eff.value` (e.g. flat 25 HP for `BASIC_MEDICAL`). The skill's `damageMult`, `scalingStat` (`INTELLIGENCE`/`SPIRIT`), and player character stats are completely ignored. At higher levels or late Region 1 when max HP reaches 300–600+, a 25 HP flat heal represents <5% HP, rendering medical jutsu useless.
- **Recommended Fix**: Update `HEAL` effect calculation in `PlayerTurnSystem.ts` to scale `eff.value` with the skill's `scalingStat` (e.g. `Math.floor(eff.value + scalingStat * skill.damageMult)` or similar derived formula).

---

### [ROTO-04] Stunned Player Card Play Flow Friction / State Confusion
- **File Path**: `src/game/systems/PlayerTurnSystem.ts` (Lines 358–372), `src/hooks/useCombat.ts` (Lines 168–172)
- **Severity**: MEDIUM
- **Description**: When the player is stunned, attempting to play any skill card returns `apCost: 0` and logs "You are stunned!". However, cards remain interactive in the HUD, no "STUNNED — END TURN" banner appears, and the turn does not automatically pass unless auto-pass is enabled. Players click cards repeatedly thinking the UI is unresponsive.
- **Recommended Fix**: Render a prominent "STUNNED" overlay on the player's deck/hand when stunned, disabling card buttons visually and adding a one-click "Pass Stunned Turn" prompt or auto-passing after a short notification.

---

### [ROTO-05] Boss Skill Kit Imbalance in Region 1 (Land of Waves)
- **File Path**: `src/game/constants/index.ts` (Lines 288–297), `src/game/systems/EnemySystem.ts` (Lines 324–336)
- **Severity**: MEDIUM
- **Description**: `Zabuza, Demon of the Mist` (Danger 4 boss in Waves Arc) is assigned `SKILLS.HIDDEN_MIST` (0 damage) as signature skill and `SKILLS.WATER_CLONE` (0 damage) as support skill. With `BASIC_ATTACK` (Taijutsu), 2 out of Zabuza's 3 skills deal zero damage, causing Zabuza—a legendary sword master—to spend turns casting non-damaging buffs instead of executing sword or water dragon attacks. Furthermore, `Demon Brothers` (Danger 1 boss) is assigned `SKILLS.DEMON_SLASH` (a Forbidden 3.5× piercing attack), creating an inverted difficulty curve where Danger 1 hits harder than Danger 4.
- **Recommended Fix**: Rebalance `BOSS_BY_ARC['WAVES_ARC']` skill assignments:
  - Danger 1 (Demon Brothers): Give a basic physical strike like `KUNAI_SLASH` or `STRONG_FIST` instead of `DEMON_SLASH`.
  - Danger 3/4 (Zabuza): Give a damaging kit (`WATER_DRAGON`, `DEMON_SLASH`, `HIDDEN_MIST`).

---

## 2. CONFUSO (Unclear Skill Descriptions, Hidden Enemy Stats & Intent, Ambiguous Logs)

### [CONFUSO-01] Enemy Intended Skill Telegraph Hidden from HUD Panel
- **File Path**: `src/scenes/combat/Combat.tsx` (Lines 317–538), `src/game/systems/EnemyTurnSystem.ts` (Lines 1097–1117)
- **Severity**: MEDIUM
- **Description**: `EnemyTurnSystem` generates `intendedSkillId` and `intendedSkillName` at the end of every enemy turn for 1-turn action telegraphing. However, the floating enemy info panel (`.combat__ip`) in `Combat.tsx` does NOT display the telegraphed skill name or intent icon! Players cannot see what technique the enemy is preparing for the next turn.
- **Recommended Fix**: Add an "INTENT" row to `.combat__ip` in `Combat.tsx` showing `enemy.intendedSkillName` with a warning icon (e.g. `⚠️ Preparing: Water Dragon`).

---

### [CONFUSO-02] Skill Card Status Effect Chances Omitted
- **File Path**: `src/components/combat/Hand.tsx` (Lines 248–260), `src/game/utils/tooltipFormatters.ts`
- **Severity**: LOW
- **Description**: Skill tooltips list effect types (e.g. "Stun", "Burn") but omit the trigger probability (e.g. 40% chance vs 100% chance). Players cannot judge whether a status effect is guaranteed or RNG-based.
- **Recommended Fix**: Update `formatEffectDescription` in `tooltipFormatters.ts` to append `(${Math.round(effect.chance * 100)}% chance)` for non-100% effects.

---

### [CONFUSO-03] Mini Combat Log Color & Detail Uniformity
- **File Path**: `src/components/combat/GameLog.tsx`, `src/scenes/combat/Combat.tsx` (Lines 630–633)
- **Severity**: LOW
- **Description**: The mini combat log overlaid at the bottom-left of the stage renders log entries with uniform text styling, making critical hits, super-effective element bonuses, and debuffs blend together.
- **Recommended Fix**: Apply color highlights in `GameLog.tsx` based on `LogEntry.type` and keywords (`CRITICAL` in gold, `SUPER EFFECTIVE` in blue/cyan, `DEFEATED` in red).

---

## 3. FEO (Visual & Layout Alignment, Missing Auras, Abrupt Transitions)

### [FEO-01] Missing Hero Chakra Aura Styling
- **File Path**: `src/components/layout/CinematicViewscreen.css` (Lines 226–232), `src/scenes/combat/Combat.tsx`
- **Severity**: MEDIUM
- **Description**: `combat-art` skill specifies a hero chakra halo filter (`drop-shadow` in green/yellow `#22c55e`). Currently, only the enemy sprite receives a drop-shadow glow via `chakraAuraColor`.
- **Recommended Fix**: Add `--hero-chakra-aura` support to `CinematicViewscreen` and apply green chakra glow filter to the Hero sprite.

---

### [FEO-02] Abrupt Turn Transitions
- **File Path**: `src/scenes/combat/Combat.tsx`, `src/hooks/useCombat.ts` (Lines 630–736)
- **Severity**: MEDIUM
- **Description**: Switching between `PLAYER` and `ENEMY_TURN` happens instantly without any visual banner or screen indicator ("PLAYER TURN" / "ENEMY TURN").
- **Recommended Fix**: Add a brief animated turn banner overlay ("YOUR TURN" / "ENEMY TURN") that slides in for 400ms during turn transitions.

---

### [FEO-03] Mobile Viewport Panel Overlap
- **File Path**: `src/components/layout/CinematicViewscreen.css` (Lines 293–300), `src/scenes/combat/Combat.css` (Lines 719–774)
- **Severity**: LOW
- **Description**: On mobile screens (<=480px), `.cinematic__panel-slot` expands across the top of the viewport and overlaps the enemy sprite on stage.
- **Recommended Fix**: Adjust mobile breakpoint styling in `CinematicViewscreen.css` to compact the info panel height and restrict maximum width to 85%.

---

## 4. FRICCIÓN (Sluggish Turn Animations, Unskippable Delays, Redundant Clicks)

### [FRICCION-01] Unskippable Enemy Turn Delay During Region Grinding
- **File Path**: `src/hooks/useCombat.ts` (Line 734), `src/game/config.ts` (`TIMING.ENEMY_TURN_DELAY = 800`)
- **Severity**: MEDIUM
- **Description**: `TIMING.ENEMY_TURN_DELAY` forces an 800ms wait on every enemy turn. When grinding or playing quick battles in Region 1, this introduces unskippable latency per turn.
- **Recommended Fix**: Add a fast-forward / quick-combat toggle or reduce delay when `autoCombatEnabled` is active.

---

### [FRICCION-02] Redundant Clicks for Stance Switching
- **File Path**: `src/components/combat/PostureIndicator.tsx`, `src/scenes/combat/Combat.tsx`
- **Severity**: LOW
- **Description**: Switching posture requires clicking the PostureIndicator component to open a dropdown, then selecting the stance.
- **Recommended Fix**: Add direct keyboard shortcuts for stance switching (e.g. 1/2/3 keys for Aggressive/Balanced/Defensive) or direct stance buttons.

---

## 5. PULIDO (Hit Flash, Screen Shake, Sound Effects, Victory Stance)

### [PULIDO-01] Completely Missing Combat Sound Triggers (SFX)
- **File Path**: Global codebase (`src/scenes/combat/`, `src/hooks/useCombat.ts`)
- **Severity**: HIGH
- **Description**: There is ZERO audio engine or SFX triggering in the entire combat system! Skills, attacks, hits, crits, status triggers, and victory play in total silence.
- **Recommended Fix**: Implement a lightweight Web Audio / HTML5 Audio sound manager and add sound triggers for:
  - Skill card play (`sfx_card_play.wav`)
  - Physical hit / Slash (`sfx_hit_physical.wav`)
  - Jutsu / Elemental attack (`sfx_jutsu_fire.wav`, `sfx_jutsu_water.wav`)
  - Critical hit (`sfx_crit.wav`)
  - Victory jingle (`sfx_victory.mp3`)

---

### [PULIDO-02] Missing Screen Shake on Heavy Hits & Criticals
- **File Path**: `src/components/layout/CinematicViewscreen.tsx`, `src/scenes/combat/Combat.tsx`
- **Severity**: MEDIUM
- **Description**: Heavy attacks (e.g. `DEMON_SLASH`, `WATER_DRAGON`) and critical hits trigger a micro brightness flash on the enemy sprite (`.cinematic__enemy-sprite--hit`), but there is no viewport screen shake or impact pulse.
- **Recommended Fix**: Add a `screenShake` prop/state to `CinematicViewscreen` that applies a 200ms keyframe screen shake (`transform: translate(-3px, 2px)`) on heavy damage / critical hits.

---

### [PULIDO-03] Missing Victory Stance / KO Freeze-Frame
- **File Path**: `src/hooks/useCombat.ts` (Lines 135–146), `src/scenes/combat/Combat.tsx`
- **Severity**: LOW
- **Description**: When the enemy HP reaches 0, combat immediately unmounts and transitions to the loot/victory modal. There is no victory pose animation, freeze-frame hit, or "VICTORY" banner overlay on stage.
- **Recommended Fix**: Add a 600ms victory delay with a "KO" / "VICTORY" banner overlay on the combat stage before transitioning to the loot modal.

---

## Summary Table of Issues

| ID | Issue Description | Category | Severity | Primary File |
|---|---|---|---|---|
| ROTO-01 | Missing Hero sprite on combat stage | Roto | HIGH | `CinematicViewscreen.tsx` |
| ROTO-02 | CRT scanlines and screen frame rendered under sprites | Roto | HIGH | `CinematicViewscreen.css` |
| ROTO-03 | Medical Jutsu / HEAL effect does not scale with stats | Roto | HIGH | `PlayerTurnSystem.ts` |
| ROTO-04 | Stunned player turn flow & card interaction confusion | Roto | MEDIUM | `PlayerTurnSystem.ts` |
| ROTO-05 | Boss skill kit imbalance for Region 1 bosses (Zabuza & Demon Brothers) | Roto | MEDIUM | `index.ts` / `EnemySystem.ts` |
| CONFUSO-01 | Enemy intended skill telegraph hidden from HUD panel | Confuso | MEDIUM | `Combat.tsx` |
| CONFUSO-02 | Skill card status effect trigger chances omitted in tooltips | Confuso | LOW | `Hand.tsx` / `tooltipFormatters.ts` |
| CONFUSO-03 | Mini combat log text color and detail uniformity | Confuso | LOW | `GameLog.tsx` |
| FEO-01 | Missing Hero chakra aura styling (green/yellow halo) | Feo | MEDIUM | `CinematicViewscreen.css` |
| FEO-02 | Abrupt turn transitions without animated banners | Feo | MEDIUM | `Combat.tsx` |
| FEO-03 | Mobile viewport info panel overlap on stage | Feo | LOW | `CinematicViewscreen.css` |
| FRICCION-01 | Unskippable enemy turn delay during battle grinding | Fricción | MEDIUM | `useCombat.ts` |
| FRICCION-02 | Redundant clicks required for posture switching | Fricción | LOW | `PostureIndicator.tsx` |
| PULIDO-01 | Completely missing combat sound triggers (SFX) | Pulido | HIGH | Global combat |
| PULIDO-02 | Missing screen shake on heavy hits and critical strikes | Pulido | MEDIUM | `CinematicViewscreen.tsx` |
| PULIDO-03 | Missing victory stance / KO freeze-frame transition | Pulido | LOW | `useCombat.ts` |

---

## Out-of-Scope Items (Region 2+ and Global Non-Region-1 Systems)

- **Chunin Exams / Sasuke Retrieval / War Arc Bosses**: Bosses from Region 2+ (e.g. Orochimaru, Kimimaro, Madara, Pain) were reviewed for reference but fall under Region 2–5 scope.
- **Global Inventory & Equipment Synthesis**: Item crafting, synthesis, and global inventory management outside combat are out of Region 1 combat scope.
