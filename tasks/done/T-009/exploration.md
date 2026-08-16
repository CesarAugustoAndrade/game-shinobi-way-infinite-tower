# T-009 · exploration

**Ring:** R0 (`EnemyAISystem`, resolve, metrics). R3 print only.

| Path | Fact |
|---|---|
| `EnemyAISystem.planEnemyAction` | Direct `enemy.skills` filter by CD/AP/range. **No** `drawHand`. Scores heal/finish/debuff/damage + `Math.random()*15`. No Mode/Mark term. Telegraph via `intendedSkillId`. |
| `BattleSimulator` | Still `buildDeck`/`drawNewTurnHand` (player hand). Damage via `calculateDamage`, not `resolveSkill`. |
| `CombatSimulationService.executeAttack` | FREE_FIRST chakra skip; own damage loop. |
| `ResolveSkillSystem` | T-007 SoT commit exists. |
| `resetCombatFrontier` | Clears modes to `[]`, CD 0. No “reset CD keep Modes off without refill” helper distinct from wipe. |
| Metrics | No `setupCompletion` / `modeLifetime` / etc. |

## Premises

- AI already has no weighted hand — **confirmed**. Need non-DPS term + fixture.
- Sim dual physics — **confirmed**. AC: sim commit alias of `resolveSkill`; do not rewrite full BattleSimulator damage this slice (risk).
- Metrics absent — **confirmed**.
