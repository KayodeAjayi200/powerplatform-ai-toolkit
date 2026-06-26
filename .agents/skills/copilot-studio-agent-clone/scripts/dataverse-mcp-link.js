#!/usr/bin/env node

const { execSync } = require("node:child_process");

function parseArgs(argv) {
  const args = { command: argv[2] };
  for (let i = 3; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[name] = value;
  }
  return args;
}

function requireArgs(args, names) {
  const missing = names.filter((name) => !args[name]);
  if (missing.length) {
    throw new Error(`Missing required argument(s): ${missing.map((x) => `--${x}`).join(", ")}`);
  }
}

function getToken(environmentUrl, tenantId) {
  return execSync(
    `az account get-access-token --resource ${environmentUrl} --tenant ${tenantId} --query accessToken -o tsv`,
    { encoding: "utf8", shell: "powershell.exe" },
  ).trim();
}

function cleanEnvUrl(url) {
  return url.replace(/\/+$/, "");
}

async function createClient(environmentUrl, tenantId) {
  const envUrl = cleanEnvUrl(environmentUrl);
  const token = getToken(envUrl, tenantId);

  async function dv(path, opts = {}) {
    const res = await fetch(`${envUrl}/api/data/v9.2/${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: "return=representation",
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${opts.method || "GET"} ${path} -> ${res.status} ${text}`);
    }
    return text ? JSON.parse(text) : null;
  }

  return { dv, envUrl };
}

function odataString(value) {
  return String(value).replace(/'/g, "''");
}

async function readState(dv, toolSchema, connectionReferenceName) {
  const toolFilter = encodeURIComponent(`schemaname eq '${odataString(toolSchema)}'`);
  const crFilter = encodeURIComponent(`connectionreferencelogicalname eq '${odataString(connectionReferenceName)}'`);
  const tools = await dv(
    `botcomponents?$select=botcomponentid,schemaname,name,componenttype,_parentbotid_value,statecode,statuscode,iscustomizable,data&$filter=${toolFilter}`,
  );
  const connectionReferences = await dv(
    `connectionreferences?$select=connectionreferenceid,connectionreferencelogicalname,connectionreferencedisplayname,connectionid,connectorid,statecode,statuscode,iscustomizable&$filter=${crFilter}`,
  );

  let relationships = { value: [] };
  if (tools.value.length && connectionReferences.value.length) {
    const toolIds = tools.value.map((x) => `botcomponentid eq ${x.botcomponentid}`).join(" or ");
    const crIds = connectionReferences.value
      .map((x) => `connectionreferenceid eq ${x.connectionreferenceid}`)
      .join(" or ");
    const relFilter = encodeURIComponent(`(${toolIds}) or (${crIds})`);
    relationships = await dv(
      `botcomponent_connectionreferenceset?$select=botcomponent_connectionreferenceid,botcomponentid,connectionreferenceid,componentstate,ismanaged,solutionid,iscustomizable&$filter=${relFilter}`,
    );
  }

  return { tools: tools.value, connectionReferences: connectionReferences.value, relationships: relationships.value };
}

async function addSolutionComponent(dv, solution, componentType, componentId) {
  try {
    await dv("AddSolutionComponent", {
      method: "POST",
      body: JSON.stringify({
        ComponentType: componentType,
        ComponentId: componentId,
        SolutionUniqueName: solution,
        AddRequiredComponents: true,
        IncludedComponentSettingsValues: null,
      }),
    });
    return "added";
  } catch (error) {
    if (/already exists|0x8004f016/i.test(String(error.message))) return "already-present";
    throw error;
  }
}

async function fix(args) {
  requireArgs(args, ["tenant-id", "environment-url", "tool-schema", "connection-reference", "solution"]);
  const { dv, envUrl } = await createClient(args["environment-url"], args["tenant-id"]);
  const state = await readState(dv, args["tool-schema"], args["connection-reference"]);

  if (state.tools.length !== 1) {
    throw new Error(`Expected exactly one MCP tool for schema ${args["tool-schema"]}; found ${state.tools.length}`);
  }
  if (state.connectionReferences.length !== 1) {
    throw new Error(
      `Expected exactly one connection reference ${args["connection-reference"]}; found ${state.connectionReferences.length}`,
    );
  }

  const tool = state.tools[0];
  const cr = state.connectionReferences[0];

  if (!cr.connectionid) {
    throw new Error(`Connection reference ${cr.connectionreferenceid} has no connectionid. Resolve it before linking.`);
  }

  await dv(`connectionreferences(${cr.connectionreferenceid})/Microsoft.Dynamics.CRM.PvaShareConnection`, {
    method: "POST",
    body: "{}",
  });

  const hasRelationship = state.relationships.some(
    (row) =>
      row.botcomponentid?.toLowerCase() === tool.botcomponentid.toLowerCase() &&
      row.connectionreferenceid?.toLowerCase() === cr.connectionreferenceid.toLowerCase(),
  );

  if (!hasRelationship) {
    await dv(`botcomponents(${tool.botcomponentid})/botcomponent_connectionreference/$ref`, {
      method: "POST",
      body: JSON.stringify({
        "@odata.id": `${envUrl}/api/data/v9.2/connectionreferences(${cr.connectionreferenceid})`,
      }),
    });
  }

  await addSolutionComponent(dv, args.solution, 10224, tool.botcomponentid);
  await addSolutionComponent(dv, args.solution, 10161, cr.connectionreferenceid);

  const after = await readState(dv, args["tool-schema"], args["connection-reference"]);
  const relationship = after.relationships.find(
    (row) =>
      row.botcomponentid?.toLowerCase() === tool.botcomponentid.toLowerCase() &&
      row.connectionreferenceid?.toLowerCase() === cr.connectionreferenceid.toLowerCase(),
  );
  if (!relationship) throw new Error("Relationship creation did not persist.");

  await addSolutionComponent(dv, args.solution, 10231, relationship.botcomponent_connectionreferenceid);

  console.log(
    JSON.stringify(
      {
        status: "ok",
        toolId: tool.botcomponentid,
        connectionReferenceId: cr.connectionreferenceid,
        relationshipId: relationship.botcomponent_connectionreferenceid,
        final: await readState(dv, args["tool-schema"], args["connection-reference"]),
      },
      null,
      2,
    ),
  );
}

function mcpData(connectionReferenceName) {
  return [
    "kind: McpTool",
    "connectorId: /providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps",
    `connectionReference: ${connectionReferenceName}`,
    "operationId: InvokeMCP",
  ].join("\r\n");
}

async function ensure(args) {
  requireArgs(args, ["tenant-id", "environment-url", "bot-id", "bot-schema", "connection-id", "solution"]);
  const { dv } = await createClient(args["environment-url"], args["tenant-id"]);

  const toolSchema =
    args["tool-schema"] ||
    `${args["bot-schema"]}.tool.MicrosoftDataverseMCPServer-MicrosoftDataverseMCPServer`;
  const connectionReferenceName =
    args["connection-reference"] ||
    `${args["bot-schema"]}.cr.shared_commondataser.${args["connection-id"]}`;

  let state = await readState(dv, toolSchema, connectionReferenceName);

  let cr = state.connectionReferences[0];
  if (!cr) {
    cr = await dv("connectionreferences", {
      method: "POST",
      body: JSON.stringify({
        connectionreferencelogicalname: connectionReferenceName,
        connectionreferencedisplayname: connectionReferenceName,
        connectorid: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps",
        connectionid: args["connection-id"],
        statecode: 0,
        statuscode: 1,
        iscustomizable: { Value: false },
      }),
    });
  } else {
    await dv(`connectionreferences(${cr.connectionreferenceid})`, {
      method: "PATCH",
      headers: { "If-Match": "*" },
      body: JSON.stringify({
        connectorid: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps",
        connectionid: args["connection-id"],
        statecode: 0,
        statuscode: 1,
        iscustomizable: { Value: false },
      }),
    });
  }

  state = await readState(dv, toolSchema, connectionReferenceName);
  cr = state.connectionReferences[0];

  let tool = state.tools[0];
  if (!tool) {
    await dv(`bots(${args["bot-id"]})/Microsoft.Dynamics.CRM.PvaCreateBotComponents`, {
      method: "POST",
      body: JSON.stringify({
        BotComponents: [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.botcomponent",
            name: "Microsoft Dataverse MCP Server - Microsoft Dataverse MCP Server",
            schemaname: toolSchema,
            description: "Provides Remote MCP Server access to Dataverse",
            componenttype: 9,
            data: mcpData(connectionReferenceName),
            "parentbotid@odata.bind": `/bots(${args["bot-id"]})`,
            statecode: 0,
            statuscode: 1,
          },
        ],
      }),
    });
  }

  state = await readState(dv, toolSchema, connectionReferenceName);
  if (state.tools.length !== 1) {
    throw new Error(`Expected exactly one MCP tool for schema ${toolSchema}; found ${state.tools.length}`);
  }
  tool = state.tools[0];

  await dv(`botcomponents(${tool.botcomponentid})`, {
    method: "PATCH",
    headers: { "If-Match": "*" },
    body: JSON.stringify({
      data: mcpData(connectionReferenceName),
      iscustomizable: { Value: false },
      statecode: 0,
      statuscode: 1,
    }),
  });

  await fix({
    ...args,
    "tool-schema": toolSchema,
    "connection-reference": connectionReferenceName,
  });

  await addSolutionComponent(dv, args.solution, 10223, args["bot-id"]);
}

async function inspect(args) {
  requireArgs(args, ["tenant-id", "environment-url", "tool-schema", "connection-reference"]);
  const { dv } = await createClient(args["environment-url"], args["tenant-id"]);
  console.log(JSON.stringify(await readState(dv, args["tool-schema"], args["connection-reference"]), null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  if (!["inspect", "fix", "ensure"].includes(args.command)) {
    throw new Error(
      "Usage: dataverse-mcp-link.js <inspect|fix|ensure> --tenant-id ... --environment-url ... [--tool-schema ... --connection-reference ...] [--bot-id ... --bot-schema ... --connection-id ...] [--solution ...]",
    );
  }
  if (args.command === "inspect") await inspect(args);
  if (args.command === "fix") await fix(args);
  if (args.command === "ensure") await ensure(args);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
