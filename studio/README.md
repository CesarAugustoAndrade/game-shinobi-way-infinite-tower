# Shinobi Studio — perfiles Grok Bot

Estos archivos **no** crean Bots. Se pegan a mano en la [app Grok Bot](https://x.ai/bot).
Esta carpeta vive en el repo del juego; el loop de código (`src/`, `loop/`) no escribe aquí.

## Alta (30 min)

1. Abrí Grok Bot. **New → Create new Bot**.
2. Menú del Bot → **Edit Profile**.
3. Pegá **Name**, **Title** y **Description** de cada archivo en `bots/`, en este orden:
   1. `01-producer.md`
   2. `02-product.md`
   3. `03-research.md`
   4. `04-growth.md`
   5. `05-brand.md`
   6. `06-rights.md`
4. En cada Bot, mandá el **First message** de su archivo (una sola vez).
5. **New → New Group Chat**. Meté a los 6. Nombre: `Shinobi Studio`.
6. Pegá el kickoff de `GROUP.md`.
7. Settings → Agent: pegá las reglas de `SETTINGS.md`.
8. Subí a la VM de Grok Bot (o adjuntá en el grupo) estos archivos:
   - `POSITIONING.md`
   - `VOICE.md`
   - `RIGHTS.md`
   - `STORE.md`
   - `RESEARCH-LOG.md`
   - `CHANGELOG-PLAYER.md`

## Roster

| Bot | Job | Checker |
|---|---|---|
| Producer | Brief, ruteo, un outcome a la vez | — |
| Product | Fantasy, apuestas, anti-visión | Challenger implícito: el grupo |
| Research | Playtest + mercado con citas | Product |
| Growth | Steam / X / trailer / patch notes (draft) | Brand → Rights |
| Brand | Voz seinen-sublime | Rights |
| Rights | SHIP / RENAME / HOLD | veto final |

Nada se publica, postea, sube a Steam ni se manda a prensa sin tu OK. Rights tiene veto.

## Qué no va acá

- Código del juego (`src/`, `loop/`, T-XXX). Eso sigue en Grok Build / Cursor.
- Logins de Steam partner, ads, o el git remoto en la VM compartida, hasta que `SETTINGS.md` esté pegado.
