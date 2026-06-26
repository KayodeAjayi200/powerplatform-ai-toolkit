# Power Platform AI Toolkit

A self-contained setup and skills repository for AI-assisted Power Apps development.

Point your AI coding agent at this repo and tell it to set up your Power Apps environment. It reads the instructions here, checks what is available, configures what it can, asks what you want to build, and then uses the best viable path for your environment.

The toolkit is designed for real-world constraints: locked-down laptops, missing admin rights, tenants without creation permissions, clients without MCP support, or networks that block local servers. Recommended tools should be attempted and verified, but optional helpers are not absolute blockers.

---

## For AI agents — start here

> **Read [`AGENT.md`](./AGENT.md) and follow the instructions there.**
>
> `AGENT.md` contains the complete bootstrap sequence:
> - Check and install prerequisites (without overwriting working installs)
> - Check which accounts are already signed in, confirm with the user, then authenticate
> - Configure MCP servers (Canvas Authoring, Dataverse, ADO, GitHub, Microsoft Learn — see [`mcp-tools/`](./mcp-tools/))
> - Ask what the user wants to build
> - Plan and create data sources (Dataverse, SharePoint, Azure SQL)
> - Provision a Power Platform environment, solution, and blank canvas app
> - Set up GitHub source control with export/deploy workflows
> - Optionally set up Azure DevOps project tracking with Epics, Features, and User Stories
> - Get design references
> - Build the app using Canvas Authoring MCP

---

## Quick start — what to say to your agent

Copy and paste this into your AI coding agent (GitHub Copilot, Cursor, Claude, etc.):

```
Set up my Power Apps development environment.
Toolkit repo: https://github.com/KayodeAjayi200/powerplatform-ai-toolkit
Read AGENT.md from that repo and follow the setup instructions automatically.
Then read workflows/project-kickoff.md and run the project kickoff checklist.
```

That's it. No local clone required — the agent reads everything from GitHub.
---

## What is in this repo

```
powerplatform-ai-toolkit/
├── AGENT.md                       <- Agent bootstrap: read this to auto-setup + build
├── CHANGELOG.md                   <- Notable changes
├── .github/
│   └── copilot-instructions.md   <- Auto-loaded by GitHub Copilot
├── .agents/
│   └── skills/                   <- 12 installable agent skills (Codex, Copilot, Claude, Windsurf)
│       ├── copilot-studio-agent-clone/       <- Clone/repair Copilot Studio agents
│       ├── copilot-studio-child-agent-tools/ <- Add MCP tools to child agents
│       ├── dataverse-solution-publisher/     <- Fix solution publisher prefix drift
│       ├── dataverse-environment-variables/  <- Create env vars + DataSource bindings
│       ├── powerapps-canvas-app/             <- Canvas app formulas, galleries, forms
│       ├── powerapps-canvas-design/          <- Containers, Fluent UI, responsive layout
│       ├── powerapps-canvas-yaml/            <- Valid .pa.yaml schema + preflight checks
│       ├── powerapps-canvas-accessibility/   <- WCAG 2.1 AA compliance
│       ├── powerapps-canvas-image-visuals/   <- Charts, SVGs, QuickChart.io
│       ├── canvas-authoring-mcp/             <- Canvas Authoring MCP workflow
│       ├── powerapps-sharepoint-list-design/ <- SharePoint lists for Power Apps
│       └── powerapps-delegation/             <- Safe large data source filtering
├── setup/
│   ├── prerequisites.md           <- Check-first install for Node, PAC CLI, .NET, git, gh
│   ├── cli-auth.md                <- Sign-in scripts with account selection for each tool
│   ├── config-status.md           <- ⭐ Session-start config health check — run before every project
│   ├── agentic-mcp-clients.md     <- MCP setup differences for Codex, Copilot, Claude, Cursor, Windsurf, Zed
│   ├── agent-skills-clients.md    <- Skills/rules setup differences for Codex, Copilot, Claude, Cursor, Windsurf, Zed
│   ├── mcp-config.md              <- Full MCP config with merge-safe write script
│   ├── datasource-mcps.md         <- Dataverse vs SharePoint vs SQL — decision guide + commands
│   ├── sharepoint.md              <- Sites, lists, columns, permissions, app reg for automation
│   ├── apis.md                    <- External API + custom connector setup guide
│   ├── provision.md               <- Create environment, solution, and canvas app via CLI/API
│   ├── github-integration.md      <- GitHub repo + service principal + Actions workflows
│   ├── devops.md                  <- Azure DevOps project, work item hierarchy, tracking queries, Azure Repos
│   └── scripts/
├── workflows/
│   ├── project-kickoff.md         <- ⭐ Start here — kickoff prompt, config check, skills reading list
│   └── new-app.md                 <- Detailed end-to-end new app build workflow
├── mcp-tools/                     <- Per-server MCP reference docs
│   ├── canvas-authoring.md           <- Canvas Authoring MCP (edit live apps via AI)
│   ├── dataverse.md                  <- Dataverse MCP (read/write tables)
│   ├── copilot-studio.md             <- Copilot Studio MCP (manage agents)
│   ├── azure-devops.md               <- ADO MCP (pipelines, boards, repos — no PAT)
│   ├── microsoft-learn.md            <- Microsoft Learn MCP (live docs — no credentials)
│   ├── github.md                     <- GitHub MCP (repos, issues, PRs)
│   ├── filesystem.md                 <- Filesystem MCP (local file access)
│   ├── memory.md                     <- Memory MCP (persistent knowledge graph)
│   ├── sequential-thinking.md        <- Sequential Thinking MCP (structured reasoning)
│   └── playwright.md                 <- Playwright MCP (browser automation)
└── skills/                        <- Deep domain knowledge: Canvas YAML, Power Fx, design, accessibility, image visuals, SharePoint, Dataverse env vars, delegation
```

---

## Agent skills — install with one command

All 12 skills are installable directly from this repo:

```bash
# Copilot Studio & Dataverse
gh skill install KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-agent-clone
gh skill install KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-child-agent-tools
gh skill install KayodeAjayi200/powerplatform-ai-toolkit dataverse-solution-publisher
gh skill install KayodeAjayi200/powerplatform-ai-toolkit dataverse-environment-variables

# Canvas App
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-app
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-design
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-yaml
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-accessibility
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-image-visuals
gh skill install KayodeAjayi200/powerplatform-ai-toolkit canvas-authoring-mcp
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-sharepoint-list-design
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-delegation
```

| Skill | Use when... |
|---|---|
| `copilot-studio-agent-clone` | Cloning or repairing a Copilot Studio agent from a URL |
| `copilot-studio-child-agent-tools` | Adding/fixing Dataverse MCP tools on child agents |
| `dataverse-solution-publisher` | Solution components must use a specific publisher prefix |
| `dataverse-environment-variables` | Creating env vars with DataSource bindings for SharePoint |
| `powerapps-canvas-app` | Power Fx formulas, galleries, forms, navigation, collections |
| `powerapps-canvas-design` | Containers, Fluent UI, responsive layout, design system |
| `powerapps-canvas-yaml` | Generating or validating `.pa.yaml` source files |
| `powerapps-canvas-accessibility` | WCAG 2.1 AA compliance for canvas apps |
| `powerapps-canvas-image-visuals` | Charts, KPI visuals, SVGs via QuickChart.io |
| `canvas-authoring-mcp` | Connecting to and editing a live app via Canvas MCP |
| `powerapps-sharepoint-list-design` | SharePoint lists with clean internal names for Power Apps |
| `powerapps-delegation` | Safe filtering of large Dataverse, SharePoint, or SQL sources |

See [`.agents/skills/README.md`](.agents/skills/README.md) for cross-client setup (Claude Code, Windsurf, Cursor).

---

## MCP servers at a glance

> Full config script: [`setup/mcp-config.md`](./setup/mcp-config.md)
> Per-server reference docs: [`mcp-tools/`](./mcp-tools/)

| Server | What it does | Needs | Docs |
|---|---|---|---|
| `powerapps-canvas` / `canvas-authoring` | Edit live canvas apps via AI | App ID, Environment ID | [canvas-authoring.md](./mcp-tools/canvas-authoring.md) |
| `dataverse` | Read/write Dataverse tables | Connection URL, Tenant ID | [dataverse.md](./mcp-tools/dataverse.md) |
| `copilot-studio` | Manage Copilot Studio agents | Agent MCP URL, Tenant ID | [copilot-studio.md](./mcp-tools/copilot-studio.md) |
| `github` | Repos, issues, PRs | GitHub PAT | [github.md](./mcp-tools/github.md) |
| `azure-devops` | Pipelines, boards, repos — remote HTTP, no PAT | ADO org name | [azure-devops.md](./mcp-tools/azure-devops.md) |
| `microsoft-learn` | Live Microsoft docs, grounded answers | None | [microsoft-learn.md](./mcp-tools/microsoft-learn.md) |
| `filesystem` | Local file access across your repos | One or more folder paths | [filesystem.md](./mcp-tools/filesystem.md) |
| `memory` | Persistent knowledge graph across sessions | None | [memory.md](./mcp-tools/memory.md) |
| `sequential-thinking` | Structured multi-step reasoning | None | [sequential-thinking.md](./mcp-tools/sequential-thinking.md) |
| `playwright` | Browser automation | None | [playwright.md](./mcp-tools/playwright.md) |

---

## Official documentation

- Power Platform CLI: https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction
- Canvas App Authoring MCP: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server
- Power Apps Canvas YAML source code: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/power-apps-yaml
- QuickChart chart image API: https://quickchart.io/documentation/
- Power Fx EncodeUrl: https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-encode-decode
- Dataverse: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/
- Power Apps Canvas: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/
- Sharing apps: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/share-app
- MCP protocol: https://modelcontextprotocol.io/introduction

---

## Canvas MCP quick recovery

If Canvas MCP starts failing after switching apps, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\update-canvas-mcp-from-url.ps1 `
  -StudioUrl "https://make.powerapps.com/e/<ENV_ID>/canvas/?action=edit&app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F<APP_ID>" `
  -ProjectPath "C:\Path\To\Your\App\Repo"
```

Then reload the `powerapps-canvas` and `canvas-authoring` MCP servers, keep the app open in Studio with Coauthoring ON, and validate with `list_controls` before syncing or compiling.

The helper updates the common client config formats, including Codex `~/.codex/config.toml` and project `.codex/config.toml`. On Windows it uses the absolute `CanvasAuthoringMcpServer.cmd` path so desktop agents do not depend on PATH inheritance.

