# T-030 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — `PRIMARY_LOTUS` is `CardRole.ATTACK`, `hitCount: 3`, `baseDamage: 7`, `apCost: 5`, `hpCost: 15`, `cooldown: 5`. `modeInteraction` has `family` + `requireFamily` GATES, `requireOn`, `consumeAllCharges`, `damagePerChargeBonus: 0.15`, no fixed `modeId`. Legacy STR % `effects` BUFF removed. Description is Gate-finisher honest (`skills.ts` 2249–2277).
- **AC2 reject no Gate:** PASS — empty board and Byakugan-only ON both `ok: false` / `mode-required`; pools/board unmutated (`t030PrimaryLotus.test.ts` T-030 require gates).
- **AC3 scale + close:** PASS — Life C=3 and Limit C=2; damage `Math.floor(21 * (1 + 0.15 * C))`; that Gate `COOLDOWN` / 0 charges (`t030PrimaryLotus.test.ts` T-030 scale close).
- **Peacock / Chidori / Rasengan unchanged:** PASS — `bindLiveModeId` returns `mi.modeId` first. Peacock still `modeId: 'gate_of_limit'` (`skillsCombatV1New.ts` 390–397). No Peacock number retune.

## Architecture

- RING-GUARD PASS: touched R0 (`skills.ts`, `types.ts`, `ResolveSkillSystem.ts`) has no React/DOM or `src/components|scenes|hooks|contexts` imports. Probe lives in R3 `src/simulation/`.
- Family bind vs skill-id special-case: PASS — `ModeInteraction.requireFamily` + `bindLiveModeId`; no `primary_lotus` id branch.
- Hexagonal / R0 purity: PASS. `requireFamily` is a domain authoring field, not a port (stays R0).

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live `useSkill` still not on this path (explicitly out of scope). `stanceBonus` / PIERCING / STR scaling remain; spec only removed the decorative STR % buff.

## Out of scope

- Hidden Lotus, Gate Prep, Dynamic Entry, Peacock retune, Fireball / 64 Palms / Yamanaka, live `useSkill` — not touched.

## Verdict rationale

Authoring, family-scoped reject, and Life/Limit scale+close match the spec and T-021 Peacock path. Fixed-`modeId` finishers stay first in `bindLiveModeId`. Autonomous route: no subjective scores. APPROVE → verify.
