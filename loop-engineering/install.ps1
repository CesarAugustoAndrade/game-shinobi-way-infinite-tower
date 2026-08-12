#Requires -Version 5.1
<#
.SYNOPSIS
  Instala loop-engineering en ~/.claude (skill + comando /loop-init).
#>
$ErrorActionPreference = "Stop"

$PackageRoot = $PSScriptRoot
$SkillSrc    = Join-Path $PackageRoot "skill-loop-engineering"
$CmdSrc      = Join-Path $PackageRoot "user-commands\loop-init.md"

$ClaudeHome  = Join-Path $env:USERPROFILE ".claude"
$SkillDst    = Join-Path $ClaudeHome "skills\loop-engineering"
$CmdDstDir   = Join-Path $ClaudeHome "commands"
$CmdDst      = Join-Path $CmdDstDir "loop-init.md"

if (-not (Test-Path $SkillSrc)) {
  throw "No se encuentra skill-loop-engineering en: $SkillSrc"
}
if (-not (Test-Path $CmdSrc)) {
  throw "No se encuentra user-commands\loop-init.md en: $CmdSrc"
}

New-Item -ItemType Directory -Path (Join-Path $ClaudeHome "skills") -Force | Out-Null
New-Item -ItemType Directory -Path $CmdDstDir -Force | Out-Null

if (Test-Path $SkillDst) {
  Write-Host "Reemplazando skill existente: $SkillDst"
  Remove-Item $SkillDst -Recurse -Force
}

Copy-Item -Path $SkillSrc -Destination $SkillDst -Recurse -Force
Copy-Item -Path $CmdSrc -Destination $CmdDst -Force

Write-Host ""
Write-Host "OK — loop-engineering instalado"
Write-Host "  skill : $SkillDst"
Write-Host "  cmd   : $CmdDst"
Write-Host ""
Write-Host "Siguiente paso: abre Claude Code en un proyecto y ejecuta /loop-init"
Write-Host "  (o /task-new si el proyecto ya está bootstrappeado)"
