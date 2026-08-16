# T-027 · exploration

**Ring:** R0 resolveSkill Mode family auto ascent vs lateral. Reuse T-005 `ascendMode` / `lateralSwap`. No new port.

## Relevant files

- `CombatModeSystem.ts` — `ascendMode` (AP + resource diff, charges+1) and `lateralSwap` (full target cost, transfer, prior CD) are tested.
- `ResolveSkillSystem.ts` — MODE: `family-replace` always `lateralSwap`; default `activate` hits `same-family` after skill costs already commit. Mode `result.pools` are discarded.
- `modes.ts` — GATES/CURSE staged; SHARINGAN 2/3; `MODE_FAMILY` constants.
- `skills.ts` / v1 — MODE rows `curse_mark_2`, `gate_of_limit`, `sharingan_3` with full activation costs.
- `t005CombatModes.test.ts` — Curse I→II AP 10→7 HP 40→27 charges 3; Sharingan 2→3 charges 2, prior CD.

## Premises

- Classifier keys **family** (Gate/Curse = ascent, Sharingan = lateral), not stage-delta alone.
- No downgrade: reject in validate, consume nothing.
- Skill pre-commit would double-tax / mismatch T-005; family transitions must let Mode APIs pay and apply `result.pools`.
- First-time activate and manual-off stay unchanged (T-007 skill-pay + ignore Mode pools).

## Surprises

- Live `activateMode` on same-family fails `same-family`; no auto-route today.
- `familyReplace` `fromId` is the **skill** mode id, not the ON sibling.
- Live `useSkill` out of scope.

## Port / ring

Optional `ports.ascendMode` mirrors existing `familyReplace`. No public port signature change. Stays R0.
