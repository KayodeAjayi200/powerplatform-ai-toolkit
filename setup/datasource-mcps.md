# Datasource → MCP Mapping

This file is read by the AI agent when planning and creating data sources.

Use this to match the user's data needs to the right datasource type, MCP server, and creation commands.

---

## Decision guide

Ask yourself: what kind of data does this app need?

| If the data is... | Use this datasource | Why |
|---|---|---|
| Structured records, relationships, business data | **Dataverse** | Best Power Apps integration; supports delegation fully; built for enterprise apps |
| Simple lists, already in SharePoint, low volume | **SharePoint Lists** | Easy for non-technical users; good when SharePoint is already in use |
| Existing corporate database, complex queries | **Azure SQL / SQL Server** | Use when data is already in SQL or when complex joins are needed |
| Spreadsheet data, small static reference data | **Excel on OneDrive** | Only for very simple, low-volume, read-mostly data — does not support delegation |

**Default recommendation:** Use **Dataverse** for any new app unless the user has a specific reason to use SharePoint or SQL.

---

## Dataverse

**MCP server:** `dataverse` (see `mcp-tools/dataverse.md`)  
**Official docs:** https://learn.microsoft.com/en-us/power-apps/maker/data-platform/

### When to use
- New apps with custom data requirements
- Apps that need relationships between tables (e.g. Customer → Orders)
- Apps that need business rules, calculated columns, or security roles
- Apps used by more than a handful of people

### Create a Dataverse table

```powershell
# Requires pac CLI signed in to the correct environment
# Replace the values below with your table details

# List available environments first (to confirm which one to use)
pac env list

# Select the target environment
pac env select --environment "YOUR_ENV_NAME_OR_ID"

# Create a new table (use PascalCase for display name, lowercase for schema name)
pac dataverse table create `
    --display-name "Project"  `
    --plural-display-name "Projects" `
    --schema-name "new_Project"

# After creating the table, add custom columns through Power Apps Studio:
# Data → Tables → [your table] → + Add column
```

Official reference for tables: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-edit-entities-portal

### Add Dataverse to an app (Power Fx)

In the Canvas Authoring MCP, or in Power Apps Studio:
- Data panel → Add data → Dataverse → select your table
- Power Fx reference: `Filter(TableName, Column = value)`

**Delegation support:** Dataverse supports full delegation for Filter, Sort, and Search — see `skills/delegation.md`.

---

## SharePoint Lists and Sites

**MCP server:** None dedicated — use m365 CLI to create sites and lists; Power Apps connects via the SharePoint connector
**Full SharePoint setup guide:** `setup/sharepoint.md` — covers site creation, list creation, column types, permissions, and app registration for automation
**Official docs:** https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/connections/connection-sharepoint-online

### When to use
- User's organisation already uses SharePoint heavily
- Simple flat data (no relationships needed)
- Non-technical users need to maintain the list directly in SharePoint

### Create a SharePoint list

```powershell
# Sign in to Microsoft 365 first (opens a browser login)
m365 login

# Create a new SharePoint list on your team site
# Replace the site URL and list details
m365 spo list add `
    --title "Projects" `
    --webUrl "https://YOURTENANT.sharepoint.com/sites/YOURSITE"

# Add columns to the list
m365 spo field add `
    --webUrl "https://YOURTENANT.sharepoint.com/sites/YOURSITE" `
    --listTitle "Projects" `
    --xml '<Field Type="Text" DisplayName="Project Name" Name="ProjectName" />'

m365 spo field add `
    --webUrl "https://YOURTENANT.sharepoint.com/sites/YOURSITE" `
    --listTitle "Projects" `
    --xml '<Field Type="DateTime" DisplayName="Due Date" Name="DueDate" />'
```

Official reference for m365 CLI: https://pnp.github.io/cli-microsoft365/cmd/spo/list/list-add/

### Connect SharePoint to a canvas app

In Power Apps Studio: Data → Add data → SharePoint → enter site URL → select list

**Delegation warning:** SharePoint delegation is limited. Read `skills/delegation.md` before building filters or search on a SharePoint list. The `Filter` function only delegates for specific column types and operators.

---

## Azure SQL / SQL Server

**MCP server:** None included by default — the SQL Server connector in Power Apps handles data access  
**Official docs:** https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/connections/sql-server-connection

### When to use
- Data is already in an existing SQL database
- Complex queries or joins are needed
- High volume data (millions of rows)

### Create tables (if building a new database)

```powershell
# Run T-SQL against your Azure SQL instance via sqlcmd or Azure Data Studio
# Example: create a Projects table
sqlcmd -S YOUR_SERVER.database.windows.net -d YOUR_DATABASE -U YOUR_USER -P YOUR_PASSWORD -Q "
CREATE TABLE Projects (
    Id         INT IDENTITY PRIMARY KEY,
    Name       NVARCHAR(200) NOT NULL,
    Status     NVARCHAR(50),
    DueDate    DATE,
    CreatedAt  DATETIME2 DEFAULT GETUTCDATE()
)"
```

### Connect SQL to a canvas app

In Power Apps Studio: Data → Add data → SQL Server → enter connection details

**Delegation:** SQL Server supports full delegation for Filter and Sort on indexed columns. See `skills/delegation.md`.

---

## Excel on OneDrive

**MCP server:** None — Power Apps connects via the OneDrive for Business connector  
**Official docs:** https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/connections/connection-excel

### When to use
- Very simple lookup data (e.g. a reference list of countries, categories)
- Data that already exists in a spreadsheet and won't grow large
- Proof-of-concept or demo apps only

### Prepare an Excel file

1. Create an Excel file in OneDrive for Business
2. Format the data as a **Table** (Insert → Table) — Power Apps requires this
3. Name the table (Table Design → Table Name)

### Connect Excel to a canvas app

In Power Apps Studio: Data → Add data → OneDrive for Business → select the file → select the table

**Warning:** Excel does not support delegation. All filtering and sorting happens client-side with a maximum of 500 rows returned. Never use Excel for production apps with more than a few hundred rows.

---

## Choosing between datasources — quick checklist

Ask the user these questions:

1. **Is this data already somewhere?** (SharePoint list, SQL database, Excel file) — if yes, connect to it rather than creating something new
2. **How many records will this app eventually manage?** — if more than a few thousand, avoid SharePoint and Excel
3. **Do records relate to each other?** (e.g. a Customer has many Orders) — if yes, use Dataverse
4. **Will non-technical users need to edit the data outside the app?** — if yes, SharePoint is easier for them to manage directly
