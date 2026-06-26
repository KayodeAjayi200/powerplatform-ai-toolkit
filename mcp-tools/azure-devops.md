# Azure DevOps MCP

**Server key:** `azure-devops`  
**What it does:** Lets your AI agent work with Azure DevOps — query and update work items, trigger pipelines, read pipeline logs, browse repos, and manage pull requests.

> **⚠️ Always check for updates before configuring.**  
> This is an official Microsoft MCP. The recommended approach has already changed once (from local to remote).  
> Check the latest setup instructions at:  
> - GitHub: https://github.com/microsoft/azure-devops-mcp  
> - Docs: https://learn.microsoft.com/en-us/azure/devops/mcp-server/remote-mcp-server

---

## When to use

- Checking work item status or updating sprint tasks
- Triggering a deployment pipeline
- Reading pipeline failure logs to diagnose a build error
- Reviewing ADO pull requests

---

## Option A — Remote MCP (Recommended)

No local install needed. Microsoft hosts the MCP server — your agent connects directly.

**What you need:** Just your Azure DevOps organisation name. Authentication uses your Microsoft account via browser on first use — no PAT required.

```json
"azure-devops": {
  "url": "https://mcp.dev.azure.com/YOUR_ORG",
  "type": "http"
}
```

Replace `YOUR_ORG` with your organisation name (e.g. `contoso`).

---

## Option B — Local MCP (stdio fallback)

Use only if your agent client requires a local `stdio` server rather than a remote HTTP connection.

**Requires:** Node.js 20+

```json
"azure-devops": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@azure-devops/mcp", "YOUR_ORG"]
}
```

To restrict which tool domains are loaded (recommended for large orgs):

```json
"args": ["-y", "@azure-devops/mcp", "YOUR_ORG", "-d", "core", "work", "work-items"]
```

Available domains: `core`, `work`, `work-items`, `search`, `test-plans`, `repositories`, `wiki`, `pipelines`, `advanced-security`

---

## Notes

- The remote MCP (Option A) is the official recommended path going forward
- Local MCP is still supported but future investment is in the remote experience
- Authentication for both options uses your Microsoft account — no PAT needed
- If you need default project/team context, set `ado_mcp_project` and `ado_mcp_team` env vars (local only)
