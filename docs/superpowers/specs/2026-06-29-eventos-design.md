# Diseño — Eventos 2.0 (topics del loop)

> Fecha: 2026-06-29 · Autoría externa al loop (brainstorming) → se vuelca a `loop/LOOP-TOPICS.md`.
> Resultado: 5 topics secuenciales (T-008 … T-012) que elevan el sistema de eventos.

## 1. Problema y visión

**Hoy** los eventos son:
- **De un solo paso**: un evento → eliges una opción → se rueda un outcome ponderado → termina. Sin encadenamiento ni memoria.
- **Escasos**: 19 eventos en total (academia 3, olas 3, exámenes 4, rogue 3, **guerra 2**, genéricos 4). El arco de guerra está casi vacío.
- **Sin consecuencias persistentes**: una elección nunca afecta eventos futuros.

**Visión:** eventos con **profundidad narrativa** (cadenas ramificadas), **memoria** (flags persistentes en el run) y **más variedad** de efectos, con presentación y balance a la altura. Respeta los pilares del loop (`loop/VISION.md`): toda mecánica **cableada y alcanzable** (sin dead code), agencia del jugador, profundidad sin fricción.

**Fuera de alcance (YAGNI):** "reclutar aliados" — no existe un sistema de aliados; sería un proyecto aparte. Queda anotado como futuro. También se descartan los "eventos contextuales" puros (gating por HP/inventario en vivo): las **consecuencias persistentes** ya cubren el caso de "elecciones previas".

## 2. Estructura: 5 topics secuenciales

```text
T-008  Motor de Eventos 2.0   ──► T-009  Skill event-creator ──► T-010  Contenido
   (encadenados+flags+efectos)      (+ section 'events')           (eventos nuevos)
                                                                        │
                                              T-012  Balance ◄── T-011  Presentación
```

Orden por dependencia: el motor define el modelo de datos nuevo → la skill lo documenta → el contenido usa skill+motor → la presentación pule una escena ya funcional → el balance ajusta sobre contenido real. Cada topic pasa el gate de las 4 lentes (≥85) por separado.

## 3. Diseño del motor (T-008)

Extensión **aditiva** del modelo existente (`src/game/types.ts`), sin romper eventos actuales (todo opcional):

### Encadenados
- `EventOutcome.effects.chainTo?: string` → al cerrar el outcome, en vez de volver al mapa, se abre el `GameEvent` con ese `id`. Los árboles narrativos se componen referenciando eventos por id; reusa toda la infra actual de resolución/UI.

### Consecuencias persistentes
- Nuevo campo `Player.eventFlags: Record<string, number>` (contador/booleano del run).
- Efecto `EventOutcome.effects.setFlags?: Record<string, number>` (fija o incrementa flags).
- Gating en `GameEvent` y/o `EventChoice`: `requiresFlags?` / `excludesFlags?` para abrir/cerrar ramas según el pasado.

### Nuevos tipos de efectos
- `grantSkillById?: string` — otorgar una skill concreta (no aleatoria).
- `curse?: Buff` — maldición persistente de duración larga / todo el run.
- `removeRandomItem?: boolean` — perder/consumir algo del bag como costo narrativo.

### Cableado y tests
- **Alcanzable** (pilar VISION): `Event.tsx` + `useActivityHandlers.ts` deben encadenar de verdad un outcome con `chainTo` y aplicar/leer flags. El pulido visual queda para T-011.
- **Tests** (regla `RULES.md` SISTEMA): ampliar `EventSystem.test.ts` para cadenas/flags/efectos nuevos en el mismo intento del maker (la lógica pura load-bearing capó la lente SISTEMA <85 dos veces por "edge cases sin test").

## 4. Los 5 topics (schema para LOOP-TOPICS.md)

### T-008 · Motor de Eventos 2.0: Cadenas, Flags y Efectos
- id: T-008
- section: architecture
- status: pending
- initialScore: 35
- targetScore: 85
- lensFocus: [SISTEMA, ARQUITECTURA]
- description: >
    Extender el motor de eventos (hoy de un solo paso) de forma aditiva, sin romper los eventos existentes.
    1. En `types.ts`: añadir `Player.eventFlags: Record<string, number>`; ampliar `EventOutcome.effects` con
       `chainTo?`, `setFlags?`, `grantSkillById?`, `curse?`, `removeRandomItem?`; añadir `requiresFlags?`/`excludesFlags?`
       en `GameEvent` y `EventChoice`.
    2. En `EventSystem.ts` (puro): resolver cadenas (`chainTo`), aplicar/leer flags, gating por flags, y los efectos nuevos.
    3. Cablear en `Event.tsx` + `useActivityHandlers.ts` para que una cadena (`chainTo`) abra el siguiente evento de verdad
       y los flags persistan en el run (alcanzable, sin dead code).
    4. Ampliar `EventSystem.test.ts` cubriendo cadenas, flags y efectos nuevos.
- entryPoints:
    - src/game/types.ts
    - src/game/systems/EventSystem.ts
    - src/scenes/activities/Event.tsx
    - src/hooks/useActivityHandlers.ts
    - src/game/systems/__tests__/EventSystem.test.ts

### T-009 · Skill local event-creator + section 'events'
- id: T-009
- section: architecture
- status: pending
- initialScore: 50
- targetScore: 90
- lensFocus: [ARQUITECTURA]
- description: >
    Crear la skill local `.agents/skills/event-creator/SKILL.md` (el maker debe apoyarse en la skill `skill-creator`)
    que documente el modelo de eventos ya extendido en T-008: estructura `GameEvent`/`EventChoice`/`EventOutcome`,
    reglas de oro (pesos que suman 100 por choice, `riskLevel` coherente con la varianza, `logType`/`logMessage`,
    requisitos/costos, `chainTo` para cadenas, `setFlags`/`requiresFlags` para persistencia, efectos nuevos),
    plantillas y ejemplos. Añadir `section: events` al schema y a la tabla de mapeo de `loop/LOOP-TOPICS.md`
    (events → event-creator).
- entryPoints:
    - .agents/skills/event-creator/SKILL.md
    - loop/LOOP-TOPICS.md

### T-010 · Contenido de Eventos: relleno de arcos + cadenas
- id: T-010
- section: events
- status: pending
- initialScore: 45
- targetScore: 85
- lensFocus: [SISTEMA]
- description: >
    Escribir eventos nuevos guiado por la skill `event-creator`, usando el motor de T-008.
    1. Rellenar arcos pobres, en especial el de guerra (hoy 2 eventos) hasta una cantidad pareja con los demás.
    2. Añadir al menos 2 eventos encadenados multi-escena reales (`chainTo`) que usen flags para ramificar.
    3. Añadir al menos 1 evento con consecuencia persistente que se note en un evento posterior (`requiresFlags`).
    4. Usar los efectos nuevos (`grantSkillById`, `curse`, `removeRandomItem`) donde aporten trade-off legible.
    Registrar los nuevos arrays en `ALL_EVENTS` (`src/game/constants/index.ts`).
- entryPoints:
    - src/game/constants/events/warArcEvents.ts
    - src/game/constants/events/academyArcEvents.ts
    - src/game/constants/events/genericEvents.ts
    - src/game/constants/index.ts

### T-011 · Presentación de la escena Event
- id: T-011
- section: presentation
- status: pending
- initialScore: 55
- targetScore: 85
- lensFocus: [PRESENTACION]
- description: >
    Pulir la escena de eventos sobre el motor ya funcional de T-008.
    1. Transición clara entre escenas encadenadas (que se entienda que la historia continúa, no que es un evento nuevo suelto).
    2. Feedback de outcome más legible (qué cambió: stats/HP/chakra/ryo/intel/flags) con floating text/tooltips.
    3. Estilo coherente con el chasis PIXEL-ARCADE (T-001): paneles blocky, sombras duras, jerarquía visual.
    4. Indicador opcional de elecciones/flags relevantes cuando un choice está gated.
    Entregar mockup ASCII-box (estilo CLAUDE.md) antes de implementar.
- entryPoints:
    - src/scenes/activities/Event.tsx
    - src/components/events/EventChoicePanel.tsx
    - src/scenes/activities/Event.css

### T-012 · Balance de Eventos
- id: T-012
- section: balance
- status: pending
- initialScore: 50
- targetScore: 85
- lensFocus: [BALANCE]
- description: >
    Rebalancear los eventos sobre el contenido real de T-010.
    1. Revisar pesos de outcomes por riskLevel: que el riesgo alto pague de verdad y el bajo sea sólido pero modesto.
    2. Ajustar costos (ryo) y recompensas (exp/ryo/intel/stats) a la curva de progresión por arco/danger.
    3. Revisar frecuencia de aparición de salas de evento y peso de `triggerCombat` para no romper el ritmo (TTK/win rate del VISION).
    4. Sin outcomes "trampa" sin contrajugada (agencia del jugador).
- entryPoints:
    - src/game/constants/events/
    - src/game/systems/EventSystem.ts
    - src/game/constants/index.ts

## 5. Decisiones de diseño registradas

- **Section nueva `events`**: se añade en T-009 y mapea a la skill `event-creator`. T-008 usa `architecture` porque es refactor de sistema puro; los topics de contenido usan `events`.
- **Modelo aditivo**: todos los campos nuevos son opcionales → los 19 eventos actuales siguen válidos sin tocarlos.
- **Cadenas por composición**: `chainTo` referencia `GameEvent` por id en vez de anidar "scenes" dentro de un evento → reusa la infra y mantiene los datos planos.
- **Persistencia mínima**: `eventFlags` es un `Record<string, number>` del run (no global entre runs) → simple y suficiente para ramificar.
