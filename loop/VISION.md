# VISION — Loop de Desarrollo SHINOBI WAY

> Norte estático del loop. Lo cargan el maker y los 4 reviewers en cada pasada.
> Define "qué es bueno" en cada lente. **No** es un backlog — eso vive en `LOOP-TOPICS.md`.
> Editado por humanos. Si una mecánica viola un pilar, ese es motivo de score bajo.

## Pilares de producto

- **El juego es un roguelike de torre infinita por turnos** con jerarquía Region → Location → Room.
- **Toda decisión de combate debe tener trade-off legible**: el jugador entiende por qué ganó o perdió.
- **Profundidad sobre fricción**: añadir sistemas no debe aumentar clics sin sentido.
- **El jugador siempre conserva agencia**: no muertes "injustas" sin contrajugada posible.

## Pilares por lente

### ARQUITECTURA
- La lógica de juego vive en `src/game/systems/` y es **pura, sin React**.
- Combate separado en dos sistemas: `CombatCalculationSystem` (matemática pura) +
  `CombatWorkflowSystem` (estado/flujo). No mezclar.
- Usar **enums** de `PrimaryStat`/`DamageType`/etc., nunca string literals.
- Objetos **inmutables**: nuevos objetos con spread, nunca mutación directa.
- **Sin `any`**. Sin dead code: si reemplazas algo, borra lo viejo.
- Datos de balance en `src/game/constants/`, nunca hardcodeados en componentes.

### SISTEMA (mecánica / jugabilidad)
- Cada mecánica nueva debe estar **cableada y alcanzable** en el juego real (no dead code).
- El ciclo elemental (Fuego > Viento > Rayo > Tierra > Agua > Fuego) y los 4 tipos de daño
  (Physical, Elemental, Mental, True) se respetan.
- **Toda skill debe ser viable**: ninguna skill "muerta" (0 uso) ni dominante absoluta.
- Los efectos de estado (DoT, stun, shield, reflect, etc.) interactúan de forma predecible.
- Una mecánica nueva no debe romper las 8 suites de test existentes.

### PRESENTACIÓN (UI / UX)
- UI consistente con los patrones de `src/components/` y las escenas de `src/scenes/`.
- Estilo coherente con la dirección visual del proyecto (ver `docs/seinen-sublime-*`).
- Legibilidad primero: jerarquía visual clara, sin layout roto, sin texto cortado.
- Mockups de UI en estilo ASCII-box con iconos emoji (ver CLAUDE.md) cuando se diseñe.
- Feedback inmediato de las acciones (floating text, tooltips, animaciones donde aplique).

### BALANCE
- **Win rate** del jugador vs arquetipo BALANCED en ventana **45–65 %** (IC95% sin rozar extremos).
- **TTK** (`averageTurns`) en ventana **4–12** turnos: ni one-shot ni guerra de desgaste.
- **`damageEfficiency` > 1** en builds pensados como fuertes.
- **`chakraEfficiency`** sostenible: no quedarse sin recursos en peleas largas esperadas.
- **Sin skills muertas**: toda skill aparece en `skillUsageCount` por encima del piso.
- **Curva de progresión sin cliffs**: `levelBreakpoints` sin caída brusca de win rate entre niveles.
