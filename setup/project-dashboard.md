# Local Project Dashboard

This dashboard is a local companion UI for Power Platform projects. It gives the user and agent a shared, visible project state:

- app/environment/MCP status
- data model and ERD
- screen plan
- design system
- Azure DevOps plan
- change requests
- audit log

It runs as a small localhost-only Node server and persists changes to JSON files inside `dashboard/state`. It is a helper, not a hard requirement.

---

## When to use

Use the dashboard when:

- the project has more than one screen, table, workflow, or backlog area
- the user wants a visual overview of what has been done
- the user wants to edit schema/screen/design decisions outside chat
- the agent needs durable project state across turns
- the app uses Dataverse/SharePoint schemas that benefit from an ERD

If the user's environment blocks local servers, Node, ports, browser access to localhost, or file writes, continue with a fallback:

- edit `dashboard/state/*.json` directly
- keep equivalent project state in Markdown
- use chat-confirmed state and update it in the next available file-backed workspace
- export snapshots from the real source systems instead of relying on dashboard persistence

Do not stop the project just because the dashboard cannot run.

---

## Start the dashboard

When the user says **"open dashboard"**, **"show dashboard"**, or **"start dashboard"**, the agent should launch the dashboard automatically and open the browser when possible.

From the repo root, prefer:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\open-dashboard.ps1
```

This script:

- finds the repo/project root from the current directory
- starts the dashboard server only if it is not already responding
- opens the browser to the dashboard URL
- prints the URL for the user

If the script is unavailable or blocked, fall back to:

```powershell
node .\dashboard\server.js
```

Then open:

```text
http://127.0.0.1:4817
```

Optional port override:

```powershell
$env:PORT = "4820"
node .\dashboard\server.js
```

The server binds to `127.0.0.1` only. It does not expose arbitrary file write endpoints.

If this command fails, capture the error, explain the limitation, and use the state files or Markdown fallback instead.

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

Agents should read these files before making project changes when they are available and write them after completing project changes. If they are unavailable, use the best available project-state record and tell the user where that state is being kept.

---

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/state` | Read all dashboard state |
| `GET` | `/api/state/{name}` | Read one state file |
| `POST` | `/api/state/{name}` | Replace one whitelisted state file |
| `POST` | `/api/events` | Append an audit event |
| `GET` | `/api/devops/status` | Check Git/Azure DevOps tool and repo status |
| `POST` | `/api/devops/setup-repo` | Configure an Azure Repos remote for the project repo |
| `POST` | `/api/devops/commit` | Commit, and optionally push, the current local project state |

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

The DevOps endpoints only run fixed `git` and `az` commands from the project root. They do not accept arbitrary command text or arbitrary filesystem paths.

---

## No-code DevOps repo actions

The **DevOps** tab can be used without an AI agent once the dashboard server is running.

Supported actions:

- **Check Status** — shows whether the project root is a Git repo, current branch, remotes, changed files, and whether Azure CLI/DevOps extension are available.
- **Set Up Repo** — uses Organisation URL, Project, Repo name, Remote name, Branch, and optional Remote URL to configure a Git remote.
- **Commit** — saves dashboard state, stages local files, and creates a Git commit.
- **Commit + Push** — commits and pushes to the configured Azure Repos remote.

Important limitation:

The dashboard commits the current local files. If the latest Power Apps solution state only exists in Power Apps Studio or Dataverse, export/sync the solution into the repo first, then commit from the dashboard.

If Azure CLI cannot create the repo, create it manually in Azure DevOps, paste the remote URL into the dashboard, and click **Set Up Repo**.

---

## Agent workflow

At the start of a project, when the local dashboard is available:

1. Copy or keep the `dashboard/` folder in the project repo.
2. Start `powershell -ExecutionPolicy Bypass -File .\setup\scripts\open-dashboard.ps1`, or fall back to `node .\dashboard\server.js`.
3. Populate `dashboard/state/project-state.json` with environment, solution, app, and MCP details.
4. Populate `data-model.json` from Dataverse/SharePoint schemas.
5. Populate `screen-plan.json` from the confirmed screen plan.
6. Populate `design-system.json` from the user’s brand/design references.
7. Populate `devops-plan.json` from ADO Epics/Features/Stories/Queries.
8. Append an event to `audit-log.json`.

Before each additional app edit, when dashboard state is available:

1. Read `change-requests.json`.
2. Read `project-state.json`, `data-model.json`, `screen-plan.json`, and `design-system.json`.
3. Run Canvas MCP `sync_canvas` to pull the live Studio app when Canvas MCP is available.
4. Apply the requested change.
5. Compile/push through Canvas MCP when available, or provide the best fallback implementation path.
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
