# SharePoint Data Source Setup

Use this guide when a Power Apps Canvas app will use SharePoint lists as the MVP data layer.

## What This Sets Up

For XMarque Workforce, the setup creates a Microsoft 365 group-connected SharePoint team site
and provisions the MVP lists, fields, lookup relationships, and delegated filter indexes.

Current site:

```text
https://xhubafrica.sharepoint.com/sites/xmarqueworkforce
```

## Prerequisites

- Microsoft 365 CLI (`m365`)
- Azure CLI (`az`) signed in as a user with permission to create Microsoft 365 groups/sites
- A reviewed `dashboard/state/data-model.json` with SharePoint entities

Check login state:

```powershell
m365 status
az account show
```

If Microsoft 365 CLI is logged out, use device-code login. Browser login can fail for
tenant-local app registrations configured as confidential clients.

```powershell
m365 login --authType deviceCode --tenant YOUR_TENANT_ID
```

## Create the Site

If the site does not exist, create a private Microsoft 365 group. SharePoint will provision
the connected team site shortly after group creation.

```powershell
$mailNickname = "xmarqueworkforce"

az rest `
  --method POST `
  --url "https://graph.microsoft.com/v1.0/groups" `
  --headers "Content-Type=application/json" `
  --body (@{
    displayName     = "XMarque Workforce"
    mailEnabled     = $true
    mailNickname    = $mailNickname
    securityEnabled = $false
    groupTypes      = @("Unified")
    visibility      = "Private"
  } | ConvertTo-Json)
```

Then verify the site:

```powershell
m365 spo site get --url "https://YOUR_TENANT.sharepoint.com/sites/xmarqueworkforce"
```

## Provision Lists and Columns

Run the repeatable provisioning script from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\create-xmarque-sharepoint-lists.ps1
```

The script is idempotent:

- Existing lists are reused.
- Existing fields are skipped.
- Lookup fields are wired to the created list IDs.
- `TimesheetEntries` is skipped unless `-IncludePhase2` is passed.
- A summary is written to `sharepoint/xmarque-sharepoint-provisioning-summary.json`.

To rerun only index creation/repair:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\create-xmarque-sharepoint-lists.ps1 -IndexesOnly
```

## Lessons Learned

- SharePoint may assign internal names such as `Resource_x0020_Type` even when the design model
  uses a cleaner logical name like `ResourceType`. Scripts should resolve fields from the live
  list by internal name, static name, or display title before updating indexes.
- Indexing is safest as a separate idempotent pass. Use `-IndexesOnly` after first provisioning
  or after partial failures.
- Prefer indexed equality, lookup, and date-range filters in Canvas apps. Avoid broad non-delegable
  search over large SharePoint lists.

## Verification

Verify every field marked `indexed` in `dashboard/state/data-model.json`:

```powershell
$site = "https://xhubafrica.sharepoint.com/sites/xmarqueworkforce"
$model = Get-Content .\dashboard\state\data-model.json -Raw | ConvertFrom-Json

foreach ($entity in $model.entities | Where-Object { $_.source -eq "SharePoint" -and $_.status -ne "phase 2 candidate" }) {
    $fields = m365 spo field list --webUrl $site --listTitle $entity.name -o json | ConvertFrom-Json
    $missing = @()

    foreach ($field in $entity.fields | Where-Object { $_.indexed }) {
        $match = $fields | Where-Object {
            $_.InternalName -eq $field.name -or
            $_.StaticName -eq $field.name -or
            $_.Title -eq $field.displayName -or
            $_.Title -eq $field.name
        } | Select-Object -First 1

        if (-not $match -or -not $match.Indexed) {
            $missing += "$($entity.name).$($field.name)"
        }
    }

    if ($missing.Count) {
        Write-Host "Missing indexes: $($missing -join ', ')"
    } else {
        Write-Host "All indexes ready: $($entity.name)"
    }
}
```
