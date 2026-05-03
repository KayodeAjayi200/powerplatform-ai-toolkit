# New App — End-to-End Workflow

This file gives the AI agent detailed guidance for building a new Power Apps canvas app from scratch.  
It expands on the high-level phases in `AGENT.md` with more detail on decision-making.

---

## Step 1 — Understand the app

Ask the user to describe:
- **What problem** the app solves
- **Who uses it** — roles, technical level, device (phone/tablet/desktop)
- **What actions** users perform (view data, submit records, approve requests, etc.)
- **Roughly how many records** the app will manage over time

Document the answers. You will use them to make datasource and design decisions.

---

## Step 1.5 — Start the local project dashboard

For any app with more than one screen, table, workflow, or backlog area, start the dashboard early:

```powershell
node .\dashboard\server.js
```

Open:

```text
http://127.0.0.1:4817
```

Use `setup/project-dashboard.md` as the operating guide. The dashboard is the shared visible state between the user and agent, not a replacement for Dataverse, Azure DevOps, GitHub, or Canvas MCP verification.

Initialise or update these files as soon as the related information exists:

- `dashboard/state/project-state.json` for environment, solution, app, Studio URL, MCP status, and phase
- `dashboard/state/data-model.json` for entities, fields, and relationships
- `dashboard/state/screen-plan.json` for screens, purpose, status, data sources, and controls
- `dashboard/state/design-system.json` for palette, typography notes, layout policy, and component rules
- `dashboard/state/devops-plan.json` for Epics, Features, Stories, Story Points, and queries
- `dashboard/state/change-requests.json` for user requests made from the dashboard
- `dashboard/state/audit-log.json` for important agent actions

Before every later edit, read dashboard state and open change requests first. After every meaningful change, update the state and audit log so the browser stays truthful.

---

## Step 2 — Identify data needs

From the description, identify every distinct **entity** the app needs to track.

For example, for a "Project Tracker" app:
- Projects (id, name, status, due date, owner)
- Tasks (id, project, description, assigned to, completed)
- Team members (id, name, email, role)

For each entity, list:
- Key columns and their types (Text, Number, Date, Choice, Lookup, etc.)
- Whether it relates to another entity (one-to-many, many-to-many)
- Approximate volume (hundreds? thousands? millions?)

---

## Step 3 — Choose datasources

Read `setup/datasource-mcps.md` and apply the decision guide.

Present the plan:

```
Based on what you've described, here's what I plan to create:

  📊 Dataverse (recommended for this app):
     - Table: Project — stores project name, status, due date, owner
     - Table: Task — linked to Project; stores description, assignee, completion flag

  Everything will be in your [Environment Name] Power Platform environment.

Does this look right?
```

Wait for user confirmation before proceeding.

---

## Step 4 — Create data sources

Execute the creation commands from `setup/datasource-mcps.md` for the confirmed datasource type.

After creating each table or list:
- Confirm it exists by listing tables (`pac dataverse table list` for Dataverse)
- Note the exact table/list name — you'll need it when writing Power Fx formulas
- Update `dashboard/state/data-model.json` if the local dashboard is present

---

## Step 5 — Plan screens

Design the screen architecture before opening Power Apps Studio.

**Common patterns:**

| App type | Typical screens |
|---|---|
| List + detail | Home/list, Detail view, Edit/create form |
| Approval workflow | My items, Pending approvals, Submit form, History |
| Dashboard | Summary dashboard, Drill-down list, Detail |
| Multi-step form | Step 1, Step 2, Step 3, Review + Submit, Confirmation |
| Field worker | My assignments, Job detail, Capture data/photo, Submit |

**Every screen must follow the container rules from `skills/canvas-design.md`:**
- Root: vertical container fills the screen
- Header: horizontal container with a deliberate fixed height only when it is app chrome
- Body: vertical container with `FlexibleHeight = true` and `FillPortions = 1`
- Navigation: left vertical panel (tablet) or bottom horizontal bar (phone)
- Main/side columns: use `FlexibleWidth = true`, `FillPortions`, and `AlignInContainer.Stretch` instead of `Width = Parent.Width * ...`
- Minimum sizes: add `MinimumWidth` or `MinimumHeight` only when real content clips below a known threshold, and use the smallest viable value
- Avoid fixed `Width`, `Height`, `X`, and `Y` for layout. Use them only for small fixed UI atoms such as icons, avatars, separators, and row heights.

If the local dashboard is present, update `dashboard/state/screen-plan.json` with the confirmed screen list before connecting to Canvas MCP.

---

## Step 6 — Get design references

Ask the user:

> "Do you have any of the following?
> - Brand colours (hex codes) or a brand guide
> - A company logo (PNG or SVG)
> - Screenshots of apps you'd like yours to look like
> - A style preference: clean/minimal, bold/dark, colourful, corporate
>
> Paste or describe anything you have. If nothing specific, I'll use Microsoft Fluent design."

Map their answer to a colour palette. For Fluent default:
- Primary action: `#0078D4` (Microsoft Blue)
- Background: `#F3F2F1`
- Surface/card: `#FFFFFF`
- Text: `#201F1E`
- Subtle text: `#605E5C`
- Destructive: `#D13438`

If the local dashboard is present, update `dashboard/state/design-system.json` with the confirmed theme, layout policy, and any component notes.

---

## Step 7 — Connect to Canvas Authoring MCP

Follow `skills/canvas-authoring-mcp.md` to:

1. Ask user to open/create the app in Power Apps Studio
2. Extract App ID and Environment ID from the Studio URL
3. Update the MCP config with those IDs
4. Sync the current state of the app

Official reference: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/canvas-app-mcp-server

---

## Step 8 — Build each screen

Build one screen at a time:

1. **Read dashboard state first** if `dashboard/state/` exists, especially `change-requests.json`
2. **Pull Studio first** with `powerapps-canvas-sync_canvas` before every new edit request, even when local YAML already exists
3. **Write valid YAML** using `skills/canvas-yaml.md` and a freshly synced screen/control as the structural template
4. **Follow the app/design rules** in `skills/canvas-app.md` and `skills/canvas-design.md`
5. **Connect data** — reference the tables/lists created in Step 4
6. **Run YAML preflight** — check top-level keys, `Children` structure, required `Control`, formula `=` prefixes, data source names, and component references before compiling
7. **Compile** after each screen to catch errors early
8. **Update dashboard state** after each meaningful compile/push, including screen status and audit events
9. **Move to the next screen** only when the current one compiles cleanly

Treat Studio as the source of truth at the start of each edit cycle. If the user manually changes the app between agent turns, the next sync must pull those changes before the agent edits or compiles anything.

If a dashboard change request is being handled, set it to `active` while editing. Set it to `done` only after compile/push succeeds; otherwise set it to `blocked` and add a note explaining what is missing.

### Accessibility (mandatory)

Before finishing each screen, apply the rules from `skills/canvas-accessibility.md`:
- Every interactive control has `AccessibleLabel` set
- Every image has a descriptive `AccessibleLabel`
- Tab order (`TabIndex`) follows a logical left-to-right, top-to-bottom sequence
- Form fields have a visible label associated with them
- Error messages are surfaced via accessible text, not just colour

### Charts and SVG visuals

Before adding dashboard charts, KPI visuals, icons, badges, sparklines, or custom SVG graphics, read `skills/canvas-image-visuals.md`.

Use:
- QuickChart.io URLs in Image controls for polished bar, line, doughnut, ranking, and sparkline charts
- Inline SVG data URIs for icons, badges, progress rings, dividers, and lightweight custom visuals
- `EncodeUrl(...)` for every inline SVG and every QuickChart chart config
- `ImagePosition.Fit`, `AlignInContainer.Stretch`, and container layout for chart Image controls
- `AccessibleLabel` plus nearby visible summary text for meaningful charts

### Delegation (check before writing filters)

Before writing any `Filter()` or `Search()` formula, check `skills/delegation.md`:
- Confirm the datasource and column type support delegation
- Never increase the app's data row limit as a workaround
- If the column doesn't support delegation, restructure the query

---

## Step 9 — Test and hand off

Before handing off:
1. Preview the app in Studio (F5) and verify each screen loads
2. Test submitting a record and verify it appears in the data source
3. Test navigation between all screens
4. Check the app on the target device form factor (phone vs tablet)

Hand off checklist to give the user:

- [ ] App is published (File → Save → Publish)
- [ ] Data sources connected and working
- [ ] App shared with intended users (Apps → `⋯` → Share)
- [ ] User knows how to access it (browser URL or Power Apps mobile app)

Sharing reference: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/share-app  
Power Apps mobile: https://learn.microsoft.com/en-us/power-apps/mobile/run-powerapps-on-mobile
