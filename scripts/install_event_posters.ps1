<#
.SYNOPSIS
  Install event poster PNGs into the dual asset tree (public/assets + assets).

.DESCRIPTION
  Copies event_*.png from a source directory into both:
    - public/assets/   (Vite/dev + production static root)
    - assets/          (mirror / source-of-truth tree)

  Optionally audits missing plates by parsing src paths from
  src/game/constants/eventArtManifest.ts.

.PARAMETER SourceDir
  Folder containing generated event_*.png files to install.
  Required unless -ListMissing is used alone.

.PARAMETER ListMissing
  After install (or alone), list unique manifest src basenames that are
  not present under public/assets/.

.PARAMETER RepoRoot
  Repository root. Defaults to parent of this script's directory.

.EXAMPLE
  .\scripts\install_event_posters.ps1 -SourceDir .\generated\events

.EXAMPLE
  .\scripts\install_event_posters.ps1 -SourceDir C:\tmp\event_posters -ListMissing

.EXAMPLE
  .\scripts\install_event_posters.ps1 -ListMissing
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$SourceDir,

  [switch]$ListMissing,

  [string]$RepoRoot
)

$ErrorActionPreference = 'Stop'

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

$PublicAssets = Join-Path $RepoRoot 'public\assets'
$MirrorAssets = Join-Path $RepoRoot 'assets'
$ManifestPath = Join-Path $RepoRoot 'src\game\constants\eventArtManifest.ts'

function Write-Section([string]$Title) {
  Write-Host ''
  Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function Get-ManifestEventSrcBasenames {
  if (-not (Test-Path -LiteralPath $ManifestPath)) {
    throw "Manifest not found: $ManifestPath"
  }

  $text = Get-Content -LiteralPath $ManifestPath -Raw
  # Match "src": "/assets/event_foo.png" (and single-quoted variants)
  $pattern = '["'']src["'']\s*:\s*["''](/assets/event_[^"'']+\.png)["'']'
  $matches = [regex]::Matches($text, $pattern)

  $basenames = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($m in $matches) {
    $src = $m.Groups[1].Value
    $name = Split-Path -Path $src -Leaf
    [void]$basenames.Add($name)
  }

  return ($basenames | Sort-Object)
}

function Show-MissingEventFiles {
  Write-Section 'Missing event plates (vs eventArtManifest.ts src paths)'

  if (-not (Test-Path -LiteralPath $PublicAssets)) {
    Write-Host "WARN: public assets dir missing: $PublicAssets" -ForegroundColor Yellow
  }

  $required = @(Get-ManifestEventSrcBasenames)
  if ($required.Count -eq 0) {
    Write-Host 'No event_*.png src entries found in manifest.' -ForegroundColor Yellow
    return
  }

  $missing = @()
  $present = 0
  foreach ($name in $required) {
    $pub = Join-Path $PublicAssets $name
    $mir = Join-Path $MirrorAssets $name
    $pubOk = Test-Path -LiteralPath $pub
    $mirOk = Test-Path -LiteralPath $mir

    if ($pubOk -and $mirOk) {
      $present++
      continue
    }

    $parts = @()
    if (-not $pubOk) { $parts += 'public/assets' }
    if (-not $mirOk) { $parts += 'assets' }
    $missing += [pscustomobject]@{
      File   = $name
      MissingIn = ($parts -join ', ')
    }
  }

  Write-Host ("Manifest unique event src files: {0}" -f $required.Count)
  Write-Host ("Present in both trees:           {0}" -f $present)
  Write-Host ("Missing / incomplete:            {0}" -f $missing.Count)

  if ($missing.Count -gt 0) {
    Write-Host ''
    foreach ($row in $missing) {
      Write-Host ("  MISSING  {0}  ({1})" -f $row.File, $row.MissingIn) -ForegroundColor Yellow
    }
  }
  else {
    Write-Host 'All manifest event src plates present in both trees.' -ForegroundColor Green
  }
}

# --- Copy mode ----------------------------------------------------------------

if ($SourceDir) {
  if (-not (Test-Path -LiteralPath $SourceDir)) {
    throw "SourceDir not found: $SourceDir"
  }

  $SourceDir = (Resolve-Path -LiteralPath $SourceDir).Path
  $files = @(Get-ChildItem -LiteralPath $SourceDir -Filter 'event_*.png' -File)

  Write-Section 'Install event posters'
  Write-Host "Source:  $SourceDir"
  Write-Host "Public:  $PublicAssets"
  Write-Host "Mirror:  $MirrorAssets"
  Write-Host ("Found:   {0} event_*.png" -f $files.Count)

  if ($files.Count -eq 0) {
    Write-Host 'Nothing to copy (no event_*.png in SourceDir).' -ForegroundColor Yellow
  }
  else {
    if (-not (Test-Path -LiteralPath $PublicAssets)) {
      New-Item -ItemType Directory -Path $PublicAssets -Force | Out-Null
    }
    if (-not (Test-Path -LiteralPath $MirrorAssets)) {
      New-Item -ItemType Directory -Path $MirrorAssets -Force | Out-Null
    }

    $copied = 0
    foreach ($f in ($files | Sort-Object Name)) {
      $destPublic = Join-Path $PublicAssets $f.Name
      $destMirror = Join-Path $MirrorAssets $f.Name

      Copy-Item -LiteralPath $f.FullName -Destination $destPublic -Force
      Copy-Item -LiteralPath $f.FullName -Destination $destMirror -Force

      $kb = [math]::Round($f.Length / 1KB, 1)
      Write-Host ("  COPY  {0}  ({1} KB)  -> public/assets/ + assets/" -f $f.Name, $kb)
      $copied++
    }

    Write-Host ''
    Write-Host ("Installed {0} file(s) into both asset trees." -f $copied) -ForegroundColor Green
  }
}
elseif (-not $ListMissing) {
  Write-Host @'
Usage:
  .\scripts\install_event_posters.ps1 -SourceDir <folder-with-event_*.png> [-ListMissing]
  .\scripts\install_event_posters.ps1 -ListMissing

Copies event_*.png into public/assets/ and assets/ (dual layout).
'@
  exit 1
}

if ($ListMissing) {
  Show-MissingEventFiles
}
