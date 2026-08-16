# T-017 · exploration

**Ring:** R0 Gate Prep HP activation discount. No port-signature change (optional `activateMode` opts).

## Relevant files

- `src/game/systems/CombatModeSystem.ts` — `activateMode` always pays full `def.activationCost`; `canAffordActivation` + `payCost`. Ascend/lateral are out of scope.
- `src/game/constants/modes.ts` — `MODE_FAMILY.GATES`; `gate_of_life` `{ ap: 3, hp: 15 }`; `gate_of_limit` `{ ap: 4, hp: 35 }`; `shadow_clone` CP-only.
- `src/game/systems/TurnClockSystem.ts` — `HP_UPKEEP_FLOOR = 1` (full 15 needs hp≥16; floor-half 7 needs hp≥8).
- T-016 `SupportWeightSystem` — weight half of Gate Prep only.

## Ports to reuse

- `activateMode` + optional `opts.gateHpDiscount` + `ModeOpResult.gateHpDiscount` echo.
- Pure `armGatePrepDiscount` / `onGatePrepPlayed` (no live resolve; `gate_prep` still lacks `cardRole`).

## Premises

- Half uses `Math.floor` (15→7, 35→17).
- Fail (hp-floor / cannot-afford / not-ready / same-family) preserves pending.
- Non-Gate success does not consume.

## Surprises

- Existing T-005 callers omit 5th arg — must stay binary-compatible.
- Ascend/lateral ignore discount (documented out of scope).
