# AGENT SKILL: Power Apps Canvas Apps

> **Reference for AI agents working with Power Apps Canvas Apps.**
> Use this when a user asks you to build, modify, debug, or explain a Canvas App,
> its controls, properties, components, or Power Fx formulas.

---

## ⚠️ Commenting Rule — Always follow this

**Every formula you write must be commented in plain English.** Assume the person reading the code has never written a formula or seen code before. Comments should explain *what* the formula does and *why*, not just repeat the code.

Power Fx uses `//` for single-line comments and `/* */` for multi-line. Use them everywhere — on buttons, galleries, labels, screens, collections, everything.

**Examples of good commenting:**

```powerfx
// When the user clicks Search, filter the Orders list to only show rows
// where the Title column contains whatever the user typed in the search box
Filter(Orders, SearchText in Title)
```

```powerfx
// Show this button only if the current user is an admin.
// User().Email gets the logged-in person's email address.
User().Email in AdminEmails
```

```powerfx
// Loop through every item in the PendingOrders list and save each one
// to the Orders table in Dataverse, then clear the pending list.
ForAll(PendingOrders, Patch(Orders, Defaults(Orders), ThisRecord));
Clear(PendingOrders)
```

```powerfx
// When this screen loads, get the 10 most recently modified records
// from the Expenses table and store them in a local variable called RecentExpenses
Set(RecentExpenses, FirstN(Sort(Expenses, Modified, SortOrder.Descending), 10))
```

> ✅ A non-technical reader should be able to read your comments and understand exactly what the app is doing at each step — without understanding Power Fx syntax.

---

## 🚨 Layout Rule — Always Use Containers

> **Before building any screen, read `skills/PowerApps-Canvas-Design-Skill.md`.**

**Never position controls on a screen using absolute X/Y coordinates. Always use Horizontal and Vertical Containers.** Containers make apps responsive, reusable, and easy to maintain.

- **Vertical Container** — stacks things top-to-bottom (page structure, sidebars, forms)
- **Horizontal Container** — places things side-by-side (nav bars, icon+label rows, button groups)
- **Nest them** — a Horizontal Container can contain Vertical Containers for complex layouts

Every screen structure should look like this:
```
Screen
└── VerticalContainer (full screen)
    ├── HorizontalContainer  ← header
    ├── HorizontalContainer  ← body (contains side nav + main content)
    └── HorizontalContainer  ← footer (optional)
```

For the full set of container properties, responsive patterns, and design rules → see `skills/PowerApps-Canvas-Design-Skill.md`.

---

## Quick orientation

| Concept | What it is |
|---|---|
| **Canvas App** | A low-code app where you drag controls onto screens and write Power Fx formulas |
| **Screen** | Top-level container; apps have one or more screens; navigate between them with `Navigate()` |
| **Control** | A UI element (Button, Gallery, Label, etc.) placed on a screen |
| **Property** | A setting on a control (position, color, data, behavior) set via Power Fx formulas |
| **Power Fx** | The Excel-like formula language used for all logic in Canvas Apps |
| **Component** | A reusable custom control built from other controls, with Input/Output properties |
| **Collection** | An in-memory table created and managed inside the app |
| **Data Source** | An external table connected to the app (SharePoint, Dataverse, SQL, etc.) |

---

## Controls — Complete Reference

### Input & Selection

| Control | Key Properties | Notes |
|---|---|---|
| **Button** | `Text`, `OnSelect`, `DisplayMode` | Primary action trigger |
| **Text Input** | `Default`, `Text`, `Mode` (SingleLine/MultiLine/Password), `DelayOutput`, `Placeholder` | `Text` is read-only output; set `Default` to pre-fill |
| **Dropdown** | `Items`, `Selected`, `SelectedText`, `Default` | `Selected` returns the whole record; use `.Value` for the display field |
| **Combo Box** | `Items`, `SelectMultiple`, `SelectedItems`, `DefaultSelectedItems` | Use when multi-select or search is needed |
| **List Box** | `Items`, `Selected`, `SelectedItems` | Always-visible list, supports multi-select |
| **Check Box** | `Default` (bool), `Value`, `Text`, `OnCheck`, `OnUncheck`, `CheckmarkFill` | `Value` = current state |
| **Radio** | `Items`, `Selected` | Single-choice button group |
| **Toggle** | `Default` (bool), `Value`, `TrueText`, `FalseText` | Sliding on/off switch |
| **Slider** | `Min`, `Max`, `Default`, `Value`, `Step`, `ThumbFill` | `Value` is the current number |
| **Rating** | `Min`, `Max`, `Default`, `Value` | Star-based rating input |
| **Date Picker** | `SelectedDate`, `DefaultDate`, `Format` | Date only (no time); time via separate Text Input |
| **Pen Input** | `Image`, `OnSelect` | Captures freehand ink/signature as image |
| **Rich Text Editor** | `HtmlText`, `Default` | Output is HTML; full formatting controls for user |
| **Attachments** | `Items`, `AddAttachmentText`, `MaxAttachments` | Used in forms linked to SharePoint/Dataverse |

### Display

| Control | Key Properties | Notes |
|---|---|---|
| **Label** | `Text`, `Color`, `Size`, `Align`, `VerticalAlign`, `Wrap` | Most common display control |
| **HTML Text** | `HtmlText` | Renders HTML — hyperlinks, formatting, etc. |
| **Data Table** | `Items`, `HeadingFill`, `NoDataText` | Read-only tabular grid; good for simple lists |
| **Display Form** | `DataSource`, `Item`, `DefaultMode` (View) | Shows one record read-only |
| **Edit Form** | `DataSource`, `Item`, `DefaultMode` (Edit/New), `OnSuccess`, `OnFailure`, `LastSubmit` | Shows one record for editing or creating |
| **Card** | `DataField`, `Default`, `Update`, `Required` | Auto-generated inside forms; one per field |
| **Gallery** | `Items`, `Selected`, `TemplateSize`, `TemplatePadding`, `Layout` | Repeating list of records; template defines per-item look |

### Media

| Control | Key Properties | Notes |
|---|---|---|
| **Image** | `Image`, `ImagePosition` (Fill/Fit/Center/Tile/Stretch) | Displays image from URL, collection, or data |
| **Camera** | `Camera` (0=rear, 1=front), `Photo`, `OnSelect` | `Photo` holds last captured image |
| **Microphone** | `Audio`, `OnStop` | Records audio |
| **Audio** | `Media`, `Start`, `Pause`, `Volume` | Plays audio from URL or media resource |
| **Video** | `Media`, `Start`, `Volume`, `ShowControls` | Supports YouTube URLs and local media |
| **PDF Viewer** | `Document`, `CurrentPage`, `Page` | Experimental; displays PDF from URL |
| **Add Picture** | `Image`, `Media`, `OnChange` | Lets user load image from device |

### Charts

| Control | Items schema needed | Notes |
|---|---|---|
| **Column Chart** | Table with category + value columns | Vertical bars |
| **Line Chart** | Table with series data | Trend lines |
| **Pie Chart** | Table with `Labels` and `Values` columns | Proportional slices |

### Layout & Containers

| Control | Notes |
|---|---|
| **Container** | Groups controls; no visual output itself |
| **Horizontal Container** | Auto-arranges children left-to-right; enables responsive layout |
| **Vertical Container** | Auto-arranges children top-to-bottom |
| **Screen** | Top-level container; has `OnVisible`, `OnHidden`, `Fill`, `BackgroundImage` |

### Maps & Mixed Reality

| Control | Notes |
|---|---|
| **Map** | Plots locations; properties: `Items`, `Latitude`, `Longitude`, `Zoom` |
| **3D Object** | Renders GLB 3D model |
| **View in MR** | Places 3D content in real world via AR camera |
| **Measuring Camera** | Measures distance/area/volume via device camera |

### AI Builder Components

| Component | What it does | Key output properties |
|---|---|---|
| **Business Card Reader** | Extracts contact info from photo | `FullName`, `Email`, `Phone`, `Company` |
| **Form Processor** | Extracts fields from a scanned form/invoice | Per-field text outputs |
| **Object Detector** | Identifies objects in an image | `Results` (table: Tag, Score, BoundingBox) |
| **Text Recognizer** | OCR — extracts text from images | `Results` (table of text regions) |

---

## Control Properties — Common Reference

### Position & Size
| Property | Type | Description |
|---|---|---|
| `X` | Number | Left edge position in pixels |
| `Y` | Number | Top edge position in pixels |
| `Width` | Number | Width in pixels |
| `Height` | Number | Height in pixels |
| `ZIndex` | Number | Layer order (higher = in front) |

### Visibility & Interaction
| Property | Type | Description |
|---|---|---|
| `Visible` | Boolean | Show/hide the control |
| `DisplayMode` | Enum | `DisplayMode.Edit`, `DisplayMode.View`, `DisplayMode.Disabled` |
| `TabIndex` | Number | Keyboard nav order; -1 = excluded |
| `Tooltip` | Text | Hover text |
| `AccessibleLabel` | Text | Screen-reader label |

### Color & Style
| Property | Type | Description |
|---|---|---|
| `Fill` | Color | Background fill |
| `Color` | Color | Text/icon foreground color |
| `BorderColor` | Color | Border color |
| `BorderThickness` | Number | Border width in pixels |
| `BorderStyle` | Enum | `Solid`, `Dashed`, `Dotted`, `None` |
| `HoverFill` | Color | Background on mouse hover |
| `PressedFill` | Color | Background when pressed |
| `DisabledFill` | Color | Background when disabled |

**Setting colors:**
```powerfx
// 3 ways to set a color value:
Color.Blue                     // built-in enum
ColorValue("#0078D4")          // hex string
RGBA(0, 120, 212, 1)          // red, green, blue, alpha(0-1)
ColorFade(Color.Blue, -20%)    // darken by 20%
```

### Typography
| Property | Type | Description |
|---|---|---|
| `Font` | Text | Font family name |
| `Size` | Number | Font size in points |
| `FontWeight` | Enum | `Bold`, `Semibold`, `Normal`, `Lighter` |
| `Italic` | Boolean | Italic text |
| `Underline` | Boolean | Underlined text |
| `Align` | Enum | `Left`, `Center`, `Right`, `Justify` |
| `VerticalAlign` | Enum | `Top`, `Middle`, `Bottom` |

### Events (Behavior Properties)
| Property | When it fires |
|---|---|
| `OnSelect` | User taps/clicks the control |
| `OnChange` | Control value changes |
| `OnVisible` (Screen) | Screen becomes active |
| `OnHidden` (Screen) | Screen is navigated away from |
| `OnSuccess` (Form) | Form submitted successfully |
| `OnFailure` (Form) | Form submission failed |
| `OnTimerEnd` (Timer) | Timer duration elapsed |

---

## Components — Reusable Custom Controls

### Creating a component
1. Open **Tree View → Components → New component**
2. Add controls inside (they form the component's UI)
3. Define **custom properties** (Data → New custom property)

### Custom property types
| Type | Direction | Usage |
|---|---|---|
| **Input** | App → Component | Data the parent sends in (Text, Number, Boolean, Record, Table, Color, etc.) |
| **Output** | Component → App | Data the component exposes out (e.g. `MyComponent.SelectedValue`) |
| **Behavior** (experimental) | App → Component | Event handler the parent provides (called by the component) |

### Using a component
```powerfx
// Parent sets input property:
MyHeaderComponent.Title = "Expenses App"

// Parent reads output property:
If(MyMenuComponent.SelectedPage = "Settings", Navigate(SettingsScreen))
```

### Component Libraries
- Create in a **Component Library** app (separate from your main app)
- Publish the library, then import components into any canvas app
- Updates propagate: apps get an "Update available" prompt when library changes

---

## Power Fx Functions — Complete Reference

### 🎨 Color
| Function | Example | Returns |
|---|---|---|
| `RGBA(r,g,b,a)` | `RGBA(255,0,0,1)` | Color (solid red) |
| `ColorValue(str)` | `ColorValue("#FF0000")` | Color |
| `ColorFade(color, pct)` | `ColorFade(Color.Blue, -20%)` | Darker blue |
| `Color.*` | `Color.Red` | Color enum constant |

### 📦 Data — Read & Query
| Function | Example | Returns |
|---|---|---|
| `Filter(table, condition)` | `Filter(Orders, Status="Open")` | Table |
| `LookUp(table, condition)` | `LookUp(Employees, ID=42)` | Record |
| `Search(table, term, col1, col2)` | `Search(Customers, txtSearch.Text, "Name", "City")` | Table |
| `Sort(table, expr, order)` | `Sort(Products, Price, Ascending)` | Table |
| `SortByColumns(table, col, order)` | `SortByColumns(Employees, "Name", Ascending)` | Table |
| `First(table)` | `First(Orders)` | Record |
| `Last(table)` | `Last(Orders)` | Record |
| `FirstN(table, n)` | `FirstN(Orders, 5)` | Table |
| `LastN(table, n)` | `LastN(Orders, 5)` | Table |
| `Index(table, n)` | `Index(MyTable, 3)` | Record |
| `Distinct(table, expr)` | `Distinct(Orders, Region)` | Single-col table |
| `GroupBy(table, col, name)` | `GroupBy(Orders, "Region", "Items")` | Table with nested tables |
| `Ungroup(table, col)` | `Ungroup(Grouped, "Items")` | Flat table |
| `AddColumns(table, name, expr)` | `AddColumns(Products, "Total", Price*Qty)` | Table with extra col |
| `DropColumns(table, col)` | `DropColumns(T, "TempCol")` | Table without that col |
| `ShowColumns(table, col1, ...)` | `ShowColumns(Employees, "Name", "Email")` | Slim table |
| `RenameColumns(table, old, new)` | `RenameColumns(T, "Author", "Owner")` | Table with renamed col |
| `ForAll(table, expr)` | `ForAll(Orders, Patch(Orders, ThisRecord, {Done:true}))` | Table of results or side-effects |

### ✏️ Data — Write
| Function | Example | Notes |
|---|---|---|
| `Patch(ds, record, changes)` | `Patch(Orders, ThisItem, {Status:"Done"})` | Update existing record |
| `Patch(ds, Defaults(ds), fields)` | `Patch(Orders, Defaults(Orders), {Title:"New"})` | Create new record |
| `Collect(collection, record)` | `Collect(MyList, {Name:"Jane"})` | Add to collection |
| `ClearCollect(collection, table)` | `ClearCollect(MyList, Filter(DS, Active))` | Replace entire collection |
| `Clear(collection)` | `Clear(TempList)` | Empty a collection |
| `Remove(ds, record)` | `Remove(Employees, ThisItem)` | Delete a record |
| `RemoveIf(ds, condition)` | `RemoveIf(Employees, Status="Inactive")` | Delete matching records |
| `UpdateIf(ds, condition, changes)` | `UpdateIf(Orders, Region="West", {Tax: 0.1})` | Batch update |
| `Relate(table.rel, record)` | `Relate(Account.Contacts, contact)` | Link records (Dataverse) |
| `Unrelate(table.rel, record)` | `Unrelate(Account.Contacts, contact)` | Unlink records |
| `Refresh(datasource)` | `Refresh(OrdersList)` | Reload from server |

### 🔢 Math & Aggregates
| Function | Example | Returns |
|---|---|---|
| `Sum(table, expr)` | `Sum(Orders, Amount)` | Number |
| `Average(table, expr)` | `Average(Scores, Value)` | Number |
| `Min(table, expr)` | `Min(Orders, Price)` | Number |
| `Max(table, expr)` | `Max(Orders, Price)` | Number |
| `CountRows(table)` | `CountRows(Orders)` | Number |
| `CountIf(table, condition)` | `CountIf(Tasks, Done=true)` | Number |
| `Round(n, decimals)` | `Round(3.456, 2)` → 3.46 | Number |
| `RoundDown(n, d)` | `RoundDown(3.9, 0)` → 3 | Number |
| `RoundUp(n, d)` | `RoundUp(3.1, 0)` → 4 | Number |
| `Abs(n)` | `Abs(-5)` → 5 | Number |
| `Mod(n, d)` | `Mod(17, 5)` → 2 | Number |
| `Sqrt(n)` | `Sqrt(16)` → 4 | Number |
| `Power(base, exp)` | `Power(2,3)` → 8 | Number |
| `Int(n)` | `Int(4.9)` → 4 | Number |
| `Trunc(n)` | `Trunc(-4.9)` → -4 | Number |
| `Log(n, base)` | `Log(100, 10)` → 2 | Number |
| `Pi()` | `Pi()` → 3.14159… | Number |

### 📝 Text
| Function | Example | Returns |
|---|---|---|
| `Text(value, format)` | `Text(Today(), "dd/mm/yyyy")` | Text |
| `Value(text)` | `Value("42")` → 42 | Number |
| `Len(text)` | `Len("Hello")` → 5 | Number |
| `Upper(text)` | `Upper("hello")` → "HELLO" | Text |
| `Lower(text)` | `Lower("HELLO")` → "hello" | Text |
| `Proper(text)` | `Proper("john doe")` → "John Doe" | Text |
| `Trim(text)` | `Trim("  hi  ")` → "hi" | Text |
| `TrimEnds(text)` | `TrimEnds("  hi  ")` → "hi" (preserves internal spaces) | Text |
| `Left(text, n)` | `Left("abcdef", 3)` → "abc" | Text |
| `Right(text, n)` | `Right("abcdef", 2)` → "ef" | Text |
| `Mid(text, start, len)` | `Mid("abcdef", 2, 3)` → "bcd" | Text |
| `Find(needle, haystack)` | `Find("or", "World")` → 2 | Number |
| `StartsWith(text, prefix)` | `StartsWith("Hello", "He")` → true | Boolean |
| `EndsWith(text, suffix)` | `EndsWith("Hello", "lo")` → true | Boolean |
| `Replace(text, start, len, new)` | `Replace("Hello World", 7, 5, "!")` → "Hello !" | Text |
| `Substitute(text, old, new)` | `Substitute("a-b-c", "-", "/")` → "a/b/c" | Text |
| `Concat(table, expr, sep)` | `Concat(Items, Name, ", ")` → "A, B, C" | Text |
| `Concatenate(t1, t2, ...)` | `Concatenate("Hi", " ", name)` — same as `"Hi " & name` | Text |
| `Split(text, sep)` | `Split("a,b,c", ",")` → table of 3 rows | Single-col table |
| `Char(code)` | `Char(65)` → "A" | Text |
| `GUID()` | `GUID()` → "d4e3ac…" | Text |
| `IsMatch(text, pattern)` | `IsMatch(email, ".+@.+\..+")` | Boolean |
| `Match(text, pattern)` | `Match("AB12", "[A-Z]+")` → {FullMatch:"AB"} | Record |
| `MatchAll(text, pattern)` | `MatchAll("12 and 34", "\d+")` → table of matches | Table |

**Common `Text()` formats:**
```powerfx
Text(Today(), "dd mmm yyyy")          // "15 Apr 2026"
Text(Today(), "dddd")                  // "Wednesday"
Text(1234.5, "[$-en-US]$#,###.00")   // "$1,234.50"
Text(0.752, "0%")                      // "75%"
```

### 📅 Date & Time
| Function | Example | Returns |
|---|---|---|
| `Today()` | `Today()` | Date (no time) |
| `Now()` | `Now()` | DateTime |
| `UTCNow()` | `UTCNow()` | DateTime in UTC |
| `Date(y, m, d)` | `Date(2026, 4, 15)` | Date |
| `DateValue(str)` | `DateValue("15 Apr 2026")` | Date |
| `DateTimeValue(str)` | `DateTimeValue("15/04/2026 10:30")` | DateTime |
| `DateAdd(date, n, unit)` | `DateAdd(Today(), 30, Days)` | Date |
| `DateDiff(d1, d2, unit)` | `DateDiff(Start, End, Days)` | Number |
| `EDate(date, months)` | `EDate(Today(), 3)` | Date (3 months later) |
| `EOMonth(date, months)` | `EOMonth(Today(), 0)` | Last day of this month |
| `Year(date)` | `Year(Now())` → 2026 | Number |
| `Month(date)` | `Month(Today())` → 4 | Number |
| `Day(date)` | `Day(Today())` → 15 | Number |
| `Hour(dt)` | `Hour(Now())` | Number |
| `Minute(dt)` | `Minute(Now())` | Number |
| `Weekday(date)` | `Weekday(Today())` | Number (1=Sun by default) |
| `WeekNum(date)` | `WeekNum(Today())` | Number |
| `TimeZoneOffset()` | `TimeZoneOffset()` | Minutes offset from UTC |

**Unit enum values for DateAdd/DateDiff:**
`Days`, `Hours`, `Minutes`, `Months`, `Quarters`, `Years`, `Seconds`, `Milliseconds`

### ✅ Logic & Conditionals
| Function | Example |
|---|---|
| `If(cond, t, f)` | `If(x > 10, "High", "Low")` |
| `If(c1, r1, c2, r2, default)` | Multi-branch (no nesting needed) |
| `Switch(expr, v1, r1, v2, r2, def)` | `Switch(color, "R", Color.Red, "G", Color.Green, Color.Gray)` |
| `And(a, b)` / `a && b` | Both must be true |
| `Or(a, b)` / `a \|\| b` | Either must be true |
| `Not(a)` / `!a` | Inverts boolean |
| `IsBlank(value)` | True if null/empty |
| `IsEmpty(table)` | True if table has 0 rows |
| `IsError(value)` | True if value is an error |
| `IsBlankOrError(value)` | True if blank or error |
| `IfError(expr, fallback)` | Returns fallback if expr errors |
| `Coalesce(v1, v2, ...)` | First non-blank value |
| `Blank()` | Produces null/empty value |

### 🧭 Navigation & App
| Function | Syntax | Notes |
|---|---|---|
| `Navigate(screen, transition)` | `Navigate(HomeScreen, ScreenTransition.Fade)` | Switch screen |
| `Navigate(screen, tr, context)` | `Navigate(Detail, None, {item: ThisItem})` | Pass context variables |
| `Back()` | `Back()` | Go to previous screen |
| `Exit()` | `Exit()` | Close the app |
| `Launch(url)` | `Launch("https://example.com")` | Open URL or another app |
| `Param(name)` | `Param("id")` | Get URL parameter |

**ScreenTransition values:** `None`, `Fade`, `Cover`, `UnCover`, `CoverRight`, `UnCoverRight`

### 📋 Forms
| Function | Usage |
|---|---|
| `SubmitForm(form)` | Saves form data to data source |
| `ResetForm(form)` | Reverts form to original values |
| `NewForm(form)` | Sets form to create a new record |
| `EditForm(form)` | Sets form to edit existing record |
| `ViewForm(form)` | Sets form to read-only view |

### 🔔 Notifications & UI
| Function | Example |
|---|---|
| `Notify(msg, type)` | `Notify("Saved!", NotificationType.Success)` |
| `Reset(control)` | `Reset(TextInput1)` — revert to default |
| `SetFocus(control)` | `SetFocus(SearchBox)` — move cursor |
| `Select(control)` | `Select(Button1)` — simulate a click |
| `RequestHide()` | Close SharePoint custom form dialog |

**NotificationType values:** `Information`, `Warning`, `Error`, `Success`

### 💾 Variables
| Function | Scope | Example |
|---|---|---|
| `Set(name, value)` | Global (whole app) | `Set(currentUser, User().Email)` |
| `UpdateContext({name: val})` | Screen-local | `UpdateContext({showModal: true})` |
| `Navigate(screen, tr, {var: val})` | Passes to target screen as context | — |

> **Rule:** Use `App.Formulas` named formulas before `App.OnStart` or global variables. Use context variables (`UpdateContext`) for screen-local interaction state (show/hide panels, toggle modes). Use global variables (`Set`) only for mutable cross-screen state that cannot be represented as a named formula or passed through `Navigate`.

### 💾 Offline & Local Storage
| Function | Example |
|---|---|
| `SaveData(collection, key)` | `SaveData(MyCache, "CachedOrders")` |
| `LoadData(collection, key, ignoreErrors)` | `LoadData(MyCache, "CachedOrders", true)` |
| `ClearData(key)` | `ClearData("CachedOrders")` |

### 🌐 Environment & Signals
| Signal / Function | What it returns |
|---|---|
| `User().FullName` | Current user's display name |
| `User().Email` | Current user's email |
| `User().Image` | Current user's profile picture URI |
| `Connection.Connected` | Boolean — is there a network connection? |
| `Connection.Metered` | Boolean — is connection metered (mobile data)? |
| `Location.Latitude` | Number — device GPS latitude |
| `Location.Longitude` | Number — device GPS longitude |
| `App.Width` / `App.Height` | App canvas dimensions |
| `App.ActiveScreen` | Currently visible screen |

### 🤖 AI Functions (AI Builder)
| Function | What it does |
|---|---|
| `AISentiment(text)` | Returns sentiment (positive/negative/neutral) |
| `AISummarize(text)` | Returns a shorter summary |
| `AITranslate(text, lang)` | Translates text to target language |
| `AIClassify(modelId, text)` | Classifies text using a trained model |
| `AIExtract(modelId, text)` | Extracts entities from text |
| `AIReply(modelId, text)` | Generates a suggested reply |

> AI functions require AI Builder capacity in the tenant. Prebuilt functions (Sentiment, Summarize, Translate) don't need a custom model.

### 🧪 Debugging
| Function | Usage |
|---|---|
| `Trace(msg, severity, data)` | Sends to Monitor tool — not visible to users |
| `IfError(expr, fallback)` | Inline error catching |
| `Errors(datasource)` | Table of errors from last data operation |
| `IsError(value)` | Check if a value is in error state |

---

## Common Patterns

### Filter a gallery from a search box
```powerfx
// Gallery.Items:
Search(Orders, txtSearch.Text, "Title", "CustomerName")
```

### Conditional visibility
```powerfx
// Show a panel only when toggle is on:
pnlDetails.Visible = tglShowDetails.Value
```

### Create a new record
```powerfx
// Button OnSelect:
Patch(Orders, Defaults(Orders), {
    Title:   txtTitle.Text,
    Amount:  Value(txtAmount.Text),
    Status:  "Open",
    Created: Now()
});
Notify("Order created!", NotificationType.Success);
Reset(txtTitle); Reset(txtAmount)
```

### Delete selected gallery item
```powerfx
// Delete button OnSelect:
Remove(Orders, Gallery1.Selected);
Notify("Deleted", NotificationType.Warning)
```

### Navigate and pass context
```powerfx
// Gallery item OnSelect:
Navigate(DetailScreen, ScreenTransition.Cover, { selectedOrder: ThisItem })

// On DetailScreen, form Item:
selectedOrder
```

### Offline-first save
```powerfx
// Save button OnSelect:
If(
    Connection.Connected,
    Patch(Orders, Defaults(Orders), {Title: txtTitle.Text});
        Notify("Saved online"),
    Collect(PendingOrders, {Title: txtTitle.Text});
        SaveData(PendingOrders, "PendingOrders");
        Notify("Saved offline — will sync when online", NotificationType.Warning)
)
```

### Sync pending offline records on startup
```powerfx
// App.OnStart is acceptable here because LoadData, Patch, ClearData, and Notify
// are ordered side effects that App.Formulas cannot perform.
LoadData(PendingOrders, "PendingOrders", true);
If(
    Connection.Connected && !IsEmpty(PendingOrders),
    ForAll(PendingOrders, Patch(Orders, Defaults(Orders), ThisRecord));
    Clear(PendingOrders);
    ClearData("PendingOrders");
    Notify("Offline changes synced!")
)
```

### Dynamic color based on data
```powerfx
// Label Fill:
If(ThisItem.Status = "Overdue", RGBA(255,0,0,0.2),
   ThisItem.Status = "Done",    RGBA(0,200,0,0.2),
                                RGBA(200,200,200,0.1))
```

### Aggregate in a label
```powerfx
// Show total of filtered items:
"Total: " & Text(Sum(Filter(Orders, Region = ddRegion.Selected.Value), Amount), "$#,###")
```

### Validate before submitting
```powerfx
// Submit button OnSelect:
If(
    IsBlank(txtName.Text) || IsBlank(txtEmail.Text),
    Notify("Please fill all required fields", NotificationType.Error),
    !IsMatch(txtEmail.Text, ".+@.+\..+"),
    Notify("Invalid email format", NotificationType.Error),
    SubmitForm(EditForm1)
)
```

---

## Property Type Quick Reference

| Needs a... | Use this |
|---|---|
| Color | `Color.Red` / `ColorValue("#hex")` / `RGBA(r,g,b,a)` |
| Boolean | `true` / `false` / a condition expression |
| Number | A numeric literal or formula returning a number |
| Text | A string in quotes `"hello"` or formula returning text |
| Table | `Filter(...)`, `Search(...)`, a collection name, or `Table(...)` |
| Record | `LookUp(...)`, `First(...)`, `Gallery.Selected`, or `{Field: value}` |
| Enum | Use the enum name: `DisplayMode.Edit`, `ScreenTransition.Fade` |
| Date/DateTime | `Today()`, `Now()`, `Date(y,m,d)`, `DateValue("str")` |
| Image | A URL string, a camera's `.Photo` property, or `User().Image` |

> ⚠️ Never quote numbers or booleans. `Visible = "true"` is a type error — use `Visible = true`.

---

## App.Formulas First (App-level Named Formulas)

Prefer `App.Formulas` for app-wide constants, theme records, reusable tables, calculated values, role flags, current-user records, navigation definitions, and other derived state.

Define named formulas in the App object's `Formulas` section. They auto-recompute, are lazy evaluated, and do not need `Set()` or `App.OnStart`.

```powerfx
TotalRevenue      = Sum(Orders, Amount)
ActiveUserCount   = CountRows(Filter(Users, Active = true))
CurrentUserOrders = Filter(Orders, Owner = User().Email)
```

### When to use App.Formulas

Use `App.Formulas` when the value is:

- Derived from data, user, app size, environment, or other formulas
- Read by multiple screens or components
- A constant/config object such as theme, spacing, route names, statuses, or role names
- A reusable table that does not need runtime mutation
- Safe to recalculate when dependencies change

```powerfx
// App.Formulas:
CurrentUserEmail = Lower(User().Email)
IsManager = CurrentUserEmail in Managers.Email
StatusChoices = ["Draft", "Submitted", "Approved", "Rejected"]
NavItems = Table(
    { Title: "Home", Target: HomeScreen, Icon: Icon.Home },
    { Title: "Requests", Target: RequestsScreen, Icon: Icon.DetailList },
    { Title: "Settings", Target: SettingsScreen, Icon: Icon.Settings }
)
```

### When App.OnStart is acceptable

Use `App.OnStart` only when `App.Formulas` is not possible, efficient, or effective. Good reasons include:

- Ordered one-time side effects such as `LoadData`, `SaveData`, `ClearData`, or migration steps
- Hydrating or syncing mutable offline collections
- Calling `ClearCollect`, `Collect`, or `Set` for state users will mutate during the session
- Sequential startup work where later steps depend on earlier side effects
- Compatibility limits in a target tenant/tool where named formulas cannot represent the logic

Before writing `App.OnStart`, ask: "Can this be a named formula instead?" If yes, use `App.Formulas`.

Avoid using `App.OnStart` for:

- Themes
- Static navigation items
- Role flags
- Current-user derived values
- Filter defaults that can be calculated from controls/formulas
- Constants or lookup tables

---

## Delegation Warning

Delegation = data source processes the query server-side (handles large data).

- ✅ **Delegable:** `Filter`, `Sort`, `Search` on supported columns for SharePoint/Dataverse/SQL
- ❌ **Not delegable:** `CountRows` on Dataverse, `ForAll`, most text functions inside `Filter`, `GroupBy`

When not delegable, Power Apps fetches up to **500 records** (max 2000 via setting) locally. For large data, check the blue delegation warning in the formula bar and redesign the query or use server-side views.

---

## AI Code Generation — Canvas App Authoring MCP

> **Preview feature** (as of 2025). Lets AI tools like GitHub Copilot CLI and Claude Code create and edit canvas apps by generating `.pa.yaml` files and syncing them to a live Power Apps Studio coauthoring session.
>
> Official docs: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/create-canvas-external-tools

### Prerequisites

| Requirement | Minimum | How to install |
|---|---|---|
| .NET SDK | **10.0** | `winget install --id Microsoft.DotNet.SDK.10 --silent` |
| GitHub Copilot CLI / Claude Code | Latest | `gh extension install github/gh-copilot` |
| Power Apps Studio | Any | Open app with **coauthoring enabled** (Settings → Updates → Coauthoring) |

### Install the Canvas Apps Plugin

Run these two commands inside GitHub Copilot CLI or Claude Code:

```
/plugin marketplace add microsoft/power-platform-skills
/plugin install canvas-apps@power-platform-skills
```

### Configure the Canvas MCP Server

1. Open your canvas app in Power Apps Studio — enable coauthoring if not already on.
2. Copy the full URL from the browser address bar.
3. In your AI tool, run:
   ```
   /configure-canvas-mcp
   ```
4. Paste the Power Apps Studio URL when prompted. The tool auto-extracts environment ID, app ID, and cluster.

### Available Skills / Commands

| Command | What it does |
|---|---|
| `/generate-canvas-app` | Create a new canvas app from a natural language description |
| `/edit-canvas-app` | Edit an existing app; syncs current state from coauthoring session first |
| `/configure-canvas-mcp` | Register the canvas app authoring MCP server with your AI tool |

### Create a New App — Workflow

1. **Describe** what you want:
   - "Create a canvas app for tracking inventory with a searchable list and detail view"
   - "Build a multi-step employee onboarding form with approval workflow"
   - "Make a dashboard showing sales metrics with charts and KPIs"
   - Attach an image or mockup to guide theming/layout
2. **Answer clarifying questions** — the AI discovers available controls and data sources via MCP.
3. **Review** — the AI generates `.pa.yaml` files per screen and validates them automatically.
4. **Test in Studio** — open Power Apps Studio; changes sync via the coauthoring session.
5. **Iterate** — describe further changes in natural language; repeat.

### Edit an Existing App — Workflow

1. Say: `"I want to edit my expense tracking canvas app"` — the tool syncs all current screens.
2. Describe changes:
   - "Add a filter to show only pending expenses"
   - "Change the home screen to a card-based grid layout"
   - "Add a new screen for expense history with charts"
3. AI generates updated `.pa.yaml` files, validates, and syncs.

### Revert Changes

If recent AI-generated changes break the app:
```
"The recent changes broke the app. Please revert to the last working version."
```
The AI syncs current state → identifies your changes → restores previous code → validates and resyncs.

### Troubleshooting

| Problem | Fix |
|---|---|
| Changes don't appear in Studio | Verify MCP connection (ask AI to list available controls); ensure coauthoring is on |
| MCP server not responding | Run `dotnet --version` — must be 10.0+; re-run `/configure-canvas-mcp` with fresh URL |
| Plugin install fails | Ensure you are inside GitHub Copilot CLI or Claude Code session |

### Best Practices

- **Start simple** — build basic structure first, then iterate to add complexity
- **Be specific** — detailed natural language prompts produce better initial code
- **Test frequently** — preview in Studio after each significant change
- **Bold design choices** — describe visual style and layout direction explicitly; don't accept generic defaults
- **Validate generated code** — always review `.pa.yaml` files for org compliance before publishing

> ⚠️ AI code generation makes a best-effort attempt at production-ready, accessible, secure code — but **you are responsible** for final review and validation.

---

## Custom Forms — Grid Container Pattern

> Instead of using the default `EditForm` control with data cards, you can build a form completely from scratch using a **Grid Container**. This gives you full visual control and is the recommended approach for complex or branded forms.

### When to use this vs EditForm

| | EditForm (Classic) | Custom Grid Form |
|---|---|---|
| Setup speed | Fast | Slower upfront |
| Visual control | Limited | Full |
| Dark themes | Works | Works |
| Column spanning | No | Yes (RowStart/End, ColumnStart/End) |
| Patch required | No (SubmitForm) | Yes (manual Patch) |
| AI code gen | Supported | Supported |

Use **EditForm** for simple CRUD with minimal design requirements. Use **Grid Container** when you need precise multi-column layouts or full design control.

### Step 1 — Enable Grid Container

In Power Apps Studio: **Settings → Support → Latest Authoring Version**. Grid Container then appears in the Insert panel.

### Step 2 — Build the screen structure

```
Screen
└── conRoot (Vertical Container, fills screen)
    ├── conHeader (Horizontal Container, 48px)
    └── conBody (Vertical Container, fills remaining space, OverflowY=Scroll)
        └── conFormGrid (Grid Container, Columns=2, Rows=9, Gap=12, Padding=20)
            ├── [controls placed by grid position]
```

Set the body container:
```powerfx
// The body scrolls vertically if the form is taller than the screen.
conBody.OverflowY = Overflow.Scroll

// FlexibleHeight must be Off on the form grid container so scroll works correctly.
conFormGrid.FlexibleHeight = Off
```

### Step 3 — Place form fields in the grid

Each control inside the Grid Container gets its position from **Grid Position** properties (not X/Y):

```powerfx
// A two-column, two-row text input that spans both columns:
// e.g., a "Notes" text area
txtNotes.ColumnStart = 1
txtNotes.ColumnEnd   = 3   // spans columns 1 and 2 (ends after column 2)
txtNotes.RowStart    = 4
txtNotes.RowEnd      = 6   // spans rows 4 and 5 (gives more vertical space)
```

### Step 4 — Required field label with asterisk (HTML Text)

Use an **HTML Text** control for field labels that need a red asterisk — this is more performant than two separate controls:

```powerfx
// Show the asterisk in bold red alongside the label name.
// The font tag makes the asterisk red; the rest is the field label.
htmlLabel.HtmlText = "<font color='red'><b>*</b></font> Candidate Name"
```

For optional fields, just use a plain label.

### Step 5 — Validation with varSubmit

Track whether the user has attempted to submit yet. This prevents showing red errors before the user has done anything:

```powerfx
// Save button OnSelect:
// 1. Mark that user tried to submit (this triggers validation highlights)
// 2. Check if required fields are filled in
// 3. Only Patch if everything is valid
Set(varSubmit, true);
If(
    IsBlank(txtCandidateName.Value) || IsBlank(drpRole.Selected.Value),
    Notify("Please fill in all required fields.", NotificationType.Error),
    // If valid, save the record to SharePoint / Dataverse:
    Patch(JobApplications, Defaults(JobApplications), {
        Title:        txtCandidateName.Value,
        Role:         {Value: drpRole.Selected.Value},   // Choice column
        StartDate:    datStartDate.SelectedDate,          // Date column
        HiringManager: {
            Claims:      "i:0#.f|membership|" & ppHiringManager.Selected.mail,
            DisplayName: ppHiringManager.Selected.displayName,
            Email:       ppHiringManager.Selected.mail
        }
    });
    Notify("Record saved.", NotificationType.Success);
    Concurrent(
        // Reset every control back to blank after saving
        Reset(txtCandidateName),
        Reset(drpRole),
        Reset(datStartDate),
        Reset(ppHiringManager),
        // Reset the validation flag so errors disappear
        Set(varSubmit, false)
    )
)
```

Show a red border on a field only after the user tried to submit AND the field is empty:

```powerfx
// Set these on each required TextInput:
txtCandidateName.BorderThickness = If(varSubmit && IsBlank(txtCandidateName.Value), 1, 0)
txtCandidateName.BorderColor     = Red

// For live validation as the user types (instead of only on submit),
// set the control's Trigger property:
txtCandidateName.Trigger = TriggerOutput.KeyPress
```

### Patch formats for different column types

```powerfx
// Text column — pass the value directly
Title: txtTitle.Value

// Choice column (SharePoint or Dataverse OptionSet)
Status: {Value: drpStatus.Selected.Value}

// Date column
StartDate: datStartDate.SelectedDate

// Single person/group column (SharePoint)
HiringManager: {
    Claims:      "i:0#.f|membership|" & txtPersonEmail.Value,
    DisplayName: txtPersonName.Value,
    Email:       txtPersonEmail.Value
}

// Multi-select person column (SharePoint — see People Picker section below)
Stakeholders: ForAll(cmbStakeholders.SelectedItems, {
    Claims:      "i:0#.f|membership|" & mail,
    DisplayName: displayName,
    Email:       mail
})
```

---

## People Picker — Office 365 Users Connector

> Power Apps does not have a built-in people picker control. The recommended approach uses the **Modern Combo Box** + the **Office365Users** connector to search the organisation's directory.

### Prerequisites

- Add the **Office 365 Users** connector in Power Apps (Data panel → Add data → Office 365 Users)
- Enable **Modern Controls & Themes**: Settings → Updates → Modern Controls & Themes → On

### Single-select people picker

Insert a **Modern Combo Box**. Set these properties:

```powerfx
// Items: search the directory as the user types.
// SearchUserV2 accepts {searchTerm, isSearchTermRequired, top}.
// Self.SearchText is the text the user is typing into the combo box.
ComboBox.Items = Office365Users.SearchUserV2(
    {
        searchTerm:          Self.SearchText,
        isSearchTermRequired: false,   // Show results even when search box is empty
        top:                 999       // Return up to 999 results
    }
).value

// Show the person's full name in the dropdown list
ComboBox.ItemLabelText = ThisItem.displayName

// Single-select mode
ComboBox.SelectMultiple = false
```

When saving to a SharePoint person column:

```powerfx
// Patch format for a single-person SharePoint column.
// SharePoint needs the Claims format to identify the user in the directory.
HiringManager: If(
    IsBlank(cmbPerson.Selected.mail),
    Blank(),   // Don't write anything if no person is selected
    {
        Claims:      "i:0#.f|membership|" & cmbPerson.Selected.mail,
        DisplayName: cmbPerson.Selected.displayName,
        Email:       cmbPerson.Selected.mail
    }
)
```

### Multi-select people picker

For a SharePoint column that accepts multiple people (a "Person or Group" column set to Allow multiple selections):

```powerfx
// Items: same as single-select — search the directory as user types
ComboBox.Items = Office365Users.SearchUserV2(
    {searchTerm: Self.SearchText, isSearchTermRequired: false, top: 999}
).value

// Allow selecting more than one person
ComboBox.SelectMultiple = true

// ItemLabelText: show each person's name in the dropdown
ComboBox.ItemLabelText = ThisItem.displayName
```

For the **default selected items** (pre-populate when editing an existing record):

```powerfx
// When editing, read the existing Stakeholders from the record and
// look up each person's directory entry to show them as already-selected.
ComboBox.DefaultSelectedItems = ForAll(
    ThisItem.Stakeholders,           // The existing person list on the record
    // For each person, find their directory entry by searching their email
    First(
        Office365Users.SearchUserV2(
            {searchTerm: ThisRecord.Email, isSearchTermRequired: true, top: 1}
        ).value
    )
)
```

Patch format for saving multiple people:

```powerfx
// Save all selected people to the Stakeholders column.
// ForAll loops through every selected item in the combo box.
Stakeholders: ForAll(
    cmbStakeholders.SelectedItems,
    {
        Claims:      "i:0#.f|membership|" & mail,
        DisplayName: displayName,
        Email:       mail
    }
)
```

### ⚠️ Known bug — Multi-select combo box inside a Form control

**Symptom:** When a modern multi-select combo box is placed inside an `EditForm` control, user selections disappear after the user searches for more names.

**Root cause:** The form control resets the combo box's state when items reload.

**Workaround — place the combo box outside the form:**

1. Delete the combo box from inside the form's data card.
2. Insert a **new** Modern Combo Box **directly on the screen** (outside the form).
3. Position it visually over where the data card is — make it look part of the form.
4. Set the form data card's **Update** property to point to the external combo box:
   ```powerfx
   // Data card Update property — reads from the external combo box on screen
   ForAll(cmbStakeholders.SelectedItems, {
       Claims:      "i:0#.f|membership|" & mail,
       DisplayName: displayName,
       Email:       mail
   })
   ```
5. When navigating to the form screen, reset the external combo box to clear any previous selections:
   ```powerfx
   // In the button or gallery OnSelect that navigates to this form screen:
   Reset(cmbStakeholders)
   ```

---

## Modern Combo Box — SearchText & Server-Side Filtering

> The Modern Combo Box (requires Latest Authoring Version + Modern Controls & Themes) has a `SearchText` output property — the text the user is currently typing. Use this to filter data **on the server** as the user types, instead of loading everything upfront.

### The 800-item limit is lifted

The old hard limit of 800 items is removed in the updated Modern Combo Box. The new limit is whatever your app's **Data Row Limit** is set to (Settings → General → Data Row Limit, max 2000).

> ⚠️ Even with 2000 rows, you should still use `SearchText` to filter server-side and return only relevant results — loading 2000 rows into a combo box is slow.

### Server-side filtering with SharePoint

```powerfx
// SharePoint: use StartsWith — this IS delegable.
// Search() is NOT delegable on SharePoint — avoid it.
// Self.SearchText is what the user is typing.
ComboBox.Items = Filter(
    ProjectsList,
    StartsWith(Title, Self.SearchText)
)
```

### Server-side filtering with Dataverse

```powerfx
// Dataverse: Search() IS fully delegable — use it.
// "cr123_name" is the logical column name (lowercase with prefix).
ComboBox.Items = Search(Projects, Self.SearchText, "cr123_name")
```

### Custom display text in the dropdown

Use `ItemLabelText` to show any combination of columns in the dropdown list:

```powerfx
// Show the project name and its code in the combo box dropdown.
// Concatenate combines two text values.
ComboBox.ItemLabelText = Concatenate(ThisItem.Title, " (", ThisItem.ProjectCode, ")")
```

---

## Form Control Styling Patterns

### Input hover and focus states

Apply consistent hover/press styling to all inputs so they feel interactive:

```powerfx
// HoverFill: a subtle highlight when hovering
txtInput.HoverFill         = RGBA(255, 255, 255, 0.1)   // white at 10% opacity

// HoverBorderColor: lock border colour on hover (prevents it changing to default)
txtInput.HoverBorderColor  = Self.BorderColor

// PressedFill: slightly stronger fill when tapped/clicked
txtInput.PressedFill       = RGBA(255, 255, 255, 0.2)   // white at 20% opacity
```

### Border thickness by theme

```powerfx
// Light theme: thin borders (1px normal, 2px focused)
txtInput.BorderThickness = 1
txtInput.FocusedBorderThickness = 2

// Dark theme: slightly thicker (2px normal, 3px focused)
txtInput.BorderThickness = 2
txtInput.FocusedBorderThickness = 3
```

### ComboBox — removing the dotted focus border

When a Combo Box is opened, it shows a dotted focus border by default. Remove it:

```powerfx
// Hide the dotted border that appears around the combo box when opened
cmbInput.FocusBorderThickness = 0

// Make the dropdown chevron background invisible (cleaner look)
cmbInput.ChevronBackground    = Transparent

// Remove the blue/coloured selection highlight behind selected items
cmbInput.SelectionFill        = Transparent
```

### Border radius on text inputs

```powerfx
// Round the corners of text inputs — 5px is subtle, 20px is pill-shaped
txtInput.BorderRadius = 5
```

### Safe web fonts with fallback

```powerfx
// Always include a fallback font in case the first is not available.
// Comma separates the main font from the fallback.
txtInput.Font = "Lato", Arial
```


---

## Canvas Components — Power Fx Patterns

### Component input and output property syntax

```powerfx
// Reading an input property inside the component:
lblTitle.Text = MyComponent.HeaderTitle

// Reading an output property from the screen:
conContent.X = MyNavComponent.MenuWidth
```

### AccessAppScope — read/write app variables from inside a component
```powerfx
// Enable in component properties: AccessAppScope = On
// Then the component can toggle app-level variables:
hamburgerIcon.OnSelect = Set(varMenuOpen, !varMenuOpen)
// And read app collections:
galItems.Items = colNavItems
```

> ⚠️ AccessAppScope = On prevents the component from being added to a component library.

### Custom functions in components (Experimental — Enhanced Component Properties)
Enable in **Settings → Advanced → Enhanced Component Properties**.
```powerfx
// Define an output property with parameters — creates a reusable "function":
// Property: IsCurrency(CurrencyText: Text)
IsCurrency = IsMatch(CurrencyText, "\$?\d+(,\d{3})*(\.\d{2})?")

// Call it from any screen:
MyUtils.IsCurrency(txtAmount.Text)   // returns true/false
```

---

## Centralised Theme — App.Formulas Pattern

```powerfx
// In App → Formulas: define a named formula (not a variable).
// This updates instantly — no app reload required.
appTheme = {
    primary:   RGBA(98,  0,  238, 1),    // Main brand colour
    accent:    RGBA(3,  218, 196, 1),    // Secondary highlight
    bgDark:    RGBA(18,  18,  18,  1),   // Dark background
    bgLight:   RGBA(255, 255, 255, 1),   // Light background
    text:      RGBA(255, 255, 255, 1),   // Text on dark background
    subtext:   RGBA(180, 180, 180, 1)    // Muted text
}

// Any control reads it directly — no Set(), no OnStart:
btnSubmit.Fill       = appTheme.primary
lblSection.Color     = appTheme.text
Screen.Fill          = appTheme.bgDark
```

### Dark / light mode toggle
```powerfx
// Prefer App.Formulas for theme records. Use a variable only for the mutable
// user choice because the toggle changes during the session.
// App.OnStart is not needed if the toggle control has Default = false.
tglDarkMode.Default = false

// Toggle button:
btnTheme.OnSelect = Set(varDarkMode, !Coalesce(varDarkMode, false))

// Each control switches based on the flag:
Screen.Fill = If(Coalesce(varDarkMode, false), RGBA(18, 18, 18, 1), RGBA(255, 255, 255, 1))
```

---

## Editable Gallery Table — H&V Scroll Formulas

### Horizontal scroll width
```powerfx
// Set on the gallery's MinimumWidth property.
// Uses the last visible column's position + its width to compute total table width.
galTable.MinimumWidth = lastColumn.X + lastColumn.Width

// Parent container overflow:
conWrapper.HorizontalOverflow = Scroll
```

### Vertical scroll height
```powerfx
// Gallery height spans all rows — no internal scrollbar.
galTable.MinimumHeight = galTable.AllItemsCount * 40   // 40 = TemplateSize in pixels
galTable.ShowScrollbar = false

// Parent container handles the scroll:
conWrapper.VerticalOverflow = Scroll
```

### Header alignment with gallery columns
```powerfx
// For each header label, mirror the exact gallery control's width settings.
// Flexible-width column (proportional):
lblHeader.FillPortions = galControl.FillPortions

// Fixed-width column:
lblHeader.Width        = galControl.Width
lblHeader.MinimumWidth = galControl.MinimumWidth

// Set the same Gap value on both the header container and the gallery template container.
```

---

## SVG Icons and Animated Images

### EncodeUrl for SVG icon images in galleries
```powerfx
// Store the SVG string in a Dataverse/SharePoint column or Table() record.
// Display it in an Image control:
imgIcon.Image = EncodeUrl(ThisItem.iconSvg)
// or for inline data URL:
imgIcon.Image = "data:image/svg+xml;utf8," & EncodeUrl("<svg>...</svg>")
```

### SVG animated tab bar — variable-driven
```powerfx
// The SVG background shifts based on which tab is active.
// Build the SVG string dynamically:
imgTabBg.Image = "data:image/svg+xml;utf8," &
    EncodeUrl("<svg xmlns='http://www.w3.org/2000/svg'><rect x='" &
    Switch(varActiveTab, 1, "0", 2, "90", 3, "180") &
    "' y='5' width='80' height='40' rx='20' fill='#6200EE'/></svg>")
```

---

## Dashboard UI Patterns

### Current user and timestamp
```powerfx
// Display the current user's full name:
lblUser.Text = User().FullName

// Display the current time (short format):
lblTime.Text = Text(Now(), DateTimeFormat.ShortTime)
```

### Number formatting (string → formatted number)
```powerfx
// Convert a text number to a number, then format with comma thousands separator:
lblTotal.Text = Text(Value(ThisItem.total), "###,###")
```

### Bar chart from a gallery
```powerfx
// Each gallery item is a bar. Height is random (for demo) or from data.
// The bar fills upward from the bottom of the container.
barHeight       = RandomBetween(30, 150)   // replace with real data column
btnBar.Height   = barHeight
btnBar.Y        = conChart.Height - barHeight   // anchors bar to the bottom
btnBar.Width    = 40
btnBar.Fill     = appTheme.primary
```

---

## Left Navigation — Key Formulas

### Component width output property
```powerfx
// Expose current width to the parent screen:
MenuWidth = If(varMenuOpen, Max(App.Width, App.DesignWidth) / 5 + 40, 70)
```

### Page canvas responds to nav width
```powerfx
// Canvas or container that holds screen content:
conPage.X     = LeftNav_1.MenuWidth
conPage.Width = Parent.Width - LeftNav_1.MenuWidth
```

### Active screen highlight
```powerfx
// Highlight the nav item whose screen matches the current screen:
rectIndicator.Fill = If(ThisItem.screen = App.ActiveScreen, App.Theme.Colors.Primary, Transparent)
```

### Nav item selection and navigation
```powerfx
// Navigate and reset menu closed in one OnSelect:
icoNavItem.OnSelect = Navigate(ThisItem.screen, CoverRight); Set(varMenuOpen, false)
```

