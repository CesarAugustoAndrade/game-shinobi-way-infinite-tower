# Handoff Report — Worker Roto Combat Stage

## 1. Observation
- **TASK-R09 (Hero Sprite Render on Combat Stage)**:
  - In `src/components/layout/CinematicViewscreen.tsx`, `CinematicViewscreenProps` only contained `enemyImage` and `enemyCutout`. The hero sprite was omitted from the stage rendering loop.
  - In `src/scenes/combat/Combat.tsx`, hero image and cutout props were not passed to `CinematicViewscreen`.
- **TASK-R10 (CRT Scanlines and Screen Frame Layering)**:
  - In `src/components/layout/CinematicViewscreen.css`, `.cinematic__scanlines` was set to `z-index: 4` and `.cinematic__crt-frame` was set to `z-index: 5`.
  - Character sprites (`.cinematic__enemy-sprite` and `.cinematic__hero-sprite`) are placed at `z-index: 10`. This rendered scanlines/CRT frame behind character sprites, breaking the retro CRT filter effect.
- **TASK-R12 (Stunned Player Turn Banner & Action Button)**:
  - In `src/scenes/combat/Combat.tsx`, when player has `EffectType.STUN`, `canUseSkill` returns `false` (locking cards), but no prominent banner or explicit CTA button informed the user or provided a responsive action to pass the turn.

## 2. Logic Chain
- **For TASK-R09**:
  - Updated `CinematicViewscreenProps` to accept `heroImage?: string`, `heroCutout?: string`, `heroChakraAuraColor?: string`, and `heroHitFlash?: boolean`.
  - Added state `heroCutoutError` and resolution `useHeroCutout = heroCutout && !heroCutoutError` / `useHeroPortrait = !useHeroCutout && heroImage`.
  - Added `.cinematic__hero-sprite` rules in `CinematicViewscreen.css` for left-anchored rendering (`bottom: 0; left: 0; z-index: 10; width: clamp(180px, 45%, 420px)`), with radial mask for portrait and green chakra aura drop-shadow (`--hero-chakra-aura`) for cutout.
  - In `Combat.tsx`, resolved `heroImage = (player as any).image || getClanArt(player.clan)?.src` and `heroCutout` fallback, passing both props to `CinematicViewscreen`.
- **For TASK-R10**:
  - In `CinematicViewscreen.css`, updated `.cinematic__scanlines` to `z-index: 25;` and `.cinematic__crt-frame` to `z-index: 26;`, both maintaining `pointer-events: none;`.
  - Updated `.cinematic__panel-slot` to `z-index: 30;` so the floating enemy info panel sits above the CRT overlay with `pointer-events: auto;`.
- **For TASK-R12**:
  - In `Combat.tsx`, derived `isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)`.
  - When `isStunned && turnState === 'PLAYER'`, rendered a retro styled `.combat-stunned-banner` overlay with title `"⚡ STUNNED!"`, description `"You are incapacitated this turn and cannot play cards."`, and explicit CTA button `"<Hourglass /> STUNNED - PASS TURN"`.
  - Updated `.combat__pass-btn` label and modifier `.combat__pass-btn--stunned` so the pass turn button displays `"STUNNED - PASS TURN"` and pulses when stunned.
  - Added CSS rules for `.combat-stunned-banner` and `.combat__pass-btn--stunned` in `Combat.css`.

## 3. Caveats
- No custom pre-baked PNG cutout images currently exist for hero clans in `/assets/hero_cut_*`, so `heroImage` gracefully defaults to `getClanArt(player.clan).src` (`/assets/icons/clans/<clan>.jpg`) and renders with the masked portrait variant. Cutouts are supported automatically if added.

## 4. Conclusion
- All three assigned tasks (TASK-R09, TASK-R10, TASK-R12) are fully implemented, backward-compatible, and verified with zero TypeScript build errors and 100% passing tests.

## 5. Verification Method
- **TypeScript build**:
  - Executed `npx tsc --noEmit` -> Passed with 0 errors.
- **Unit tests**:
  - Executed `npm test` -> 24 test files passed (450 tests total passed), including new test files `CinematicViewscreenProps.test.ts` and `CombatStunnedState.test.ts`.
- **Files modified**:
  - `src/components/layout/CinematicViewscreen.tsx`
  - `src/components/layout/CinematicViewscreen.css`
  - `src/scenes/combat/Combat.tsx`
  - `src/scenes/combat/Combat.css`
  - `src/components/layout/__tests__/CinematicViewscreenProps.test.ts` (new)
  - `src/scenes/combat/__tests__/CombatStunnedState.test.ts` (new)
