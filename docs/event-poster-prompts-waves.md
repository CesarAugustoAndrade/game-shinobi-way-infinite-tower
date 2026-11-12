# Land of Waves — Image Generation Prompt Bible

Catálogo de producción para renovar el arte de **WAVES_ARC** sin cambiar gameplay:

- 13 identidades visuales de location.
- 14 battlegrounds por bioma, incluido el plate regional Mist Covered Bridge.
- 20 pósters de eventos de `src/game/constants/events/wavesArcEvents.ts`.

Los prompts están escritos en inglés porque los modelos de imagen suelen interpretar mejor los
términos de cámara, materiales y render. Las instrucciones y criterios de selección permanecen en
español.

---

## 1. Diagnóstico del arte actual

El material existente tiene buenas ideas de composición — niebla, faroles cálidos, madera mojada,
puentes como líneas de fuga y espacios centrales útiles — pero mezcla tres acabados incompatibles:

- Las tarjetas cuadradas de location se acercan al concept art fotorrealista.
- Las placas 16:9 de location usan pixel-art como estilo principal.
- Los battlegrounds usan una ilustración entintada mucho más sobria.

La nueva tanda debe conservar las mejores decisiones espaciales, pero unificar el acabado en
**painted HQ neo-retro seinen**. El píxel vive en el chrome de la UI; no en la pintura principal.

## 2. Style lock global

Añade este bloque al principio de cada prompt de location o battleground:

> Painted digital illustration, high quality 2D anime environment art, neo-retro seinen
> atmosphere, hybrid cel-shading with crisp dark lineart in the foreground and soft painterly
> atmosphere in the distance, precise weathered materials, cinematic composition, deep layered
> perspective, active volumetric fog, cool desaturated palette of abyss blue #1A2633, metal blue
> #2D3D4A and fog gray #8A9199, bone-white highlights #E8E4DC, sparse rust-orange focal accents
> #A65D3F, subtle posterization and fine monochrome grain, emotionally restrained, oppressive
> coastal poverty, no franchise logos.

### Negative prompt global

> text, letters, readable signs, watermark, logo, UI, HUD, frame, photorealistic photography,
> glossy 3D render, chibi, cute, cheerful, clean fantasy village, pristine surfaces, neon
> cyberpunk, oversaturated colors, generic medieval Europe, Chinese palace architecture, chunky
> 8-bit pixel art, 16-bit sprite art, SNES tileset, flat lighting, clear horizon, excessive bloom,
> soft undefined foreground, duplicated objects, malformed architecture

### Reglas visuales que no se negocian

- Tres planos legibles: primer plano nítido, plano medio reconocible, fondo disuelto.
- La niebla oculta el horizonte y cuenta algo; no es un filtro decorativo.
- El óxido, la cuerda húmeda, la madera salada, el hierro y el papel aceitado cuentan la economía
  de Gato sin mostrar texto.
- Temperatura 70% fría / 30% cálida. Los faroles y el óxido son anclas, no una fiesta de luces.
- Evitar multitudes y protagonistas mirando a cámara en locations y battlegrounds.
- Nada de texto generado dentro de carteles, faroles, ledgers, cajas o sellos.
- No pintar UI, scanlines ni marcos de arcade dentro del asset.

---

## 3. Formatos de salida

### Location card — 1:1

Destino: public/assets/icons/locations/<location_id>.jpg

Añade al final del scene core:

> Square 1:1 environmental key art, one unmistakable focal anchor, readable at thumbnail size,
> strongest detail in the central 60%, corners allowed to dissolve into fog, no hero character,
> no combat pose, no text.

Generar como render independiente. No recortar una placa 16:9.

### Location scenic plate — 16:9

Destino: public/assets/locations/location_<biome_slug>.png

Añade al final del scene core:

> Wide 16:9 establishing plate, 1280x720 or larger, environmental storytelling across three depth
> layers, leave the central-right area calm enough for location UI and enemy presentation, keep
> critical landmarks away from the outer 8% crop zone, no characters in the immediate foreground,
> no text.

### Battleground — 16:9

Destino base:

- public/assets/backgrounds/combat_background_<biome_slug>.png
- public/assets/lamina/lamina_mid_<biome_slug>.png
- public/assets/lamina/lamina_fg_<biome_slug>.png

Excepción existente: Coastal Harbor usa
public/assets/backgrounds/combat_background_coastal_harbor_v3.png. Las placas de
public/assets/locations determinan la identidad visual de exploración y el slug; el combate carga
su background dedicado desde public/assets/backgrounds.

El battleground no es una postal. Debe funcionar como escenario:

- Suelo o plataforma de combate entre 58% y 78% de la altura.
- Centro 45–55% relativamente limpio.
- Dos zonas de silueta claras para combatientes a izquierda y derecha.
- Elementos de alto contraste fuera de las cabezas y barras.
- Sin personas, enemigos, armas flotantes ni VFX permanentes.

#### Output A — background opaco

> Wide 16:9 combat background plate, 1280x720 or larger, empty two-fighter stage, stable horizontal
> ground plane, open center lane, readable left and right silhouette zones, distant architecture
> and atmosphere only, no foreground occluders, no characters, no UI, no text.

#### Output B — middleground recortable

> Matching wide 16:9 middleground scenic layer for the exact same camera and lighting, side
> structures and low ground anchors only, preserve the central 50% for fighters, isolated scenic
> elements, hard clean outer silhouettes, flat pure green screen background #00FF00, no gradients,
> no texture, no fog and no cast shadows on the chroma background, no characters, no text.

Para foliage o sujetos muy verdes, sustituir el fondo por:

> flat pure magenta screen background #FF00FF

#### Output C — foreground recortable

> Matching wide 16:9 foreground occlusion layer for the exact same camera and lighting, a few
> sharply painted props restricted to the bottom 18–24% and extreme side edges, central and upper
> frame completely empty, isolated scenic elements with hard clean silhouettes, flat pure green
> screen background #00FF00, no gradients, no texture, no fog and no cast shadows on the chroma
> background, no characters, no text.

Tras generar B y C: chroma-key a PNG RGBA real, despill completo y RGB cero en píxeles
transparentes. Nunca usar matte negro.

---

## 4. Location prompts

Para cada location, concatenar: **Style lock global + Scene core + output 1:1 o 16:9 + Negative
prompt global**.

### L01 — The Docks

- id: the_docks
- biome: coastal_harbor
- scene core:

> A rain-darkened Wave Country fishing harbor under Gato's control, warped timber piers and
> salt-eaten stilt warehouses, fishermen unloading thin catches with lowered eyes while two distant
> hired collectors inspect every crate, heavy rusted chain links and tar-black ropes in sharp
> foreground, one oil lantern reflected in black water, cargo seals suggested as abstract red wax
> shapes without symbols, lighthouse reduced to a pale silhouette behind dense sea fog; commerce
> feels like surveillance, not prosperity.

### L02 — Misty Beach

- id: misty_beach
- biome: foggy_shoreline
- scene core:

> A broad black-sand shoreline where dense teal-gray fog erases sea and sky, two deliberately
> scuttled fishing hulls half-buried by the tide, wet footprints approaching one wreck and never
> returning, a rust-orange buoy and torn net as the only warm focal marks, shallow pools reflecting
> bone-white light, salt-stunted pines barely visible inland; quiet enough to hide treasure, an
> ambush or a body.

### L03 — Coastal Forest

- id: coastal_forest
- biome: dense_forest
- scene core:

> A coastal pine forest deformed by salt wind, black wet trunks leaning over a narrow trail,
> exposed roots gripping shale, sea fog moving inland in layered bands, a single rusted kunai lodged
> in a foreground root and almost-invisible tripwire catching cold light, distant ash-smoke from a
> bandit camp diffused between the trees; no magical lanterns, no enchanted fairytale glow, the
> forest is practical cover shared by beasts and missing-nin.

### L04 — Smuggler's Cave

- id: smugglers_cave
- biome: underground_cavern
- scene core:

> Lantern-soot tunnels carved beneath the coastal forest, wet basalt ribs and timber braces,
> oilcloth-wrapped crates stacked beside an open ledger whose marks are abstract and unreadable,
> tripwires and iron hooks revealed by grazing amber light, an empty war-hound cage in sharp
> foreground, a low tide-hole breathing blue-gray sea mist from the deepest chamber; the cave is a
> warehouse Gato can deny and everyone else fears.

### L05 — Fishing Village

- id: fishing_village
- biome: rural_village
- scene core:

> A poor Wave Country village of weathered stilt houses above tidal mud, empty nets hanging like
> shrouds, repaired roofs and patched walkways showing stubborn care, villagers reduced to quiet
> silhouettes behind paper screens, an overturned tax bowl and iron-red wax seal near a doorway,
> one line of warm hearth light, the unfinished bridge barely visible through fog beyond the roofs;
> lived-in dignity under economic occupation, never picturesque tourism.

### L06 — Riverside Camp

- id: riverside_camp
- biome: river_banks
- scene core:

> A temporary camp on a swollen riverbank at blue hour, several low wet tarps arranged around an
> ashfire that burns rust-orange and smokes blue-green from salt wood, fish-skin route maps weighted
> by stones with no readable marks, a rope ferry disappearing into fog, knives and travel packs kept
> close rather than displayed, distant cloaked travelers watching different exits; roads and silence
> are both being sold here.

### L07 — Sunken Ship

- id: sunken_ship
- biome: shipwreck
- scene core:

> The broken interior of a merchant vessel scuttled on purpose, half the hold below black seawater,
> salt-swollen beams and snapped deck ribs forming a drowned cathedral, sealed cargo crates visible
> under the surface, one iron strongbox carrying an abstract rust-red shipping seal, bubbles rising
> in measured rows as if an unseen clerk still counts inventory, cold shafts of light failing before
> the deepest compartment; claustrophobic maritime haunting without visible ghosts.

### L08 — Bridge Construction

- id: bridge_construction
- biome: great_bridge
- scene core:

> Tazuna's enormous unfinished bridge crossing an ocean of fog, wet timber decking, rope scaffolds
> and raw beams repeating toward a horizon that never resolves, sawdust pasted to the planks by rain,
> abandoned hammers and one worker's glove in sharp foreground, distant laborers as tiny vertical
> marks beneath hidden crossbow silhouettes in the mist, every new span reading as resistance and
> target at once.

### L09 — Bandit Outpost

- id: bandit_outpost
- biome: fortified_camp
- scene core:

> A brutal stake-walled checkpoint where the river narrows, sharpened wet palisades, patched command
> tent and elevated watch platforms, chained war-hound runs kept to one side, confiscated fishing
> crates and a single iron-red coin nailed to the gate as Gato's payment mark, churned mud bearing
> many incoming footprints and few outgoing ones, torchlight cut into pieces by heavy fog; a receipt
> written in timber and fear.

### L10 — Abandoned Manor

- id: abandoned_manor
- biome: ruined_estate
- scene core:

> A salt-rotted noble manor on a low hill, broken shoji and sagging tiled roof, moonlight crossing a
> wet corridor lined with portraits whose faces are damaged rather than supernatural, mold following
> old flood lines, failed repairs and abandoned household objects in exact detail, two sets of muddy
> footprints where only one visitor should exist; aristocratic decay sold to Gato and left to
> remember the price.

### L11 — Hidden Cove

- id: hidden_cove
- biome: secret_harbor
- scene core:

> A narrow sea cave opening onto black-green water, steep basalt walls hiding the sky, an unlit skiff
> tied to a silent landing, oilcloth cargo stacked just above the high-tide stain, abstract sealing
> wax catching a rust-orange glint, extinguished lanterns and fresh rope fibers proving a recent
> delivery while no crew remains, fog entering in low horizontal sheets; a harbor defined by
> schedule, absence and unrecorded debt.

### L12 — Drowned Shrine

- id: drowned_shrine
- biome: underwater_temple
- scene core:

> A submerged coastal shrine beneath black-teal water, cracked stone pillars and drowned gates
> receding into impossible fog-like particulate, offerings held in place by silt, rusted fittings
> marked by tide lines that resemble accounting columns without becoming text, a small bubble of old
> chakra air suspended above the altar, bone-white god rays from the surface revealing only part of
> the architecture; sacred pressure, ancient debt and no fully shown entity.

### L13 — Gato's Compound

- id: gatos_compound
- biome: fortified_mansion
- scene core:

> Gato's coastal shipping fortress built from wealth extracted from poor villages, iron gates
> between wet timber warehouses and a fortified mansion, guard towers and barred counting-room
> windows layered upward through violet-gray fog, stacked strongboxes and ledger crates behind the
> walls, controlled rust-red lanterns forming a hard path to the entrance, one tiny worker silhouette
> dwarfed by the structure; oppressive commercial power, not a royal palace and not a cartoon skull
> fortress.

---

## 5. Battleground scene cores

Para cada battleground, concatenar: **Style lock global + Scene core + Output A, B o C + Negative
prompt global**. Generar A primero y usarla como referencia visual para B y C.

### B01 — Coastal Harbor

- slug: coastal_harbor
- scene core:

> Night combat stage on a broad rain-soaked cargo pier, low warehouses framing the far left and
> right, fishing boats and a striped lighthouse dissolved into fog behind them, stable horizontal
> planks across the playable lane, ropes and crates kept outside the fighter silhouettes, one warm
> dock lamp per side reflected in dark water, asymmetrical working harbor under occupation.

### B02 — Foggy Shoreline

- slug: foggy_shoreline
- scene core:

> Empty low-tide combat stage on compact black sand, shallow reflective water along the rear edge,
> half-buried ship ribs and torn nets framing the sides, fog wall swallowing the ocean horizon,
> sparse driftwood and a rusted buoy outside the open center, cold diffuse dawn light, footprints
> crossing the arena and ending abruptly near the surf.

### B03 — Dense Forest

- slug: dense_forest
- chroma: use magenta #FF00FF for MID and FG
- scene core:

> Wide combat clearing among salt-stunted coastal pines, level wet earth and roots forming a stable
> stage, massive trunks framing the outer thirds without crossing fighter silhouettes, layered sea
> fog between tree columns, broken branches and a faint bandit ashfire in the distance, no glowing
> fantasy lanterns, practical ambush terrain with restrained green.

### B04 — Underground Cavern

- slug: underground_cavern
- scene core:

> Wide smugglers' cavern arena with a flattened wet basalt loading floor, timber braces and
> oilcloth cargo stacked at the far sides, soot-black ceiling disappearing above frame, low tide-hole
> emitting cold mist in the background, two caged lanterns creating controlled amber edge light,
> tripwire hardware visible only near the margins, open central duel lane.

### B05 — Rural Village

- slug: rural_village
- scene core:

> Empty combat lane across a broad wet village boardwalk, stilt houses and hanging empty nets
> framing both sides, tidal mud and distant unfinished bridge behind a low fog bank, patched boards
> forming an even fighting surface, an overturned tax basket and red wax seal outside the center,
> restrained hearth lights behind closed screens, poverty with dignity.

### B06 — River Banks

- slug: river_banks
- scene core:

> Wide muddy riverbank combat stage beside dark moving water, firm gravel-and-mud clearing in the
> center, rope ferry posts and low traveler tarps at the outer edges, one dying ashfire periphery
> accent, dense river fog hiding the opposite bank, wet stones and charcoal route marks without
> readable symbols, campsite tension rather than wilderness serenity.

### B07 — Shipwreck

- slug: shipwreck
- scene core:

> Interior shipwreck combat stage inside a vast broken hold, broad tilted but visually stable deck
> platform above waist-deep black water, exposed hull ribs framing the sides like a drowned
> cathedral, snapped beams kept clear of fighter silhouettes, cold teal shafts through deck gaps,
> submerged crates and measured bubbles in the distance, strong horizontal lane for combat.

### B08 — Great Bridge

- slug: great_bridge
- scene core:

> Wide unfinished bridge combat stage suspended over invisible water, broad wet timber span forming
> a clean horizontal arena, rope scaffolds and raw vertical supports restricted to outer thirds,
> repeated beams vanishing into dense sea fog, one dropped hammer and traces of sawdust at the edge,
> cold backlight with sparse rust-orange work lamps, dangerous height implied without clutter.

### B09 — Fortified Camp

- slug: fortified_camp
- scene core:

> Churned-mud combat yard inside a stake-walled bandit outpost, stable central ground between two
> palisade towers, command tent and chained empty hound run at opposite edges, confiscated crates
> behind the fight line, torchlight grazing sharpened wet stakes, fog pressing through gate gaps,
> functional mercenary fortification rather than a grand military castle.

### B10 — Ruined Estate

- slug: ruined_estate
- scene core:

> Wide abandoned manor courtyard at night, cracked stone-and-timber fighting surface bordered by
> roofed corridors, torn shoji and damaged portraits visible through side rooms, mold and salt stains
> following believable water paths, cold moonlight through fog, one rust-orange brazier dying at the
> margin, center empty and geometrically stable while distant footprints suggest an unseen second
> presence.

### B11 — Secret Harbor

- slug: secret_harbor
- scene core:

> Hidden-cove combat dock inside a basalt sea cave, broad wet landing platform across the center,
> black-green water behind it, silent skiff and oilcloth cargo held to the far sides, high-tide marks
> and rope hardware rendered precisely, narrow cave mouth reduced to pale fog, almost no artificial
> light except one covered rust-orange cargo lamp.

### B12 — Underwater Temple

- slug: underwater_temple
- chroma: use magenta #FF00FF for MID and FG if algae dominates
- scene core:

> Submerged shrine combat platform in black-teal water, broad cracked stone dais forming a readable
> arena, broken gates and pillars framing the outer thirds, repeating columns fading into particulate
> haze instead of a clear horizon, bone-white surface rays and faint old-chakra light kept behind the
> fighters, sparse offerings and rusted fittings outside the central lane, sacred pressure without a
> visible god.

### B13 — Fortified Mansion

- slug: fortified_mansion
- scene core:

> Night combat courtyard inside Gato's fortified shipping compound, wide rain-dark stone and timber
> floor, counting house and warehouse balconies enclosing the far plane, iron gates and guard
> galleries at the outer thirds, stacked strongboxes behind railings, controlled red-orange lantern
> rhythm, sea fog entering through barred openings, expensive security built on coastal poverty, no
> palace glamour.

### B14 — Mist Covered Bridge

- slug: mist_covered_bridge
- role: regional plate and final-arc duel space
- scene core:

> Monumental bridge span lost inside dense teal-gray sea mist, flat wet deck creating a stark open
> duel lane, repeating rails and unfinished supports fading into nothing, distant worker lamps almost
> extinguished by fog, a few frost traces and dark water droplets on the planks but no permanent ice
> mirrors, opposing silhouettes would read perfectly against the pale void, severe final-confrontation
> composition with the bridge as the only certainty.

---

## 6. Production order recomendado

1. Great Bridge / Mist Covered Bridge — columna vertebral narrativa y clímax.
2. Coastal Harbor / Foggy Shoreline — primera impresión del arco.
3. Rural Village / Fortified Mansion — contraste entre población y opresor.
4. Dense Forest / Underground Cavern / River Banks — variedad del recorrido medio.
5. Fortified Camp / Ruined Estate — rutas tardías.
6. Shipwreck / Secret Harbor / Underwater Temple — secretos de mayor impacto.
7. Pósters de eventos, priorizando los que aparecen en el spine principal.

Cada imagen debe aprobar:

- Lectura clara a tamaño real de UI.
- Landmark inequívoco sin texto.
- Tres profundidades visibles.
- Ningún horizonte limpio.
- Un solo foco cálido dominante.
- Coherencia de cámara entre BG, MID y FG.
- Centro de battleground libre de ruido.
- Ausencia de croma residual después de convertir las láminas.

---

## 7. Event poster prompts

Los eventos usan otro encuadre, pero el mismo acabado material y atmosférico:

- Aspecto 2:3 vertical, 832x1248 o mayor.
- Sujeto o evidencia narrativa en los dos tercios superiores.
- Parte inferior más tranquila para el scrim de lectura de Event.
- Una imagen potente, un conflicto y una consecuencia sugerida.
- No intentar representar todas las elecciones simultáneamente.
- Sin texto, UI, logos, sellos legibles ni personajes mirando a cámara salvo necesidad narrativa.

Style lock de eventos:

> Cinematic vertical key art poster for a ninja action RPG, painted digital illustration, high
> quality, hybrid cel-shaded edges and hard dark outlines on focal subjects, soft painterly
> atmosphere in depth, neo-retro seinen mood, precise wet materials and restrained body language,
> active volumetric fog, cool desaturated Wave Country palette with sparse rust-orange accents,
> subtle fine grain, portrait 2:3 composition, important subject in the upper two thirds, quieter
> lower area for UI scrim, no text, no UI, no watermark, no logo.

Este bloque es el style lock canónico. Las líneas style_lock repetidas en las fichas inferiores se
conservan como resumen de compatibilidad; para una regeneración nueva se debe usar el bloque
canónico de esta sección seguido del prompt específico del evento.

---

## event_bridge_worker_plea
- filename: event_bridge_worker_plea.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: A gaunt bridge laborer stands knee-deep in teal fog on a salt-slick pier, salt-cracked hands open toward the viewer, eyes hollow with exhausted resolve rather than pleading. Behind him, unfinished timber pilings vanish into grey mist; boot-prints trail wet sand toward a darker wall of fog where faint silhouettes of mist men might lurk. A small empty rope coil and a child's wooden geta left in the mud imply a kidnapping without showing the victim. Moody rim light cuts through wet wood grain and iron-red rust stains on a chain post. Tall portrait composition, cinematic atmosphere, no text.

## event_mist_ambush_cache
- filename: event_mist_ambush_cache.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Hidden Kirigakure supply cache behind salt-rotted fishing nets: oilcloth bundles, rice sacks sealed against damp, a rack of kunai glinting under cold teal fog. Dark boot-prints still wet in black mud lead into and out of the frame; the fog holds its breath as if someone is waiting. A half-unrolled tide chart with ink still shiny lies across a crate, suggesting a wreck offshore. Optional distant ninja silhouette dissolves into grey. Wet wood, rust-iron red accents on fittings, high-atmosphere vertical poster, no text.

## event_tazuna_request
- filename: event_tazuna_request.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Wet timber stacked on a half-built bridge span under a dishonest grey sky; a chalk wage-board nailed to a post lists empty columns no one dares erase. Sawdust mixes with salt mist; an empty coin pouch and a builder's chalk line mark honest labor under threat. In the mid-distance, faceless collectors count boards like teeth, iron-red ledgers half-hidden under cloaks. Teal fog softens the unfinished planks; dramatic side light picks out grain, rope, and rust. Tall cinematic key art, no people facing camera, no text.

## event_meet_tazuna
- filename: event_meet_tazuna.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: An aging bridge builder on a fog-choked Wave Country pier, smelling of wet timber and cheap sake — careful posture, not tall, gripping a saw-bag like a weapon. Behind him, rotting dock pilings and grey water; distant cutthroat silhouettes walk the boards as if they own the mist. A half-finished bridge span ghosts through teal fog in the background. Moody lamp-oil amber accents against cold teal, wet wood texture, iron-red rust on bollards. Vertical cinematic poster of a contract written in fear, no text or logos.

## event_tazuna_road_mist
- filename: event_tazuna_road_mist.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: A grey-throat inland road swallowed by dense teal mist; pine trunks frame a muddy path where a small figure of a builder walks half a step behind a taller ninja silhouette ahead. A weathered milestone stained with old dried blood; birdless branches. Distant muffled hammer-blows suggested by tiny warm sparks of construction light on an unfinished bridge far beyond the trees. Wet wood fence posts, iron-red lichen on stone, high atmosphere, soft absence of birds. Tall portrait composition, no readable text.

## event_protect_village
- filename: event_protect_village.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Gato's collectors on a fishing-village porch — heavy boots on wet boards, a splintered door hanging open, a mother in shadow clutching an empty coin bowl. No one shouts; resignation hangs like the same grey mist over the roofs. Iron-red tax stamps and a thick ledger under a thug's arm; hanging nets and drying fish as quiet props. Cold teal fog above slate rooftops, dramatic porch lamp light, cinematic vertical key art of tyranny as climate, no text.

## event_meet_inari
- filename: event_meet_inari.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: A thin boy sits where the tide leaves trash on a grey Wave Country shore — Inari-aged, too young for a ledger, not looking at the viewer. Tide wrack, broken nets, a crushed rice bag, and grey water stretching into teal fog. Optional distant adult shinobi silhouette at the edge of frame, not theatrical — just presence. Cold light, wet sand reflections, iron-red rust on a beached buoy. Quiet seinen mood, grief without spectacle, tall poster composition, no text or logos.

## event_protect_bridge
- filename: event_protect_bridge.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Unfinished bridge span drowning in sea mist; hammers frozen mid-swing, workers frozen on wet planks under the soft pressure of foreign chakra in the grey. A lone shinobi silhouette stands guard at the center of the span, cloak and stance cutting a dark vertical axis through teal fog. Wet timber, rope, and iron-red rivets; faint assassin shapes peeling off the fog toward a worker's spine. High drama, temperature-drop atmosphere, cinematic vertical key art, no text.

## event_final_showdown_setup
- filename: event_final_showdown_setup.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Bridgehead where the temperature dies: a massive executioner's cleaver rests against wet timber; crystalline ice mirrors bloom like cold wounds in the air, fracturing teal fog into silver shards. Two ominous figures — a hulking swordsman and a masked mirror-user — framed as mythic silhouettes, not logos. Frost creeps over planks; breath-fog and iron-red blood flecks on wood. Invoice-of-silence mood, high-atmosphere vertical key art for a ninja RPG showdown, no text or UI.

## event_final_confrontation
- filename: event_final_confrontation.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Gato's compound interior: wet-coin opulence and lamp-oil haze, mercenaries packing balconies like vultures on payroll. Below, a small sharp shipping magnate sits on a raised seat among stacked crates and iron strongboxes — cruelty climate-controlled while teal fog presses against barred windows outside. Gold and iron-red ledger stacks, wet wood floors, oppressive vertical composition looking up through rafters. Optional roof-infiltrating ninja silhouette in the rafter dust. Cinematic painted poster, no text.

## event_gato_defeat
- filename: event_gato_defeat.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Aftermath in Wave Country: an open strongbox of cold coins spilled across wet compound boards, mercenaries fleeing into teal fog like rats leaving a sinking ship. Outside the gate, the mist does not cheer — only listens; distant hammers resume on a half-finished bridge, tentative then steady. No parade, no fireworks — freedom quieter than stories promised. Iron-red ledger burned or closed, wet wood, grey light, tall cinematic key art of uneasy liberation, no text.

## event_docks_collector_ledger
- filename: event_docks_collector_ledger.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Under a reeking fish crate on foggy docks, a sealed collector's ledger lies open just enough to show columns of names and amounts without readable words — wet ink still drying, a collector's mark as abstract iron-red seal. Salt, scale glitter, and unpaid debt hang in teal fog. A boot scrapes beyond stacked crates; silence priced as a line item. Moody lantern light on wet wood and paper fiber. Vertical mysterious pressure poster, no legible text, no logos.

## event_mist_omen_tide
- filename: event_mist_omen_tide.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: An omen written in fog and pressure: a perfect ring of dead gulls on wet black sand, tide marks higher than any chart, grey air tasting of iron. No words — only geometry of corpses as compass needles and unnatural high-water lines on rocks. Teal mist thick as unfinished contracts; optional pale blood drop staining the sand as a thin pact. Distant unfinished bridge silhouette. High-atmosphere vertical danger key art, no text or UI.

## event_shipwreck_whisper
- filename: event_shipwreck_whisper.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Below the waterline in a sunken hold: salt-eaten wood like a throat, shafts of murky teal light, and a sealed chest bearing an abstract iron-red shipping seal that seems to breathe. Spectral inventory presence — floating crates, ghostly counting hands suggested as bubbles and light, not cartoon ghosts. Dripping water keeps time with unpaid tally; drowned atmosphere, claustrophobic vertical composition. Painted neo-retro cinematic mood, no readable labels, no logos.

## event_manor_haunt_debt
- filename: event_manor_haunt_debt.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Decaying noble manor interior: a tall portrait whose eyes have been painted over with a smaller cruel man's gaze; under flaking varnish a sale price bleeds through as abstract iron-red pigment, not digits. Dust settles only where a clerk would stand; a second set of footprints matches the viewer's path a half-step late. Cold teal moonlight through broken screens, wet wood floors, ledger-quiet haunting rather than jump-scare horror. Vertical cinematic key art, no text.

## event_corrupt_merchant_scales
- filename: event_corrupt_merchant_scales.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Fishing-village market stall under grey mist: a merchant's balance scale where rice always comes up light; the counterweight is too dark for honest iron — lead painted pewter. An abstract iron-red seal on the apron; villagers in soft focus do not argue. Wet boards, hanging fish, cold teal fog between stalls. A denser false weight as the visual villain. Cinematic vertical poster of theft disguised as tax, no readable prices, no logos.

## event_riverside_traveler_pact
- filename: event_riverside_traveler_pact.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Riverside traveler camp at dusk: three cloaked figures around a fire that smokes wrong — salt-wood, not river pine — blue-green smoke twisting into teal fog. Maps drawn on fish-skin unrolled by the firelight; one traveler watches the bridge road the way a creditor watches a door. Wet river stones, ash, iron-red embers, charcoal route lines without readable words. Vertical cinematic key art of roads sold like silence, no text.

## event_bandit_outpost_toll
- filename: event_bandit_outpost_toll.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Stake-wall bandit outpost in Wave Country fog: sharpened timber stakes, war hounds with low heads, a hard-faced captain with a single iron-red coin sewn into his collar counting heads not names. Mud path, empty toll gate, fear as the only currency. Teal mist behind the walls, wet wood grain, dramatic torch light. Optional distant ninja silhouette refusing to shrink. Tall danger poster composition, no text or logos.

## event_hidden_cove_silent_drop
- filename: event_hidden_cove_silent_drop.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Hidden cove at low light: a skiff idles with no lantern on black-green water; oilcloth-sealed crates wait above the high-water line. A wet smuggler's manifest weighted with a stone — abstract tide marks and blank boat names, not readable text. No crew, only schedule and silence. Rock walls, teal fog, wet wood hull, iron-red sealing wax on crates. Vertical cinematic key art of cargo that never docks, no logos.

## event_drowned_shrine_black_tide
- filename: event_drowned_shrine_black_tide.png
- aspect: 2:3 (vertical poster for left column UI)
- style_lock: Cinematic vertical key art poster for a ninja action RPG (Shinobi Way). Painted neo-retro digital illustration with subtle cel-shaded edges, moody dramatic lighting, high atmosphere. NO text, NO UI, NO watermark, NO logos. Portrait composition for a tall event card. Dark misty Land of Waves palette: teal fog, wet wood, iron red accents.
- prompt: Underwater drowned shrine: stone pillars climbing with tide-mark debt lines (abstract script, not letters), an altar holding a bubble of old chakra air in black-teal water. Something in the dark expects a signature — pressure, not a face. Salt-rust iron-red accents on fittings, submerged offerings, cold godlight through the surface above. Vertical claustrophobic sacred-horror key art, atmospheric painted neo-retro style, no text, no logos.
