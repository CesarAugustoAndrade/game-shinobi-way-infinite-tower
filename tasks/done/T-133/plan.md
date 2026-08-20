# T-133 · plan

**Ring:** R0 · **auto-approved**

Chain Fear → Smoke → **Mist → Decoy** → ReadWindow in `applyOutgoingMarkCuts`. `consumed` ORs all. Dual-mark both cut. No skill reauthor.

## Files

1. `src/game/systems/MarkSystem.ts` — chain
2. `src/game/systems/__tests__/t133DecoyMistLiveCuts.test.ts` — AC1–3
3. `src/simulation/DecoyMistLiveCutsBalance.ts` + `index.ts`
4. `CHANGELOG.md`

## Tests

- decoy 40→20 strip
- mist 40→20 strip
- smoke-only 40→15; empty passthrough 40
- dual decoy+mist 40→0 both stripped (order lock)
