# T-067 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Focused Breathing SUPPORT AP1/CP0/CD2. Grant +8 CP (uncapped; no maxChakra on resolve pools). Arm `pendingCpUpkeepDiscount: 2`. Pure helper discounts next CP Mode upkeep by 2 once. Wire optional opt on `applyModeUpkeep`. Remove CHAKRA_REGEN 10.

## Files (one implementer)

1. `src/game/systems/FocusedBreathingDiscountSystem.ts` — new helper.
2. `src/game/constants/skills.ts` — `FOCUSED_BREATHING` authoring.
3. `src/game/systems/ResolveSkillSystem.ts` — grant +8, arm pending, clone field.
4. `src/game/systems/CombatModeSystem.ts` — optional `cpUpkeepDiscount` on `applyModeUpkeep`.
5. `src/game/systems/__tests__/t067FocusedBreathing.test.ts` — AC1–3.
6. `src/simulation/FocusedBreathingBalance.ts` + `src/simulation/index.ts` — probe.
7. `CHANGELOG.md` — Unreleased line.

Do **not** edit `PlayerTurnSystem.ts`, `TurnClockSystem.resolveModeUpkeep` signature, Gate Prep, Flash Bomb, or SkillTag enum.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP0/CD2/HP0; `baseDamage: 0`; AUTO.
- Keep existing `stanceShift: DEFENSIVE` (not a % identity).
- No new SkillTag (CHAKRA/SUSTAIN do not exist).
- No `effects` CHAKRA_REGEN 10.
- Honest description: +8 CP; next CP Mode upkeep −2 once.

## Resolve

- After cost pay (AP−1, CP 0): `chakra += 8` (uncapped).
- `pendingCpUpkeepDiscount = 2`.
- `damageDealt === 0`.
- Costs: `readyOnTurn = turnIndex + 2 + 1`.

## Discount helper

- `applyCpUpkeepDiscount(cost, pending)`: if pending>0 and `chakra>0` → `chakra: max(0, N-pending)`, remaining 0, consumed true. Else identity, remaining pending.
- `applyModeUpkeep(..., opts?)` pre-discounts first CP upkeep cost; echoes remaining on result when opts passed.
- HP upkeep unchanged; no-Mode / HP-only leaves pending.

## Tests (`t067FocusedBreathing.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP0/CD2, dmg 0; no CHAKRA_REGEN 10.
- **AC2 grant:** chakra 5→13, dmg 0, `pendingCpUpkeepDiscount === 2`; AP 6→5; `readyOnTurn === 5` at turn 2.
- **AC3 discount:** Byakugan ON, pending 2, chakra 20 → pays 2 (18); second `applyModeUpkeep` without re-arm pays 4 (16). Helper identity when pending 0 or HP-only.

## Sim

Probe: authoring; grant +8; discount 4→2 once; vs legacy CHAKRA_REGEN 10. Hook next to Flash Bomb in `simulate:quick`.

## Out of scope

PlayerTurnSystem live clock consume; Basic Medical; Kawarimi; Gate Prep retune; SkillTag invent; maxChakra clamp.
