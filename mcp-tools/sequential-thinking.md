# Sequential Thinking MCP

**Server key:** `sequential-thinking`  
**What it does:** Gives your AI agent a structured tool for breaking complex problems into sequential reasoning steps before acting. Instead of jumping straight to a solution, the agent can work through a chain of thought, revise its reasoning, and arrive at better answers for multi-step problems.

---

## When to use

- Complex multi-step tasks (e.g. designing a full canvas app architecture)
- Debugging problems where the root cause isn't obvious
- Any task where the agent seems to "jump to conclusions" — this encourages more careful reasoning

---

## What you need

Nothing — no credentials required.

---

## Install

No install needed — uses `npx` which comes with Node.js.

---

## Config block

```json
"sequential-thinking": {
  "type": "local",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```

---

## Notes

- This MCP is passive — it adds a reasoning tool the agent *can* use, but the agent decides when to use it
- Most AI hosts (Copilot, Claude, Cursor) will invoke sequential thinking automatically for complex requests
- Safe to include in all configurations — it has no side effects
