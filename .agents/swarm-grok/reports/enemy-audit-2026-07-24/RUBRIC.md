# Enemy Art Audit Rubric — Shinobi Way

## Target style (combat-art / Neo-Retro arcade)
- 16-bit / Neo Geo–Capcom arcade: **black outlines 1–2px**, **cel-shading 4–5 tones**, readable silhouette
- Heroic painted illustration OK inside sprite; **not** photoreal mush, not flat emoji, not generic AI sludge
- Combat cutout (`enemy_cut_*`) should read on dark layered battlefield; portrait (`enemy_*`) for cards/panels
- Palette: cool abyss / mist / Land of Waves seinen — consistent with game UI (`--sw-*` abyss/gold)

## Verdicts (pick one)
| Verdict | When |
|---------|------|
| **KEEP** | Strong silhouette, style match, distinct identity, good cutout |
| **REGENERATE** | Simple, generic, mushy, wrong style, or doesn't match character identity — replace with Imagine + combat-art prompts |
| **DELETE** | Orphan, duplicate junk, residual JPG only, or asset that should not ship (after remap) |
| **DEDICATE** | Currently soft-shares another sprite but needs its own art |

## Score 0–10 each
- silhouette (readable at combat size)
- style_match (arcade/seinen, outlines/cel)
- detail_richness (not flat/simple)
- identity_fit (looks like the named enemy)
- cutout_quality (alpha clean, no black box, no baked background)

**REGENERATE if total < 30 or any critical fail** (black box cutout, pure soft-share identity mismatch, photoreal/cartoon mismatch).

## Output format (strict)
Write markdown file only. For each enemy:

```
### <id>
- paths: portrait=... cutout=...
- scores: sil=N style=N detail=N identity=N cutout=N total=N
- verdict: KEEP|REGENERATE|DELETE|DEDICATE
- why: 1-2 sentences
- prompt_hint: short Imagine prompt if REGENERATE/DEDICATE
```

End with section `## Batch summary` listing verdicts.
