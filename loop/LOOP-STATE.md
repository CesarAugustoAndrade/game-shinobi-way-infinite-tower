# LOOP STATE

> Índice escaneable del loop. **Una fila por (topic, intento).** El detalle verboso
> (diffs del maker + 4 bloques de review) vive en `logs/<topic-id>.md`.
> Lo escribe el lead (`/loop-run`) al final de cada intento, con timestamp del shell
> (`date -u +"%Y-%m-%dT%H:%M:%SZ"`). **Nunca** usar `Date.now()`.

## Run config

- run: 2026-06-29-A
- mode: auto            <!-- auto | interactive -->
- maxAttempts: 3
- activeTopic: (ninguno — T-003 passed; loop pausado por checkpoint humano antes de T-004/T-006)
- updatedAt: 2026-06-29T14:14:43Z

## Ledger

| topic | attempt | ARQ | SIS | PRE | BAL | gate | status | ts (UTC) | log |
|-------|---------|-----|-----|-----|-----|------|--------|----------|-----|
| T-001 | 1 | 84 | 92 | 82 | 92 | FAIL | iterating | 2026-06-29T13:18:01Z | logs/T-001.md#a1 |
| T-001 | 2 | 90 | 92 | 88 | 92 | PASS | passed | 2026-06-29T13:27:54Z | logs/T-001.md#a2 |
| T-002 | 1 | 91 | 90 | 82 | 95 | FAIL | iterating | 2026-06-29T13:43:27Z | logs/T-002.md#a1 |
| T-002 | 2 | 93 | 90 | 88 | 95 | PASS | passed | 2026-06-29T13:50:24Z | logs/T-002.md#a2 |
| T-003 | 1 | 90 | 92 | 91 | 96 | PASS | passed | 2026-06-29T14:14:43Z | logs/T-003.md#a1 |

<!--
Leyenda:
- ARQ/SIS/PRE/BAL: score 0-100 por lente (arquitectura, sistema, presentación, balance).
- gate: PASS sii las 4 lentes >= 85. Si no, FAIL.
- status: iterating | passed | escalated.
- log: enlace al detalle, p.ej. logs/T-001.md#a1
-->
