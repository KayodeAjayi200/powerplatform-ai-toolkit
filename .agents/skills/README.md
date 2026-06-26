# Agent Skills — `.agents/skills/`

This folder contains reusable agent skills in the standard `SKILL.md` bundle format.

These skills are **cross-agent compatible** and are loaded automatically by:
- **Codex** (from `.agents/skills/` in the repo)
- **GitHub Copilot** (from `.agents/skills/` or `.github/skills/`)
- **Claude Code** (copy to `.claude/skills/` for project scope)
- **Windsurf Cascade** (from `.agents/skills/` or `.windsurf/skills/`)

Each skill uses [YAML frontmatter](../setup/agent-skills-clients.md) with a `name` and `description` that triggers the skill automatically when relevant tasks are requested.

---

## Installing with GitHub CLI

```bash
# Preview a skill before installing
gh skill preview KayodeAjayi200/powerplatform-ai-toolkit <skill-name>

# Install individual skills
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-app
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-design
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-accessibility
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-yaml
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-canvas-image-visuals
gh skill install KayodeAjayi200/powerplatform-ai-toolkit canvas-authoring-mcp
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-sharepoint-list-design
gh skill install KayodeAjayi200/powerplatform-ai-toolkit powerapps-delegation
gh skill install KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-agent-clone
gh skill install KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-child-agent-tools
gh skill install KayodeAjayi200/powerplatform-ai-toolkit dataverse-solution-publisher

# Update all installed skills at once
gh skill update --all
```

---

## Canvas App & Power Platform skills

| Skill | Use it when... |
|---|---|
| [powerapps-canvas-app](./powerapps-canvas-app/SKILL.md) | Building canvas app controls, Power Fx formulas, galleries, forms, collections, or navigation |
| [powerapps-canvas-design](./powerapps-canvas-design/SKILL.md) | Designing screens — containers, Fluent UI controls, responsive layouts, gallery designs, filter panels |
| [powerapps-canvas-accessibility](./powerapps-canvas-accessibility/SKILL.md) | Making canvas apps WCAG 2.1 AA compliant — screen readers, keyboard navigation, accessible labelling |
| [powerapps-canvas-yaml](./powerapps-canvas-yaml/SKILL.md) | Generating or validating `.pa.yaml` source files — schema, formula syntax, indentation, compile failures |
| [powerapps-canvas-image-visuals](./powerapps-canvas-image-visuals/SKILL.md) | Creating charts, SVG visuals, KPI graphics, or sparklines using Image controls and QuickChart.io |
| [canvas-authoring-mcp](./canvas-authoring-mcp/SKILL.md) | Connecting to and editing a live canvas app via the Canvas Authoring MCP server |
| [powerapps-sharepoint-list-design](./powerapps-sharepoint-list-design/SKILL.md) | Planning or creating SharePoint lists with clean internal names for use as Power Apps data sources |
| [powerapps-delegation](./powerapps-delegation/SKILL.md) | Fixing delegation warnings — safe filtering of large Dataverse, SharePoint, or SQL data sources |

## Copilot Studio & Dataverse skills

| Skill | Use it when... |
|---|---|
| [copilot-studio-agent-clone](./copilot-studio-agent-clone/SKILL.md) | Cloning or repairing a Copilot Studio agent from a maker URL — sets up Dataverse MCP tools, adds components to a solution, publishes, and verifies |
| [copilot-studio-child-agent-tools](./copilot-studio-child-agent-tools/SKILL.md) | Adding Dataverse MCP Server actions to child agents, fixing connection-reference errors, or creating brand-new child agents |
| [dataverse-solution-publisher](./dataverse-solution-publisher/SKILL.md) | Ensuring Dataverse/Power Platform solution components use the correct publisher prefix (e.g. `tm_`) instead of the environment default |

---

## Adding a skill to other clients

**Claude Code** (project scope):
```bash
mkdir -p .claude/skills
cp -r .agents/skills/powerapps-canvas-app .claude/skills/
# repeat for other skills you want
```

**Windsurf** (if `.agents/skills` is not auto-detected):
```bash
mkdir -p .windsurf/skills
cp -r .agents/skills/powerapps-canvas-app .windsurf/skills/
```

**Cursor:** Convert the skill content into a `.cursor/rules/*.mdc` file with a matching description and file glob.

See [setup/agent-skills-clients.md](../setup/agent-skills-clients.md) for full per-client guidance.
