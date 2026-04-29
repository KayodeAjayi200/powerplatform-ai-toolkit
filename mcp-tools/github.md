# GitHub MCP

**Server key:** `github`  
**What it does:** Lets your AI agent read and interact with GitHub repositories — browse files, read issues and pull requests, create branches, commit files, and open PRs — all without leaving your coding tool.

---

## When to use

- Reviewing open issues or PRs in a solution repo
- Creating a branch and committing changes as part of an automated workflow
- Searching across repos for code patterns

---

## What you need

| Credential | Where to get it |
|---|---|
| **GitHub PAT** | github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → New token |

### Recommended PAT permissions (fine-grained)

| Permission | Level |
|---|---|
| Contents | Read and Write |
| Pull requests | Read and Write |
| Issues | Read and Write |
| Workflows | Read and Write |
| Metadata | Read (required) |

---

## Install

No install needed — uses `npx` which comes with Node.js.

---

## Config block

```json
"github": {
  "type": "local",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "PASTE_YOUR_PAT_HERE"
  }
}
```

---

## Notes

- Fine-grained tokens (scoped to specific repos) are more secure than classic tokens
- If working across many repos, create the PAT at the **organisation level** so it covers all repos in the org
- The PAT is stored in plain text in `mcp-config.json` — keep that file private and never commit it to source control
