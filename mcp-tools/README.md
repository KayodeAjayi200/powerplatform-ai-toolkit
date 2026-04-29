# MCP Tools Reference

This folder documents every MCP (Model Context Protocol) server used in Power Platform AI development.

Each file covers what the server does, what credentials it needs, and the exact configuration block to drop into `~/.copilot/mcp-config.json`.

---

## All servers

| File | Server key | Purpose |
|---|---|---|
| [dataverse.md](./dataverse.md) | `dataverse` | Read/write Dataverse tables and data |
| [canvas-authoring.md](./canvas-authoring.md) | `powerapps-canvas` / `canvas-authoring` | Edit live canvas apps via MCP |
| [copilot-studio.md](./copilot-studio.md) | `copilot-studio` | Manage Copilot Studio agents |
| [github.md](./github.md) | `github` | GitHub repos, issues, PRs |
| [azure-devops.md](./azure-devops.md) | `azure-devops` | ADO pipelines, work items, repos |
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
    "github": { ... }
  }
}
```
