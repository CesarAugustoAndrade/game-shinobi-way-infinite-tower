# T-039 · exploration

**Ring:** R0 Sharingan Predict: require Sharingan ON + Read Window −30 + restore 1 charge. New `tryRestoreCharges`. No overcap.

## Relevant files

- `skills.ts` — `SHARINGAN_PREDICT` HIDDEN, no `cardRole`. AP 1 / CP 3 / CD 3 / SPEED +25%×2. No Mode gate.
- `CombatModeSystem.ts` — `trySpendCharges` / drain. No restore. maxCharges 3 on sharingan_2/3.
- `ResolveSkillSystem.ts` — `requireOn` + `bindLiveModeId` (family ON). SUPPORT plants marks. Auto-spend only if `consumeCharges`.
- T-028 Rotation — requireOn reject `mode-required`, consume nothing.
- T-038 Smoke −25 helper — sibling Read Window −30.

## Premises

- Catalog “Sharingan ON” = family 2 or 3, not only 2T. Confirmed one-family-ON.
- Restore is ON-only; does not revive COOLDOWN. No overcap (`min(max, charges+n)`).
- Predict must **not** spend charges (`consumeCharges` absent).
- Complexity: new restore API required (grep empty). Family bind already exists (Primary Lotus).

## Surprises

- Incomplete authoring (`resolveSkill` rejects without `cardRole`).
- SPEED evasion is anti-visión identity — delete.

## Port / ring

R0: types (`restoreCharges`), CombatModeSystem, ResolveSkillSystem, skills. No React.
