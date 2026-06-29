# Rúbrica — PRESENTACIÓN (UI / UX)

**La lente menos determinista.** Por encima del piso de build es juicio visual. Por eso
**para topics de presentación se recomienda el modo `--interactive`** (que el humano puntúe).
En modo auto, apóyate en screenshot.

## Gate determinista (piso)

```bash
npm run build          # debe compilar el bundle sin error
npm run lint:css       # stylelint sobre src/**/*.css debe pasar
```

Si el build falla o el layout queda roto → **Score ≤ 49**.

## Verificación visual (por encima del piso)

- **Auto:** tomar screenshot del estado afectado. Con el dev server vivo (`npm run dev`,
  http://localhost:3010/), usar Playwright o claude-in-chrome para navegar a la pantalla
  relevante y capturar. Comparar contra los patrones de `src/components/` y `src/scenes/`.
- **Interactivo:** el humano mira la pantalla y da el score.

## Checklist

- [ ] **Consistencia**: usa los patrones/clases existentes de su dominio
      (combat/, exploration/, inventory/, character/, modals/, layout/, shared/).
- [ ] **Estilo**: coherente con la dirección visual (`docs/seinen-sublime-*`).
- [ ] **Legibilidad**: jerarquía clara, contraste suficiente, nada de texto cortado.
- [ ] **Integridad de layout**: no se rompe ni desborda en el tamaño objetivo.
- [ ] **Feedback**: la acción da respuesta visible (floating text / tooltip / animación) donde aplique.

## Bandas

| Score | Criterio |
|-------|----------|
| **85–100** | Build limpio + screenshot muestra UI pulida, on-style y consistente, sin romper layout. |
| **70–84** | Build OK pero **visuales rugosos**: espaciado/contraste/alineación mejorables. |
| **50–69** | Funcional pero **claramente off-style** o apretado/inconsistente con el resto. |
| **< 50** | Build falla o **layout roto**. **Auto-fail.** |

## Nota de confianza
Indica SIEMPRE en `Justification` que la presentación es la lente de **menor confianza
del reviewer automático**. Si no pudiste tomar screenshot, dilo en Evidence y sé conservador.

## Evidence a citar
- Resultado de `npm run build` y `npm run lint:css`.
- Si hubo screenshot: qué muestra (consistencia/legibilidad/layout). Si no: dilo explícito.
