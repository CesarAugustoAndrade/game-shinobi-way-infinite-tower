# Handoff Report — Region 1 Combat System Deep Analysis

## 1. Observation

Direct code and asset observations from the investigation:

- **Missing Hero Sprite**: In `src/components/layout/CinematicViewscreen.tsx` (lines 149–166), only `enemyImage` / `enemyCutout` is rendered on the stage. There is no `heroImage` or `heroCutout` prop or element in `CinematicViewscreen`, leaving the left side of the stage empty during combat encounters.
- **Incorrect CRT/Scanlines Layering**: In `src/components/layout/CinematicViewscreen.css`, `.cinematic__scanlines` (lines 150–162) and `.cinematic__crt-frame` (lines 172–181) have `z-index: 4` and `z-index: 5` respectively, whereas `.cinematic__enemy-sprite` (line 193) has `z-index: 10` and `.cinematic__fg-img` (line 264) has `z-index: 11`. As a result, character sprites sit on top of the CRT overlay rather than inside/under the CRT monitor filter as required by `docs/guia_direccion_de_arte_combate.md` and `.agents/skills/combat-art/SKILL.md`.
- **Medical Jutsu Unscaled Heal**: In `src/game/systems/PlayerTurnSystem.ts` (lines 587–598), `EffectType.HEAL` calculates healing as `eff.value` (flat 25 HP for `BASIC_MEDICAL` in `src/game/constants/skills.ts` line 752), ignoring player intelligence/spirit stats and damage multipliers.
- **Boss Skill Kit Inconsistency**: In `src/game/constants/index.ts` (lines 289–297), `BOSS_BY_ARC['WAVES_ARC']` defines `Zabuza, Demon of the Mist` (Danger 4) with `SKILLS.HIDDEN_MIST` (0 damage) and `SKILLS.WATER_CLONE` (0 damage). In `src/game/systems/EnemySystem.ts` (lines 331–335), Zabuza gets Taijutsu + Water Clone + Hidden Mist, leaving him with 2 zero-damage skills out of 3.
- **Hidden Enemy Intent**: `EnemyTurnSystem.ts` (lines 1097–1117) computes `intendedSkillId` and `intendedSkillName` for telegraphing, but `.combat__ip` in `src/scenes/combat/Combat.tsx` (lines 317–538) does not display an intent indicator on the enemy info panel.
- **Missing Sound System**: Search across `src/` confirms zero audio playback engine or sound triggers (`.wav`/`.mp3` assets or `AudioContext`) in the combat pipeline.
- **Automated Test Results**: All 22 test files (443 tests) passed when running `npx vitest run`.

---

## 2. Logic Chain

1. **Composition & Visual Presentation**:
   - `docs/guia_direccion_de_arte_combate.md` specifies a 5-layer composition (Background, Middleground, Sprites, Foreground, UI & FX) with an outer CRT overlay covering the entire scene.
   - Code inspection of `CinematicViewscreen.tsx` showed only the Enemy sprite rendered. Without the Hero sprite, the battle composition is missing 50% of its character presence.
   - Furthermore, CSS stacking in `CinematicViewscreen.css` placed scanlines at z=4 and CRT at z=5, while sprites sit at z=10. This places sprites in front of the CRT screen filter, destroying the arcade tube illusion.

2. **Combat Mechanics & Math**:
   - Examining `PlayerTurnSystem.ts` revealed that `HEAL` effects read `eff.value` directly without stat scaling. As player HP grows from ~100 to ~500+, 25 flat HP becomes mathematically irrelevant.
   - Examining `EnemySystem.ts` and `index.ts` showed Zabuza's Danger 4 boss kit composed of 2 zero-damage utility skills and basic Taijutsu, neutralizing the boss's threat signature.

3. **Audio & Polish**:
   - Visual juice like sprite hit-flashes exist (`.cinematic__enemy-sprite--hit`), but screen shake, victory poses, and audio feedback are non-existent.

---

## 3. Caveats

- **Region 2+ Content**: Bosses and enemies outside Land of Waves (Exams, Sasuke Retrieval, War Arc) were examined for structural comparison but marked out of scope for implementation.
- **Asset Availability**: Transparent cutout sprites (`enemy_cut_*.png` and `hero_cut_*.png`) rely on pre-isolated PNG assets in `public/assets/`. If a cutout asset is missing, `CinematicViewscreen` gracefully falls back to masked portraits.

---

## 4. Conclusion

The Region 1 Combat System has strong underlying math and a passing unit test suite (443 tests), but suffers from **16 identified issues** across 5 categories:
- **5 Roto**: Missing Hero sprite, inverted CRT stacking, unscaled healing math, stunned turn UX block, and weak Zabuza boss kit.
- **3 Confuso**: Hidden intent badge on HUD, omitted status chance percentages in tooltips, and uniform log entry styling.
- **3 Feo**: Missing Hero chakra aura, abrupt turn transitions, and mobile viewport panel overlap.
- **2 Fricción**: Unskippable 800ms enemy turn delay during grinding, and multi-click stance selection.
- **3 Pulido**: Completely missing combat SFX/audio, missing screen shake on crits/heavy hits, and lack of victory KO stance animation.

Detailed issue definitions and recommended fix strategies are documented in `analysis.md`.

---

## 5. Verification Method

To independently verify the findings:

1. **Automated Test Suite**:
   Run `npx vitest run` from the project root to verify core combat engine math.
2. **Visual Inspection of Combat Stage**:
   Inspect `src/components/layout/CinematicViewscreen.tsx` lines 149–178 to verify that only enemy image is rendered.
3. **CSS Stacking Verification**:
   Inspect `src/components/layout/CinematicViewscreen.css` lines 150–203 to verify that `.cinematic__scanlines` (z=4) and `.cinematic__crt-frame` (z=5) sit below `.cinematic__enemy-sprite` (z=10).
4. **Damage & Healing Math Verification**:
   Inspect `src/game/systems/PlayerTurnSystem.ts` lines 587–598 to verify that `HEAL` effect does not scale with stats or multipliers.
5. **Boss Skill Kit Verification**:
   Inspect `src/game/constants/index.ts` lines 289–297 and `src/game/systems/EnemySystem.ts` lines 324–336 to verify Zabuza's Danger 4 kit.
