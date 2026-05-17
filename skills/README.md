# Agent Skills

These files give your AI agent deep domain knowledge for Power Platform development.

Drop this folder into your agent's context (via the filesystem MCP path) and reference the relevant skill before starting a task.

---

## How to use a skill

Tell your agent which skill file to read before starting a task. Example instruction in your project's copilot instructions file:

```
Before working on any Power Apps canvas task, read:
C:\Repositories\powerplatform-ai-toolkit\skills\canvas-app.md

Before working on canvas app UI/UX design, read:
C:\Repositories\powerplatform-ai-toolkit\skills\canvas-design.md
```

Or reference them inline in your prompt:

> "Read skills/canvas-accessibility.md and then fix all accessibility issues in my app."

---

## Skills in this folder

| File | Use it when... |
|---|---|
| [canvas-app.md](./canvas-app.md) | Building canvas app controls, writing Power Fx formulas, working with galleries, forms, or collections |
| [canvas-design.md](./canvas-design.md) | Designing canvas app screens — containers, Fluent UI controls, responsive layouts, navigation patterns |
| [canvas-image-visuals.md](./canvas-image-visuals.md) | Creating beautiful charts and SVG visuals with Power Apps Image controls, QuickChart.io, and encoded SVG data URIs |
| [canvas-yaml.md](./canvas-yaml.md) | Generating valid `.pa.yaml` files — schema shape, formula value rules, indentation, preflight checks, compile failures |
| [canvas-accessibility.md](./canvas-accessibility.md) | Making canvas apps WCAG 2.1 AA compliant — screen readers, keyboard navigation, accessible labelling |
| [canvas-authoring-mcp.md](./canvas-authoring-mcp.md) | Editing a live canvas app via MCP — how to connect, sync, edit, and compile YAML |
| [sharepoint-list-design.md](./sharepoint-list-design.md) | Designing SharePoint lists for Power Apps — safe internal names, optional columns, Title column policy, draft-friendly saves |
| [delegation.md](./delegation.md) | Fixing delegation warnings — filtering large SharePoint lists, Dataverse tables, or SQL tables correctly |

---

## Setup guides (in `/setup/`)

Setup guides cover environment provisioning tasks that run *before* the Canvas App is built.

| File | Use it when... |
|---|---|
| [setup/provision.md](../setup/provision.md) | Creating a Power Platform environment, solution, or blank canvas app |
| [setup/sharepoint.md](../setup/sharepoint.md) | Creating SharePoint site and lists with correct internal names |
| [setup/environment-variables.md](../setup/environment-variables.md) | Creating Dataverse environment variables — Text, DataSource (SharePoint site + list), setting Export=No, and the RemoveSolutionComponent API quirk |
| [setup/devops.md](../setup/devops.md) | Setting up Azure DevOps project hierarchy (Epics → Features → Stories → Tasks) |
| [setup/cli-auth.md](../setup/cli-auth.md) | Authenticating pac, m365, az CLIs for Power Platform automation |
