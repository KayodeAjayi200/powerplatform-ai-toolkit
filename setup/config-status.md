# Configuration Status Check

Run this check at the **start of every session** before writing any code. Report the results to the user, then configure any items that are pending.

---

## How to Run

Call each verification step in this table. For each item, report ✅ OK, ⚠️ Partial, or ❌ Missing.

| # | Configuration Item | How to Verify | How to Configure |
|---|---|---|---|
| 1 | **Canvas Authoring MCP connected** | Call `list_data_sources` — if it succeeds, MCP is live | Follow `skills/canvas-authoring-mcp.md` or [`mcp-tools/canvas-authoring.md`](../mcp-tools/canvas-authoring.md) |
| 2 | **Correct app loaded in MCP** | Compare app name from `list_data_sources` or `list_controls` with user's expected app | Call `canvas-authoring-connect` with the correct env + app IDs |
| 3 | **Data sources available** | Call `list_data_sources` and check expected tables are present | Add via Power Apps Studio Data panel; see [`mcp-tools/dataverse.md`](../mcp-tools/dataverse.md) or `setup/datasource-mcps.md` |
| 4 | **ADO MCP configured** | Check `~/.copilot/mcp.json` (or equivalent) for `azure-devops` entry | Follow [`mcp-tools/azure-devops.md`](../mcp-tools/azure-devops.md) — remote HTTP, no PAT needed |
| 5 | **ADO org and project confirmed** | If ADO MCP is live, call a list-projects tool; otherwise verify org URL with user | Ask user for org URL and project name |
| 6 | **GitHub MCP connected** | Call `github-mcp-server-get_file_contents` on any known file | See [`mcp-tools/github.md`](../mcp-tools/github.md); GitHub MCP uses the user's existing auth token |
| 7 | **Microsoft Learn MCP available** | Call a search tool from the Learn MCP | See [`mcp-tools/microsoft-learn.md`](../mcp-tools/microsoft-learn.md) — remote HTTP, no credentials needed |
| 8 | **Live app folder synced** | Check if `.pa.yaml` files exist locally for the target app | Call `sync_canvas directoryPath: "<local-path>"` |
| 9 | **Delegation profile checked** | Confirm data source type (SharePoint / Dataverse / SQL) | Read `skills/delegation.md` before writing any `Filter()` formula |

---

## Session Start Script (PowerShell)

```powershell
# 1. Test ADO connection (remote HTTP MCP — no PAT needed, browser auth on first use)
# If ADO MCP is configured in mcp-config.json the agent will authenticate automatically.
# To verify manually:
$org = "https://dev.azure.com/YOUR_ORG"
Invoke-RestMethod "$org/_apis/projects?api-version=7.0" `
    -Headers @{ Authorization = "Bearer $(az account get-access-token --resource '499b84ac-1321-427f-aa17-267ca6975798' | ConvertFrom-Json).accessToken" } | Select-Object -ExpandProperty value | Select-Object name
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
| Azure DevOps MCP | ✅ / ⚠️ / ❌ | Org: <org>, Project: <project> |
| GitHub MCP | ✅ / ⚠️ / ❌ | |
| Microsoft Learn MCP | ✅ / ⚠️ / ❌ | |
| Live YAML synced | ✅ / ⚠️ / ❌ | Path: <path> |
| Delegation profile | ✅ / ⚠️ / ❌ | Source type: <type> |

Items marked ⚠️ or ❌ will be resolved before work begins.
```

---

## Automatic Resolution Rules

- **ADO MCP not configured** → follow `mcp-tools/azure-devops.md`; fall back to REST API via `az account get-access-token` if MCP is blocked
- **MCP not connected** → follow `skills/canvas-authoring-mcp.md` immediately; do not attempt YAML edits until connected
- **Data sources missing** → add via Studio Data panel or Dataverse MCP; do not write gallery Items formulas until confirmed
- **Live YAML not synced** → run `sync_canvas` before any edit; never guess current control names