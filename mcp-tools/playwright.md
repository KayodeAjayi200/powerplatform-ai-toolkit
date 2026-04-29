# Playwright MCP

**Server key:** `playwright`  
**What it does:** Gives your AI agent the ability to control a real web browser — navigate to URLs, click buttons, fill forms, take screenshots, and read page content. Useful for testing web apps, scraping data, or automating any browser-based task.

---

## When to use

- Testing a Power Apps canvas app or portal in a browser
- Automating a workflow that requires navigating the Power Platform admin centre
- Verifying that a deployed app works correctly end-to-end

---

## What you need

Nothing — no credentials required (though the pages you visit may require a login).

---

## Install

No install needed for the MCP itself — uses `npx`.  
However, Playwright needs browser binaries installed:

```powershell
# Install Playwright browsers (run once per machine)
npx playwright install
```

---

## Config block

```json
"playwright": {
  "type": "local",
  "command": "npx",
  "args": ["-y", "@playwright/mcp"]
}
```

---

## Notes

- The browser runs headlessly by default — the agent controls it without a visible window
- If you want to watch the agent browse, check the `@playwright/mcp` docs for a headed mode flag
- Browser sessions do not persist between agent conversations — the agent starts fresh each time
- Useful for automating repetitive admin tasks in the Power Platform portal (e.g. checking environment health)
