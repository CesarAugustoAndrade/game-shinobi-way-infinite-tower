# Instalación en 60 segundos

## Desde la red Wi‑Fi (otra PC)

```powershell
# Windows
& "\\192.168.1.20\Compartida\loop-engineering\install.ps1"
```

```bash
# macOS/Linux (con el share montado)
bash /ruta/montada/loop-engineering/install.sh
```

## En esta misma máquina

```powershell
& "C:\Users\Public\Compartida\loop-engineering\install.ps1"
```

## Comprobar

Deberías tener:

- `~/.claude/skills/loop-engineering/SKILL.md`
- `~/.claude/commands/loop-init.md`

Abre Claude Code en un repo y ejecuta `/loop-init`.

## Comandos del día a día (tras loop-init en el proyecto)

1. `/task-new` — escribe la spec
2. `/task-dev T-00X` — corre el pipeline
3. `/soul-loop` — (opcional) propone siguientes tareas desde SOUL.md
