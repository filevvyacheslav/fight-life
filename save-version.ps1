param([string]$Label = 'manual')
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$backupRoot = Join-Path $projectRoot 'backups'
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$safeLabel = $Label -replace '[^a-zA-Z0-9_-]', '-'
$stamp = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(3)).ToString('yyyy-MM-dd_HH-mm-ss')
$archive = Join-Path $backupRoot "$stamp-$safeLabel.zip"
$items = @('index.html', 'styles.css', 'script.js', 'README.md', 'serve.mjs', 'save-version.ps1', 'assets') | ForEach-Object { Join-Path $projectRoot $_ }
Compress-Archive -LiteralPath $items -DestinationPath $archive -CompressionLevel Optimal
Write-Output $archive
