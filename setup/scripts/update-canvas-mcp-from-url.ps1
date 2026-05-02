param(
    [Parameter(Mandatory = $true)]
    [string]$StudioUrl
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-CanvasIdsFromStudioUrl {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        throw "Studio URL cannot be empty."
    }

    $envMatch = [regex]::Match($Url, "/e/([0-9a-fA-F-]{36})/")
    if (-not $envMatch.Success) {
        throw "Could not extract Environment ID from URL. Expected segment '/e/<GUID>/'."
    }

    $decoded = [System.Uri]::UnescapeDataString($Url)
    $appMatch = [regex]::Match($decoded, "app-id=.*/apps/([0-9a-fA-F-]{36})")
    if (-not $appMatch.Success) {
        throw "Could not extract App ID from URL. Expected 'app-id=.../apps/<GUID>'."
    }

    [PSCustomObject]@{
        AppId = $appMatch.Groups[1].Value
        EnvironmentId = $envMatch.Groups[1].Value
    }
}

$ids = Get-CanvasIdsFromStudioUrl -Url $StudioUrl
$mcpPath = Join-Path $env:USERPROFILE ".copilot\mcp-config.json"

if (-not (Test-Path $mcpPath)) {
    throw "MCP config not found at '$mcpPath'. Create it first using setup/mcp-config.md."
}

$config = Get-Content $mcpPath -Raw | ConvertFrom-Json

foreach ($serverKey in @("powerapps-canvas", "canvas-authoring")) {
    if (-not $config.mcpServers.PSObject.Properties[$serverKey]) {
        throw "Missing mcpServers.$serverKey in '$mcpPath'. Add it from setup/mcp-config.md first."
    }

    if (-not $config.mcpServers.$serverKey.env) {
        $config.mcpServers.$serverKey | Add-Member -NotePropertyName "env" -NotePropertyValue ([PSCustomObject]@{}) -Force
    }

    $config.mcpServers.$serverKey.env.CANVAS_APP_ID = $ids.AppId
    $config.mcpServers.$serverKey.env.CANVAS_ENVIRONMENT_ID = $ids.EnvironmentId
    if (-not $config.mcpServers.$serverKey.env.CANVAS_CLUSTER_CATEGORY) {
        $config.mcpServers.$serverKey.env.CANVAS_CLUSTER_CATEGORY = "prod"
    }
}

$config | ConvertTo-Json -Depth 12 | Set-Content $mcpPath -Encoding UTF8

Write-Host "Updated canvas MCP IDs in: $mcpPath"
Write-Host "  App ID: $($ids.AppId)"
Write-Host "  Environment ID: $($ids.EnvironmentId)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart/reload MCP servers (powerapps-canvas and canvas-authoring)."
Write-Host "  2. Keep the app open in Power Apps Studio with Coauthoring enabled."
