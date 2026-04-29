# Copilot Studio MCP

**Server key:** `copilot-studio`  
**What it does:** Lets your AI agent interact with Microsoft Copilot Studio agents — read agent configuration, update topics, manage connections, and deploy changes.

---

## When to use

- Reviewing or editing a Copilot Studio agent's topics
- Automating agent deployment as part of a pipeline
- Querying what actions or connections an agent is using

---

## What you need

| Credential | Where to get it |
|---|---|
| **Agent MCP URL** | Copilot Studio → open your agent → Settings → Channels → MCP Client → copy the MCP server URL |
| **Tenant ID** | Azure Portal → Microsoft Entra ID → Overview → Tenant ID |

> The Agent MCP URL is unique per agent. If you work with multiple agents, you'll need to swap the URL (or add multiple config blocks with different keys).

---

## Install

```powershell
# Install the Copilot Studio MCP .NET global tool (run once per machine)
dotnet tool install -g Microsoft.Agents.CopilotStudio.Mcp
```

---

## Config block

```json
"copilot-studio": {
  "type": "local",
  "command": "Microsoft.Agents.CopilotStudio.Mcp",
  "args": [
    "--remote-server-url", "PASTE_AGENT_MCP_URL_HERE",
    "--tenant-id",         "PASTE_TENANT_ID_HERE",
    "--scopes",            "https://api.powerplatform.com/.default"
  ]
}
```

---

## Notes

- This MCP is optional — skip it if you're not working with Copilot Studio agents
- The MCP URL can be added later without re-running the full setup
- Authentication uses your current logged-in Microsoft account; make sure you've run `pac auth` first
