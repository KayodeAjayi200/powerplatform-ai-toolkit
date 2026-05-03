param(
    [string]$BacklogPath = "devops/xmarque-workforce-backlog.json",
    [string]$OrganizationUrl,
    [string]$Project,
    [switch]$SkipQueries
)

$ErrorActionPreference = "Stop"

function Invoke-AzJson {
    param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Arguments)

    $output = & az @Arguments --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output | Out-String)
    }

    if (-not $output) {
        return $null
    }

    return ($output | Out-String | ConvertFrom-Json)
}

function New-WorkItem {
    param(
        [string]$Type,
        [string]$Title,
        [string]$Description,
        [string]$AcceptanceCriteria
    )

    $escapedTitle = $Title.Replace("'", "''")
    $wiql = "SELECT [System.Id],[System.Title],[System.WorkItemType] FROM workitems WHERE [System.TeamProject]=@project AND [System.WorkItemType]='$Type' AND [System.Title]='$escapedTitle'"
    $existing = Invoke-AzJson "boards" "query" "--wiql" $wiql
    if ($existing.workItems -and $existing.workItems.Count -gt 0) {
        $item = Invoke-AzJson "boards" "work-item" "show" "--id" "$($existing.workItems[0].id)"
        Write-Host "Reusing $Type #$($item.id): $Title"
        return $item
    }

    $args = @(
        "boards", "work-item", "create",
        "--type", $Type,
        "--title", $Title,
        "--description", $Description
    )

    $item = Invoke-AzJson @args

    if ($AcceptanceCriteria) {
        $field = "Microsoft.VSTS.Common.AcceptanceCriteria=$AcceptanceCriteria"
        Invoke-AzJson "boards" "work-item" "update" "--id" "$($item.id)" "--fields" $field | Out-Null
    }

    Write-Host "Created $Type #$($item.id): $Title"
    return $item
}

function Add-ParentLink {
    param(
        [int]$ChildId,
        [int]$ParentId
    )

    try {
        Invoke-AzJson "boards" "work-item" "relation" "add" "--id" "$ChildId" "--relation-type" "Parent" "--target-id" "$ParentId" | Out-Null
        Write-Host "Linked child #$ChildId to parent #$ParentId"
    } catch {
        Write-Host "Parent link skipped for #$ChildId -> #$ParentId. It may already exist."
    }
}

$resolvedBacklogPath = Resolve-Path $BacklogPath
$backlog = Get-Content $resolvedBacklogPath -Raw | ConvertFrom-Json

if (-not $OrganizationUrl) { $OrganizationUrl = $backlog.organizationUrl }
if (-not $Project) { $Project = $backlog.project }

if (-not $OrganizationUrl -or -not $Project) {
    throw "OrganizationUrl and Project are required, either as parameters or in the backlog JSON."
}

az devops configure --defaults organization=$OrganizationUrl project=$Project | Out-Null

$created = [ordered]@{
    organizationUrl = $OrganizationUrl
    project = $Project
    epics = @()
    features = @()
    userStories = @()
    queries = @()
}

foreach ($epicDef in $backlog.epics) {
    $epic = New-WorkItem -Type "Epic" -Title $epicDef.title -Description $epicDef.description
    $created.epics += [PSCustomObject]@{ id = $epic.id; title = $epicDef.title }

    foreach ($featureDef in $epicDef.features) {
        $feature = New-WorkItem -Type "Feature" -Title $featureDef.title -Description $featureDef.description
        Add-ParentLink -ChildId $feature.id -ParentId $epic.id
        $created.features += [PSCustomObject]@{ id = $feature.id; title = $featureDef.title; parentEpicId = $epic.id }

        foreach ($storyDef in $featureDef.stories) {
            $story = New-WorkItem -Type "User Story" -Title $storyDef.title -Description $storyDef.description -AcceptanceCriteria $storyDef.acceptanceCriteria
            Add-ParentLink -ChildId $story.id -ParentId $feature.id
            $created.userStories += [PSCustomObject]@{ id = $story.id; title = $storyDef.title; parentFeatureId = $feature.id }
        }
    }
}

if (-not $SkipQueries) {
    $token = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
        Accept = "application/json"
    }
    $encodedProject = [uri]::EscapeDataString($Project)
    $queryFolderUrl = "$OrganizationUrl/$encodedProject/_apis/wit/queries/Shared%20Queries?api-version=7.1-preview.2"

    foreach ($queryDef in $backlog.queries) {
        try {
            $body = @{
                name = $queryDef.name
                wiql = $queryDef.wiql
                isFolder = $false
            } | ConvertTo-Json -Depth 5

            $query = Invoke-RestMethod -Uri $queryFolderUrl -Method Post -Headers $headers -Body $body
            Write-Host "Created query: $($queryDef.name)"
            $created.queries += [PSCustomObject]@{ id = $query.id; name = $queryDef.name; path = $query.path }
        } catch {
            Write-Host "Query skipped or already exists: $($queryDef.name)"
        }
    }
}

$outPath = Join-Path (Split-Path $resolvedBacklogPath -Parent) "xmarque-workforce-created-workitems.json"
$created | ConvertTo-Json -Depth 10 | Set-Content $outPath -Encoding UTF8
Write-Host "Created work item summary: $outPath"
Write-Host "Backlog: $OrganizationUrl/$($Project -replace ' ', '%20')/_backlogs/backlog"
