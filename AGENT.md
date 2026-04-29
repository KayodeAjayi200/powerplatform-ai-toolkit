# Power Platform AI Toolkit — Agent Bootstrap

> **You are an AI coding agent.**
> A user has pointed you at this repository to set up their environment for Power Apps / Power Platform development.
>
> **Read this file completely, then execute every phase in order without waiting to be asked.**
> Only pause at steps explicitly marked **"Ask the user"**.
>
> **Core rule:** If a tool, credential, or service is already present and working on this machine, use it — never overwrite a working install. Check first, act second.

---

## Phase 1 — Environment setup

### 1A — Load your domain knowledge

Before doing anything else, read these files from this repository so you have full context for every decision you make throughout:

| File | What it teaches you |
|---|---|
| `skills/canvas-app.md` | Power Fx formulas, galleries, forms, collections, navigation |
| `skills/canvas-design.md` | Container-based layout, Fluent UI, responsive design — the rules you must follow when building |
| `skills/canvas-accessibility.md` | WCAG 2.1 AA rules every canvas app must meet |
| `skills/canvas-authoring-mcp.md` | How to connect and edit a live canvas app via MCP |
| `skills/delegation.md` | How to filter large data sources without hitting delegation limits |

Reading these now means you will not need to look anything up mid-build.

---

### 1B — Install core tools (check first)

Read `setup/prerequisites.md` and run the **core tools** install block.

Rules:
- Use the check-first script — do not install anything already on the machine
- Tell the user what you found and what (if anything) you installed
- If winget is not available, fall back to the official installer linked in `setup/prerequisites.md`

**Tools installed here:**

| Tool | Why it is needed |
|---|---|
| **Node.js** | Runtime for MCP servers (GitHub, filesystem, Playwright, etc.) |
| **Power Platform CLI (`pac`)** | Manage environments, export solutions, create Dataverse tables |
| **.NET SDK 8+** | Required for Canvas MCP, Dataverse MCP, and Copilot Studio MCP |
| **GitHub CLI (`gh`)** | Create and manage solution repos from the command line |
| **Git** | Track solution file changes and push to GitHub |

If anything was newly installed, ask the user to **close and reopen their terminal** before continuing so the new commands are on their PATH.

---

### 1C — Authenticate every tool

Read `setup/cli-auth.md` and run the sign-in checks **for every installed tool**.

Do not skip authentication — a tool that is not signed in is useless.

| Tool | What it authenticates to |
|---|---|
| `pac auth create` | Power Platform (Dataverse, environments, solutions) |
| `gh auth login` | GitHub (repos, PRs) |
| `git config` | Attach a name and email to commits |

After authenticating pac, list the available environments and ask the user which one to use:

```powershell
pac env list
```

**Ask the user:**
> "Which environment should I use for this project? (paste the name or ID from the list above)"

Then select it:

```powershell
pac env select --environment "THE ENV THEY CHOSE"
```

---

### 1D — Install .NET MCP server tools

These are the dotnet global tools that power the MCP servers for canvas app authoring, Dataverse, and Copilot Studio.
Check for existing installs before installing anything.

```powershell
# List what is already installed globally to avoid reinstalling
$installed = (dotnet tool list -g 2>&1).ToLower()

# Canvas Authoring MCP — needed to build canvas apps via AI
if ($installed -notmatch [regex]::Escape("canvasauthoringmcpserver")) {
    dotnet tool install -g CanvasAuthoringMcpServer
    Write-Host "Installed CanvasAuthoringMcpServer"
} else { Write-Host "CanvasAuthoringMcpServer already installed — skipping" }

# dnx — alternate startup wrapper for Canvas MCP prerelease builds
if ($installed -notmatch "\bdnx\b") {
    dotnet tool install -g dnx
    Write-Host "Installed dnx"
} else { Write-Host "dnx already installed — skipping" }

# Dataverse MCP — needed if the app uses Dataverse tables
if ($installed -notmatch [regex]::Escape("microsoft.powerplatform.dataverse.mcp")) {
    dotnet tool install -g Microsoft.PowerPlatform.Dataverse.MCP
    Write-Host "Installed Dataverse MCP"
} else { Write-Host "Dataverse MCP already installed — skipping" }

# Copilot Studio MCP — install only if user has a Copilot Studio agent
if ($installed -notmatch [regex]::Escape("microsoft.agents.copilot")) {
    dotnet tool install -g Microsoft.Agents.CopilotStudio.Mcp
    Write-Host "Installed Copilot Studio MCP"
} else { Write-Host "Copilot Studio MCP already installed — skipping" }
```

Official Canvas MCP reference: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server
Official Dataverse MCP reference: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/dataverse-mcp

---

### 1E — Configure MCP servers

Read `setup/mcp-config.md`.

Collect the required credentials from the user, then write or update `~/.copilot/mcp-config.json`.

**Key rule:** If the config file already exists, read it first and merge — only add or update keys, never overwrite the whole file.

Also add this toolkit's local path to the filesystem MCP so your skill files stay accessible:

```powershell
# Ask the user where they cloned this repo — then add it to the filesystem MCP paths
$toolkitPath = "C:\Repositories\powerplatform-ai-toolkit"  # confirm with user
```

Tell the user: "Restart your AI coding tool (e.g. VS Code) after this step for the MCP config to take effect."

---

## Phase 2 — Understand what to build

### 2A — Ask what they want to build

**Ask the user:**
> "What Power Apps app would you like to build? Describe it as you would explain it to a colleague — what problem does it solve, who will use it, and what data does it need?"

From their answer, extract:
- The **purpose** of the app
- The **users** (internal staff, customers, field workers, managers, etc.)
- The **data** the app needs to track, display, or update
- Any **workflows** or side effects (approvals, notifications, status changes, emails)
- Any **external systems** the app needs to talk to (existing databases, third-party services, company APIs)

---

### 2B — Plan the data sources

Read `setup/datasource-mcps.md` to match each data need to the right data source type.

Present a data plan:

```
Here is what I am planning to set up:

Data sources:
  1. [Table / List name] — stored in [Dataverse / SharePoint / SQL]
     Key columns: [list columns and types]
  2. ...

Does this look right? Anything to add or change?
```

Wait for the user to confirm before proceeding.

---

### 2C — Check for external API integrations

Read `setup/apis.md`.

**Ask the user:**
> "Does this app need to connect to any external services or APIs? For example — a company system, a third-party service, or an internal API your team has built."

If yes:
- Identify whether a built-in Power Apps connector exists (check https://learn.microsoft.com/en-us/connectors/connector-reference/ first)
- If no built-in connector exists, set up a custom connector or Power Automate flow now — before building the app. The app cannot reference a connector that does not exist.
- Follow the steps in `setup/apis.md` for the relevant connector type

If no: continue.

---

### 2D — Install datasource-specific tools

Based on the confirmed data plan and API integrations, install any additional tools needed now — before you start building.

| If the app uses... | Install and authenticate |
|---|---|
| **SharePoint Lists** | Install m365 CLI (see `setup/prerequisites.md`), then sign in: `m365 login` |
| **Azure SQL** | Install Azure CLI + sqlcmd (see `setup/prerequisites.md`), then sign in: `az login` |
| **Azure SQL** | After `az login`, set the correct subscription: `az account set --subscription "NAME"` |
| **Custom connector with OAuth** | Create an Azure AD app registration (see `setup/apis.md`) |

Do not install tools that are not needed. Only install what the confirmed data sources and integrations require.

---

### 2E — Create the data sources

Based on the confirmed data plan, create the tables, lists, or databases.
Follow the commands in `setup/datasource-mcps.md` for the relevant data source type.

Tell the user each thing you create as you go.

After creation:
- Confirm all data sources exist and are accessible
- Note the environment ID and solution name — you will need these when building the app


---

## Phase 2F — Provision the Power Platform resources

Read `setup/provision.md` and execute every step there.

The goal is to make sure the user has a working environment, solution, and canvas app
**before** you ask them to open Studio in Phase 4A. Trying to connect the Canvas MCP to an
app that does not exist yet will fail.

Do this in order:

**1. Environment**
Run `pac env list`. If a suitable environment already exists, ask the user which one to use
and select it. If not, create one with `pac admin create`.

Note the environment ID and org URL — you will need both in the next steps.

**2. Solution**
Run `pac solution list`. If a solution already exists for this project, use it.
If not, create one via the Dataverse Web API (see `setup/provision.md` Step 2).

Note the solution unique name — you will need it when adding the app.

**3. Canvas app**
Run `pac canvas list`. If a blank app already exists for this project, use it.
If not, create one via the Power Apps REST API (see `setup/provision.md` Step 3).
If the API fails, walk the user through the 6-step manual creation — it takes under a minute.

Add the app to the solution (`pac solution add-solution-component`).

**4. Hand the user the edit link**
```powershell
$editLink = "https://make.powerapps.com/e/$environmentId/canvas/?action=edit&app-id=$appId"
Write-Host "Your canvas app is ready: $editLink"
```

Tell the user:
> "Your environment, solution, and blank canvas app are all set up.
> Here is your edit link: [link]
> You do not need to open it yet — I will ask you to open it in Phase 4 when we are ready to build.
> For now, keep it handy."

Save the environment ID and app ID — you will need them in Phase 4A.

---

## Phase 2G — Set up GitHub source control for the solution

Now that the Power Platform resources exist (Phase 2F), connect the solution to GitHub
so that all changes are version-controlled and can be deployed automatically.

Read and execute `setup/github-integration.md` fully.

The file will guide you through:
1. Creating a private GitHub repo for the solution (check if one already exists first)
2. Creating a Power Platform service principal for headless GitHub Actions authentication
3. Storing the service principal credentials as GitHub secrets
4. Writing two GitHub Actions workflows into the repo:
   - **Export workflow** — manually triggered; exports the solution from dev and opens a PR
   - **Deploy workflow** — auto-triggered on merge to main; packs and deploys to test
5. Making the initial commit with workflows and placeholder folders

**Before creating a new repo, always check:**
```powershell
gh repo list --limit 100 | Select-String $solutionRepoName
```
If a repo already exists for this solution, clone it instead of creating a new one.

Tell the user when done:
> "Your solution is now connected to GitHub. Whenever you want to save your changes to source
> control, go to the Actions tab in your repo and run 'Export solution from dev'.
> Merging that PR to main will automatically deploy to your test environment."

---

## Phase 3 — Design

### 3A — Collect design references

**Ask the user:**
> "Do you have any design references?
> - Screenshots of apps you like the look of
> - Wireframes or sketches
> - Brand colours (hex codes) or a company logo
> - A style in words (clean and minimal, bold and colourful, corporate, etc.)
>
> Paste images, share URLs, or describe it. If you have nothing, I will use Microsoft Fluent design defaults."

---

### 3B — Plan the screens

Based on the app purpose, user type, and data sources, plan:
- Which screens the app needs (e.g. Home, List view, Detail / edit form, Settings)
- What data each screen shows or edits
- How the user navigates between screens
- What actions each screen supports (add, edit, delete, submit, approve, etc.)

**Rules from `skills/canvas-design.md` that apply at this stage:**
- Every screen uses Horizontal and Vertical containers — no absolute X/Y positions ever
- Navigation is always a vertical left-panel or a bottom tab bar
- Cards use rounded corners, subtle shadows, and consistent spacing
- Brand colours or Fluent defaults apply consistently across every screen

Present the screen plan and confirm with the user before building.

---

## Phase 4 — Build

### 4A — Connect to Canvas Authoring MCP

Read `skills/canvas-authoring-mcp.md` now if you have not already.

You already have the environment ID and app ID from Phase 2F. Update the canvas MCP entries
in `mcp-config.json` with them now (use the update script in `setup/mcp-config.md`).

Then **ask the user to open the edit link** you gave them in Phase 2F:

> "Time to start building. Please open your canvas app in Power Apps Studio using this link:
> [the edit link from Phase 2F]
>
> Once it is fully loaded and you can see the blank canvas, let me know and I will start building."

Wait for the user to confirm the app is open before proceeding.

The Studio URL confirms the IDs in this format:
```
https://make.powerapps.com/e/<ENVIRONMENT_ID>/canvas/?action=edit&app-id=<APP_ID>
```

Official reference: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server

---

### 4B — Build screen by screen

Use the Canvas Authoring MCP tools to:

1. Sync the current app state (read what is already there before making changes)
2. Build each screen according to the confirmed screen plan — one screen at a time
3. Connect data sources using the MCP data tools or the Add Data panel
4. Write Power Fx formulas — follow `skills/canvas-app.md` for correct formula patterns
5. Apply the design — follow `skills/canvas-design.md` container rules at every level
6. Check accessibility — follow `skills/canvas-accessibility.md`; set `AccessibleLabel` on every interactive control

Compile and verify each screen before moving to the next. Fix any errors before continuing.

---

### 4C — Handoff

After all screens are built and verified, give the user:

1. **What was created** — list each screen and what it does
2. **Data sources connected** — which table/list each screen uses
3. **How to preview** — press F5 in Power Apps Studio
4. **How to publish** — File → Save → Publish
5. **How to share** — https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/share-app
6. **Suggested next steps** — if workflows (approvals, notifications) were identified in Phase 2A but not yet built, suggest setting those up in Power Automate

---

## Quick reference — files in this repo

| What | Where |
|---|---|
| Check-first tool install | `setup/prerequisites.md` |
| CLI sign-in for every tool | `setup/cli-auth.md` |
| MCP server configuration | `setup/mcp-config.md` |
| Datasource decision guide + commands | `setup/datasource-mcps.md` |
| External API and custom connector setup | `setup/apis.md` |
| Provision environment, solution, canvas app | `setup/provision.md` |
| GitHub source control + Actions workflows | `setup/github-integration.md` |
| End-to-end new app workflow (detailed) | `workflows/new-app.md` |
| Per-MCP-server reference | `mcp-tools/` |
| Canvas App formulas and controls | `skills/canvas-app.md` |
| Canvas App UI/UX design | `skills/canvas-design.md` |
| Canvas App accessibility | `skills/canvas-accessibility.md` |
| Canvas Authoring MCP workflow | `skills/canvas-authoring-mcp.md` |
| Delegation / large data sources | `skills/delegation.md` |