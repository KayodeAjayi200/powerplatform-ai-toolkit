# Changelog

All notable changes to the Power Platform AI Toolkit are recorded here.

Format: `## [date] — summary`, with bullets for what was Added, Changed, Removed, or Fixed.

---

## [2026-06-26] — Dashboard removal, official MCP updates, fetch-live callouts

### Added
- `mcp-tools/microsoft-learn.md` — Microsoft Learn MCP (`https://learn.microsoft.com/api/mcp`, no credentials, remote HTTP)
- Fetch-live callout blocks on all drift-prone files: `mcp-tools/canvas-authoring.md`, `mcp-tools/dataverse.md`, `mcp-tools/copilot-studio.md`, `mcp-tools/README.md`, `setup/prerequisites.md`, `skills/canvas-yaml.md`, `.agents/skills/powerapps-canvas-yaml/SKILL.md`
- Microsoft Learn MCP added to `setup/mcp-config.md` standard config

### Changed
- `mcp-tools/azure-devops.md` — replaced community `@tiberriver256/mcp-server-azure-devops` with official Microsoft ADO MCP (`@azure-devops/mcp`, remote HTTP at `https://mcp.dev.azure.com/{org}`, no PAT required)
- `setup/mcp-config.md` — updated to use official ADO remote MCP, removed ADO PAT credential requirement, added Microsoft Learn MCP
- `setup/config-status.md` — removed dashboard check row, updated ADO check to reflect no-PAT remote MCP, added `mcp-tools/` links to each MCP row
- `AGENT.md` — removed all local dashboard tool references; `User shortcut commands` section removed; Phase 2F.1 removed
- `workflows/new-app.md` — removed Step 1.5 (dashboard start) and all dashboard state update instructions
- `workflows/project-kickoff.md` — removed dashboard row from Common Mistakes table
- `README.md` — removed Local project dashboard section, removed `dashboard/` from repo tree

### Removed
- `dashboard/` folder entirely: `server.js`, `public/app.js`, `public/index.html`, `public/styles.css`, `state/*.json` (7 files)
- `setup/project-dashboard.md`
- `setup/scripts/open-dashboard.ps1`
- `setup/environment-variables.md` (orphaned — not referenced from agent reading list)

---

## [2026-06-26] — Initial toolkit publish

### Added
- `AGENT.md` — full agent bootstrap: prerequisites → auth → MCP config → design → build
- `setup/` — prerequisites, CLI auth, MCP config, provisioning, GitHub integration, Azure DevOps, SharePoint, datasource decision guide, APIs, agentic MCP clients, agent skills clients, config status check, environment variables guide
- `mcp-tools/` — per-server reference docs for Canvas Authoring, Dataverse, Copilot Studio, GitHub, Azure DevOps, Filesystem, Memory, Playwright, Sequential Thinking
- `skills/` — Canvas App, Canvas Design, Canvas YAML, Canvas Accessibility, Canvas Authoring MCP, Canvas Image Visuals, Delegation, SharePoint List Design
- `.agents/skills/` — 11 installable agent skills with `gh skill install` support: `copilot-studio-agent-clone`, `copilot-studio-child-agent-tools`, `dataverse-solution-publisher`, `powerapps-canvas-app`, `powerapps-canvas-design`, `powerapps-canvas-yaml`, `powerapps-canvas-accessibility`, `powerapps-canvas-image-visuals`, `powerapps-canvas-authoring-mcp`, `powerapps-delegation`, `powerapps-sharepoint-list-design`
- `workflows/project-kickoff.md` and `workflows/new-app.md`
- `.github/copilot-instructions.md` — auto-loaded by GitHub Copilot
- `setup/scripts/` — `create-devops-backlog.ps1`, `create-sharepoint-lists-from-data-model.ps1`, `update-canvas-mcp-from-url.ps1`