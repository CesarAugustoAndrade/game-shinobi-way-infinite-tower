# T-032 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — `FIREBALL` is `CardRole.ATTACK`, AP 3 / CP 6 / CD 3 / `baseDamage: 17`, `allowedRanges` MEDIUM+LONG, `modeInteraction` `sharingan_2` + `consumeCharges: 1` + `damageMultBonus: 0.5`, `requireOn` absent. Burn 5×2 chance 1.0 (`skills.ts` FIREBALL).
- **AC2 base without Mode:** PASS — empty board, MEDIUM, deterministic hit → `ok: true`, `damageDealt: 17`, modes still empty (`t032Fireball.test.ts` T-032 base).
- **AC3 2T enhance + charge:** PASS — Sharingan 2 ON with 3 charges → `floor(17 * 1.5) = 25`, charges 2, Mode still ON. Extra: Sharingan 3 alone does not enhance or spend.
- **Chidori / Rasengan / resolve fork:** PASS — no edits to those rows or `ResolveSkillSystem`. Reuses T-018 `damageMultBonus` + `consumeCharges`.

## Architecture

- RING-GUARD PASS: touched R0 is `skills.ts` only; no React/DOM or UI imports. Probe lives in R3 `src/simulation/`. No resolve fork.
- Hexagonal / R0 purity: PASS. Mirror Rasengan authoring.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live `useSkill` / R2 badges still OOS. Burn DoT tick not asserted (spec: packaging honesty only).

## Out of scope

- Phoenix / Predict / Stream — not touched.
- Chidori 3T packaging (T-025) — unchanged.
- Live `useSkill` — not touched.

## Verdict rationale

Authoring, base-without-Mode, and 2T +50%/1-charge match the catalog via the existing Rasengan enhance path. Autonomous route: no subjective scores. APPROVE → verify.
