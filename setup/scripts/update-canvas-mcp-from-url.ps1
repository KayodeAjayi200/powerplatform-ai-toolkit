param(
    [Parameter(Mandatory = $true)]
    [string]$StudioUrl,

    [string]$ProjectPath = (Get-Location).Path,

    [switch]$SkipUserConfigs,

    [switch]$SkipProjectConfigs
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

function Get-CanvasCommand {
    $toolPath = Join-Path $env:USERPROFILE ".dotnet\tools\CanvasAuthoringMcpServer.cmd"
    $isWindowsHost = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT
    if ($isWindowsHost -and (Test-Path $toolPath)) {
        return [PSCustomObject]@{
            Command = "cmd.exe"
            Args = @("/c", $toolPath)
            Note = "absolute Windows tool path"
        }
    }

    return [PSCustomObject]@{
        Command = "CanvasAuthoringMcpServer"
        Args = @()
        Note = "PATH lookup"
    }
}

function Ensure-DirectoryForFile {
    param([string]$Path)
    $dir = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

function Read-JsonConfig {
    param([string]$Path)

    if (Test-Path $Path) {
        $raw = Get-Content $Path -Raw
        if (-not [string]::IsNullOrWhiteSpace($raw)) {
            return $raw | ConvertFrom-Json
        }
    }

    return [PSCustomObject]@{}
}

function Set-ObjectProperty {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)]$Value
    )

    if ($Object.PSObject.Properties[$Name]) {
        $Object.$Name = $Value
    } else {
        $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value -Force
    }
}

function Write-JsonConfig {
    param(
        [string]$Path,
        $Config
    )

    Ensure-DirectoryForFile -Path $Path
    $Config | ConvertTo-Json -Depth 20 | Set-Content $Path -Encoding UTF8
}

function New-CanvasJsonServer {
    param($Ids, $CanvasCommand, [switch]$IncludeType)

    $server = [PSCustomObject]@{
        command = $CanvasCommand.Command
        args = $CanvasCommand.Args
        env = [PSCustomObject]@{
            CANVAS_APP_ID = $Ids.AppId
            CANVAS_ENVIRONMENT_ID = $Ids.EnvironmentId
            CANVAS_CLUSTER_CATEGORY = "prod"
        }
    }

    if ($IncludeType) {
        $server | Add-Member -NotePropertyName "type" -NotePropertyValue "stdio" -Force
    }

    return $server
}

function New-CanvasAuthoringJsonServer {
    param($Ids, [switch]$IncludeType)

    $server = [PSCustomObject]@{
        command = "dnx"
        args = @(
            "Microsoft.PowerApps.CanvasAuthoring.McpServer",
            "--yes", "--prerelease",
            "--source", "https://api.nuget.org/v3/index.json"
        )
        env = [PSCustomObject]@{
            CANVAS_APP_ID = $Ids.AppId
            CANVAS_ENVIRONMENT_ID = $Ids.EnvironmentId
            CANVAS_CLUSTER_CATEGORY = "prod"
        }
    }

    if ($IncludeType) {
        $server | Add-Member -NotePropertyName "type" -NotePropertyValue "stdio" -Force
    }

    return $server
}

function Update-JsonMcpConfig {
    param(
        [string]$Path,
        [string]$RootProperty,
        $Ids,
        $CanvasCommand,
        [switch]$IncludeType
    )

    $config = Read-JsonConfig -Path $Path
    if (-not $config.PSObject.Properties[$RootProperty]) {
        Set-ObjectProperty -Object $config -Name $RootProperty -Value ([PSCustomObject]@{})
    }

    $root = $config.$RootProperty
    Set-ObjectProperty -Object $root -Name "powerapps-canvas" -Value (New-CanvasJsonServer -Ids $Ids -CanvasCommand $CanvasCommand -IncludeType:$IncludeType)
    Set-ObjectProperty -Object $root -Name "canvas-authoring" -Value (New-CanvasAuthoringJsonServer -Ids $Ids -IncludeType:$IncludeType)
    Write-JsonConfig -Path $Path -Config $config
    Write-Host "Updated JSON MCP config: $Path"
}

function Remove-TomlSection {
    param(
        [string]$Text,
        [string]$Section
    )

    $escaped = [regex]::Escape($Section)
    $pattern = "(?ms)^\[$escaped\]\r?\n.*?(?=^\[|\z)"
    return [regex]::Replace($Text, $pattern, "")
}

function Update-CodexTomlConfig {
    param(
        [string]$Path,
        $Ids,
        $CanvasCommand
    )

    Ensure-DirectoryForFile -Path $Path
    $content = ""
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw
    }
    if ($null -eq $content) {
        $content = ""
    }

    foreach ($section in @(
        "mcp_servers.powerapps-canvas",
        "mcp_servers.powerapps-canvas.env",
        "mcp_servers.canvas-authoring",
        "mcp_servers.canvas-authoring.env"
    )) {
        $content = Remove-TomlSection -Text $content -Section $section
    }

    $argsLiteral = (($CanvasCommand.Args | ForEach-Object {
        '"' + ($_ -replace '\\', '\\' -replace '"', '\"') + '"'
    }) -join ", ")

    $block = @"

[mcp_servers.powerapps-canvas]
command = "$($CanvasCommand.Command)"
args = [$argsLiteral]
startup_timeout_sec = 30
tool_timeout_sec = 120

[mcp_servers.powerapps-canvas.env]
CANVAS_APP_ID = "$($Ids.AppId)"
CANVAS_ENVIRONMENT_ID = "$($Ids.EnvironmentId)"
CANVAS_CLUSTER_CATEGORY = "prod"

[mcp_servers.canvas-authoring]
command = "dnx"
args = ["Microsoft.PowerApps.CanvasAuthoring.McpServer", "--yes", "--prerelease", "--source", "https://api.nuget.org/v3/index.json"]
startup_timeout_sec = 30
tool_timeout_sec = 120

[mcp_servers.canvas-authoring.env]
CANVAS_APP_ID = "$($Ids.AppId)"
CANVAS_ENVIRONMENT_ID = "$($Ids.EnvironmentId)"
CANVAS_CLUSTER_CATEGORY = "prod"
"@

    ($content.TrimEnd() + $block + [Environment]::NewLine) | Set-Content $Path -Encoding UTF8
    Write-Host "Updated Codex TOML config: $Path"
}

$ids = Get-CanvasIdsFromStudioUrl -Url $StudioUrl
$canvasCommand = Get-CanvasCommand

Write-Host "Canvas IDs parsed from Studio URL:"
Write-Host "  App ID:         $($ids.AppId)"
Write-Host "  Environment ID: $($ids.EnvironmentId)"
Write-Host "Canvas command: $($canvasCommand.Command) $($canvasCommand.Args -join ' ') ($($canvasCommand.Note))"
Write-Host ""

if (-not $SkipUserConfigs) {
    Update-JsonMcpConfig -Path (Join-Path $env:USERPROFILE ".copilot\mcp-config.json") -RootProperty "mcpServers" -Ids $ids -CanvasCommand $canvasCommand
    Update-CodexTomlConfig -Path (Join-Path $env:USERPROFILE ".codex\config.toml") -Ids $ids -CanvasCommand $canvasCommand

    $cursorPath = Join-Path $env:USERPROFILE ".cursor\mcp.json"
    if (Test-Path (Split-Path -Parent $cursorPath)) {
        Update-JsonMcpConfig -Path $cursorPath -RootProperty "mcpServers" -Ids $ids -CanvasCommand $canvasCommand
    }

    $claudePath = Join-Path $env:USERPROFILE ".claude.json"
    if (Test-Path $claudePath) {
        Update-JsonMcpConfig -Path $claudePath -RootProperty "mcpServers" -Ids $ids -CanvasCommand $canvasCommand
    }

    $windsurfPath = Join-Path $env:USERPROFILE ".codeium\windsurf\mcp_config.json"
    if (Test-Path (Split-Path -Parent $windsurfPath)) {
        Update-JsonMcpConfig -Path $windsurfPath -RootProperty "mcpServers" -Ids $ids -CanvasCommand $canvasCommand
    }
}

if (-not $SkipProjectConfigs -and -not [string]::IsNullOrWhiteSpace($ProjectPath)) {
    New-Item -ItemType Directory -Force -Path $ProjectPath | Out-Null

    Update-CodexTomlConfig -Path (Join-Path $ProjectPath ".codex\config.toml") -Ids $ids -CanvasCommand $canvasCommand
    Update-JsonMcpConfig -Path (Join-Path $ProjectPath ".vscode\mcp.json") -RootProperty "servers" -Ids $ids -CanvasCommand $canvasCommand -IncludeType
    Update-JsonMcpConfig -Path (Join-Path $ProjectPath ".cursor\mcp.json") -RootProperty "mcpServers" -Ids $ids -CanvasCommand $canvasCommand
    Update-JsonMcpConfig -Path (Join-Path $ProjectPath ".mcp.json") -RootProperty "mcpServers" -Ids $ids -CanvasCommand $canvasCommand
    Update-JsonMcpConfig -Path (Join-Path $ProjectPath ".zed\settings.json") -RootProperty "context_servers" -Ids $ids -CanvasCommand $canvasCommand
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart/reload MCP servers in the active coding tool."
Write-Host "  2. Keep the app open in Power Apps Studio with Coauthoring enabled."
Write-Host "  3. Verify with list_controls before running sync_canvas or compile_canvas."
