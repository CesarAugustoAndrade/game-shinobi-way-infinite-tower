# LOOP STATE

> Índice escaneable del loop. **Una fila por (topic, intento).** El detalle verboso
> (diffs del maker + 4 bloques de review) vive en `logs/<topic-id>.md`.
> Lo escribe el lead (`/loop-run`) al final de cada intento, con timestamp del shell
> (`date -u +"%Y-%m-%dT%H:%M:%SZ"`). **Nunca** usar `Date.now()`.

## Run config

- run: 2026-07-02-A
- mode: interactive     <!-- auto | interactive -->
- maxAttempts: 3
- activeTopic: — (T-013 PASS a1, diff en stage. Seguimiento abierto: láminas mid/fg por bioma [código listo, assets sin generar]. Siguiente pending: T-015 simulador multi-locación)
- updatedAt: 2026-07-04T14:15:25Z

## Ledger

| topic | attempt | ARQ | SIS | PRE | BAL | gate | status | ts (UTC) | log |
|-------|---------|-----|-----|-----|-----|------|--------|----------|-----|
| T-001 | 1 | 84 | 92 | 82 | 92 | FAIL | iterating | 2026-06-29T13:18:01Z | logs/T-001.md#a1 |
| T-001 | 2 | 90 | 92 | 88 | 92 | PASS | passed | 2026-06-29T13:27:54Z | logs/T-001.md#a2 |
| T-002 | 1 | 91 | 90 | 82 | 95 | FAIL | iterating | 2026-06-29T13:43:27Z | logs/T-002.md#a1 |
| T-002 | 2 | 93 | 90 | 88 | 95 | PASS | passed | 2026-06-29T13:50:24Z | logs/T-002.md#a2 |
| T-003 | 1 | 90 | 92 | 91 | 96 | PASS | passed | 2026-06-29T14:14:43Z | logs/T-003.md#a1 |
| T-004·F1 | 1 | 91 | 88 | 92 | 92 | PASS | passed | 2026-06-29T15:34:44Z | logs/T-004.md#f1a1 |
| T-004·F2 | 1 | — | FAIL | — | — | FAIL | iterating | 2026-06-29T17:03:54Z | logs/T-004.md#f2a1 |
| T-004·F2 | 2 | 89 | 82 | 85 | 88 | FAIL | iterating | 2026-06-29T17:27:47Z | logs/T-004.md#f2a2 |
| T-004·F2 | 3 | 93 | 90 | 85 | 88 | PASS | passed | 2026-06-29T18:04:49Z | logs/T-004.md#f2a3 |
| T-004·F3 | 1 | 84 | 93 | 83 | 88 | FAIL | iterating | 2026-06-29T19:32:12Z | logs/T-004.md#f3a1 |
| T-004·F3 | 2 | 90 | 93 | 89 | 88 | PASS | passed | 2026-06-29T19:39:04Z | logs/T-004.md#f3a2 |
| T-004·F4 | 1 | 91 | 91 | 92 | 89 | PASS | passed | 2026-06-29T21:08:18Z | logs/T-004.md#f4a1 |
| T-004·F5 | 1 | 95 | 95 | 92 | 92 | PASS | passed | 2026-06-30T08:41:05Z | logs/T-004.md#f5a1 |
| T-005 | — | — | — | QA✓ | — | PASS | passed | 2026-06-30T13:08:11Z | logs/T-005.md |
| T-006·A | 1 | 91 | 86 | 91 | 88 | PASS | passed | 2026-06-30T15:39:47Z | logs/T-006.md#faseA |
| T-006·B1 | 1 | 84 | 89 | 90 | 92 | FAIL | iterating | 2026-06-30T16:23:18Z | logs/T-006.md#b1a1 |
| T-006·B1 | 2 | 92 | 89 | 90 | 92 | PASS | passed | 2026-06-30T16:31:44Z | logs/T-006.md#b1a1 |
| T-006·B2 | 1 | 83 | 90 | 90 | 81 | FAIL | iterating | 2026-06-30T19:22:21Z | logs/T-006.md#b2a1 |
| T-006·B2 | 2 | 91 | 90 | 90 | 88 | PASS | passed | 2026-06-30T20:10:04Z | logs/T-006.md#b2a2 |
| T-007·F1 | 1 | 90 | 90 | 88 | 90 | PASS | passed | 2026-06-30T22:51:12Z | logs/T-007.md#f1a1 |
| T-007·F2 | 1 | 90 | 90 | 88 | 90 | PASS | passed | 2026-07-01T11:02:09Z | logs/T-007.md#f2a1 |
| T-008 | 1 | 91 | 89 | 87 | 90 | PASS | passed | 2026-07-01T11:30:40Z | logs/T-008.md#a1 |
| T-009 | 1 | 88 | 90 | 91 | 90 | PASS | passed | 2026-07-01T15:12:27Z | logs/T-009.md#a1 |
| T-010 | 1 | 95 | 88 | 91 | 90 | PASS | passed | 2026-07-01T18:51:16Z | logs/T-010.md#a1 |
| T-011 | 1 | 90 | 90 | 80 | 90 | FAIL | iterating | 2026-07-01T23:45:00Z | logs/T-011.md#a1 |
| T-011 | 2 | 90 | 90 | 88 | 90 | PASS | passed | 2026-07-02T00:08:35Z | logs/T-011.md#a2 |
| T-016 | 1 | 93 | 90 | 88 | 85 | PASS | passed | 2026-07-03T21:33:55Z | logs/T-016.md#a1 |
| T-012 | 1 | 95 | 88 | 79 | 74 | FAIL | iterating | 2026-07-03T23:55:36Z | logs/T-012.md#a1 |
| T-012 | 2 | 95 | 94 | 83 | 87 | FAIL | iterating | 2026-07-04T00:04:20Z | logs/T-012.md#a2 |
| T-012 | 3 | 95 | 95 | 88 | 90 | PASS | passed | 2026-07-04T00:09:51Z | logs/T-012.md#a3 |
| T-014 | 1 | 90 | 90 | 70 | 90 | FAIL | iterating | 2026-07-04T10:02:15Z | logs/T-014.md#a1 |
| T-014 | 2 | 92 | 90 | 78 | 90 | FAIL | iterating | 2026-07-04T11:04:33Z | logs/T-014.md#a2 |
| T-014 | 3 | 92 | 92 | 82 | 90 | FAIL | iterating | 2026-07-04T11:55:00Z | logs/T-014.md#a3 |
| T-014 | 4 | 92 | 92 | 90 | 90 | PASS | passed | 2026-07-04T12:00:46Z | logs/T-014.md#a4 |
| T-013 | 1 | 90 | 90 | 90 | 90 | PASS | passed | 2026-07-04T14:15:25Z | logs/T-013.md#a1 |

<!--
Leyenda:
- ARQ/SIS/PRE/BAL: score 0-100 por lente (arquitectura, sistema, presentación, balance).
- gate: PASS sii las 4 lentes >= 85. Si no, FAIL.
- status: iterating | passed | escalated.
- log: enlace al detalle, p.ej. logs/T-001.md#a1
-->
