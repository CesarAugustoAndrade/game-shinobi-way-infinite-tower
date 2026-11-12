# WAVES_ARC image production ledger

Staging no destructivo para la regeneración visual del primer arco.

- Prompt bible: `docs/event-poster-prompts-waves.md`
- Canon: painted HQ neo-retro seinen; chrome pixel-arcade fuera de las imágenes
- Integración: únicamente cuando todos los outputs estén generados y aprobados
- Generador: built-in imagegen

## Cobertura

| Familia | Requeridos | Aprobados |
|---|---:|---:|
| Location cards 1:1 | 13 | 13 |
| Location scenic plates 16:9 | 14 | 14 |
| Battleground backgrounds 16:9 | 14 | 14 |
| Battleground MID RGBA | 14 | 14 |
| Battleground FG RGBA | 14 | 14 |
| Event posters 2:3 | 20 | 20 |
| **Total** | **89** | **89** |

## Location cards aprobadas

| Location | Staging | Destino runtime final | Estado |
|---|---|---|---|
| The Docks | `locations/cards/the_docks.png` | `public/assets/icons/locations/the_docks.jpg` | APPROVED |
| Misty Beach | `locations/cards/misty_beach.png` | `public/assets/icons/locations/misty_beach.jpg` | APPROVED |
| Coastal Forest | `locations/cards/coastal_forest.png` | `public/assets/icons/locations/coastal_forest.jpg` | APPROVED |
| Smuggler's Cave | `locations/cards/smugglers_cave.png` | `public/assets/icons/locations/smugglers_cave.jpg` | APPROVED |
| Bridge Construction | `locations/cards/bridge_construction.png` | `public/assets/icons/locations/bridge_construction.jpg` | APPROVED |
| Fishing Village | `locations/cards/fishing_village.png` | `public/assets/icons/locations/fishing_village.jpg` | APPROVED |
| Riverside Camp | `locations/cards/riverside_camp.png` | `public/assets/icons/locations/riverside_camp.jpg` | APPROVED |
| Sunken Ship | `locations/cards/sunken_ship.png` | `public/assets/icons/locations/sunken_ship.jpg` | APPROVED |
| Bandit Outpost | `locations/cards/bandit_outpost.png` | `public/assets/icons/locations/bandit_outpost.jpg` | APPROVED |
| Abandoned Manor | `locations/cards/abandoned_manor.png` | `public/assets/icons/locations/abandoned_manor.jpg` | APPROVED |
| Hidden Cove | `locations/cards/hidden_cove.png` | `public/assets/icons/locations/hidden_cove.jpg` | APPROVED |
| Drowned Shrine | `locations/cards/drowned_shrine.png` | `public/assets/icons/locations/drowned_shrine.jpg` | APPROVED |
| Gato's Compound | `locations/cards/gatos_compound.png` | `public/assets/icons/locations/gatos_compound.jpg` | APPROVED |

Las cards se conservan como PNG durante producción. En integración se convierten realmente a JPEG;
no se cambia solo la extensión.

## Scenic plates aprobadas

| Biome | Staging | Destino runtime final | Estado |
|---|---|---|---|
| Coastal Harbor | `locations/scenic/location_coastal_harbor.png` | `public/assets/locations/location_coastal_harbor.png` | APPROVED |
| Foggy Shoreline | `locations/scenic/location_foggy_shoreline.png` | `public/assets/locations/location_foggy_shoreline.png` | APPROVED |
| Dense Forest | `locations/scenic/location_dense_forest.png` | `public/assets/locations/location_dense_forest.png` | APPROVED |
| Underground Cavern | `locations/scenic/location_underground_cavern.png` | `public/assets/locations/location_underground_cavern.png` | APPROVED |
| Great Bridge | `locations/scenic/location_great_bridge.png` | `public/assets/locations/location_great_bridge.png` | APPROVED |
| Rural Village | `locations/scenic/location_rural_village.png` | `public/assets/locations/location_rural_village.png` | APPROVED |
| River Banks | `locations/scenic/location_river_banks.png` | `public/assets/locations/location_river_banks.png` | APPROVED |
| Shipwreck | `locations/scenic/location_shipwreck.png` | `public/assets/locations/location_shipwreck.png` | APPROVED |
| Fortified Camp | `locations/scenic/location_fortified_camp.png` | `public/assets/locations/location_fortified_camp.png` | APPROVED |
| Ruined Estate | `locations/scenic/location_ruined_estate.png` | `public/assets/locations/location_ruined_estate.png` | APPROVED |
| Secret Harbor | `locations/scenic/location_secret_harbor.png` | `public/assets/locations/location_secret_harbor.png` | APPROVED |
| Underwater Temple | `locations/scenic/location_underwater_temple.png` | `public/assets/locations/location_underwater_temple.png` | APPROVED |
| Fortified Mansion | `locations/scenic/location_fortified_mansion.png` | `public/assets/locations/location_fortified_mansion.png` | APPROVED |
| Mist Covered Bridge | `locations/scenic/location_mist_covered_bridge.png` | `public/assets/locations/location_mist_covered_bridge.png` | APPROVED |

## Variantes descartadas

- `locations/location_great_bridge-v1.png`: buena composición, pero demasiado cercana a concept
  art realista. Conservada solo como evidencia; no integrar.
- `locations/location_river_banks-v1.png`: composición útil, pero acabado demasiado realista.
  Conservada solo como evidencia; no integrar.
- Primera variante de Fortified Mansion: leía como castillo feudal en vez de complejo mercantil;
  descartada en la carpeta de outputs del generador y no copiada al staging aprobado.
- Primera variante de `lamina_fg_fortified_mansion`: el acento rojo parecía un goteo de sangre;
  regenerada sin líquidos, cera ni manchas y no copiada al staging aprobado.

## Battlegrounds aprobados

Los 14 slugs cuentan con las tres piezas aprobadas en `battlegrounds/backgrounds`,
`battlegrounds/mid` y `battlegrounds/fg`: `coastal_harbor`, `foggy_shoreline`,
`dense_forest`, `underground_cavern`, `rural_village`, `river_banks`, `shipwreck`,
`great_bridge`, `fortified_camp`, `ruined_estate`, `secret_harbor`,
`underwater_temple`, `fortified_mansion` y `mist_covered_bridge`.

- Los 28 MID/FG finales son PNG RGBA reales de 1672x941.
- Esquinas transparentes verificadas y croma eliminado con despill.
- Dense Forest y Underwater Temple usaron matte magenta para preservar verdes.

## Event posters aprobados

Los 20 prompts documentados en `docs/event-poster-prompts-waves.md` cuentan con su PNG
vertical 2:3 aprobado en `events/` y se integran con el mismo nombre en
`public/assets/events/`:

- `event_bridge_worker_plea.png`
- `event_mist_ambush_cache.png`
- `event_tazuna_request.png`
- `event_meet_tazuna.png`
- `event_tazuna_road_mist.png`
- `event_protect_village.png`
- `event_meet_inari.png`
- `event_protect_bridge.png`
- `event_final_showdown_setup.png`
- `event_final_confrontation.png`
- `event_gato_defeat.png`
- `event_docks_collector_ledger.png`
- `event_mist_omen_tide.png`
- `event_shipwreck_whisper.png`
- `event_manor_haunt_debt.png`
- `event_corrupt_merchant_scales.png`
- `event_riverside_traveler_pact.png`
- `event_bandit_outpost_toll.png`
- `event_hidden_cove_silent_drop.png`
- `event_drowned_shrine_black_tide.png`

La primera variante de `event_protect_village` se descartó porque el vestuario parecía
una facción militar y mostraba emblemas; la versión final usa cobradores civiles sin símbolos.

## Integración final

- 13 cards convertidas de PNG de producción a JPEG real (quality 92).
- 14 scenic plates, 14 battleground backgrounds, 28 láminas RGBA y 20 posters copiados
  a las rutas runtime canónicas.
- Revisión de caché de láminas actualizada a `r11waves1`.

## Gate por imagen

- Dimensiones y aspect ratio correctos.
- Sin texto, UI, logos o watermark.
- Sin pixel-art como acabado principal.
- Tres planos y horizonte oculto cuando corresponda.
- Identidad inequívoca del location/biome.
- Safe area respetada.
- En MID/FG: alpha real, esquinas transparentes y sin spill de croma.
