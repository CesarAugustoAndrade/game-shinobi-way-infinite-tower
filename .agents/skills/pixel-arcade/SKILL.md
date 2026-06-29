---
name: pixel-arcade
description: >-
  Transforma una UI web existente a estilo PIXEL-ARCADE retro (fuentes de píxeles, botones y
  ventanas "blocky" con sombra dura sin blur, look neobrutalista de cabina arcade) SIN tocar el
  contenido pintado/fotográfico. Úsalo siempre que el usuario pida "estilo pixel", "pixel art UI",
  "retro/arcade", "neobrutalista", "look 8-bit/16-bit", "hard shadow buttons", o muestre una
  referencia con tipografía de píxeles y tarjetas de borde grueso + sombra sólida. Aplica a
  botones, ventanas/paneles/tarjetas y tipografía; mantiene el arte ilustrado intacto.
---

# Pixel-arcade UI

Convierte el **chasis** de una UI (tipografía, botones, ventanas) a un look retro de píxeles
manteniendo el **contenido** (arte ilustrado, fotos, sprites, retratos) tal cual. Regla de oro:
**el marco es arcade, el contenido es heroico.** El pixel-art va en el chrome, no aplasta el arte.

## Por qué este reparto
El encanto pixel-arcade vive en tres cosas concretas y repetibles: una **tipografía de píxeles**,
**botones blocky con sombra dura** (sin blur, desplazada) y **ventanas de borde grueso** con la
mismo sombra. Todo lo demás (color, arte) se conserva. Si conviertes también el arte a pixel
"de oficio", normalmente pierdes calidad; déjalo y deja que contraste con el marco retro.

## Antes de empezar: ORIENTA
1. **Mira la referencia** si la hay. Identifica: ¿fondo claro (neobrutalismo clásico) u oscuro?
   ¿la fuente es monoespaciada de píxeles o gruesa de títulos? ¿qué radio de esquina (0–4px)?
2. **Localiza el sistema de tokens** de la UE (variables CSS `:root`, Tailwind config, theme file).
   Cambiar fuentes y sombras desde tokens propaga a todo; editar componentes sueltos no escala.
3. **Decide 2 cosas con el usuario si no están claras** (cambian todo el resultado):
   - **Fuente**: ver tabla abajo. Por defecto recomienda el par Silkscreen + VT323.
   - **Paleta**: mantener la actual (más seguro, protege el arte) vs adoptar la de la referencia.

## Las 3 transformaciones

### 1. LETRAS — fuente de píxeles (vía tokens)
Carga las fuentes (Google Fonts `@import`/`<link>`) y **cambia los tokens de familia**, nunca
reescribas componente a componente. Par recomendado (cubre títulos gruesos + cuerpo legible):

| Rol | Fuente | Por qué |
|---|---|---|
| Títulos / botones / chrome | **Silkscreen** (400/700) | pixel grueso, lee como cabina arcade |
| Cuerpo / stats / números | **VT323** (mono) | pixel monoespaciada, legible a tamaño pequeño |

Alternativas: `Pixelify Sans` (pixel con pesos, más redonda, NO mono), `DotGothic16` (mono, soporta
más idiomas), `Press Start 2P` (muy 8-bit pero ocupa MUCHO y cansa en cuerpo → solo títulos cortos).

Gotchas:
- **VT323 es de un solo peso y diseñada para tamaños grandes.** A 10–12px puede quedar pequeña;
  sube 1–2px la escala base o usa pesos mayores en Silkscreen para jerarquía.
- Las fuentes pixel **no necesitan** `image-rendering:pixelated` (eso es para imágenes/sprites).
- Si el cuerpo lleva mucha tabla/stats densos, valida legibilidad antes de comprometerte.

### 2. BOTONES — bloque sólido + sombra DURA
El gesto clave: relleno sólido, borde marcado, **sombra sin blur desplazada** (`Npx Npx 0 0 color`),
y al pulsar el botón **se hunde hacia la sombra** (`translate` + sombra menor). NUNCA `box-shadow`
con blur en un botón pixel.

```css
button {
  font-family: var(--font-display);   /* Silkscreen */
  font-weight: 700; letter-spacing: .02em;
  background: var(--accent);           /* relleno sólido */
  color: #fff;
  border: 2px solid var(--frame);      /* borde que define el bloque */
  border-radius: 3px;                  /* 0–4px: esquinas casi rectas */
  padding: 9px 18px; cursor: pointer;
  box-shadow: 4px 4px 0 0 var(--hard);  /* DURA, sin blur */
  transition: transform .12s, box-shadow .12s, background .2s;
}
button:hover  { transform: translate(-1px,-1px); box-shadow: 6px 6px 0 0 var(--hard); }
button:active { transform: translate(3px,3px);  box-shadow: 1px 1px 0 0 var(--hard); }  /* se hunde */
button.secondary { background: var(--surface); color: var(--ink); box-shadow: 3px 3px 0 0 var(--hard); }
```

El "botón seleccionado" de la referencia = relleno de acento (azul) sólido, mismo borde y sombra.

### 3. VENTANAS — paneles/tarjetas con borde grueso + sombra dura
Mismo idioma que los botones: borde 2–3px, esquinas casi rectas, sombra dura. **Quita el `backdrop-filter:
blur`** (el blur translúcido pelea con el look pixel crujiente). Al hover, las tarjetas interactivas
se levantan hacia la sombra (`translate(-2px,-2px)` + sombra mayor).

```css
.window, .card, .panel {
  background: var(--surface);
  border: 2px solid var(--frame);
  border-radius: 3px;
  box-shadow: 4px 4px 0 0 var(--hard);
  /* sin backdrop-filter */
}
.card:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 0 var(--hard); }
```

Extra que vende el estilo: **realces de texto en caja** (palabras clave con fondo + borde fino,
como `<mark>` pixelado) y **divisores punteados/dentados** en vez de líneas suaves.

## Paleta: claro vs oscuro
- **Fondo claro (neobrutalismo clásico de la referencia típica)**: relleno claro, borde y sombra
  **oscuros** (navy/negro). El borde oscuro contrasta con el relleno claro y con el fondo.
- **Fondo oscuro**: el borde oscuro se pierde. Usa **borde claro** (`--frame` ~ #cdd9ef o un acento)
  que contraste con el fondo oscuro, y **sombra dura casi negra** (`--hard` ~ #04060d, más oscura que
  el fondo). Así el bloque "flota" sobre el oscuro. Para CTA, relleno de acento sólido.

Tokens sugeridos a añadir al `:root`:
```css
--frame: #cdd9ef;            /* borde del bloque (claro sobre fondo oscuro) */
--frame-soft: rgba(205,217,239,.45);  /* ventanas, más discreto */
--hard: #04060d;             /* color de la sombra dura */
--pix-shadow: 4px 4px 0 0 var(--hard);
--pix-shadow-sm: 3px 3px 0 0 var(--hard);
--pix-shadow-lg: 6px 6px 0 0 var(--hard);
--r-pix: 3px;
```

## Flujo recomendado (por etapas, verificando)
Hazlo en **2 etapas** y verifica cada una; es un cambio de identidad grande y conviene enseñar pronto.
1. **Etapa 1 — fuentes + botones.** Carga fuentes, cambia tokens de familia, reestiliza la clase de
   botón base y las variantes (primario/secundario/ghost) + el botón de menú si lo hay. Verifica.
2. **Etapa 2 — ventanas.** Aplica el marco blocky a las tarjetas/paneles/modales más visibles
   (cards de selección, paneles laterales, contenedor principal, controles flotantes). Verifica.

Reglas de scope:
- **Toca primero el sistema de tokens** (fuentes, sombras, radios) → propaga gratis.
- Cuidado con el **orden de carga**: si un `<style>` inline se carga DESPUÉS del theme, gana por
  especificidad/cascada; los componentes que estén inline hay que editarlos donde están, no en el theme.
- **No conviertas el arte.** Sprites, retratos, fondos ilustrados y fotos se quedan: el contraste
  marco-pixel / contenido-pantado ES el estilo.
- Inputs/`select`, tooltips y modales secundarios suelen quedar para una pasada final: avísalo.

## Verificación
- Cárgalo en un **puerto/origen limpio** si la UI tiene CSS/JS de vista cacheado (los `<link>`/`<script>`
  externos se cachean entre navegaciones del mismo origen).
- Espera `document.fonts.ready` antes de capturar; si no, ves la fuente de respaldo.
- Mira capturas de las pantallas clave (menú, listados, formularios, detalle) y comprueba:
  legibilidad del cuerpo a tamaño real, contraste del borde sobre el fondo, que el arte no se aplastó,
  consola sin errores (404 de fuente, etc.).

## Guardarraíles
- Una **familia de sombra** y un **radio** coherentes en todo (no mezclar blur con hard-shadow).
- Mantén accesibilidad: contraste de texto AA, foco visible (un `outline` pixelado de 2px va perfecto).
- No subas la densidad de píxeles de las imágenes ni fuerces `pixelated` sobre fotos.
- Cambios reversibles: todo sale de tokens → volver al tema anterior = revertir tokens.

## Recursos del skill
- `references/pixel-arcade.css` — hoja "drop-in" con tokens + reglas de botón y ventana lista para
  adaptar. Cópiala y mapea sus variables a las de la UI destino.
