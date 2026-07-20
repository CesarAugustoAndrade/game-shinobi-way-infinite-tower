# Análisis multiagente del estado actual

**Proyecto:** SHINOBI WAY: THE INFINITE TOWER  
**Fecha:** 2026-07-18  
**Actualizado:** 2026-07-18 (verificación con 10 agentes de auditoría contra el código)  
**Método:** 22 agentes de exploración + 10 de verificación factual (código real, solo lectura)  
**Ejes por dominio:** diversión (fun/UX) · calidad de código · pros · problemas  

**Fórmula de Global:** `(Fun + Código) / 2`, redondeado a 1 decimal.  
En dominios marcados con `*`, la columna Fun mide fiabilidad de flujo, confianza de balance o velocidad de iteración, no solo “diversión de jugada”.

---

## Dashboard de scores (corregido)

| # | Dominio | Fun | Código | Global |
|---|---------|----:|-------:|-------:|
| 1 | Pipeline de daño / math de combate | 6.5 | 7.0 | **6.8** |
| 2 | Deck + AP + Postura | 6.5 | 7.5 | **7.0** |
| 3 | UI de combate | 7.0 | 6.5 | **6.8** |
| 4 | Approaches (pre-combate) | 5.5 | 6.0 | **5.8** |
| 5 | Status / DoTs / mitigación | 6.5 | 6.0 | **6.3** |
| 6 | Enemigos + IA | 4.5 | 5.5 | **5.0** |
| 7 | Stats + leveling | 6.2 | 7.0 | **6.6** |
| 8 | Skills + clanes | 6.8 | 6.7 | **6.8** |
| 9 | Loot + síntesis + pasivas | 5.2 | 5.0 | **5.1** |
| 10 | Exploración Region→Location→Room | 6.5 | 5.0 | **5.8** |
| 11 | Eventos + arcos | 6.5 | 8.0 | **7.3** |
| 12 | Merchant + Training | 6.5 | 6.7 | **6.6** |
| 13 | Rewards + Elite | 6.5* | 5.0 | **5.8** |
| 14 | Inventario UX | 6.0 | 5.8 | **5.9** |
| 15 | Meta-loop de run | 6.2 | 5.8 | **6.0** |
| 16 | Orquestación App/hooks | 5.5 | 5.5 | **5.5** |
| 17 | Design system / pixel-arcade | 7.2 | 7.0 | **7.1** |
| 18 | Simulación / balance tools | 7.0 | 7.2 | **7.1** |
| 19 | Menús + onboarding | 4.5 | 4.0 | **4.3** |
| 20 | Feature flags + config | 6.0* | 5.5 | **5.8** |
| 21 | Types + pureza game/ | 8.0* | 7.3 | **7.7** |
| 22 | Suite de tests | 5.5* | 6.0 | **5.8** |

**Media de los 22 dominios:** Fun **~6.2** · Código **~6.2** · Global **~6.2 / 10**

**Eje extra (no entra en Global):** Completitud del run (win/lose/progresión de campaña) ≈ **4.5 / 10** — ver §15.

---

## Lectura ejecutiva

El juego tiene un **núcleo de combate y presentación sólido** (deck/AP/postura, mitigación, UI stage+deck, design system pixel-arcade, motor de eventos). El techo de diversión se frena por **loops de progresión rotos o incompletos** (meta de región, loot de combate, pasivas incompletas, enemigos genéricos) y por **deuda de orquestación** (`EXPLORE` legacy, dual floors, docs desfasados).

> **Pelear y lootar una location se siente bien; completar un run de roguelike aún no es un producto cerrado.**

### Mapa de madurez (alineado a Global)

```text
┌─────────────────────────────────────────────────────────┐
│  Fuerte (Global ≥ 7.0)                                   │
│  Deck/postura · Eventos · Design system · Sim tools      │
│  Types/pureza game · (combate math/UI ~6.8, casi)        │
├─────────────────────────────────────────────────────────┤
│  Medio (5.5 – 6.9)                                       │
│  Stats · Clanes · Training/Merchant · Status · Approaches│
│  Inventario · Rewards · Meta-loop · Exploración          │
│  Flags · Tests · Orquestación (5.5 límite)               │
├─────────────────────────────────────────────────────────┤
│  Débil (Global < 5.5)                                    │
│  Enemigos (fantasy) · Onboarding/handbook                │
│  Completitud de campaña/win (eje extra ~4.5)             │
│  Loot loop real (Global 5.1)                             │
└─────────────────────────────────────────────────────────┘
```

---

## Fortalezas transversales (preservar)

1. **Separación `game/` sin React** + cálculo vs workflow de combate + capa de simulación.
2. **Economía de cartas T-004** (mano, AP, postura) limpia, testeada y presente en UI.
3. **Mitigación ordenada** (invuln → reflect → curse → shield) con tests.
4. **Event Engine 2.0** (flags, chains, invariantes de contenido) — de lo mejor del repo en código.
5. **UI de combate y recompensas** (stage cinematográfico, item-tile, elite fight/escape).
6. **Clanes con fantasía clara** y catálogo de **114** jutsu exactos.
7. **Location/Campaign sim** para danger curve e itemización.
8. **Training** con trade-off HP/chakra interesante; treasure con buena tensión de elección.

---

## Problemas transversales (P0–P1)

### P0 — rompen fun o verdad del juego

| Problema | Dominios | Notas de verificación |
|----------|----------|------------------------|
| **Pasivas de artefactos parcialmente cableadas** | Loot / status | Subset sí funciona (shield start, on-hit DoT, guts, free first skill). **Rotas/muertas:** pierce (no entra en daño), DR/`below_half_hp`, all-elements, convert, clan traits. No es “todo off”. |
| **Combate normal sin drops de ítems** | Loot / rewards | Victoria solo XP + Ryō (+ intel). `generateLoot` existe para merchant/otros flujos. |
| **Meta de región roto** | Exploración / meta | `returnToMap*` salta `handleLeaveLocation` (sin redraw). `updateDeckAfterCompletion` importado, 0 llamadas. `player.locationsCleared` no se incrementa en vivo. |
| **`GameState.EXPLORE` sin UI** | App / handlers | Muchos `setGameState(EXPLORE)`; App no renderiza esa rama → soft-lock. |
| **Bosses genéricos + kits pobres** | Enemigos | `BOSS_NAMES` claves 8,17,25…; danger 1–7 → default *Edo Tensei Legend*. TANK/BALANCED sin skill de arquetipo (salvo `RASENGAN` si `diff>50` y 30%). |
| **Handbook / help mienten** | Onboarding | Elementos: help **1.5× / 0.5× / +20% crit / ignore 50% def** vs código **1.2 / 0.8 / +10% crit / sin ignore**. Approaches del help = posturas inventadas, no Frontal/Stealth/etc. Sin deck/AP/posture. |
| **Efectos de skill/status rotos** | Status / skills | **HEAL nunca cura HP** (solo buff; tick solo `REGEN`). Stun `duration:1` se expira antes de la acción enemiga. Silence solo bloquea **activar toggles**. Cleanse médico no codificado. |
| **Precio merchant UI ×1.8 vs cobrado ×1.0** | Economía | `Merchant.getPrice` usa `ITEM_PRICE_MULTIPLIER` (1.8); `buyItem` no. |

### P1 — diluyen profundidad o confianza

| Problema | Dominios |
|----------|----------|
| Semántica legacy MAIN/SIDE “cierra turno” / “SIDE free” vs economía AP real | Deck / UI |
| Preview de daño en `Hand` sin posture (y sin first-hit / launch mult / terrain amp) | Combat UI |
| Auto de UI = **auto-pass** (no auto-play de skills); flag global `ENABLE_MANUAL_COMBAT:false` = sim distinta | Combat / flags |
| Triple pipeline de combate (live turn systems / BattleSimulator / CombatSimulationService) | Sim / balance |
| Equipment **doble-cuenta** primarias de equipo en `getPlayerFullStats` (flats solo 1×) | Stats |
| Solo 1 región; **sin victoria de campaña** | Meta |
| Capas apiladas sin sinergia: Approach + Posture + Deck; initiative de approach no gobierna turnos reales | Approaches |
| Dual taxonomía Body/Mind/Technique vs Spirit/Mind/Body | Stats / UI |
| GameLog huérfano (0 imports); poco jugo de hit en stage | Combat UI |
| Glass residual en sidebars vs pixel-arcade del combate | Design |
| `App.startGame` y CharacterSelect usan `CLAN_START_SKILL`, **no** `CLAN_START_LOADOUT` (loadout casi muerto en path de menú) | Clanes / onboarding |
| Sell ratio `0.6` hardcodeado en UI/handlers pese a `BALANCE.SELL_PRICE_RATIO` | Economía |

---

## Prioridades recomendadas (máximo ROI)

1. **Cerrar meta location→region**  
   Un path: `markComplete` + `updateDeckAfterCompletion` + redraw cartas + `locationsCleared++`. Matar o redirigir `EXPLORE` legacy.

2. **Hacer verdad el crafting**  
   Drops de combate (aunque sean Broken) + cablear pasivas rotas en daño/mitigación + alinear elite EPIC vs craft RARE.

3. **Enemigos con identidad**  
   Kits por arquetipo (≥3 skills), tabla de bosses por danger/región (no floors 8/17/…), 1 telegraph.

4. **Arreglar promesas rotas de combate**  
   HEAL/cleanse reales; stun duration coherente; silence en skills con chakra; preview con posture (+ mods); renombrar Auto → Auto-end.

5. **Onboarding honesto**  
   Handbook: deck/AP/posture/intel + elementos 1.2/0.8; first-run tip; GameOver con stats; CharacterSelect = loadout real.

6. **Economía**  
   Unificar precio merchant (`buyItem` × multiplier o quitar de UI); stock > Broken; sell ratio desde `BALANCE`.

7. **Victoria mínima de región**  
   Aunque sea provisional (T-023).

8. **Unificar combate sim ↔ live**  
   Evitar balancear un universo paralelo (1v1 scaling + IA distinta).

---

# Informes por dominio

## 1) Pipeline de daño / math de combate

**Scores:** Fun 6.5 · Código 7.0 · Global **6.8**

### Pros
- Capas de decisión: Approach → postura + mazo/AP → skills.
- Logs de combate cubren miss/evade/crit/SE/ambush/shield (Guts en turno enemigo / lethal / hazard).
- Defensa por tipo PHYS/ELEM/MENTAL/TRUE + NORMAL/PIERCING/ARMOR_BREAK.
- Mitigación ordenada y testeada en `CombatCalculationSystem`.
- Daño base en `StatSystem.calculateDamage` (elemental matchup = `skill.element` vs defensor).

### Contras
- Swinginess alta (hit, evade, crit, status, confusión, hazard, Guts).
- Señal elemental débil (**×1.2 / ×0.8** = ±20%; no 1.5/0.5 de docs viejos).
- Amplificación de terreno por `player.element`, no `skill.element`.
- **`EffectType.HEAL` nunca restaura HP** (buff que no se resuelve; solo `REGEN` tickea cura).
- Math partido: daño en `StatSystem`, mitigación/hazards en `CombatCalculationSystem` (no un solo “calculation layer” puro).
- Orquestación de cartas/AP duplicada entre `useCombat` y systems/sim.
- Hazard de terreno: `Math.max(1, hp - dmg)` → **no mata**.
- Daño mínimo 1: skills con `damageMult: 0` pueden picar 1 si conectan.
- Sin tests de `PlayerTurnSystem`.

### Issues top
1. RNG apilado + feedback débil.
2. Fuente de verdad partida (hook vs systems vs sim).
3. HEAL / cleanse / terrain amp / hazards.
4. Preview UI ≠ daño real (posture, first-hit, launch mult, terrain).

---

## 2) Deck + AP + Postura

**Scores:** Fun 6.5 · Código 7.5 · Global **7.0**

### Pros
- Mano ≤4 (`HAND_SIZE`) + AP base 3 + postura = economía legible.
- Core puro y testeado (`DeckSystem`, `PostureSystem`, `combatCards`).
- Posture trade-off simétrico (±15%) documentado.
- `BattleSimulator` usa la misma economía de cartas.

### Contras
- Techo bajo: no deckbuilder profundo (mazo = skills no-pasivas del jugador).
- `ActionType` en `types.ts` documenta MAIN “Ends your turn” y SIDE “Free action… max 2”; runtime = AP (MAIN 2, SIDE 1) y fin de turno si `apAfter <= 0`.
- Preview en `Hand` solo llama `calculateDamage` (sin posture ni otros mods post-cálculo).
- Categoría offensive/defensive/utility solo afecta pesos de draw; invisible en UI.
- Enemigo sin deck/postura propia (solo `postureDefenseMod` del jugador al daño entrante).

---

## 3) UI de combate

**Scores:** Fun 7.0 · Código 6.5 · Global **6.8**

### Pros
- Layout stage + deck maduro.
- Floating text, super-effective, AP pips, atajos Z/X/C/V.
- EliteChallenge claro (fight vs escape).
- Componentes acotados: Hand, SkillCard, PostureIndicator.

### Contras
- Botón “Auto” = countdown + pass de turno (`"Auto-pass: Focusing on defense..."`), no auto-play de skills.
- GameLog existe pero **0 imports** en el repo (huérfano).
- Skill art: `skill.name.includes(...)` + fallback CDN Pinterest (`i.pinimg.com`).
- Tab hijack: `preventDefault` + toggle auto en turno jugador.
- Sin `aria-live` en `src/`.
- Panel enemigo grande inline en `Combat.tsx`.

---

## 4) Approaches (pre-combate)

**Scores:** Fun 5.5 · Código 6.0 · Global **5.8**

### Pros
- Fantasy ninja (stealth, genjutsu, trap, shunshin).
- Frontal 100% como default seguro.
- Payoffs distintos y pipeline Result → combat seed limpio.

### Contras
- No es RPS; es risk dial.
- Help text describe Aggressive/Defensive/Balanced/**Evasive** (posturas inventadas), no los 5 approaches reales.
- `startCombat` **siempre** pone turno del jugador; `determineTurnOrder` / `initiativeBonus` no gobiernan el combate real (sí en tests y en sims).
- Sims divergen de `approaches.ts` (mults y stats de éxito distintos).
- Sin sinergia con posture/deck (postura inicial siempre BALANCED).

---

## 5) Status / DoTs / mitigación

**Scores:** Fun 6.5 · Código 6.0 · Global **6.3**

### Pros
- Mitigación de hits: invuln → reflect (pre-curse) → curse → shield (testeada).
- Catálogo temático; Guts dual (stat + artefacto 1×).
- UI de status con iconos y tooltips.

### Contras
- Stun `duration: 1`: `tickBuffDurations` en Phase 1 del turno enemigo **elimina** el stun antes de la acción → casi cosmético vs IA.
- HEAL / CHAKRA_REGEN / cleanse médico no resuelven lo prometido (cleanse ni siquiera en data de effect, solo en descripción).
- Silence solo en `useCombat` al activar toggle; MAIN/SIDE con chakra no se bloquean.
- DoT al enemigo **sin** `applyMitigation`; al jugador sí (asimetría).
- Passives de equipo: subset wired; pierce post-hit y DR no modifican el daño real.

---

## 6) Enemigos + IA

**Scores:** Fun 4.5 · Código 5.5 · Global **5.0**

### Pros
- Escalado multi-eje (danger, progression, ease, HP wall, dmg wall).
- Turno enemigo bien orquestado; fix de CDs con tests de regresión.
- AI modular y testeable.

### Contras
- Kits: base `BASIC_ATTACK`; extra solo CASTER→Fireball, ASSASSIN→Shuriken, GENJUTSU→Hell Viewing. **TANK/BALANCED** sin skill de arquetipo (excepto posible **RASENGAN** si `diff > 50` y `chance(0.3)`).
- Sin telegraphs.
- `BOSS_NAMES[dangerLevel]` con claves legacy 8,17,25… → default *Edo Tensei Legend* en danger 1–7.
- Triple definición de arquetipos (live / entities / sim).
- Enemigos no gastan chakra; self-buffs de skill se saltan en `executeEnemyAction`.
- Sim 1v1 usa `generateSimEnemy` (fórmula floor×0.08 distinta de `EnemySystem`).

---

## 7) Stats + leveling

**Scores:** Fun 6.2 · Código 7.0 · Global **6.6**

### Pros
- 9 primarias + pipeline base→equip→pasivas→buffs→derivadas.
- Soft caps; LevelSystem puro e inmutable; tests de growth por clan.
- `STAT_FORMULAS`: **maxHp = 80 + willpower × 9** (verificado).

### Contras
- Level-up 100% auto por clan.
- Growth exacto por nivel: Yamanaka **18**, Uchiha **17**, Uzumaki **15**, Hyuga **13**, Lee **10**.
- Dual taxonomía Spirit/Mind/Body (UI) vs Body/Mind/Technique (types/guide).
- `getPlayerFullStats`: primarias de equipo se suman **dos veces** a derivadas; flats una vez.
- `damageBonus` / `defenseBonus` de skill passives se agregan y **nunca** entran al daño/defensa de combate.
- JSDoc de `StatSystem` aún menciona HP 100+(will×12) y elemental 1.5/0.5.

---

## 8) Skills + clanes

**Scores:** Fun 6.8 · Código 6.7 · Global **6.8**

### Pros
- Identidad de clan legible.
- **114** skills en `skills.ts`; ActionType MAIN/SIDE/TOGGLE/PASSIVE.
- Balance comments T-006.

### Contras
- Exclusivos `requirements.clan`: Uchiha **6**, Hyuga **5**, Yamanaka **1**, Lee **0**, Uzumaki **0**.
- Mecánicas en prosa no codificadas (multi-hit, copy, etc.).
- `FIRE_AFFINITY`: descripción “Fire damage”; data = `damageBonus` global **y además no se aplica** (pasiva skill muerta).
- **Yamanaka mismatch:** `CLAN_START_SKILL` = Mind Destruction; loadout main = Mind Transfer + Hell Viewing (sin Destruction).
- **Path de menú:** `CharacterSelect` + `App.startGame` usan `CLAN_START_SKILL` + BASIC + SHURIKEN — **no** `CLAN_START_LOADOUT` / `getClanStartingSkills` (este último sí en `createPlayer`, no en el arranque real del menú).
- Ciclo elemental poco relevante para clanes Physical/Mental.

---

## 9) Loot + síntesis + pasivas de equipo

**Scores:** Fun 5.2 · Código 5.0 · Global **5.1**

### Pros
- Visión TFT + lore (Broken→Common→Rare→Epic).
- Bag 12 + 4 slots + primary +50%.
- Subset de passives **sí** funciona: shield/invuln/reflect al start, on-hit DoT/lifesteal/seal, guts, free first skill, execute (parcial).

### Contras
- Combate normal **no** dropea ítems.
- Elite: `generateRandomArtifact` → **EPIC** gratis; `synthesize` → **RARE** con coste.
- Pasivas **no cableadas o mal cableadas:** pierce (calc post-hit, no en damage), all-elements, convert, DR/`below_half_hp` (log-only o sin call), clan traits.
- Counter: posible double-roll RNG.
- UI craft incompleta; REGEN/SHIELD con bases current vs max incorrectas.

---

## 10) Exploración Region → Location → Room

**Scores:** Fun 6.5 · Código 5.0 · Global **5.8**

### Pros
- Cartas + intel + danger/wealth legibles.
- Branching lazy + multi-actividades.
- ScalingSystem unifica danger/XP/ryo.

### Contras
- `returnToMap` / `returnToMapActivityComplete` van a `REGION_MAP` **sin** `handleLeaveLocation` → **sin** `evaluateIntel` + `drawLocationCards`.
- `updateDeckAfterCompletion`: definido, importado en App, **0 llamadas**.
- `player.locationsCleared`: se lee al generar enemigos; ++ solo en `CampaignSimulator`.
- Dual intel: `currentIntel` 0–100% activo; `intelPool` 0–10 casi muerto tras start.
- Código: árbol dinámico + exit probabilístico + Guardian; docs/types: diamante 10 salas / intel mission.
- Solo Land of Waves exportada.

---

## 11) Eventos + arcos narrativos

**Scores:** Fun 6.5 · Código 8.0 · Global **7.3**

### Pros
- Motor data-driven + tests de contenido y engine fuertes.
- 2 cadenas `chainTo`: Orochimaru; Envoy (+ follow-up por flags, no chainTo).
- EventResultModal + WHAT CHANGED.
- Anti-softlock de choices.

### Contras
- **26** eventos exactos en `constants/events/*.ts`.
- Preview con `%` reduce misterio.
- `triggerCombat.archetype` (TANK/ASSASSIN/…) se castea a tipo `NORMAL|ELITE|…` → valor de build **ignorado**; arquetipo aleatorio en rama NORMAL.
- `rollOutcome` usa `Math.random` (no `utils/rng` seedable).
- Clan reweight documentado en header, no implementado.

---

## 12) Merchant + Training

**Scores:** Fun 6.5 · Código 6.7 · Global **6.6**

### Pros
- Meta-sinks: slots, treasure quality, reroll.
- Training: costes HP/chakra (`10+floor*2` / `5+floor`) × intensidad; gains por intensity.
- UI pulida.

### Contras
- Stock = solo `generateLoot` → Broken.
- **Bug precio:** UI `value × 1.8 × (1−d)`; cobro `value × (1−d)`.
- Quality afecta generación de tesoros, no el stock del merchant.
- Training sin revalidación dura de coste en handler.

---

## 13) Rewards + Elite

**Scores:** Fun 6.5* · Código 5.0 · Global **5.8**

### Pros
- Treasure con tensión (reveal, hunt, dados, bag-full).
- Elite: preview + escape math + artefacto pendiente.
- XP/Ryo post-combate consistentes.

### Contras
- Combate sin drops de ítems → cadencia de power-up floja.
- Entrega fragmentada (modal / Loot / bag).
- `pendingArtifact` como side-channel de “fue elite”.
- Odds de dados hardcodeados en UI vs `LaunchProperties`.
- Copy “Gold” vs Ryō.

---

## 14) Inventario UX

**Scores:** Fun 6.0 · Código 5.8 · Global **5.9**

### Pros
- Síntesis TFT + DnD bag↔equip.
- `item-tile` en Loot/Merchant/Treasure (no en Bag).

### Contras
- Sidebar sin deltas de poder (sí en loot).
- Dos sistemas de tooltip.
- Sell `* 0.6` hardcodeado en varios UI/handlers (config tiene `SELL_PRICE_RATIO: 0.6`).
- Hooks de equipment dentro de render (anti-patrón).
- Handlers de inventario con `returnToMap` (concern de escena loot).

---

## 15) Meta-loop de run

**Scores:** Fun 6.2 · Código 5.8 · Global **6.0**  
**Completitud de campaña (eje extra):** ~**4.5** (no promedia en Global)

### Pros
- Micro-loop location sólido.
- Agencia en cartas / rooms / combate.
- Level-up y build mid-run claros.

### Contras
- Sin victoria de región/campaña (`isRegionComplete` sin UI).
- Sin save; run potencialmente largo.
- Transición location→region frágil (cartas/deck/`locationsCleared`).
- GameOver mínimo (location, danger, region, level opcional).
- Título “Infinite Tower” vs 1 región.

---

## 16) Orquestación App + hooks

**Scores:** Fun 5.5 · Código 5.5 · Global **5.5**

### Pros
- Extracción a hooks; `startCombat` unificado.
- Debug de flujo; ErrorBoundaries.

### Contras
- `App.tsx` **1066** líneas exactas (god-orchestrator).
- Dual `branchingFloor` + `locationFloor` en handlers.
- `EXPLORE` reachable sin rama de render.
- Timeouts 100ms + refs anti-ciclo.
- `useActivityHandler` vs `useActivityHandlers` (naming confuso).
- `useGame()` solo en Left/Right sidebar panels.

---

## 17) Design system / pixel-arcade

**Scores:** Fun 7.2 · Código 7.0 · Global **7.1**

### Pros
- Tokens `--sw-*`; remap pixel-arcade; stage cinematográfico; item-tile.

### Contras
- Neon soft (location cards) vs hard pixel (room cards / buttons).
- Glass residual en layout/inventory/character (sidebars).
- Font-size 8–10px hardcodeados; reimports masivos del design system.

---

## 18) Simulación / balance tools

**Scores:** Fun 7.0 · Código 7.2 · Global **7.1**

### Pros
- Location clear + campaign + gear ON/OFF = mejores métricas.
- Seed; reuso de generadores reales en attrition.
- Scripts: `simulate`, `simulate:quick`, `simulate:progression[:quick]`, `simulate:campaign[:quick]`.

### Contras
- Escalado 1v1 (`generateSimEnemy`) ≠ `EnemySystem`.
- IA sim ≠ `EnemyAISystem`; approaches no en CLI real.
- Sin `simulate:location` en package.json; SIMULATION.md desfasado.
- No es gate de CI.

---

## 19) Menús + onboarding

**Scores:** Fun 4.5 · Código 4.0 · Global **4.3**

### Pros
- Presentación y atajos sólidos; handbook shell de 9 tabs.
- `startGame` crea región + intel + deck.

### Contras
- Sin first-run forzado.
- Handbook combate/elementos **verificadamente falsos** vs código.
- CharacterSelect + startGame: skill legacy, no loadout completo.
- GameOver sin run summary / retry same clan.
- Taxonomía de stats distinta select vs guide.

---

## 20) Feature flags + config

**Scores:** Fun 6.0* · Código 5.5 · Global **5.8**

### Pros
- Flags de contenido cableados en `LocationSystem`; LaunchProperties vivos en balance.

### Contras
- **Muertos (solo definición):** `DEBUG_OVERLAY`, `DEBUG_BOOSTED_STATS`, `ENABLE_COMBAT_ANIMATIONS`, `EXPERIMENTAL_COMBAT_UI`, `EXPERIMENTAL_LOOT_PREVIEW`, `DEV_MODE`.
- Helpers `isFeatureEnabled` / `getProperty` sin callers externos.
- `DEBUG_STATE_TRANSITIONS: true` por defecto.
- Doble semántica “auto combat” (flag sim vs auto-pass UI).

---

## 21) Types + pureza de arquitectura

**Scores:** Fun (iteración) 8.0* · Código 7.3 · Global **7.7**

### Pros
- Cero React en `src/game/`; result objects; RNG seedable; `combat-types` anti-ciclo.
- `types.ts` ~**1670** líneas (god-file real, no “~”).

### Contras
- UI types y fórmulas dentro del monstruo de tipos.
- Mutación in-place de enemies en generators de región/location.
- Arquetipos/story arcs duplicados; `Enemy.archetype?: string`.
- Sin `RunState`; simulación de auto-combat estilo mutable.

---

## 22) Suite de tests

**Scores:** Fun (confianza balance) 5.5* · Código 6.0 · Global **5.8**

### Pros
- Mitigación, postura, deck, LevelSystem, EventSystem + eventContent.
- Regresión CD enemigo; fixtures compartidos.

### Contras
- **Sin** tests: `PlayerTurnSystem`, `RegionSystem`, `ScalingSystem`, hooks, UI.
- Escalado con aserciones blandas; sim fuera de CI.
- Sin coverage report; fixtures duplicados Level/Campaign.

---

## Archivos y sistemas de referencia

| Dominio | Paths principales |
|---------|-------------------|
| Combate math | `src/game/systems/CombatCalculationSystem.ts`, `PlayerTurnSystem.ts`, `EnemyTurnSystem.ts`, `StatSystem.ts` |
| Deck / postura | `DeckSystem.ts`, `PostureSystem.ts`, `constants/combatCards.ts`, `components/combat/Hand.tsx` |
| UI combate | `scenes/combat/Combat.tsx`, `EliteChallenge.tsx`, `components/combat/GameLog.tsx` (huérfano) |
| Enemigos | `EnemySystem.ts`, `EnemyAISystem.ts`, `simulation/EnemyArchetypes.ts` |
| Loot | `LootSystem.ts`, `EquipmentPassiveSystem.ts`, `constants/synthesis.ts` |
| Exploración | `RegionSystem.ts`, `LocationSystem.ts`, `hooks/useExploration.ts`, `useLocationCards.ts` |
| Eventos | `EventSystem.ts`, `constants/events/*`, `scenes/activities/Event.tsx` |
| Orquestación | `App.tsx` (1066 LOC), `hooks/useCombat*.ts`, `useActivityHandlers.ts` |
| Config | `config/featureFlags.ts`, `game/config.ts` |
| Sim | `src/simulation/*` |
| Onboarding | `scenes/menu/*`, `constants/helpText.ts` |

---

## Log de correcciones (verificación 10 agentes)

### Claims factuales confirmadas (muestra)
- HEAL no cura; stun duration 1 vs enemigo; Silence solo toggles; elemental 1.2/0.8; HP 80+will×9.
- Combate sin item drops; elite EPIC vs craft RARE; merchant 1.8 UI / 1.0 charge.
- `updateDeckAfterCompletion` sin llamadas; `locationsCleared` sin ++; EXPLORE sin UI.
- returnToMap salta redraw; 26 eventos; 2 cadenas chainTo; archetype de evento no honrado.
- 114 skills; growth 10–18; exclusivos Uchiha 6 / Hyuga 5 / Yamanaka 1 / Lee·Uzumaki 0.
- Auto-pass UI; GameLog 0 imports; Pinterest fallback; App 1066 LOC; types ~1670; flags muertos listados.

### Correcciones aplicadas al documento
1. **Global** recalculado con `(Fun+Código)/2` (#4, #10–12, #14–15, #18–19, #21, etc.).
2. **Media producto** Fun/Código/Global → **~6.2** (antes Fun ~6.1).
3. **Mapa de madurez** realineado a umbrales de Global (UI 6.8 no “fuerte 7+”; orquestación 5.5 en medio; rewards no en fuerte; types en fuerte).
4. **Pasivas P0:** de “no cableadas” a **parcialmente** cableadas (subset wired + lista rota).
5. **Elementos P0:** 1.5/0.5 vs **1.2/0.8** (+crit/ignore).
6. **HEAL:** “nunca cura HP”, no “sin curación útil”.
7. **Enemigos:** matiz RASENGAN si diff>50 y 30%.
8. **Loadout:** path menú ignora `CLAN_START_LOADOUT` (no solo UI CharacterSelect).
9. **FIRE_AFFINITY:** global **y no aplicado**.
10. **Approaches:** initiative **no** gobierna combate real (siempre PLAYER).
11. **Completitud run** sacada del Global del #15 (eje extra 4.5).
12. **Scripts sim** y lista de flags muertos actualizadas con evidencia de grep.
13. **Preview daño:** además de posture, faltan first-hit / launch mult / terrain.
14. Homogeneizados scores en cuerpos (siempre Fun · Código · Global).

### Notas metodológicas
- Análisis **estático** del código (develop, 2026-07-18), no playtest humano prolongado.
- Scores de fun/código siguen siendo juicios de diseño; la verificación solo corrige **hechos y consistencia interna**.
- No se ha implementado ninguna fix de producto en este paso.

---

## Siguiente paso sugerido

1. Convertir prioridades ROI en tickets (`loop/LOOP-TOPICS.md` / backlog).
2. Implementar **P0 meta location→region** + **EXPLORE legacy**.
3. Enseguida: **drops de combate + wiring de pasivas rotas**.
