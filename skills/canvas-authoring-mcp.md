---
name: canvas-authoring-mcp
description: Canvas Authoring MCP connection guide — how to point the MCP at the right Power Apps canvas app, extract App ID and Environment ID from the Studio URL, update the active agent client's MCP config, restart the MCP server, and resolve 404 connection errors. Use this skill before any Canvas Authoring MCP tool call.
license: MIT
metadata:
  author: KayodeAjayi200
  version: "1.0.0"
  organization: Veldarr
  date: April 2026
  abstract: Step-by-step guide for AI agents to connect the Canvas Authoring MCP server to the correct Power Apps canvas app. Covers extracting App ID and Environment ID from the Studio URL, reading and updating the active client's MCP config, restarting the MCP server, verifying co-authoring is active, and resolving HTTP 404 connection errors across both powerapps-canvas and canvas-authoring MCP entries.
---

# AGENT SKILL: Canvas Authoring MCP — Building Canvas Apps with AI

> **Reference for AI agents working with the Canvas Authoring MCP server.**
> Read this skill whenever a user asks you to create, edit, fix, or build controls in a Canvas App
> via the Canvas Authoring MCP, or whenever you get a 404 / connection error from the MCP.
>
> Official guide: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/create-canvas-external-tools

---

## Active-client rule

Do not assume every agentic coding tool reads `~/.copilot/mcp-config.json`.

- Codex reads `~/.codex/config.toml` and trusted project `.codex/config.toml`.
- VS Code/Copilot reads `mcp.json` with a `servers` root.
- Claude Code, Cursor, and Windsurf use `mcpServers`.
- Zed uses `context_servers`.

Before touching Canvas MCP, run the repo helper when available:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\update-canvas-mcp-from-url.ps1 `
  -StudioUrl "<STUDIO_URL>" `
  -ProjectPath "<TARGET_PROJECT_PATH>"
```

This writes both `powerapps-canvas` and `canvas-authoring` to the common client config formats. On Windows it uses `cmd.exe /c <absolute CanvasAuthoringMcpServer.cmd>` for the stable server so Codex desktop and other packaged apps do not depend on PATH inheritance.

After config updates, restart/reload MCP servers and validate with `list_controls` before `sync_canvas`.

---

## Plugin install (GitHub Copilot CLI and Claude Code)

Before anything else, install the Power Platform Skills plugin. This gives you the slash commands and loads all the canvas app knowledge the AI needs.

**Step 1 — Add the marketplace plugin:**
```
/plugin marketplace add microsoft/power-platform-skills
```

**Step 2 — Install the canvas apps plugin:**
```
/plugin install canvas-apps@power-platform-skills
```

The plugin repository contains full control documentation, design guidance, and workflow instructions:
https://aka.ms/canvas-authoring-mcp

---

## Slash commands

Once the plugin is installed, these commands are available:

| Command | What it does |
|---|---|
| `/generate-canvas-app` | Create a new canvas app from a natural language description |
| `/edit-canvas-app` | Make changes to an existing canvas app using natural language |
| `/configure-canvas-mcp` | Register the Canvas Authoring MCP server — paste the Studio URL and it extracts all IDs automatically |

**Always run `/configure-canvas-mcp` before building or editing.** It sets up the MCP connection in one step — no manual ID copying.

---

## Prerequisites — what must be true before building

1. **.NET SDK 10.0 or later** — run `dotnet --version` to check. Must show `10.x`.
   Install: https://dotnet.microsoft.com/download/dotnet/10.0

2. **A canvas app already exists** in a Power Platform environment. If not, create one first:
   - Power Apps (make.powerapps.com) → Create → Blank app → Save → name it → copy the edit URL

3. **The app is open in Power Apps Studio** in a browser tab

4. **Coauthoring is enabled** — Studio → Settings → Updates → Coauthoring → turn on.
   If coauthoring is off, every MCP call fails silently or returns 404.

---

## How the agent creates a canvas app — end to end

### What happens under the hood

1. You describe what you want in natural language
2. The AI uses the MCP server to discover available controls, connectors, and data sources
3. It asks clarifying questions about requirements
4. It generates `.pa.yaml` files defining screens, controls, and Power Fx formulas
5. It validates the YAML using `powerapps-canvas-compile_canvas` and fixes any errors
6. Changes sync into Power Apps Studio via the live coauthoring session

---

## Creating a new canvas app — step by step

### Before starting

- Make sure a blank canvas app exists and is open in Studio with coauthoring ON
- Run `/configure-canvas-mcp` and paste the Studio URL

### Step 1 — Describe what you want to build

Be as specific as possible. The more detail you give, the less the AI has to guess.

**Good description examples:**
- "Create a canvas app for tracking inventory with a searchable list and a detail view showing quantity, location, and last updated date"
- "Build an employee onboarding app with a multi-step form — personal details, equipment request, and manager sign-off steps"
- "Make a sales dashboard showing pipeline value, win rate, and top deals — use cards and a bar chart"
- "Create a field inspection app where engineers log issues with a photo, severity rating, and location"

You can also attach screenshots, wireframes, or brand colours to guide the visual style.

### Step 2 — Answer clarifying questions

The AI will ask about:
- Which Dataverse tables or connectors to use as data sources
- Specific UI components or layout preferences
- Business logic (approvals, filters, calculations)

Be specific — this shapes the formulas and data connections.

### Step 3 — Review and validate

The AI generates `.pa.yaml` files for each screen and validates them.
It fixes validation errors automatically. Changes sync into your Studio session.

### Step 4 — Test and iterate

Open the app in Studio. Preview it. Describe any changes you want:
- "Add a filter to show only items with quantity below 10"
- "Change the home screen to a card grid instead of a list"
- "Add a confirmation screen before submitting"

Keep iterating until it meets your requirements.

---

## Editing an existing canvas app — step by step

### Step 1 — Sync the current app state

Ask the AI to start editing your app. It pulls the current YAML from Studio:
> "I want to edit my expense tracking app"

The AI runs `powerapps-canvas-sync_canvas` to pull all screens and controls into local `.pa.yaml` files.

This step is mandatory before every additional edit, even if local YAML already exists. The user may have changed the app manually in Studio since the previous agent run. Pull Studio first so local files represent the current live app before generating new changes.

### Step 2 — Describe your changes

Examples:
- "Add a filter to show only pending expenses"
- "Change the home screen layout to a card-based grid"
- "Add a new screen for viewing expense history with a bar chart"
- "Update the form to include a dropdown for expense categories"
- "Fix the gallery — it should show the Submitted By column, not the ID"

### Step 3 — Review, validate, and test

Same as creating — the AI validates, fixes errors, syncs changes. Test in Studio, iterate.

---

## Best practices for AI-generated canvas apps

- **Start simple** — get a basic working version first, then add complexity screen by screen
- **Test frequently** — preview in Studio after each significant change before asking for more
- **Be specific** — detailed requirements give better initial output with fewer corrections
- **Bold design choices** — describe the visual style you want; don't accept generic layouts
- **Validate generated code** — always check formulas compile and data sources are connected correctly
- **Use existing patterns** — reference similar apps or UI patterns when describing requirements
- **You are responsible** — AI makes a best effort but you must review for your org's standards and compliance

---

## What is the Canvas Authoring MCP?

The Canvas Authoring MCP server lets an AI agent read and write a live Canvas App that is
open in Power Apps Studio — without the user having to manually edit YAML files.

It connects to Power Apps Studio's **co-authoring** session. That session is tied to a
specific App ID **and** a specific Environment ID. If either of those IDs is wrong in the
MCP config, every call returns HTTP 404 and nothing works.

---

## The #1 rule — always verify the App ID and Environment ID before touching the MCP

**Before calling any canvas authoring tool, always check that the configured App ID and
Environment ID match the app the user wants to edit.**

The user may have multiple apps across multiple environments. The MCP config file holds
only ONE app ID at a time. If the user has worked on different apps in different sessions,
the config is almost certainly pointing at the wrong app.

---

## Step 1 — Get the correct App ID and Environment ID

There are two ways the user can give you the IDs:

### Option A — from the Power Apps Studio URL (most reliable)

Ask the user to copy the URL from their browser while the app is open in Studio.
The URL looks like this:

```
https://make.powerapps.com/e/{ENVIRONMENT_ID}/canvas/?action=edit&app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F{APP_ID}&solution-id=...
```

Parse it like this:

- **Environment ID** — the GUID immediately after `/e/` in the URL
  Example: `https://make.powerapps.com/e/25146b4f-3532-efb4-8ce7-a181452f88ae/canvas/...`
  → Environment ID = `25146b4f-3532-efb4-8ce7-a181452f88ae`

- **App ID** — the GUID at the very end of `app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F`
  Example: `app-id=%2Fproviders%2FMicrosoft.PowerApps%2Fapps%2F58aa6a76-ecd1-4560-a451-b99c6582e783`
  → App ID = `58aa6a76-ecd1-4560-a451-b99c6582e783`

> `%2F` is just URL-encoding for `/`. Strip it — the App ID is always the last GUID.

### Option B — from the PAC CLI

If the user knows the app name, you can look up the App ID programmatically:

```powershell
# List all canvas apps in the current environment and find the one by name.
# Replace "My App Name" with the actual app name.
pac canvas list | Select-String "My App Name"
```

The output includes the App ID (a GUID) in the second column.

To get the current environment ID:
```powershell
# The selected environment shows a ">" marker in the first column.
pac env list
```

---

## Step 2 — Check what is currently configured

Run this to see what App ID and Environment ID the MCP is currently using:

```powershell
$config = Get-Content "$env:USERPROFILE\.copilot\mcp-config.json" -Raw | ConvertFrom-Json

Write-Host "powerapps-canvas MCP:"
Write-Host "  App ID:  $($config.mcpServers.'powerapps-canvas'.env.CANVAS_APP_ID)"
Write-Host "  Env ID:  $($config.mcpServers.'powerapps-canvas'.env.CANVAS_ENVIRONMENT_ID)"

Write-Host "`ncanvas-authoring MCP:"
Write-Host "  App ID:  $($config.mcpServers.'canvas-authoring'.env.CANVAS_APP_ID)"
Write-Host "  Env ID:  $($config.mcpServers.'canvas-authoring'.env.CANVAS_ENVIRONMENT_ID)"
```

Compare the output to the IDs you got from the Studio URL.
If either is different — update the config (Step 3).

---

## Step 3 — Update the config to point at the right app

Run this, replacing the two ID values with the correct ones from Step 1:

```powershell
$mcpPath = "$env:USERPROFILE\.copilot\mcp-config.json"
$config  = Get-Content $mcpPath -Raw | ConvertFrom-Json

# ✏️  Replace these two values with what you got from the Studio URL:
$newAppId = "PASTE-APP-ID-HERE"
$newEnvId = "PASTE-ENVIRONMENT-ID-HERE"

# Update both MCP server entries — they must always match each other
$config.mcpServers.'powerapps-canvas'.env.CANVAS_APP_ID         = $newAppId
$config.mcpServers.'powerapps-canvas'.env.CANVAS_ENVIRONMENT_ID = $newEnvId
$config.mcpServers.'canvas-authoring'.env.CANVAS_APP_ID         = $newAppId
$config.mcpServers.'canvas-authoring'.env.CANVAS_ENVIRONMENT_ID = $newEnvId

# Save — UTF8 without BOM is fine for JSON
$config | ConvertTo-Json -Depth 10 | Set-Content $mcpPath -Encoding UTF8
Write-Host "✅  Config updated — App: $newAppId | Env: $newEnvId"
```

---

## Step 4 — Restart the MCP server

The MCP server reads its config at startup. You must restart it after any config change.

Tell the user to do one of the following:

**Option A — Restart Copilot CLI completely**
1. Close the Copilot CLI window
2. Reopen it from the Desktop shortcut or Start menu
3. Come back to the same session

**Option B — Reload individual MCP servers (faster)**
1. Click the MCP plug icon (🔌) in the Copilot sidebar
2. Find `powerapps-canvas` and `canvas-authoring` in the list
3. Click the restart/reload button (↺) next to each one

---

## Step 5 — Verify the Studio session is ready

Before trying to sync, confirm the user has done all of this in Power Apps Studio:

| Requirement | How to check |
|---|---|
| App is open in Studio | User should have the Studio browser tab open |
| Co-authoring is ON | Settings → Updates → Co-authoring → toggle is blue |
| App has not timed out | If Studio was idle for 30+ minutes, refresh the page and re-enable co-authoring |
| Correct app is open | The app name in the Studio header must match the one you looked up in Step 1 |

> ⚠️ Co-authoring must be **ON** before you restart the MCP server. If you turn it on
> after restarting, restart the MCP server again.

---

## Step 6 — Test the connection

After restarting, try to sync the canvas. This call reads the live YAML from Studio:

```
canvas-authoring-sync_canvas  directoryPath: "C:\path\to\working\directory"
```

**If it succeeds:** you get YAML files in the target directory. You are connected.

**If it returns 404:** go through the checklist below.

---

## Troubleshooting — 404 / connection errors

Work through this list in order. Most issues are caused by a mismatch at one of these steps.

| Symptom | Most likely cause | Fix |
|---|---|---|
| HTTP 404 on every MCP call | App ID or Env ID is wrong | Re-check Step 1 — confirm against Studio URL |
| 404 even after updating config | MCP server not restarted yet | Restart the MCP server (Step 4) |
| 404 after restart | Co-authoring is OFF | Enable co-authoring in Studio, then restart MCP again |
| 404 after enabling co-authoring | Studio session timed out | Refresh the Studio page, re-enable co-authoring, restart MCP |
| `dnx` not found error | .NET 10 SDK not installed | Run `dotnet --version` — must be 10.0+; install via `AGENT_SKILL.md` Step 1 |
| Config file not found | Copilot CLI not initialised | Run Copilot CLI at least once to create `~\.copilot\mcp-config.json` |
| Changes not appearing in Studio | Sync ran before co-authoring was on | Turn co-authoring on, then re-sync |
| Two different apps need editing | Config holds only ONE app at a time | Update config to the target app each time; restart MCP between switches |

---

## How the two MCP entries relate to each other

The MCP config has two canvas-related server entries. They serve the same purpose from
different access paths. **Both must always have the same App ID and Environment ID.**

| Entry key | Command used | Accessed via |
|---|---|---|
| `powerapps-canvas` | `CanvasAuthoringMcpServer` | `powerapps-canvas-*` tools |
| `canvas-authoring` | `dnx Microsoft.PowerApps.CanvasAuthoring.McpServer` | `canvas-authoring-*` tools |

If one is updated without the other, half your tool calls will connect and half will 404.
The update script in Step 3 always updates both — always use it.

---

## Quick-reference: tools available once connected

| Tool | What it does |
|---|---|
| `powerapps-canvas-sync_canvas` | **PULL** — overwrites local files with live YAML from Studio. PULL ONLY. |
| `powerapps-canvas-compile_canvas` | **PUSH** — validates local YAML and, if zero errors, commits changes to Studio |
| `powerapps-canvas-get_accessibility_errors` | List all accessibility violations in the app |
| `powerapps-canvas-list_controls` | List every control on every screen |
| `powerapps-canvas-describe_control` | Get the properties and schema for a specific control type |
| `powerapps-canvas-list_data_sources` | List data sources connected to the app |
| `powerapps-canvas-get_data_source_schema` | Get column types for a data source |
| `powerapps-canvas-list_apis` | List available connectors |

> ⚠️ **Always use the `powerapps-canvas-*` tool variants** (not `canvas-authoring-*`).
> `canvas-authoring-compile_canvas` returns "no active coauthoring session" even when Studio IS open.
> `powerapps-canvas-compile_canvas` is the one that actually works.

> ⚠️ **`sync_canvas` is PULL-ONLY.** It always overwrites your local files with the Studio version.
> It does NOT push local edits to Studio. To push, use `compile_canvas`.

> ⚠️ **Before every new edit request, run `sync_canvas` first.** This protects manual Studio changes by pulling them into local YAML before the agent modifies anything. Never compile stale local YAML over a live app that may have been edited manually.

---

## Workflow summary — every time you need to edit a canvas app

```
1. Ask user for Studio URL  →  extract App ID + Env ID
2. Check mcp-config.json   →  compare IDs
3. If different: update config (Step 3 script)  →  restart MCP (Step 4)
4. Confirm Studio has co-authoring ON and the correct app is open
5. Run powerapps-canvas-sync_canvas  →  confirm you get YAML files back (PULL)
6. Edit the local YAML files
7. Run powerapps-canvas-compile_canvas  →  if PASSED, changes are committed to Studio (PUSH)
8. For every additional user-requested change, repeat step 5 before editing again
9. Repeat steps 5-8 iteratively until all changes are in
```

> **The push/pull cycle:** sync = pull from Studio. compile (pass) = push to Studio.
> These are two separate operations. Never confuse them.

### Manual Studio change protection

Treat Power Apps Studio as the source of truth at the start of each edit cycle.

Use this sequence for every additional change:

1. Run `powerapps-canvas-sync_canvas` into the working sync directory.
2. Compare the pulled files with the previous local version if possible.
3. Preserve user/manual Studio changes found in the pull.
4. Apply the requested change on top of the freshly pulled YAML.
5. Run YAML/design/accessibility preflight.
6. Run `powerapps-canvas-compile_canvas`.

Do not skip the pull because the local sync folder "looks current". In coauthoring workflows, the user may have changed layout, formulas, data cards, or components directly in Studio between agent turns.

---

## How to fix accessibility errors — complete autonomous workflow

> Follow this exactly. Do not ask the user to do anything except confirm Studio is open with co-authoring ON.

### Step A — Confirm MCP is connected (do this first, every time)
1. Ask the user: *"Is your canvas app open in Power Apps Studio with co-authoring enabled?"*
2. Verify the MCP config App ID + Env ID match the Studio URL (Steps 1–4 of this skill)
3. Restart MCP servers if config changed

### Step B — Get all accessibility errors
```
powerapps-canvas-get_accessibility_errors
```
Note every control name, property, and screen. Group by screen.

### Step C — Pull the current YAML
```
powerapps-canvas-sync_canvas  directoryPath: "C:\<working-dir>\canvas-sync"
```
This creates one `.pa.yaml` file per screen plus `App.pa.yaml`.

> ⚠️ After every sync, check if a `Components\` folder was created. If not, and the app uses
> CanvasComponents, you must extract the component definition from the solution's `.msapp` file
> (see Problem 3 in the debugging log below). Without it, compile will fail.

### Step D — Edit the YAML to add missing properties

For each control flagged with "Missing accessible label":
1. Find the control in the YAML by searching for the control name (e.g. `- Gallery1:`)
2. Locate or create the `Properties:` block under it
3. Add `AccessibleLabel: ="Descriptive text here"` as the FIRST line in Properties
4. For gallery/list controls also flagged for TabIndex: add `TabIndex: =0`

**Label text guidance:**
- Buttons: `="Submit"`, `="Cancel"`, `="New report"`
- Galleries/lists: `="Report list"`, `="Approval timeline"`
- Icons: `="Navigation icon"`, `="Close"`, `="Search"`
- Images: `="Company logo"`, `="Profile picture"`
- Decorative shapes/rectangles: `="Separator"` or `="Divider"`
- Input fields: `="Report title input"`, `="Date picker"`
- Checkboxes: `="Agree to terms"`

**Controls that do NOT support AccessibleLabel** (skip them — adding it causes compile errors):
- `HtmlViewer`
- `ModernText`
- `Text` (classic label)
- `FluentV8/Label`
- The outer `CanvasComponent` wrapper of a component instance

**YAML indentation is variable** — controls inside containers can be 24–40+ spaces deep.
Detect the actual indent of the control name line and add 6 spaces for property values:
```
          - Gallery1:              ← this is the control name line (e.g. 10 spaces)
              Control: Gallery      ← 14 spaces (4 more)
              Properties:           ← 14 spaces
                AccessibleLabel: ="Report list"   ← 16 spaces (2 more)
                TabIndex: =0
```

### Step E — Push the changes
```
powerapps-canvas-compile_canvas  directoryPath: "C:\<working-dir>\canvas-sync"
```
- **"Validation PASSED"** → changes are live in Studio ✅
- **Validation FAILED** → read the errors carefully:
  - "property not supported" → that control type doesn't support AccessibleLabel — remove it
  - "component not found" → missing component definition — see Problem 3 in debugging log
  - Indentation error → re-check spacing around the added properties

### Step F — Verify
```
powerapps-canvas-get_accessibility_errors
```
Count should drop. Repeat D→E→F until zero errors (or only component-internal controls remain — see Step G).

### Step G — Component-internal controls (manual fix required)
If after compiling you still see errors on a control that is INSIDE a CanvasComponent
(e.g. `Rectangle1` inside `cmp_HeaderComplete`):
- The MCP compile mechanism cannot push component definition changes
- Tell the user: *"There is 1 remaining error inside the [ComponentName] component. Please open the component in Studio (left panel → Components → [ComponentName]), select [ControlName], and set its Accessible label property to '[value]'."*

---

## Real-world debugging log — what went wrong and how it was fixed

> This section records the actual problems encountered when building and using this skill.
> It is here so future agents don't repeat the same mistakes.

---

### Problem 1 — Canvas MCP returned HTTP 404 on every call

**What happened:**
The first attempt to run `canvas-authoring-sync_canvas` returned HTTP 404. The tool appeared to connect but immediately failed.

**Root cause:**
`mcp-config.json` contained placeholder App ID and Environment ID values from a previous session — they belonged to a completely different app. The MCP server validates these IDs against the active Studio co-authoring session and rejects any mismatch with a 404.

The config had:
```
CANVAS_APP_ID:         "25be9404-7270-405a-90df-659d500dd1ad"   ← wrong app
CANVAS_ENVIRONMENT_ID: "ef77d261-f915-e0fb-95f4-1cbc09edb6ab"  ← wrong environment
```

The user's actual app (visible in the Studio URL) was:
```
CANVAS_APP_ID:         "58aa6a76-ecd1-4560-a451-b99c6582e783"
CANVAS_ENVIRONMENT_ID: "25146b4f-3532-efb4-8ce7-a181452f88ae"
```

**Fix:**
1. Asked the user for the full Power Apps Studio URL from their browser
2. Parsed App ID and Environment ID directly from the URL (see Step 1 of this skill)
3. Updated both `powerapps-canvas` and `canvas-authoring` entries in `mcp-config.json`
4. Told the user to restart Copilot CLI

**Lesson learned:**
Never assume the config is correct. Always check it against the Studio URL at the start of every canvas session. If the user has worked on multiple apps across sessions, the config is almost certainly stale.

---

### Problem 2 — Accessibility fixes applied locally but not appearing in Studio

**What happened:**
After editing YAML files locally and running `canvas-authoring-sync_canvas` again, the changes were gone — the sync had overwritten the local files with the unchanged Studio version.

**Root cause:**
`sync_canvas` is PULL-ONLY. It always overwrites the local directory with whatever is currently in Studio. It does not push local edits. The correct push mechanism is `compile_canvas`.

**Fix:**
Use `powerapps-canvas-compile_canvas` to push. When it returns "Validation PASSED", the changes are committed to the Studio co-authoring session.

**Lesson learned:**
- `sync_canvas` = pull from Studio (always overwrites local)
- `compile_canvas` = validate + push to Studio (zero errors = committed)
- pull before every new edit request so manual Studio changes are preserved locally before the next compile
- Use `powerapps-canvas-compile_canvas`, NOT `canvas-authoring-compile_canvas` — the `canvas-authoring` variant returns "no active coauthoring session" even when Studio is open

---

### Problem 3 — Compile failed with "cmp_HeaderComplete CanvasComponent not found"

**What happened:**
`compile_canvas` failed because it couldn't resolve a `CanvasComponent` reference named `cmp_HeaderComplete`. This component is embedded in the app but its definition file is not returned by `sync_canvas`.

**Root cause:**
`sync_canvas` only returns screen-level YAML files (App.pa.yaml + one file per screen). Component definitions are stored separately in the app but are not included in the sync. The compile tool needs the component definition to resolve references, but it's not there.

**Fix:**
1. Export the solution containing the app:
   ```powershell
   pac solution export --name ODHRReporting --path "C:\temp\solution-export" --managed false
   ```
2. The exported solution contains a `.msapp` file — it's actually a ZIP. Extract it:
   ```powershell
   $msappPath = Get-ChildItem "C:\temp\solution-export" -Filter "*.msapp" -Recurse | Select-Object -First 1 -ExpandProperty FullName
   Expand-Archive $msappPath "C:\temp\solution-export\msapp-contents" -Force
   ```
3. Find the component definition inside the extracted msapp:
   ```
   msapp-contents\Src\Components\cmp_HeaderComplete.pa.yaml
   ```
4. Copy it to a `Components\` subfolder inside your sync directory:
   ```powershell
   New-Item "$syncDir\Components" -ItemType Directory -Force
   Copy-Item "C:\temp\solution-export\msapp-contents\Src\Components\cmp_HeaderComplete.pa.yaml" "$syncDir\Components\" -Force
   ```
5. Re-run `compile_canvas` — it will now resolve the component reference

**Important limitation:**
Changes made to the component file in `Components\` are used for compile resolution ONLY.
They are NOT pushed to Studio when compile passes. Only the 3-4 screen files are pushed.
To change a component's controls (e.g., fix `Rectangle1.AccessibleLabel` inside a component),
the user must edit the component manually in Studio's Component Editor.

**Lesson learned:**
- Always check if `sync_canvas` returns a `Components\` folder. If not, extract components from the `.msapp`
- `sync_canvas` wipes the `Components\` folder on every run — restore it before every `compile_canvas`
- `pac canvas unpack` may fail with PA3002 on some apps — use direct zip extraction instead

---

### Problem 4 — AccessibleLabel empty string `=""` still flagged as missing

**What happened:**
Several controls had `AccessibleLabel: =""` (an empty string formula) but the accessibility checker still reported them as "Missing accessible label".

**Root cause:**
Power Apps accessibility checker treats an empty string as equivalent to "no label". Even though the property exists, an empty value doesn't satisfy the requirement.

**Fix:**
Replace `=""` with a descriptive label. For decorative elements (dividers, separators):
```yaml
AccessibleLabel: ="Separator"
```
For functional elements, use a meaningful description:
```yaml
AccessibleLabel: ="Submit button"
AccessibleLabel: ="Navigation icon"
```

---

### Problem 5 — YAML indentation varies widely; simple regex fails

**What happened:**
A fix script using hard-coded 4-space indentation to find controls failed on deeply nested controls. Some controls are indented 24–40+ spaces deep depending on their container nesting.

**Root cause:**
Power Apps YAML indentation is NOT fixed. Each nesting level adds more spaces, and controls inside containers inside containers can be very deeply indented.

**Fix:**
Detect the actual indentation of each control dynamically by finding the line that starts the control block and measuring its leading spaces. Then derive the correct indentation for `Properties:` and property values relative to that:
```python
# Find the control name line and measure its indent
indent = len(line) - len(line.lstrip())
props_indent = " " * (indent + 4)   # Properties: is 4 spaces deeper
value_indent = " " * (indent + 6)   # Property values are 6 spaces deeper
```

**Controls that do NOT support AccessibleLabel** (adding it causes compile errors):
- `HtmlViewer`
- `ModernText`
- `Text` (classic label)
- `FluentV8/Label`
- The outer `CanvasComponent` wrapper of a component instance

---

*This skill is part of the [Power Platform Dashboard](https://github.com/KayodeAjayi200/power-platform-dashboard) project.*
