# LOOP STATE

> Índice escaneable del loop. **Una fila por (topic, intento).** El detalle verboso
> (diffs del maker + 4 bloques de review) vive en `logs/<topic-id>.md`.
> Lo escribe el lead (`/loop-run`) al final de cada intento, con timestamp del shell
> (`date -u +"%Y-%m-%dT%H:%M:%SZ"`). **Nunca** usar `Date.now()`.

## Run config

- run: 2026-06-29-A
- mode: auto            <!-- auto | interactive -->
- maxAttempts: 3
- activeTopic: (ninguno — T-001 passed)
- updatedAt: 2026-06-29T13:27:54Z

## Ledger

| topic | attempt | ARQ | SIS | PRE | BAL | gate | status | ts (UTC) | log |
|-------|---------|-----|-----|-----|-----|------|--------|----------|-----|
| T-001 | 1 | 84 | 92 | 82 | 92 | FAIL | iterating | 2026-06-29T13:18:01Z | logs/T-001.md#a1 |
| T-001 | 2 | 90 | 92 | 88 | 92 | PASS | passed | 2026-06-29T13:27:54Z | logs/T-001.md#a2 |

<!--
Leyenda:
- ARQ/SIS/PRE/BAL: score 0-100 por lente (arquitectura, sistema, presentación, balance).
- gate: PASS sii las 4 lentes >= 85. Si no, FAIL.
- status: iterating | passed | escalated.
- log: enlace al detalle, p.ej. logs/T-001.md#a1
-->
