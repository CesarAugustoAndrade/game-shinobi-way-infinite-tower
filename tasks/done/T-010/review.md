# T-010 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: `roleBadgeLabel` maps SUPPORT / MODE / SIDE_ATTACK→SIDE / ATTACK. `SkillCard` face uses that badge (not TOGGLE/ACTIVE as primary text). Main ribbon when `skill.id === mainAttackId`. AP/CP/HP/CD/range/hits already on face.
- AC2: `CombatModesPanel` renders name, stage, charges/max, upkeep, priority. `TacticalSetupPanel` renders own/enemy marks with stacks, duration clock, trigger, consume.
- AC3: `buildHonestyPreview` suppresses enhanced when no non-zero sources. Charge consume renders red `.skill-card__consume-warning`. Disabled card exposes exactly one `data-block-reason`.
- Skill Config inspector: main attack, upkeep order, weight breakdown behind toggle.

## Architecture

- RING-GUARD PASS: `combatSkillViewModel.ts` (R0) has no React/DOM and no `src/components|scenes|hooks|contexts` imports. New helpers are formatters (badge, consume copy, additive preview sum) — no formula ownership in R2.
- Simulation probe (`CombatUiHonestyBalance.ts`) is R3 → R0 only.
- Presentational panels stay prop-driven.

## Quality

- BLOCK: none.
- SHOULD: mount `CombatModesPanel` / `TacticalSetupPanel` / `SkillHonestyPreview` in `Combat.tsx` / `Hand.tsx`, and `SkillConfigInspector` on the exploration Skill Config surface. Components exist and pass fixture ACs but are not referenced by live scenes (`mainAttackId` is not passed from `Hand`).
- NIT: `TacticalSetupPanel` / `SkillConfigInspector` share `CombatModesPanel.css` (fine; no dedicated sheets).

## Out of scope

- No Mode/Mark engine, catalog art, AI/sim, or SOUL edits.
