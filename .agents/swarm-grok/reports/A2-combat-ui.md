# A2 — Combat UI Report

**Agent:** A2-combat-ui (Grok swarm)  
**Date:** 2026-07-23  
**Branch:** `develop` (no commit)  
**Scope:** Combat stage + dock presentation polish — stage first, dock second; seinen-sublime palette; telegraph/AP/posture legibility.

---

## Intent

Combat is the **show**: enemy as sole sharp vertical on a misty painted stage; player agency lives in HUD/hand. Align chrome with cyber-CRT chassis + rust heat (`#a65d3f`) as the only warm accent — no parchment, no party gold whiplash.

---

## Before → After

| Area | Before | After |
|------|--------|--------|
| **Palette** | Arcade gold/amber + zinc glass | Seinen tokens: void/abyss/metal/fog/bone/rust |
| **Stage** | Enemy sprite floating, dark scrim stack | Mist floor + contact shadow + enemy stage wrapper; stronger cutout scale/aura/depth |
| **Telegraph** | Only combat log line | Visible `Next · {skill}` chip in floating enemy panel (A-003 data already on `Enemy`) |
| **AP / stance** | Gold pips + gold active posture | Rust pips/frame; posture active = rust fill |
| **Skill cards** | Gold AP, candy super-effective | Rust AP badges; rust effective ring; block-reason strip on greyed cards |
| **Floating text** | Tailwind utility classes | BEM + dedicated CSS (bone/rust/fog) |
| **Approach / Elite** | Generic dark panels | Void chassis, rust top edge, metal borders |

---

## Files changed

| File | Change |
|------|--------|
| `src/styles/design-system/_variables.css` | Seinen-sublime tokens (`--sw-void`, `--sw-abyss`, `--sw-metal`, `--sw-fog`, `--sw-bone`, `--sw-rust` + helpers) |
| `src/components/layout/CinematicViewscreen.tsx` | Mist floor layer; enemy stage wrapper + ground shadow |
| `src/components/layout/CinematicViewscreen.css` | Mist floor, stage positioning, cutout scale/shadow/aura, vignette/gradient tuned, mobile stage |
| `src/scenes/combat/Combat.tsx` | Telegraph row from `enemy.intendedSkillName` / `intentReason` |
| `src/scenes/combat/Combat.css` | Deck/panel/AP/telegraph/open-banner chrome → seinen; rust heat signals |
| `src/components/combat/SkillCard.tsx` | Block-reason face strip when unplayable |
| `src/components/combat/SkillCard.css` | Abyss chassis, rust AP/effective, bone text, cost chips |
| `src/components/combat/Hand.css` | Fog label + rust accent bar; empty state chassis |
| `src/components/combat/PostureIndicator.css` | Metal inactive / rust active stance |
| `src/components/combat/FloatingText.tsx` | Drop Tailwind; BEM type modifiers |
| `src/components/combat/FloatingText.css` | **New** — rise/crit/fade animations + palette |
| `src/components/combat/ApproachSelector.css` | Void modal, rust top edge, metal cards, rust selected |
| `src/scenes/combat/EliteChallenge.css` | Same void/rust chassis language |

**Not touched:** `CombatCalculationSystem` / `CombatWorkflowSystem` math; no unit tests added.

---

## Verification

- `npx tsc --noEmit` — clean (exit 0)
- `vitest` `CinematicViewscreenProps.test.ts` — 2/2 passed

---

## Residual / follow-ups

1. **Lámina mid/fg assets** still missing on disk (wired via props; layers hide on 404). Art pipeline.
2. **Enemy identity art collapse** (many pool IDs → same cutout) is asset-side, not UI.
3. **Hero never on stage** by design (vision); player remains HUD/hand only.
4. **Hit-flash filter** still replaces full cutout filter stack during animation (pre-existing pattern); acceptable juice trade-off.
5. **Element card tints** still use brighter element borders for StS-style scan — intentionally kept for type readability; heat accents (AP/effective/telegraph) are rust-only.
6. **Approach success bars / confirm modal** deeper copy polish not fully re-themed (cards + shell done).
7. Optional: stage-side telegraph banner near the cutout (Darkest Dungeon threat line) in addition to panel chip — panel is sufficient for now.

---

## Design notes (applied)

- **Stage first, dock second:** mist floor + cutout grounding; dock seam uses rust hairline under metal border.
- **Trade-offs before confirm:** AP/CP badges, HP/upkeep/effect chips, block-reason strip, approach benefit chips retained.
- **Legible risk:** telegraph chip uses rust label + bone skill name; HP uses rust-light current.
- **CRT chassis:** hard void shadows, metal frames, soft scanline stack unchanged (feature-flag CRT frame).
