# GitHub Integration — Power Platform Solution Source Control

This file is read by the AI agent during Phase 2G.

The goal is to connect the user's Power Platform solution to a GitHub repo so that:
- Solution source files are tracked in version control
- Changes can be exported from the dev environment and committed automatically
- Solutions can be deployed to test and production environments via GitHub Actions
- The AI agent can use the GitHub MCP to manage branches, PRs, and releases

---

## What you will set up

| Component | What it does |
|---|---|
| GitHub repo | Stores unpacked solution source files and workflow definitions |
| Service principal | Allows GitHub Actions to authenticate to Power Platform without a user login |
| GitHub secrets | Stores the service principal credentials securely in the repo |
| Export workflow | Exports and unpacks the solution from dev → commits to a branch |
| Deploy workflow | Packs the solution and imports it to test / production on merge to main |

---

## Step 1 — Create the GitHub repo (if it does not already exist)

```powershell
# Check if a repo already exists for this solution
$repoName   = "my-project-solution"  # ask the user — kebab-case, descriptive
$repoOrg    = ""                      # leave empty for personal account, or set to org name

gh repo list --limit 50 | Select-String $repoName

# If it does not exist, create it
if ($repoOrg) {
    gh repo create "$repoOrg/$repoName" --private --description "Power Platform solution source" --clone
} else {
    gh repo create $repoName --private --description "Power Platform solution source" --clone
}

# Navigate into the repo
Set-Location $repoName
```

---

## Step 2 — Create a service principal for GitHub Actions

GitHub Actions runs headlessly — it cannot open a browser to sign in. A service principal
gives it a permanent credential tied to your Power Platform environment.

```powershell
# Create a service principal in Azure AD and register it as an application user
# in the Power Platform environment in one command.
# Replace ENV_ID with the environment ID from Phase 2F.

$spName = "GitHubActions-$repoName"

$spResult = pac admin create-service-principal `
    --environment $environmentId `
    --name        $spName `
    --role        "System Administrator" 2>&1

Write-Host $spResult

# The output contains the credentials — extract them
# Look for lines containing "ApplicationId" and "ClientSecret"
# Note these values down — you will store them as GitHub secrets in Step 3
```

If the command succeeds, it prints something like:
```
ApplicationId : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ClientSecret  : xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TenantId      : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Important:** The client secret is shown only once. Store it immediately.

Official reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/admin#pac-admin-create-service-principal

---

## Step 3 — Store credentials as GitHub secrets

```powershell
# Store each value as a GitHub secret in the solution repo
# These are encrypted and only exposed to GitHub Actions workflows

$clientId     = "PASTE_APPLICATION_ID_HERE"
$clientSecret = "PASTE_CLIENT_SECRET_HERE"
$tenantId     = "PASTE_TENANT_ID_HERE"
$devEnvUrl    = "https://YOURORG.crm.dynamics.com"  # the dev environment URL from pac env who

# Write secrets to the repo
$clientSecret  | gh secret set PP_CLIENT_SECRET  --repo "$repoOrg/$repoName"
$clientId      | gh secret set PP_CLIENT_ID       --repo "$repoOrg/$repoName"
$tenantId      | gh secret set PP_TENANT_ID       --repo "$repoOrg/$repoName"
$devEnvUrl     | gh secret set PP_DEV_ENV_URL     --repo "$repoOrg/$repoName"

# If the user has a test environment, add its URL too
# $testEnvUrl | gh secret set PP_TEST_ENV_URL --repo "$repoOrg/$repoName"

Write-Host "Secrets stored in GitHub repo: $repoName"
```

---

## Step 4 — Create the GitHub Actions workflow files

Create a `.github/workflows/` folder and add two workflow files.

### Export workflow — sync solution from dev to source control

This workflow is triggered manually. It exports the solution from the dev environment,
unpacks it to readable source files, and opens a pull request with the changes.

```powershell
# Create the workflows directory
New-Item -ItemType Directory -Force -Path ".github/workflows" | Out-Null
```

Create `.github/workflows/export-solution.yml`:

```yaml
# export-solution.yml
# Triggered manually from the GitHub Actions tab.
# Exports the Power Platform solution from the dev environment,
# unpacks it to source files, and commits to a new branch.

name: Export solution from dev

on:
  workflow_dispatch:
    inputs:
      solution_name:
        description: Unique name of the solution to export
        required: true
        default: myprojectsolution
      branch_name:
        description: Branch to commit the export to
        required: false
        default: solution-export

jobs:
  export-and-commit:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repo
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Export solution from dev environment
        uses: microsoft/powerplatform-actions/export-solution@v1
        with:
          environment-url: ${{ secrets.PP_DEV_ENV_URL }}
          app-id:          ${{ secrets.PP_CLIENT_ID }}
          client-secret:   ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id:       ${{ secrets.PP_TENANT_ID }}
          solution-name:   ${{ inputs.solution_name }}
          solution-output-file: out/${{ inputs.solution_name }}.zip
          managed:         false

      - name: Unpack solution to source files
        uses: microsoft/powerplatform-actions/unpack-solution@v1
        with:
          solution-file:   out/${{ inputs.solution_name }}.zip
          solution-folder: solutions/${{ inputs.solution_name }}
          solution-type:   Unmanaged
          overwrite-files: true

      - name: Commit and open a pull request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "export: ${{ inputs.solution_name }} from dev"
          branch:  ${{ inputs.branch_name }}
          title:   "Solution export: ${{ inputs.solution_name }}"
          body:    "Automated export of ${{ inputs.solution_name }} from the dev environment."
          add-paths: solutions/
```

### Deploy workflow — pack and import solution to test / production

This workflow runs automatically when changes to `solutions/` are merged to main.

Create `.github/workflows/deploy-solution.yml`:

```yaml
# deploy-solution.yml
# Triggered when solution source files are merged to the main branch.
# Packs the source files back into a solution zip and imports to the test environment.
# Extend with additional jobs to deploy to production after manual approval.

name: Deploy solution to test

on:
  push:
    branches:
      - main
    paths:
      - 'solutions/**'

env:
  SOLUTION_NAME: myprojectsolution   # change to match your solution unique name

jobs:
  deploy-to-test:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repo
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Pack solution from source files
        uses: microsoft/powerplatform-actions/pack-solution@v1
        with:
          solution-folder: solutions/${{ env.SOLUTION_NAME }}
          solution-file:   out/${{ env.SOLUTION_NAME }}.zip
          solution-type:   Unmanaged

      - name: Import solution to test environment
        uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          environment-url: ${{ secrets.PP_TEST_ENV_URL }}
          app-id:          ${{ secrets.PP_CLIENT_ID }}
          client-secret:   ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id:       ${{ secrets.PP_TENANT_ID }}
          solution-file:   out/${{ env.SOLUTION_NAME }}.zip
          force-overwrite: true
          publish-changes: true

      - name: Publish customizations
        uses: microsoft/powerplatform-actions/publish-solution@v1
        with:
          environment-url: ${{ secrets.PP_TEST_ENV_URL }}
          app-id:          ${{ secrets.PP_CLIENT_ID }}
          client-secret:   ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id:       ${{ secrets.PP_TENANT_ID }}
```

Official Power Platform GitHub Actions: https://github.com/marketplace/actions/powerplatform-actions

---

## Step 5 — Write the workflow files and make the initial commit

```powershell
# Write the export workflow
$exportWorkflow | Set-Content ".github/workflows/export-solution.yml" -Encoding UTF8

# Write the deploy workflow
$deployWorkflow | Set-Content ".github/workflows/deploy-solution.yml" -Encoding UTF8

# Create a solutions/ folder placeholder so the folder exists before the first export
New-Item -ItemType Directory -Force -Path "solutions" | Out-Null
"# Solution source files are exported here by the export-solution workflow." `
    | Set-Content "solutions/README.md" -Encoding UTF8

# Create an out/ folder for intermediate zip files (gitignored)
New-Item -ItemType Directory -Force -Path "out" | Out-Null
"out/" | Add-Content ".gitignore"

# Add a root README
@"
# $repoName

Power Platform solution source control repo.

## Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| Export solution | Manual (Actions tab) | Exports from dev environment, unpacks to source files, opens a PR |
| Deploy solution | Push to main | Packs source files and deploys to test environment |

## Environments

| Name | Purpose | URL secret |
|---|---|---|
| Dev | Active development | PP_DEV_ENV_URL |
| Test | QA and stakeholder review | PP_TEST_ENV_URL |

See [Power Platform ALM guide](https://learn.microsoft.com/en-us/power-platform/alm/) for background.
"@ | Set-Content "README.md" -Encoding UTF8

# Stage and push everything
git add .
git commit -m "chore: initial repo setup with Power Platform GitHub Actions workflows

- .github/workflows/export-solution.yml: manual export from dev → PR
- .github/workflows/deploy-solution.yml: auto deploy to test on main push
- solutions/: placeholder for unpacked solution source files
- out/ added to .gitignore (intermediate build artifacts)"
git push --set-upstream origin main

Write-Host "GitHub repo initialised and workflows pushed."
```

---

## Step 6 — Do the first export (optional but recommended)

Once the app has been built and published (after Phase 4), run the first export to get the solution
into source control:

1. Go to the **Actions** tab of the GitHub repo
2. Select **Export solution from dev**
3. Click **Run workflow**
4. Enter the solution unique name (e.g. `myprojectsolution`)
5. Click **Run workflow**

The workflow will export the solution, unpack it, and open a pull request.
Review and merge the PR to get the source files into main.

---

## Summary — what the agent can do with the GitHub MCP after this

Once the repo is set up and the GitHub MCP is configured, the agent can:

| Task | How |
|---|---|
| Trigger an export | Use GitHub MCP → `trigger_workflow` on `export-solution.yml` |
| Review a solution PR | Use GitHub MCP → `get_pull_request`, `list_pull_request_files` |
| Check deployment status | Use GitHub MCP → `list_workflow_runs`, `get_workflow_run` |
| Create a release branch | Use GitHub MCP → `create_branch` |
| Review what changed | Use GitHub MCP → `compare_commits` or `get_commit` |

Official Power Platform ALM guide: https://learn.microsoft.com/en-us/power-platform/alm/
Official Power Platform GitHub Actions: https://learn.microsoft.com/en-us/power-platform/alm/devops-github-actions