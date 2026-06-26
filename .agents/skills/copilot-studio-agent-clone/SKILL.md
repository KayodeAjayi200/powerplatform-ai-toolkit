---
name: copilot-studio-agent-clone
description: Clone and set up Microsoft Copilot Studio agents from a maker URL, including pulling the source agent, creating or repairing Dataverse MCP tools, adding skills/tools/components to the correct unmanaged solution, resolving connection references, creating botcomponent_connectionreference dependencies, publishing, exporting, and verifying the result. Use when Codex is given a Copilot Studio agent URL or asked to clone, migrate, repair, or make a Dataverse-backed Copilot Studio agent work immediately.
---

# Copilot Studio Agent Clone

## Goal

Given a Copilot Studio agent URL, clone or set up the agent so it opens in the maker UI, has the expected skills/tools, the Microsoft Dataverse MCP Server works, all required components are in the target unmanaged solution, and the agent is published.

Follow the successful path below. Do not reproduce exploratory dead ends.

## Inputs To Collect

The maker should be able to provide only the source or target Copilot Studio URL. Extract `environmentId` and `agentId` from:

```text
https://copilotstudio.microsoft.com/environments/<environment-id>/bots/<agent-id>
```

Also determine:

- `tenantId`
- Dataverse environment URL, if the CLI cannot resolve it
- agent management URL, if the CLI cannot resolve it
- target unmanaged solution unique name
- target publisher/schema prefix preference, if a new agent is being created
- Dataverse MCP connection id, if a new connection reference must be created

## Clean Workflow

1. Parse the agent URL.
2. Clone the agent locally with the Copilot Studio CLI.
3. Validate the cloned workspace.
4. Create or update agent instructions, skills, topics, and tools using the supported local workflow where possible.
5. Push local agent content.
6. Ensure the Dataverse MCP tool is complete in Dataverse:
   - MCP bot component exists and belongs to the target bot.
   - connection reference exists and has a `connectionid`.
   - `PvaShareConnection` has been called for the connection reference.
   - `botcomponent_connectionreference` links the MCP tool to the connection reference.
7. Add the bot, bot components, connection references, and dependency rows to the target solution.
8. Publish the agent.
9. Export the unmanaged solution and verify the dependency assets.
10. Ask the user to hard refresh Copilot Studio and test the tool.

## Clone From URL

Use the CLI's `--url` support. It extracts `environmentId` and `agentId` automatically.

```powershell
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js clone `
  --workspace "<target-local-folder>" `
  --url "<copilot-studio-agent-url>" `
  --tenant-id <tenant-id>
```

If environment resolution fails, include:

```powershell
  --environment-id <environment-id> `
  --environment-url <dataverse-url> `
  --agent-mgmt-url <agent-management-url>
```

Then validate:

```powershell
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js validate `
  --workspace "<agent-workspace>" `
  --tenant-id <tenant-id> `
  --environment-id <environment-id> `
  --environment-url <dataverse-url> `
  --agent-mgmt-url <agent-management-url>
```

## Add Or Update Skills

For normal skills/instructions, prefer local agent files followed by validate and push. Keep skills business-facing and concise.

For new Studio skills created directly in Dataverse, create them as `botcomponent` rows through:

```text
bots(<bot-id>)/Microsoft.Dynamics.CRM.PvaCreateBotComponents
```

Include:

```json
{
  "@odata.type": "Microsoft.Dynamics.CRM.botcomponent",
  "schemaname": "<bot-schema>.skill.<skill-name>",
  "name": "<skill display name>",
  "description": "<when to use>",
  "componenttype": 9,
  "data": "<skill instructions>",
  "parentbotid@odata.bind": "/bots(<bot-id>)",
  "statecode": 0,
  "statuscode": 1
}
```

Do not create skills as translation components. If a skill is not visible in the UI, check that it is a `botcomponent`, has `_parentbotid_value` set to the target bot, and is added to the solution as component type `10224`.

## Add Or Repair Dataverse MCP

Use `scripts/dataverse-mcp-link.js` first. It uses Azure CLI tokens and avoids stale Copilot Studio helper-token cache.

Ensure or repair a Dataverse MCP tool:

```powershell
node <skill-path>\scripts\dataverse-mcp-link.js ensure `
  --tenant-id <tenant-id> `
  --environment-url <dataverse-url> `
  --bot-id <target-bot-id> `
  --bot-schema <target-bot-schema> `
  --connection-id <dataverse-connection-id> `
  --solution <solution-unique-name>
```

Inspect an existing setup:

```powershell
node <skill-path>\scripts\dataverse-mcp-link.js inspect `
  --tenant-id <tenant-id> `
  --environment-url <dataverse-url> `
  --tool-schema <mcp-tool-schema> `
  --connection-reference <connection-reference-logical-name>
```

Repair an existing setup:

```powershell
node <skill-path>\scripts\dataverse-mcp-link.js fix `
  --tenant-id <tenant-id> `
  --environment-url <dataverse-url> `
  --tool-schema <mcp-tool-schema> `
  --connection-reference <connection-reference-logical-name> `
  --solution <solution-unique-name>
```

The helper enforces the required Dataverse MCP shape:

```yaml
kind: McpTool
connectorId: /providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps
connectionReference: <target-connection-reference-logical-name>
operationId: InvokeMCP
```

Critical detail: the MCP is not complete until this association exists:

```http
POST /api/data/v9.2/botcomponents(<tool-id>)/botcomponent_connectionreference/$ref
{
  "@odata.id": "<dataverse-url>/api/data/v9.2/connectionreferences(<connection-reference-id>)"
}
```

Do not POST raw GUID fields directly to `botcomponent_connectionreferenceset`.

## Add Components To The Solution

Use `AddSolutionComponent` for all target components.

Component types:

```text
10223 = bot
10224 = botcomponent
10161 = connectionreference
10232 = botcomponent_connectionreference in current Dataverse exports
```

For Dataverse MCP, the solution should contain at least:

- target bot
- default GPT component
- skills/topics/actions/tool botcomponents
- Dataverse MCP botcomponent
- Dataverse connection reference
- `botcomponent_connectionreference` row

When adding `botcomponent_connectionreference` rows with `AddSolutionComponent`, first query `solutioncomponent` for an existing exported relationship row if possible and use the environment's actual `componenttype`. In the RCHT Finance Agent environment this relationship exports as component type `10232`; using `10231` is interpreted as `botcomponent_workflow` and fails. Do not include `DoNotIncludeSubcomponents` for this relationship component.

## Push And Publish

Push validated local changes:

```powershell
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js push `
  --workspace "<agent-workspace>" `
  --tenant-id <tenant-id> `
  --environment-id <environment-id> `
  --environment-url <dataverse-url> `
  --agent-mgmt-url <agent-management-url>
```

Publish:

```powershell
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js publish `
  --workspace "<agent-workspace>" `
  --tenant-id <tenant-id> `
  --environment-url <dataverse-url>
```

If CLI publish has token-cache issues, call Dataverse directly:

```http
POST /api/data/v9.2/bots(<bot-id>)/Microsoft.Dynamics.CRM.PvaPublish
{}
```

## Export And Verify

Export the unmanaged solution:

```http
POST /api/data/v9.2/ExportSolution
{
  "SolutionName": "<solution-unique-name>",
  "Managed": false
}
```

Unzip the file and verify:

- `Assets/botcomponent_connectionreferenceset.xml` contains the Dataverse MCP to connection reference mapping.
- `botcomponents/<mcp-tool-schema>/data` points to the target connection reference.
- `customizations.xml` contains the target connection reference.
- `Assets/bot_botcomponentset.xml` links the target bot to the MCP tool and other bot components.

## Final User Test

Tell the user to hard refresh Copilot Studio, reopen the agent, and test:

```text
List all active venues.
```

Then test a real operational query that should use Dataverse MCP.

## Troubleshooting

- `ConnectionId must be resolved before building the request`: run `ensure` or `fix`; the connection reference or `botcomponent_connectionreference` link is missing.
- Tool exists but does not load in UI: export the solution and inspect `Assets/botcomponent_connectionreferenceset.xml`.
- Skills do not show: verify they are `botcomponent` records with `parentbotid` and solution component type `10224`.
- Copilot CLI Dataverse token returns 401 while Azure CLI works: use Azure CLI token for Dataverse actions.
- UI still fails after exported solution is correct: suspect maker-session cache or service issue; hard refresh, reopen, or test in a fresh browser profile.

## Safety

- Never modify or delete source-agent components while cloning.
- Query by exact target schema before replacing a component.
- Back up any target component JSON before deleting/recreating it.
- Prefer target-agent connection references. Do not rely on another agent's connection reference except as a temporary diagnostic.
- Keep final agent instructions business-facing; do not expose table, relationship, or schema names to end users.
