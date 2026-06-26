---
name: copilot-studio-child-agent-tools
description: Add, repair, or verify Microsoft Copilot Studio tools on child agents, especially Dataverse MCP Server actions. Use when a Copilot Studio classic or new agent has child agents, the user asks to add tools to child agents, fix missing tools in the UI, resolve Dataverse MCP connection-reference errors, clone a working tool setup from one child agent to another, or validate/publish agent YAML after tool changes.
---

# Copilot Studio Child Agent Tools

Use this skill to add tools such as Microsoft Dataverse MCP Server to Copilot Studio child agents in a way that survives validation, publish, solution export, and runtime invocation.

## Operating Rules

- Pull the latest agent package before editing. Do not work from stale YAML.
- Preserve existing instructions and topics unless the user explicitly asks to redesign them.
- Prefer copying the exact YAML shape from a tool that was added successfully through the Copilot Studio UI in the same agent.
- Add tools at the child-agent scope when the child agent needs to call them. A parent-level tool does not automatically prove the child agent has a usable action component.
- Use unique component and display names for every child tool action.
- Keep internal Dataverse names in instructions or skills where they help the agent build valid queries, but do not expose internal table or relationship names in user-facing answers.

## Workflow

1. Identify the source agent, target child agents, target environment, solution, tenant, and Dataverse URL from the user request or existing project files.
2. Pull or export the latest agent using the local `skills-for-copilot-studio` workflow already present in the workspace.
3. Locate child agents and existing actions:

```powershell
rg --files | rg "agents/.+/(agent|actions/.+)\.mcs\.yml$"
rg "InvokeMCP|ModelContextProtocol|connectionReference|Microsoft Dataverse" .
```

4. Find a working Dataverse MCP action if one exists. Reuse its `connectionReference`, `connectionProperties`, `operationDetails`, and tool names.
5. Create one child-scoped action file per child agent under:

```text
agents/<ChildAgentName>/actions/<UniqueActionFile>.mcs.yml
```

6. Validate locally before pushing.
7. Push, publish, then verify the Dataverse action components and their connection-reference dependency rows in Dataverse.

## Dataverse MCP Action Pattern

Use the local action schema already present in the pulled agent. The following pattern captures the important fields; adapt surrounding IDs/schema names to match the exported project.

```yaml
kind: TaskDialog
modelDisplayName: Microsoft Dataverse <Child Purpose> MCP Server
modelDescription: Provides Remote MCP Server access to Dataverse for <child purpose>.

action:
  kind: InvokeExternalAgentTaskAction
  connectionReference: <existing-working-connection-reference-logical-name>
  connectionProperties:
    mode: Invoker
  operationDetails:
    kind: ModelContextProtocolMetadata
    operationId: InvokeMCP
    tools:
      kind: UseSpecificTools
      tools:
        - search
        - read_query
        - create_record
        - update_record
        - delete_record
```

If the exported action includes `mcs.metadata.componentName`, keep it unique as well:

```yaml
mcs.metadata:
  componentName: Microsoft Dataverse <Child Purpose> MCP Server
```

## Naming Rules

Give every child MCP action a distinct name. Reusing the same display name across parent and children can produce validation errors such as:

```text
Duplicate property detected; each property key must be unique
```

Good names:

- `Microsoft Dataverse Roster MCP Server`
- `Microsoft Dataverse Scheduling Operations MCP Server`
- `Microsoft Dataverse Slots Attendance MCP Server`
- `Microsoft Dataverse Data Steward MCP Server`

Avoid naming every action `Microsoft Dataverse MCP Server`.

## Connection References

Use the existing working Dataverse connection reference unless the user explicitly wants a new connection. A failing child tool commonly has the right action YAML but lacks a resolved connection dependency.

Runtime symptom:

```text
ConnectionId must be resolved before building the request.
Operation: InvokeMCP
```

When this appears:

- Confirm the action points to the same logical connection reference as the working parent or working child action.
- Confirm the Dataverse `connectionreference` row has a non-empty resolved connection ID.
- Confirm the action component has a `botcomponent_connectionreference` dependency row.
- Add the action component to the unmanaged solution if it is missing from the solution.

## Validate, Push, Publish

Use the repository's local command pattern. A typical `skills-for-copilot-studio` validation command looks like:

```powershell
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js validate `
  --workspace "<agent-workspace>" `
  --tenant-id "<tenant-id>" `
  --environment-id "<environment-id>" `
  --environment-url "<dataverse-url>"
```

Then push and publish with the same tenant, environment, and workspace values:

```powershell
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js push ...
node .\skills-for-copilot-studio\scripts\manage-agent.bundle.js publish ...
```

Do not treat a successful file edit as done. The task is done only after validation passes, the agent is pushed and published, and the tool can be seen or invoked from the child agent.

## Dataverse Verification

After publishing, verify the child action components exist and are connected.

Check action components by parent bot and name:

```http
GET <dataverse-url>/api/data/v9.2/botcomponents?$select=botcomponentid,name,componenttype&$filter=_parentbotid_value eq <bot-id> and contains(name,'Microsoft Dataverse')
```

Check a component's connection dependency through the navigation property:

```http
GET <dataverse-url>/api/data/v9.2/botcomponents(<botcomponentid>)/botcomponent_connectionreference?$select=connectionreferenceid,connectionreferencelogicalname,connectionid
```

Expected result: each child MCP action has one connection-reference dependency and a resolved `connectionid`.

If required, add action components to the unmanaged solution using the Dataverse `AddSolutionComponent` action. In current RCHT Finance Agent exports, Copilot Studio bot component action records appear in `solutioncomponent` as component type `10225`, and the botcomponent-to-connectionreference relationship records appear as component type `10232`. Always query existing `solutioncomponent` rows to confirm the environment's actual component type before adding relationship rows. Do not pass `DoNotIncludeSubcomponents` when adding `botcomponent_connectionreference` rows.

## Child-Agent Architecture Notes

- Parent actions commonly live under `actions/`.
- Child actions commonly live under `agents/<ChildAgentName>/actions/`.
- A child agent can appear usable while still lacking the tool dependency needed to call Dataverse at runtime.
- If one child agent was manually configured through the UI and works, use that as the reference specimen for all other children.
- If the UI does not show the tool immediately after publish, hard refresh the maker portal and confirm the agent is opened from the same environment and solution.

## Creating a Brand-New Child Agent

Do not assume that adding a new `agents/<ChildAgentName>/agent.mcs.yml` folder locally is enough. Local validation can pass while `syncPush` fails because the cloud `botcomponent` row for the child agent does not exist yet.

Common failure:

```text
Unsupported sync operation. ParentId does not exist on cloud: <publisher>.<agent>.agent.<ChildAgentName>
```

Preferred clean workflow:

1. Create a placeholder child agent in Copilot Studio UI, or create the child `botcomponent` row in Dataverse with `componenttype = 9`, the target `schemaname`, `name`, `data` containing the `AgentDialog` YAML without `mcs.metadata`, and `parentbotid@odata.bind` pointing to the parent bot.
2. Clone or pull the agent again so `.mcs/botdefinition.json` contains the new child agent ID and schema name.
3. Patch the child instructions in the refreshed workspace.
4. Add any child-scoped MCP action under `agents/<ChildAgentName>/actions/`.
5. Validate, push, publish, then verify the action botcomponent is parented to the child via `_parentbotcomponentid_value`.

If automating the Dataverse registration path, verify the new child exists before pushing:

```http
GET <dataverse-url>/api/data/v9.2/botcomponents?$select=botcomponentid,name,schemaname,componenttype,_parentbotid_value&$filter=schemaname eq '<child-agent-schema-name>'
```

After the refreshed clone sees the child, `syncPush` can create or update the child-scoped MCP action normally. Treat the fresh clone as the source of truth for subsequent edits, otherwise the old workspace may continue to fail with the missing parent error.

## Conversation Context Guidance

For operational agents, tools alone are not enough. Configure instructions or child-agent behavior so the agent can preserve fresh task context and avoid stale context.

- Preserve the active operational scope for immediate follow-ups: venue, date range, entity area, and last result.
- Resolve short follow-ups such as "yes", "is this an issue?", "show more detail", or "answer my question" against the latest relevant result while the conversation is fresh.
- When the conversation has been inactive or the previous task is complete, ask whether to continue the prior scheduling request or start a new one.
- Use Copilot Studio inactivity handling when available to close, reset, or summarize stale sessions instead of silently carrying old scope forward.
- Do not invent data while trying to be helpful. Query Dataverse first, then answer from returned records.

## Agent Instruction Hints

When adding or repairing child tools, review the parent and child instructions so tool usage is intelligible:

- Tell the agent which child agent owns each operational area.
- Tell each child agent which Dataverse MCP tool it can use.
- Include internal schema names only in tool-use guidance, not in business-facing prose.
- Require business terms in final answers: venue, session, roster, staff availability, appointment slot, booking, attendance outcome.
- For failed Dataverse calls, report the business impact and the technical failure briefly; do not fabricate counts or records.
