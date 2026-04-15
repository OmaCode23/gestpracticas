$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot "dist-demo"
$standaloneDir = Join-Path $projectRoot ".next\standalone"
$staticDir = Join-Path $projectRoot ".next\static"
$publicDir = Join-Path $projectRoot "public"
$readmeSourcePath = Join-Path $projectRoot "README-demo.txt"
$backupSourcePath = Join-Path $projectRoot "gestpracticas_demo.backup"

if (-not (Test-Path $standaloneDir)) {
  throw "No se ha encontrado .next\\standalone. Ejecuta primero 'npm run build'."
}

if (Test-Path $outputDir) {
  Remove-Item -LiteralPath $outputDir -Recurse -Force
}

New-Item -ItemType Directory -Path $outputDir | Out-Null

Copy-Item -Path (Join-Path $standaloneDir "*") -Destination $outputDir -Recurse -Force

$targetNextDir = Join-Path $outputDir ".next"
New-Item -ItemType Directory -Path $targetNextDir -Force | Out-Null
Copy-Item -Path $staticDir -Destination $targetNextDir -Recurse -Force

if (Test-Path $publicDir) {
  Copy-Item -Path $publicDir -Destination $outputDir -Recurse -Force
}

Copy-Item -LiteralPath (Join-Path $projectRoot "package.json") -Destination $outputDir -Force

if (Test-Path (Join-Path $projectRoot ".env")) {
  $sourceEnvPath = Join-Path $projectRoot ".env"
  $targetEnvPath = Join-Path $outputDir ".env"

  $envLines = Get-Content -LiteralPath $sourceEnvPath
  $updatedEnvLines = $envLines | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=') {
      $_ -replace '(/)(gestpracticas)("?)$', '${1}gestpracticas_demo${3}'
    } else {
      $_
    }
  }

  $updatedEnvLines | Set-Content -LiteralPath $targetEnvPath
}

if (-not (Test-Path $readmeSourcePath)) {
  throw "No se ha encontrado README-demo.txt en la raiz del proyecto."
}

Copy-Item -LiteralPath $readmeSourcePath -Destination (Join-Path $outputDir "README-demo.txt") -Force

if (Test-Path $backupSourcePath) {
  Copy-Item -LiteralPath $backupSourcePath -Destination (Join-Path $outputDir "gestpracticas_demo.backup") -Force
}

Write-Host "Paquete demo generado en: $outputDir"
