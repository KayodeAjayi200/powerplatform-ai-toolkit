# MCP Server Configuration

This file is read by the AI agent during Phase 1D of setup.

The agent collects the credentials listed below from the user, then writes or updates `~/.copilot/mcp-config.json`.

**Important:** Before writing MCP config, read `setup/agentic-mcp-clients.md` and detect the active coding client. This file gives the default Copilot-style JSON setup used by this toolkit, but other clients use different config locations and schema roots. If the config file already exists, the agent must read it first and merge changes — never wipe it.

---

## Two ways to set up the Canvas Authoring MCP

### Option A — GitHub Copilot CLI plugin install (easiest)

If you are using **GitHub Copilot CLI**, install the Power Platform Skills plugin directly:

```
/plugin marketplace add microsoft/power-platform-skills
/plugin install canvas-apps@power-platform-skills
```

After installing, either run `/configure-canvas-mcp` when your app is open in Studio, or just describe what
you want to build — the tool will detect that the MCP server needs configuring and walk you through it.

The plugin repository contains full control documentation, design guidance, and workflow instructions:
**https://aka.ms/canvas-authoring-mcp**

### Option B — Manual MCP config (all other tools)

For Claude Code, Cursor, and other tools that use an `mcp-config.json` file, use the scripts below.

---

## ⚠️ Coauthoring must be enabled before the Canvas MCP will work

Before the Canvas Authoring MCP can connect to your app, **coauthoring must be turned on** in Power Apps Studio:

1. Open your canvas app in Power Apps Studio
2. Go to **Settings → Updates**
3. Turn on **Coauthoring**
4. Keep the Studio tab open — the MCP server connects to the live session

If coauthoring is off, the MCP server will not be able to sync changes into the app.

---

## Quick way to set Canvas App ID and Environment ID

Once your app is open in Studio with coauthoring enabled, the easiest way to configure the Canvas MCP is:

**GitHub Copilot CLI:** Run `/configure-canvas-mcp` and paste the Studio URL when prompted.
The tool extracts your environment ID, app ID, and cluster information automatically — no manual ID copying needed.

**Other tools (Claude Code, Cursor, etc.):** Copy the Studio URL and pull out the IDs manually:
```
https://make.powerapps.com/e/<ENVIRONMENT_ID>/canvas/?action=edit&app-id=<APP_ID>
```
Then use the update script at the bottom of this file.

Official docs: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/create-canvas-external-tools

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
# Plugin repo: https://aka.ms/canvas-authoring-mcp
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

### Faster and safer option: update from Studio URL (recommended)

Use the helper script in this repo to parse the URL and update both MCP entries atomically:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\update-canvas-mcp-from-url.ps1 `
  -StudioUrl "https://make.powerapps.com/e/<ENV_ID>/canvas/?action=edit&app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F<APP_ID>"
```

This avoids copy/paste mistakes and guarantees both `powerapps-canvas` and `canvas-authoring` stay aligned.

**GitHub Copilot CLI shortcut:** Instead of running the script above, just run `/configure-canvas-mcp` with your app open in Studio and paste the Studio URL. It handles the update automatically.

---

## Troubleshooting

### Agent policy (required behavior)

For any canvas edit/build task, agents must run this sequence proactively:

1. Detect the active coding client and load its MCP rules from `setup/agentic-mcp-clients.md`.
2. If a Studio URL is provided and this toolkit's PowerShell helper is available, run:
```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\update-canvas-mcp-from-url.ps1 `
  -StudioUrl "<STUDIO_URL>"
```
3. If the active client is not using `~/.copilot/mcp-config.json`, write the same App ID and Environment ID into that client's correct config file and schema.
4. Restart/reload both MCP servers (`powerapps-canvas`, `canvas-authoring`) where both are configured.
5. Run `list_controls` as a hard validation gate.
6. If `list_controls` fails, run one automated recovery cycle:
   - re-run the URL script,
   - re-check the active client's actual config file,
   - restart the relevant MCP servers,
   - ask user to refresh Studio and confirm coauthoring ON,
   - wait 20-30 seconds,
   - retry `list_controls`.
7. Do not continue to `sync_canvas` or `compile_canvas` until `list_controls` succeeds.

Never assume all clients use `mcpServers`. Codex uses TOML under `[mcp_servers.<name>]`; VS Code uses `"servers"`; Zed uses `"context_servers"`.

### Fast recovery checklist (the exact flow that fixed your MCP issues)

When Canvas MCP is failing, run this sequence in order:

1. Copy the full Studio edit URL for the app you want to edit:
   `https://make.powerapps.com/e/<ENV_ID>/canvas/?action=edit&app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F<APP_ID>`
2. Extract IDs from that URL:
   - Environment ID = value after `/e/`
   - App ID = final GUID after `apps%2F` (or `apps/`)
3. Update **both** MCP entries in `~/.copilot/mcp-config.json`:
   - `mcpServers.powerapps-canvas.env.CANVAS_APP_ID / CANVAS_ENVIRONMENT_ID`
   - `mcpServers.canvas-authoring.env.CANVAS_APP_ID / CANVAS_ENVIRONMENT_ID`
4. Restart MCP servers (or restart your coding tool) so config is reloaded.
5. Confirm Power Apps Studio has coauthoring enabled and the app tab is still open.
6. Pull current app state:
   - `powerapps-canvas-sync_canvas` (this is pull-only and overwrites local YAML)
7. Edit YAML locally.
8. Push changes back:
   - `powerapps-canvas-compile_canvas` (Validation PASSED = committed to Studio)

Common confusion to avoid:
- `sync_canvas` pulls only; it does not push edits.
- `compile_canvas` is what pushes to Studio.
- If one canvas MCP entry is updated and the other is stale, you may get inconsistent failures.

### Changes are not showing up in Power Apps Studio

1. Make sure **coauthoring is enabled**: Studio → Settings → Updates → Coauthoring (must be on)
2. Ask the AI tool to list available controls — if it gets a response, the MCP connection is working
3. Run `/configure-canvas-mcp` again with a fresh Studio URL to re-establish the session

### The Canvas MCP server is not responding

1. Check that .NET 10.0+ is installed: run `dotnet --version` — it must show `10.x` or higher
2. Check that `CanvasAuthoringMcpServer` is installed: run `dotnet tool list -g`
3. Make sure the Studio tab is still open and coauthoring is on — the server connects to the live session
4. Run `/configure-canvas-mcp` again to re-register the connection

### App was broken by recent changes — how to roll back

Tell the AI tool: "The recent changes broke the app. Please revert to the last working version."

The agent will:
1. Sync the current state from the coauthoring session
2. Identify which changes were made
3. Restore the previous working code
4. Validate and re-sync the stable version
