# Azure DevOps MCP

**Server key:** `azure-devops`  
**What it does:** Lets your AI agent work with Azure DevOps — query and update work items, trigger pipelines, read pipeline logs, browse repos, and manage pull requests.

---

## When to use

- Checking work item status or updating sprint tasks
- Triggering a deployment pipeline
- Reading pipeline failure logs to diagnose a build error
- Reviewing ADO pull requests

---

## What you need

| Credential | Where to get it |
|---|---|
| **ADO Org URL** | The base URL of your Azure DevOps organisation, e.g. `https://dev.azure.com/myorg` |
| **ADO PAT** | dev.azure.com → User settings (top-right avatar) → Personal access tokens → New Token |

### Recommended PAT permissions

| Permission | Level |
|---|---|
| Work Items | Read and Write |
| Build | Read and Execute |
| Release | Read and Execute |
| Code | Read and Write |
| Project and Team | Read |

---

## Install

No install needed — uses `npx` which comes with Node.js.

---

## Config block

```json
"azure-devops": {
  "type": "local",
  "command": "npx",
  "args": ["-y", "@tiberriver256/mcp-server-azure-devops"],
  "env": {
    "AZURE_DEVOPS_ORG_URL":       "https://dev.azure.com/YOUR_ORG",
    "AZURE_DEVOPS_AUTH_METHOD":   "pat",
    "AZURE_DEVOPS_PAT":           "PASTE_YOUR_PAT_HERE"
  }
}
```

---

## Notes

- ADO PATs expire — if the MCP stops working, check whether the PAT has expired and renew it
- Set the PAT expiry to at least 90 days to avoid frequent renewals
- The PAT is stored in plain text in `mcp-config.json` — keep that file private
