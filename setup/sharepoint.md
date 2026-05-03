# SharePoint — Sites, Lists, and Columns

This file is read by the AI agent when SharePoint is part of the data plan.

SharePoint is Microsoft's collaboration and document platform. In the context of Power Apps:
- A **SharePoint site** is like a dedicated workspace (a mini-website) where your lists and documents live.
- A **SharePoint list** is like a spreadsheet or table — rows of data with typed columns.
- Power Apps can read from and write to SharePoint lists using the built-in SharePoint connector.

---

## Before you start — ask the user these questions

These decisions affect everything below, so get answers before running any commands.

**Ask the user:**

> "For the data we're storing in SharePoint, I need to understand a couple of things first so I
> can set it up correctly:
>
> 1. **SharePoint site** — SharePoint lists live inside a site (think of it like a folder on a
>    website). Do you already have a SharePoint site you want to use, or should I create a new one?
>    If new, what should it be called? (e.g. 'Project Tracker', 'HR Tools', 'Operations')
>
> 2. **Lists** — Each type of data gets its own list (like a table). Based on what you told me
>    earlier, I'm planning these lists: [show the list of planned lists from your data plan].
>    Does that look right? Anything to add or rename?
>
> 3. **Columns** — For each list, I'll set up the columns we discussed. Just to confirm: [show
>    planned columns per list]. Anything missing?
>
> 4. **Access** — Who should be able to use these lists? (e.g. everyone in the company, just your
>    team, only specific people)"

---

## Step 0 — Check m365 sign-in and get your tenant URL

```powershell
# Check if already signed in
$status = m365 status 2>&1
if ($status -match "Logged in") {
    Write-Host "Already signed in to Microsoft 365 — skipping login"
} else {
    # Opens a browser window for the user to sign in
    m365 login
    Write-Host "Signed in to Microsoft 365"
}

# Get your SharePoint tenant root URL — you need this for all commands below
m365 spo get
# Note the 'spoUrl' value — e.g. https://contoso.sharepoint.com
# Save it as a variable
$tenantUrl = "https://YOURTENANT.sharepoint.com"  # replace with the spoUrl from above
```

---

## Step 1 — Decide: new site or existing site

```powershell
# If the user said they already have a site, just confirm it exists
$siteUrl = "$tenantUrl/sites/YOUR_SITE_NAME"
m365 spo site get --url $siteUrl 2>&1
# If this returns site info, the site exists — skip Step 2

# If it errors with "does not exist", continue to Step 2
```

---

## Step 2 — Create the site (if needed)

There are two types of SharePoint site. Explain this to the user if they are unsure:

> "There are two site types:
> - **Team site** — connected to a Microsoft 365 group; great for a team that will collaborate,
>   share files, and use other Microsoft 365 tools together (Teams, Planner, etc.)
> - **Communication site** — standalone, no group; better for a portal or tool that many people
>   will read from but fewer people will manage."

```powershell
# --- Option A: Team site (creates a Microsoft 365 group too) ---
# The --alias becomes the group email address (e.g. projecttracker@contoso.com)
# Use lowercase, no spaces

$siteTitle = "Project Tracker"    # display name shown at top of the site
$siteAlias = "projecttracker"     # used for the URL and the M365 group email

m365 spo site add `
    --title       $siteTitle `
    --alias       $siteAlias `
    --type        TeamSite `
    --description "SharePoint site for the $siteTitle Power App"

$siteUrl = "$tenantUrl/sites/$siteAlias"
Write-Host "Team site created: $siteUrl"

# --- Option B: Communication site (no group, standalone) ---
$siteTitle = "Project Tracker"
$siteName  = "projecttracker"   # used in the URL

m365 spo site add `
    --title       $siteTitle `
    --url         "$tenantUrl/sites/$siteName" `
    --type        CommunicationSite `
    --description "SharePoint site for the $siteTitle Power App"

$siteUrl = "$tenantUrl/sites/$siteName"
Write-Host "Communication site created: $siteUrl"
```

Note: Site creation can take 30–60 seconds. If you get a "provisioning" message, wait and check again with `m365 spo site get --url $siteUrl`.

Official reference: https://pnp.github.io/cli-microsoft365/cmd/spo/site/site-add/

---

## Step 3 — Check if lists already exist

```powershell
# Get all lists on the site to see what's already there
m365 spo list list --webUrl $siteUrl --output json | ConvertFrom-Json | Select-Object Title, BaseType
# BaseType 0 = Generic list, BaseType 1 = Document library
```

---

## Step 4 — Create lists

```powershell
# Create a custom list (generic — like a table with rows and columns)
$listTitle = "Tasks"    # change to your list name

m365 spo list add `
    --title        $listTitle `
    --baseTemplate GenericList `
    --webUrl       $siteUrl

Write-Host "List created: $listTitle"

# Create a document library (if the app needs file storage)
m365 spo list add `
    --title        "Documents" `
    --baseTemplate DocumentLibrary `
    --webUrl       $siteUrl
```

Official reference: https://pnp.github.io/cli-microsoft365/cmd/spo/list/list-add/

---

## Step 5 — Add columns to lists

Every list already has a **Title** column. Add the additional columns that your data plan requires.

Tell the user what you're adding as you go:
> "I'm adding [column name] as a [type] column to [list name]."

```powershell
# --- Text column (short text, up to 255 characters) ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="Text" DisplayName="Status" Name="Status" />'

# --- Multi-line text column ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="Note" DisplayName="Description" Name="Description" />'

# --- Choice column (dropdown with fixed options) ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="Choice" DisplayName="Priority" Name="Priority">
              <CHOICES>
                <CHOICE>High</CHOICE>
                <CHOICE>Medium</CHOICE>
                <CHOICE>Low</CHOICE>
              </CHOICES>
           </Field>'

# --- Date column ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="DateTime" DisplayName="Due Date" Name="DueDate" />'

# --- Number column ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="Number" DisplayName="Estimated Hours" Name="EstimatedHours" />'

# --- Person column (picks a user from the directory) ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="User" DisplayName="Assigned To" Name="AssignedTo" />'

# --- Yes/No (boolean) column ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="Boolean" DisplayName="Completed" Name="Completed" />'

# --- Lookup column (references a row in another list on the same site) ---
# First, get the ID of the source list:
$sourceLists = m365 spo list list --webUrl $siteUrl --output json | ConvertFrom-Json
$sourceListId = ($sourceLists | Where-Object { $_.Title -eq "Projects" }).Id

m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml "<Field Type='Lookup' DisplayName='Project' Name='ProjectId' List='$sourceListId' ShowField='Title' />"

# --- Currency column ---
m365 spo field add `
    --webUrl   $siteUrl `
    --listTitle $listTitle `
    --xml '<Field Type="Currency" DisplayName="Budget" Name="Budget" LCID="1033" />'
```

Official reference: https://pnp.github.io/cli-microsoft365/cmd/spo/field/field-add/

---

## Repeatable provisioning from the dashboard data model

For real projects, prefer the reusable helper script instead of hand-running one-off
`m365 spo list add` and `m365 spo field add` commands:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\create-sharepoint-lists-from-data-model.ps1 `
  -SiteUrl "https://YOURTENANT.sharepoint.com/sites/YOURSITE" `
  -DataModelPath ".\dashboard\state\data-model.json"
```

The data model should define SharePoint entities like this:

```json
{
  "entities": [
    {
      "name": "Projects",
      "displayName": "Projects",
      "source": "SharePoint",
      "fields": [
        { "name": "Title", "displayName": "Project Name", "type": "Text", "required": true, "indexed": true },
        { "name": "Priority", "displayName": "Priority", "type": "Choice", "choices": ["High", "Medium", "Low"], "indexed": true },
        { "name": "StartDate", "displayName": "Start Date", "type": "Date", "indexed": true }
      ]
    },
    {
      "name": "Tasks",
      "displayName": "Tasks",
      "source": "SharePoint",
      "fields": [
        { "name": "Title", "displayName": "Task Name", "type": "Text", "required": true, "indexed": true },
        { "name": "Project", "displayName": "Project", "type": "Lookup", "lookupList": "Projects", "indexed": true }
      ]
    }
  ]
}
```

Supported field types:

- `Text`
- `MultilineText`
- `Choice`
- `Date`
- `DateTime`
- `Number`
- `Boolean`
- `Person`
- `Hyperlink`
- `Currency`
- `Lookup`

Use `-IndexesOnly` to repair indexes after a partial run or after adding `indexed: true`
to fields in the data model:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\scripts\create-sharepoint-lists-from-data-model.ps1 `
  -SiteUrl "https://YOURTENANT.sharepoint.com/sites/YOURSITE" `
  -IndexesOnly
```

Lessons learned from live provisioning:

- If `m365 login --authType browser` fails because of app registration/client type issues, use
  `m365 login --authType deviceCode --tenant <tenant-id>`.
- Create all lists before adding lookup fields, because lookup field XML needs the target list ID.
- Make list creation idempotent: list existing lists first and reuse matching titles.
- SharePoint can change field internal names. For example, a model field named `StartDate` may
  become `Start_x0020_Date` if the display name is `Start Date`. Resolve live fields by
  `InternalName`, `StaticName`, or display `Title` before setting indexes or updating fields.
- Treat indexing as a separate pass. It is common for field creation to succeed while some indexes
  need a second run after SharePoint finishes materializing the columns.
- Write a provisioning summary file so later agents know the real site URL, list IDs, and list URLs.

---

## Step 6 — Set permissions (if needed)

By default, the site inherits permissions from the SharePoint admin and the site owners. If
specific people need access, add them now:

```powershell
# Add a user to the site as a member (can read and edit)
m365 spo site user add `
    --siteUrl    $siteUrl `
    --userEmail  "user@contoso.com"

# Add a group to the site as visitors (can read only)
m365 spo site group list --siteUrl $siteUrl  # see existing groups first
```

---

## App registration for unattended / automated access

> **Only needed if** the app uses a Power Automate flow that runs unattended (without a signed-in
> user), or if a background script needs to read/write SharePoint lists automatically.
> You do **not** need this for normal Power Apps → SharePoint connector usage — that uses the
> signed-in user's own credentials.

If the user says yes to unattended access:

```powershell
# Explain to the user:
# "To let automation run without a user signing in, we need to register a small application
#  in Azure Active Directory and give it permission to access SharePoint. This is like giving
#  the automation its own login credentials."

# Step 1: Create the app registration
$appName = "MyProject-SharePoint-Automation"  # descriptive name

$appResult = az ad app create `
    --display-name $appName `
    --sign-in-audience AzureADMyOrg 2>&1 | ConvertFrom-Json

$appId = $appResult.appId
Write-Host "App registered. App ID: $appId"

# Step 2: Create a client secret (the "password" for the app)
$secretResult = az ad app credential reset `
    --id $appId `
    --years 2 2>&1 | ConvertFrom-Json

$clientSecret = $secretResult.password
$tenantId     = $secretResult.tenant
Write-Host "Client secret created. Store it now — it is shown only once."
Write-Host "App ID:        $appId"
Write-Host "Client Secret: $clientSecret"
Write-Host "Tenant ID:     $tenantId"

# Step 3: Grant SharePoint application permissions
# Sites.ReadWrite.All — lets the app read and write to any SharePoint site in the tenant
az ad app permission add `
    --id         $appId `
    --api        "00000003-0000-0ff1-ce00-000000000000" `
    --api-permissions "9bff6588-13f2-4c48-bbf2-ddab62256b36=Role"  # Sites.ReadWrite.All

# Step 4: Grant admin consent (a Global Admin must approve this — tell the user)
Write-Host "Admin consent required. Ask your Microsoft 365 admin to go to:"
Write-Host "https://portal.azure.com → App registrations → $appName → API permissions → Grant admin consent"

# Alternatively, if the agent has admin rights:
az ad app permission admin-consent --id $appId
```

Store the app ID, client secret, and tenant ID as GitHub secrets or environment variables —
the same way as done in `setup/github-integration.md`.

Official reference: https://learn.microsoft.com/en-us/sharepoint/dev/solution-guidance/security-apponly-azuread

---

## Connecting a SharePoint list to Power Apps

Once the lists are created, the Power Apps Canvas Authoring MCP (or the Studio UI) connects them:

In Power Apps Studio:
**Data panel → Add data → SharePoint → enter site URL → select the lists you need**

Or via the Canvas Authoring MCP when building — reference the SharePoint connector and the site URL.

**Delegation reminder:** SharePoint delegation is limited compared to Dataverse. Always read
`skills/delegation.md` before building any gallery or search over a SharePoint list. Key limits:
- `Filter` delegates only for: `=`, `<>`, `<`, `>`, `<=`, `>=` on a single column
- `Search` on SharePoint delegates only on the **Title** column
- If the list may grow beyond ~2,000 rows, consider using Dataverse instead

---

## Summary — what you can create via m365 CLI

| What | Command |
|---|---|
| Check SharePoint tenant URL | `m365 spo get` |
| Create a team site | `m365 spo site add --type TeamSite` |
| Create a communication site | `m365 spo site add --type CommunicationSite` |
| Create a list | `m365 spo list add` |
| Add a column | `m365 spo field add` |
| List all lists on a site | `m365 spo list list --webUrl` |
| Add a user to a site | `m365 spo site user add` |
| Create app registration (for automation) | `az ad app create` + `az ad app permission add` |

Full m365 CLI reference: https://pnp.github.io/cli-microsoft365/
