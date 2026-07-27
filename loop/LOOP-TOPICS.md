# LOOP TOPICS — Backlog

> Backlog procesado de arriba hacia abajo por `/loop-run`. **La autoría de topics es EXTERNA al loop**.
> Los topics completados (T-001 a T-114) se encuentran archivados en [`loop/LOOP-TOPICS-ARCHIVE.md`](./LOOP-TOPICS-ARCHIVE.md).

## Schema de un topic
```yaml
## <id> · <título>
- id: T-NNN
- section: combat | jutsu | exploration | presentation | balance | architecture | events
- status: pending | active | passed | escalated
- initialScore: 0-100      # diagnóstico de partida (informativo)
- targetScore: 0-100       # meta; el gate igual exige las 4 lentes >= 85
- lensFocus: [LENTE, ...]  # lentes primarias (advisory); el gate evalúa las 4
- description: >
    Qué se quiere hacer/mejorar. Concreto y verificable.
- entryPoints:             # opcional: archivos hint para el maker
    - src/...
```

---

## Active & Pending Topics

*(No hay topics pendientes en este momento. Todos los topics T-001 a T-114 han superado el gate `passed`. Ver [`LOOP-TOPICS-ARCHIVE.md`](./LOOP-TOPICS-ARCHIVE.md)).*
