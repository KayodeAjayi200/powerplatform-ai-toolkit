# MCP Server Configuration

This file is read by the AI agent during Phase 1D of setup.

The agent collects the credentials listed below from the user, then writes or updates `~/.copilot/mcp-config.json`.

**Important:** If the config file already exists, the agent must read it first and merge changes — never wipe it.

---

## Credentials to collect from the user

Ask the user for each of these before writing the config. Items marked *(optional)* can be skipped and added later.

| Credential | How to get it |
|---|---|
| **GitHub PAT** | github.com → Settings → Developer settings → Fine-grained tokens → New token → give: Contents R/W, Pull requests R/W, Issues R/W, Workflows R/W, Metadata Read |
| **Dataverse Connection URL** | Power Automate → My connections → Common Data Service → `⋯` → Details → copy the full URL |
| **Tenant ID** | Azure Portal → Microsoft Entra ID → Overview → Tenant ID |
| **ADO Org URL** *(optional)* | Your Azure DevOps URL, e.g. `https://dev.azure.com/myorg` |
| **ADO PAT** *(optional)* | dev.azure.com → User settings → Personal access tokens |
| **Copilot Studio MCP URL** *(optional)* | Copilot Studio → your agent → Settings → Channels → MCP Client |
| **Canvas App ID** *(optional — set after app is open in Studio)* | Power Apps Studio URL → after `app-id=` |
| **Canvas Environment ID** *(optional — set after app is open in Studio)* | Power Apps Studio URL → after `/e/` |
| **Filesystem paths** | All local repo folders the agent should access — at minimum: the path to this toolkit + any solution repos |

---

## Write or merge the MCP config

```powershell
# ── Collect values ────────────────────────────────────────────────────────────
# Replace each placeholder with the value the user provided
$githubPat      = "PASTE_GITHUB_PAT_HERE"
$dataverseUrl   = "PASTE_DATAVERSE_CONNECTION_URL_HERE"
$tenantId       = "PASTE_TENANT_ID_HERE"
$adoOrgUrl      = "PASTE_ADO_ORG_URL_HERE"          # or "" to skip
$adoPat         = "PASTE_ADO_PAT_HERE"               # or "" to skip
$copilotStudio  = "PASTE_COPILOT_STUDIO_MCP_URL"     # or "" to skip
$canvasAppId    = "PASTE_CANVAS_APP_ID_HERE"          # or "" to set later
$canvasEnvId    = "PASTE_CANVAS_ENV_ID_HERE"          # or "" to set later

# Filesystem paths — start with this toolkit, add solution repos as needed
# The agent will prompt the user for solution repo paths in PART C
$filesystemPaths = @(
    "C:\Repositories\powerplatform-ai-toolkit"   # <-- update to actual clone path
    # "C:\Repositories\my-hr-app"               # add solution repos here
)

# ── Ensure config folder exists ───────────────────────────────────────────────
$mcpDir  = Join-Path $env:USERPROFILE ".copilot"
$mcpPath = Join-Path $mcpDir "mcp-config.json"
New-Item -ItemType Directory -Force -Path $mcpDir | Out-Null

# ── Read existing config or start fresh ──────────────────────────────────────
# If the config file already exists, we read it and merge in — we never overwrite
if (Test-Path $mcpPath) {
    Write-Host "Existing mcp-config.json found — merging (not overwriting)"
    $mcp = Get-Content $mcpPath -Raw | ConvertFrom-Json
} else {
    Write-Host "No mcp-config.json found — creating new one"
    $mcp = [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
}

# ── Helper: add or update a single MCP server entry ──────────────────────────
function Set-McpServer($config, $key, $value) {
    # Add the server if it doesn't exist; update it if it does
    if ($config.mcpServers.PSObject.Properties[$key]) {
        $config.mcpServers.$key = $value
        Write-Host "  Updated MCP server: $key"
    } else {
        $config.mcpServers | Add-Member -NotePropertyName $key -NotePropertyValue $value -Force
        Write-Host "  Added MCP server: $key"
    }
}

# ── Canvas App Authoring MCP (primary — stable global tool) ──────────────────
# Official docs: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server
Set-McpServer $mcp "powerapps-canvas" ([PSCustomObject]@{
    command = "CanvasAuthoringMcpServer"
    args    = @()
    env     = [PSCustomObject]@{
        CANVAS_APP_ID           = $canvasAppId
        CANVAS_ENVIRONMENT_ID   = $canvasEnvId
        CANVAS_CLUSTER_CATEGORY = "prod"
    }
})

# ── Canvas App Authoring MCP (secondary — prerelease via dnx) ────────────────
Set-McpServer $mcp "canvas-authoring" ([PSCustomObject]@{
    type    = "stdio"
    command = "dnx"
    args    = @(
        "Microsoft.PowerApps.CanvasAuthoring.McpServer",
        "--yes", "--prerelease",
        "--source", "https://api.nuget.org/v3/index.json"
    )
    env     = [PSCustomObject]@{
        CANVAS_APP_ID           = $canvasAppId
        CANVAS_ENVIRONMENT_ID   = $canvasEnvId
        CANVAS_CLUSTER_CATEGORY = "prod"
    }
})

# ── Dataverse MCP ─────────────────────────────────────────────────────────────
# Official docs: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/dataverse-mcp
Set-McpServer $mcp "dataverse" ([PSCustomObject]@{
    type    = "local"
    command = "Microsoft.PowerPlatform.Dataverse.MCP"
    args    = @(
        "--ConnectionUrl", $dataverseUrl,
        "--TenantId",      $tenantId,
        "--MCPServerName", "DataverseMCPServer",
        "--BackendProtocol", "HTTP"
    )
})

# ── Copilot Studio MCP (skip if no URL provided) ─────────────────────────────
if ($copilotStudio -ne "" -and $copilotStudio -ne "PASTE_COPILOT_STUDIO_MCP_URL") {
    Set-McpServer $mcp "copilot-studio" ([PSCustomObject]@{
        type    = "local"
        command = "Microsoft.Agents.CopilotStudio.Mcp"
        args    = @(
            "--remote-server-url", $copilotStudio,
            "--tenant-id",         $tenantId,
            "--scopes",            "https://api.powerplatform.com/.default"
        )
    })
}

# ── GitHub MCP ────────────────────────────────────────────────────────────────
Set-McpServer $mcp "github" ([PSCustomObject]@{
    type    = "local"
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-github")
    env     = [PSCustomObject]@{ GITHUB_PERSONAL_ACCESS_TOKEN = $githubPat }
})

# ── Azure DevOps MCP (skip if no credentials provided) ───────────────────────
if ($adoOrgUrl -ne "" -and $adoPat -ne "" -and $adoPat -ne "PASTE_ADO_PAT_HERE") {
    Set-McpServer $mcp "azure-devops" ([PSCustomObject]@{
        type    = "local"
        command = "npx"
        args    = @("-y", "@tiberriver256/mcp-server-azure-devops")
        env     = [PSCustomObject]@{
            AZURE_DEVOPS_ORG_URL     = $adoOrgUrl
            AZURE_DEVOPS_AUTH_METHOD = "pat"
            AZURE_DEVOPS_PAT         = $adoPat
        }
    })
}

# ── Filesystem MCP ────────────────────────────────────────────────────────────
# Merges new paths into existing list — never removes paths already configured
$existingPaths = @()
if ($mcp.mcpServers.PSObject.Properties["filesystem"]) {
    # Extract existing paths (everything after "-y" and the package name)
    $existingArgs = $mcp.mcpServers.filesystem.args
    $existingPaths = $existingArgs | Where-Object { $_ -notmatch "^-" -and $_ -notmatch "^@" }
}
# Combine existing + new, deduplicate
$allPaths = ($existingPaths + $filesystemPaths) | Sort-Object -Unique
$fsArgs   = @("-y", "@modelcontextprotocol/server-filesystem") + $allPaths

Set-McpServer $mcp "filesystem" ([PSCustomObject]@{
    type    = "local"
    command = "npx"
    args    = $fsArgs
})

# ── Memory MCP ───────────────────────────────────────────────────────────────
Set-McpServer $mcp "memory" ([PSCustomObject]@{
    type    = "local"
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-memory")
})

# ── Sequential Thinking MCP ──────────────────────────────────────────────────
Set-McpServer $mcp "sequential-thinking" ([PSCustomObject]@{
    type    = "local"
    command = "npx"
    args    = @("-y", "@modelcontextprotocol/server-sequential-thinking")
})

# ── Playwright MCP ───────────────────────────────────────────────────────────
Set-McpServer $mcp "playwright" ([PSCustomObject]@{
    type    = "local"
    command = "npx"
    args    = @("-y", "@playwright/mcp")
})

# ── Write the updated config ──────────────────────────────────────────────────
$mcp | ConvertTo-Json -Depth 10 | Set-Content $mcpPath -Encoding UTF8
Write-Host ""
Write-Host "MCP config written to: $mcpPath"
Write-Host "Filesystem MCP covers: $($allPaths -join ', ')"
Write-Host "Restart your AI coding tool for the changes to take effect."
```

---

## Updating canvas App ID / Environment ID later

When the user opens a canvas app in Studio, run this to update the two canvas MCP entries:

```powershell
$mcpPath  = Join-Path $env:USERPROFILE ".copilot\mcp-config.json"
$mcp      = Get-Content $mcpPath -Raw | ConvertFrom-Json
$newAppId = "PASTE_NEW_APP_ID"
$newEnvId = "PASTE_NEW_ENV_ID"

foreach ($key in @("powerapps-canvas", "canvas-authoring")) {
    if ($mcp.mcpServers.PSObject.Properties[$key]) {
        $mcp.mcpServers.$key.env.CANVAS_APP_ID         = $newAppId
        $mcp.mcpServers.$key.env.CANVAS_ENVIRONMENT_ID = $newEnvId
    }
}
$mcp | ConvertTo-Json -Depth 10 | Set-Content $mcpPath -Encoding UTF8
Write-Host "Canvas MCP updated for app: $newAppId"
```
