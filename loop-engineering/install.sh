#!/usr/bin/env bash
# Instala loop-engineering en ~/.claude (skill + comando /loop-init).
set -euo pipefail

PACKAGE_ROOT="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$PACKAGE_ROOT/skill-loop-engineering"
CMD_SRC="$PACKAGE_ROOT/user-commands/loop-init.md"

CLAUDE_HOME="${HOME}/.claude"
SKILL_DST="$CLAUDE_HOME/skills/loop-engineering"
CMD_DST_DIR="$CLAUDE_HOME/commands"
CMD_DST="$CMD_DST_DIR/loop-init.md"

if [[ ! -d "$SKILL_SRC" ]]; then
  echo "ERROR: no se encuentra skill-loop-engineering en: $SKILL_SRC" >&2
  exit 1
fi
if [[ ! -f "$CMD_SRC" ]]; then
  echo "ERROR: no se encuentra user-commands/loop-init.md en: $CMD_SRC" >&2
  exit 1
fi

mkdir -p "$CLAUDE_HOME/skills" "$CMD_DST_DIR"

if [[ -e "$SKILL_DST" ]]; then
  echo "Reemplazando skill existente: $SKILL_DST"
  rm -rf "$SKILL_DST"
fi

cp -R "$SKILL_SRC" "$SKILL_DST"
cp "$CMD_SRC" "$CMD_DST"

echo ""
echo "OK — loop-engineering instalado"
echo "  skill : $SKILL_DST"
echo "  cmd   : $CMD_DST"
echo ""
echo "Siguiente paso: abre Claude Code en un proyecto y ejecuta /loop-init"
echo "  (o /task-new si el proyecto ya está bootstrappeado)"
