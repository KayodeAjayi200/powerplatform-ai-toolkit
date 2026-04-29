# Memory MCP

**Server key:** `memory`  
**What it does:** Gives your AI agent a persistent knowledge graph that survives across sessions. The agent can store facts, relationships, and decisions — and recall them in future conversations without you having to re-explain the context every time.

---

## When to use

- Long-running projects where you want the agent to remember decisions, naming conventions, or architecture choices
- Any time you find yourself repeatedly explaining the same context to the agent

---

## What you need

Nothing — no credentials required.

---

## Install

No install needed — uses `npx` which comes with Node.js.

---

## Config block

```json
"memory": {
  "type": "local",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

---

## Notes

- The knowledge graph is stored locally — it does not sync across machines
- Memory persists until you explicitly clear it or delete the storage file
- Most useful when combined with a custom instruction that tells the agent to read and update memory at the start and end of each session
