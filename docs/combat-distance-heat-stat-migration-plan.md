# Plan integrado: stats, distancia y HEAT

Estado: especificación acordada, todavía sin implementar.

**Backlog de commits (checklist por archivo):** [`combat-distance-heat-stat-migration-backlog.md`](./combat-distance-heat-stat-migration-backlog.md)

## Resumen y orden de implementación

1. **Migrar stats primero.** Es el contrato base de daño, recursos, enemigos, requisitos, equipo, entrenamiento, eventos y simulaciones. No deben convivir valores antiguos y nuevos.
2. **Implementar distancia después.** Se apoya en SPD, AP, skills, IA, aproximaciones y previews ya rebalanceados.
3. **Añadir HEAT al final.** Consume aproximaciones, distancia inicial, generación del EXIT, enemigos y resolución encadenada de combates.
4. **Cerrar con balance e integración.** Ajustar constantes centrales hasta alcanzar 4–6 turnos normales, 7–10 élites y 10–14 bosses.

Cada fase debe compilar antes de pasar a la siguiente, pero la migración de stats debe entregarse completa: tipos, fórmulas, contenido, enemigos y UI no pueden quedar temporalmente en escalas distintas.

## 1. Migración completa de stats

### Inicio y progresión

- Todas las stats comienzan en `1`, excepto las dos afinidades del clan, que comienzan en `3`:
  - Uzumaki: `WILLPOWER` y `CHAKRA`.
  - Uchiha: `SPIRIT` y `DEXTERITY`.
  - Hyūga: `ACCURACY` y `DEXTERITY`.
  - Lee: `STRENGTH` y `SPEED`.
  - Yamanaka: `INTELLIGENCE` y `CALMNESS`.
- Eliminar `CLAN_GROWTH` y los helpers duplicados de subida de nivel.
- Cada nivel concede exactamente un punto que puede asignarse a cualquiera de las nueve stats.
- Añadir `unspentStatPoints` al jugador. Si se ganan varios niveles de una vez, se acumulan esos puntos únicamente hasta resolver el modal obligatorio.
- El modal no se puede cancelar ni cerrar dejando puntos pendientes. Al confirmar todos los puntos se recalculan los máximos y se rellenan completamente HP y Chakra.
- El flujo de recompensa será: resolver y mostrar recompensa combinada → repartir puntos pendientes → aplicar curación completa → continuar a loot o exploración.
- Las stats primarias no tienen límite duro. Los resultados porcentuales usan curvas de rendimiento decreciente.
- Buffs y debuffs de stats pasan a enteros `±1/±2`; una stat efectiva nunca baja de `1`.

### Fórmulas directas

| Resultado | Fórmula |
|---|---|
| HP máximo | `100 + 25 × WILLPOWER` |
| Chakra máximo | `30 + 15 × CHAKRA` |
| Defensa plana | `1 × STR/SPIRIT/CALMNESS` según el tipo de daño |
| Defensa porcentual | `stat / (stat + 18)`, máximo 65% |
| Impacto | `clamp(60, 98, 90 + 6 × (stat atacante − SPEED defensor))` |
| Iniciativa | `10 + 5 × SPEED` |
| AP | `min(9, 3 + floor((SPEED − 1) / 2))` |
| Crítico | `5% + 50% × DEX/(DEX+12)`, máximo 55% |
| Resistencia de estados | `60% × CALMNESS/(CALMNESS+12)` |
| Guts | `30% × WILLPOWER/(WILLPOWER+18)` |
| Regeneración de Chakra | `1 + 2 × INTELLIGENCE` |
| Regeneración de HP | `max(1, floor(maxHP × (0.01 + 0.04 × WILL/(WILL+10))))` |

- MELEE usa SPEED para impacto; RANGED usa ACCURACY; AUTO impacta automáticamente.
- Eliminar la segunda tirada separada de evasión. SPEED defensiva solo interviene una vez en la probabilidad de impacto.
- Aplicar primero defensa plana y después defensa porcentual.
- Los bonuses planos de equipo se suman después de la fórmula base; los porcentuales respetan los caps derivados.

### Contrato de daño y catálogo de skills

- Sustituir `Skill.damageMult` por `baseDamage` y `scalingPerPoint`.
- Daño crudo: `baseDamage + scalingPerPoint × effectivePrimary[scalingStat]`.
- Presupuesto de daño esperado con stat `3`:
  - Basic: `18`.
  - Advanced: `26`.
  - Hidden: `36`.
  - Forbidden: `48`.
  - Kinjutsu: `64`.
- Reparto orientativo obligatorio por identidad:
  - Basic: 60% base / 40% escalado.
  - Advanced y Hidden: 50% base / 50% escalado.
  - Forbidden y Kinjutsu: 30% base / 70% escalado.
- Modificadores del presupuesto:
  - Multi-hit divide el daño total entre todos sus impactos.
  - Una técnica de daño con control fuerte reduce su presupuesto 20%.
  - AP 1 reduce 20%; AP 2 es baseline; AP 3 aumenta 25%.
  - Cooldown de cuatro o más turnos aumenta 15%.
  - Sacrificio relevante de HP aumenta 20%; los aumentos positivos se limitan a +40% acumulado.
- Las técnicas puramente utilitarias usan `baseDamage: 0` y `scalingPerPoint: 0`.
- Convertir los costes de Chakra a bandas por tier: `0–5`, `5–10`, `10–15`, `15–25`, `25–35`.
- Los sacrificios de HP deben soportar coste plano, porcentaje del máximo o `ALL` mediante un enum/tipo explícito.
- Reaper Death Seal deja de usar `damageMult: 999` y `hpCost: 9999`; pasa a un efecto explícito de KO mutuo.
- Reautorizar los requisitos de skills: Basic `1`, Advanced `2`, Hidden `3`, Forbidden `5`, Kinjutsu `7`.
- Reautorizar checks de eventos con la escala narrativa `1/2/3/5/7/9`: base, entrenado, especialista, experto, maestro y legendario.

### Equipo, entrenamiento y enemigos

- Cada componente aporta `+1` a su stat.
- Un artefacto conserva la suma de puntos de sus componentes y puede añadir como máximo `+1` temático adicional.
- Entrenamiento normal da `+1`.
- Cada sala de entrenamiento tiene `5% × Danger` de mejorar una única oferta a `+2`; esa oferta cuesta ×2.5. Las otras dos continúan en `+1`.
- Eliminar el crecimiento multiplicativo de stats enemigas. Usar bases pequeñas y presupuesto aditivo:
  - `budget = (Danger − 1) + floor(locationsCleared / 2) + round((difficulty − 40) / 20) + rankBonus`.
  - `rankBonus`: Normal `0`, Ambush `1`, Elite `3`, Guardian `4`, Boss `7`.
  - Un presupuesto positivo se reparte cíclicamente por las prioridades del arquetipo.
  - Un presupuesto negativo retira puntos en orden inverso sin bajar ninguna stat de `1`.
- Bases de arquetipo:
  - Tank: WILL/STR `3`, CAL `2`, resto `1`.
  - Assassin: SPD/DEX `3`, STR/ACC `2`, resto `1`.
  - Caster: CHA/SPI `3`, INT `2`, resto `1`.
  - Genjutsu: INT/CAL `3`, CHA/SPI `2`, resto `1`.
  - Balanced: todas en `2`.
- El escalado enemigo nunca mira stats o nivel actuales del jugador; depende de Danger, avance global, dificultad y rango para evitar rubber-banding.
- Migrar también pasivas, eventos, aproximaciones, bosses, ayudas, etiquetas visuales de stats, presets y simuladores. Borrar las fórmulas y escalas antiguas reemplazadas.

## 2. Distancia de combate

### Tipos y reglas base

- Añadir enums `CombatRange.CLOSE`, `CombatRange.MEDIUM` y `CombatRange.LONG`.
- Añadir enums/tipos para dirección de movimiento, sujeto que se mueve, triggers de movimiento y efectos de control de rango.
- Defaults según `AttackMethod`:
  - MELEE: solo `CLOSE`.
  - RANGED: `MEDIUM` y `LONG`.
  - AUTO: las tres bandas.
  - `Skill.allowedRanges` permite excepciones explícitas.
- La distancia solo habilita o bloquea skills. No aporta modificadores globales de daño, crítico o precisión.

### Movimiento y AP

- Movimiento voluntario: una banda, una vez por turno y coste base de 1 AP.
- No existe tirada enfrentada, fallo de movimiento ni ataque de oportunidad automático.
- Jugador y enemigo calculan AP con la misma fórmula y sufren los mismos costes de terreno y sobrecostes de zonas.
- El enemigo continúa limitado a una skill por turno. Puede mover una banda y atacar si conserva AP suficiente para la skill elegida.
- La IA prioriza una skill válida y asequible en la banda actual; si no existe, busca una skill alcanzable con un movimiento; si tampoco puede pagarla, se mueve hacia su rango preferido y usa Guard.
- `PUSH` y `PULL` desplazan exactamente una banda, no pagan AP y no consumen el movimiento voluntario.
- Un desplazamiento forzado activa reacciones salvo que el efecto declare `safeMovement`. En `CLOSE`/`LONG`, intentar sobrepasar el límite no mueve ni dispara reacciones.
- Los sobrecostes de AP se suman. Si el actor no puede pagar el coste total, la acción de movimiento queda bloqueada.
- Crear una definición reutilizable para que futuras skills, buffs o pasivas de ítems puedan:
  - Reaccionar cuando uno mismo o el rival se acerca o se aleja.
  - Añadir coste de AP.
  - Infligir daño con `baseDamage`, `scalingPerPoint`, stat y tipo de daño declarados.
- En esta entrega se implementa la infraestructura, pero ninguna skill o ítem existente se adapta todavía a estas reacciones.

### Distancia inicial

- Resultado exitoso de aproximación:
  - Frontal Assault: `MEDIUM`.
  - Silent Strike: `CLOSE`.
  - Genjutsu Setup: `LONG`.
  - Environmental Trap: `LONG`.
  - Iron Guard: `MEDIUM`.
  - Shadow Passage evita el combate; su fallo favorece al enemigo.
- Cada enemigo declara o deriva un rango preferido:
  - Tank/Assassin: `CLOSE`.
  - Caster/Genjutsu: `LONG`.
  - Balanced: `MEDIUM`.
  - Bosses y enemigos especiales pueden sobrescribirlo.
- La IA, telegraph, simulación automática, cards y previews deben usar las mismas funciones puras de rango y daño.
- La UI muestra banda actual, controles de movimiento, coste final, rangos permitidos y motivo de bloqueo de una card.

## 3. HEAT por visita

### Estado, visualización y autoría

- Guardar `heat: number` y `hunterArmed: boolean` en el estado runtime de la Location/`BranchingFloor`.
- HEAT comienza en `0`, se limita a `0..100` y se reinicia al salir y al revisitar. No pertenece a la progresión persistente.
- `hunterArmed` se activa al tocar `100` y no vuelve a `false` durante esa visita aunque HEAT baje.
- Tiers visibles:
  - `QUIET`: 0–24.
  - `SUSPICIOUS`: 25–49.
  - `ALERT`: 50–74.
  - `HUNTED`: 75–100.
- Mostrar siempre tier y cifra exacta. En 100 añadir el estado explícito `HUNTER ARMED`.
- HEAT no cambia durante turnos de combate y ninguna card lo modifica en esta versión.
- Solo se aplican deltas declarados por contenido. No hay incremento automático por tiempo, sala visitada, victoria o número de turnos.
- Presets de autoría: `0`, `±5`, `±10`, `±20`, `+30`.
  - Recompensa pequeña: `+5`.
  - Recompensa valiosa: `+10`.
  - Gran recompensa: `+20`.
  - Jackpot: `+30`.
  - El camino obligatorio debe quedar normalmente en `0`.
- Añadir deltas explícitos a entrada de room, actividad, oferta de entrenamiento, recompensa de tesoro, bendición/rito, aproximación y `EventOutcome.effects` cuando corresponda. Los casos neutros llevan `0` intencional.
- Auditar todo el contenido existente relevante, no solo añadir infraestructura.
- La UI muestra el delta exacto si es determinista. En eventos ponderados muestra mínimo–máximo y avisa si algún resultado puede cruzar un umbral.
- Deltas por fallo de aproximación:
  - Frontal/Iron: `+5`.
  - Terrain Trap/Genjutsu: `+10`.
  - Silent Strike: `+15`.
  - Shadow Passage: `+20`.
  - Los éxitos no añaden HEAT por sí mismos.

### Penalizaciones y distancia inicial

| Aproximación | 25–49 | 50–74 | 75–100 |
|---|---:|---:|---:|
| Iron Guard | 0 | −5 | −15 |
| Frontal Assault | 0 | −10 | −20 |
| Environmental Trap | −5 | −15 | −30 |
| Genjutsu Setup | −5 | −20 | −35 |
| Silent Strike | −10 | −25 | −45 |
| Shadow Passage | −15 | −30 | −50 |

- Las penalizaciones son puntos porcentuales aplicados después de calcular la probabilidad normal y antes del clamp final.
- HEAT 0–49 no altera la banda obtenida por una aproximación exitosa.
- HEAT 50–74 desplaza la banda inicial una posición hacia el rango preferido enemigo.
- HEAT 75–100 impone el rango preferido enemigo.
- Un fallo de aproximación siempre usa el rango preferido enemigo.

### Élites encadenados y Cazador

- Tras cualquier combate Normal dentro de una Location, incluidos los iniciados por eventos:
  - HEAT 0–49: 0%.
  - HEAT 50–74: 25%.
  - HEAT 75–99: 50%.
  - HEAT 100: 0%; la amenaza se concentra en el Cazador.
- Excluir tutoriales, Elite Challenge, Guardian, Cazador y bosses.
- La tirada se realiza tras aplicar cualquier delta autorado del resultado y antes de pagar recompensas o completar la actividad.
- La élite es un segundo combate nuevo. Persisten HP, Chakra y rasgos persistentes ajenos al combate; se reinician mano, mazo, postura, cooldowns y estados temporales.
- Introducir una transacción `EncounterChain` o equivalente que retenga XP, Ryō, intel, loot, puntos de nivel y finalización de actividad.
- No pagar, curar, subir de nivel ni marcar la actividad como completada entre ambos combates.
- Si se vencen ambos, sumar recompensas en un único modal. El multiplicador de aproximación solo afecta al primer combate; la élite calcula su recompensa con su propio contexto.
- Al armarse el Cazador:
  - Si el EXIT ya existe y no fue derrotado, sustituir inmediatamente su Guardian de forma inmutable.
  - Si no existe, respetar el mínimo de salas y sumar `+40` puntos porcentuales a la probabilidad normal de EXIT.
  - Mantener el cap actual de 90% y el force-exit actual.
  - El bonus de salida persiste aunque HEAT baje porque depende de `hunterArmed`.
- El Cazador parte del Guardian y aplica ×1.75 HP y ×1.35 daño, comienza en su rango preferido, entrega doble XP/Ryō y garantiza un artefacto.

## 4. Contratos públicos previstos

- `Player.unspentStatPoints`.
- `Skill.baseDamage`, `Skill.scalingPerPoint`, `Skill.allowedRanges?` y coste de HP tipado.
- `CombatRange`, direcciones/triggers de movimiento, `PUSH`, `PULL` y definición de control de rango.
- `CombatState`: distancia actual, movimiento usado por cada actor, AP enemigo y controles de rango activos.
- `Enemy`: rango/rango preferido, arquetipo tipado y modificadores especiales de HP/daño/recompensa.
- `ApproachEffects`: banda inicial y delta HEAT.
- `BranchingFloor`: `heat` y `hunterArmed`.
- Actividades, ofertas y resultados de eventos: delta HEAT explícito.
- `HeatTier` y presets numéricos de HEAT como enums TypeScript; no usar string literals para estos dominios.

## 5. Verificación y aceptación

- Mantener cálculos, movimiento, HEAT, cadena de encuentros y generación en `src/game/systems/`, sin React ni DOM.
- React solo representa estado y despacha resultados; las actualizaciones deben ser inmutables.
- Cualquier logging nuevo debe vivir en archivos de logging separados.
- No crear archivos ni casos unitarios nuevos. Ajustar únicamente fixtures/assertions existentes afectados por contratos eliminados.
- Ejecutar:
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm test`
  - `npm run simulate:quick`
  - `npm run simulate:progression`
- Verificación manual mínima:
  - Los cinco clanes comienzan con el reparto correcto.
  - Subida múltiple bloquea la continuación, reparte todos los puntos y cura después.
  - AP escala hasta 9 y respeta terreno.
  - Entrenamiento +2 aparece como máximo una vez por sala y cobra ×2.5.
  - Defaults y overrides de rango, movimiento jugador/enemigo y PUSH/PULL.
  - Cards, telegraph, preview y auto-combat coinciden con la resolución real.
  - Los cuatro umbrales HEAT, deltas, reset y latch funcionan en límites exactos 24/25, 49/50, 74/75 y 99/100.
  - La cadena élite no paga ni cura entre encuentros.
  - EXIT ya generado se convierte al armar el Cazador; EXIT no generado recibe +40 después del mínimo.
- Objetivo de duración: Normal 4–6 turnos, Elite 7–10 y Boss/Hunter 10–14, sin builds incapaces de actuar por rango o AP.
- Actualizar `docs/FORMULAS.md`, ayudas internas y `CHANGELOG.md` bajo `[Unreleased]` antes del commit de implementación.

---

# Contexto para el siguiente agente

## Estado real encontrado en el repositorio

- La rama activa es `develop`.
- Antes de redactar este plan, `npx tsc --noEmit` estaba limpio.
- No se ha implementado ninguna parte de este plan.
- No existe un sistema general de guardado de la run que requiera migración de partidas. El estado nuevo puede inicializarse directamente al crear jugador y `BranchingFloor`.
- El worktree ya contiene muchos cambios ajenos, principalmente regeneración de arte de skills/componentes, además de cambios en `CHANGELOG.md` y manifests. Son cambios del usuario u otros agentes: no revertirlos, no limpiarlos y no incluirlos accidentalmente en un commit de esta feature.

## Puntos de integración que no se deben pasar por alto

- `src/game/types.ts` concentra Player, Enemy, Skill, PrimaryAttributes, efectos, aproximaciones, eventos, actividades, Location y `BranchingFloor`.
- `src/game/systems/StatSystem.ts` sigue siendo el cálculo vivo de daño y derivados. `CombatCalculationSystem` aún no contiene todo el pipeline; al migrar, debe haber una única fuente pura compartida por combate, preview, IA y simulación.
- La subida viva está en `LevelSystem`, pero `entities/Player.ts` conserva helpers legacy y mutables. Deben eliminarse al sustituirlos.
- Las stats iniciales y `CLAN_GROWTH` están en `src/game/constants/index.ts`.
- El catálogo de skills está centralizado en `src/game/constants/skills.ts`; contiene unos 180 `damageMult`, costes antiguos, requisitos altos y el sentinel de Reaper Death Seal.
- `EnemySystem` usa actualmente stats base grandes y escalado multiplicativo por Danger, `locationsCleared`, dificultad y factores extra de HP/daño. Debe reemplazarse como una unidad.
- El combate está dividido entre `CombatWorkflowSystem`, `PlayerTurnSystem`, `EnemyTurnSystem`, `EnemyAISystem` y `combat-types`. Mantener esa separación: matemáticas puras frente a workflow/turnos.
- `useCombat` crea el estado de combate, aplica terreno al AP y orquesta turnos. Actualmente el enemigo no tiene economía de AP equivalente.
- `SkillCard`, `Hand` y previews de combate duplican parte de los modificadores vivos; distancia y el nuevo daño deben consultar funciones compartidas para evitar divergencias.
- Las aproximaciones viven en `src/game/constants/approaches.ts` y se resuelven en `ApproachSystem`. Sus requisitos, probabilidades, costes, iniciativa y buffs están en la escala antigua.
- `LocationSystem` genera dinámicamente el árbol, actividades, entrenamiento, Guardian y EXIT. El mínimo actual es `max(3, 2 + dangerLevel)`; después usa 25% base, +5% por room, bonus de intel/terreno, cap 90% y force-exit tras cinco rooms extra.
- El runtime de una visita está en `BranchingFloor`; por eso HEAT debe vivir allí y no en la definición persistente de `Location`.
- El EXIT ya contiene un Guardian mejorado generado en `configureAsExitRoom`. El upgrade a Cazador debe funcionar tanto antes como después de que ese room haya sido creado.
- `useCombatVictory` actualmente marca la actividad, aplica XP/Ryō/intel, ejecuta level-up, genera loot y abre `RewardModal` inmediatamente. Para la emboscada HEAT hay que refactorizarlo a una transacción de encuentro antes de introducir la segunda pelea.
- Existen caminos separados de auto-combat y auto-elite. Deben respetar distancia, AP enemigo, cadena de recompensa y HEAT igual que el combate interactivo.
- `ACTIVITY_ORDER` ya permite `combat` seguido de `eliteChallenge`, pero la élite HEAT es una consecuencia dinámica del combate y no debe confundirse con el Elite Challenge autorado de una room.

## Acoplamientos de la escala antigua

- Equipo y artefactos tienen bonuses primarios que llegan aproximadamente a `+17`.
- Training gana actualmente `1 + floor(effectiveFloor/10)` y puede entregar `+2/+3` de forma ordinaria.
- Requisitos de skills llegan aproximadamente a `28`; checks de eventos hasta `40`; aproximaciones hasta `30`.
- Enemigos usan bases alrededor de `6–22` y bosses alrededor de `15–40` antes de multiplicadores.
- AP usa actualmente `3 + floor(SPEED/10)`.
- Buffs porcentuales se redondean al modificar primarias; con stats 1–3 muchos quedarían en cero si no se reautoran.
- Simuladores, presets de builds, help text, rank badges y pruebas existentes contienen valores hardcoded de la escala antigua.

## Restricciones de implementación

- Seguir `AGENTS.md`: enums TypeScript, actualizaciones inmutables, lógica pura en `src/game/systems/`, logging separado y eliminación de legacy al reemplazar.
- No crear unit tests nuevos salvo nueva instrucción explícita del usuario.
- No empezar HEAT encadenado parcheando únicamente el modal: primero separar cálculo/buffer de recompensa de su aplicación definitiva.
- No conservar aliases silenciosos de `damageMult`, `CLAN_GROWTH`, evasión doble o helpers legacy una vez migrados; el plan exige una sustitución real.
- No aplicar conversiones ocultas tipo “stat 1 equivale a stat antigua 10” durante runtime. La escala nueva consume directamente el valor visible.
- Mantener Danger como fuerza del enemigo y HEAT como preparación/alerta. HEAT no aumenta las stats de encuentros ordinarios.
- HEAT es principalmente un medidor de codicia: recompensas opcionales lo elevan; recorrer rooms por sí solo no debe convertirlo en un temporizador inevitable.

## Decisiones ya cerradas

- No pedir de nuevo las parejas de clan, fórmulas base, AP máximo, duración objetivo, tiers HEAT, probabilidades de emboscada, comportamiento del Cazador ni orden de implementación.
- No hay bonus global de daño por distancia.
- No hay movimiento disputado ni ataques de oportunidad base.
- No se adaptan todavía skills/ítems existentes a las nuevas reacciones de rango.
- HEAT no cambia dentro de los turnos de combate.
- HEAT 100 desactiva élites encadenados y reserva la amenaza para el Cazador.
- La salida recibe +40 solo después de cumplir el mínimo de rooms; no se garantiza ni aparece antes de ese mínimo.
- Entre combate normal y élite solo continúan recursos y rasgos persistentes ajenos al combate.

