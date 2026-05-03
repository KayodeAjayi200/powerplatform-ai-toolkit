---
name: powerapps-delegation
description: Power Apps delegation assessment and resolution guide. Use this skill when a user has a delegation warning, is filtering a gallery, building a search, or working with large data sources in Power Apps Canvas Apps. Covers Dataverse, SharePoint, SQL, and Excel data sources.
license: MIT
metadata:
  author: KayodeAjayi200
  version: "1.0.0"
  organization: Veldarr
  date: April 2026
  abstract: >
    Expert delegation advisor for Power Apps Canvas Apps. Identifies delegation issues,
    assesses data correctness risk, and resolves them in strict priority order:
    server-side solutions first, then delegable formula rewrites, then controlled
    collection patterns. Never recommends increasing row limits as a fix.
---

# Power Apps Delegation — Assessment & Resolution

> Use this skill when a user has a delegation warning, is filtering a gallery, building a search,
> or working with any data source that may exceed 500 rows in Power Apps.

---

## ⚠️ Commenting Rule

Every formula you write must be commented in plain English.
Assume the reader has never written a Power Fx formula before.
Use `//` for single-line comments. Explain what the formula does and **why**.

---

## Core Principle — Read This First

> **Delegation is not a performance optimisation.**
> **Delegation is a data correctness requirement when data sources exceed 500 records.**

If delegation fails, Power Apps silently processes only the first **500–2,000 rows** locally in the browser.
The gallery will look correct but will show **incomplete data** — with no error message.

This is not a warning you can ignore. It is a data integrity failure.

---

## Step 1 — Identify Context

When a user shares a formula, app description, or delegation issue, first determine:

1. **What is the data source?**
   - Dataverse (strongest delegation support)
   - SharePoint (limited delegation)
   - SQL / Azure SQL (strong server-side execution)
   - Excel (minimal delegation — small datasets only)
   - Other connector

2. **Can the dataset exceed 2,000 rows?**
   - Assume **yes** unless the user explicitly states otherwise.
   - If yes, delegation must be resolved — not worked around.

---

## Step 2 — Delegation Risk Detection

Review every function in the formula. If any part is non-delegable, the **entire query** is non-delegable.

### High-risk functions — treat as non-delegable unless proven otherwise

| Function / Pattern | Risk |
|---|---|
| `Search()` | Non-delegable on most connectors |
| `In` operator | Non-delegable |
| `CountIf()` | Non-delegable |
| `Distinct()` | Non-delegable |
| `Left()`, `Right()`, `Mid()`, `Len()` | Non-delegable |
| Complex `If()` inside `Filter()` | Often non-delegable |
| Filtering on **calculated columns** | Non-delegable |
| Filtering on `.Value` of SharePoint Choice fields | Non-delegable |
| `Contains()` | Non-delegable on most connectors |
| `First(Filter(...))` | Prefer `LookUp()` instead |

> **Rule: If any part of a formula is non-delegable, treat the entire query result as unreliable at scale.**

---

## Step 3 — Data Source Rules

### Dataverse ✅ (Strongest delegation support)

- `Filter`, `Search` (on text columns), `SortByColumns`, `LookUp` are generally delegable.
- **Prefer Dataverse views** for complex multi-condition filtering — views run entirely server-side and are **not subject to Power Apps delegation limits at all**.
- Avoid filtering on calculated/rollup columns — these are evaluated client-side.

```powerfx
// ✅ Delegable — StartsWith on a Dataverse text column
Filter(Contacts, StartsWith(FullName, txtSearch.Text))

// ✅ Even better — use a Dataverse view for complex logic
// Set gallery Items to a view instead of writing Filter() at all:
galResults.Items = 'Active Contacts By Region'   // a named Dataverse view
```

### SharePoint ⚠️ (Limited delegation)

Delegation support is limited. Follow these rules strictly:

| ✅ Do this | ❌ Avoid this |
|---|---|
| `StartsWith(Column, value)` | `Search(List, value, "Column")` |
| `Filter(List, Column = value)` | `Filter(List, Column.Value = value)` — .Value is non-delegable |
| Index columns used in filters | Filtering on non-indexed columns at scale |
| Simple equality / comparison filters | `In`, `CountIf`, `Distinct` |

```powerfx
// ❌ WRONG — Search() is non-delegable on SharePoint
galResults.Items = Search(ProjectsList, txtSearch.Text, "Title")

// ✅ CORRECT — StartsWith IS delegable on SharePoint indexed text columns
galResults.Items = Filter(ProjectsList, StartsWith(Title, txtSearch.Text))
```

**SharePoint indexing requirement:** Any column used in a `Filter()` must be **indexed** in SharePoint list settings for delegation to work at scale (>5,000 items). Go to List Settings → Indexed Columns.

#### SharePoint Lookup, Choice, and Person fields

SharePoint Lookup, Choice, and Person columns appear in Power Apps as complex fields. They do not automatically make an app non-delegable, but they become risky when formulas query unsupported subfields or combine them with non-delegable operations.

Use this guidance before creating or reviewing a Canvas app over SharePoint lists:

| Pattern | Delegation posture |
|---|---|
| `Filter(Tasks, Project = cmbProject.Selected)` | Usually safe when the lookup column is indexed and the comparison is simple equality. |
| `Filter(Tasks, Project.Id = varProjectId)` | Prefer this when available; lookup IDs are stable and avoid display-name ambiguity. |
| `Filter(Tasks, Project.Value = "Alpha")` | Risky; avoid filtering by lookup display text at scale. |
| `StartsWith(Project.Value, txtSearch.Text)` | Avoid; SharePoint does not delegate `StartsWith` on Choice or Lookup subfields. |
| `SortByColumns(Tasks, "Project")` | Avoid; sorting complex fields is not delegable for SharePoint. |
| `Filter(Tasks, AssignedTo.Email = User().Email)` | Often acceptable because SharePoint delegates only specific Person subfields, especially `Email` and `DisplayName`. Verify in Studio. |
| `Filter(Tasks, AssignedTo.Department = "Ops")` | Avoid; unsupported Person subfields are non-delegable. |

When a screen needs scalable search/sort/grouping by related-record display names, denormalize the display value into an indexed text column on the child list, for example `ProjectName`, `ResourceName`, or `RequesterEmail`. Keep the lookup for referential navigation, but query the denormalized indexed field for gallery filters.

For SharePoint-backed apps that may exceed 2,000 rows:

- Index every lookup column used in equality filters.
- Avoid gallery sorting on Lookup, Choice, Person, or other complex columns.
- Avoid `Search()` for related records; use `StartsWith()` on an indexed text column on the base list.
- Keep filters on the base list. Do not build formulas that require Power Apps to expand several related lists before filtering.
- Use server-side list views, Power Automate, or Dataverse when the app needs joins, aggregates, many-to-many matching, or multi-field full-text search.

### SQL / Azure SQL ✅ (Strong server-side execution)

- Most `Filter` and `SortByColumns` operations delegate to SQL.
- Complex Power Fx logical composition (deeply nested `If()`) can still break delegation.
- Prefer **SQL views** for compound logic — this offloads all complexity to the database.

```powerfx
// ✅ Use LookUp instead of First(Filter()) — LookUp is delegable
LookUp(Orders, OrderID = varSelectedID)

// ❌ Avoid First(Filter()) — not always delegable
First(Filter(Orders, OrderID = varSelectedID))

// ✅ For complex logic — point the gallery at a SQL view instead:
galResults.Items = ActiveOrdersSummary   // a SQL view with the logic baked in
```

### Excel ❌ (Minimal delegation — small datasets only)

- Delegation is essentially non-existent for Excel.
- Suitable **only** for datasets that will never grow beyond a few hundred rows.
- If the dataset may grow, migrate to Dataverse or SharePoint.

---

## Step 4 — Delegation Decision Outcome

### If fully delegable ✅
- Confirm the solution is safe and scalable at production data volumes.
- Reinforce that this is the correct approach.

### If partially or fully non-delegable AND dataset may grow ❌
- **Do not approve the solution.**
- **Do not recommend increasing the row limit as a fix.**
- Explain clearly:
  - Why results may currently appear correct but are factually incomplete.
  - Why the problem will get worse as data grows.
  - What the correct fix is (see Step 5).

---

## Step 5 — Approved Resolution Order (Strict Priority)

You must always recommend in this order. Do not skip to a lower option if a higher one is possible.

### 1️⃣ Server-Side Solutions — Always try this first

Move the complexity out of Power Fx and into the data source.

| Approach | When to use |
|---|---|
| **Dataverse view** | Complex multi-condition filters, reusable logic |
| **SQL view** | Compound queries, aggregations, joins |
| **SharePoint indexed columns** | Scale beyond 5,000 items |
| **Data model change** | Normalise data so filters can be simple and delegable |

```powerfx
// Instead of a complex Filter() formula, point the gallery at a server-side view:
galResults.Items = 'High Priority Open Cases'   // Dataverse view — no delegation limit
```

✅ This is the only approach that preserves both correctness and scalability permanently.

---

### 2️⃣ Delegable Formula Rewrite — If server-side is not possible

Rewrite the formula to use only delegable functions for the target data source.

```powerfx
// ❌ BEFORE — non-delegable (Search is not delegable on SharePoint)
galResults.Items = Search(Tasks, txtSearch.Text, "Title", "Description")

// ✅ AFTER — delegable rewrite (StartsWith IS delegable)
// Note: this only searches on Title, not Description — a known limitation
galResults.Items =
    If(
        IsBlank(txtSearch.Text),
        // No search active — return all, sorted
        SortByColumns(Tasks, "Modified", SortOrder.Descending),
        // Search active — use delegable StartsWith on Title only
        Filter(Tasks, StartsWith(Title, txtSearch.Text))
    )
```

✅ Acceptable if full delegation is restored. Always document what the rewrite trades off.

---

### 3️⃣ Controlled Collection Pattern — Conditional use only

Allowed **only if:**
- A narrow, delegable filter first reduces the dataset to a known manageable size
- The remaining non-delegable logic runs on that limited result set

```powerfx
// Step 1: Delegable filter narrows to a small known subset first
// (e.g., only records assigned to the current user — likely < 100 rows)
ClearCollect(
    colMyTasks,
    Filter(Tasks, AssignedTo = User().Email)   // ✅ this part IS delegable
)

// Step 2: Non-delegable logic now runs on the small collection — safe because it's small
galResults.Items =
    Filter(
        colMyTasks,
        // Search across multiple fields — non-delegable, but OK on a small collection
        txtSearch.Text in Title || txtSearch.Text in Description
    )
```

⚠️ **You must warn the user that:**
- This does not scale automatically.
- If the delegable pre-filter returns a large number of rows, this pattern fails silently.
- Dataset growth must be controlled and monitored.

---

### 4️⃣ Explicit Rejection — When none of the above applies

If none of the above can solve the problem:

- State clearly that **the requirement cannot be met reliably with Power Apps and the current data source.**
- Explain the data correctness risk in plain terms.
- Recommend a data architecture change (e.g., migrate to Dataverse, add a SQL view, restructure the data model).

---

## ❌ Never Recommend These

These are commonly suggested but they are **not fixes**. Never present them as solutions:

| "Solution" | Why it is not a solution |
|---|---|
| Increase delegation row limit to 2,000 | Only delays the failure. Still breaks at 2,001 rows. |
| "Works fine in testing" | Test datasets are small. Delegation failures appear at production scale. |
| Ignoring the yellow delegation warning triangle | The warning is a data integrity failure notice, not a style warning. |

---

## Quick Diagnosis Reference

When a user shows you a gallery formula, run through this checklist mentally:

```
1. What data source? → Dataverse / SharePoint / SQL / Excel / Other
2. Could data exceed 2,000 rows? → Assume yes
3. Does the formula use any high-risk functions?
   → Search, In, CountIf, Distinct, Left/Right/Mid, Contains, .Value, calculated columns
4. If yes → entire query result is unreliable at scale
5. Resolution order:
   → 1️⃣ Dataverse/SQL view or indexed columns
   → 2️⃣ Delegable formula rewrite
   → 3️⃣ Controlled collection (with narrow delegable pre-filter)
   → 4️⃣ Reject and escalate
```

---

## Common Patterns — Corrected Examples

### Pattern 1: Gallery search on Dataverse

```powerfx
// ❌ WRONG — Search() with multiple fields may not be fully delegable
galResults.Items = Search(Accounts, txtSearch.Text, "name", "emailaddress1")

// ✅ CORRECT — use a delegable Filter with StartsWith, or a Dataverse view
galResults.Items =
    If(
        IsBlank(Trim(txtSearch.Text)),
        SortByColumns(Accounts, "name", SortOrder.Ascending),
        Filter(Accounts, StartsWith(name, Trim(txtSearch.Text)))
    )
// Note: this searches on 'name' only. For multi-field search, use a Dataverse view
// that exposes a computed search column, or use Dataverse search (full-text search feature)
```

### Pattern 2: Status filter on SharePoint

```powerfx
// ❌ WRONG — Choice field .Value is non-delegable
galResults.Items = Filter(ProjectsList, Status.Value = "Active")

// ✅ CORRECT — filter on the column directly
galResults.Items = Filter(ProjectsList, Status = "Active")
```

### Pattern 3: Multi-filter with active counter

```powerfx
// Track filter state in a collection so it's easy to count active filters
// (See PowerApps-Canvas-Design-Skill.md Section 5 for the full collection pattern)

// The gallery filter — keep each condition simple and delegable:
galResults.Items =
    Filter(
        Tasks,
        // Status filter — equality is delegable on Dataverse/SharePoint
        (varStatusFilter = "All" || Status = varStatusFilter),
        // Date filter — comparison operators are delegable
        (IsBlank(varDateFrom) || DueDate >= varDateFrom),
        (IsBlank(varDateTo)   || DueDate <= varDateTo)
        // ⚠️ Do NOT add a Search() or Contains() here — it breaks delegation
        // Add full-text search via a separate Dataverse view or Dataverse Search feature
    )
```

### Pattern 4: LookUp instead of First(Filter())

```powerfx
// ❌ WRONG — First(Filter()) is not always delegable
Set(varRecord, First(Filter(Orders, ID = varSelectedID)))

// ✅ CORRECT — LookUp is delegable and purpose-built for this
Set(varRecord, LookUp(Orders, ID = varSelectedID))
```

---

## Response Style

When advising users:

- **Be direct and factual.** State the problem clearly.
- **State the risk.** Don't soften "your data may be wrong."
- **Recommend in priority order.** Always try the higher-order fix first.
- **Explain trade-offs** when a lower-order solution is the only option.
- **Avoid:** conversational filler, "great question!", consultant hedging.
