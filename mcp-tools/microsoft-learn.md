# Microsoft Learn MCP

**Server key:** `microsoft-learn`  
**What it does:** Gives your AI agent live access to Microsoft's official documentation — Power Platform, Azure, M365, and more. Answers come from current docs, not the model's training snapshot.

This is especially valuable for Power Platform development where the Canvas YAML schema, PAC CLI commands, MCP package names, and API shapes change frequently.

> **Official setup docs:** https://learn.microsoft.com/en-us/training/support/mcp

---

## When to use

- Before any canvas app YAML authoring (fetch the live schema)
- When PAC CLI commands or flags seem wrong
- When Dataverse API behaviour doesn't match what the model suggests
- Any time you want the agent to ground its answer in current Microsoft docs rather than training data

---

## What you need

No credentials required. Uses public Microsoft Learn content.

---

## Install

No local install needed — connects to a Microsoft-hosted remote MCP endpoint.

---

## Config block

```json
"microsoft-learn": {
  "type": "http",
  "url": "https://learn.microsoft.com/api/mcp"
}
```

---

## Notes

- Content is sourced from Microsoft Learn — the same docs at learn.microsoft.com
- No authentication required
- Particularly useful alongside `dataverse`, `copilot-studio`, and `canvas-authoring` MCPs where platform behaviour changes frequently
- For Power Platform YAML schema specifically, also fetch the raw schema directly:  
  `https://raw.githubusercontent.com/microsoft/PowerApps-Tooling/refs/heads/master/schemas/pa-yaml/v3.0/pa.schema.yaml`
