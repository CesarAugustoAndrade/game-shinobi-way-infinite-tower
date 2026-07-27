---
name: brainstorming
description: "Skill para realizar sesiones estructuradas de lluvia de ideas (brainstorming) sobre mecánicas, balance, diseño de juego o arquitectura en Shinobi Way."
---

# SKILL: Brainstorming (Lluvia de Ideas)

Esta skill guía al agente para facilitar sesiones de brainstorming estructuradas y creativas con el usuario sobre cualquier aspecto del proyecto (mecánicas, diseño, balance, refactorización o bugs).

## Metodología de Brainstorming

Cuando esta skill se active, sigue este proceso en 4 fases:

### 1. Definición del Foco y Restricciones
- Identifica claramente el problema o meta (ej. "diseñar un nuevo Jutsu", "balancear una Región").
- Define las restricciones críticas (ej. "no añadir dependencias de React a los sistemas de juego", "mantener compatibilidad con TypeScript").

### 2. Divergencia (Generación de Propuestas)
Presenta de 3 a 5 propuestas distintas agrupadas por enfoques o filosofías:
- **La Directa / Clásica**: La solución obvia o estándar de la industria.
- **La Innovadora / Temática**: Aprovecha al máximo la ambientación (Naruto / Mundo Shinobi).
- **La Minimalista / Elegante**: Menos código, menor coste de mantenimiento y mayor legibilidad.
- **La Salvaje / Out of the Box**: Idea arriesgada pero con alto potencial de diversión.

*Para cada propuesta, incluye un nombre evocador y un resumen corto de 2 líneas.*

### 3. Evaluación Comparativa
Presenta una tabla o lista de pros y contras evaluando:
- **Complejidad de Integración** (Alineación con la arquitectura pura del juego en `/game/systems/`).
- **Impacto en el Balance** (Cómo interactúa con `StatSystem` o `CombatCalculationSystem`).
- **Esfuerzo de Implementación**.

### 4. Preguntas de Afinación (Feedback)
Haz 2 o 3 preguntas concisas al usuario para decidir el camino a seguir. Recomienda el uso del comando `/grill-me` si las decisiones de diseño son complejas y requieren una entrevista guiada.

## Optimización de Tokens
- Mantén las respuestas sintéticas sin rodeos narrativos.
- Presenta las propuestas en tablas de alto nivel en lugar de redactar grandes bloques de código hipotético antes de la selección del usuario.

