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
gh skill preview KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-agent-clone

# Install a skill to your user scope
gh skill install KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-agent-clone
gh skill install KayodeAjayi200/powerplatform-ai-toolkit copilot-studio-child-agent-tools
gh skill install KayodeAjayi200/powerplatform-ai-toolkit dataverse-solution-publisher

# Update all installed skills
gh skill update --all
```

---

## Skills in this folder

| Skill | Use it when... |
|---|---|
| [copilot-studio-agent-clone](./copilot-studio-agent-clone/SKILL.md) | Cloning or repairing a Copilot Studio agent from a maker URL — sets up Dataverse MCP tools, adds components to a solution, publishes, and verifies |
| [copilot-studio-child-agent-tools](./copilot-studio-child-agent-tools/SKILL.md) | Adding Dataverse MCP Server actions to child agents, fixing connection-reference errors, or creating brand-new child agents |
| [dataverse-solution-publisher](./dataverse-solution-publisher/SKILL.md) | Ensuring Dataverse/Power Platform solution components use the correct publisher prefix (e.g. `tm_`) instead of the environment default |

---

## Adding a skill to other clients

**Claude Code:**
```bash
mkdir -p .claude/skills
cp -r .agents/skills/copilot-studio-agent-clone .claude/skills/
```

**Windsurf (if `.agents/skills` is not auto-detected):**
```bash
mkdir -p .windsurf/skills
cp -r .agents/skills/copilot-studio-agent-clone .windsurf/skills/
```

**Cursor:** Convert skill content to a `.cursor/rules/*.mdc` file.

See [setup/agent-skills-clients.md](../setup/agent-skills-clients.md) for full per-client guidance.
