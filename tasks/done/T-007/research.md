# T-007 · research

Internal contract task. No new library.

## Options

1. **New `ResolveSkillSystem.resolveSkill` + injected ports** (recommended).  
   SoT for SOUL §13 order. `useSkill` stays until a later cutover. Tests own ACs.  
   + Isolated, RING-safe, uses T-001–006. − Dual path until live wrap.

2. **Rewrite `useSkill` in place** to the SOUL order.  
   + One live path. − High regression on PlayerTurn/useCombat tests; mixes R0 commit with terrain/artifacts/guts.

3. **Adapter: `useSkill` delegates when `cardRole` present.**  
   Dual-compat SOUL forbids in production long-term. Acceptable only as intra-task cutover; not this increment.

## Recommendation

Option 1. New pure module. Inject `rollHit`, Mode ports. Default Mode ports = T-005 functions; tests spy. Do not pay Mode `activationCost` a second time after skill AP/CP/HP commit (port updates board; pools already committed). Invalid → clone of input state, consume nothing.

Canon: SOUL §13 `resolveSkill`, HTML `#contratos` commit block, §9 attempt vs impact, §15 FREE_FIRST, §16 multi-hit.
