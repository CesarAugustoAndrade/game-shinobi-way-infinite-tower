# T-039 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — SUPPORT AP1/CP3/CD3 base 0. `requireOn` + `requireFamily: SHARINGAN` + `restoreCharges: 1`. No consumeCharges. `read_window` duration 1 stacks 30. No SPEED +25%.
- **AC2 reject:** PASS — empty board → `mode-required`, pools/modes/marks unchanged.
- **AC3 restore + cap:** PASS — 2T charges 1→2 + mark; at 3 stays 3 + mark; 3T 1→2 (family bind). `applyReadWindowOutgoing(40)` → 10.
- **Chidori / Rotation:** PASS — t025/t028 still green.

## Architecture

- RING-GUARD PASS: R0 types, CombatModeSystem, ResolveSkillSystem, skills, MarkSystem. No React.
- Restore is ON-only, `min(maxCharges, charges+n)`, no COOLDOWN revive.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live EnemyTurn does not call `applyReadWindowOutgoing`.

## Out of scope

- Smoke retune, intent UI, live enemy apply.

## Verdict rationale

Authoring, Mode gate, restore without overcap, and Read Window plant match catalog. APPROVE → verify.
