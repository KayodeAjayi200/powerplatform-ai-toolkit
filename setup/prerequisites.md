# Prerequisites — Check-First Install

This file is read by the AI agent during Phase 1B of setup.  
Run the PowerShell block below — it checks whether each tool is already installed before installing anything.

---

## Official documentation

Always refer to the official sources for the latest installation instructions:

| Tool | Purpose | Official docs |
|---|---|---|
| **Node.js (LTS)** | Required for all `npx`-based MCP servers | https://nodejs.org/en/download |
| **Power Platform CLI (`pac`)** | Deploy solutions, manage environments, auth | https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction |
| **.NET SDK 8+** | Required for .NET-based MCP tools (Dataverse, Canvas, Copilot Studio) | https://learn.microsoft.com/en-us/dotnet/core/install/windows |
| **GitHub CLI (`gh`)** | Create repos, manage PRs from the command line | https://cli.github.com |
| **Git** | Version control for solution repos | https://git-scm.com/downloads |
| **m365 CLI** | Create and manage SharePoint lists | https://pnp.github.io/cli-microsoft365 |

---

## Check-first install script

```powershell
# ── Node.js ─────────────────────────────────────────────────────────────────
if (Get-Command node -ErrorAction SilentlyContinue) {
    $v = node --version
    Write-Host "Node.js already installed: $v — skipping"
} else {
    Write-Host "Installing Node.js LTS..."
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    Write-Host "Node.js installed"
}

# ── Power Platform CLI (pac) ─────────────────────────────────────────────────
if (Get-Command pac -ErrorAction SilentlyContinue) {
    $v = pac --version
    Write-Host "pac CLI already installed: $v — skipping"
} else {
    Write-Host "Installing Power Platform CLI..."
    winget install Microsoft.PowerAppsCLI --silent --accept-package-agreements --accept-source-agreements
    Write-Host "pac CLI installed"
}

# ── .NET SDK ─────────────────────────────────────────────────────────────────
$dotnetSdks = dotnet --list-sdks 2>&1
$hasNet8 = $dotnetSdks | Where-Object { $_ -match "^[89]\." -or $_ -match "^[1-9][0-9]\." }
if ($hasNet8) {
    Write-Host ".NET SDK 8+ already installed:"
    $dotnetSdks | ForEach-Object { Write-Host "  $_" }
    Write-Host "Skipping .NET install"
} else {
    Write-Host "Installing .NET SDK 8..."
    winget install Microsoft.DotNet.SDK.8 --silent --accept-package-agreements --accept-source-agreements
    Write-Host ".NET SDK 8 installed"
}

# ── GitHub CLI (gh) ──────────────────────────────────────────────────────────
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $v = gh --version | Select-Object -First 1
    Write-Host "GitHub CLI already installed: $v — skipping"
} else {
    Write-Host "Installing GitHub CLI..."
    winget install GitHub.cli --silent --accept-package-agreements --accept-source-agreements
    Write-Host "GitHub CLI installed"
}

# ── Git ───────────────────────────────────────────────────────────────────────
if (Get-Command git -ErrorAction SilentlyContinue) {
    $v = git --version
    Write-Host "Git already installed: $v — skipping"
} else {
    Write-Host "Installing Git..."
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    Write-Host "Git installed"
}

# ── m365 CLI (PnP CLI for Microsoft 365 — for SharePoint list creation) ──────
$npmGlobal = npm list -g --depth=0 2>&1
if ($npmGlobal -match "@pnp/cli-microsoft365") {
    Write-Host "m365 CLI already installed — skipping"
} else {
    Write-Host "Installing m365 CLI..."
    npm install -g @pnp/cli-microsoft365
    Write-Host "m365 CLI installed"
}

Write-Host ""
Write-Host "All prerequisites checked."
```

---

## After installing

If anything was newly installed, **close and reopen your terminal** so the new commands are on your PATH before continuing.

Then verify everything is working:

```powershell
node --version   # should print v20.x or later
pac --version    # should print Power Apps CLI version
dotnet --version # should print 8.x or later
gh --version     # should print gh version x.x.x
git --version    # should print git version x.x.x
m365 --version   # should print cli-microsoft365 version
```
