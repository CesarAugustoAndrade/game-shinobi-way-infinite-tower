# Event Chrome Tokens

Notes for aligning Event scene local tokens (`--ev-*` in `src/scenes/activities/Event.css`) with the design system (`src/styles/design-system/_variables.css`) and exploration HUD chrome (`src/components/layout/ExplorationHUD.css`).

**Scope:** documentation only — no migration required yet.

---

## Source files

| File | Role |
|------|------|
| `src/scenes/activities/Event.css` | Local `.event { --ev-* }` palette + scene chrome |
| `src/components/layout/ExplorationHUD.css` | Explore strip; consumes `--sw-*` (no `--ev-*`) |
| `src/styles/design-system/_variables.css` | Canonical `--sw-*` design tokens |

Both Event and ExplorationHUD already `@import` the design-system index and use shared spacing / type / z-index tokens.

---

## Typography (via tokens)

Pixel-arcade type pairing is defined once in `_variables.css` and loaded from `index.html`:

| Role | Token | Family |
|------|--------|--------|
| Titles / chrome / labels | `--sw-font-display` | **Silkscreen** (`'Press Start 2P'` fallback) |
| Body / stats / numbers | `--sw-font-pixel` | **VT323** (`'Courier New'` fallback) |

Aliases for legacy consumers:

- `--sw-font-serif` → `--sw-font-display` (Silkscreen)
- `--sw-font-sans` / `--sw-font-mono` → `--sw-font-pixel` (VT323)

**Event usage**

- **Silkscreen (titles):** `.event__title`, `.event__plate-tag`, `.event__mystery-flavor`, `.event__chain`, `.event__divider`, choice labels, risk badges, outcomes header / type chips, confirm tag.
- **VT323 (body):** `.event__description`, path hints, choice description / hint / requirements / outcomes text.

**ExplorationHUD usage**

- Strip root uses `--sw-font-display` (Silkscreen).
- Location chip, run flags, theme chips, bar values use `--sw-font-mono` → VT323.

When consolidating chrome, keep titles on `--sw-font-display` and prose/values on `--sw-font-pixel` / `--sw-font-mono` — do not hardcode font family names in scene CSS.

---

## Hard shadows = pixel-arcade

Design-system shadow tokens are **offset, no blur**:

```css
/* _variables.css */
--sw-shadow-sm: 2px 2px 0 0 var(--sw-hard);
--sw-shadow-md: 3px 3px 0 0 var(--sw-hard);
--sw-shadow-lg: 4px 4px 0 0 var(--sw-hard);
--sw-shadow-xl: 6px 6px 0 0 var(--sw-hard);
--sw-pix-shadow: 4px 4px 0 0 var(--sw-hard);
--sw-pix-shadow-sm: 3px 3px 0 0 var(--sw-hard);
--sw-pix-shadow-lg: 6px 6px 0 0 var(--sw-hard);
```

Event chrome already matches this vocabulary with local hard color:

| Element | Shadow |
|---------|--------|
| Chain ribbon | `3px 3px 0 0 var(--ev-hard)` |
| Poster frame | `6px 6px 0 0 var(--ev-hard)` |
| Path bar | `3px 3px 0 0 var(--ev-hard)` |
| Choice card | `4px 4px 0 0` / hover `6px 6px 0 0` / active `1px 1px 0 0` |
| Risk badge / confirm / tooltip | `2px`–`5px` hard offset |

ExplorationHUD does the same with `--sw-hard` (e.g. strip `4px 4px 0 0`, buttons `3px 3px 0 0`, chips `1px 1px 0 #000`).

**Rule:** Event (and HUD) hard drop-shadows are intentional pixel-arcade chrome, not incomplete soft-shadow work. Prefer `--sw-pix-shadow*` / `--sw-shadow-*` when mapping; keep `0` blur radius.

Title `text-shadow: Npx Npx 0 var(--ev-hard)` is the same hard-offset idea for type.

---

## `--ev-*` inventory and future `--sw-*` mapping

Local tokens live on `.event`:

```css
.event {
  --ev-panel: #12161f;
  --ev-panel-2: #0e1219;
  --ev-border: #2a3140;
  --ev-hard: #05070c;
  --ev-title: #f2f4f8;
  --ev-body: #a8b2c2;
  --ev-gold: #e8a825;
  --ev-muted: #5a6474;
  --ev-risk-safe: #3dba6a;
  --ev-risk-low: #c9d23a;
  --ev-risk-medium: #e8872e;
  --ev-risk-high: #e0423a;
  --ev-risk-extreme: #a65cff;
}
```

### Strong candidates (semantic match; values may still differ)

| `--ev-*` | Suggested `--sw-*` target | Notes |
|----------|---------------------------|--------|
| `--ev-hard` | `--sw-hard` (`#04060d`) | Same role: hard-shadow / near-black. Hex nearly identical (`#05070c` vs `#04060d`). |
| `--ev-title` | `--sw-text-primary` or `--sw-bone` | Primary light text on dark panels. |
| `--ev-body` | `--sw-text-secondary` or `--sw-bone-dim` | Secondary prose; Event is cooler blue-gray, system is zinc / bone-dim. |
| `--ev-muted` | `--sw-text-muted` or `--sw-bone-muted` | Disabled / gate / quiet chrome. |
| `--ev-gold` | `--sw-accent-primary` / `--sw-accent-tertiary` or treasure gold | Event gold `#e8a825` sits between accent amber and `--treasure-gold`. HUD uses `#e8b84a` for ryo / level — align deliberately. |
| `--ev-border` | `--sw-metal` or frame tokens | Cool panel edge; closest system metal is `--sw-metal` `#2d3d4a`. Not the light `--sw-frame`. |
| `--ev-panel` | `--sw-bg-secondary` / `--sw-abyss-deep` | Elevated dark panel fill. |
| `--ev-panel-2` | `--sw-bg-primary` / `--sw-void` | Deeper gradient stop. |
| `--ev-risk-safe` | `--sw-risk-safe-light` | Event is brighter arcade green; system base is darker `#15803d`. Prefer `*-light` or keep event-bright as explicit arcade override. |
| `--ev-risk-low` | `--sw-risk-low-light` | Event is chartreuse; system low is brown-amber. Closest is light variant; hue may need a dedicated arcade risk ramp. |
| `--ev-risk-medium` | `--sw-risk-medium-light` | Same pattern: Event brighter orange. |
| `--ev-risk-high` | `--sw-risk-high-light` | Event `#e0423a` ≈ system high-light red family. |
| `--ev-risk-extreme` | `--sw-risk-extreme-light` | Event violet vs system purple; same semantic ladder. |

### Already using `--sw-*` in Event (no local twin)

Spacing (`--sw-space-*`), radii (`--sw-radius-sm`), fonts (`--sw-font-display` / `--sw-font-pixel`), text helpers (`--sw-text-muted`, `--sw-text-tertiary`, `--sw-on-accent`), category colors (`--sw-category-body|mind|technique`), transitions, z-index (`--sw-z-popover`), frame soft (`--sw-frame-soft`).

### Do not force-map without design sign-off

- **Risk ramp brightness:** Event risk colors are neon / meter-friendly; system risk tokens are deeper (panel fills + glows). Mapping 1:1 will desaturate choice rails and risk badges.
- **Gold vs rust:** Seinen-sublime combat chrome prefers **rust** as sole heat; Event path/poster chrome is **gold**. Collapsing `--ev-gold` into `--sw-rust` would change Event identity. Prefer accent/treasure tokens, or a shared “arcade gold” token if HUD + Event should match.
- **Panel cool blues** (`#12161f` / `#0e1219` / `#2a3140`) sit closer to abyss/metal than zinc `--sw-bg-*`. Mapping to zinc secondary may warm the poster/choice stack.

---

## ExplorationHUD ↔ Event relationship

- **App / ExplorationHUD** owns stats, inventory, ryo, run flags during explore/event.
- **Event scene** owns poster + path bar + risk-railed choice cards only.
- HUD already speaks `--sw-*` + hard shadows; Event dual-speaks `--ev-*` + `--sw-*`.
- Future cleanup: redefine `--ev-*` as aliases to `--sw-*` (or drop locals) once gold/risk/panel decisions are fixed — keeps Event CSS selectors, moves palette to the design system.

---

## Suggested migration order (when implementing)

1. `--ev-hard` → `var(--sw-hard)` (lowest visual risk).
2. Shadow literals → `--sw-pix-shadow` / `--sw-shadow-*` / `--sw-pix-shadow-lg`.
3. Text tokens (`--ev-title` / `--ev-body` / `--ev-muted`) → text or bone scale.
4. Border / panel → metal + abyss / bg scale (or new shared “cool panel” tokens if zinc is wrong).
5. Risk ramp — either adopt system `*-light` tokens or promote Event’s brighter ramp into `_variables.css` as arcade risk fills shared with HUD danger chips.
6. Gold — single shared accent token used by Event gold rail, HUD ryo, and path bar.

---

## Quick reference: pixel chrome checklist

- [x] Titles: Silkscreen via `--sw-font-display`
- [x] Body: VT323 via `--sw-font-pixel` (and mono alias)
- [x] Shadows: hard offset, **no blur** (`Npx Npx 0 0`)
- [ ] Optional: fold `--ev-*` into `--sw-*` after gold / risk / cool-panel decisions
