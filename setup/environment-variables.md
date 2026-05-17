# Environment Variables — Setup Guide

This file is read by the AI agent during solution provisioning.

Environment variables let you parameterise a solution so connection details, site URLs,
and list names can be changed per-environment without touching the app. Always create
them in a solution, not loose in the environment.

---

## Key concepts

| Concept | Detail |
|---|---|
| **Definition** | The variable declaration — name, type, default value |
| **Value** | The current value — stored in a *separate* entity (`environmentvariablevalue`) |
| **Export value** | Whether the current value travels with the solution ZIP on export |
| **Solution component type** | Definition = `380`, Value = `381` |

> **Why two entities?** Definitions are solution-managed (promoted, versioned).
> Values are environment-specific overrides that should usually stay out of source control.
> Always set the **current value**, not the default value, for live environment data.

---

## Types and their API codes

| UI label | `type` integer | When to use |
|---|---|---|
| Text | `100000000` | Plain strings, API keys, feature flags |
| Number | `100000001` | Numeric thresholds |
| Boolean | `100000002` | On/off toggles |
| JSON | `100000003` | Structured config blobs |
| **Data Source** | `100000004` | SharePoint site + list, Dataverse table, etc. |
| Secret | `100000005` | Credentials (stored in Azure Key Vault) |

For SharePoint-backed Canvas Apps, always use **Data Source** (`100000004`) instead of Text.
This gives the app a proper connector-aware binding instead of a raw string.

---

## Auth — get a Dataverse token

All the calls below need a bearer token for your Dataverse org URL.
The simplest cross-platform way when `az login` is already done:

```powershell
$orgUrl = "https://YOURORG.crm.dynamics.com"   # from: pac env who

$token = (az account get-access-token --resource $orgUrl | ConvertFrom-Json).accessToken

$headers = @{
    Authorization      = "Bearer $token"
    "Content-Type"     = "application/json"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    Prefer             = "return=representation"
}
```

> **Tip:** `az account get-access-token` works against any Dataverse org URL even when
> the Azure account has no subscription — it only needs tenant membership.
> `m365` CLI does **not** have Dataverse consent by default; do not use it for Dataverse calls.

---

## Creating a Text / Number / Boolean environment variable

```powershell
# 1 — Create the definition
$defBody = @{
    schemaname        = "prefix_MyVariableName"   # use your publisher prefix
    displayname       = "My Variable"
    type              = 100000000                 # 100000000 = Text
    introducedversion = "1.0"
    isrequired        = $false
} | ConvertTo-Json

$def = Invoke-RestMethod `
    -Method POST `
    -Uri "$orgUrl/api/data/v9.2/environmentvariabledefinitions" `
    -Headers $headers `
    -Body $defBody

$defId = $def.environmentvariabledefinitionid
Write-Host "Definition created: $defId"

# 2 — Set the current value (separate entity, linked by OData bind)
$valBody = @{
    value      = "the-actual-value"
    schemaname = "prefix_MyVariableName"
    "EnvironmentVariableDefinitionId@odata.bind" = "/environmentvariabledefinitions($defId)"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method POST `
    -Uri "$orgUrl/api/data/v9.2/environmentvariablevalues" `
    -Headers $headers `
    -Body $valBody | Out-Null

Write-Host "Current value set"

# 3 — Add definition to the solution
$addBody = @{
    ComponentId               = $defId
    ComponentType             = 380
    SolutionUniqueName        = "YourSolutionUniqueName"
    AddRequiredComponents     = $false
    DoNotIncludeSubcomponents = $false
} | ConvertTo-Json

Invoke-RestMethod `
    -Method POST `
    -Uri "$orgUrl/api/data/v9.2/AddSolutionComponent" `
    -Headers $headers `
    -Body $addBody | Out-Null

Write-Host "Added to solution"
```

---

## Creating a Data Source environment variable (SharePoint)

A SharePoint DataSource env var is a **pair**:

1. A **site** definition (`parameterkey = "dataset"`) — stores the site URL as its current value
2. One or more **list** definitions (`parameterkey = "table"`) — each linked to the site definition as its parent, storing the SharePoint list GUID as its current value

```powershell
$spApiId      = "/providers/microsoft.powerapps/apis/shared_sharepointonline"
$solutionName = "YourSolutionUniqueName"

# ── Step 1: Site definition ──────────────────────────────────────────────────
$siteDefBody = @{
    schemaname        = "prefix_SharePointSiteUrl"
    displayname       = "SharePoint Site URL"
    type              = 100000004           # DataSource
    apiid             = $spApiId
    parameterkey      = "dataset"           # "dataset" = site
    introducedversion = "1.0"
    isrequired        = $false
} | ConvertTo-Json

$siteDef   = Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/environmentvariabledefinitions" -Headers $headers -Body $siteDefBody
$siteDefId = $siteDef.environmentvariabledefinitionid

# Current value — the SharePoint site URL
$siteValBody = @{
    value      = "https://YOURTENANT.sharepoint.com/sites/YourSite"
    schemaname = "prefix_SharePointSiteUrl"
    "EnvironmentVariableDefinitionId@odata.bind" = "/environmentvariabledefinitions($siteDefId)"
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/environmentvariablevalues" -Headers $headers -Body $siteValBody | Out-Null

# Add to solution
$addSite = @{ ComponentId = $siteDefId; ComponentType = 380; SolutionUniqueName = $solutionName; AddRequiredComponents = $false; DoNotIncludeSubcomponents = $false } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/AddSolutionComponent" -Headers $headers -Body $addSite | Out-Null

Write-Host "Site definition created: $siteDefId"


# ── Step 2: List definitions (repeat for each list) ──────────────────────────
# Each list definition is parented to the site definition.
# The current value is the SharePoint list GUID (not the list name).
#
# To get all list GUIDs at once — see "How to get SharePoint list GUIDs in bulk" below.

$lists = @(
    @{ schema = "prefix_ListOrders";   display = "List: Orders";   guid = "PASTE-SP-LIST-GUID-HERE" }
    @{ schema = "prefix_ListProducts"; display = "List: Products"; guid = "PASTE-SP-LIST-GUID-HERE" }
    # add more lists here
)

foreach ($l in $lists) {
    $listDefBody = @{
        schemaname        = $l.schema
        displayname       = $l.display
        type              = 100000004
        apiid             = $spApiId
        parameterkey      = "table"         # "table" = list
        introducedversion = "1.0"
        isrequired        = $false
        "ParentDefinitionId@odata.bind" = "/environmentvariabledefinitions($siteDefId)"
    } | ConvertTo-Json

    $listDef   = Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/environmentvariabledefinitions" -Headers $headers -Body $listDefBody
    $listDefId = $listDef.environmentvariabledefinitionid

    $listValBody = @{
        value      = $l.guid
        schemaname = $l.schema
        "EnvironmentVariableDefinitionId@odata.bind" = "/environmentvariabledefinitions($listDefId)"
    } | ConvertTo-Json
    Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/environmentvariablevalues" -Headers $headers -Body $listValBody | Out-Null

    $addList = @{ ComponentId = $listDefId; ComponentType = 380; SolutionUniqueName = $solutionName; AddRequiredComponents = $false; DoNotIncludeSubcomponents = $false } | ConvertTo-Json
    Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/AddSolutionComponent" -Headers $headers -Body $addList | Out-Null

    Write-Host "List definition created: $($l.display) → $listDefId"
}
```

### How to get SharePoint list GUIDs in bulk

```powershell
$spSiteUrl = "https://YOURTENANT.sharepoint.com/sites/YourSite"
$spToken   = (az account get-access-token --resource "https://YOURTENANT.sharepoint.com" | ConvertFrom-Json).accessToken

$lists = Invoke-RestMethod `
    -Uri "$spSiteUrl/_api/lists?`$select=Id,Title&`$filter=Hidden eq false" `
    -Headers @{ Authorization = "Bearer $spToken"; Accept = "application/json" }

$lists.value | Select-Object Title, @{ N="Guid"; E={ $_.Id } } | Format-Table -AutoSize
```

---

## Setting Export Value = No (exclude current values from solution export)

**What "Export value" means:**
When a current value record (`environmentvariablevalue`, component type `381`) is added
to a solution, it travels with that solution when exported. For environment-specific data
(site URLs, list IDs, credentials) you almost always want **Export = No** so the values
do not leak into source control or overwrite another environment on import.

**How it works:** `AddSolutionComponent` for a definition (type `380`) automatically
also adds the value record (type `381`) to the solution — which sets Export = Yes.
To flip it to No, remove the type-`381` components from the solution.

### ⚠️ RemoveSolutionComponent quirk

The `RemoveSolutionComponent` OData action signature looks like this in metadata:

```
Action Name="RemoveSolutionComponent"
  Parameter Name="SolutionComponent"  Type="mscrm.solutioncomponent"
  Parameter Name="ComponentType"      Type="Edm.Int32"
  Parameter Name="SolutionUniqueName" Type="Edm.String"
```

It does **not** accept `ComponentId` (despite some older SDK docs saying so).
It takes a `solutioncomponent` entity reference — but the key field must be set to the
**objectid** of the value record (the `environmentvariablevalue` GUID), **not** the
`solutioncomponentid` of the junction record. This is counterintuitive but correct.

```powershell
# 1 — Get the solution GUID (needed to filter components)
$sol = (Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/solutions?`$select=solutionid&`$filter=uniquename eq '$solutionName'" `
    -Headers $headers).value | Select-Object -First 1
$solutionId = $sol.solutionid

# 2 — Get all value (type 381) solution component objectids
$components = (Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/solutioncomponents?`$filter=_solutionid_value eq '$solutionId' and componenttype eq 381&`$select=objectid" `
    -Headers $headers).value

Write-Host "Found $($components.Count) value components"

# 3 — Remove each one
#     Pass objectid as solutioncomponentid (the counterintuitive part)
foreach ($comp in $components) {
    $removeBody = @{
        SolutionComponent = @{
            "@odata.type"         = "Microsoft.Dynamics.CRM.solutioncomponent"
            "solutioncomponentid" = $comp.objectid   # ← objectid, not solutioncomponentid
        }
        ComponentType      = 381
        SolutionUniqueName = $solutionName
    } | ConvertTo-Json -Depth 3

    $result = Invoke-RestMethod `
        -Method POST `
        -Uri "$orgUrl/api/data/v9.2/RemoveSolutionComponent" `
        -Headers $headers `
        -Body $removeBody

    Write-Host "Removed: $($comp.objectid) → junction $($result.id)"
}

# 4 — Verify: only definitions (380) should remain
$remaining = (Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/solutioncomponents?`$filter=_solutionid_value eq '$solutionId'&`$select=componenttype" `
    -Headers $headers).value

$remaining | Group-Object componenttype | Select-Object @{ N="Type"; E={ $_.Name } }, Count
# Expected: Type=380, Count=N   (no 381 rows = Export value is now No for all)
```

---

## Verify everything looks right

```powershell
# List all env var definitions with types and parent relationships
$defs = (Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/environmentvariabledefinitions?`$select=displayname,schemaname,type,parameterkey,apiid,_parentdefinitionid_value&`$orderby=displayname" `
    -Headers $headers).value

$defs | Select-Object displayname, schemaname, type, parameterkey | Format-Table -AutoSize

# Check current values
$vals = (Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/environmentvariablevalues?`$select=schemaname,value" `
    -Headers $headers).value

$vals | Format-Table -AutoSize
```

---

## Gotchas and known issues

| Issue | Explanation |
|---|---|
| `m365 cli` can't reach Dataverse | The m365 CLI app typically doesn't have Dataverse API consent. Use `az account get-access-token --resource <orgUrl>` instead. |
| `az account get-access-token` fails | Run `az login --allow-no-subscriptions` — the flag is required if the Azure account has no subscription but is a tenant member. |
| DataSource list value is a GUID, not a name | The current value for a list-type (`parameterkey = "table"`) env var is the SharePoint list's GUID, not its display name. |
| `AddSolutionComponent` auto-adds value records | After adding a definition (type 380), the API silently also adds the value (type 381). Run the Export=No removal step immediately after bulk-creating definitions. |
| `RemoveSolutionComponent` rejects `ComponentId` | See the section above. Use the `SolutionComponent` entity parameter with the value record's `objectid` as the `solutioncomponentid` key. |
| Type-381 removal does not delete the value | Removing the value from the solution only flips Export=No. The current value still exists in the environment and is still active. |
| Default value vs current value | Always set the **current value** (`environmentvariablevalue` entity). Default value (`defaultvalue` field on the definition) is a fallback that travels with the solution — leave it empty for environment-specific data. |
| DataSource parent binding | List definitions must reference the site definition via `"ParentDefinitionId@odata.bind"`. Without this, the UI cannot resolve the site→list dropdown relationship. |
