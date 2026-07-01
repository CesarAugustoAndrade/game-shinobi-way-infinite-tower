---
name: event-creator
description: >-
  Autoría de eventos narrativos con elección (GameEvent/EventChoice/EventOutcome) para Shinobi Way,
  incluido el Event Engine 2.0 (T-008): cadenas multi-escena (chainTo), flags persistentes de partida
  (setFlags + requiresFlags/excludesFlags), otorgar jutsu (grantSkillById), maldiciones (curse) y
  pérdida de objeto (removeRandomItem). Úsalo siempre que haya que añadir, editar o encadenar
  contenido de eventos, o gatear eventos/opciones por progreso de la run. El loop mapea aquí los
  topics de `section: events`. Dispara con: "nuevo evento", "evento encadenado / multi-escena",
  "gatear opción por flag", "outcome con maldición / otorgar jutsu", "registrar evento en un arco".
---

# Event Creator

Los eventos son escenas narrativas con opciones y resultados aleatorios ponderados. La lógica pura
vive en `src/game/systems/EventSystem.ts`; los datos de contenido en `src/game/constants/events/*.ts`.
Esta skill documenta el **modelo REAL** (extendido en T-008) para escribir contenido nuevo que tipe
y funcione. Usa la fuente de verdad, no inventes campos.

> **Fuentes de verdad** (léelas si dudas de un campo):
> - Tipos: `src/game/types.ts` (`GameEvent`, `EventChoice`, `EventOutcome`, `RequirementCheck`,
>   `EventCost`, `RiskLevel`, `Player.eventFlags`).
> - Resolución: `src/game/systems/EventSystem.ts` (`resolveEventChoice`, `applyOutcomeEffects`,
>   `rollOutcome`, `checkEventFlags`, `getAvailableChoices`, `getAvailableEventsForPlayer`).
> - Selección/flujo: `src/game/systems/LocationSystem.ts` (`generateEventActivity` → filtra la oferta por arco y por flags vía `getAvailableEventsForPlayer`),
>   `src/hooks/useActivityHandlers.ts` (`handleEventChoice` → cadena/combate/cierre),
>   `src/scenes/activities/Event.tsx` (UI: oculta opciones gateadas por flags).
> - Ejemplos vivos: `src/game/constants/events/{genericEvents,wavesArcEvents,academyArcEvents}.ts`.

## 1. Cuándo usarla

- Añadir un evento nuevo a un arco (o genérico a todos los arcos).
- Editar outcomes, requisitos, costos o pesos de un evento existente.
- Construir una **cadena** de escenas (`chainTo` + `setFlags`) o un evento **gateado** por progreso.
- Usar los efectos T-008 (`grantSkillById`, `curse`, `removeRandomItem`) con trade-off legible.

Contenido puro de datos: **no** toques `EventSystem.ts` salvo que cambies la mecánica del motor
(eso es un topic de `combat`/`architecture`, no de `events`).

## 2. Modelo de datos

### `GameEvent`
| Campo | Tipo | Obl. | Para qué |
|-------|------|------|----------|
| `id` | `string` | Sí | Identificador único. Lo referencia `chainTo` y `EVENTS.find(e => e.id === ...)`. |
| `title` | `string` | Sí | Cabecera en la UI del evento. |
| `description` | `string` | Sí | Texto narrativo del cuerpo. |
| `allowedArcs` | `string[]` | No | Arcos donde aparece (p.ej. `['WAVES_ARC']`). `[]` u omitido = todos los arcos. Se compara contra `region.arc` en `LocationSystem`. |
| `rarity` | `Rarity` | No | Metadato descriptivo. **Nota:** la selección en `LocationSystem` es aleatoria uniforme del pool elegible — `rarity` NO pondera hoy la aparición. |
| `requiresFlags` | `Record<string, number>` | No | T-008. El evento solo se ofrece si **todo** flag ≥ su valor. |
| `excludesFlags` | `Record<string, number>` | No | T-008. El evento se oculta si **algún** flag ≥ su valor. |
| `choices` | `EventChoice[]` | Sí | 1+ opciones del jugador. |

### `EventChoice`
| Campo | Tipo | Obl. | Para qué |
|-------|------|------|----------|
| `label` | `string` | Sí | Texto del botón. |
| `description` | `string` | Sí | Subtexto bajo el botón (telegrafía riesgo/costo/requisito). |
| `riskLevel` | `RiskLevel` | Sí | `SAFE \| LOW \| MEDIUM \| HIGH \| EXTREME`. Indicador visible; debe casar con la varianza real. |
| `hintText` | `string` | No | Pista vaga del resultado. |
| `requirements` | `RequirementCheck` | No | `minStat` y/o `requiredClan`. Si no se cumple, la opción se muestra **deshabilitada** (no se oculta). |
| `requiresFlags` | `Record<string, number>` | No | T-008. La opción se **elimina** de la oferta salvo que todo flag ≥ su valor. |
| `excludesFlags` | `Record<string, number>` | No | T-008. La opción se elimina si algún flag ≥ su valor. |
| `costs` | `EventCost` | No | `{ ryo?: number }`. Se paga al elegir; opción deshabilitada si no alcanza. |
| `outcomes` | `EventOutcome[]` | Sí | Tabla de resultados ponderados. |
| `clanBonus` | `{ clan: Clan; weightMultiplier: number }` | No | Si el clan del jugador coincide, `rollOutcome` multiplica **todos** los pesos por el mismo factor y renormaliza a 100 → hoy es un **no-op** de probabilidad (no sesga). Declarado pero sin efecto real (ver Notas de discrepancia #5). |

`RequirementCheck`: `minStat?: { stat: PrimaryStat; value: number }` (compara contra
`player.primaryStats[stat]`), `requiredClan?: Clan`.
`EventCost`: `{ ryo?: number }`.

### `EventOutcome`
| Campo | Tipo | Obl. | Para qué |
|-------|------|------|----------|
| `weight` | `number` | Sí | Peso de probabilidad. Convención: los pesos de un choice **suman 100**. |
| `effects` | `object` | Sí | Efectos aplicados al resolver (ver tabla). |

### `EventOutcome.effects`
| Campo | Tipo | Aplicado por | Notas |
|-------|------|--------------|-------|
| `statChanges` | `Partial<PrimaryAttributes>` | `applyOutcomeEffects` | +/- stats primarios; piso 1. |
| `exp` | `number` | `applyOutcomeEffects` | Otorga XP. |
| `ryo` | `number` | `applyOutcomeEffects` | Suma (puede ser negativo). |
| `hpChange` | `number \| { percent: number }` | `applyOutcomeEffects` | Plano o % de maxHp; clamp `[1, maxHp]`. |
| `chakraChange` | `number \| { percent: number }` | `applyOutcomeEffects` | Plano o % de maxChakra; clamp `[0, maxChakra]`. |
| `buffs` | `Buff[]` | `applyOutcomeEffects` | Se añaden a `player.activeBuffs`. |
| `upgradeTreasureQuality` | `boolean` | `applyOutcomeEffects` | Un paso BROKEN→COMMON→RARE. |
| `addMerchantSlot` | `boolean` | `applyOutcomeEffects` | +1 hasta `MAX_MERCHANT_SLOTS`. |
| `intelGain` | `number` | `handleEventOutcomeClose` | **Reemplaza** el Intel por defecto de la sala (`INTEL_GAIN.EVENT_DEFAULT`), no se suma; aplica **solo en el outcome terminal** que la cierra (no en combate ni en cadena). Un terminal sin `intelGain` igual otorga el default. Rango típico 0–40. |
| `triggerCombat` | `{ floor; difficulty; archetype; name? }` | `handleEventChoice` | Inicia pelea tras el evento. `floor→dangerLevel = clamp(ceil(floor/3),1,7)`; `floor:0` = danger actual. |
| `chainTo` | `string` | `handleEventChoice` | **T-008.** Id del siguiente `GameEvent` a abrir en vez de volver a exploración. |
| `setFlags` | `Record<string, number>` | `applyOutcomeEffects` | **T-008.** Merge-asigna en `player.eventFlags` (**sobrescribe**, no incrementa). |
| `grantSkillById` | `string` | `applyOutcomeEffects` | **T-008.** Otorga la skill cuyo `Skill.id` coincide en `SKILLS`. Dedupe por id (repetir = no-op). |
| `curse` | `{ value?; duration? }` | `applyOutcomeEffects` | **T-008.** Añade Buff `EffectType.CURSE` a `activeBuffs`. `value` = fracción de daño extra recibido (def 0.5); `duration` turnos (def 3). |
| `removeRandomItem` | `boolean` | `applyOutcomeEffects` | **T-008.** Vacía un slot lleno aleatorio del `bag` (PRNG del juego). |
| `logMessage` | `string` | — | **Obligatorio.** Línea de log al resolver. |
| `logType` | `'gain' \| 'danger' \| 'info' \| 'loot'` | — | **Obligatorio.** Categoría/color del log. |

**Gating por flags (semántica real, `checkEventFlags`):** los flags viven en `player.eventFlags`
como enteros (0 = ausente). `requiresFlags` pasa si `flag ≥ valor`; `excludesFlags` bloquea si
`flag ≥ valor`. Gates `undefined` siempre pasan (los eventos/opciones existentes no se ven afectados).
La escritura es vía `setFlags` (sobrescribe al valor dado). Para un contador, escribe el valor
explícito que quieras (p.ej. `setFlags: { favor: 2 }`).

## 3. Reglas de oro

1. **Pesos suman 100** por choice. `rollOutcome` normaliza por el total igualmente, pero 100 es la
   convención legible y lo que asume la matemática de `clanBonus`.
2. **`riskLevel` acorde a la varianza.** `SAFE` = un outcome benigno de peso 100 o sin castigo real;
   `HIGH`/`EXTREME` = puede disparar combate o perder HP/objeto significativo. Nunca `SAFE` en un
   choice que pueda `triggerCombat`.
3. **Siempre `logMessage` + `logType`** (el tipo los exige; sin ellos no compila).
4. **Requisitos/costos legibles:** que el `description`/`hintText` telegrafíe el `minStat`, `costs` o
   el peligro. El jugador debe entender por qué ganó o perdió (pilar de VISION).
5. **Siempre una salida.** Deja al menos un choice `SAFE` de "marcharse/declinar" sin requisitos ni
   flags: el jugador conserva agencia, sin muertes injustas.
6. **Cadenas (`chainTo`):** apunta a un `id` real presente en `EVENTS`. El **eslabón final NO** lleva
   `chainTo` ni `triggerCombat`, para que la sala se cierre por el flujo normal
   (`handleEventOutcomeClose`). Persiste el estado de la historia con `setFlags` en el outcome que
   ramifica, y gatea las escenas siguientes con `requiresFlags`/`excludesFlags`.
7. **Efectos T-008 con trade-off legible** (pilar VISION + advisory de balance): no regales una skill
   dominante gratis con `grantSkillById`; `curse`/`removeRandomItem` deben venir con recompensa o
   contrajugada. El tuning fino de números queda para el topic de balance (T-012), no lo cierres aquí.
8. **`intelGain` solo cuenta en el outcome terminal** (el que cierra la sala). No lo pongas esperando
   efecto en un outcome con `triggerCombat` o `chainTo`.

## 4. Plantillas

Tres plantillas listas para copiar y tipar contra el modelo real (evento simple, cadena multi-escena
con flags, y evento gateado con `requiresFlags`/`excludesFlags`) están en
**`references/templates.md`**. Todas usan `import { GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types'`
como los archivos de arco reales. Léelo antes de escribir contenido nuevo.

## 5. Checklist de registro

1. Añade el objeto `GameEvent` al array del arco correcto:
   `WAVES_ARC_EVENTS` en `wavesArcEvents.ts`, `ACADEMY_ARC_EVENTS` en `academyArcEvents.ts`, etc.,
   o `GENERIC_EVENTS` (`genericEvents.ts`) si es de todos los arcos. Que `allowedArcs` case con el arco.
2. Los arrays de arco ya están **spread** en la constante agregadora `EVENTS` de
   `src/game/constants/index.ts` (**se llama `EVENTS`, NO `ALL_EVENTS`**). Añadir al array del arco
   basta; no hace falta registro extra **salvo** que crees un archivo de arco nuevo → entonces
   impórtalo y hazle spread en `EVENTS`.
3. **Cadenas:** el evento destino de `chainTo` debe existir en algún array spread en `EVENTS` (el
   lookup es `EVENTS.find`). Las restricciones de arco no bloquean el destino de una cadena (se busca
   por id directo), pero mantenlo en el mismo archivo de arco por cohesión.
4. Todo flag usado en `requiresFlags`/`excludesFlags` debe **escribirse** en algún `setFlags`, o nunca
   se activará.
5. Gates deterministas: `npx tsc --noEmit` (0 err) y `npm test` (verde). Las suites de
   `EventSystem.test.ts` cubren la resolución; no las rompas.

## 6. Errores comunes / YAGNI

- **No hay sistema de aliados/compañeros** — no inventes uno.
- **Pesos que no suman 100** — funciona pero es engañoso y descuadra `clanBonus`.
- **`effects.items` / `effects.skills`** están declarados en el tipo pero **`applyOutcomeEffects` NO
  los aplica** (solo alteran el texto de vista previa). Para dar un jutsu usa **`grantSkillById`**; hoy
  no hay ruta de outcome que otorgue objetos.
- **Olvidar registrar** un archivo de arco nuevo (no spread en `EVENTS`) → el evento nunca aparece.
- **Gatear TODOS los choices** sin fallback → hay una guarda anti-softlock que reabre la lista
  completa, pero depender de ella es un olor: deja siempre un choice sin gatear.
- **Cadena que nunca termina** (cada eslabón lleva `chainTo`) → la sala nunca se completa. Asegura un
  eslabón terminal sin `chainTo` ni `triggerCombat`.
- **`setFlags` tratado como incremento** — es sobrescritura (merge-asigna). Escribe el valor final.
- **`intelGain` en un outcome de combate/cadena** esperando que aplique — solo cuenta en el terminal.

## Notas de discrepancia (código real vs. brief)

Documentadas tal como están en el código (no se cambió código, es una skill de documentación):
1. El agregador se llama **`EVENTS`** (`src/game/constants/index.ts`), no `ALL_EVENTS`.
2. `effects.items` y `effects.skills` **no se aplican** en `applyOutcomeEffects`; la vía viva para dar
   una skill es `grantSkillById`.
3. `intelGain` se consume en `handleEventOutcomeClose` (cierre de sala), no en `applyOutcomeEffects`.
4. `GameEvent.rarity` **no** pondera la selección (aleatoria uniforme en `LocationSystem`).
5. `clanBonus` es hoy un **no-op**: `rollOutcome` escala todos los pesos del choice por el mismo
   `weightMultiplier` y renormaliza a 100, así que no altera las probabilidades relativas.

## Recursos del skill
- `references/templates.md` — evento simple, cadena multi-escena (`chainTo` + flags) y evento gateado,
  como TypeScript copiable que tipa contra el modelo real.
