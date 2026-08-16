# T-015 · plan

**Ring:** R0 · **auto-approved**

Author `shadow_clone` `{ skillId: 'rasengan', delta: 4 }`. Add `buildModeWeightBonuses`. Wire into `buildUpkeepWeightContext`. Tests `t015ModeWeightBonuses` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 data | modes.ts |
| AC2 aggregator | ModeWeightSystem |
| AC3 +4 weight | effectiveWeight |
