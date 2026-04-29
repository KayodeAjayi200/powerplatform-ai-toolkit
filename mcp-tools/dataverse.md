# Dataverse MCP

**Server key:** `dataverse`  
**What it does:** Lets your AI agent read and write Microsoft Dataverse tables directly — query rows, create records, update data, and explore table schemas without leaving your coding tool.

---

## When to use

- Querying Dataverse tables to understand data structure
- Creating or updating records as part of a workflow
- Exploring which columns exist on a table before writing Power Fx formulas

---

## What you need

| Credential | Where to get it |
|---|---|
| **Connection URL** | Power Automate → My connections → Common Data Service → `⋯` → Details → copy the full URL including query string |
| **Tenant ID** | Azure Portal → Microsoft Entra ID → Overview → Tenant ID (a GUID) |

---

## Install

```powershell
# Install the Dataverse MCP .NET global tool (run once per machine)
dotnet tool install -g Microsoft.PowerPlatform.Dataverse.MCP
```

---

## Config block

```json
"dataverse": {
  "type": "local",
  "command": "Microsoft.PowerPlatform.Dataverse.MCP",
  "args": [
    "--ConnectionUrl", "PASTE_YOUR_CONNECTION_URL_HERE",
    "--TenantId",      "PASTE_YOUR_TENANT_ID_HERE",
    "--MCPServerName", "DataverseMCPServer",
    "--BackendProtocol", "HTTP"
  ]
}
```

---

## Notes

- The connection URL changes if you re-create the connection in Power Automate — update `mcp-config.json` if it stops working
- You must be signed in to Power Platform (`pac auth`) for the connection to authenticate
- Works with any Dataverse environment; change `--ConnectionUrl` to switch environments
