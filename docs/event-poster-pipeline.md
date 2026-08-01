# Event poster pipeline

Vertical key-art for the **Event** screen left column (`Event.tsx` / `Event.css`).

## Spec

| | |
|---|---|
| **Layout** | Vertical poster (left column); choices on the right |
| **Aspect** | **2:3** (width:height) — tall cinematic plate |
| **Format** | PNG (`event_<id>.png`) |
| **Serve path** | `/assets/event_<id>.png` |
| **On disk** | Both `public/assets/` and `assets/` (dual mirror) |

Generate full-bleed painted scenes. UI covers title/description with a bottom scrim; keep important subject matter in the upper ~2/3 of the frame.

## Naming

File names must match the manifest `src` basename:

```
event_<id>.png
```

Examples:

- `event_meet_tazuna.png`
- `event_forest_death_trap.png`
- `event_cat_story.png` (category plate)

IDs and paths live in `src/game/constants/eventArtManifest.ts`. Some events **reuse** another plate (alias `src`); only unique basenames need art on disk.

## Workflow

1. **Generate** vertical 2:3 posters as `event_<id>.png` into a staging folder.
2. **Install** into both asset trees:

   ```powershell
   .\scripts\install_event_posters.ps1 -SourceDir <staging-folder>
   ```

   Optional audit (manifest `src` vs disk):

   ```powershell
   .\scripts\install_event_posters.ps1 -SourceDir <staging-folder> -ListMissing
   .\scripts\install_event_posters.ps1 -ListMissing
   ```

3. **Hot reload** — with `npm run dev`, Vite serves `public/assets/`. Hard-refresh if the browser caches the old PNG.

## Dual layout

| Tree | Role |
|------|------|
| `public/assets/event_*.png` | Runtime (dev server + build static copy) |
| `assets/event_*.png` | Repo mirror / parity with other art installers |

Always write both; the install script does this for you.

## Related

- Manifest: `src/game/constants/eventArtManifest.ts`
- Art registry: `src/game/constants/artRegistry.ts` (`getEventArt`)
- Installer: `scripts/install_event_posters.ps1`
