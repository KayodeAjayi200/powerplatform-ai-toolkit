# SharePoint List Design Skill

Use this skill whenever you plan or create SharePoint lists/columns for Power Apps.

## Core Rules

- Create SharePoint fields with clean internal names first: `DueDate`, `AssignedTo`, `EstimatedHours`.
- Do not create fields with spaces in `Name`, `StaticName`, or initial `DisplayName`.
- After the field exists, optionally rename only the display title to a friendly label such as `Due Date`.
- Do not rename the built-in `Title` column.
- Set custom fields to optional by default: `Required="FALSE"`.
- Set `Title` to not required where SharePoint allows it. If it remains required, generate a draft-safe `Title` value in Power Apps instead.
- Design lists so partial records can be saved as drafts. Enforce required business validation in the app when submitting final records, not at the SharePoint column layer by default.

## Why This Matters

SharePoint locks the internal field name when a column is created. If a field is created with a space, SharePoint may encode it into names like `Due_x0020_Date`. Those encoded names then show up in Power Fx, APIs, JSON, Power Automate, and integrations.

Clean internal names keep formulas and automation readable:

```text
Good: DueDate, AssignedTo, EstimatedHours
Bad: Due_x0020_Date, Assigned_x0020_To, Estimated_x0020_Hours
```

## Correct Creation Pattern

Create with no spaces and optional required state:

```powershell
m365 spo field add `
  --webUrl $siteUrl `
  --listTitle $listTitle `
  --xml '<Field Type="DateTime" DisplayName="DueDate" Name="DueDate" StaticName="DueDate" Required="FALSE" />'
```

Then optionally rename the display title:

```powershell
m365 spo field set `
  --webUrl $siteUrl `
  --listTitle $listTitle `
  --fieldTitle "DueDate" `
  --title "Due Date" `
  --required false
```

## Title Column Policy

Do not rename `Title` to another business field name. Either:

- leave it hidden/unused in the app,
- set it to not required where SharePoint permits,
- or patch an automatic value for drafts.

Draft-safe Power Fx example:

```powerfx
Patch(
    Tasks,
    Defaults(Tasks),
    {
        Title: Coalesce(txtTitle.Text, "Draft-" & Text(GUID())),
        Status: "Draft",
        DueDate: datDueDate.SelectedDate
    }
)
```

## Validation Checklist

Before creating SharePoint columns, verify:

- Internal names contain only letters/numbers and no spaces.
- Initial `DisplayName`, `Name`, and `StaticName` match the clean internal name.
- Custom fields include `Required="FALSE"`.
- Friendly display names are applied only after successful creation.
- The built-in `Title` column is not renamed.
- Draft save behavior does not depend on all fields being complete.
