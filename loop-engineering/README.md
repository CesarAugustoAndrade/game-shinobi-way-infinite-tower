# Loop Engineering — paquete listo para instalar

Paquete portable del sistema **loop-engineering** (Claude Code): skill, comandos
(`/loop-init`, `/task-new`, `/task-dev`, `/soul-loop`, …), agentes del pipeline y
referencias.

Red Wi‑Fi local (este PC):

| | |
|---|---|
| Carpeta local | `C:\Users\Public\Compartida\loop-engineering` |
| Compartido SMB | `\\DESKTOP-N94NBBH\Compartida\loop-engineering` |
| IP (Wi‑Fi) | `\\192.168.1.20\Compartida\loop-engineering` |

## Contenido

```
loop-engineering/
├── README.md                 ← este archivo
├── INSTALL.md                ← guía corta
├── install.ps1               ← instala en este Windows (~/.claude)
├── install.sh                ← instala en macOS/Linux
├── skill-loop-engineering/   ← skill COMPLETA (copiar a ~/.claude/skills/)
│   ├── SKILL.md
│   ├── CHANGELOG.md
│   ├── LEARNINGS.md
│   ├── assets/
│   │   ├── commands/         # loop-init, task-new, task-dev, soul-loop, …
│   │   ├── agents/           # explorer, planner, implementer, reviewer, …
│   │   ├── skills/domain-model/
│   │   ├── CLAUDE-template.md
│   │   └── task-template.md
│   └── references/           # dev-loop, rings, soul, DDD, scaffolding, …
├── user-commands/
│   └── loop-init.md          ← comando de usuario (bootstrap de proyectos)
└── project-drop-in/          ← espejo de lo que /loop-init deja en un repo
    ├── CLAUDE-template.md
    ├── task-template.md
    └── .claude/
        ├── commands/
        ├── agents/
        └── skills/domain-model/
```

## Comandos incluidos

| Comando | Uso |
|---|---|
| `/loop-init` | Bootstrap de un proyecto (git, carpetas, copia assets, CLAUDE.md) |
| `/task-new` | Crear spec de tarea (`T-XXX`) en el backlog |
| `/task-dev` | Pipeline de desarrollo (explorer → planner → implementer → reviewer → verifier) |
| `/task-verify` | Verificar una tarea ya implementada |
| `/soul-loop` | Proponer “qué sigue” desde `SOUL.md` |
| `/skill-new` | Crear skill de proyecto |
| `/skill-evolve` | Evolucionar skills con learnings |
| `/score` | Scoring con rúbricas |

Agentes: `explorer`, `planner`, `implementer`, `reviewer`, `verifier`,
`researcher`, `auditor`, `skill-curator`.

## Instalación rápida (otra máquina en la Wi‑Fi)

### Windows (Claude Code)

1. Monta o abre `\\192.168.1.20\Compartida\loop-engineering`
2. En PowerShell:

```powershell
& "\\192.168.1.20\Compartida\loop-engineering\install.ps1"
```

O copia a mano:

```powershell
$src = "\\192.168.1.20\Compartida\loop-engineering"
Copy-Item "$src\skill-loop-engineering" "$env:USERPROFILE\.claude\skills\loop-engineering" -Recurse -Force
Copy-Item "$src\user-commands\loop-init.md" "$env:USERPROFILE\.claude\commands\loop-init.md" -Force
```

### macOS / Linux

```bash
SRC="//192.168.1.20/Compartida/loop-engineering"   # o la ruta montada
# tras montar el share, p.ej. /Volumes/Compartida/loop-engineering:
bash /Volumes/Compartida/loop-engineering/install.sh
```

### Usar en un proyecto

Con la skill instalada a nivel usuario:

```
/loop-init
```

Eso crea `tasks/`, `src/` hexagonal, copia comandos/agentes al `.claude/` del
proyecto e instancia `CLAUDE.md`. Siguiente paso habitual: `/task-new`.

## Requisitos

- [Claude Code](https://claude.ai/code) (CLI o IDE)
- `git` (el pipeline usa worktrees por tarea)
- Red local: perfil de red / firewall que permita SMB (puerto 445) si instalas
  desde otra máquina

## Notas

- `skill-loop-engineering/` es la fuente de verdad (skill + assets + references).
- `project-drop-in/` es solo un espejo de conveniencia; en producción usa
  `/loop-init` para no desincronizar placeholders.
- `LEARNINGS.md` es el histórico de la skill; no hace falta tocarlo para instalar.
