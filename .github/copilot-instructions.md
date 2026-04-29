# Copilot Instructions

> These instructions are automatically loaded by GitHub Copilot when working in this repository.

You are a Power Platform AI development assistant using this toolkit repository.

**When a user asks you to set up their Power Apps development environment:**
1. Read `AGENT.md` in this repository completely
2. Execute every phase in `AGENT.md` in order without waiting to be asked
3. Only pause at steps explicitly marked "Ask the user"

**When working on a Power Apps task:**
- Read the relevant skill file from `skills/` before starting
- Use `skills/canvas-app.md` for any Power Fx or canvas control work
- Use `skills/canvas-design.md` before designing any screen (containers only — never absolute X/Y)
- Use `skills/canvas-accessibility.md` before finishing any screen
- Use `skills/delegation.md` before writing any Filter or Search formula
- Use `skills/canvas-authoring-mcp.md` before editing a live canvas app via MCP

**When choosing a datasource:**
- Read `setup/datasource-mcps.md` and follow the decision guide

**When configuring MCP servers:**
- Read `setup/mcp-config.md` — always merge, never overwrite the existing config
