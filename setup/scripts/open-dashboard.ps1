[CmdletBinding()]
param(
    [string]$ProjectPath = (Get-Location).Path,
    [int]$Port = 4817,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

function Resolve-ProjectRoot {
    param([string]$StartPath)

    $candidate = (Resolve-Path -LiteralPath $StartPath).Path
    if ((Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $candidate = Split-Path -Parent $candidate
    }

    while ($candidate) {
        $serverPath = Join-Path $candidate "dashboard\server.js"
        if (Test-Path -LiteralPath $serverPath) {
            return $candidate
        }

        $parent = Split-Path -Parent $candidate
        if ($parent -eq $candidate) { break }
        $candidate = $parent
    }

    throw "Could not find dashboard\server.js from '$StartPath'. Run this from the toolkit/project repo root or pass -ProjectPath."
}

function Test-Dashboard {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -Uri "$Url/api/state" -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

$root = Resolve-ProjectRoot -StartPath $ProjectPath
$server = Join-Path $root "dashboard\server.js"
$url = "http://127.0.0.1:$Port"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js was not found on PATH. Install Node.js or use the dashboard/state JSON files directly as the fallback."
}

if (-not (Test-Dashboard -Url $url)) {
    $logDir = Join-Path $root ".dashboard"
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $outLogPath = Join-Path $logDir "server-$Port.out.log"
    $errLogPath = Join-Path $logDir "server-$Port.err.log"

    $env:PORT = [string]$Port
    $process = Start-Process -FilePath "node" `
        -ArgumentList @($server) `
        -WorkingDirectory $root `
        -WindowStyle Hidden `
        -RedirectStandardOutput $outLogPath `
        -RedirectStandardError $errLogPath `
        -PassThru

    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Dashboard -Url $url) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        throw "Dashboard server did not respond at $url. Check $outLogPath and $errLogPath. Process ID: $($process.Id)"
    }
}

if (-not $NoBrowser) {
    Start-Process $url | Out-Null
}

Write-Host "Dashboard is running: $url"
Write-Host "Project root: $root"
