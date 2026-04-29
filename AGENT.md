# Power Platform AI Toolkit — Agent Bootstrap

> **You are an AI coding agent.**
> A user has pointed you at this repository and asked you to set up their environment for Power Apps / Power Platform development.
>
> **Read this file completely, then execute every phase below in order without waiting to be asked.**
> Only pause at steps explicitly marked **"Ask the user"**.
>
> If a tool or credential is already present on the machine, use it — never overwrite a working install.

---

## Phase 1 — Environment setup

### 1A — Read the skill files

Before doing anything else, read these files from this repository so you have full domain knowledge throughout:

- `skills/canvas-app.md` — Power Fx formulas, galleries, forms, collections
- `skills/canvas-design.md` — container-based layout, Fluent UI, responsive design
- `skills/canvas-accessibility.md` — WCAG 2.1 AA rules for canvas apps
- `skills/canvas-authoring-mcp.md` — how to connect and edit a live canvas app via MCP
- `skills/delegation.md` — filtering large data sources without delegation warnings

You will need this knowledge in Phases 3 and 4. Reading it now means you won't need to look it up mid-build.

---

### 1B — Check and install prerequisites

Read `setup/prerequisites.md` and run the check-first install block.

**Rules:**
- Check whether each tool exists before trying to install it
- If it already exists and works, skip it — do not reinstall or upgrade unless broken
- Tell the user what you found and what (if anything) you installed

Official documentation for each tool (always refer users here for the latest setup guidance):

| Tool | Official docs |
|---|---|
| Node.js | https://nodejs.org/en/download |
| Power Platform CLI (pac) | https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction |
| .NET SDK | https://learn.microsoft.com/en-us/dotnet/core/install/windows |
| GitHub CLI (gh) | https://cli.github.com |
| Git | https://git-scm.com/downloads |

---

### 1C — Sign in to Power Platform

```powershell
# Check if already authenticated before prompting for a new login
$authList = pac auth list 2>&1
if ($authList -match "No profiles found" -or $authList -match "0 profile") {
    # Not signed in — open a browser login for Power Platform
    pac auth create --name "default"
} else {
    Write-Host "Already signed in to Power Platform:"
    Write-Host $authList
}
```

Official reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/auth

---

### 1D — Configure MCP servers

Read `setup/mcp-config.md`.

Collect the credentials listed there from the user, then write or update `~/.copilot/mcp-config.json`.

**Key rule:** If the file already exists, read it first and merge — only add or update keys, never wipe the whole file.

Add **this toolkit's local path** to the filesystem MCP paths so your skills stay accessible:

```powershell
# Add the path where the user cloned this repo to the filesystem MCP
# Replace with the actual local clone path
$toolkitPath = "C:\Repositories\powerplatform-ai-toolkit"  # confirm with user
```

The filesystem MCP accepts multiple paths — see `mcp-tools/filesystem.md` for the merge script.

**Official MCP reference:**
- Canvas Authoring MCP: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server
- Power Platform Dataverse MCP: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/dataverse-mcp
- MCP protocol overview: https://modelcontextprotocol.io/introduction

---

### 1E — Install .NET MCP tools

```powershell
# Check what dotnet global tools are already installed
$installed = (dotnet tool list -g 2>&1).ToLower()

# Canvas Authoring MCP — needed to build canvas apps via AI
if ($installed -notmatch [regex]::Escape("canvasauthoringmcpserver")) {
    dotnet tool install -g CanvasAuthoringMcpServer
    Write-Host "Installed CanvasAuthoringMcpServer"
} else { Write-Host "CanvasAuthoringMcpServer already installed — skipping" }

# dnx — alternate startup for Canvas MCP (prerelease builds)
if ($installed -notmatch "\bdnx\b") {
    dotnet tool install -g dnx
    Write-Host "Installed dnx"
} else { Write-Host "dnx already installed — skipping" }

# Dataverse MCP — needed if user's app uses Dataverse tables
if ($installed -notmatch [regex]::Escape("microsoft.powerplatform.dataverse.mcp")) {
    dotnet tool install -g Microsoft.PowerPlatform.Dataverse.MCP
    Write-Host "Installed Dataverse MCP"
} else { Write-Host "Dataverse MCP already installed — skipping" }

# Copilot Studio MCP — needed if user's app connects to a Copilot Studio agent
if ($installed -notmatch [regex]::Escape("microsoft.agents.copilot")) {
    dotnet tool install -g Microsoft.Agents.CopilotStudio.Mcp
    Write-Host "Installed Copilot Studio MCP"
} else { Write-Host "Copilot Studio MCP already installed — skipping" }
```

---

## Phase 2 — Understand what to build

### 2A — Ask the user what they want to build

**Ask the user:**
> "What Power Apps app would you like to build? Describe it as you'd explain it to a colleague — what problem does it solve, who will use it, and what data does it need to track or display?"

Take the answer and extract:
- The **purpose** of the app
- The **users** (internal staff, customers, field workers, managers, etc.)
- The **data** the app needs (what needs to be stored, looked up, or reported on)
- Any **workflows** (approvals, notifications, status changes)

---

### 2B — Plan the data sources

Read `setup/datasource-mcps.md` to match each data need to the right data source type.

Present a data plan to the user like this:

```
Here's what I'm planning to build:

Data sources:
  1. [Table/List name] — stored in [Dataverse / SharePoint / SQL]
     Columns: [list key columns and types]
  2. ...

Does this look right? Anything to add or change?
```

Wait for the user to confirm before proceeding.

---

### 2C — Create the data sources

Based on the confirmed data plan, create the tables, lists, or databases.

Follow the commands in `setup/datasource-mcps.md` for the relevant data source type.

Tell the user each thing you create as you go.

After creation:
- Confirm all data sources exist
- Note the environment ID and solution name (you'll need these when building the app)

---

## Phase 3 — Design

### 3A — Ask for design references

**Ask the user:**
> "Do you have any design references? For example:
> - Screenshots of apps you like the look of
> - Wireframes or sketches
> - Brand colours (hex codes) or a company logo
> - A style you'd describe in words (clean/minimal, bold/colourful, corporate, etc.)
>
> You can paste images, share URLs, or just describe it. If you have nothing specific, I'll use the Microsoft Fluent design language."

---

### 3B — Plan the screens

Based on what the user wants to build, plan:
- Which screens the app needs (e.g. Home, List view, Detail/edit form, Settings)
- What data each screen shows
- How the user navigates between screens
- What actions each screen supports (add, edit, delete, submit, approve, etc.)

**Rules from `skills/canvas-design.md` that you must follow when planning:**
- Every screen uses Horizontal and Vertical containers — no absolute X/Y positions
- Navigation is always a vertical left-side panel or a bottom tab bar
- Cards use rounded corners, subtle shadows, and consistent spacing
- Apply the user's brand colours (or Fluent defaults) consistently

Present the screen plan to the user and confirm before building.

---

## Phase 4 — Build

### 4A — Connect to Canvas Authoring MCP

Read `skills/canvas-authoring-mcp.md` now if you haven't already.

**Ask the user:**
> "Please open Power Apps Studio in your browser and either:
> - Create a new blank canvas app (Tablet or Phone layout)
> - Open an existing app you want to edit
>
> Once it's open, share the URL — I'll extract the App ID and Environment ID from it."

The Studio URL looks like:
```
https://make.powerapps.com/e/<ENVIRONMENT_ID>/canvas/?action=edit&app-id=<APP_ID>
```

Extract both IDs and update the `mcp-config.json` canvas MCP section with them.

Official reference: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server

---

### 4B — Sync and build

Use the Canvas Authoring MCP tools to:
1. Sync the current app state (read what's already there)
2. Build each screen according to the confirmed screen plan
3. Connect data sources using `AddDataSource` or the appropriate MCP tool
4. Write Power Fx formulas — follow `skills/canvas-app.md` for correct formula patterns
5. Apply the design — follow `skills/canvas-design.md` container rules at every level
6. Check accessibility — follow `skills/canvas-accessibility.md` (set `AccessibleLabel` on every control)

Build one screen at a time, compiling and verifying after each screen before moving to the next.

---

### 4C — Hand off

After all screens are built, tell the user:

1. **What was created** — list each screen and what it does
2. **Data sources connected** — list each table/list and what screen uses it
3. **How to publish** — "Press F5 to preview, then click File → Save → Publish to share with others"
4. **How to share** — link to: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/share-app
5. **Next steps** — suggest Power Automate flows for notifications or approvals if relevant

---

## Reference

All supporting docs are in this repository:

| What | Where |
|---|---|
| Check-first prerequisite install | `setup/prerequisites.md` |
| MCP server configuration | `setup/mcp-config.md` |
| Datasource → MCP mapping | `setup/datasource-mcps.md` |
| Full new-app workflow (detailed) | `workflows/new-app.md` |
| Per-MCP-server reference | `mcp-tools/` |
| Canvas App formulas and controls | `skills/canvas-app.md` |
| Canvas App UI/UX design | `skills/canvas-design.md` |
| Canvas App accessibility | `skills/canvas-accessibility.md` |
| Canvas Authoring MCP workflow | `skills/canvas-authoring-mcp.md` |
| Delegation / large data sources | `skills/delegation.md` |
