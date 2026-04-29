# Power Platform AI Toolkit

A self-contained setup and skills repository for AI-assisted Power Apps development.

Point your AI coding agent at this repo and tell it to set up your Power Apps environment — it reads the instructions here, installs everything it needs, configures MCP servers, asks what you want to build, and then builds it.

---

## For AI agents — start here

> **Read [`AGENT.md`](./AGENT.md) and follow the instructions there.**
>
> `AGENT.md` contains the complete bootstrap sequence:
> - Check and install prerequisites (without overwriting working installs)
> - Configure MCP servers
> - Ask what the user wants to build
> - Plan and create data sources
> - Get design references
> - Build the app using Canvas Authoring MCP

---

## Quick start — what to say to your agent

Copy and paste this into your AI coding agent (GitHub Copilot, Cursor, Claude, etc.):

```
Set up my Power Apps development environment.
Toolkit repo: https://github.com/KayodeAjayi200/powerplatform-ai-toolkit
Read AGENT.md from that repo and follow the setup instructions automatically.
```

If you have already cloned the repo locally:

```
Set up my Power Apps development environment.
Read AGENT.md from: C:\Repositories\powerplatform-ai-toolkit
Follow the setup instructions automatically.
```

---

## What is in this repo

```
powerplatform-ai-toolkit/
├── AGENT.md                       <- Agent bootstrap: read this to auto-setup + build
├── .github/
│   └── copilot-instructions.md   <- Auto-loaded by GitHub Copilot
├── setup/
│   ├── prerequisites.md           <- Check-first install for Node, PAC CLI, .NET, git, gh
│   ├── cli-auth.md                <- Sign-in scripts for pac, gh, git, m365, az
│   ├── mcp-config.md              <- Full MCP config with merge-safe write script
│   ├── datasource-mcps.md         <- Dataverse vs SharePoint vs SQL — decision guide + commands
│   ├── sharepoint.md              <- Sites, lists, columns, permissions, app reg for automation
│   ├── apis.md                    <- External API + custom connector setup guide
│   ├── provision.md               <- Create environment, solution, and canvas app via CLI/API
│   └── github-integration.md      <- GitHub repo + service principal + Actions workflows
├── workflows/
│   └── new-app.md                 <- Detailed end-to-end new app build workflow
├── mcp-tools/                     <- Per-server reference docs
└── skills/                        <- Deep domain knowledge for canvas app development
```

---

## MCP servers at a glance

| Server | What it does | Needs |
|---|---|---|
| `powerapps-canvas` / `canvas-authoring` | Edit live canvas apps | App ID, Environment ID |
| `dataverse` | Read/write Dataverse tables | Connection URL, Tenant ID |
| `copilot-studio` | Manage Copilot Studio agents | Agent MCP URL, Tenant ID |
| `github` | Repos, issues, PRs | GitHub PAT |
| `azure-devops` | Pipelines, work items | ADO org URL + PAT |
| `filesystem` | Local file access | One or more folder paths |
| `memory` | Persistent knowledge graph | None |
| `sequential-thinking` | Structured reasoning | None |
| `playwright` | Browser automation | None |

---

## Official documentation

- Power Platform CLI: https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction
- Canvas App Authoring MCP: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server
- Dataverse: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/
- Power Apps Canvas: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/
- Sharing apps: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/share-app
- MCP protocol: https://modelcontextprotocol.io/introduction