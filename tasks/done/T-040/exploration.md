# T-040 · exploration

**Ring:** R0 Gate Prep SUPPORT reauthor. Arm existing T-016 weight + T-017 HP discount. No new math.

## Relevant files

- `skills.ts` — `GATE_PREP` FORBIDDEN ACTIVE, no `cardRole`, WIL +50%×2. Costs already AP1 / HP15 / CD5.
- `SupportWeightSystem.ts` — `applySupportWeightOnPlay({ id: 'gate_prep' })` already +3 Life/Limit.
- `GatePrepDiscountSystem.ts` — `onGatePrepPlayed()` / `armGatePrepDiscount()`. `ResolveSkillState` has no pending discount field.
- SUPPORT resolve already enqueues T-016 bag after commit. Missing only cardRole + arm call.
- T-016/T-017 tests are the motors; do not retune.

## Premises

- Complexity: **authoring + one arm field**. Confirmed resolve rejects without `cardRole`. Weight enqueue is already generic.
- HP < 15 already `reason: 'hp'` via skillPlayability — no new reject path.
- Data: catalog AP1 · 15 HP · CD5 · −50% next Gate HP activate · +3 next draw.

## Surprises

- Description already mentions −50% HP; weight +3 is missing from copy.
- WIL % effect is anti-visión — delete.

## Port / ring

R0: skills + ResolveSkillState field + SUPPORT arm. No React. No new discount/weight formulas.
