# T-068 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Basic Medical SUPPORT AP2/CP5/CD5. Heal 25 clamped to maxHp. Strip **one** player `poison` or `bleed` mark (first in marks array). Remove mute HEAL 25 effects[]. No Kai retune.

## Files (one implementer)

1. `src/game/types.ts` — `Skill.supportHeal`.
2. `src/game/constants/skills.ts` — `BASIC_MEDICAL`.
3. `src/game/systems/ResolveSkillSystem.ts` — `resolveSupportHeal` + SUPPORT call.
4. `src/game/systems/__tests__/t068BasicMedical.test.ts` — AC1–3.
5. `src/simulation/BasicMedicalBalance.ts` + `src/simulation/index.ts` — probe.
6. `CHANGELOG.md` — Unreleased line.

Do **not** edit Kai, Focused Breathing, SkillTag, or PlayerTurnSystem.

## Authoring

- `cardRole: SUPPORT`; AP2/CP5/CD5/HP0; `baseDamage: 0`; AUTO.
- Keep `stanceShift: BALANCED` + existing stanceBonus.
- `supportHeal: { amount: 25, cleanseOneOf: ['poison', 'bleed'] }`.
- No `effects` HEAL 25.
- Honest description: heal 25; remove one Poison or Bleed.

## Resolve

- Pay AP2/CP5; `damageDealt === 0`.
- `pools.hp = min(maxHp, hp + amount)`.
- Remove first mark with `target === PLAYER` and `id` in `cleanseOneOf` (array order). If none, remove first player buff whose effect is POISON or BLEED.
- No DoT → still heal; marks unchanged.
- `readyOnTurn = turnIndex + 5 + 1`.

## Tests

- **AC1 authoring:** SUPPORT AP2/CP5/CD5, supportHeal 25 + cleanseOneOf poison/bleed; no HEAL 25 effects[].
- **AC2 heal cleanse:** hp 50/100, marks [poison, bleed] player → hp 75, poison gone, bleed remains.
- **AC3 heal only:** hp 50/100, no DoT → hp 75, marks unchanged.

## Sim

Probe: authoring; heal 50→75; one-of cleanse; vs mute HEAL 25. Hook next to Focused Breathing in `simulate:quick`.
