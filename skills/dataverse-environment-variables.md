# Dataverse Environment Variables

Environment variables parameterise a Power Platform solution so connection details, site URLs, and list names can be changed per-environment without touching the app or its formulas. Always create them inside a solution, never loose in the environment.

> **⚠️ Fetch-live check**
> Environment variable API behaviour (especially DataSource type and Export=No patterns) may change across Power Platform versions.
> Before using the patterns below, verify against the current Dataverse Web API docs:
> https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/environmentvariabledefinition
> https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/environmentvariablevalue

---

## Key concepts

| Concept | Detail |
|---|---|
| **Definition** | The variable declaration — schema name, type, default value. Entity: `environmentvariabledefinition`. Solution component type: `380` |
| **Value** | The current value — stored in a *separate* entity (`environmentvariablevalue`). Solution component type: `381` |
| **Why two entities?** | Definitions are solution-managed (promoted, versioned). Values are environment-specific overrides that should usually stay out of source control. |
| **Always set the current value** | Set `environmentvariablevalue`, not `defaultvalue` on the definition, for live environment data. |
| **Export value = No** | After `AddSolutionComponent` (which silently adds the value record too), remove the type-381 component from the solution so values don't travel with the ZIP. |

---

## Types and their API codes

| UI label | `type` integer | When to use |
|---|---|---|
| Text | `100000000` | Plain strings, API keys, feature flags |
| Number | `100000001` | Numeric thresholds |
| Boolean | `100000002` | On/off toggles |
| JSON | `100000003` | Structured config blobs |
| **Data Source** | `100000004` | SharePoint site + list, Dataverse table, connector data source |
| Secret | `100000005` | Credentials (stored in Azure Key Vault) |

For SharePoint-backed canvas apps, always use **Data Source** (`100000004`) instead of Text. This gives the app a connector-aware binding instead of a raw string.

---

## Auth — get a Dataverse token

All the calls below need a bearer token for your Dataverse org URL.

```powershell
$orgUrl  = "https://YOURORG.crm.dynamics.com"   # from: pac env who
$token   = (az account get-access-token --resource $orgUrl | ConvertFrom-Json).accessToken
$headers = @{
    Authorization      = "Bearer $token"
    "Content-Type"     = "application/json"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    Prefer             = "return=representation"
}
```

> **Tip:** `az account get-access-token` works against any Dataverse org URL even when the Azure account has no subscription — it only needs tenant membership. The `m365` CLI does **not** have Dataverse consent by default; do not use it for Dataverse calls.

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

$def   = Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/environmentvariabledefinitions" -Headers $headers -Body $defBody
$defId = $def.environmentvariabledefinitionid
Write-Host "Definition created: $defId"

# 2 — Set the current value
$valBody = @{
    value      = "the-actual-value"
    schemaname = "prefix_MyVariableName"
    "EnvironmentVariableDefinitionId@odata.bind" = "/environmentvariabledefinitions($defId)"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/environmentvariablevalues" -Headers $headers -Body $valBody | Out-Null
Write-Host "Current value set"

# 3 — Add definition to the solution
$addBody = @{
    ComponentId               = $defId
    ComponentType             = 380
    SolutionUniqueName        = "YourSolutionUniqueName"
    AddRequiredComponents     = $false
    DoNotIncludeSubcomponents = $false
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/AddSolutionComponent" -Headers $headers -Body $addBody | Out-Null
Write-Host "Added to solution"
```

---

## Creating a DataSource environment variable (SharePoint)

A SharePoint DataSource env var is always a **pair**: one site definition and one or more list definitions linked to it.

```powershell
$spApiId      = "/providers/microsoft.powerapps/apis/shared_sharepointonline"
$solutionName = "YourSolutionUniqueName"

# ── Step 1: Site definition ──────────────────────────────────────────────────
$siteDefBody = @{
    schemaname        = "prefix_SharePointSiteUrl"
    displayname       = "SharePoint Site URL"
    type              = 100000004
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
# Current value = SharePoint list GUID (not the list display name).

$lists = @(
    @{ schema = "prefix_ListOrders";   display = "List: Orders";   guid = "PASTE-SP-LIST-GUID-HERE" }
    @{ schema = "prefix_ListProducts"; display = "List: Products"; guid = "PASTE-SP-LIST-GUID-HERE" }
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

### Get SharePoint list GUIDs in bulk

```powershell
$spSiteUrl = "https://YOURTENANT.sharepoint.com/sites/YourSite"
$spToken   = (az account get-access-token --resource "https://YOURTENANT.sharepoint.com" | ConvertFrom-Json).accessToken

$lists = Invoke-RestMethod \
    -Uri "$spSiteUrl/_api/lists?`$select=Id,Title&`$filter=Hidden eq false" \
    -Headers @{ Authorization = "Bearer $spToken"; Accept = "application/json" }

$lists.value | Select-Object Title, @{ N="Guid"; E={ $_.Id } } | Format-Table -AutoSize
```

---

## Setting Export Value = No

When `AddSolutionComponent` adds a definition (type `380`), it silently also adds the value record (type `381`) to the solution — which sets Export = Yes. Remove the type-381 components to prevent values from travelling with the solution ZIP.

> **Note:** `RemoveSolutionComponent` does not accept `ComponentId`. Pass a `solutioncomponent` entity reference where `solutioncomponentid` is set to the value record's **objectid** — not the junction record ID.

```powershell
# 1 — Get solution GUID
$sol = (Invoke-RestMethod -Uri "$orgUrl/api/data/v9.2/solutions?`$select=solutionid&`$filter=uniquename eq '$solutionName'" -Headers $headers).value | Select-Object -First 1
$solutionId = $sol.solutionid

# 2 — Get all type-381 component objectids
$components = (Invoke-RestMethod -Uri "$orgUrl/api/data/v9.2/solutioncomponents?`$filter=_solutionid_value eq '$solutionId' and componenttype eq 381&`$select=objectid" -Headers $headers).value
Write-Host "Found $($components.Count) value components"

# 3 — Remove each one (use objectid as solutioncomponentid — counterintuitive but correct)
foreach ($comp in $components) {
    $removeBody = @{
        SolutionComponent = @{
            "@odata.type"         = "Microsoft.Dynamics.CRM.solutioncomponent"
            "solutioncomponentid" = $comp.objectid
        }
        ComponentType      = 381
        SolutionUniqueName = $solutionName
    } | ConvertTo-Json -Depth 3

    $result = Invoke-RestMethod -Method POST -Uri "$orgUrl/api/data/v9.2/RemoveSolutionComponent" -Headers $headers -Body $removeBody
    Write-Host "Removed: $($comp.objectid)"
}

# 4 — Verify: only definitions (380) should remain
$remaining = (Invoke-RestMethod -Uri "$orgUrl/api/data/v9.2/solutioncomponents?`$filter=_solutionid_value eq '$solutionId'&`$select=componenttype" -Headers $headers).value
$remaining | Group-Object componenttype | Select-Object @{ N="Type"; E={ $_.Name } }, Count
# Expected: Type=380, Count=N  (no 381 rows)
```

---

## Verify everything looks right

```powershell
# List all definitions
$defs = (Invoke-RestMethod -Uri "$orgUrl/api/data/v9.2/environmentvariabledefinitions?`$select=displayname,schemaname,type,parameterkey&`$orderby=displayname" -Headers $headers).value
$defs | Select-Object displayname, schemaname, type, parameterkey | Format-Table -AutoSize

# Check current values
$vals = (Invoke-RestMethod -Uri "$orgUrl/api/data/v9.2/environmentvariablevalues?`$select=schemaname,value" -Headers $headers).value
$vals | Format-Table -AutoSize
```

---

## Gotchas and known issues

| Issue | Explanation |
|---|---|
| `m365 cli` can't reach Dataverse | The m365 CLI app typically doesn't have Dataverse API consent. Use `az account get-access-token --resource <orgUrl>` instead. |
| `az account get-access-token` fails | Run `az login --allow-no-subscriptions` — required when the Azure account has no subscription but is a tenant member. |
| DataSource list value is a GUID, not a name | The current value for a list-type (`parameterkey = "table"`) env var is the SharePoint list GUID, not its display name. |
| `AddSolutionComponent` auto-adds value records | After adding a definition (type 380), the API silently also adds the value (type 381). Run the Export=No removal step immediately after. |
| `RemoveSolutionComponent` rejects `ComponentId` | Use the `SolutionComponent` entity parameter with the value record's `objectid` as the `solutioncomponentid` key. |
| Type-381 removal does not delete the value | Removing the value from the solution only flips Export=No. The current value still exists and is still active. |
| Default value vs current value | Always set `environmentvariablevalue`. The `defaultvalue` field on the definition travels with the solution — leave it empty for environment-specific data. |
| DataSource parent binding required | List definitions must reference the site definition via `"ParentDefinitionId@odata.bind"`. Without this, the UI cannot resolve the site→list dropdown. |
