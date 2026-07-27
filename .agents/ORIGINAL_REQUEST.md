# Original User Request

## 2026-07-22T13:51:59Z

# MISIÓN: Pulido profundo de la Región 1

Eres parte de un enjambre de agentes trabajando en paralelo sobre este juego en la ruta `C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower`.
Tu trabajo NO es añadir features nuevas. Tu trabajo es hacer que la primera región del juego sea impecable: es lo primero que ve un jugador nuevo y define si sigue jugando o lo abandona.

## FASE 1 — EXPLORA (obligatoria antes de tocar nada)
1. Recorre el código y los assets como si fueras un jugador que abre el juego por primera vez: pantalla inicial → tutorial/onboarding → primera región completa, hasta la transición a la región 2.
2. Lee el estado persistente del proyecto (docs, briefs, TODOs, issues) para entender qué se considera "terminado" y qué no.
3. NO asumas nada: verifica en el código real cómo se comporta cada cosa.

## FASE 2 — INVESTIGA Y ENCUENTRA TAREAS
Busca activamente problemas en estas categorías, por orden de prioridad:
1. **Roto**: bugs, crashes, estados inconsistentes, errores de consola, assets que no cargan, fallbacks visibles (placeholders, emojis de respaldo).
2. **Confuso**: cualquier punto donde un jugador nuevo no sabría qué hacer, feedback ausente o ambiguo, textos incoherentes o sin traducir.
3. **Feo/inconsistente**: desalineaciones, estilos que no casan entre sí, transiciones bruscas, ritmo visual pobre.
4. **Fricción**: pasos innecesarios, tiempos de espera, inputs que no responden como se espera.
5. **Pulido fino**: microinteracciones, sonido/animación faltante, detalles que elevan la sensación de calidad.

## FASE 3 — REGISTRA ANTES DE ARREGLAR
- Cada hallazgo se registra como tarea atómica en el archivo compartido de backlog (`region1-polish-backlog.md`): [categoría] [severidad] [archivo(s)] [descripción] [criterio de "hecho"].
- **Reclama** una tarea marcándola con tu ID de agente antes de trabajarla. Nunca trabajes una tarea reclamada por otro agente.
- Si una tarea es demasiado grande, divídela en subtareas atómicas.

## FASE 4 — ARREGLA
- Una tarea = un cambio pequeño, verificable y autocontenido.
- Prioriza siempre: Roto > Confuso > Feo > Fricción > Pulido.
- Verifica tu arreglo (build limpio, sin nuevos errores de consola, el criterio de "hecho" se cumple).
- Marca la tarea como completada con una nota de qué hiciste y cómo lo verificaste.

## REGLAS DEL ENJAMBRE
- Alcance estricto: SOLO la primera región. Si encuentras problemas fuera, regístralos en `out-of-scope.md` y no los toques.
- Cambios mínimos: no refactorices arquitectura salvo que sea la causa raíz de un bug de la región 1.
- Si dos agentes tocan el mismo archivo, el segundo espera o elige otra tarea.
- Loop: al terminar una tarea, vuelve a la FASE 2 y busca la siguiente. El trabajo termina cuando el backlog está vacío y una pasada completa de exploración no genera hallazgos nuevos.

## CRITERIO DE ÉXITO Y VERIFICACIÓN
- TypeScript (`npx tsc --noEmit`) y Vitest (`npm test`) ejecutan sin errores después de cada cambio.
- Un jugador que nunca ha visto el juego puede completar la Región 1 sin encontrar nada roto, sin confundirse nunca sobre qué hacer, y con la sensación de estar jugando algo terminado y profesional.

## 2026-07-23T10:57:01Z

Fix all failing tests, TypeScript compilation errors, build failures, lint errors, and simulation runtime issues in Shinobi Way: The Infinite Tower to ensure production quality.

Working directory: C:\Users\PC\workspace\SHINOBI-WAY-the-inifinite-tower
Integrity mode: development

## Requirements

### R1. Automated Test Suite & Type Safety Repair
- Execute the test suite (`npm test`) and TypeScript compiler check (`npx tsc --noEmit`).
- Fix all unit test failures, integration test failures, and TypeScript compilation errors across the codebase without changing intended business logic.

### R2. Simulation & Runtime Stability
- Run the simulation scripts (`npm run simulate:quick`, `npm run simulate:progression:quick`, `npm run simulate:campaign:quick`).
- Identify and resolve any unhandled exceptions, infinite loops, memory leaks, state desynchronizations, or runtime crashes encountered during simulations.

### R3. Build Verification & Code Quality
- Ensure clean production build execution (`npm run build`).
- Ensure CSS linting passes (`npm run lint:css`).

## Acceptance Criteria

### Automated Verification
- [ ] `npm test` executes and 100% of tests pass cleanly.
- [ ] `npx tsc --noEmit` completes with 0 errors.
- [ ] `npm run build` generates a production build without errors.
- [ ] `npm run simulate:quick` completes 100% of iterations without errors or crashes.
- [ ] `npm run lint:css` completes with 0 lint warnings/errors.

