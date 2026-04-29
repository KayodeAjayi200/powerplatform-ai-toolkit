# CLI Authentication — Sign In to Every Tool

This file is read by the AI agent during setup.

Installing a tool is not enough — each CLI needs to be authenticated before it can do anything useful.
The scripts below check what is already signed in before asking the user to do anything.

**Important:** If the user might have multiple accounts (work email, personal email, access to different
organisations), always show them what is currently signed in and ask if it is the right one before
continuing. Never assume the default is correct.

---

## Power Platform CLI (`pac`)

Used to: manage environments, export/import solutions, create Dataverse tables, run ALM pipelines.

```powershell
# Check what Power Platform accounts are already saved
$authList = pac auth list 2>&1

if ($authList -match "No profiles found" -or $authList -notmatch "@") {
    # No profile exists — ask the user which account they want to sign in with
    Write-Host ""
    Write-Host "You are not currently signed in to Power Platform."
    Write-Host "You may have more than one Microsoft account — for example a work account,"
    Write-Host "a personal account, or accounts in different organisations."
    Write-Host ""
    # Ask the user before opening the browser
    # "Which email address should I use to sign in to Power Platform?"
    pac auth create --name "default"
    Write-Host "Signed in to Power Platform"
} else {
    # One or more profiles exist — show them and ask which to use
    Write-Host "I found these Power Platform profiles already saved on this machine:"
    Write-Host $authList
    Write-Host ""
    Write-Host "If one of these is the right account for this project, I will use it."
    Write-Host "If you need a different account, let me know and I will add it."
    # Ask the user: "Which profile should I use? (paste the name or number, or say 'new' for a different account)"
    # If they say new: pac auth create --name "project-name"
    # If they pick one: pac auth select --index N
}
```

Official reference: https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/auth

**After confirming the account**, list and select the right environment:

```powershell
# Show all environments the signed-in account has access to
pac env list

# Ask the user: "Which environment should I use for this project?"
# Then select it:
pac env select --environment "THE ENV THEY CHOSE"
```

---

## GitHub CLI (`gh`)

Used to: create solution repos, push code, open pull requests.

```powershell
# Check what GitHub account is currently signed in
$ghStatus = gh auth status 2>&1

if ($ghStatus -match "not logged") {
    Write-Host "You are not currently signed in to GitHub."
    Write-Host "If you have more than one GitHub account (e.g. a personal and a work account),"
    Write-Host "please confirm which one you want to use for this project before I open the browser."
    # Ask the user: "Which GitHub account should I sign in with?"
    gh auth login --web
    Write-Host "Signed in to GitHub"
} else {
    # Show the current account and confirm it is correct
    Write-Host "You are already signed in to GitHub:"
    Write-Host $ghStatus
    Write-Host ""
    Write-Host "Is this the right GitHub account for this project?"
    # Ask the user: "Is this correct, or do you want to use a different GitHub account?"
    # If they want to switch: gh auth logout  →  gh auth login --web
}
```

Official reference: https://cli.github.com/manual/gh_auth_login

---

## Git (username and email)

Git attaches a name and email to every commit — this is how code history shows who made each change.

```powershell
# Check if git identity is already configured on this machine
$gitName  = git config --global user.name  2>&1
$gitEmail = git config --global user.email 2>&1

if ($gitName -and $gitEmail) {
    Write-Host "Git is configured with: $gitName <$gitEmail>"
    Write-Host ""
    Write-Host "This name and email will appear on all commits for this project."
    # Ask the user: "Is this correct for this project, or would you like to use a different name or email?"
    # If they want to change it:
    # git config --global user.name  "NEW NAME"
    # git config --global user.email "NEW EMAIL"
} else {
    Write-Host "Git does not have a name and email set yet."
    Write-Host "This is just for labelling your commits — it does not need to be a real email address,"
    Write-Host "but it is usually your work name and email."
    # Ask the user: "What name and email should appear on your commits?"
    # Then set them:
    # git config --global user.name  "THEIR NAME"
    # git config --global user.email "THEIR EMAIL"
    Write-Host "Git identity configured"
}
```

---

## m365 CLI (Microsoft 365 / SharePoint)

*Only needed if the app uses SharePoint Lists.*

Used to: create SharePoint sites, lists, add columns, manage site permissions.

```powershell
# Check what Microsoft 365 account is currently signed in
$m365Status = m365 status 2>&1

if ($m365Status -match "Logged out" -or $m365Status -match "not logged") {
    Write-Host "You are not currently signed in to Microsoft 365."
    Write-Host "This uses the same Microsoft account as Power Platform — usually your work email."
    Write-Host "If you have access to multiple tenants or organisations, confirm which one to use."
    # Ask the user: "Which Microsoft 365 account should I use for SharePoint? (This is usually the same as your Power Platform account.)"
    m365 login
    Write-Host "Signed in to Microsoft 365"
} else {
    Write-Host "Already signed in to Microsoft 365:"
    Write-Host $m365Status
    Write-Host ""
    # Ask the user: "Is this the right Microsoft 365 account for SharePoint in this project?"
}
```

> **Tip for the agent:** pac, m365, and az often use the same Microsoft 365 tenant account.
> If the user confirmed their account for Power Platform, check whether the same account applies
> here before asking again — avoid asking for the same information twice.

Official reference: https://pnp.github.io/cli-microsoft365/user-guide/connecting-microsoft-365/

---

## Azure CLI (`az`)

*Only needed if the app uses Azure SQL, Azure Storage, or other Azure services.*

Used to: create Azure SQL databases, manage resource groups, configure connection strings, set up Azure DevOps.

```powershell
# Check what Azure account is currently signed in
$azAccount = az account show 2>&1

if ($azAccount -match "not logged" -or $azAccount -match "error") {
    Write-Host "You are not currently signed in to Azure."
    Write-Host "Azure uses the same Microsoft account as Power Platform and Microsoft 365."
    Write-Host "If you have access to multiple Azure subscriptions or tenants, confirm which to use."
    # Ask the user: "Which Azure account / subscription should I use for this project?"
    az login
    Write-Host "Signed in to Azure"
} else {
    # Show current subscription and ask for confirmation
    $account = $azAccount | ConvertFrom-Json
    Write-Host "Already signed in to Azure:"
    Write-Host "  Account:      $($account.user.name)"
    Write-Host "  Subscription: $($account.name)"
    Write-Host "  Tenant:       $($account.tenantId)"
    Write-Host ""
    # Ask the user: "Is this the right Azure subscription for this project?
    # If not, I can switch to a different one."
}
```

After confirming the account, set the correct subscription:

```powershell
# List all subscriptions the signed-in account has access to
az account list --output table

# Ask the user which one to use, then set it:
az account set --subscription "SUBSCRIPTION NAME OR ID"
```

Official reference: https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli

---

## Summary — sign-in checklist

| Tool | Auth method | When needed | Typical account |
|---|---|---|---|
| `pac` | Browser (Microsoft account) | Always | Work Microsoft 365 email |
| `gh` | Browser (GitHub account) | Always | GitHub username |
| `git` | Config (name + email only) | Always | Any name/email for commits |
| `m365` | Browser (Microsoft 365 account) | SharePoint only | Usually same as pac |
| `az` | Browser (Microsoft / Azure account) | Azure SQL / Azure DevOps | Usually same as pac |

You do not need to sign in to a tool you have not installed or do not need for this project.
