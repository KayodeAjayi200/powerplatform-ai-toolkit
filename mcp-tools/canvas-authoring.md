# Canvas App Authoring MCP

**Server keys:** `powerapps-canvas` (stable), `canvas-authoring` (prerelease)  
**What it does:** Connects your AI agent directly to a live canvas app open in Power Apps Studio. The agent can read the app's YAML, generate controls, edit properties, and push changes back — all without you manually copying and pasting YAML.

---

## When to use

- Generating a new canvas app screen from a description
- Editing an existing canvas app (adding controls, fixing layout, updating formulas)
- Fixing accessibility errors in a canvas app
- Syncing local YAML edits back into a live app

---

## What you need

Both IDs come from the Power Apps Studio URL when the app is open:

```
https://make.powerapps.com/e/<ENVIRONMENT_ID>/canvas/?action=edit&app-id=<APP_ID>
```

| Credential | Where in the URL |
|---|---|
| **App ID** | After `app-id=` |
| **Environment ID** | After `/e/` |

---

## Install

```powershell
# Install the stable Canvas Authoring MCP tool (run once per machine)
dotnet tool install -g CanvasAuthoringMcpServer

# Install dnx for the prerelease path (run once per machine)
dotnet tool install -g dnx
```

---

## Config blocks

Use **both** blocks — they expose the same app via two different startup methods.  
Some hosts work better with one than the other.

### Primary (stable — uses installed global tool)

On Windows agentic desktop apps, prefer launching the installed tool through its absolute `.cmd` path. This avoids the common case where PowerShell can find `CanvasAuthoringMcpServer` but the desktop app cannot because it inherited a different PATH.

```json
"powerapps-canvas": {
  "command": "cmd.exe",
  "args": ["/c", "C:\\Users\\<USER>\\.dotnet\\tools\\CanvasAuthoringMcpServer.cmd"],
  "env": {
    "CANVAS_APP_ID":           "PASTE_APP_ID_HERE",
    "CANVAS_ENVIRONMENT_ID":   "PASTE_ENVIRONMENT_ID_HERE",
    "CANVAS_CLUSTER_CATEGORY": "prod"
  }
}
```

### Secondary (prerelease — uses dnx)

```json
"canvas-authoring": {
  "type": "stdio",
  "command": "dnx",
  "args": [
    "Microsoft.PowerApps.CanvasAuthoring.McpServer",
    "--yes", "--prerelease",
    "--source", "https://api.nuget.org/v3/index.json"
  ],
  "env": {
    "CANVAS_APP_ID":           "PASTE_APP_ID_HERE",
    "CANVAS_ENVIRONMENT_ID":   "PASTE_ENVIRONMENT_ID_HERE",
    "CANVAS_CLUSTER_CATEGORY": "prod"
  }
}
```

---

## Notes

- The app **must be open in Power Apps Studio** in a browser for the MCP connection to work
- App ID and Environment ID change for every different app — update `mcp-config.json` when switching apps
- Use the skill file [`skills/canvas-authoring-mcp.md`](../skills/canvas-authoring-mcp.md) before running any canvas editing task — it has the full workflow
- `CANVAS_CLUSTER_CATEGORY` should be `"prod"` for production environments; use `"gcc"` for GCC environments

---

## Quick 404 fix sequence

If canvas MCP returns 404 or nothing syncs, do this exactly:

1. Copy the current Studio URL and extract `Environment ID` (`/e/<id>/`) and `App ID` (after `apps%2F`).
   - Recommended: run `.\setup\scripts\update-canvas-mcp-from-url.ps1 -StudioUrl "<PASTE_STUDIO_URL>" -ProjectPath "<TARGET_PROJECT_PATH>"` from this repo root.
2. Update both server entries (`powerapps-canvas` and `canvas-authoring`) to the same IDs.
3. Restart MCP servers or restart your coding tool.
4. Confirm Studio coauthoring is ON and the app tab is open.
5. Run `list_controls` as the connection gate.
6. Run `powerapps-canvas-sync_canvas` to pull latest YAML.
7. After edits, run `powerapps-canvas-compile_canvas` to push changes.

Important behavior:
- `sync_canvas` = pull only (overwrites local files).
- `compile_canvas` = validate and push to Studio.
- In Codex, config belongs in `~/.codex/config.toml` or trusted `.codex/config.toml`, not `~/.copilot/mcp-config.json`.
