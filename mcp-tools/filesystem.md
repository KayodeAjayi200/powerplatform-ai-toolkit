# Filesystem MCP

**Server key:** `filesystem`  
**What it does:** Gives your AI agent read and write access to specific folders on your local machine. Without this, the agent can only see files you explicitly paste into the chat — with it, the agent can navigate your repos, read any file, and write changes directly.

---

## When to use

- Always — this is the most fundamental MCP for any coding task
- Every folder you want the agent to work in must be listed here

---

## What you need

Just the **absolute paths** to the folders you want the agent to access.  
You can list as many as you like — each becomes a positional argument.

Common paths to include:
- Your dashboard tool repo (e.g. `C:\Repositories\power-platform-dashboard`)
- Each Power Platform solution repo (e.g. `C:\Repositories\my-hr-app`)
- This toolkit repo (e.g. `C:\Repositories\powerplatform-ai-toolkit`) — so the agent can read the skill files

---

## Install

No install needed — uses `npx` which comes with Node.js.

---

## Config block

```json
"filesystem": {
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "C:\\Repositories\\power-platform-dashboard",
    "C:\\Repositories\\my-hr-app",
    "C:\\Repositories\\powerplatform-ai-toolkit"
  ]
}
```

> Add one path per line to the `args` array. Each path is a separate string.

---

## Adding a new path later

Run this PowerShell snippet to append a new folder without rewriting the whole config:

```powershell
# The new folder path you want to add
$newPath = "C:\Repositories\my-new-solution"

$mcpConfigPath = Join-Path $env:USERPROFILE ".copilot\mcp-config.json"
$mcp = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json

# Only add the path if it isn't already there (prevents duplicates)
if ($mcp.mcpServers.filesystem.args -notcontains $newPath) {
    $mcp.mcpServers.filesystem.args += $newPath
    $mcp | ConvertTo-Json -Depth 10 | Set-Content $mcpConfigPath -Encoding UTF8
    Write-Host "Added $newPath"
} else {
    Write-Host "$newPath is already listed — no change needed"
}
```

> Restart your AI coding tool after updating the config.

---

## Notes

- Paths must use **double backslashes** `\\` in JSON (or single backslashes in PowerShell strings)
- The agent can only access files **inside** the listed folders — it cannot access parent folders
- Be careful about listing very broad paths like `C:\` — limit access to specific repos for security
