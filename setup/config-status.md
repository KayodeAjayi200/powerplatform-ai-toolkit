# Configuration Status Check

Run this check at the **start of every session** before writing any code. Report the results to the user, then configure any items that are pending.

---

## How to Run

Call each verification step in this table. For each item, report ✅ OK, ⚠️ Partial, or ❌ Missing.

| # | Configuration Item | How to Verify | How to Configure |
|---|---|---|---|
| 1 | **Canvas Authoring MCP connected** | Call `list_data_sources` — if it succeeds, MCP is live | Follow `skills/configure-canvas-mcp` or `skills/canvas-authoring-mcp` |
| 2 | **Correct app loaded in MCP** | Compare app name from `list_data_sources` or `list_controls` with user's expected app | Call `canvas-authoring-connect` with the correct env + app IDs |
| 3 | **Data sources available** | Call `list_data_sources` and check expected tables are present | Add via Power Apps Studio Data panel (see `skills/add-data-source`) |
| 4 | **Azure DevOps PAT stored** | Check `~/.copilot/session-state/<session-id>/.env` for `ADO_PAT` | Ask user for PAT; store in `.env` file; note ADO org and project |
| 5 | **ADO project and org confirmed** | Validate with `Invoke-RestMethod` GET on `/_apis/projects` | Ask user for org URL and project name |
| 6 | **ADO MCP configured** (preferred) | Check `mcp-tools/azure-devops.md` — if ADO MCP is in config, use it | Follow `mcp-tools/azure-devops.md` setup; fall back to REST API if unavailable |
| 7 | **GitHub MCP connected** | Call `github-mcp-server-get_file_contents` on any known file | Check MCP config; GitHub MCP uses user's existing auth token |
| 8 | **Live app folder synced** | Check if `.pa.yaml` files exist locally for the target app | Call `sync_canvas directoryPath: "<local-path>"` |
| 9 | **Dashboard running** | `curl http://127.0.0.1:4817` — should return HTML | Run `node ./dashboard/server.js` in the toolkit repo |
| 10 | **Delegation profile checked** | Confirm data source type (SharePoint / Dataverse / SQL) | Read `skills/powerapps-delegation.md` before writing any `Filter()` formula |

---

## Session Start Script (PowerShell)

```powershell
# 1. Test ADO connection
$pat  = $env:ADO_PAT
$org  = "https://dev.azure.com/YOUR_ORG"
$b64  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$resp = Invoke-RestMethod "$org/_apis/projects?api-version=7.0" `
    -Headers @{ Authorization = "Basic $b64" }
Write-Host "ADO projects: $($resp.count)"

# 2. Start dashboard if not running
$port = 4817
if (-not (Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet)) {
    Start-Process node -ArgumentList "./dashboard/server.js" -WorkingDirectory "C:\path\to\powerplatform-ai-toolkit" -WindowStyle Hidden
    Write-Host "Dashboard started at http://127.0.0.1:$port"
} else {
    Write-Host "Dashboard already running at http://127.0.0.1:$port"
}
```

---

## Report Template

At session start, output this table to the user:

```
## Configuration Status

| Item | Status | Notes |
|---|---|---|
| Canvas Authoring MCP | ✅ / ⚠️ / ❌ | App: <name> |
| Data sources | ✅ / ⚠️ / ❌ | <list names> |
| Azure DevOps | ✅ / ⚠️ / ❌ | Org: <org>, Project: <project> |
| ADO MCP | ✅ / ⚠️ / ❌ | Using MCP / REST fallback |
| GitHub MCP | ✅ / ⚠️ / ❌ | |
| Live YAML synced | ✅ / ⚠️ / ❌ | Path: <path> |
| Dashboard | ✅ / ⚠️ / ❌ | http://127.0.0.1:4817 |
| Delegation profile | ✅ / ⚠️ / ❌ | Source type: <type> |

Items marked ⚠️ or ❌ will be resolved before work begins.
```

---

## Automatic Resolution Rules

- **ADO PAT missing** → ask the user once; do not start ADO work until confirmed
- **MCP not connected** → follow configure-canvas-mcp skill immediately; do not attempt YAML edits until connected
- **Data sources missing** → invoke add-data-source skill; do not write gallery Items formulas until confirmed
- **Dashboard not running** → start it silently; report the URL
- **Live YAML not synced** → run `sync_canvas` before any edit; never guess current control names
