# Import .env.production into Vercel Production (Windows helper).
# Requires: Node 20+, vercel login + vercel link
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts\import-vercel-env.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\import-vercel-env.ps1 -DryRun

param(
  [switch]$DryRun,
  [switch]$SkipEmpty,
  [string]$EnvFile = ".env.production"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$argsList = @("scripts/import-vercel-env.mjs", "--env-file", $EnvFile)
if ($DryRun) { $argsList += "--dry-run" }
if ($SkipEmpty) { $argsList += "--skip-empty" }

Write-Host "Running: node $($argsList -join ' ')"
& node @argsList
exit $LASTEXITCODE
