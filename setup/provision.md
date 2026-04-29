# Provisioning Power Platform Resources

This file is read by the AI agent during Phase 2E.

The goal is to make sure the user has a working environment, solution, and canvas app
**before** asking them to open Power Apps Studio. Only create what does not already exist.

---

## What this phase covers

| Resource | CLI / API to use | When to create |
|---|---|---|
| Power Platform environment | `pac admin create` | No suitable environment exists |
| Dataverse solution | Dataverse Web API | No solution exists in the chosen environment |
| Canvas app (blank) | Power Apps REST API → `pac canvas list` | No app exists in the solution |
| Edit link | Constructed from environment + app ID | Always — hand this to the user |

---

## Step 1 — Check for an existing environment

```powershell
# List all environments the signed-in account can access
pac env list
```

**Ask the user:**
> "Here are the environments on your account. Do you want to use one of these for this project,
> or should I create a new one?"

If they want to use an existing one:
```powershell
# Select the environment by name or ID
pac env select --environment "CHOSEN_ENV_NAME_OR_ID"

# Capture the environment ID for later steps
$envDetails = pac env who --json | ConvertFrom-Json
$environmentId = $envDetails.environmentId
$orgUrl        = $envDetails.instanceUrl   # e.g. https://myorg.crm.dynamics.com
Write-Host "Using environment: $environmentId"
Write-Host "Org URL: $orgUrl"
```

If they want a new one:

```powershell
# Create a new Developer or Sandbox environment
# Developer type = free for individual developers
# Sandbox type   = for team development / testing
# Replace the name and region with what the user wants

$envName   = "MyProject-Dev"   # ask the user for a name
$envType   = "Developer"       # or "Sandbox", "Production"
$envRegion = "unitedstates"    # nearest Azure region to the user

pac admin create `
    --name        $envName `
    --type        $envType `
    --region      $envRegion `
    --currency    USD `
    --language    1033

Write-Host "Environment creation started. This can take 2-5 minutes..."

# Wait for it to be ready, then select it
pac env list  # run again and pick the new environment
pac env select --environment $envName
```

Official reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/admin#pac-admin-create

**Note:** Creating environments requires the Power Platform Admin role or Global Admin.
If the user gets a permission error, they should use an existing environment instead.

---

## Step 2 — Check for an existing solution

```powershell
# List all solutions in the currently selected environment
pac solution list
```

If a suitable solution already exists, note its unique name — you will need it in Step 3 and when building the app.

If no solution exists (or the user wants a new one for this project):

```powershell
# Get an access token to call the Dataverse Web API
# az CLI is needed for this step — install it from setup/prerequisites.md if not present
$orgUrl = "https://YOURORG.crm.dynamics.com"   # from pac env who output above

$token = (az account get-access-token `
    --resource "$orgUrl" `
    --query accessToken `
    --output tsv)

if (-not $token) {
    Write-Host "Could not get a token. Make sure you are signed in to Azure CLI (az login) and the correct subscription is selected."
    exit
}

# Find the default publisher in this environment (every environment has one)
$publisherResponse = Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/publishers?`$select=publisherid,uniquename,customizationprefix&`$filter=isreadonly eq false" `
    -Headers @{ Authorization = "Bearer $token"; Accept = "application/json" }

# Use the first non-system publisher
$publisher     = $publisherResponse.value | Select-Object -First 1
$publisherId   = $publisher.publisherid
$publisherPrefix = $publisher.customizationprefix
Write-Host "Using publisher: $($publisher.uniquename) (prefix: $publisherPrefix)"

# Create the solution
$solutionName    = "myprojectsolution"   # ask the user — lowercase, no spaces
$solutionDisplay = "My Project"          # friendly display name

$solutionBody = @{
    uniquename    = $solutionName
    friendlyname  = $solutionDisplay
    version       = "1.0.0.0"
    "publisherid@odata.bind" = "/publishers($publisherId)"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$orgUrl/api/data/v9.2/solutions" `
    -Method POST `
    -Headers @{
        Authorization  = "Bearer $token"
        "Content-Type" = "application/json"
        Prefer         = "return=representation"
    } `
    -Body $solutionBody

Write-Host "Solution '$solutionDisplay' created"
```

Official reference: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/solution

---

## Step 3 — Check for an existing canvas app

```powershell
# List all canvas apps in the currently selected environment
pac canvas list
```

If the app already exists, note the App ID from the list — you can skip creation.

If no app exists for this project, create one using the Power Apps REST API:

```powershell
# Get a token for the Power Apps API (different resource from Dataverse)
$powerAppsToken = (az account get-access-token `
    --resource "https://service.powerapps.com/" `
    --query accessToken `
    --output tsv)

$appName       = "My Project App"   # ask the user for a name
$newAppId      = [System.Guid]::NewGuid().ToString()

# Create a blank canvas app in the environment
# layout: "tablet" or "phone" — ask the user which form factor they want
$appBody = @{
    displayName = $appName
    properties  = @{
        appUris = @{
            documentUri = @{
                value = ""
            }
        }
    }
} | ConvertTo-Json -Depth 5

try {
    $appResponse = Invoke-RestMethod `
        -Uri "https://api.powerapps.com/providers/Microsoft.PowerApps/environments/$environmentId/apps/$newAppId`?api-version=2016-11-01" `
        -Method PUT `
        -Headers @{
            Authorization  = "Bearer $powerAppsToken"
            "Content-Type" = "application/json"
        } `
        -Body $appBody

    $appId = $appResponse.name
    Write-Host "Canvas app created: $appId"

} catch {
    # API creation is the preferred route, but if it fails fall back to manual creation
    Write-Host "Could not create the app automatically via API."
    Write-Host ""
    Write-Host "Please create it manually — it takes about 30 seconds:"
    Write-Host "  1. Go to: https://make.powerapps.com"
    Write-Host "  2. Select environment: $environmentId"
    Write-Host "  3. Click '+ Create' → 'Blank app' → 'Blank canvas app'"
    Write-Host "  4. Give it the name: $appName"
    Write-Host "  5. Choose Tablet or Phone layout"
    Write-Host "  6. Click Create"
    Write-Host "  7. Copy the URL from your browser and paste it here"
    Write-Host ""
    Write-Host "Once the app is open in Studio, paste the URL and I will extract the App ID."
}
```

**Note:** The Power Apps REST API is functional but not all options are publicly documented.
If the API call fails, the manual 6-step fallback above always works and takes under a minute.

---

## Step 4 — Add the app to the solution

If the app was just created (not already in a solution), add it:

```powershell
# Add the canvas app as a component of the solution
# componentType 300 = canvas app
pac solution add-solution-component `
    --solution-name $solutionName `
    --component     $appId `
    --component-type 300

Write-Host "App added to solution: $solutionName"
```

---

## Step 5 — Give the user the edit link

```powershell
# If you have both IDs, construct the link directly
$editLink = "https://make.powerapps.com/e/$environmentId/canvas/?action=edit&app-id=$appId"
Write-Host ""
Write-Host "Your canvas app is ready."
Write-Host "Edit link: $editLink"
Write-Host ""
Write-Host "Open this link in your browser to enter Power Apps Studio."
Write-Host "Once it is open, come back here and tell me — I will connect to the Canvas MCP and start building."
```

---

## Summary of what you will have after this phase

| Item | Where it lives |
|---|---|
| Power Platform environment | Your tenant — visible in make.powerapps.com |
| Solution | Inside that environment — the container for all the app components |
| Canvas app | Inside the solution — blank, ready to build |
| Edit link | The URL to open in Power Apps Studio so the Canvas MCP can connect |