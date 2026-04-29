# Prerequisites — Check-First Install

This file is read by the AI agent during Phase 1B of setup.

Run the blocks below — they check whether each tool is already installed before installing anything.
After installing, the agent reads `setup/cli-auth.md` to authenticate each tool.

---

## Core tools (always required)

These tools are needed for every Power Apps project, regardless of what you are building.

| Tool | Purpose | Official docs |
|---|---|---|
| **Node.js (LTS)** | Required for all `npx`-based MCP servers | https://nodejs.org/en/download |
| **Power Platform CLI (`pac`)** | Deploy solutions, manage environments, create Dataverse tables | https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction |
| **.NET SDK 10.0+** | Required for Canvas Authoring MCP, Dataverse MCP, and Copilot Studio MCP — version 10.0 or later is required | https://dotnet.microsoft.com/download/dotnet/10.0 |
| **GitHub CLI (`gh`)** | Create repos, manage PRs, push code from the command line | https://cli.github.com |
| **Git** | Version control for solution files | https://git-scm.com/downloads |

```powershell
# ── Node.js ─────────────────────────────────────────────────────────────────
# Node.js is the runtime for most MCP servers (filesystem, GitHub, Playwright, etc.)
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Node.js already installed: $(node --version) — skipping"
} else {
    Write-Host "Installing Node.js LTS via winget..."
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    Write-Host "Node.js installed"
}

# ── Power Platform CLI (pac) ─────────────────────────────────────────────────
# pac is used to manage environments, export/import solutions, and create Dataverse tables
if (Get-Command pac -ErrorAction SilentlyContinue) {
    Write-Host "pac CLI already installed: $(pac --version) — skipping"
} else {
    Write-Host "Installing Power Platform CLI via winget..."
    winget install Microsoft.PowerAppsCLI --silent --accept-package-agreements --accept-source-agreements
    Write-Host "pac CLI installed"
}

# ── .NET SDK 10.0+ ────────────────────────────────────────────────────────────
# .NET 10.0 or later is REQUIRED for the Canvas Authoring MCP, Dataverse MCP, and Copilot Studio MCP
# If you have an older version (e.g. .NET 8), you need to install .NET 10 alongside it
$dotnetSdks = dotnet --list-sdks 2>&1
$hasNet10 = $dotnetSdks | Where-Object { $_ -match "^[1-9][0-9]\." }
if ($hasNet10) {
    Write-Host ".NET SDK 10+ already installed — skipping"
    $dotnetSdks | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "Installing .NET SDK 10 via winget..."
    winget install Microsoft.DotNet.SDK.10 --silent --accept-package-agreements --accept-source-agreements
    Write-Host ".NET SDK 10 installed"
}

# ── GitHub CLI (gh) ──────────────────────────────────────────────────────────
# gh is used to create repos, push code, and manage pull requests for solution repos
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "GitHub CLI already installed: $(gh --version | Select-Object -First 1) — skipping"
} else {
    Write-Host "Installing GitHub CLI via winget..."
    winget install GitHub.cli --silent --accept-package-agreements --accept-source-agreements
    Write-Host "GitHub CLI installed"
}

# ── Git ───────────────────────────────────────────────────────────────────────
# Git is used to clone repos, commit solution files, and track changes
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "Git already installed: $(git --version) — skipping"
} else {
    Write-Host "Installing Git via winget..."
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    Write-Host "Git installed"
}

Write-Host ""
Write-Host "Core tools check complete. See setup/cli-auth.md to sign in to each tool."
```

---

## SharePoint tools (install when app uses SharePoint Lists)

Only install these if the user's app will use SharePoint as a data source.

| Tool | Purpose | Official docs |
|---|---|---|
| **m365 CLI** | Create and manage SharePoint lists from the command line | https://pnp.github.io/cli-microsoft365 |

```powershell
# m365 CLI — only install if SharePoint is a confirmed datasource
# Check for existing install first to avoid unnecessary npm operations
$npmGlobal = npm list -g --depth=0 2>&1
if ($npmGlobal -match "@pnp/cli-microsoft365") {
    Write-Host "m365 CLI already installed — skipping"
} else {
    Write-Host "Installing m365 CLI (PnP CLI for Microsoft 365)..."
    npm install -g @pnp/cli-microsoft365
    Write-Host "m365 CLI installed"
}
```

---

## Azure / SQL tools (install when app uses Azure SQL or Azure resources)

Only install these if the user's app will use Azure SQL, Azure Storage, or other Azure services.

| Tool | Purpose | Official docs |
|---|---|---|
| **Azure CLI (`az`)** | Create and manage Azure SQL databases, storage, and other Azure resources | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows |
| **sqlcmd** | Run SQL scripts to create tables and seed data in SQL Server / Azure SQL | https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-utility |

```powershell
# ── Azure CLI ────────────────────────────────────────────────────────────────
# az CLI is needed to create Azure SQL databases and manage Azure resources
if (Get-Command az -ErrorAction SilentlyContinue) {
    Write-Host "Azure CLI already installed: $(az --version | Select-Object -First 1) — skipping"
} else {
    Write-Host "Installing Azure CLI via winget..."
    winget install Microsoft.AzureCLI --silent --accept-package-agreements --accept-source-agreements
    Write-Host "Azure CLI installed"
}

# ── sqlcmd ────────────────────────────────────────────────────────────────────
# sqlcmd is used to run SQL scripts against Azure SQL or SQL Server
if (Get-Command sqlcmd -ErrorAction SilentlyContinue) {
    Write-Host "sqlcmd already installed — skipping"
} else {
    Write-Host "Installing sqlcmd via winget..."
    winget install Microsoft.SqlServer.CommandLineUtils --silent --accept-package-agreements --accept-source-agreements
    Write-Host "sqlcmd installed"
}
```

---

## Verify everything is working

After installing, run this to confirm all installed tools are on your PATH.
(Close and reopen your terminal first if anything was newly installed.)

```powershell
# Check each tool and show its version — any "not found" means restart terminal or reinstall
$checks = @{
    "node"    = "Node.js (MCP servers)"
    "pac"     = "Power Platform CLI"
    "dotnet"  = ".NET SDK"
    "gh"      = "GitHub CLI"
    "git"     = "Git"
    "m365"    = "m365 CLI (SharePoint)"   # only if installed
    "az"      = "Azure CLI (SQL/Azure)"   # only if installed
    "sqlcmd"  = "sqlcmd (SQL scripts)"    # only if installed
}

foreach ($cmd in $checks.Keys) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        Write-Host "✓ $($checks[$cmd])"
    } else {
        Write-Host "  $($checks[$cmd]) — not installed (skip if not needed)"
    }
}
```

---

## Next step

After all tools are installed, go to `setup/cli-auth.md` to authenticate each one.
