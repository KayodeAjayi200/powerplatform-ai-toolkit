# Agent Skills Setup Across Coding Tools

This guide tells agents where to install reusable skills or skill-equivalent instructions for each coding tool.

Primary rule: detect the active client before adding skills. Do not assume every tool reads the same folder. Some clients support `SKILL.md` bundles directly; others use rules or `AGENTS.md` instead.

---

## Cross-client skills policy

For every skills setup task:

1. Identify the active client: Codex, GitHub Copilot/VS Code, Claude Code, Windsurf, Cursor, or Zed.
2. Prefer project-scoped skills for team workflows and user-scoped skills for private preferences.
3. Use the open Agent Skills shape where supported: `<skill-name>/SKILL.md` with YAML frontmatter.
4. Keep each skill focused on one job and write a specific `description` that includes trigger words.
5. Inspect third-party skills before installing them, especially if they contain scripts.
6. Do not commit secrets, tokens, tenant IDs, or environment-specific credentials inside skills.
7. Reload or restart the client after adding skills if the client does not auto-detect changes.
8. Verify the skill is discoverable before relying on it in an app build.

---

## Client matrix

| Client | Native skill support | Project location | User/global location | Verify/reload |
|---|---|---|---|---|
| Codex | Yes | `.agents/skills/` from CWD up to repo root | `~/.agents/skills` | `/skills`, `$skill-name`, restart if missing |
| GitHub Copilot / VS Code | Yes | `.github/skills`, `.claude/skills`, or `.agents/skills` | `~/.copilot/skills` or `~/.agents/skills` | `/skills list`, `/skills reload`, `/skills info` |
| Claude Code | Yes | `.claude/skills` | `~/.claude/skills` | Ask “List all available Skills”; restart if missing |
| Windsurf Cascade | Yes | `.windsurf/skills`, also compatible with `.agents/skills` | `~/.codeium/windsurf/skills`, also `~/.agents/skills` | Skills UI or `@skill-name` |
| Cursor | No direct Agent Skills equivalent documented | `.cursor/rules` or `AGENTS.md` | Cursor Settings > Rules | Rule visibility in settings; test prompt |
| Zed | No direct Agent Skills equivalent documented | `.rules`, `AGENTS.md`, or compatible instruction files | Rules Library | Agent Panel Rules Library; `@rule` |

---

## Skill folder format

Use this structure for clients that support Agent Skills:

```text
skills-root/
  powerapps-canvas-authoring/
    SKILL.md
    scripts/
    references/
    assets/
```

Minimum `SKILL.md`:

```markdown
---
name: powerapps-canvas-authoring
description: Use when creating, editing, validating, or troubleshooting Microsoft Power Apps Canvas apps with Canvas Authoring MCP, Power Fx, responsive containers, accessibility labels, Dataverse data sources, or compile/sync workflows.
---

Follow these instructions when the task involves Power Apps Canvas authoring...
```

Good descriptions are operational. Include what the skill does, when to use it, and clear trigger terms. Avoid vague descriptions such as “Power Apps help”.

---

## Codex

Codex supports skills in the CLI, IDE extension, and app. Skills use progressive disclosure: Codex initially sees the skill name, description, and path, then reads the full `SKILL.md` only when selected.

Locations:

| Scope | Location |
|---|---|
| Repo | `.agents/skills` in the current directory, parent directories, or repo root |
| User | `~/.agents/skills` |
| Admin | `/etc/codex/skills` |
| System | Bundled with Codex |

Codex-specific notes:

- Use `$skill-creator` to create a skill interactively.
- Use `$skill-installer <skill>` for curated local skills.
- Use `$skill-name` or `/skills` for explicit invocation in CLI/IDE.
- Add `agents/openai.yaml` only for Codex-specific metadata such as UI appearance, invocation policy, or MCP dependencies.
- Set `allow_implicit_invocation: false` in `agents/openai.yaml` when a skill should only run by explicit mention.
- Disable a skill with `[[skills.config]]` in `~/.codex/config.toml` instead of deleting it.

Source: https://developers.openai.com/codex/skills

---

## GitHub Copilot / VS Code

GitHub Copilot agent skills work with Copilot cloud agent, Copilot CLI, and agent mode in VS Code.

Locations:

| Scope | Location |
|---|---|
| Project | `.github/skills`, `.claude/skills`, or `.agents/skills` |
| User | `~/.copilot/skills` or `~/.agents/skills` |

CLI commands:

```text
/skills list
/skills reload
/skills info SKILL-NAME
/skills add
```

GitHub CLI can install and manage skills:

```powershell
gh skill search TOPIC
gh skill preview OWNER/REPOSITORY SKILL
gh skill install OWNER/REPOSITORY SKILL
gh skill update --all
```

Security rule: always preview third-party skills before installing them. Skills may include scripts or hidden instructions.

Sources:
- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- https://docs.github.com/copilot/how-tos/copilot-cli/customize-copilot/add-skills

---

## Claude Code

Claude Code supports custom skills as directories containing `SKILL.md` files. Skills are model-invoked based on the `description`.

Locations:

| Scope | Location |
|---|---|
| Project | `.claude/skills/<skill-name>/SKILL.md` |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` |
| Plugin | Bundled with Claude Code plugins |

Verification:

```text
List all available Skills
```

Restart Claude Code if a newly added or edited skill does not appear.

Source: https://docs.claude.com/en/docs/claude-code/skills

---

## Windsurf Cascade

Windsurf Cascade supports skills with progressive disclosure. By default the model sees only the skill `name` and `description`, then loads `SKILL.md` when it invokes the skill or when the user mentions it with `@skill-name`.

Locations:

| Scope | Location |
|---|---|
| Workspace | `.windsurf/skills/<skill-name>/SKILL.md` |
| Global | `~/.codeium/windsurf/skills/<skill-name>/SKILL.md` |
| Compatible workspace | `.agents/skills/<skill-name>/SKILL.md` |
| Compatible global | `~/.agents/skills/<skill-name>/SKILL.md` |
| Enterprise system | `C:\ProgramData\Windsurf\skills\` on Windows, `/etc/windsurf/skills/` on Linux/WSL, `/Library/Application Support/Windsurf/skills/` on macOS |

Use the Cascade UI to create workspace or global skills, or create the folders manually.

Source: https://docs.windsurf.com/windsurf/cascade/skills

---

## Cursor

Cursor documents reusable agent behavior through Rules, not Agent Skills. Do not install `SKILL.md` bundles and assume Cursor will load them.

Use project rules:

```text
.cursor/rules/
```

Use `AGENTS.md` for simpler cross-agent instructions. Cursor also supports legacy `.cursorrules`, but project rules are preferred.

Rule types include:

- `Always`: always included.
- `Auto Attached`: included when matching files are referenced.
- `Agent Requested`: available for the agent to choose based on a description.

For a Power Platform workflow that would be a skill in Codex/Copilot/Claude/Windsurf, create a focused Cursor rule with a clear description and relevant file globs.

Source: https://docs.cursor.com/context/rules

---

## Zed

Zed documents reusable instructions as Rules, not Agent Skills. Do not assume Zed scans `SKILL.md` skill folders.

Project-level instruction files Zed can read include:

```text
.rules
.cursorrules
.windsurfrules
.clinerules
.github/copilot-instructions.md
AGENT.md
AGENTS.md
CLAUDE.md
GEMINI.md
```

Zed uses the first matching instruction file from its supported list. For reusable on-demand instructions, use the Rules Library and mention a rule with `@rule`.

Source: https://zed.dev/docs/ai/rules

---

## Power Platform toolkit recommendation

For this repo, use `.agents/skills` as the shared skill location for cross-agent compatibility. It is supported directly by Codex, GitHub Copilot, and Windsurf, and it is a reasonable neutral location for skills that can be copied into `.claude/skills` when needed.

Recommended project layout:

```text
.agents/
  skills/
    powerapps-canvas-authoring/
      SKILL.md
    powerapps-canvas-accessibility/
      SKILL.md
    powerapps-delegation/
      SKILL.md
```

For tools that do not support Agent Skills:

- Cursor: convert the same guidance into `.cursor/rules/*.mdc`.
- Zed: summarize the always-relevant parts into `AGENTS.md` or `.rules`; keep the full skill docs in `.agents/skills` for other clients.

Do not duplicate large skill content into always-on rules. Skills should stay on-demand so they do not crowd out the model context.
