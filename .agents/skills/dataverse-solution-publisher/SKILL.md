---
name: dataverse-solution-publisher
description: Repair or prepare Microsoft Dataverse / Power Platform unmanaged solutions so components use the intended publisher and customisation prefix instead of the environment default publisher. Use when a user wants solution components, tables, columns, Copilot Studio bot components, or exported solution XML to appear as if they were created under a desired publisher such as Trustmarque/tm_, when importing to another environment, moving unmanaged solutions, or correcting default-publisher drift.
---

# Dataverse Solution Publisher

Use this skill when Dataverse or Copilot Studio components were created under the environment default publisher but the solution must use a specific publisher and prefix, such as `tm_`.

## Principles

- Prefer creating components in the correct unmanaged solution with the desired publisher from the start.
- Do not assume a generic Dataverse table-creation helper uses the solution publisher. Some MCP/tools create tables under the environment default publisher even when the target solution has a different publisher.
- When exact logical prefixes matter, create metadata through the Dataverse Web API or PAC/Power Platform path that supports solution context, and set the solution context explicitly.
- If the platform still creates components under the default publisher, repair at the unmanaged solution/export layer before importing to the target environment.
- Do not rename logical names blindly. Changing logical names after records, relationships, forms, views, or bot YAML exist can break dependencies.
- Treat publisher repair as metadata and solution-packaging work first; only rename schema names when the user explicitly asks and dependencies are understood.
- Always verify in Dataverse after import. The zip looking correct is not enough.

## Quick Workflow

1. Identify the desired publisher:
   - Publisher unique name.
   - Customisation prefix, e.g. `tm`.
   - Publisher row ID in source and target environments if available.
   - Target unmanaged solution unique name.

2. Confirm current state:
   - Query the solution row and publisher lookup.
   - Query component logical names and prefixes.
   - Check whether components sit in the intended unmanaged solution.
   - For Copilot Studio, check `bot`, `botcomponent`, `connectionreference`, and `solutioncomponent` rows.

3. If possible, fix the solution publisher directly:
   - Update the unmanaged solution's publisher lookup to the desired publisher when Dataverse allows it.
   - Reopen maker portal and verify the solution shows the correct publisher.
   - New components added after this point should use the desired prefix.

4. For new Dataverse tables/columns where the prefix must be right, create them in solution context:
   - Resolve the Dataverse environment URL.
   - Get an access token for the org URL.
   - Query the solution row and publisher row.
   - Create metadata with the `MSCRM.SolutionUniqueName` header set to the unmanaged solution unique name.
   - Use schema names that include the desired prefix, e.g. `tm_MyTable`, `tm_MyColumn`.
   - Verify entity/attribute logical names and `solutioncomponent` membership.

5. If components already exist under the default publisher, export unmanaged:
   - Export the source solution unmanaged.
   - Expand the zip.
   - Inspect `solution.xml`, `customizations.xml`, and component files.
   - Patch publisher metadata and managed properties carefully.
   - Repack and import into the target environment.

6. Import and verify:
   - Import as unmanaged into the target environment.
   - Confirm the solution publisher.
   - Confirm components are in the right solution.
   - Confirm logical names, display names, relationships, forms, views, and bot tools still work.

## Creating Tables With The Correct Publisher

Use this path when a user wants Dataverse tables/columns to actually have the desired prefix, such as `tm_`, not merely be packaged in a solution whose publisher metadata says `tm`.

### Lessons From Devmarque/RCHT

- The Dataverse MCP `create_table` helper created tables using the environment default publisher prefix (`cr51e_`) even though the intended solution used the Trustmarque publisher (`tm`).
- The reliable path was direct Dataverse Web API metadata creation with `MSCRM.SolutionUniqueName` set to the target unmanaged solution unique name.
- In the RCHT Finance Agent environment, Power Apps admin cmdlets could list environments, but `Get-JwtToken` for the Dataverse org resource failed with an AAD preauthorization error. Azure CLI token acquisition worked:

```powershell
$base = "https://orgfcbb84e5.crm11.dynamics.com"
$token = az account get-access-token --resource $base --query accessToken -o tsv
```

- The target solution display name may differ from what the user says. For RCHT, the user referred to `RCHT Finance Agent Solution`; the actual solution was:
  - friendly name: `Finance Agent Solution`
  - unique name: `FinanceAgentSolution`
  - publisher: `Trustmarque Solutions Limited`
  - publisher prefix: `tm`

### Environment And Solution Discovery

Use Power Apps admin cmdlets when available to find the Dataverse org URL:

```powershell
Import-Module Microsoft.PowerApps.Administration.PowerShell
$env = Get-AdminPowerAppEnvironment -EnvironmentName "<environment-id>"
$env.Internal.properties.linkedEnvironmentMetadata.instanceUrl
```

If the environment display name is known, first list environments and find its EnvironmentName:

```powershell
Get-AdminPowerAppEnvironment |
  Select-Object DisplayName, EnvironmentName, Location, EnvironmentSku |
  Format-Table -AutoSize
```

Then query the solution and publisher:

```powershell
$base = "https://<org>.crm11.dynamics.com"
$token = az account get-access-token --resource $base --query accessToken -o tsv
$headers = @{
  Authorization      = "Bearer $token"
  Accept             = "application/json"
  "OData-MaxVersion" = "4.0"
  "OData-Version"    = "4.0"
}

Invoke-RestMethod -Method Get `
  -Uri "$base/api/data/v9.2/solutions?`$select=solutionid,uniquename,friendlyname,_publisherid_value,ismanaged,isvisible&`$filter=ismanaged eq false and isvisible eq true" `
  -Headers $headers

Invoke-RestMethod -Method Get `
  -Uri "$base/api/data/v9.2/publishers?`$select=publisherid,uniquename,friendlyname,customizationprefix,customizationoptionvalueprefix&`$filter=customizationprefix eq 'tm'" `
  -Headers $headers
```

### Metadata Create Pattern

Create tables by posting to `EntityDefinitions`, not to a `CreateEntity` endpoint. Include the solution header:

```powershell
$headers = @{
  Authorization                = "Bearer $token"
  Accept                       = "application/json"
  "Content-Type"               = "application/json; charset=utf-8"
  "OData-MaxVersion"           = "4.0"
  "OData-Version"              = "4.0"
  "MSCRM.SolutionUniqueName"   = "<solution-unique-name>"
}
```

Create the entity with a primary name attribute in the initial payload:

```powershell
function Label($text) {
  @{ LocalizedLabels = @(@{ Label = $text; LanguageCode = 1033 }) }
}

function RequiredLevel($required) {
  @{
    Value = $(if ($required) { "ApplicationRequired" } else { "None" })
    CanBeChanged = $true
    ManagedPropertyLogicalName = "canmodifyrequirementlevelsettings"
  }
}

$payload = @{
  "@odata.type" = "Microsoft.Dynamics.CRM.EntityMetadata"
  SchemaName = "tm_MyTable"
  DisplayName = (Label "My Table")
  DisplayCollectionName = (Label "My Tables")
  Description = (Label "Created in the intended solution publisher context.")
  OwnershipType = "UserOwned"
  HasActivities = $false
  HasNotes = $false
  Attributes = @(
    @{
      "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
      SchemaName = "tm_Name"
      DisplayName = (Label "Name")
      RequiredLevel = (RequiredLevel $true)
      MaxLength = 850
      FormatName = @{ Value = "Text" }
      IsPrimaryName = $true
    }
  )
} | ConvertTo-Json -Depth 30

Invoke-RestMethod -Method Post `
  -Uri "$base/api/data/v9.2/EntityDefinitions" `
  -Headers $headers `
  -Body $payload
```

Add columns with:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "$base/api/data/v9.2/EntityDefinitions(LogicalName='tm_mytable')/Attributes" `
  -Headers $headers `
  -Body $attributePayload
```

Attribute payloads must use the correct metadata type, for example:

- `Microsoft.Dynamics.CRM.StringAttributeMetadata`
- `Microsoft.Dynamics.CRM.MemoAttributeMetadata`
- `Microsoft.Dynamics.CRM.IntegerAttributeMetadata`
- `Microsoft.Dynamics.CRM.DecimalAttributeMetadata`
- `Microsoft.Dynamics.CRM.DateTimeAttributeMetadata`
- `Microsoft.Dynamics.CRM.BooleanAttributeMetadata`
- `Microsoft.Dynamics.CRM.PicklistAttributeMetadata`

For local choice columns, use a non-global `OptionSetMetadata` with `OptionSetType = "Picklist"`. Use the target publisher's option value prefix where possible.

Publish afterwards:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "$base/api/data/v9.2/PublishAllXml" `
  -Headers $headers `
  -Body "{}"
```

### Verification After Metadata Creation

Verify the logical name and schema name:

```powershell
Invoke-RestMethod -Method Get `
  -Uri "$base/api/data/v9.2/EntityDefinitions(LogicalName='tm_mytable')?`$select=LogicalName,SchemaName,MetadataId" `
  -Headers $headers
```

Verify the entity metadata is in the intended solution:

```powershell
$solution = Invoke-RestMethod -Method Get `
  -Uri "$base/api/data/v9.2/solutions?`$select=solutionid,uniquename,friendlyname,_publisherid_value&`$filter=uniquename eq '<solution-unique-name>'" `
  -Headers $headers

$solutionId = $solution.value[0].solutionid
$entity = Invoke-RestMethod -Method Get `
  -Uri "$base/api/data/v9.2/EntityDefinitions(LogicalName='tm_mytable')?`$select=LogicalName,SchemaName,MetadataId" `
  -Headers $headers

Invoke-RestMethod -Method Get `
  -Uri "$base/api/data/v9.2/solutioncomponents?`$select=solutioncomponentid,componenttype,objectid&`$filter=_solutionid_value eq $solutionId and objectid eq $($entity.MetadataId)" `
  -Headers $headers
```

For table metadata, a matching `solutioncomponent` row with the entity `MetadataId` confirms the table is in the solution.

### Cleaning Up Wrong-Prefix Tables

If wrong-prefix tables were created accidentally:

- Prefer deleting only after the correct-prefix replacements have been created and verified.
- Get explicit user approval before destructive deletion.
- Dataverse table deletion is asynchronous. A successful response may say the request was submitted; the table can remain visible for a while.
- Delete only the known wrong-prefix tables, not every table with the environment default prefix.

## Publisher Metadata Checks

In expanded solution XML, inspect:

- `solution.xml`
  - `UniqueName`
  - `LocalizedNames`
  - `Publisher`
  - `CustomizationPrefix`
  - `PublisherUniqueName`

- `customizations.xml`
  - Entity logical names.
  - Attribute logical names.
  - Relationship names.
  - Form/view references.
  - Option set names.

Only patch publisher metadata when that is the goal. Do not mass replace prefixes in every XML file unless the target is a deliberate schema rename.

## Dataverse Verification Queries

Use Dataverse Web API or the available Dataverse MCP/CLI.

Check the solution publisher:

```http
GET /api/data/v9.2/solutions?$select=solutionid,uniquename,friendlyname,_publisherid_value&$filter=uniquename eq '<solution-unique-name>'
```

Check publisher details:

```http
GET /api/data/v9.2/publishers?$select=publisherid,uniquename,customizationprefix,friendlyname&$filter=uniquename eq '<publisher-unique-name>'
```

Check components in the solution:

```http
GET /api/data/v9.2/solutioncomponents?$select=solutioncomponentid,componenttype,objectid&$filter=_solutionid_value eq <solution-id>
```

When verifying table metadata created through Web API, use the entity `MetadataId` as the `objectid` in `solutioncomponent`.

For Copilot Studio components:

```http
GET /api/data/v9.2/botcomponents?$select=botcomponentid,name,schemaname,componenttype,_parentbotid_value,_parentbotcomponentid_value&$filter=_parentbotid_value eq <bot-id>
```

## Safe Repair Paths

### Best Path: Set Publisher Before Creating Components

Use when the user is still early in the build.

1. Create or identify the desired publisher in the target environment.
2. Create the unmanaged solution using that publisher.
3. Create Dataverse tables, columns, relationships, connection references, and Copilot Studio components inside that solution.
4. Verify new component logical names use the desired prefix.

### Practical Path: Move Existing Components Into Desired Solution

Use when components exist but their logical names are acceptable.

1. Add existing components to the intended unmanaged solution.
2. Ensure dependencies are included.
3. Set the solution publisher to the desired publisher if allowed.
4. Export/import the unmanaged solution.
5. Accept that existing logical names may retain their original prefix if they were already created.

### Packaging Path: Patch Unmanaged Export Before Import

Use when the target environment must show the desired publisher even though the source used the default publisher.

1. Export unmanaged.
2. Expand the zip.
3. Patch solution-level publisher metadata to the desired publisher/prefix.
4. Repack the zip with the original folder structure.
5. Import into the target.
6. Verify the target solution publisher and components.

This can make the solution look like it belongs to the desired publisher, but it does not automatically make already-created logical names change prefix.

### Schema Rename Path: Only With Explicit Consent

Use only when the user explicitly wants internal logical names changed from default prefix to desired prefix.

Before renaming:

- Inventory all tables, columns, relationships, forms, views, workflows, bot YAML, connection references, apps, and code using the old names.
- Plan a dependency-aware replacement.
- Export backups.
- Validate import in a non-production target first.

Never do a blind text replace from one prefix to another across a solution zip.

## Copilot Studio Notes

Copilot Studio often creates `botcomponent` rows using the bot's publisher/schema root. To keep components aligned:

- Keep the bot and child components in the intended unmanaged solution.
- Add child botcomponents and tool botcomponents to the solution after creation.
- Verify `solutioncomponent` rows include component type `10224` for bot components.
- Verify connection references are in the same solution where appropriate.
- If a copied Dataverse MCP tool uses the right connection reference but fails at runtime, check `botcomponent_connectionreference` dependencies.

## Import Safety

Before import:

- Keep the original exported zip.
- Keep the expanded patched folder.
- Generate a new zip rather than overwriting the original.
- Import into a non-production or training environment first.
- Watch for missing dependencies, invalid relationship references, and duplicate component names.

After import:

- Open the solution in maker portal.
- Confirm publisher and prefix.
- Run Dataverse queries for solution and publisher.
- Open model-driven forms/views or Copilot Studio agents that depend on the components.
- Test runtime behavior, not just metadata.

## What To Tell The User

Be explicit about the distinction:

- "I can make the solution metadata use the desired publisher."
- "Existing logical names may still keep the prefix they were created with."
- "Changing logical names is a separate schema migration and carries dependency risk."

If the user asks whether the solution can look like it was originally created under `tm_`, explain that solution-level publisher metadata can be corrected for import, but already-created component schema names may reveal their original prefix unless a controlled rename/migration is performed.
