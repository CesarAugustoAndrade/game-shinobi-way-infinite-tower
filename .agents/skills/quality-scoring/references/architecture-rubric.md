# Rúbrica — ARQUITECTURA

Mide la **salud estructural** del cambio: convenciones, capas, limpieza. Es la lente
más determinista junto con BALANCE. Reusa el espíritu de `.claude/commands/a-review.md`.

## Gates deterministas (córrelos o usa los resultados que pasó el lead)

```bash
npx tsc --noEmit       # debe dar 0 errores
npm test               # vitest: las 9 suites deben pasar (verde)
```

Si `tsc` da errores o algún test falla → **Score ≤ 49** (cap por gate roto).

## Checklist de convenciones (de CLAUDE.md)

- [ ] Lógica de juego en `src/game/systems/` y **sin imports de React** ahí.
- [ ] Combate respeta la separación dual: `CombatCalculationSystem` (matemática pura) vs
      `CombatWorkflowSystem` (estado/flujo). No meter mutaciones en el de cálculo.
- [ ] **Enums** en vez de string literals (`PrimaryStat.STRENGTH`, no `'STRENGTH'`).
- [ ] **Inmutabilidad**: objetos nuevos con spread, sin mutación directa.
- [ ] **Sin `any`**.
- [ ] Datos de balance en `src/game/constants/`, no hardcodeados en componentes.
- [ ] **Sin dead code**: si el cambio reemplaza algo, lo viejo se borró.
- [ ] SRP / nombres que revelan intención / funciones pequeñas / sin duplicación obvia.

## Bandas

| Score | Criterio |
|-------|----------|
| **85–100** | `tsc` limpio + tests verdes + **cero** violaciones del checklist. Naming claro, capas respetadas. |
| **70–84** | Compila y verde, pero con **smells menores**: un nombre flojo, una duplicación pequeña, un comentario que explica el "qué" en vez del "por qué". |
| **50–69** | Compila y verde, pero hay **una violación real**: lógica de juego en un componente, mutación directa, un `any`, dato de balance hardcodeado, o dead code dejado. |
| **< 50** | `tsc` con errores, o algún test falla, o atajo que oculta el problema. **Auto-fail.** |

## Evidence a citar
- Salida resumida de `tsc --noEmit` (nº de errores).
- Resultado de `npm test` (suites pasadas/falladas).
- Las violaciones concretas del checklist con `archivo:línea`.
