# T-031 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — `HIDDEN_LOTUS` is `CardRole.ATTACK`, `hitCount: 5`, `baseDamage: 6`, `apCost: 6`, `hpCost: 50`, `cooldown: 6`. `modeInteraction` has `modeId: 'gate_of_limit'`, `requireOn`, `consumeAllCharges`, `damagePerChargeBonus: 0.15`. Self `markEffects` `vulnerable` duration 2, `stacks: 30`, `MarkFamily.STAT`. Physical, not TRUE. Description is Limit-finisher honest (`skills.ts` 2493–2538).
- **AC2 require Limit:** PASS — empty board and Gate of Life ON both `ok: false` / `mode-required`; pools/modes/marks unmutated (`t031HiddenLotus.test.ts` T-031 require limit).
- **AC3 scale + close + Vulnerable:** PASS — Limit C=3; damage `Math.floor(30 * (1 + 0.15 * 3))`; Gate `COOLDOWN` / 0 charges; player `vulnerable` duration 2. Extra miss case still plants mark (spec non-IMPACT).
- **Peacock / Primary Lotus unchanged:** PASS — no edits to those rows or resolve. Fixed `modeId` (not `requireFamily`).

## Architecture

- RING-GUARD PASS: touched R0 is `skills.ts` only; no React/DOM or UI imports. Probe lives in R3 `src/simulation/`. No resolve fork.
- Hexagonal / R0 purity: PASS. Reuses Peacock `modeInteraction` + existing `applySkillMarkEffects`.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: enemy +30% taken from self Vulnerable not wired (explicitly OOS). live `useSkill` still OOS. `stanceBonus` remains.

## Out of scope

- Primary Lotus, Peacock retune, Dynamic Entry, Fireball / 64 Palms / Yamanaka, live `useSkill` — not touched.

## Verdict rationale

Authoring, Limit-only reject, scale+close, and self-Vulnerable plant match the spec via existing Peacock/mark paths. Autonomous route: no subjective scores. APPROVE → verify.
