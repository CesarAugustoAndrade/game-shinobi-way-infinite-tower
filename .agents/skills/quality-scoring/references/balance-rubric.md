# Rúbrica — BALANCE

La lente **más determinista**: se apoya en el simulador de batallas. Reusa el espíritu de
`.claude/commands/qa-balance.md` pero **el gate real es el simulador**, no el cálculo a mano
(ese comando está desactualizado: referencia `CombatSystem.ts` que ya no existe).

## Gate determinista

```bash
npm run simulate:quick               # batallas build-vs-arquetipo (rápido)
npm run simulate:progression:quick   # corridas de progresión (curva por nivel)
```

Salida:
- **stdout**: reporte formateado (ConsoleReporter) — lo más rápido de leer.
- **archivos**: `simulation-output/simulation-results-<timestamp>.json` (datos completos)
  y `simulation-output/simulation-summary-<timestamp>.json` (resumen). Lee el más reciente.

Si el simulador no corre o tira error → **Score ≤ 49** (no se puede puntuar a ciegas).

## Métricas y ventanas (campos reales de `src/simulation/types.ts`)

| Métrica (campo) | Fuente | Ventana sana |
|-----------------|--------|--------------|
| `winRate` (+ `winRateCI`) vs BALANCED | `AggregatedStats` | **45–65 %**, IC95% sin rozar 0/100 |
| `averageTurns` (TTK) | `AggregatedStats` | **4–12** turnos |
| `damageEfficiency` (dealt/received) | `AggregatedStats` | **> 1** en builds fuertes |
| `chakraEfficiency` (daño/chakra) | `AggregatedStats` | sostenible (no se queda seco en pelea larga) |
| `skillUsageCount[skill]` | `AggregatedStats` | **toda skill > piso**; 0 uso = skill muerta |
| `levelBreakpoints[].winRateDrop` | `ProgressionSummary` | **sin cliff**: sin caída brusca entre niveles |

## Bandas

| Score | Criterio |
|-------|----------|
| **85–100** | Todas las métricas en ventana, **sin skills muertas**, IC ajustado, sin cliff de progresión. |
| **70–84** | En ventana con **un outlier menor** (p.ej. una skill sub/ sobre-usada, TTK en el borde). |
| **50–69** | **Una métrica fuera de ventana** o **una skill muerta** o un cliff leve. |
| **< 50** | win rate muy fuera de banda (p.ej. >80 % o <25 %), o cliff fuerte, o el simulador no corrió. **Auto-fail.** |

## Evidence a citar
- Los valores concretos leídos del JSON/stdout: `winRate X% (CI a–b)`, `averageTurns`,
  `damageEfficiency`, skills con 0 uso, mayor `winRateDrop` de los breakpoints.
- La ventana esperada al lado de cada valor, marcando OK / OVER / UNDER.

## Nota
Si el topic **no** toca números de combate (`section` no es balance/combat/jutsu), esta lente
suele ser estable: confirma que el cambio **no movió** el balance (mismas métricas que antes)
y puntúa alto. El objetivo es detectar regresiones de balance no intencionadas.
