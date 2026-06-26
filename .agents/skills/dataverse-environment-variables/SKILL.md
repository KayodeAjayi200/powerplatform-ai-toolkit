---
name: dataverse-environment-variables
description: Create, configure, and manage Dataverse environment variables inside a Power Platform solution — including Text, Number, Boolean, JSON, DataSource (SharePoint site + list), and Secret types. Use when a user needs to parameterise connection details, SharePoint site URLs, list bindings, or configuration values so they can change per-environment without modifying the app. Covers REST API patterns for definition and value creation, DataSource parent binding, Export=No configuration, SharePoint list GUID lookup, and the RemoveSolutionComponent quirk.
---

# Dataverse Environment Variables

Use this skill when a user needs to create environment variables in a Dataverse solution — especially DataSource bindings for SharePoint or when they need values to not export with the solution ZIP.

## Principles

- Always create environment variables inside a solution, never loose in the environment.
- Always set the **current value** (`environmentvariablevalue` entity), not the `defaultvalue` on the definition, for live environment data.
- For SharePoint-backed canvas apps, always use **DataSource** type (`100000004`) instead of Text — it gives the app a connector-aware binding.
- After `AddSolutionComponent`, immediately remove type-381 (value) components from the solution to set Export=No and prevent values from travelling with the ZIP.
- Never store secret values in environment variable current values — use Secret type (`100000005`) backed by Azure Key Vault.
- Confirm list GUIDs before creating DataSource list definitions — the value must be the SharePoint list GUID, not the display name.

## When to use this skill

- User wants to parameterise a SharePoint site URL or list for a canvas app
- User needs connection details to change per-environment without touching the app
- User wants to set Export=No so environment-specific values don't travel with the solution
- User needs to create environment variables programmatically via the Dataverse Web API
- User asks about `environmentvariabledefinition`, `environmentvariablevalue`, DataSource type, or `parameterkey`

## Quick Workflow

1. Confirm the publisher prefix for the solution (e.g. `tm_`, `contoso_`)
2. Get a Dataverse bearer token via `az account get-access-token --resource <orgUrl>`
3. Create the definition (type + schema name + display name)
4. Create the current value (separate entity, linked by OData bind)
5. Add the definition to the solution via `AddSolutionComponent` (type 380)
6. Remove the value record from the solution via `RemoveSolutionComponent` (type 381) to set Export=No
7. For DataSource: create site definition first, then list definitions parented to the site
8. Verify with `environmentvariabledefinitions` and `environmentvariablevalues` queries

## Type codes

| Type | Code | Notes |
|---|---|---|
| Text | `100000000` | Strings, flags |
| Number | `100000001` | Numeric |
| Boolean | `100000002` | On/off |
| JSON | `100000003` | Structured config |
| DataSource | `100000004` | SharePoint site (`parameterkey=dataset`) or list (`parameterkey=table`) |
| Secret | `100000005` | Key Vault backed |

## Key gotchas

- `RemoveSolutionComponent` does **not** accept `ComponentId` — pass a `solutioncomponent` entity reference where `solutioncomponentid = objectid` of the value record
- `AddSolutionComponent` silently adds the type-381 value record — always run the Export=No removal step
- DataSource list value = SharePoint list **GUID**, not display name
- `m365 cli` lacks Dataverse consent — use `az account get-access-token`
- DataSource list definitions must have `"ParentDefinitionId@odata.bind"` pointing to the site definition

## Full reference

Read `skills/dataverse-environment-variables.md` for complete REST API patterns, PowerShell scripts, SharePoint GUID lookup, Export=No removal, and verification queries.
