# Power Platform AI Toolkit — Agent Bootstrap

> **You are an AI coding agent.**
> A user has pointed you at this repository to set up their environment for Power Apps / Power Platform development.
>
> **Read this file completely, then execute every phase in order without waiting to be asked.**
> Only pause at steps explicitly marked **"Ask the user"**.
>
> **Core rule:** If a tool, credential, or service is already present and working on this machine, use it — never overwrite a working install. Check first, act second.

---

## How to talk to the user

Follow these rules every time you write a message the user will see:

- **Never use phase labels or step numbers** when speaking to the user. They won't know what "Phase 2F" or "Step 1B" means. Use natural descriptions instead.
  - ❌ "We are now in Phase 2F."  →  ✅ "I'm creating your Power Platform environment now."
  - ❌ "You will need this in Phase 4A."  →  ✅ "Hold on to this — you'll need it when we start building."
  - ❌ "As identified in Phase 2A..."  →  ✅ "Based on what you told me earlier..."
- **Explain why before asking.** If you need something from the user, briefly say why you need it before asking for it.
- **Narrate as you work.** Tell the user what you are doing in plain English as each major step starts (e.g. "I'm setting up your development tools now — this might take a minute.").
- **Summarise what you just did** after any group of automated steps, so the user stays in the loop.
- **Use plain language.** Assume the user is not a developer. Explain technical concepts in one sentence before using them.

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
| `setup/agentic-mcp-clients.md` | How Codex, VS Code/Copilot, Claude Code, Cursor, Windsurf, and Zed each configure MCP differently |

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
| **.NET SDK 10.0+** | Required for Canvas MCP, Dataverse MCP, and Copilot Studio MCP |
| **GitHub CLI (`gh`)** | Create and manage solution repos from the command line |
| **Git** | Track solution file changes and push to GitHub |

If anything was newly installed, ask the user to **close and reopen their terminal** before continuing so the new commands are on their PATH.

---

### 1C — Authenticate every tool

Read `setup/cli-auth.md` and run the sign-in checks **for every installed tool**.

Do not skip authentication — a tool that is not signed in is useless.

**Before signing in to anything**, tell the user:
> "You may have more than one Microsoft account — for example a work account, a personal account,
> or access to different organisations. You may also have more than one GitHub account.
> I'll check what's already set up and ask you to confirm before we proceed."

For each tool, follow the check-first pattern in `setup/cli-auth.md`:
1. Check if a profile or session already exists
2. Show it to the user in plain language
3. Ask: "Is this the right account for this project?" before proceeding
4. Only sign in or switch if needed

| Tool | What it authenticates to |
|---|---|
| `pac auth create` | Power Platform (Dataverse, environments, solutions) |
| `gh auth login` | GitHub (repos, PRs) |
| `git config` | Attach a name and email to commits |

> **Tip:** `pac`, `m365`, and `az` all use Microsoft accounts and often share the same tenant.
> Once you confirm the Microsoft account for Power Platform, check whether it applies for
> Microsoft 365 and Azure too — avoid asking for the same information twice.

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
External tools / coauthoring guide: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/create-canvas-external-tools

**GitHub Copilot CLI users — plugin install alternative:**
If you are using GitHub Copilot CLI, you can install the Canvas MCP as a plugin instead of (or in addition to) the dotnet global tool:

```
/plugin marketplace add microsoft/power-platform-skills
/plugin install canvas-apps@power-platform-skills
```

Full control docs, design guidance, and workflow instructions are in the plugin repo:
https://aka.ms/canvas-authoring-mcp

---

### 1E — Configure MCP servers

Read `setup/agentic-mcp-clients.md` and `setup/mcp-config.md`.

Collect the required credentials from the user, then write or update the active client's MCP config. For this toolkit's default Copilot-style setup, that is `~/.copilot/mcp-config.json`.

**Key rule:** Detect the active coding client before writing MCP config. Codex, VS Code/Copilot, Claude Code, Cursor, Windsurf, and Zed use different config locations and schemas. If the config file already exists, read it first and merge — only add or update keys, never overwrite the whole file.

Also add this toolkit's local path to the filesystem MCP so your skill files stay accessible:

```powershell
# Ask the user where they cloned this repo — then add it to the filesystem MCP paths
$toolkitPath = "C:\Repositories\powerplatform-ai-toolkit"  # confirm with user
```

Tell the user: "Restart your AI coding tool (e.g. VS Code) after this step for the MCP config to take effect."

For canvas app switching or 404 recovery, prefer the repo helper script so both canvas MCP entries stay in sync:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\update-canvas-mcp-from-url.ps1 `
  -StudioUrl "https://make.powerapps.com/e/<ENV_ID>/canvas/?action=edit&app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F<APP_ID>"
```

Then reload/restart both MCP servers (`powerapps-canvas` and `canvas-authoring`) before attempting `sync_canvas`.

---

## Phase 2 — Understand what to build

### 2A — Ask what they want to build

**Ask the user:**
> "What Power Apps app would you like to build? Describe it as you would explain it to a
> colleague — what problem does it solve, who will use it, and what data does it need?"

From their answer, extract:
- The **purpose** of the app
- The **users** (internal staff, customers, field workers, managers, etc.)
- The **data** the app needs to track, display, or update
- Any **workflows** or side effects (approvals, notifications, status changes, emails)
- Any **external systems** the app needs to talk to (existing databases, third-party services, company APIs)
- Whether they already have a **SharePoint site** they work from, or use **SharePoint** for anything

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

**If the plan includes SharePoint lists**, ask these follow-up questions before moving on
(read the explanations from `setup/sharepoint.md` if you need more context to explain this):

> "For the SharePoint data, I need a few more details:
>
> 1. **Site** — SharePoint lists live inside a SharePoint site (think of it as a workspace on
>    your company intranet). Do you already have a SharePoint site you want to use, or should I
>    create a new one? If new, what should it be called?
>
> 2. **Lists** — Based on your description, I'm planning these lists: [your list names]. Does
>    that look right, and are there any you already have that I should connect to instead?
>
> 3. **Access** — Who should be able to see and edit these lists? (e.g. everyone in the company,
>    just your team, or specific people)"

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

- For **Dataverse** tables: follow the commands in `setup/datasource-mcps.md`
- For **SharePoint sites and lists**: read and follow `setup/sharepoint.md` — it covers creating the site (if needed), creating lists, and adding the right column types. It also includes questions to ask the user before creating anything.
- For **Azure SQL**: follow the commands in `setup/datasource-mcps.md`

Tell the user each thing you create as you go. Use plain language:
> "I've created the 'Tasks' list in your SharePoint site with these columns: Title, Status, Priority, Assigned To, Due Date."

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

Before creating a new solution, ask which publisher to use:
- existing custom publisher,
- create a new custom publisher, or
- default environment publisher.
Do not auto-select the default publisher without user confirmation.

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
> You do not need to open it yet — I will ask you to open it when we are ready to start building.
> For now, keep it handy."

Save the environment ID and app ID — you will need them when connecting the Canvas Authoring MCP.

---

## Phase 2G — Set up GitHub source control for the solution

Now that the Power Platform resources exist, connect the solution to GitHub
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

## Phase 2H — Set up Azure DevOps project tracking (optional)

**Ask the user:**
> "Would you like to track your project in Azure DevOps? It lets you manage your backlog and
> plan your work using Epics, Features, and User Stories — and your AI agent can create and
> update items automatically as it builds.
>
> This is optional — if you already track work somewhere else, or don't need project tracking
> right now, we can skip it."

If the user says **yes**:

Read and execute `setup/devops.md` fully.

The file will guide you through:
1. Installing the Azure DevOps CLI extension (if not already installed)
2. Asking the user for their ADO organisation URL and project name
3. Creating the project if it does not exist (ask which process: Agile, Scrum, or CMMI)
4. Creating Epics, Features, and User Stories based on what the user described in their app brief — derive real, relevant items from the app description, not generic placeholders
5. Creating four shared tracking queries (active work, not-started stories, my items, full hierarchy)

**Before creating any work items**, show the user the Epics you plan to create and ask:
> "Here is how I plan to organise your backlog: [list Epics]. Does that look right, or would you like to adjust anything?"

Wait for confirmation before creating anything.

Tell the user when done:
> "Your Azure DevOps project is set up. You can view your backlog here:
> [adoOrg]/[adoProject]/_backlogs/backlog"

If the user says **no**: continue to the next step.

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

> **⚠️ Coauthoring must be enabled before the Canvas MCP will work.**
> Once the app is open in Studio, go to **Settings → Updates** and turn on **Coauthoring**.
> If it is off, the MCP server cannot sync changes into the app. Ask the user to confirm it is on.

You already have the environment ID and app ID from the provisioning step. Update the canvas MCP entries
in `mcp-config.json` with them now (use the update script in `setup/mcp-config.md`).

**Quick way (GitHub Copilot CLI):** Run `/configure-canvas-mcp` once the app is open in Studio
and paste the Studio URL when prompted — it extracts the environment ID, app ID, and cluster info automatically.

**Other tools:** Use the update script in `setup/mcp-config.md`, or extract the IDs from the Studio URL manually:
```
https://make.powerapps.com/e/<ENVIRONMENT_ID>/canvas/?action=edit&app-id=<APP_ID>
```

Then **ask the user to open the edit link** you gave them earlier:

> "Time to start building. Please open your canvas app in Power Apps Studio using this link:
> [the edit link from the provisioning step]
>
> Once it is fully loaded and coauthoring is enabled (Settings → Updates → Coauthoring), let me know
> and I will start building."

Wait for the user to confirm the app is open and coauthoring is on before proceeding.

Official reference: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server
Coauthoring + external tools: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/create-canvas-external-tools

### 4A.1 — Mandatory proactive recovery gate (do this before any canvas build)

When a Studio URL is available, do this automatically before asking the user for manual retries:

1. For the toolkit's default Copilot-style setup, run the URL-based updater:
```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\update-canvas-mcp-from-url.ps1 `
  -StudioUrl "<STUDIO_URL>"
```
2. For Codex, VS Code/Copilot, Claude Code, Cursor, Windsurf, or Zed, also write the same App ID and Environment ID to the active client's real MCP config file using `setup/agentic-mcp-clients.md`.
3. Restart/reload both MCP servers (`powerapps-canvas` and `canvas-authoring`) where both are configured.
4. Run `list_controls` as the connection gate.

If `list_controls` fails (for example HTTP 404), run this exact automated recovery loop before asking the user to do anything:
- Re-run the URL-based updater.
- Re-check the active client's actual MCP config file.
- Restart/reload the relevant MCP servers again.
- Ask the user to refresh Studio once and confirm coauthoring is still ON.
- Wait 20-30 seconds and retry `list_controls`.

Do not proceed to `sync_canvas`, editing, or `compile_canvas` until `list_controls` succeeds.

---

### 4B — Build screen by screen

**Slash commands (GitHub Copilot CLI):**
- `/generate-canvas-app` — generate a complete new app from a description; describe screens, data, and style
- `/edit-canvas-app` — make targeted edits to an existing app; describe what to change

**For all tools — iterative build workflow:**

Use the Canvas Authoring MCP tools to:

1. Sync the current app state (read what is already there before making changes)
2. Build each screen according to the confirmed screen plan — one screen at a time
3. Connect data sources using the MCP data tools or the Add Data panel
4. Write Power Fx formulas — follow `skills/canvas-app.md` for correct formula patterns
5. Apply the design — follow `skills/canvas-design.md` container rules at every level
6. Check accessibility — follow `skills/canvas-accessibility.md`; set `AccessibleLabel` on every interactive control

**Best practices:**
- Start simple — build a basic working version first, then add complexity
- Test frequently — sync and check each screen in Studio before moving to the next
- Be specific — the more detail you provide about behaviour and data, the better the output
- Validate generated code — always check formulas compile and data sources are connected correctly

Compile and verify each screen before moving to the next. Fix any errors before continuing.

---

### 4C — Handoff

After all screens are built and verified, give the user:

1. **What was created** — list each screen and what it does
2. **Data sources connected** — which table/list each screen uses
3. **How to preview** — press F5 in Power Apps Studio
4. **How to publish** — File → Save → Publish
5. **How to share** — https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/share-app
6. **Suggested next steps** — if workflows (approvals, notifications) were identified when the user described what they wanted to build, suggest setting those up in Power Automate

---

## Quick reference — files in this repo

| What | Where |
|---|---|
| Check-first tool install | `setup/prerequisites.md` |
| CLI sign-in for every tool | `setup/cli-auth.md` |
| MCP server configuration | `setup/mcp-config.md` |
| Datasource decision guide + commands | `setup/datasource-mcps.md` |
| SharePoint sites, lists, and columns | `setup/sharepoint.md` |
| External API and custom connector setup | `setup/apis.md` |
| Provision environment, solution, canvas app | `setup/provision.md` |
| GitHub source control + Actions workflows | `setup/github-integration.md` |
| Azure DevOps project + work item hierarchy | `setup/devops.md` |
| End-to-end new app workflow (detailed) | `workflows/new-app.md` |
| Per-MCP-server reference | `mcp-tools/` |
| Canvas App formulas and controls | `skills/canvas-app.md` |
| Canvas App UI/UX design | `skills/canvas-design.md` |
| Canvas App accessibility | `skills/canvas-accessibility.md` |
| Canvas Authoring MCP workflow | `skills/canvas-authoring-mcp.md` |
| Delegation / large data sources | `skills/delegation.md` |
