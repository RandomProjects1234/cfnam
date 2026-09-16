# Builds the two release artifacts from the source in this repo:
#
#   CFNAM-Setup.exe     self-contained Windows installer (app embedded as base64)
#   CFNAM-portable.zip  plain folder, unzip and double-click index.html
#
# Needs nothing installed: uses the C# compiler that ships with .NET Framework
# and PowerShell's own Compress-Archive.
#
#   powershell -ExecutionPolicy Bypass -File installer\build.ps1
#
$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$out  = Join-Path $repo 'installer\out'
$csc  = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if (-not (Test-Path $csc)) { throw "C# compiler not found at $csc" }

Remove-Item $out -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $out | Out-Null

# --- collect the app itself (never the repo plumbing) ---
$payload = Join-Path $out 'payload'
New-Item -ItemType Directory -Force -Path $payload | Out-Null
foreach ($item in @('index.html', 'game', 'studio', 'README.md', 'LICENSE')) {
    Copy-Item (Join-Path $repo $item) -Destination $payload -Recurse -Force
}

# --- portable zip (top-level CFNAM folder so unzip-and-run is obvious) ---
$portableRoot = Join-Path $out 'portable\CFNAM'
New-Item -ItemType Directory -Force -Path $portableRoot | Out-Null
Copy-Item "$payload\*" -Destination $portableRoot -Recurse -Force
Compress-Archive -Path $portableRoot -DestinationPath (Join-Path $out 'CFNAM-portable.zip') -CompressionLevel Optimal

# --- installer payload ---
$payloadZip = Join-Path $out 'cfnam.zip'
Compress-Archive -Path "$payload\*" -DestinationPath $payloadZip -CompressionLevel Optimal

# --- compile the installer with the payload embedded ---
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($payloadZip))
$src = (Get-Content (Join-Path $PSScriptRoot 'Setup.template.cs') -Raw).Replace('@@PAYLOAD@@', $b64)
$csFile = Join-Path $out 'Setup.cs'
Set-Content -Path $csFile -Value $src -Encoding UTF8

$exeOut = Join-Path $out 'CFNAM-Setup.exe'
& $csc /nologo /target:exe /platform:anycpu /optimize+ `
    /reference:System.IO.Compression.dll `
    /reference:System.IO.Compression.FileSystem.dll `
    "/out:$exeOut" $csFile
if ($LASTEXITCODE -ne 0) { throw "compile failed" }

# --- tidy intermediates, keep the artifacts ---
Remove-Item $payload, (Join-Path $out 'portable'), $payloadZip, $csFile -Recurse -Force

Write-Host ""
Write-Host "Built:"
Get-ChildItem $out | ForEach-Object { Write-Host ("  {0,-22} {1,8:N0} bytes" -f $_.Name, $_.Length) }
