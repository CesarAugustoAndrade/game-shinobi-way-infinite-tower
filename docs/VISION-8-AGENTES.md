# VISIÓN DEL JUEGO — Síntesis de 8 agentes

> **Propósito:** Documento de interpretación. Ocho lentes independientes leyeron el repo + tu intent reciente (cinemático · cyber-ninja-terror-seinen · evolucionar por location · pulir Región 1 · items-as-assets · skills con gracia · tooltips de producto · eventos primero).  
> **No es** `loop/VISION.md` oficial hasta que tú lo adoptes.  
> **Fecha:** 2026-07-23 · **Rama de contexto:** `develop` (T-001…T-114 passed · R1 polish swarm mayormente done)

---

## 0. Una frase (consenso)

**SHINOBI WAY es un roguelike de torre por turnos donde eres un shinobi recortado contra niebla, capital y vacío: cada location te reescribe, cada pelea es un duelo legible, cada evento es combate moral — y el jugador siempre siente que está *viendo* una partida cinemática de terror ninja, no rellenando un formulario.**

**Slogan propuesto (Agente 8):**  
*«Niebla, chakra y CRT — sobrevive a la torre como si siempre estuvieras viendo la partida.»*

---

## 1. Fantasy del jugador (Agente 1 + consenso)

No eres “el héroe del anime”. Eres **la única línea vertical en un país de horizontales grises**: clan elegido, misión en territorio hostil, agencia con coste.

| Lo que quieres sentir | Lo que el juego ya empuja |
|----------------------|---------------------------|
| Resistir con lineart nítido en un mundo que te empequeñece | Seinen-sublime + Land of Waves (Gato, muelles, puente) |
| Cada decisión deja cicatriz (loot, flag, look, kit) | Flags, lootTheme, terrain, boons — aún no siempre se *leen* |
| Cine de misión, no dungeon genérica | Region → Location → Room + eventos story |

### Anti-visión (lo que NO es)

- Shonen de power-up gratuito / fan karaoke de “ser Naruto”
- Roguelike de fricción vacía (clics sin trade-off)
- Horror gore o cosmic dissolve sin material (el óxido y la sal tienen forma)
- UI SaaS glass-blur / spreadsheet permanente
- “Torre abstracta” sin país: Waves es el ancla antes del Infinite Ascent

---

## 2. Tono: cyber-punk ninja terror seinen

### Jerarquía de mood (consenso fuerte)

```
ALMA (mundo ilustrado)     → Terror sobrio · niebla · óxido · abismo · economía del miedo
CHASIS (visor del jugador) → CRT · scanlines · pixel-arcade · neón de mapa (instrumento)
NUNCA mezclar              → Neón del RegionMap ≠ clima del País de las Olas
```

**Cyberpunk aquí no es Blade Runner abierto.** Es:
- industria muerta filtrada por niebla (grúas, contenedores, ledgers, cobradores)
- Gato como **infraestructura de coerción**, no villano de capa
- neón como **escasez** (un letrero moribundo, un LED de herida) — el óxido (`#a65d3f`) es el único calor del frame
- vigilancia por tubo CRT: “te están mirando jugar”

**Seinen-sublime (docs):** detalle nítido → atmósfera → vastedad → cuerpo alterado.  
Paleta canónica: vacío `#050608`, abisal `#1a2633`, metal `#2d3d4a`, niebla `#8a9199`, hueso `#e8e4dc`, óxido `#a65d3f`.

### Tensión actual (todos los agentes la ven)

El producto es un **stack de eras**: pixel-arcade (T-001) + neon map (T-007) + stage Buriedbornes (T-014) + prose/art seinen + R1 painted terror.  
**Tu visión de consolidación** no pide más sistemas: pide **un mood legible en 20 min de Región 1**.

---

## 3. Loop y estructura (Agentes 2, 4, 8)

```
Menú / Clan → RegionMap (planear el golpe)
            → LocationMap (filmar el sitio sala a sala)
            → Combat | Event | Loot | Merchant | Rest | Training
            → Boss de arco → Interlude / boon → siguiente región o Torre
```

**Jerarquía:** Region → Location → Room (~10 salas, diamante).

**Combate (fantasía de pelea):**
- Apertura por **Approach** → economía **AP + mano de jutsu + postura**
- Trade-off legible (chakra, AP, control, burst vs sustain)
- Ciclo elemental + 4 tipos de daño; mitigación ordenada
- TTK objetivo 4–12 turnos; win rate 45–65 % (visión de balance)
- El terreno de la location **reentrena** al shinobi (no solo el level-up)

**Profundidad que ya existe y la presentación aún no enseña del todo:** postura, terrain mods, pipeline de mitigación, telegraphs enemigos — polish = **cablear profundidad a UI**, no inventar otro sistema.

---

## 4. Location-as-Transform (Agente 4) — “evoluciona con cada lugar”

Cada location de Waves es un **paquete de identidad**, no un contenedor de fights:

| Eje | Función |
|-----|---------|
| Danger 1–7 | Escala real de amenaza |
| Terrain + effects | Water, mist, ambush, movement… cambian el duelo |
| enemyPool | Rostros y roles del sitio |
| lootTable + region lootTheme | Waves: **Agua** · Focus Speed·Dex·Spirit · Ryo ×0.8 (pobreza) |
| Flags / amenities | Merchant, rest, secret, boss |
| Story / atmosphere | El sitio “habla” |

**Mecánico:** sales con otro kit, otro approach, otro sello de path.  
**Narrativo:** muelles corruptos → niebla → aldea → puente Tazuna → compuesto Gato = un país atravesado, no floors genéricos.

**Frase de visión (A4):** *Cada location es un transformador de ninja: sal distinto o no salgas.*

---

## 5. Eventos primero (Agente 5)

Los eventos son el **combate moral** de la torre. El combate resuelve peligro; el evento resuelve **quién eres en el País de las Olas**.

**Hoy (fortalezas):** prose seinen en picos; huesos Tazuna / puente / Gato / Inari / Haku; flags y outcomes; placas de arte; motor chainTo + risk + SAFE exit.

**Hoy (debilidades):** dos voces (algunos textos tutorial-shonen); spine casi por pool/flags, poco `chainTo` continuo; payoffs a menudo ryo/exp genéricos; generics diluyen peso regional.

**Cinemático ≠ párrafo largo.** Es:
1. Beat sheet (setup → presión → postura de choice → payoff de mundo)
2. Cadena o flags como montaje
3. Risk/costo legible **antes** del dado
4. Anclaje espacial (el evento *pertenece* al muelle/puente/compuesto)
5. Payoff diferido (flags que reaparecen)

**Cyber-terror en copy:** ledgers, cobradores, hambre racionada, silencio comprado — control de flujos, no jerga de pantallas.

---

## 6. Presentación cinemática (Agentes 3 + 6)

### Cámara

- Stage de combate: **enemigo como única vertical nítida**; jugador en HUD/mano
- Láminas: BG lento → MID enmarcado → FG oclusión; parallax + vignette + CRT
- 16:9 · figure vs void · un punto de óxido/herida como foco

### UX de producto

| Pantalla | Debe sentirse como… |
|----------|---------------------|
| Menú / clan | Calling card de identidad |
| Region / Location | Mesa de operaciones / recorte del sitio |
| Combate | Duelo en niebla (el *show*) |
| Loot / Merchant | El item **es** el asset |
| Event | Escena de elección, no papeleo |
| Game over | Epitafio, mismo chrome |

**Principios:**
1. Stage first, dock second  
2. Reveal on intent (surface: nombre/rareza/preview; depth: stats en tooltip)  
3. **Un solo lenguaje de tooltips** (hoy hay dos familias: portal glass vs item-tile blocky)  
4. Legibilidad = justicia de roguelike (sin esconder el *por qué*)  
5. Reduced motion respetado  

**Madurez tooltips:** datos/formatters ~70–80 %; chrome unificado de producto ~40–50 %.

---

## 7. Items, skills, build expression (Agente 7)

**Loop de poder:** find → combine → equip → cast.

- Componentes + **síntesis estilo TFT** → artefactos con passives de identidad (Samehada *es* un estilo de ganar, no +stats)
- Jutsu por tier/floor; región tiñe Affinity · Focus · Ryo
- UI doctrine: *the item IS the asset* (`item-tile.css`); skill card con rostro (arte + elemento)

**Grace de skills:** identidad en un vistazo + VFX que **codifican** tipo/estado (no espectáculo que tapa AP/postura/telegraph).

**Path memory:** el build cuenta *dónde* has estado (Waves te empuja Agua / mobile-Spirit; War te empuja Fuego / will-spirit).

---

## 8. Región 1 como producto (todos)

**Land of Waves no es el tutorial: es el manifiesto.**

Si en 20 minutos menú → clan → locations → combat → event → amenity → presión de boss el playtester no dice:

1. “Parece un juego de ninja cyber-terror, no un prototipo”  
2. “Cada sitio me cambió un poco”  
3. “Los jutsu se sienten”  
4. “Los tooltips me enseñan sin wiki”  
5. “Los eventos me importaron”

…entonces **no hay avance de visión**, aunque haya features nuevas.

Campañas posteriores (Exams, Retrieval, War) **escalan** la promesa de R1; no definen el pitch.

---

## 9. Las 40 frases de visión (5 × 8 lentes)

### Fantasía & tono (A1)
1. El jugador es la única línea vertical en un país de horizontales grises.  
2. Cada location deja huella en el cuerpo del run (cicatriz, jutsu, flag o look).  
3. La niebla es agente, no decorado; el terror es sobrio y seinen.  
4. Cyberpunk de costa podrida: cables salados, óxido, contratos de sangre.  
5. Cinemático por defecto: el jugador siempre mira una toma.

### Combate & sistemas (A2)
1. Cada pelea es un duelo por turnos: approach, postura y mano mandan más que DPS puro.  
2. Toda carta enseña su trade-off antes de confirmar.  
3. Terreno y sala reescriben el combate: el shinobi se adapta al mapa.  
4. VFX y tooltips sirven a la legibilidad táctica, nunca a la confusión.  
5. Siempre hay contrajugada legible (escudo, guts, postura, preview).

### Arte & cine (A3)
1. El enemigo es la vertical nítida del stage de terror seinen.  
2. Waves es cyber-terror de sal y óxido, no ciudad neón genérica.  
3. Las láminas son la gramática de profundidad; no se finge con un PNG plano.  
4. CRT y neón de mapa son el visor, no el clima del mundo.  
5. Cada item/skill se recorta contra el vacío; el emoji es last-resort.

### Exploración (A4)
1. Cada location es un transformador de ninja.  
2. La niebla de Wave es el UI de la verdad (intel / secretos / mentiras de danger).  
3. El terreno manda antes que el clan.  
4. Region 1 es el manifiesto: costa oprimida, Affinity Agua, camino a Gato.  
5. Explorar es cine de misión: RegionMap planifica; LocationMap filma.

### Eventos (A5)
1. Los eventos son el combate moral de la torre.  
2. Región 1 gana peso cuando la niebla juzga (Gato/Tazuna/puente inevitables).  
3. Cinemático = estructura (cadena, risk, payoff), el copy solo corona.  
4. Cyber-terror seinen = economía del miedo dibujada con lineart exacto.  
5. Buena elección = postura legible (cazar, pagar, sabotear, marcharse).

### UX producto (A6)
1. Cada pantalla es un fotograma de la torre, no un formulario.  
2. El objeto es el artefacto visual; el tooltip es el pergamino.  
3. Un solo lenguaje de tooltips une combate, botín y mercader.  
4. Stage seinen + chasis pixel-arcade = mando sobre niebla, no pelea de estilos.  
5. Legibilidad con voz de shinobi, no de debug.

### Loot & skills (A7)
1. El ninja se define por lo que forja y aprende en el camino.  
2. Cada ítem es un asset protagonista.  
3. Cada jutsu es una carta con rostro.  
4. La región tiñe el botín para que el build cuente el path.  
5. Síntesis y passives convierten material en estilo de pelea.

### Producto (A8)
1. El espectáculo es el combate en niebla; el resto del run es el camino a la amenaza.  
2. Region 1 es el producto, no el tráiler de cuatro arcos.  
3. Cyber-punk es el chasis; el alma es ninja en la niebla.  
4. La profundidad no se paga con fricción ni con géneros nuevos.  
5. Si no se siente en 20 minutos de R1, no es avance de visión.

---

## 10. Pilares consolidados (prioridad de trabajo)

| # | Pilar | Significado operativo |
|---|--------|----------------------|
| **P0** | **Eventos** | Escenas con peso, flags, voice cyber-terror, payoff de mundo |
| **P1** | **Cámara siempre** | Láminas, stage, transiciones; “mirar una toma” |
| **P2** | **Location-as-transform** | Visitar deja huella legible (kit, UI, log, theme) |
| **P3** | **Items = assets** | Iconos reales + tooltip de producto; cero cajas grises |
| **P4** | **Skills con gracia** | Arte + VFX que codifican tipo; floating text limpio |
| **P5** | **Tooltips de juego real** | Un skin, clamp viewport, trade-offs claros |
| **P6** | **Tone R1** | Abismo + niebla + óxido + neón escaso; sin whiplash de eras |

**Regla de scope (A8):** si no mejora **mood R1 + claridad del loop**, está fuera de la consolidación.

---

## 11. AS IS vs AS YOU WANT

| | AS IS (repo) | AS YOU WANT (intent) |
|--|--------------|----------------------|
| Pitch externo | Aún suena a “text crawler” / boilerplate en sitios | Producto cinemático cyber-ninja-terror |
| Sistemas | Muy completos (T-001…114) | Congelar géneros; pulir lectura |
| Arte | Híbrido pixel + painted + neon UI | Alma seinen-terror; chasis cyber como visor |
| R1 | Polish swarm grande, tone aún híbrido | Vertical slice de marca en 20 min |
| Progresión | Level/loot/boons + theme regional | Además: **identidad por location visitada** |
| Prioridad dev | A veces features/systems | Eventos + presentación + tooltips + VFX |

---

## 12. Riesgos de drift

1. **Systems bloat** — más profundidad sin cara  
2. **Art polyglot** — pixel + anime + neon + painted sin jerarquía  
3. **Campaign FOMO** — R2–R4 antes de que R1 se vea jugable  
4. **IP karaoke** — checklist de arcos mata el mood original  
5. **Cyber vs niebla** — pelea de géneros en la store page  
6. **Spectator vs spreadsheet** — stats dominan el frame  

---

## 13. Criterio de éxito (playtest 20 min R1)

- [ ] Identidad en 30 s: “ninja terror en niebla, en una máquina oscura”  
- [ ] El combate se ve como el *show*; la mano es el mando  
- [ ] Derrota/victoria con trade-off legible; sin soft-locks de modales  
- [ ] Continuidad de tone (sin whiplash pergamino/party/pixel)  
- [ ] “Una sala más” sin necesitar región 4 para “entender el juego”  
- [ ] Eventos y tooltips se sienten de producto, no de prototipo  

---

## 14. Mapa de evidencia (rutas que anclan esta interpretación)

| Dominio | Rutas |
|---------|--------|
| Visión loop | `loop/VISION.md` |
| Prosa/arte | `docs/seinen-sublime-atmosferico.md`, `docs/seinen-sublime-visual-specs.md`, `docs/guia_direccion_de_arte_combate.md` |
| R1 | `src/game/constants/regions/landOfWaves.ts`, `region1-polish-backlog.md` |
| Eventos | `src/game/constants/events/wavesArcEvents.ts`, `EventSystem.ts`, `scenes/activities/Event.tsx` |
| Combate | `CombatCalculationSystem.ts`, `CombatWorkflowSystem.ts`, `scenes/combat/Combat.tsx`, `CinematicViewscreen` |
| Loot/skills | `LootSystem.ts`, `synthesis.ts`, `skillArtManifest.ts`, `item-tile.css` |
| UX | `Tooltip.tsx`, `tooltipFormatters.ts`, `PlayerHUD.tsx`, `Hand.tsx` |
| Assets | `public/assets/`, `artRegistry.ts` |

---

## 15. Cómo usar este documento

1. **Validar / corregir** con el humano (qué frase no es tuya).  
2. Si hay acuerdo: fusionar §0 + §10 + §13 en `loop/VISION.md` (pilares de producto).  
3. Cortar trabajo en topics loopables por P0→P6 (eventos → cámara → transform → items → VFX → tooltips → pass R1).  
4. Cada review de loop puede citar este doc como “norte de consolidación”.

---

## Apéndice — Agentes

| # | Lente | Conclusión en una línea |
|---|--------|-------------------------|
| 1 | Fantasy & tone | Línea nítida vs vacío; no shonen; location deja cicatriz |
| 2 | Combat & systems | Duelo de trade-offs; terreno manda; VFX = claridad |
| 3 | Art & cinema | Seinen-sublime + CRT visor; cyber de sal/óxido |
| 4 | Exploration R1 | Location-as-transform; R1 = manifiesto |
| 5 | Events | Combate moral; estructura > copy largo |
| 6 | UX product | Stage first; un tooltip language; item = asset |
| 7 | Loot & skills | Forjar/aprender path; región tiñe el build |
| 8 | Product | R1 es el producto; freeze genre stack; 20 min o no cuenta |

*Fin del documento de síntesis.*
)
