# CLI Authentication — Sign In to Every Tool

This file is read by the AI agent during Phase 1C of setup.

Installing a tool is not enough — each CLI needs to be authenticated before it can do anything useful.
Run the sign-in blocks below after installing. If a tool is already signed in, skip it.

---

## Power Platform CLI (`pac`)

Used to: manage environments, export/import solutions, create Dataverse tables, run ALM pipelines.

```powershell
# Check if already signed in to Power Platform
$authList = pac auth list 2>&1
if ($authList -match "No profiles found" -or $authList -notmatch "@") {
    Write-Host "Not signed in to Power Platform — opening browser login..."
    # This opens a browser window where the user signs in with their Microsoft 365 account
    pac auth create --name "default"
    Write-Host "Signed in to Power Platform"
} else {
    Write-Host "Already signed in to Power Platform:"
    Write-Host $authList
}
```

Official reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/auth

**After signing in**, confirm which environment to use:

```powershell
# List all environments the signed-in account has access to
pac env list

# Switch to the right environment for this project
# Replace "MY_ENV_NAME" with the name shown in the list
pac env select --environment "MY_ENV_NAME"
```

---

## GitHub CLI (`gh`)

Used to: create solution repos, push code, open pull requests.

```powershell
# Check if already signed in to GitHub
$ghStatus = gh auth status 2>&1
if ($ghStatus -match "not logged") {
    Write-Host "Not signed in to GitHub — opening browser login..."
    # This opens a browser window to authenticate with GitHub
    gh auth login --web
    Write-Host "Signed in to GitHub"
} else {
    Write-Host "Already signed in to GitHub:"
    Write-Host $ghStatus
}
```

Official reference: https://cli.github.com/manual/gh_auth_login

---

## Git (username and email)

Git needs a name and email to attach to commits. This is a one-time setup per machine.

```powershell
# Check if git identity is already configured
$gitName  = git config --global user.name 2>&1
$gitEmail = git config --global user.email 2>&1

if ($gitName -and $gitEmail) {
    Write-Host "Git already configured: $gitName <$gitEmail> — skipping"
} else {
    # Ask the user for their name and email before running these
    git config --global user.name  "YOUR NAME"
    git config --global user.email "YOUR EMAIL"
    Write-Host "Git identity configured"
}
```

---

## m365 CLI (Microsoft 365 / SharePoint)

*Only needed if the app uses SharePoint Lists.*

Used to: create SharePoint lists, add columns, manage site permissions.

```powershell
# Check if already signed in to Microsoft 365
$m365Status = m365 status 2>&1
if ($m365Status -match "Logged out" -or $m365Status -match "not logged") {
    Write-Host "Not signed in to Microsoft 365 — opening browser login..."
    # This opens a browser window to sign in with the Microsoft 365 account
    m365 login
    Write-Host "Signed in to Microsoft 365"
} else {
    Write-Host "Already signed in to Microsoft 365:"
    Write-Host $m365Status
}
```

Official reference: https://pnp.github.io/cli-microsoft365/user-guide/connecting-microsoft-365/

---

## Azure CLI (`az`)

*Only needed if the app uses Azure SQL, Azure Storage, or other Azure services.*

Used to: create Azure SQL databases, manage resource groups, configure connection strings.

```powershell
# Check if already signed in to Azure
$azAccount = az account show 2>&1
if ($azAccount -match "not logged" -or $azAccount -match "error") {
    Write-Host "Not signed in to Azure — opening browser login..."
    # This opens a browser window to sign in with the Azure / Microsoft account
    az login
    Write-Host "Signed in to Azure"
} else {
    # Parse and display the current subscription
    $account = $azAccount | ConvertFrom-Json
    Write-Host "Already signed in to Azure:"
    Write-Host "  Subscription: $($account.name)"
    Write-Host "  Tenant:       $($account.tenantId)"
}
```

After signing in, set the subscription to use:

```powershell
# List all available subscriptions
az account list --output table

# Set the subscription for this project
az account set --subscription "YOUR SUBSCRIPTION NAME OR ID"
```

Official reference: https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli

---

## Summary — sign-in checklist

| Tool | Auth method | When needed |
|---|---|---|
| `pac` | Browser (Microsoft account) | Always — Power Platform access |
| `gh` | Browser (GitHub account) | Always — solution repos |
| `git` | Config (name + email only) | Always — code commits |
| `m365` | Browser (Microsoft 365 account) | SharePoint datasource only |
| `az` | Browser (Microsoft / Azure account) | Azure SQL or Azure resources only |

You do not need to sign in to a tool you haven't installed.