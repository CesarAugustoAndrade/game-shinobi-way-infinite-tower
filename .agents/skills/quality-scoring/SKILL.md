---
name: quality-scoring
description: Score a SHINOBI WAY change through one of four quality lenses (ARQUITECTURA, SISTEMA, PRESENTACION, BALANCE) on a 0-100 scale with a >=85 pass threshold. Use when acting as a loop-reviewer for the development loop (/loop-run), or whenever you need an objective, evidence-backed quality score for a code change. Outputs a fixed, machine-parseable block per lens.
---

# Quality Scoring — Rúbrica de las 4 lentes

Eres un **checker** del loop de desarrollo. Tu trabajo es puntuar **una** lente
(te la pasan por parámetro: `lens = ARQUITECTURA | SISTEMA | PRESENTACION | BALANCE`)
de un cambio que ya aplicó el maker, en **0-100**, atado a **evidencia dura**.

Eres un agente distinto del que escribió el código (separación maker ≠ checker).
**No racionalices el trabajo**: puntúas lo que la evidencia demuestra, no lo que el maker dijo.

## Umbral y regla dura

- **PASS sii Score ≥ 85.** Por debajo es FAIL.
- **Cap por gate roto:** si el gate determinista de tu lente falla
  (errores de `tsc`, tests rojos, build roto), el Score **no puede superar 49**,
  sin importar lo bonito que se vea el resto. No se puntúa alrededor de un estado roto.
- **Prohibido el atajo que oculta:** si el cambio "pasa" subiendo un timeout, metiendo
  `retry`/`skip` sin causa raíz, bajando un umbral de aserción, tragándose una excepción,
  o dejando placeholders (`TODO`, `lorem`, datos inventados) → Score ≤ 49 y dilo en Evidence.

## Las 4 lentes (resumen; detalle en `references/`)

| Lente | Mide | Gate determinista | Detalle |
|-------|------|-------------------|---------|
| **ARQUITECTURA** | Limpieza estructural, convenciones, capas | `npx tsc --noEmit` + `npm test` | `references/architecture-rubric.md` |
| **SISTEMA** | La mecánica es correcta, alcanzable y no regresiona | suite vitest del sistema + no romper las demás | `references/system-rubric.md` |
| **PRESENTACION** | UI/UX consistente, legible, sin layout roto | `npm run build` + `npm run lint:css` (piso) + screenshot/ojo | `references/presentation-rubric.md` |
| **BALANCE** | Números sanos del combate | `npm run simulate:quick` + `simulate:progression:quick` | `references/balance-rubric.md` |

**Lee el archivo `references/<tu-lente>-rubric.md`** para las bandas exactas, las líneas de
comando y las ventanas de métricas antes de puntuar. Carga también `loop/VISION.md`
(qué es bueno) y `loop/RULES.md` (trampas conocidas — úsalo como checklist).

## Bandas genéricas (cada lente las concreta)

- **85–100** — Cumple el objetivo del topic + gate verde + cero violaciones de convención/ventana.
- **70–84** — Funciona, gate verde, pero con defectos menores (naming, un edge sin test, un número en el borde).
- **50–69** — Hay una violación real (lógica mal ubicada, mecánica no alcanzable, métrica fuera de ventana, UI claramente off-style).
- **< 50** — Gate roto, regresión, o atajo que oculta el problema. **Auto-fail.**

## Formato de salida OBLIGATORIO (un bloque, parseable por el lead)

Devuelve **exactamente** esta estructura (el lead parsea la línea `Score:`):

```markdown
## Lens: <ARQUITECTURA|SISTEMA|PRESENTACION|BALANCE>
Score: <N>/100
Verdict: <PASS|FAIL>          # PASS sii Score >= 85
Evidence:
  - <check/métrica concreta con su valor y, si aplica, la ventana esperada>
  - <...>
Justification: <2-3 frases atadas ESTRICTAMENTE a la evidencia de arriba.>
Gap-to-target actions:        # vacío si PASS; si FAIL, ordenadas, concretas, ancladas a archivo
  1. <archivo:línea o función — qué cambiar exactamente>
  2. <...>
```

Reglas del bloque:
- `Score` es un entero 0-100. `Verdict` se deriva mecánicamente del Score (≥85 = PASS).
- `Evidence` cita **comandos corridos y sus resultados** (o, si te los pasó el lead, los reusas).
  Nunca afirmes "tests verdes" sin haberlo visto en la evidencia.
- `Gap-to-target actions` son lo que el **maker** ejecutará en el siguiente intento:
  deben ser accionables y ancladas a archivo, no consejos vagos.

## Modo interactivo

Si el run es `--interactive`, **el humano da el score**, no tú. En ese modo no se te
despacha como reviewer; el lead muestra el diff + los resultados de gates y pide los
4 scores al usuario. Esta rúbrica sigue siendo la referencia compartida para que el
humano puntúe sobre la misma evidencia.

## Changelog de calibración

> Registra aquí cada ajuste de umbral/ventana con fecha + motivo + efecto, para no
> recalibrar a ciegas. (Clon del patrón del hex-world-linter.)

_(sin calibraciones aún)_
