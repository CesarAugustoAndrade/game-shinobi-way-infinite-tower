# Comprehensive Build & CSS Lint Diagnostic Analysis

## Executive Summary

- **Build Status (`npm run build`)**: **SUCCESS** (Exit code 0). Vite v6.4.1 transformed 1857 modules and generated production assets in `dist/`. Non-blocking warning: JS bundle `index-BY_qWfAf.js` is 1,070.23 kB (exceeds Rollup 500 kB chunk limit recommendation).
- **CSS Lint Status (`npm run lint:css`)**: **FAILED** (Exit code 1). Stylelint reported **13 errors** across 8 CSS files.
- **Scope of Issues**: 
  1. `property-no-unknown`: 1 error (`font-smooth: never;`)
  2. `no-duplicate-selectors`: 5 errors (duplicate CSS selector blocks)
  3. `declaration-block-no-duplicate-custom-properties`: 5 errors (duplicate CSS custom properties in `:root`)
  4. `color-hex-length`: 1 error (`#ffffff` instead of `#fff`)
  5. `declaration-block-no-duplicate-properties`: 1 error (duplicate `padding` property in single selector block)

---

## 1. Build Diagnostics (`npm run build`)

### Command & Execution
- **Command**: `npm run build` (`vite build`)
- **Outcome**: Success (0 exit code)
- **Duration**: ~15.74s
- **Modules Transformed**: 1857

### Generated Artifacts
| Asset Path | Size | Gzip Size |
|---|---|---|
| `dist/index.html` | 1.94 kB | 0.84 kB |
| `dist/assets/ui_seinen-sublime-atmosferico_1767723116286-C8W6jJFK.png` | 677.52 kB | - |
| `dist/assets/index-6GzFNpaA.css` | 427.56 kB | 61.28 kB |
| `dist/assets/index-BY_qWfAf.js` | 1,070.23 kB | 292.15 kB |

### Build Warnings & Recommendations
- **Rollup Chunk Size Limit**: `index-BY_qWfAf.js` exceeds 500 kB (1,070.23 kB).
- **Remediation Suggestion**: Implement code-splitting using dynamic `import()` or configure `build.rollupOptions.output.manualChunks` in `vite.config.ts`.

---

## 2. CSS Linting Diagnostics (`npm run lint:css`)

### Command & Execution
- **Command**: `npm run lint:css` (`stylelint "src/**/*.css"`)
- **Outcome**: Failed (Exit code 1)
- **Total Issues**: 13 errors, 0 warnings

### Detailed Breakdown of All 13 Errors

#### Error 1: Non-standard CSS Property
- **File**: `src/components/combat/FloatingText.css`
- **Location**: Line 29, Column 3
- **Rule**: `property-no-unknown`
- **Code Snippet**:
  ```css
  /* Line 28-29 */
  -webkit-font-smoothing: none;
  font-smooth: never;
  ```
- **Root Cause**: `font-smooth` is an unstandardized property flag. Stylelint flags it as unknown.
- **Proposed Fix**: Remove `font-smooth: never;` and rely on standard/vendor-prefixed properties like `-webkit-font-smoothing` and `-moz-osx-font-smoothing`, or add `/* stylelint-disable-next-line property-no-unknown */` if strictly necessary.

---

#### Errors 2–6: Duplicate Selectors (`no-duplicate-selectors`)

1. **`src/components/combat/SkillCard.css`**
   - **Location**: Line 289, Column 1 (First used at Line 72)
   - **Rule**: `no-duplicate-selectors`
   - **Code Snippet**:
     ```css
     /* Line 72 */
     .skill-card--toggle.skill-card--active {
       border-color: var(--sw-rust-light, #c47a52);
       box-shadow: 0 0 0 2px var(--sw-rust-glow, rgba(166, 93, 63, 0.35));
       animation: sw-ready-pulse 2s ease-in-out infinite;
     }

     /* Line 289 */
     .skill-card--toggle.skill-card--active {
       border-color: var(--sw-rust-light, #c47a52);
     }
     ```
   - **Root Cause**: Duplicate rule block for `.skill-card--toggle.skill-card--active`.
   - **Proposed Fix**: Remove the duplicate block at line 289.

2. **`src/components/inventory/inventory.css`**
   - **Location**: Line 119, Column 1 (First used at Line 37)
   - **Rule**: `no-duplicate-selectors`
   - **Code Snippet**:
     ```css
     /* Line 37 */
     .bag__slot {
       position: relative;
     }

     /* Line 119 */
     .bag__slot {
       aspect-ratio: 1;
       border: 1px solid;
       ...
     }
     ```
   - **Root Cause**: `.bag__slot` selector declared twice in separate blocks.
   - **Proposed Fix**: Merge `position: relative;` into the main `.bag__slot` declaration block at line 119 and remove line 37.

3. **`src/scenes/menu/Interlude.css`**
   - **Location**: Line 187, Column 1 (First used at Line 128)
   - **Rule**: `no-duplicate-selectors`
   - **Code Snippet**:
     ```css
     /* Line 128 */
     .interlude__boon-top {
       position: relative;
     }

     /* Line 187 */
     .interlude__boon-top {
       display: flex;
       align-items: center;
       ...
     }
     ```
   - **Root Cause**: Duplicate `.interlude__boon-top` selector blocks.
   - **Proposed Fix**: Merge `position: relative;` into line 187 block and delete line 128.

4. **`src/scenes/rewards/ScrollDiscovery.css`**
   - **Location**: Line 209, Column 1 (First used at Line 80)
   - **Rule**: `no-duplicate-selectors`
   - **Code Snippet**:
     ```css
     /* Line 80 */
     .scroll-card {
       position: relative;
     }

     /* Line 209 */
     .scroll-card {
       background: var(--sw-bg-secondary);
       ...
     }
     ```
   - **Root Cause**: Selector `.scroll-card` declared twice.
   - **Proposed Fix**: Merge `position: relative;` into line 209 block and delete line 80.

5. **`src/scenes/rewards/treasure.css`**
   - **Location**: Line 927, Column 1 (First used at Line 124)
   - **Rule**: `no-duplicate-selectors`
   - **Code Snippet**:
     ```css
     /* Line 124 */
     .treasure-scene__body {
       padding: var(--sw-space-6);
       ...
     }

     /* Line 927 */
     .treasure-scene__body {
       opacity: 0;
       transform: translateY(6px);
       transition: opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s;
     }
     ```
   - **Root Cause**: `.treasure-scene__body` defined twice.
   - **Proposed Fix**: Merge properties into line 124 block and remove line 927 block.

---

#### Error 7: Hex Color Format Shorthand (`color-hex-length`)

- **File**: `src/scenes/combat/Combat.css`
- **Location**: Line 1474, Column 10
- **Rule**: `color-hex-length`
- **Code Snippet**:
  ```css
  /* Line 1474 */
  color: #ffffff;
  ```
- **Root Cause**: Stylelint enforces shorthand hex notation `#fff` over full 6-character `#ffffff`.
- **Proposed Fix**: Change `#ffffff` to `#fff`.

---

#### Error 8: Duplicate Property in Declaration Block (`declaration-block-no-duplicate-properties`)

- **File**: `src/scenes/menu/Victory.css`
- **Location**: Line 68, Column 3
- **Rule**: `declaration-block-no-duplicate-properties`
- **Code Snippet**:
  ```css
  /* Lines 65-76 */
  .victory__stats {
    list-style: none;
    margin: 0 0 var(--sw-space-6);
    padding: 0;               /* Line 68 */
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
    border: 2px solid var(--sw-hard, #04060d);
    padding: var(--sw-space-3);/* Line 74 */
    background: var(--sw-abyss, #050608);
  }
  ```
- **Root Cause**: `padding` property declared twice (`padding: 0;` then `padding: var(--sw-space-3);`) inside `.victory__stats`.
- **Proposed Fix**: Remove redundant `padding: 0;` at line 68.

---

#### Errors 9–13: Duplicate Custom Properties in `:root` (`declaration-block-no-duplicate-custom-properties`)

- **File**: `src/styles/design-system/_variables.css`
- **Locations**: Line 277:3, Line 280:3, Line 283:3, Line 284:3, Line 286:3
- **Rule**: `declaration-block-no-duplicate-custom-properties`
- **Code Snippet**:
  ```css
  :root {
    /* Lines 23-30 (Initial Seinen Palette Definitions) */
    --sw-abyss: #1a2633;
    --sw-bone: #e8e4dc;
    --sw-rust: #a65d3f;
    --sw-rust-light: #c47a52;
    --sw-rust-glow: rgba(166, 93, 63, 0.35);

    ...

    /* Lines 277-286 (Tooltip / Product Chrome Section Duplicate Definitions) */
    --sw-abyss: #050608;          /* Line 277 - DUPLICATE */
    --sw-bone: #e8e4d9;           /* Line 280 - DUPLICATE */
    --sw-rust: #9a3412;           /* Line 283 - DUPLICATE */
    --sw-rust-light: #c2410c;     /* Line 284 - DUPLICATE */
    --sw-rust-glow: rgba(194, 65, 12, 0.22); /* Line 286 - DUPLICATE */
  }
  ```
- **Root Cause**: Five CSS variable names are defined twice inside the same `:root` selector block with different values.
- **Proposed Fix**: Either consolidate variable definitions under unified names (e.g. `--sw-abyss-pure` or `--sw-abyss-dark`) or update the primary variable definitions and remove duplicates.

---

## Remediation Plan Summary

| Target File | Errors | Category / Rule | Action Required |
|---|---|---|---|
| `src/components/combat/FloatingText.css` | 1 | `property-no-unknown` | Remove `font-smooth: never;` |
| `src/components/combat/SkillCard.css` | 1 | `no-duplicate-selectors` | Remove redundant block at line 289 |
| `src/components/inventory/inventory.css` | 1 | `no-duplicate-selectors` | Merge line 37 into line 119 block |
| `src/scenes/combat/Combat.css` | 1 | `color-hex-length` | Change `#ffffff` to `#fff` at line 1474 |
| `src/scenes/menu/Interlude.css` | 1 | `no-duplicate-selectors` | Merge line 128 into line 187 block |
| `src/scenes/menu/Victory.css` | 1 | `declaration-block-no-duplicate-properties` | Remove redundant `padding: 0;` at line 68 |
| `src/scenes/rewards/ScrollDiscovery.css` | 1 | `no-duplicate-selectors` | Merge line 80 into line 209 block |
| `src/scenes/rewards/treasure.css` | 1 | `no-duplicate-selectors` | Merge line 927 into line 124 block |
| `src/styles/design-system/_variables.css` | 5 | `declaration-block-no-duplicate-custom-properties` | Reconcile duplicate CSS variable names |
