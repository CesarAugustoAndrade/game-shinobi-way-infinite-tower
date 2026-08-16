# CUTOVER-2026-08-16 — Un solo commit de combate

Origen: review de 16 auditores (T-001–T-060). El humano pidió orquestar + planear + implementar.

## Problema
Live (`useSkill` → `calculateDamage`) y SOUL (`resolveSkill`) son dos físicas.
T-008–T-060 autoraron solo contra `resolveSkill`. El jugador no ve Marks/Modes/`bandMove`.

## Tareas nuevas (no tocar T-066 ni T-067–T-081)

| ID | Ring | Qué | Owner files (implementer lock) |
|---|---|---|---|
| T-082 | R0–1 | `useSkill` / `useCombat` delegan en `resolveSkill` | `PlayerTurnSystem.ts`, `useCombat.ts` |
| T-083 | R0 | `turnIndex` avanza; `startCombat` resetea frontier | `TurnClockSystem.ts`, `CombatWorkflowSystem.ts` |
| T-084 | R0 | ON_MOVE + Fear/Smoke/ReadWindow en live enemy | `MarkSystem.ts`, `EnemyTurnSystem.ts` |
| T-085 | R0 | `pendingSupportWeights` + Discover en `CombatState` | `combat-types.ts`, `PlayerTurnSystem.ts` (upkeep/draw only) |
| T-086 | R1 | learn/forget vía `SkillConfigLive` | `useActivityHandlers.ts`, `useTreasureHandlers.ts` |
| T-087 | R2 | Montar paneles T-010 + `mainAttackId` + `canPlaySkill` | `Combat.tsx`, `Hand.tsx` |
| T-088 | R0 | `resolveSkill` ATTACK/SIDE usa `calculateDamage` + `resolveSuccessfulHit` | `ResolveSkillSystem.ts` (hit branch only) |

## No hacer
- No implementar T-067–T-081 (más jutsu) en esta oleada.
- No tocar T-066 (Flash Bomb, active).
- No mergear worktrees si hay conflictos → escalar al humano.
- No commitear los implementers.

## Orden de merge sugerido
T-083 → T-088 → T-085 → T-084 → T-082 → T-086 → T-087
