# Copilot Studio — VS Code Extension (Clone & Build)

Use the Microsoft Copilot Studio VS Code extension to clone agents locally, edit them as YAML with GitHub Copilot assistance, and apply changes back to the cloud.

---

## Prerequisites

- Visual Studio Code 1.80 or later
- Microsoft account with Copilot Studio access (`kayode.ajayi@devmarque.co.uk`)
- Internet connection

---

## Install the extension

**Option A — from VS Code:**
1. Press `Ctrl+Shift+X` to open Extensions
2. Search **"Copilot Studio"** — publisher must be **Microsoft**
3. Click **Install**

**Option B — direct link:**
```
https://marketplace.visualstudio.com/items?itemName=ms-CopilotStudio.vscode-copilotstudio
```

After install, the Copilot Studio icon appears in the activity bar.

---

## Sign in

1. Click the Copilot Studio icon in the activity bar
2. Select **Sign In** on the popup → **Allow**
3. Authenticate with your Microsoft account
4. Accept permissions (read/write agents, environment access, sync files)

You should now see your environments and agents listed in the **Agents** pane.

---

## Clone an agent

### Recommended method (from Agents pane)

1. Open the Copilot Studio extension pane
2. Select your environment from the dropdown (e.g. `JCBDevmarque` or `Kayode Ajayi's Environment`)
3. Right-click the agent → **Clone Agent**
4. Choose a local folder (ideally already a Git repo)
5. Wait for "Agent Cloned successfully" — usually 10–30 seconds

### From a URL

1. Open the agent in Copilot Studio web → **Settings → Agent details** → copy the URL
2. Return to VS Code, open the Copilot Studio pane → **Clone Agent**
3. The extension detects the URL from clipboard — select it and choose a folder

### What gets cloned

```
my-agent/
├── actions/              # Connectors
├── knowledge/files/      # Knowledge sources
├── topics/               # Conversation topics (*.mcs.yaml)
├── workflows/            # Power Automate flows / tools
├── trigger/              # Event triggers
├── agent.mcs.yaml        # Main agent definition
├── settings.mcs.yml      # Configuration
└── connectionreferences.mcs.yml
```

---

## Edit with GitHub Copilot (AI-assisted)

Once cloned, open the folder in VS Code. GitHub Copilot can help you:

- Write new topics in YAML (`Ctrl+Space` for IntelliSense suggestions)
- Add tools, conditions, variables, entities
- Search across the whole agent with `Ctrl+F`
- View validation errors in the **Problems** pane (`Ctrl+Shift+M`)

### Topic structure example

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnConversationStart
  id: main
  actions:
    - kind: SendActivity
      id: sendGreeting
      activity:
        text:
          - Hello, I'm {System.Bot.Name}. How can I help?
```

---

## Sync changes

| Operation | Direction | When to use |
|---|---|---|
| **Preview** | Cloud → Local | Check for remote changes before you start |
| **Get** | Cloud → Local | Download and apply remote changes |
| **Apply** | Local → Cloud | Push your local edits to Copilot Studio |

> ⚠️ **Apply** modifies the live agent immediately — it does NOT publish it. Test in Copilot Studio after applying.

### Steps to apply your changes

1. Open the **Agent Changes** pane (Copilot Studio icon → Agent Changes)
2. Review **Local Changes** (your edits) vs **Remote Changes** (cloud)
3. If there are remote changes: run **Get** first, resolve any conflicts
4. Then click **Apply** to push your changes to Copilot Studio

---

## Git workflow (recommended)

```powershell
# After cloning the agent, initialise a Git repo
cd C:\Repositories\my-agent
git init
git add .
git commit -m "Initial agent clone"

# Create a GitHub repo and push
gh repo create my-agent --private --source . --push
```

Then work on a branch, raise a PR, and apply to the target environment when merged.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Extension icon missing | Reload VS Code; check Extensions → Installed |
| Auth loops | Clear browser cache for `microsoft.com`; try a different browser |
| Apply button blocked | Remote changes exist — run **Get** first, then apply |
| Can't find extension in marketplace | Search in VS Code Extensions pane (not web browser) |

---

## Next step

After cloning and editing, consider adding your agent repo path to the filesystem MCP in `~/.copilot/mcp-config.json` so GitHub Copilot can read the YAML files directly.
