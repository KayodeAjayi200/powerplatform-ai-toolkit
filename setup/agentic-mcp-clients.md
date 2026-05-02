# Agentic Coding Tool MCP Setup

This guide tells agents how to configure MCP servers across common coding tools without mixing up config formats.

Primary rule: detect the current client before writing MCP config. Each tool uses a different config file, schema, restart path, and verification command.

---

## Cross-client setup policy

For every MCP setup task:

1. Identify the active client: Codex, VS Code/Copilot, Claude Code, Cursor, Windsurf, or Zed.
2. Write MCP config only to that client's supported file and schema.
3. Preserve existing servers and merge changes; do not replace the whole config.
4. Keep secrets out of committed project files; use user-level config, input prompts, or environment variables.
5. Prefer full executable paths on Windows for stdio servers when PATH is unreliable.
6. Restart or reload MCP servers after config changes.
7. Verify with the client's server list/status command before using tools.
8. For Power Apps Canvas MCP, update both `powerapps-canvas` and `canvas-authoring`, then require `list_controls` to pass before `sync_canvas` or `compile_canvas`.

---

## Client matrix

| Client | User/global config | Project config | Schema root | Verify/reload |
|---|---|---|---|---|
| Codex | `~/.codex/config.toml` | `.codex/config.toml` in trusted projects | `[mcp_servers.<name>]` | `codex mcp --help`, `/mcp` in TUI |
| VS Code / GitHub Copilot | User profile `mcp.json` | `.vscode/mcp.json` | `"servers"` plus optional `"inputs"` | Command Palette: `MCP: List Servers`, restart server |
| Claude Code | `~/.claude.json` | `.mcp.json` | `"mcpServers"` | `claude mcp list`, `claude mcp get <name>`, `/mcp` |
| Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | `"mcpServers"` | `cursor-agent mcp list`, `cursor-agent mcp list-tools <id>` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | UI-managed | `"mcpServers"` | MCPs panel / refresh button |
| Zed | user `settings.json` | `.zed/settings.json` | `"context_servers"` | Agent Panel settings green status indicator |

---

## Codex

Codex supports stdio MCP servers and streamable HTTP servers. CLI and IDE extension share `config.toml`.

Use CLI setup when possible:

```powershell
codex mcp add powerapps-canvas --env CANVAS_APP_ID=<APP_ID> --env CANVAS_ENVIRONMENT_ID=<ENV_ID> --env CANVAS_CLUSTER_CATEGORY=prod -- CanvasAuthoringMcpServer
```

For direct config, use TOML:

```toml
[mcp_servers.powerapps-canvas]
command = "CanvasAuthoringMcpServer"
args = []

[mcp_servers.powerapps-canvas.env]
CANVAS_APP_ID = "<APP_ID>"
CANVAS_ENVIRONMENT_ID = "<ENV_ID>"
CANVAS_CLUSTER_CATEGORY = "prod"
```

Verification:

```powershell
codex mcp --help
```

In the Codex TUI, use `/mcp` to see active servers.

Source: https://developers.openai.com/codex/mcp

---

## VS Code / GitHub Copilot

VS Code uses `mcp.json`, not Codex TOML. Workspace config belongs at `.vscode/mcp.json`; user config lives in the user profile.

Use the `servers` root:

```json
{
  "servers": {
    "powerapps-canvas": {
      "type": "stdio",
      "command": "CanvasAuthoringMcpServer",
      "args": [],
      "env": {
        "CANVAS_APP_ID": "<APP_ID>",
        "CANVAS_ENVIRONMENT_ID": "<ENV_ID>",
        "CANVAS_CLUSTER_CATEGORY": "prod"
      }
    }
  }
}
```

Use `"inputs"` for secrets instead of committing raw tokens.

Verification:

```text
Command Palette > MCP: List Servers
Command Palette > MCP: Reset Cached Tools
```

Source: https://code.visualstudio.com/docs/copilot/reference/mcp-configuration

---

## Claude Code

Claude Code supports local, project, and user scopes. Use project scope only for non-secret shared MCP definitions.

CLI examples:

```powershell
claude mcp list
claude mcp get powerapps-canvas
claude mcp add-json powerapps-canvas '{"type":"stdio","command":"CanvasAuthoringMcpServer","args":[],"env":{"CANVAS_APP_ID":"<APP_ID>","CANVAS_ENVIRONMENT_ID":"<ENV_ID>","CANVAS_CLUSTER_CATEGORY":"prod"}}'
```

Project `.mcp.json` shape:

```json
{
  "mcpServers": {
    "powerapps-canvas": {
      "command": "CanvasAuthoringMcpServer",
      "args": [],
      "env": {
        "CANVAS_APP_ID": "<APP_ID>",
        "CANVAS_ENVIRONMENT_ID": "<ENV_ID>",
        "CANVAS_CLUSTER_CATEGORY": "prod"
      }
    }
  }
}
```

Verification:

```powershell
claude mcp list
claude mcp get powerapps-canvas
```

Inside Claude Code, use `/mcp`.

Source: https://code.claude.com/docs/en/mcp

---

## Cursor

Cursor editor and `cursor-agent` share MCP config. Use `.cursor/mcp.json` for project config and `~/.cursor/mcp.json` for global config.

Config shape:

```json
{
  "mcpServers": {
    "powerapps-canvas": {
      "command": "CanvasAuthoringMcpServer",
      "args": [],
      "env": {
        "CANVAS_APP_ID": "<APP_ID>",
        "CANVAS_ENVIRONMENT_ID": "<ENV_ID>",
        "CANVAS_CLUSTER_CATEGORY": "prod"
      }
    }
  }
}
```

Verification:

```powershell
cursor-agent mcp list
cursor-agent mcp list-tools powerapps-canvas
```

Sources:
- https://docs.cursor.com/context/model-context-protocol
- https://docs.cursor.com/cli/mcp

---

## Windsurf

Windsurf Cascade uses `mcp_config.json`, normally at `~/.codeium/windsurf/mcp_config.json`. It supports stdio, streamable HTTP, and SSE.

Config shape:

```json
{
  "mcpServers": {
    "powerapps-canvas": {
      "command": "CanvasAuthoringMcpServer",
      "args": [],
      "env": {
        "CANVAS_APP_ID": "<APP_ID>",
        "CANVAS_ENVIRONMENT_ID": "<ENV_ID>",
        "CANVAS_CLUSTER_CATEGORY": "prod"
      }
    }
  }
}
```

After editing, use the Cascade MCP panel refresh/restart action. For teams, check admin MCP whitelist rules because server IDs are case-sensitive and may block unapproved servers.

Source: https://docs.windsurf.com/windsurf/cascade/mcp

---

## Zed

Zed does not use `mcpServers`; it uses `context_servers` in `settings.json`.

Config shape:

```json
{
  "context_servers": {
    "powerapps-canvas": {
      "command": "CanvasAuthoringMcpServer",
      "args": [],
      "env": {
        "CANVAS_APP_ID": "<APP_ID>",
        "CANVAS_ENVIRONMENT_ID": "<ENV_ID>",
        "CANVAS_CLUSTER_CATEGORY": "prod"
      }
    }
  }
}
```

Verification:

Open Agent Panel settings and confirm the server has a green status indicator. If tools do not appear, check that the selected model supports tool calling.

Source: https://zed.dev/docs/ai/mcp

---

## Power Apps Canvas MCP validation pattern

Canvas MCP setup is not complete just because the server appears in a client UI.

Use this validation sequence every time:

1. Update the active client's MCP config with the current Studio URL values.
2. Make sure both `powerapps-canvas` and `canvas-authoring` entries point to the same App ID and Environment ID when the client supports both entries.
3. Restart/reload MCP servers.
4. Keep Power Apps Studio open with coauthoring enabled.
5. Run `list_controls`.
6. Only after `list_controls` succeeds, run `sync_canvas`, edit YAML, then `compile_canvas`.

If `list_controls` returns 404, treat it as a setup/session binding failure. Re-run the URL updater, reload MCP, refresh Studio, confirm coauthoring, wait 20-30 seconds, and retry once before asking the user for manual intervention.
