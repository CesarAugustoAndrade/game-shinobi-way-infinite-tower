# LOOP STATE

> Índice escaneable del loop. **Una fila por (topic, intento).** El detalle verboso
> (diffs del maker + 4 bloques de review) vive en `logs/<topic-id>.md`.
> Lo escribe el lead (`/loop-run`) al final de cada intento, con timestamp del shell
> (`date -u +"%Y-%m-%dT%H:%M:%SZ"`). **Nunca** usar `Date.now()`.

## Run config

- run: 2026-07-18-infinite-A
- mode: auto     <!-- auto | interactive -->
- maxAttempts: 3
- activeTopic: (none — T-107 PASS; backlog empty)
- updatedAt: 2026-07-20T12:38:32Z

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
| T-015 | 1 | 60 | 62 | 74 | 68 | FAIL | iterating | 2026-07-04T14:50:46Z | logs/T-015.md#a1 |
| T-015 | 2 | 68 | 86 | 88 | 78 | FAIL | iterating | 2026-07-04T15:12:23Z | logs/T-015.md#a2 |
| T-015 | 3 | 85 | 90 | 90 | 87 | PASS | passed | 2026-07-04T15:24:04Z | logs/T-015.md#a3 |
| T-017 | 1 | 88 | 88 | 72 | 90 | FAIL | iterating | 2026-07-05T15:05:59Z | logs/T-017.md#a1 |
| T-017 | 2 | 90 | 90 | 88 | 90 | PASS | passed | 2026-07-05T15:53:16Z | logs/T-017.md#a2 |
| T-018 | 1 | 90 | 90 | 80 | 90 | FAIL | iterating | 2026-07-05T16:29:29Z | logs/T-018.md#a1 |
| T-018 | 2 | 90 | 90 | 82 | 90 | FAIL | iterating | 2026-07-05T20:03:11Z | logs/T-018.md#a2 |
| T-018 | 3 | 92 | 90 | 83 | 90 | FAIL | iterating | 2026-07-05T20:03:11Z | logs/T-018.md#a3 |
| T-018 | 4 | 92 | 92 | 90 | 90 | PASS | passed | 2026-07-05T20:03:11Z | logs/T-018.md#a4 |
| T-019 | 1 | 91 | 90 | 86 | 95 | PASS | passed | 2026-07-18T14:50:21Z | logs/T-019.md#a1 |
| T-020 | 1 | 90 | 90 | 86 | 95 | PASS | passed | 2026-07-18T15:09:30Z | logs/T-020.md#a1 |
| T-021 | 1 | 90 | 88 | 86 | 95 | PASS | passed | 2026-07-18T15:26:45Z | logs/T-021.md#a1 |
| T-022 | 1 | 90 | 88 | 88 | 95 | PASS | passed | 2026-07-18T15:48:00Z | logs/T-022.md#a1 |
| T-023 | 1 | 90 | 90 | 86 | 88 | PASS | passed | 2026-07-18T16:11:00Z | logs/T-023.md#a1 |
| T-024 | 1 | 90 | 90 | 86 | 86 | PASS | passed | 2026-07-18T16:26:40Z | logs/T-024.md#a1 |
| T-025 | 1 | 90 | 90 | 87 | 86 | PASS | passed | 2026-07-18T16:48:52Z | logs/T-025.md#a1 |
| T-026 | 1 | 90 | 90 | 87 | 86 | PASS | passed | 2026-07-18T17:07:10Z | logs/T-026.md#a1 |
| T-027 | 1 | 90 | 90 | 86 | 86 | PASS | passed | 2026-07-18T17:27:40Z | logs/T-027.md#a1 |
| T-028 | 1 | 88 | 85 | 70 | 95 | FAIL | iterating | 2026-07-18T17:46:50Z | logs/T-028.md#a1 |
| T-028 | 2 | 90 | 88 | 75 | 95 | FAIL | iterating | 2026-07-18T16:09:47Z | logs/T-028.md#a2 |
| T-028 | 3 | 91 | 90 | 78 | 95 | FAIL | iterating | 2026-07-18T16:27:27Z | logs/T-028.md#a3 |
| T-028 | 4 | 91 | 90 | 80 | 95 | FAIL | iterating | 2026-07-18T16:46:12Z | logs/T-028.md#a4 |
| T-028 | 5 | 91 | 90 | 82 | 95 | FAIL | iterating | 2026-07-18T17:08:47Z | logs/T-028.md#a5 |
| T-028 | 6 | 90 | 88 | 78 | 95 | FAIL | iterating | 2026-07-18T17:27:27Z | logs/T-028.md#a6 |
| T-028 | 7 | 90 | 88 | 80 | 95 | FAIL | iterating | 2026-07-18T17:48:43Z | logs/T-028.md#a7 |
| T-028 | 8 | 90 | 89 | 83 | 95 | FAIL | iterating | 2026-07-18T18:07:11Z | logs/T-028.md#a8 |
| T-028 | 9 | 92 | 91 | 90 | 95 | PASS | passed | 2026-07-18T18:27:29Z | logs/T-028.md#a9 |
| T-029 | 1 | 92 | 90 | 91 | 95 | PASS | passed | 2026-07-18T18:47:58Z | logs/T-029.md#a1 |
| T-030 | 1 | 92 | 91 | 88 | 90 | PASS | passed | 2026-07-18T19:08:13Z | logs/T-030.md#a1 |
| T-031 | 1 | 92 | 91 | 88 | 88 | PASS | passed | 2026-07-18T19:27:07Z | logs/T-031.md#a1 |
| T-032 | 1 | 90 | 88 | 92 | 95 | PASS | passed | 2026-07-18T19:45:37Z | logs/T-032.md#a1 |
| T-033 | 1 | 92 | 91 | 88 | 90 | PASS | passed | 2026-07-18T20:06:42Z | logs/T-033.md#a1 |
| T-034 | 1 | 92 | 91 | 86 | 88 | PASS | passed | 2026-07-18T20:25:56Z | logs/T-034.md#a1 |
| T-035 | 1 | 90 | 88 | 92 | 95 | PASS | passed | 2026-07-18T20:46:23Z | logs/T-035.md#a1 |
| T-036 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-18T21:05:14Z | logs/T-036.md#a1 |
| T-037 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-18T21:25:26Z | logs/T-037.md#a1 |
| T-038 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-18T21:45:10Z | logs/T-038.md#a1 |
| T-039 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-18T22:07:32Z | logs/T-039.md#a1 |
| T-040 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-18T22:25:09Z | logs/T-040.md#a1 |
| T-041 | 1 | 90 | 91 | 90 | 88 | PASS | passed | 2026-07-18T22:47:26Z | logs/T-041.md#a1 |
| T-042 | 1 | 90 | 90 | 92 | 90 | PASS | passed | 2026-07-18T23:06:28Z | logs/T-042.md#a1 |
| T-043 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-18T23:26:45Z | logs/T-043.md#a1 |
| T-044 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-18T23:47:13Z | logs/T-044.md#a1 |
| T-045 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-19T00:06:03Z | logs/T-045.md#a1 |
| T-046 | 1 | 91 | 91 | 90 | 95 | PASS | passed | 2026-07-19T00:25:35Z | logs/T-046.md#a1 |
| T-047 | 1 | 91 | 91 | 92 | 95 | PASS | passed | 2026-07-19T00:47:11Z | logs/T-047.md#a1 |
| T-048 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T01:06:27Z | logs/T-048.md#a1 |
| T-049 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T01:28:35Z | logs/T-049.md#a1 |
| T-050 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T01:46:49Z | logs/T-050.md#a1 |
| T-051 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T02:07:09Z | logs/T-051.md#a1 |
| T-052 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T02:26:54Z | logs/T-052.md#a1 |
| T-053 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T02:48:04Z | logs/T-053.md#a1 |
| T-054 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T03:07:43Z | logs/T-054.md#a1 |
| T-055 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T03:27:57Z | logs/T-055.md#a1 |
| T-056 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-19T03:49:35Z | logs/T-056.md#a1 |
| T-057 | 1 | 91 | 91 | 90 | 92 | PASS | passed | 2026-07-19T04:05:53Z | logs/T-057.md#a1 |
| T-058 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T04:26:55Z | logs/T-058.md#a1 |
| T-059 | 1 | 91 | 91 | 88 | 90 | PASS | passed | 2026-07-19T10:40:51Z | logs/T-059.md#a1 |
| T-060 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T11:01:17Z | logs/T-060.md#a1 |
| T-061 | 1 | 91 | 91 | 88 | 90 | PASS | passed | 2026-07-19T11:21:04Z | logs/T-061.md#a1 |
| T-062 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T11:40:04Z | logs/T-062.md#a1 |
| T-063 | 1 | 91 | 91 | 90 | 88 | PASS | passed | 2026-07-19T12:05:46Z | logs/T-063.md#a1 |
| T-064 | 1 | 91 | 91 | 88 | 88 | PASS | passed | 2026-07-19T12:20:33Z | logs/T-064.md#a1 |
| T-065 | 1 | 90 | 92 | 92 | 95 | PASS | passed | 2026-07-19T12:39:07Z | logs/T-065.md#a1 |
| T-066 | 1 | 91 | 91 | 88 | 88 | PASS | passed | 2026-07-19T12:59:26Z | logs/T-066.md#a1 |
| T-067 | 1 | 90 | 91 | 92 | 90 | PASS | passed | 2026-07-19T13:19:25Z | logs/T-067.md#a1 |
| T-068 | 1 | 91 | 91 | 88 | 90 | PASS | passed | 2026-07-19T13:41:09Z | logs/T-068.md#a1 |
| T-069 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-19T13:59:46Z | logs/T-069.md#a1 |
| T-070 | 1 | 91 | 91 | 88 | 90 | PASS | passed | 2026-07-19T14:21:39Z | logs/T-070.md#a1 |
| T-071 | 1 | 90 | 91 | 91 | 92 | PASS | passed | 2026-07-19T14:39:23Z | logs/T-071.md#a1 |
| T-072 | 1 | 91 | 91 | 88 | 90 | PASS | passed | 2026-07-19T15:00:13Z | logs/T-072.md#a1 |
| T-073 | 1 | 91 | 91 | 88 | 92 | PASS | passed | 2026-07-19T15:20:36Z | logs/T-073.md#a1 |
| T-074 | 1 | 90 | 90 | 92 | 95 | PASS | passed | 2026-07-19T15:40:10Z | logs/T-074.md#a1 |
| T-075 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T15:59:22Z | logs/T-075.md#a1 |
| T-076 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T16:22:20Z | logs/T-076.md#a1 |
| T-077 | 1 | 91 | 91 | 88 | 90 | PASS | passed | 2026-07-19T16:42:21Z | logs/T-077.md#a1 |
| T-078 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T16:59:43Z | logs/T-078.md#a1 |
| T-079 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T17:21:55Z | logs/T-079.md#a1 |
| T-080 | 1 | 91 | 91 | 91 | 90 | PASS | passed | 2026-07-19T17:40:12Z | logs/T-080.md#a1 |
| T-081 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-19T18:00:34Z | logs/T-081.md#a1 |
| T-082 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-19T18:19:32Z | logs/T-082.md#a1 |
| T-083 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T18:39:14Z | logs/T-083.md#a1 |
| T-084 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T18:59:59Z | logs/T-084.md#a1 |
| T-085 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T19:19:37Z | logs/T-085.md#a1 |
| T-086 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T19:40:48Z | logs/T-086.md#a1 |
| T-087 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T19:59:52Z | logs/T-087.md#a1 |
| T-088 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T20:20:33Z | logs/T-088.md#a1 |
| T-089 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T20:38:14Z | logs/T-089.md#a1 |
| T-090 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T20:59:20Z | logs/T-090.md#a1 |
| T-091 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T21:19:46Z | logs/T-091.md#a1 |
| T-092 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T21:40:30Z | logs/T-092.md#a1 |
| T-093 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T21:59:10Z | logs/T-093.md#a1 |
| T-094 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T22:20:40Z | logs/T-094.md#a1 |
| T-095 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T22:39:59Z | logs/T-095.md#a1 |
| T-096 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T23:00:50Z | logs/T-096.md#a1 |
| T-097 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T23:19:48Z | logs/T-097.md#a1 |
| T-098 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-19T23:39:20Z | logs/T-098.md#a1 |
| T-099 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-20T09:59:10Z | logs/T-099.md#a1 |
| T-100 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-20T10:16:30Z | logs/T-100.md#a1 |
| T-101 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-20T10:38:23Z | logs/T-101.md#a1 |
| T-102 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-20T11:00:09Z | logs/T-102.md#a1 |
| T-103 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-20T11:17:51Z | logs/T-103.md#a1 |
| T-104 | 1 | 90 | 91 | 92 | 95 | PASS | passed | 2026-07-20T11:37:25Z | logs/T-104.md#a1 |
| T-105 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-20T11:57:14Z | logs/T-105.md#a1 |
| T-106 | 1 | 91 | 91 | 90 | 90 | PASS | passed | 2026-07-20T12:18:48Z | logs/T-106.md#a1 |
| T-107 | 1 | 90 | 91 | 91 | 95 | PASS | passed | 2026-07-20T12:38:32Z | logs/T-107.md#a1 |

<!--
Leyenda:
- ARQ/SIS/PRE/BAL: score 0-100 por lente (arquitectura, sistema, presentación, balance).
- gate: PASS sii las 4 lentes >= 85. Si no, FAIL.
- status: iterating | passed | escalated.
- log: enlace al detalle, p.ej. logs/T-001.md#a1
-->
