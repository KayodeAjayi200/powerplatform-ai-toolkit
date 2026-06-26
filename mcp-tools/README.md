# MCP Tools Reference

This folder documents every MCP (Model Context Protocol) server used in Power Platform AI development.

Each file covers what the server does, what credentials it needs, and the exact configuration block to drop into `~/.copilot/mcp-config.json`.

> **⚠️ Microsoft ships new Power Platform MCPs regularly.**  
> Check for new official servers at: https://learn.microsoft.com/en-us/power-platform/developer/tools  
> All servers in this folder are official Microsoft MCPs unless stated otherwise.

---

## All servers

| File | Server key | Purpose |
|---|---|---|
| [dataverse.md](./dataverse.md) | `dataverse` | Read/write Dataverse tables and data |
| [canvas-authoring.md](./canvas-authoring.md) | `powerapps-canvas` / `canvas-authoring` | Edit live canvas apps via MCP |
| [copilot-studio.md](./copilot-studio.md) | `copilot-studio` | Manage Copilot Studio agents |
| [azure-devops.md](./azure-devops.md) | `azure-devops` | ADO pipelines, work items, repos (remote + local) |
| [microsoft-learn.md](./microsoft-learn.md) | `microsoft-learn` | Live Microsoft docs — grounded answers from learn.microsoft.com |
| [github.md](./github.md) | `github` | GitHub repos, issues, PRs |
| [filesystem.md](./filesystem.md) | `filesystem` | Local file access across your repos |
| [memory.md](./memory.md) | `memory` | Persistent knowledge graph across sessions |
| [sequential-thinking.md](./sequential-thinking.md) | `sequential-thinking` | Structured multi-step reasoning |
| [playwright.md](./playwright.md) | `playwright` | Browser automation |

---

## Adding to your MCP config

All servers go into `~/.copilot/mcp-config.json` under the `mcpServers` key.  
See each file for the exact config block. The full config structure looks like:

```json
{
  "mcpServers": {
    "dataverse": { ... },
    "powerapps-canvas": { ... },
    "microsoft-learn": { ... },
    "github": { ... }
  }
}
```
