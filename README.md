# Power Platform AI Toolkit

A standalone reference for **MCP tools** and **agent skills** used in Power Platform AI development.

This repo is not tied to any specific project or dashboard. Drop it into any AI coding agent (GitHub Copilot, Cursor, Claude, etc.) and immediately unlock Power Platform–aware AI assistance.

---

## What's in here

| Folder | What it is |
|---|---|
| [`mcp-tools/`](./mcp-tools/) | One file per MCP server — what it does, what credentials it needs, and how to configure it |
| [`skills/`](./skills/) | Agent skill reference files — deep domain knowledge for Power Apps, delegation, accessibility, and more |

---

## How to use this

### Add to GitHub Copilot CLI (recommended)

Add the skills folder to your `~/.copilot/mcp-config.json` filesystem paths so Copilot can read the skill files:

```powershell
# After cloning this repo to e.g. C:\Repositories\powerplatform-ai-toolkit
# Open mcp-config.json and add the path to the filesystem MCP args array
$mcpConfig = Join-Path $env:USERPROFILE ".copilot\mcp-config.json"
$mcp = Get-Content $mcpConfig -Raw | ConvertFrom-Json
$mcp.mcpServers.filesystem.args += "C:\Repositories\powerplatform-ai-toolkit"
$mcp | ConvertTo-Json -Depth 10 | Set-Content $mcpConfig -Encoding UTF8
```

### Reference in your agent instructions

In your project's `.github/copilot-instructions.md` or equivalent, tell your agent:

```
Read the skill files in C:\Repositories\powerplatform-ai-toolkit\skills\ before working on Power Apps or Power Platform tasks.
```

---

## MCP tools at a glance

| Server key | What it does | Needs |
|---|---|---|
| `dataverse` | Read/write Dataverse tables | Connection URL, Tenant ID |
| `powerapps-canvas` | Edit live canvas apps | App ID, Environment ID |
| `canvas-authoring` | Same as above (prerelease path) | App ID, Environment ID |
| `copilot-studio` | Manage Copilot Studio agents | Agent MCP URL, Tenant ID |
| `github` | Read repos, issues, PRs | GitHub PAT |
| `azure-devops` | Pipelines, work items, ADO repos | ADO org URL + PAT |
| `filesystem` | Read/write local files | One or more local folder paths |
| `memory` | Persistent knowledge graph | None |
| `sequential-thinking` | Structured multi-step reasoning | None |
| `playwright` | Browser automation | None |

See [`mcp-tools/`](./mcp-tools/) for full setup details on each.

---

## Agent skills at a glance

| Skill file | When to use it |
|---|---|
| [`skills/canvas-app.md`](./skills/canvas-app.md) | Canvas App controls, Power Fx formulas, galleries, forms, collections |
| [`skills/canvas-design.md`](./skills/canvas-design.md) | UI/UX design — containers, Fluent UI, responsive layouts, galleries |
| [`skills/canvas-accessibility.md`](./skills/canvas-accessibility.md) | WCAG 2.1 AA compliance, screen reader support, keyboard navigation |
| [`skills/canvas-authoring-mcp.md`](./skills/canvas-authoring-mcp.md) | How to connect and push edits to a live canvas app via MCP |
| [`skills/delegation.md`](./skills/delegation.md) | Fixing delegation warnings, filtering large data sources correctly |
