# New App Project Kickoff Workflow

Use this workflow at the **very start** of every new Power Apps project. It ensures all configuration is in place before any app code is written, and captures the right context upfront.

---

## Step 1 — Gather Project Context (ask the user these questions)

Ask the user for the following. You can ask all at once in a structured message:

```
To start your Power Apps project efficiently, I need a few details upfront:

1. **App name** — What will this app be called?
2. **Purpose** — In one sentence, what does the app do?
3. **Data source** — Where will the data live? (SharePoint / Dataverse / SQL / Excel / other)
   - If SharePoint: what's the site URL?
   - If Dataverse: which environment?
4. **Screens** — What screens do you need? (e.g. List screen, Detail/form screen, Dashboard)
5. **Users** — Who will use this? Mobile only, desktop only, or both?
6. **Azure DevOps** — Do you want ADO work item tracking?
   - If yes: org URL + project name (I'll create epics and stories)
7. **Existing app** — Is there an existing app I should connect to, or should I create a new one in Studio?
8. **Design reference** — Do you have a reference image, mockup, or style description?
   - Paste an image, share a URL, or describe the aesthetic (e.g. `dark sidebar, teal accent, rounded corners`)
   - If nothing, I will use Microsoft Fluent defaults
```

---

## Step 2 — Run Configuration Status Check

Before writing any code, run through `setup/config-status.md` and report results to the user. Resolve all ❌ items before proceeding.

Key checks:
- Canvas Authoring MCP connected to the correct app
- Data source available and schema retrieved
- ADO PAT stored (if tracking requested)
- Live YAML synced to local folder

---

## Step 3 — Read These Skills Before Designing

| Skill | When to read |
|---|---|
| `skills/canvas-yaml.md` | Before writing any `.pa.yaml` — covers YAML gotchas, preflight checklist |
| `skills/canvas-app.md` | Before designing controls — covers layout rules, control quirks, confirmed gotchas |
| `skills/powerapps-delegation.md` | Before writing any `Filter()`, `Search()`, or `Sort()` — covers delegation limits per data source |
| `skills/canvas-design.md` (if present) | For responsive layout, container patterns, colour palettes |
| `mcp-tools/azure-devops.md` | If ADO tracking is requested — prefer ADO MCP over REST API |

---

## Step 3.5 — Extract Design Direction from Reference Image

If the user provided a reference image, URL, or style description, **do this before generating any YAML**.

### What to extract

**Colours**

| What to look for | `App.pa.yaml` Formulas constant |
|---|---|
| Primary / brand colour | `ColorPrimary` |
| Accent / highlight colour | `ColorAccent` |
| Background colour | `ColorBackground` |
| Card / surface colour | `ColorSurface` |
| Text colour (primary) | `ColorText` |
| Text colour (secondary / muted) | `ColorTextSubtle` |
| Disabled / placeholder text | `ColorTextDisabled` |
| Border / divider colour | `ColorBorder` |
| Success / warning / error colours | `ColorSuccess`, `ColorWarning`, `ColorError` |

**Typography**

| What to look for | What to produce |
|---|---|
| Font family | Note the font; Power Apps supports system fonts, custom via HTML text |
| Heading hierarchy (how many levels, size ratio) | `FontSizeH1`, `FontSizeH2`, `FontSizeBody`, `FontSizeSmall`, `FontSizeCaption` |
| Font weights per level | Note per level — headings bold, body regular, captions light |
| Text colour per hierarchy level | Map to `ColorText` or `ColorTextSubtle` |
| Text alignment (left / centre / mixed) | Default alignment for labels, titles, body |

**Icons**

| What to look for | What to produce |
|---|---|
| Icon style (filled / outlined / rounded / sharp) | Note in design-system.json; source from Fluent Icons or SVG |
| Icon size relative to adjacent text | `IconSizeSmall`, `IconSizeMedium`, `IconSizeLarge` constants |
| Icon colour usage | Default icon colour token |
| Icon + label pattern (left of text / icon-only / stacked) | Gallery and button layout choice |

**Layout and Placement**

| What to look for | What to produce |
|---|---|
| Navigation position (top / left / bottom) | Screen architecture decision |
| Card / list layout (rows / grid / table) | Gallery template choice |
| Content alignment within cards | Container `LayoutAlignItems` setting |
| Label placement (above input / inline / floating) | Form layout pattern |
| Visual hierarchy: what draws the eye first / second / third | Drives control sizing and weight in YAML |
| Spacing density (compact / comfortable / spacious) | `SpacingSmall`, `SpacingMedium`, `SpacingLarge`, `SpacingXL` |
| Padding inside cards / containers | Container `PaddingTop/Bottom/Left/Right` values |

**Controls and Components**

| What to look for | What to produce |
|---|---|
| Button style (filled / outlined / ghost / text-only) | Button variant + fill/border state properties |
| Input field style (bordered / underline / filled background) | Classic Text Input styling choices |
| Status indicators (badges / chips / pills / colour dots) | Badge control or SVG/rectangle overlay |
| Avatar / image usage (circular / square, size relative to row) | Image control + `BorderRadius` |
| Corner radius (sharp / soft / pill) | `RadiusSmall`, `RadiusMedium`, `RadiusLarge` constants |
| Shadow / elevation (flat / subtle / raised) | `DropShadow.None` / `.Light` / `.Regular` |

### Rules

**If the image is the requirement (not just a style reference)**

A user may provide a screenshot, mockup, or wireframe as their entire spec. Extract both functional content and design from the same image.

| Content / function to extract | What to produce |
|---|---|
| Screens visible or implied | App screen list |
| Navigation between screens | `Navigate()`, back buttons, tab bars |
| Data fields (labels, inputs, list columns) | SharePoint columns / Dataverse fields |
| Field types (text, date, person, status, number) | Column types in data model |
| Status / category values (e.g. To Do, In Progress, Done) | Choice column options |
| Actions (add, edit, delete, filter, sort, share) | Button `OnSelect` logic |
| Filters or search | `Filter()` / `Search()` formula requirements |
| Exact text, labels, placeholder copy | Use verbatim in controls |

**Read the image back to the user and confirm before building anything:**
> _`I can see: 2 screens, fields: Title, Due Date, Priority (High/Medium/Low), Status. Actions: Add, Edit, Delete, filter by Status. Correct?`_

Do not proceed until confirmed — a wrong read cascades into every screen, data model, and formula.

---

### Design extraction rules

1. Add all extracted constants to `App.pa.yaml` Formulas — never inline `RGBA()` or raw hex in screen files
2. State design extraction before generating YAML, e.g.: _`primary #1B2A4A, accent #4FC3F7, surface #F5F7FA, radius=8, left nav`_
3. If multiple references provided — merge and call out any conflicts
4. No reference provided — confirm before defaulting: _`No design reference. I'll use Fluent defaults (neutral grey, blue accent, 4px radius). OK?`_

### Re-consult the image only when necessary — not at every step

Only go back to the image when:

- You are unsure how a specific control, card, or layout should look
- The user asks `does this look right?` — compare the screenshot against the reference
- Something in your YAML feels inconsistent with what you extracted

> Do not keep the image in context continuously. Load it on demand to avoid unnecessary token use.

---

## Step 4 — Design the Data Model

Before generating any YAML:

1. List all entities/tables needed
2. For each table: columns, types, constraints, choice values
3. Confirm delegation-safe columns (indexed columns for SharePoint; filterable columns for Dataverse)
4. Read `skills/powerapps-delegation.md` → confirm `Filter()` predicates will delegate

SharePoint list design checklist:
- `Title` column exists (default)
- Choice columns have all values defined before app is built
- Date columns use `Date` type (not `DateTime`) unless time is needed
- Person columns use `Person or Group` type

---

## Step 5 — Create ADO Work Items (if tracking requested)

Use the ADO MCP (`mcp-tools/azure-devops.md`) or REST API to create:

```
Epic: <App Name>
  ├── Story: Data and Infrastructure (SharePoint list / Dataverse table)
  ├── Story: <Screen 1 name> Screen
  ├── Story: <Screen 2 name> Screen
  ├── Story: Accessibility and Quality
  ├── Story: End-to-end Testing and Sign-off
```

Mark each story `Active` as you begin it. Mark `Closed` when done. Add comments at key milestones.

**Update ADO on every significant change.** Do not batch updates to end-of-session.

---

## Step 6 — Generate the App

1. Call `generate-canvas-app` skill — provide screen plan, data source, palette preference, and mobile/desktop targets
2. Wait for plan approval before generating YAML
3. After YAML is generated, compile with `compile_canvas`
4. Fix only reported errors; recompile until clean

---

## Step 7 — Connect Data Source

Follow `skills/add-data-source` to connect the data source in Studio. Verify with `list_data_sources` before writing any formula that references it.

---

## Step 8 — Validate and Test

1. Run `get_accessibility_errors` — fix all issues
2. Run `get_appchecker_errors` — fix performance and quality issues
3. Test on target screen sizes (mobile + desktop if both are in scope)
4. Update ADO: mark Accessibility story Closed, comment on Testing story

---

## Kickoff Prompt Template (for users)

Copy and paste this when starting a new project with Copilot:

```
I want to build a Power Apps canvas app.

App name: <name>
Purpose: <one sentence>
Data source: <SharePoint site URL / Dataverse environment / SQL server>
Screens: <list>
Target devices: <mobile / desktop / both>
Azure DevOps: <yes — org: https://dev.azure.com/YOUR_ORG, project: PROJECT_NAME / no>
Existing app ID: <GUID if connecting to existing app, or "create new">
Reference image: <paste an image / URL / style description — or leave blank for Fluent defaults>

Please start with the configuration status check, then gather any missing information before designing anything.
```

---

## Common Mistakes to Avoid at Kickoff

| Mistake | Consequence | Prevention |
|---|---|---|
| Starting YAML before MCP is connected | All edits fail; must restart | Run config-status check first |
| Writing `Filter()` before checking delegation | Silent data loss at >500/2000 rows | Read delegation skill first |
| Not syncing YAML before first edit | Overwrite Studio changes | Always `sync_canvas` before any edit |
| Using inline `RGBA()` in screen files | `YamlInvalidSyntax` compile error | Define colour constants in App.pa.yaml |
| Not reading canvas-yaml.md gotchas | Repeated compile failures | Read it at kickoff, keep it open |
| Skipping ADO setup | No tracking, user has to catch up later | Set up ADO in Step 5, update continuously |
| Not starting the dashboard | Missing live progress visibility | Start dashboard in Step 2 config check |
| Skipping design reference | Generic styling; rework after first demo | Ask Q8 in Step 1, extract in Step 3.5 before YAML |
| Extracting colours only | Palette matches but spacing and corners feel wrong | Extract all token types: colour + radius + spacing + nav + shadow |
