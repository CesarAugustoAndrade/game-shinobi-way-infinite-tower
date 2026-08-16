# T-017 · plan

**Ring:** R0 · **auto-approved**

Add `GatePrepDiscountSystem` (`arm` / `reset` / `onGatePrepPlayed` / discounted Gate HP cost). Extend `activateMode` with optional `{ gateHpDiscount }` and echo remaining pending on `ModeOpResult`. Tests `t017GatePrepDiscount` + sim probe. No T-016 weight, no `gate_prep` reauthor.

## AC map

| AC | Where |
|---|---|
| AC1 half HP | activateMode + floor(15/2)=7 |
| AC2 preserve | fail + non-Gate |
| AC3 one-shot | second Gate pays full |
