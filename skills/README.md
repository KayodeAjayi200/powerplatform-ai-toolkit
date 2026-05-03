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
| [canvas-yaml.md](./canvas-yaml.md) | Generating valid `.pa.yaml` files — schema shape, formula value rules, indentation, preflight checks, compile failures |
| [canvas-accessibility.md](./canvas-accessibility.md) | Making canvas apps WCAG 2.1 AA compliant — screen readers, keyboard navigation, accessible labelling |
| [canvas-authoring-mcp.md](./canvas-authoring-mcp.md) | Editing a live canvas app via MCP — how to connect, sync, edit, and compile YAML |
| [delegation.md](./delegation.md) | Fixing delegation warnings — filtering large SharePoint lists, Dataverse tables, or SQL tables correctly |
