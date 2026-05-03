# Azure DevOps — Project, Work Items, and Tracking Queries

This file is read by the AI agent when setting up project tracking.

Azure DevOps (ADO) is Microsoft's project management and CI/CD platform. In the context of
Power Platform development it gives the team:
- A structured **backlog** of Epics → Features → User Stories
- **Sprint planning** and progress tracking
- **Pipelines** for automated solution deployment (as an alternative to GitHub Actions)
- **Repos** for solution source files (as an alternative to GitHub)

---

## Before you start — ask the user these questions

> "I'd like to set up your project tracking in Azure DevOps so your team can plan and track
> the work. A couple of questions:
>
> 1. **Organisation** — Azure DevOps lives at dev.azure.com/[your-org-name]. Do you already
>    have an Azure DevOps organisation? If yes, what is the URL? If not, I can help you create
>    one at https://dev.azure.com — it only takes a couple of minutes in the browser.
>
> 2. **Project** — Inside the organisation, work is grouped into projects (think of each project
>    as a separate team or product area). Do you already have a project for this app, or should
>    I create a new one? If new, what should it be called?
>
> 3. **Process** — Azure DevOps offers a few different ways to organise work:
>    - **Agile** — Epics → Features → User Stories → Tasks (recommended for most teams)
>    - **Scrum** — Epics → Features → Product Backlog Items → Tasks
>    - **CMMI** — more formal, good for regulated industries
>    Which would you prefer? If you're not sure, Agile is a safe default."

---

## Step 0 — Install the Azure DevOps CLI extension

The Azure CLI (`az`) has a DevOps extension that handles most ADO operations.

```powershell
# Check if the extension is already installed — only install if it's missing
$extensions = az extension list --output json 2>&1 | ConvertFrom-Json
if ($extensions.name -contains "azure-devops") {
    Write-Host "Azure DevOps CLI extension already installed — skipping"
} else {
    az extension add --name azure-devops
    Write-Host "Azure DevOps CLI extension installed"
}
```

Then set defaults so you don't have to repeat the org and project in every command:

```powershell
# Replace these with the values the user provided
$adoOrg     = "https://dev.azure.com/YOUR_ORG_NAME"
$adoProject = "YOUR_PROJECT_NAME"

az devops configure --defaults organization=$adoOrg project=$adoProject
Write-Host "Azure DevOps defaults set: $adoOrg / $adoProject"
```

Official reference: https://learn.microsoft.com/en-us/azure/devops/cli/

---

## Step 1 — Check if the project already exists

```powershell
# List all projects in the organisation
$projects = az devops project list --output json 2>&1 | ConvertFrom-Json
$projects.value | Select-Object name, id, state

# Check whether the user's project is already there
$existingProject = $projects.value | Where-Object { $_.name -eq $adoProject }

if ($existingProject) {
    Write-Host "Project '$adoProject' already exists — using it"
} else {
    Write-Host "Project '$adoProject' not found — will create it in the next step"
}
```

---

## Step 2 — Create the project (only if it does not exist)

```powershell
# Create the project
# --process: Agile | Scrum | CMMI  (use what the user chose; default Agile)
# --visibility: private | public

az devops project create `
    --name        $adoProject `
    --description "Power Platform project for [app name]" `
    --process     "Agile" `
    --visibility  private

Write-Host "Project created: $adoProject"

# Re-apply defaults now the project exists
az devops configure --defaults organization=$adoOrg project=$adoProject
```

Official reference: https://learn.microsoft.com/en-us/azure/devops/cli/quick-reference#work-items

---

## Step 3 — Create Epics

Epics are the top-level work items. Each represents a major capability of the app.
Derive these from what the user described when they told you what they want to build.

> Before creating anything, tell the user:
> "I'm going to create some high-level areas of work to structure your backlog.
> Here's what I'm planning: [list the Epics you intend to create].
> Does that look right, or would you like to change anything?"

Wait for confirmation, then create:

```powershell
# Create an Epic and save its ID so Features can be linked to it
$epic1 = az boards work-item create `
    --title       "User Authentication and Permissions" `
    --type        "Epic" `
    --description "All work related to how users sign in, what they can see, and what they can do." `
    --output json | ConvertFrom-Json

Write-Host "Epic created: $($epic1.id) — $($epic1.fields.'System.Title')"
$epic1Id = $epic1.id

# Add more Epics as needed based on the app description
$epic2 = az boards work-item create `
    --title       "Data Management" `
    --type        "Epic" `
    --description "Creating, reading, updating, and deleting records in the app's data sources." `
    --output json | ConvertFrom-Json
$epic2Id = $epic2.id

$epic3 = az boards work-item create `
    --title       "App Screens and Navigation" `
    --type        "Epic" `
    --description "All visible screens the user interacts with and how they move between them." `
    --output json | ConvertFrom-Json
$epic3Id = $epic3.id
```

---

## Step 4 — Create Features linked to Epics

Features are the next level down. Each one is a distinct deliverable inside an Epic.

```powershell
# Create a Feature and link it to its parent Epic
$feat1 = az boards work-item create `
    --title       "Sign-in screen and role-based access" `
    --type        "Feature" `
    --description "Users can sign in with their Microsoft 365 account. Different roles see different screens." `
    --output json | ConvertFrom-Json
$feat1Id = $feat1.id

# "Hierarchy-Reverse" means "set this item's parent to..."
az boards work-item relation add `
    --id            $feat1Id `
    --relation-type "System.LinkTypes.Hierarchy-Reverse" `
    --target-id     $epic1Id
Write-Host "Feature $feat1Id linked to Epic $epic1Id"

# Add more Features linked to their respective Epics
$feat2 = az boards work-item create `
    --title       "Create and edit records" `
    --type        "Feature" `
    --description "Users can add new records and change existing ones." `
    --output json | ConvertFrom-Json
$feat2Id = $feat2.id
az boards work-item relation add --id $feat2Id --relation-type "System.LinkTypes.Hierarchy-Reverse" --target-id $epic2Id

$feat3 = az boards work-item create `
    --title       "Search, filter, and browse records" `
    --type        "Feature" `
    --description "Users can search for records and filter the list by various criteria." `
    --output json | ConvertFrom-Json
$feat3Id = $feat3.id
az boards work-item relation add --id $feat3Id --relation-type "System.LinkTypes.Hierarchy-Reverse" --target-id $epic2Id
```

---

## Step 5 — Create User Stories linked to Features

User Stories describe a single thing a real user needs to do.
Write them from the user's perspective: "As a [person], I want to [action] so that [reason]."

```powershell
# Helper — creates a User Story and links it to a Feature in one step
function New-UserStory {
    param($title, $description, $acceptanceCriteria, $parentFeatureId)

    # Create the story
    $story = az boards work-item create `
        --title       $title `
        --type        "User Story" `
        --description $description `
        --output json | ConvertFrom-Json

    # Add acceptance criteria — the "definition of done" for this story
    az boards work-item update `
        --id     $story.id `
        --fields "Microsoft.VSTS.Common.AcceptanceCriteria=$acceptanceCriteria" | Out-Null

    # Link to its parent Feature
    az boards work-item relation add `
        --id            $story.id `
        --relation-type "System.LinkTypes.Hierarchy-Reverse" `
        --target-id     $parentFeatureId | Out-Null

    Write-Host "User Story created: $($story.id) — $title"
    return $story.id
}

# Examples — replace with real stories that match the user's app
New-UserStory `
    -title              "Sign in with my Microsoft 365 account" `
    -description        "As a user, I want to sign in with my work email so I don't need a separate password." `
    -acceptanceCriteria "When I open the app and tap Sign In, I am taken to the Microsoft login page and returned to the app once done." `
    -parentFeatureId    $feat1Id

New-UserStory `
    -title              "Add a new record" `
    -description        "As a user, I want to fill in a form and save a new record so that it appears in the list." `
    -acceptanceCriteria "When I complete the form and tap Save, the new record appears at the top of the list." `
    -parentFeatureId    $feat2Id

New-UserStory `
    -title              "Search for a record by name" `
    -description        "As a user, I want to type in a search box to find a record quickly without scrolling." `
    -acceptanceCriteria "Typing part of a name filters the list to matching records only." `
    -parentFeatureId    $feat3Id
```

> **Note for the agent:** Do not use the generic examples above literally.
> Generate Epics, Features, and User Stories that are specific to what the user described —
> use their app name, the data fields they mentioned, and the types of users they have.
> The examples only show you the correct structure and syntax.

---

## Step 6 — Create tracking queries

Queries let the team see work by status or area without scrolling through everything manually.

```powershell
# All active work — nothing marked done or removed
az boards query create `
    --name   "Active Work — All Types" `
    --wiql   "SELECT [System.Id],[System.Title],[System.WorkItemType],[System.State],[System.AssignedTo] FROM workitems WHERE [System.TeamProject]=@project AND [System.State] NOT IN ('Done','Closed','Removed') ORDER BY [System.WorkItemType] ASC,[System.ChangedDate] DESC" `
    --path   "Shared Queries"

# User Stories that have not been started yet — the upcoming queue
az boards query create `
    --name   "User Stories — Not Started" `
    --wiql   "SELECT [System.Id],[System.Title],[System.State],[System.AssignedTo] FROM workitems WHERE [System.TeamProject]=@project AND [System.WorkItemType]='User Story' AND [System.State]='New' ORDER BY [System.ChangedDate] DESC" `
    --path   "Shared Queries"

# Everything assigned to the current user that is in progress
az boards query create `
    --name   "My Active Items" `
    --wiql   "SELECT [System.Id],[System.Title],[System.WorkItemType],[System.State] FROM workitems WHERE [System.TeamProject]=@project AND [System.AssignedTo]=@me AND [System.State]='Active' ORDER BY [System.ChangedDate] DESC" `
    --path   "Shared Queries"

# Full Epic → Feature → User Story tree — useful for sprint planning
az boards query create `
    --name   "Full Backlog Hierarchy" `
    --wiql   "SELECT [System.Id],[System.Title],[System.WorkItemType],[System.State],[System.AssignedTo] FROM workitemLinks WHERE [Source].[System.TeamProject]=@project AND [System.Links.LinkType]='System.LinkTypes.Hierarchy-Forward' AND [Target].[System.WorkItemType] IN ('Epic','Feature','User Story') ORDER BY [System.WorkItemType] ASC MODE (Recursive)" `
    --path   "Shared Queries"

Write-Host "Tracking queries created in Shared Queries"
```

Tell the user after this step:
> "Your project backlog is ready. You can view it here:
> $adoOrg/$adoProject/_backlogs/backlog
>
> I've also set up these shared queries for your team:
> - **Active Work** — everything currently in flight
> - **User Stories — Not Started** — the queue of upcoming work
> - **My Active Items** — your own in-progress items
> - **Full Backlog Hierarchy** — the complete Epic → Feature → User Story tree"

---

## Step 7 — Set up an Azure Repos Git repository

Azure DevOps can also host the project's source repo. This is useful when the user wants everything in DevOps: backlog, repo, and pipelines.

Ask:

> "Would you also like me to set up an Azure Repos Git repo for this solution, so you can save the current solution state to DevOps from the dashboard?"

If yes, use an existing repo when possible. If it does not exist and the user has permission, create it:

```powershell
$repoName = $adoProject

# Configure defaults from earlier steps.
az devops configure --defaults organization=$adoOrg project=$adoProject

# Check existing repos first.
$repos = az repos list --organization $adoOrg --project $adoProject --output json | ConvertFrom-Json
$existingRepo = $repos | Where-Object { $_.name -eq $repoName }

if (-not $existingRepo) {
    $existingRepo = az repos create `
        --name $repoName `
        --organization $adoOrg `
        --project $adoProject `
        --output json | ConvertFrom-Json
}

$remoteUrl = $existingRepo.remoteUrl
Write-Host "Azure Repos remote: $remoteUrl"
```

Then configure the local project repo:

```powershell
if (-not (Test-Path .git)) {
    git init
}

$remoteName = "azure"
$branch = "main"

if ((git remote) -contains $remoteName) {
    git remote set-url $remoteName $remoteUrl
} else {
    git remote add $remoteName $remoteUrl
}

git branch -M $branch
git status --short
```

Update `dashboard/state/devops-plan.json`:

```json
{
  "repository": {
    "name": "YOUR_REPO_NAME",
    "remoteName": "azure",
    "remoteUrl": "https://dev.azure.com/ORG/PROJECT/_git/REPO",
    "defaultBranch": "main",
    "localPath": "PROJECT_ROOT"
  }
}
```

If Azure CLI or permissions are blocked, give the user the manual path:

1. Open `https://dev.azure.com/<org>/<project>/_git`.
2. Create or choose a repo.
3. Copy the clone URL.
4. Paste it into the dashboard DevOps tab as **Remote URL**.
5. Click **Set Up Repo**.

---

## No-code dashboard commits

The local dashboard includes DevOps repo controls so a user can save progress without asking an AI agent:

- **Check Status** — shows local Git branch, remotes, changed files, and whether Azure CLI tools are present.
- **Set Up Repo** — configures the Azure Repos remote from the dashboard fields.
- **Commit** — saves all dashboard state, stages current local files, and creates a Git commit.
- **Commit + Push** — commits and pushes to the configured Azure Repos remote.

Safety rules:

- The dashboard server is localhost-only.
- It runs fixed `git` and `az` commands only; it does not expose arbitrary shell command execution.
- It operates only against the project root that contains the `dashboard/` folder.
- It does not store PATs, passwords, or service principal secrets.
- If there are no local changes, it reports "No changes to commit" rather than creating an empty commit.

For this to capture the actual Power Platform solution, the current solution source must already be in the local repo. If the latest app changes only exist in Power Apps Studio/Dataverse, export or sync the solution first, then use **Commit** or **Commit + Push**.

---

## Using the Azure DevOps MCP server during development

Once the project is set up and the MCP server is configured (see `setup/mcp-config.md`),
the AI agent can manage work items automatically as it builds:

| What the agent does | MCP tool used |
|---|---|
| Creates a new work item | `create_work_item` |
| Marks a story Active or Done | `update_work_item` |
| Queries the backlog | `list_work_items` with WIQL |
| Adds a comment to a story | `add_pull_request_comment` |
| Triggers a deployment pipeline | `trigger_pipeline` |
| Checks whether a pipeline succeeded | `get_pipeline_run` |

This means the agent can mark a User Story as "Active" when it starts building a screen,
and mark it "Done" once it verifies the result — keeping the backlog accurate without any
manual updates from the developer.

Official reference: https://learn.microsoft.com/en-us/azure/devops/cli/
Azure DevOps REST API: https://learn.microsoft.com/en-us/rest/api/azure/devops/
