param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [string]$DataModelPath = "dashboard/state/data-model.json",
    [string]$SummaryPath = "sharepoint/provisioning-summary.json",
    [switch]$IncludePhase2,
    [switch]$IndexesOnly,
    [switch]$VerifyOnly
)

$ErrorActionPreference = "Stop"

function Invoke-M365Json {
    param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Arguments)

    $output = & m365 @Arguments -o json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output | Out-String)
    }

    if (-not $output) {
        return $null
    }

    return ($output | Out-String | ConvertFrom-Json)
}

function Add-FieldXml {
    param(
        [string]$ListTitle,
        [string]$FieldXml
    )

    try {
        Invoke-M365Json "spo" "field" "add" "--webUrl" $SiteUrl "--listTitle" $ListTitle "--xml" $FieldXml | Out-Null
        Write-Host "  Added field to ${ListTitle}: $FieldXml"
    } catch {
        $message = $_.Exception.Message
        if ($message -match "already exists" -or $message -match "duplicate" -or $message -match "A duplicate field name") {
            Write-Host "  Field already exists in ${ListTitle}: $FieldXml"
        } else {
            throw
        }
    }
}

function Get-ListFields {
    param([string]$ListTitle)

    if (-not $script:FieldCache.ContainsKey($ListTitle)) {
        $script:FieldCache[$ListTitle] = @(Invoke-M365Json "spo" "field" "list" "--webUrl" $SiteUrl "--listTitle" $ListTitle)
    }

    return $script:FieldCache[$ListTitle]
}

function Resolve-ListField {
    param(
        [string]$ListTitle,
        [string]$RequestedName,
        [string]$DisplayName
    )

    $fields = @(Get-ListFields -ListTitle $ListTitle)
    return ($fields | Where-Object {
        $_.InternalName -eq $RequestedName `
            -or $_.StaticName -eq $RequestedName `
            -or $_.Title -eq $DisplayName `
            -or $_.Title -eq $RequestedName
    } | Select-Object -First 1)
}

function Set-FieldIndexed {
    param(
        [string]$ListTitle,
        [string]$RequestedName,
        [string]$DisplayName
    )

    $field = Resolve-ListField -ListTitle $ListTitle -RequestedName $RequestedName -DisplayName $DisplayName

    if (-not $field) {
        Write-Host "  Could not find field ${ListTitle}.${RequestedName} ($DisplayName) to index."
        $script:VerificationFindings += "Missing field: ${ListTitle}.${RequestedName} ($DisplayName)"
        return
    }

    if ($field.Indexed) {
        Write-Host "  Field already indexed ${ListTitle}.$($field.InternalName)"
        return
    }

    if ($VerifyOnly) {
        Write-Host "  Field is not indexed ${ListTitle}.$($field.InternalName)"
        $script:VerificationFindings += "Unindexed field: ${ListTitle}.$($field.InternalName)"
        return
    }

    try {
        Invoke-M365Json "spo" "field" "set" "--webUrl" $SiteUrl "--listTitle" $ListTitle "--internalName" $field.InternalName "--Indexed" "true" | Out-Null
        Write-Host "  Indexed field ${ListTitle}.$($field.InternalName)"
        $script:FieldCache.Remove($ListTitle)
    } catch {
        Write-Host "  Could not index ${ListTitle}.$($field.InternalName): $($_.Exception.Message)"
    }
}

function Set-TitleDisplayName {
    param(
        [string]$ListTitle,
        [string]$DisplayName
    )

    try {
        Invoke-M365Json "spo" "field" "set" "--webUrl" $SiteUrl "--listTitle" $ListTitle "--internalName" "Title" "--Title" $DisplayName | Out-Null
        Write-Host "Renamed Title display field for $ListTitle to '$DisplayName'"
    } catch {
        Write-Host "Could not rename Title field for ${ListTitle}: $($_.Exception.Message)"
    }
}

function Get-FieldXml {
    param(
        [object]$Field,
        [hashtable]$ListIds
    )

    $required = if ($Field.required) { "TRUE" } else { "FALSE" }
    $displayName = [System.Security.SecurityElement]::Escape($Field.displayName)
    $name = [System.Security.SecurityElement]::Escape($Field.name)

    switch ($Field.type) {
        "Text" {
            return "<Field Type='Text' DisplayName='$displayName' Name='$name' Required='$required' />"
        }
        "MultilineText" {
            return "<Field Type='Note' DisplayName='$displayName' Name='$name' Required='$required' NumLines='6' RichText='FALSE' />"
        }
        "Choice" {
            $choices = ($Field.choices | ForEach-Object { "<CHOICE>$([System.Security.SecurityElement]::Escape($_))</CHOICE>" }) -join ""
            return "<Field Type='Choice' DisplayName='$displayName' Name='$name' Required='$required'><CHOICES>$choices</CHOICES></Field>"
        }
        "Date" {
            return "<Field Type='DateTime' DisplayName='$displayName' Name='$name' Required='$required' Format='DateOnly' />"
        }
        "DateTime" {
            return "<Field Type='DateTime' DisplayName='$displayName' Name='$name' Required='$required' Format='DateTime' />"
        }
        "Number" {
            return "<Field Type='Number' DisplayName='$displayName' Name='$name' Required='$required' />"
        }
        "Boolean" {
            return "<Field Type='Boolean' DisplayName='$displayName' Name='$name' Required='$required' />"
        }
        "Person" {
            return "<Field Type='User' DisplayName='$displayName' Name='$name' Required='$required' UserSelectionMode='PeopleOnly' />"
        }
        "Hyperlink" {
            return "<Field Type='URL' DisplayName='$displayName' Name='$name' Required='$required' Format='Hyperlink' />"
        }
        "Currency" {
            return "<Field Type='Currency' DisplayName='$displayName' Name='$name' Required='$required' />"
        }
        "Lookup" {
            $lookupList = [string]$Field.lookupList
            if (-not $ListIds.ContainsKey($lookupList)) {
                throw "Lookup list '$lookupList' has not been created yet for field '$($Field.name)'."
            }
            return "<Field Type='Lookup' DisplayName='$displayName' Name='$name' Required='$required' List='{$($ListIds[$lookupList])}' ShowField='Title' />"
        }
        default {
            throw "Unsupported field type '$($Field.type)' for field '$($Field.name)'."
        }
    }
}

$status = m365 status
if ($status -match "Logged out") {
    throw "Microsoft 365 CLI is logged out. Run 'm365 login --authType deviceCode --tenant <tenant-id>' before provisioning SharePoint lists."
}

if (-not (Test-Path $DataModelPath)) {
    throw "Data model file not found: $DataModelPath"
}

$dataModel = Get-Content $DataModelPath -Raw | ConvertFrom-Json
$entities = @($dataModel.entities | Where-Object {
    $_.source -eq "SharePoint" -and ($IncludePhase2 -or $_.status -ne "phase 2 candidate")
})

if (-not $entities.Count) {
    throw "No SharePoint entities found in $DataModelPath."
}

$script:FieldCache = @{}
$script:VerificationFindings = @()

if ($VerifyOnly) {
    Write-Host "Verifying SharePoint lists at $SiteUrl"
} else {
    Write-Host "Provisioning SharePoint lists at $SiteUrl"
}
Write-Host "Lists to create or update: $($entities.name -join ', ')"

$allLists = @(Invoke-M365Json "spo" "list" "list" "--webUrl" $SiteUrl)
$listIds = @{}
$listUrls = @{}

foreach ($entity in $entities) {
    $existing = @($allLists | Where-Object { $_.Title -eq $entity.name } | Select-Object -First 1)
    if ($existing) {
        Write-Host "List already exists: $($entity.name)"
        $listIds[$entity.name] = $existing.Id
        $listUrls[$entity.name] = "$SiteUrl/Lists/$($entity.name)"
    } elseif ($VerifyOnly) {
        Write-Host "Missing list: $($entity.name)"
        $script:VerificationFindings += "Missing list: $($entity.name)"
    } else {
        Invoke-M365Json "spo" "list" "add" "--title" $entity.name "--baseTemplate" "GenericList" "--webUrl" $SiteUrl | Out-Null
        Write-Host "Created list: $($entity.name)"
        $created = Invoke-M365Json "spo" "list" "get" "--title" $entity.name "--webUrl" $SiteUrl
        $listIds[$entity.name] = $created.Id
        $listUrls[$entity.name] = "$SiteUrl/Lists/$($entity.name)"
    }
}

if ($VerifyOnly) {
    Write-Host "VerifyOnly set; skipping Title rename, list creation, and field creation."
} elseif (-not $IndexesOnly) {
    foreach ($entity in $entities) {
        $titleField = $entity.fields | Where-Object { $_.name -eq "Title" } | Select-Object -First 1
        if ($titleField -and $titleField.displayName -ne "Title") {
            Set-TitleDisplayName -ListTitle $entity.name -DisplayName $titleField.displayName
        }

        foreach ($field in $entity.fields) {
            if ($field.name -eq "Title") {
                continue
            }

            $xml = Get-FieldXml -Field $field -ListIds $listIds
            Add-FieldXml -ListTitle $entity.name -FieldXml $xml
        }
    }
} else {
    Write-Host "IndexesOnly set; skipping Title rename and field creation."
}

if ($VerifyOnly) {
    foreach ($entity in $entities) {
        if (-not $listIds.ContainsKey($entity.name)) {
            continue
        }

        foreach ($field in $entity.fields) {
            $existingField = Resolve-ListField -ListTitle $entity.name -RequestedName $field.name -DisplayName $field.displayName
            if (-not $existingField) {
                Write-Host "  Missing field ${entity.name}.$($field.name) ($($field.displayName))"
                $script:VerificationFindings += "Missing field: ${entity.name}.$($field.name) ($($field.displayName))"
            }
        }
    }
}

foreach ($entity in $entities) {
    if (-not $listIds.ContainsKey($entity.name)) {
        continue
    }

    foreach ($field in $entity.fields | Where-Object { $_.indexed }) {
        Set-FieldIndexed -ListTitle $entity.name -RequestedName $field.name -DisplayName $field.displayName
    }
}

if ($VerifyOnly -and $script:VerificationFindings.Count) {
    Write-Host "Verification failed:"
    $script:VerificationFindings | ForEach-Object { Write-Host "  $_" }
    throw "SharePoint provisioning verification failed with $($script:VerificationFindings.Count) issue(s)."
}

$summary = [PSCustomObject]@{
    siteUrl = $SiteUrl
    dataModelPath = $DataModelPath
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    includePhase2 = [bool]$IncludePhase2
    indexesOnly = [bool]$IndexesOnly
    verifyOnly = [bool]$VerifyOnly
    verificationFindings = $script:VerificationFindings
    lists = $entities | ForEach-Object {
        [PSCustomObject]@{
            name = $_.name
            displayName = $_.displayName
            id = $listIds[$_.name]
            webUrl = $listUrls[$_.name]
            fieldCount = @($_.fields).Count
        }
    }
}

$summaryDirectory = Split-Path -Parent $SummaryPath
if ($summaryDirectory) {
    New-Item -ItemType Directory -Force -Path $summaryDirectory | Out-Null
}

$summary | ConvertTo-Json -Depth 10 | Set-Content $SummaryPath -Encoding UTF8
Write-Host "Provisioning summary written to $SummaryPath"
