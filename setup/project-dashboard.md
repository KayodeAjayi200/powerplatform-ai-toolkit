# Local Project Dashboard

This dashboard is a local companion UI for Power Platform projects. It gives the user and agent a shared, visible project state:

- app/environment/MCP status
- data model and ERD
- screen plan
- design system
- Azure DevOps plan
- change requests
- audit log

It runs as a small localhost-only Node server and persists changes to JSON files inside `dashboard/state`.

---

## When to use

Use the dashboard when:

- the project has more than one screen, table, workflow, or backlog area
- the user wants a visual overview of what has been done
- the user wants to edit schema/screen/design decisions outside chat
- the agent needs durable project state across turns
- the app uses Dataverse/SharePoint schemas that benefit from an ERD

---

## Start the dashboard

From the repo root:

```powershell
node .\dashboard\server.js
```

Open:

```text
http://127.0.0.1:4817
```

Optional port override:

```powershell
$env:PORT = "4820"
node .\dashboard\server.js
```

The server binds to `127.0.0.1` only. It does not expose arbitrary file write endpoints.

---

## State files

The dashboard persists these files:

| File | Purpose |
|---|---|
| `dashboard/state/project-state.json` | Environment, solution, canvas app, MCP status, current project phase |
| `dashboard/state/data-model.json` | Data sources, entities, fields, relationships, ERD data |
| `dashboard/state/screen-plan.json` | Planned/built screens, purpose, controls, data sources |
| `dashboard/state/design-system.json` | Theme colours, layout policy, component notes |
| `dashboard/state/devops-plan.json` | ADO org/project, epics, features, stories, queries |
| `dashboard/state/change-requests.json` | User-requested changes from the browser |
| `dashboard/state/audit-log.json` | Recent dashboard and agent events |

Agents should read these files before making project changes and write them after completing project changes.

---

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/state` | Read all dashboard state |
| `GET` | `/api/state/{name}` | Read one state file |
| `POST` | `/api/state/{name}` | Replace one whitelisted state file |
| `POST` | `/api/events` | Append an audit event |

Valid `{name}` values:

```text
project-state
data-model
screen-plan
design-system
devops-plan
change-requests
audit-log
```

The server rejects unknown state names so the browser cannot write arbitrary paths.

---

## Agent workflow

At the start of a project:

1. Copy or keep the `dashboard/` folder in the project repo.
2. Start `node .\dashboard\server.js`.
3. Populate `dashboard/state/project-state.json` with environment, solution, app, and MCP details.
4. Populate `data-model.json` from Dataverse/SharePoint schemas.
5. Populate `screen-plan.json` from the confirmed screen plan.
6. Populate `design-system.json` from the user’s brand/design references.
7. Populate `devops-plan.json` from ADO Epics/Features/Stories/Queries.
8. Append an event to `audit-log.json`.

Before each additional app edit:

1. Read `change-requests.json`.
2. Read `project-state.json`, `data-model.json`, `screen-plan.json`, and `design-system.json`.
3. Run Canvas MCP `sync_canvas` to pull the live Studio app.
4. Apply the requested change.
5. Compile/push through Canvas MCP.
6. Update state files and audit log.
7. Mark completed change requests as `done` or add notes explaining blockers.

---

## Change request shape

Browser-created requests use this shape:

```json
{
  "id": "generated-id",
  "title": "Add manager review chart",
  "details": "Add a chart showing pending approvals by department.",
  "status": "new",
  "createdAt": "2026-05-03T10:00:00.000Z"
}
```

Agents should use these statuses:

| Status | Meaning |
|---|---|
| `new` | User created it and the agent has not started |
| `active` | Agent is working on it |
| `blocked` | Agent cannot complete without user input or missing access |
| `done` | Agent completed and verified it |

---

## Data model shape

Use this shape for ERD rendering:

```json
{
  "entities": [
    {
      "name": "Expense",
      "displayName": "Expense",
      "source": "Dataverse",
      "fields": [
        { "name": "ExpenseId", "type": "GUID", "required": true, "primary": true },
        { "name": "Title", "type": "Text", "required": true }
      ]
    }
  ],
  "relationships": [
    {
      "from": "Expense",
      "to": "ExpenseLineItem",
      "type": "one-to-many",
      "label": "has line items"
    }
  ]
}
```

Keep entity names aligned with actual Dataverse/SharePoint names. Do not invent schemas in the dashboard that have not been confirmed or created.

---

## Safety rules

- Keep the server bound to `127.0.0.1`.
- Do not add endpoints that accept arbitrary filesystem paths.
- Do not store secrets, PATs, tenant secrets, or service principal passwords in dashboard state.
- Log user-visible decisions and agent actions to `audit-log.json`.
- Treat dashboard state as planning/source-of-truth metadata, not as a replacement for live Dataverse or Canvas MCP verification.

---

## Future extensions

Good next additions:

- schema validation with JSON Schema files
- live polling or server-sent events for automatic UI refresh
- Mermaid export for ERD snapshots
- import from Dataverse MCP schema output
- export `change-requests.json` into Azure DevOps User Stories
- Canvas compile/sync history timeline
