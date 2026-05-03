---
name: powerapps-canvas-design
description: Power Apps Canvas Apps UI/UX design guide — containers, responsive layouts, modern Fluent UI controls, gallery designs, filter panels, and navigation patterns. Use this skill when designing or improving the look, layout, or user experience of a Canvas App.
license: MIT
metadata:
  author: KayodeAjayi200
  version: "2.2.2"
  organization: Veldarr
  date: April 2026
  abstract: >
    Best practices for building beautiful, well-designed Power Apps Canvas Apps. Covers structured
    layouts with containers, responsive design with breakpoints, modern Fluent UI controls and
    theming, gallery and card designs (list vs grid, multi-view toggle, filter panels), navigation
    patterns (collapsible side menu, tab bar, hover/feedback micro-interactions), Canvas Components
    (reusable UI blocks and component libraries), centralised theme systems (App.Formulas + dark/
    light mode), animated SVGs for UI, editable gallery tables with horizontal and vertical scroll,
    and left navigation components with hamburger expand/collapse behaviour.
    Based on Tolu Victor, Shane, and Reza Durrani Power Apps tutorial series.
---

# Power Apps Canvas Apps — UI/UX Design Best Practices

> Use this skill when a user asks about improving their app's look, creating better layouts,

> **⚠️ Commenting rule:** Every formula and property value you write must have a plain-English comment above it explaining what it does. Assume the reader has never seen Power Fx before. Use `//` for comments.
> making an app responsive, designing galleries, adding a nav menu, or anything visual/UX.

---

## 🚨 ALWAYS USE CONTAINERS — No Exceptions

> **This is the single most important rule in this skill. Never skip it.**

**Every screen, every layout, every section — build it with Horizontal and Vertical Containers. Never place controls directly on a screen using absolute X/Y positions.**

### Why containers?

Without containers, apps break when the screen resizes, look different on every device, and become a nightmare to maintain. With containers, everything flows and adjusts automatically — exactly like how websites work.

### The two container types you will always use

| Container | What it does | When to use it |
|---|---|---|
| **Vertical Container** | Stacks things top-to-bottom, one after another | Page structure (header → body → footer), lists, forms, sidebars |
| **Horizontal Container** | Places things side-by-side in a row | Nav bars, icon + label pairs, two-column layouts, button groups |

> **Tip:** These two containers — nested inside each other — can build any layout you can imagine.

### The correct way to structure every screen

```
Screen
└── VerticalContainer (fills the whole screen)
    ├── HorizontalContainer  ← Header row
    │   ├── Label (app name)
    │   └── HorizontalContainer  ← nav icons grouped together
    ├── HorizontalContainer  ← Body row (fills remaining space)
    │   ├── VerticalContainer  ← left side nav (optional)
    │   └── VerticalContainer  ← main content area
    │       ├── HorizontalContainer  ← filter/search bar
    │       └── Gallery or Form
    └── HorizontalContainer  ← Footer (optional)
```

### Essential container properties — always set these

```powerfx
// Make the container fill all available space in its parent
FlexibleHeight = true
FlexibleWidth  = true

// Add breathing room between items inside the container
Gap = 8   // 8 pixels between children — adjust as needed

// Add inner spacing so content doesn't touch the edges
PaddingTop    = 12
PaddingBottom = 12
PaddingLeft   = 16
PaddingRight  = 16

// Align children — Stretch makes them fill the container width
AlignInContainer = AlignInContainer.Stretch
```

### Layout sizing priority — use this order every time

Agents must use native auto-layout properties before writing sizing formulas.

| Priority | Use this | For |
|---|---|---|
| 1 | `FlexibleWidth`, `FlexibleHeight`, `FillPortions` | Most screen, panel, column, card, gallery, and form layouts |
| 2 | `AlignInContainer.Stretch`, `Wrap`, `OverflowY`, smallest viable `MinimumWidth` / `MinimumHeight` | Preventing clipping while keeping layouts flexible |
| 3 | Breakpoint formulas on visibility, form columns, or template size | True layout mode changes such as phone vs tablet |
| 4 | Fixed `Width`, `Height`, `X`, `Y` | Icons, avatars, separators, row heights, and controls that must stay fixed |

**Do not use formulas like `Width = Parent.Width - 32` or `Height = Parent.Height - Header.Height` when the same result can be achieved by putting the control in the right container and setting `FlexibleWidth`, `FlexibleHeight`, and `FillPortions`.**

```powerfx
// Correct: root screen structure
conRoot.FlexibleWidth  = true
conRoot.FlexibleHeight = true

// Correct: body fills remaining vertical space under the header
conHeader.FlexibleHeight = false
conHeader.Height         = 64

conBody.FlexibleHeight = true
conBody.FillPortions   = 1

// Correct: main content and side panel share horizontal space
conMain.FlexibleWidth = true
conMain.FillPortions  = 3
conMain.AlignInContainer = AlignInContainer.Stretch

conSidePanel.FlexibleWidth = true
conSidePanel.FillPortions  = 1
conSidePanel.AlignInContainer = AlignInContainer.Stretch
```

Fixed sizes are allowed only for genuinely fixed UI atoms: icon buttons, avatars, compact nav rail widths, separators, gallery row heights, and known device-specific chrome. Everything else should participate in the container layout.

Minimum sizes are not default layout values. Only set `MinimumWidth` or `MinimumHeight` when a flexible child becomes unusable below a known threshold. Start with no minimum, then add the smallest viable value after checking the actual content. Oversized minimums cause horizontal scrolling, clipped controls, and broken tablet/phone layouts.

### AlignInContainer — default to Stretch

Inside auto-layout containers, most child controls should stretch across the cross-axis instead of relying on manual width formulas.

```powerfx
// Preferred for cards, panels, galleries, forms, search rows, and content sections.
AlignInContainer = AlignInContainer.Stretch

// Use Center only for intentionally compact controls such as icons, avatars, badges,
// progress spinners, or small command buttons.
AlignInContainer = AlignInContainer.Center

// Use Start/End only for deliberate edge-aligned controls.
AlignInContainer = AlignInContainer.Start
AlignInContainer = AlignInContainer.End
```

If a label, input, gallery, form, or card is clipping horizontally, first check `AlignInContainer`. The fix is usually `AlignInContainer.Stretch` plus `FlexibleWidth = true`, not a bigger `Width` or `MinimumWidth`.

### Layout review before compile

Before compiling a generated app, scan the YAML for layout smells:

- `X =` or `Y =` on normal content controls
- `Width = Parent.Width ...` on controls inside auto-layout containers
- `Height = Parent.Height ...` used to fill remaining space
- repeated fixed widths such as `Width = 300`, `Width = 400`, `Width = 600` on columns/cards/panels
- body/content containers missing `FlexibleHeight = true` and `FillPortions = 1`
- stretchable children missing `AlignInContainer = AlignInContainer.Stretch`
- horizontal columns missing `FlexibleWidth = true` and `FillPortions`
- oversized `MinimumWidth` / `MinimumHeight` values that force clipping or unnecessary scroll

If a smell appears, fix the container hierarchy first. Only keep fixed/formula sizing when the control is a small fixed UI atom or the control type does not support the needed flexible property.

### 🚨 Drop Shadow — set to None unless you explicitly want it

Power Apps gives every container a **light drop shadow by default**. If you leave it on everywhere, the screen ends up looking cluttered and heavy — shadows on shadows, cards inside cards, all with halos.

**Rule: Always explicitly set `DropShadow` on every container. Only use a shadow where it genuinely lifts an element above the page — like a modal dialog, a floating card, or a top-level panel.**

```powerfx
// ✅ For structural/layout containers — turn shadow OFF
// (header bar, body wrapper, nav column, filter row, screen root)
DropShadow = DropShadow.None

// ✅ For a card or panel that should visually "float" above the page
DropShadow = DropShadow.Light   // subtle — use for cards in a list
DropShadow = DropShadow.Regular // medium — use for side panels, drawers
DropShadow = DropShadow.Bold    // strong — use for modal dialogs only

// ❌ WRONG — leaving it as default means hidden shadows accumulate
// and the UI looks messy without you realising why
```

**When to use each:**

| `DropShadow` value | Use it for |
|---|---|
| `None` | Every layout/structural container (header, body, nav, rows) |
| `Light` | Gallery cards, list items, info panels inside a page |
| `Regular` | Side panels, drawers, popovers |
| `Bold` | Modal dialogs, confirmation popups |

**Quick rule of thumb:** if the container is just organising layout (not presenting content as a distinct card), it gets `DropShadow.None`.

### What NOT to do (and why)

```powerfx
// ❌ WRONG — absolute positioning breaks on different screen sizes
Label1.X = 200
Label1.Y = 150
Label1.Width = 400

// ✅ CORRECT — put Label1 inside a Vertical or Horizontal Container
// and let the container handle the position automatically
// The label just needs its FlexibleWidth = true and the container handles the rest
```

### Hiding a whole section — containers make this trivial

```powerfx
// Hide the entire filter panel (and everything inside it) in one line
// Without a container you'd have to hide every single control individually
FilterPanelContainer.Visible = varShowFilters
```

---

## 1. Structured Layouts with Containers

**Rule: Never use absolute X/Y positioning. Always use containers.**

Horizontal and Vertical Container controls form the backbone of every well-designed canvas app. They group controls and manage arrangement automatically — no manual pixel-pushing.

### Container types

| Container | When to use |
|---|---|
| **Vertical Container** | Stack content top-to-bottom (header → content → footer) |
| **Horizontal Container** | Place items side-by-side (icon + label, nav bar icons, two-column layout) |
| **Manual Layout Container** | Layering controls on top of each other (e.g., background image with text overlay) |
| **Grid Container** (Preview) | Precise row/column grid placement for dashboards |

### Manual vs Auto-layout containers — know the difference

- **Auto-layout containers** (Horizontal / Vertical) enforce one direction of stacking. Children line up with gap/padding. Use for almost everything.
- **Manual layout containers** give full freedom to position children — but use sparingly. The main valid use case is **layering** (e.g., a background image with content sitting on top of it).

```powerfx
// Manual container "card" layering pattern
// Background fills the whole parent container:
imgBackground.X      = 0
imgBackground.Y      = 0
imgBackground.Width  = Parent.Width
imgBackground.Height = Parent.Height

// A label overlays the background — same container, positioned on top
lblTitle.X     = 16
lblTitle.Y     = 0
lblTitle.Width = Parent.Width - 32
```

> ⚠️ For everything else (layout structure, navigation, forms, galleries), always use auto-layout containers.

### How to structure a screen

```
Screen (Vertical Container)
├── Header (Horizontal Container)
│   ├── Logo / Title (Label)
│   └── Nav Icons (Horizontal Container)
├── Body (Horizontal Container)
│   ├── Side Nav (Vertical Container)  ← optional
│   └── Main Content (Vertical Container)
│       ├── Filter Bar (Horizontal Container)
│       └── Gallery / Form
└── Footer (Horizontal Container)      ← optional
```

### Container properties to know

| Property | What it does |
|---|---|
| `LayoutMode` | Auto (children flow) vs Manual |
| `AlignInContainer` | Stretch / Start / End / Center. Use Stretch for most content children. |
| `FlexibleWidth` / `FlexibleHeight` | Lets container grow to fill available space |
| `Gap` | Spacing between children |
| `Padding` | Inner spacing on all sides |
| `Wrap` | Allows children to wrap to next row |
| `OverflowY` | `Overflow.Scroll` — makes the container scrollable vertically |

### FillPortions — controlling proportional widths

When you have multiple children in a Horizontal Container, `FillPortions` lets you set their width ratios without pixel math. Think of it as "shares of the available space."

```powerfx
// Example: 3 columns in a horizontal container — 50% / 25% / 25%
// Set FlexibleWidth = true on each child, then assign their "shares":
columnA.FlexibleWidth = true
columnA.FillPortions  = 2   // gets 2 out of 4 shares = 50%

columnB.FlexibleWidth = true
columnB.FillPortions  = 1   // gets 1 out of 4 shares = 25%

columnC.FlexibleWidth = true
columnC.FillPortions  = 1   // gets 1 out of 4 shares = 25%

// Add a minimum only if the column becomes unusable below a real threshold:
columnA.MinimumWidth = 280
```

Do not set minimum widths on every child by habit. If all columns have large minimums, the app will clip or force horizontal scrolling on smaller devices.

### Scrollable filter/content panel

When a section has lots of content that might overflow (e.g., a filter panel with many options), make the container scroll instead of cutting things off:

```powerfx
// Vertical container that holds a filter panel or long list:
conFilters.OverflowY    = Overflow.Scroll   // allow vertical scrolling
conFilters.PaddingTop   = 8
conFilters.PaddingBottom = 8
conFilters.Gap          = 6
```

### Key rules
- **Group related controls** in a container so you can hide/move the whole group at once
- **Nest containers** for complex layouts — a horizontal container can contain vertical ones
- Containers make maintenance trivial: need to hide a section? `Container.Visible = false`
- **Use `OverflowY = Overflow.Scroll`** for filter panels and any dense section that might not fit the screen

---

## 1b. Control Naming Conventions

**Rule: Name every control consistently. Readable names make the app maintainable by humans AND understandable by AI tools.**

The naming system uses a short **prefix** (what kind of control it is) + a **semantic suffix** (what it does in the app).

### Prefix reference

| Prefix | Control type |
|---|---|
| `con` | Container (horizontal or vertical) |
| `cmp` | Component |
| `gal` | Gallery |
| `frm` | Form (Edit or Display) |
| `btn` | Button |
| `txt` | Text Input |
| `lbl` | Label |
| `img` | Image |
| `ico` | Icon |
| `chk` | Checkbox |
| `ddl` | Dropdown |
| `cbo` | Combo Box |
| `tog` | Toggle |
| `dtp` | Date Picker |
| `tmr` | Timer |

### Semantic suffix reference

| Suffix | Meaning |
|---|---|
| `Header` | The top app bar / title bar |
| `Nav` | Navigation container or menu |
| `Search` | The search bar or search input |
| `Filters` | The filter panel |
| `Results` | The main gallery/list of results |
| `Details` | The detail/record view pane |
| `Commands` | A row of action buttons |
| `Footer` | Bottom bar |

### Examples

```
conHeader          — the header container
conNav             — the left navigation container
txtSearch          — the search text input
galResults         — the results gallery
conFilters         — the filter panel container
lblActiveFilters   — the "3 filters active" counter label
frmDetails         — the record detail form
btnSave            — the save button
btnCancelEdit      — the cancel button in edit mode
```

> **Why this matters:** When AI tools (like the Canvas Authoring MCP server) enumerate and modify controls, consistent naming lets them find the right target without guesswork. It also makes the app readable to new team members instantly.

---

**Rule: Design for the devices your users actually use. Make it work everywhere, make it perfect for the primary device.**

### Enable responsiveness

Turn off fixed canvas scaling in **Settings → Display**. This enables percentage-based sizing and makes containers flexible.

### Native layout before sizing formulas

First try to solve layout with auto-layout container properties:

```powerfx
// Preferred: let a control fill its parent container.
FlexibleWidth = true
FillPortions  = 1

// Preferred: let the content area take all remaining vertical space.
FlexibleHeight = true
FillPortions   = 1

// Optional: add the smallest viable minimum only after checking real content.
MinimumWidth  = 240
```

Use formulas only when the layout genuinely changes by breakpoint or when a non-container control does not support the needed auto-layout behavior:

```powerfx
// Responsive padding is a valid formula because spacing changes by device class.
Padding = If(IsPhone, 8, 16)
```

### Breakpoints pattern

```powerfx
// Define once as named formula (App.Formulas):
IsPhone  = App.Width < 600
IsTablet = App.Width >= 600 && App.Width < 1024
IsDesktop = App.Width >= 1024
```

Then use throughout:
```powerfx
// Hide sidebar on phone
SideNavContainer.Visible = !IsPhone

// Show hamburger menu only on phone
btnHamburger.Visible = IsPhone

// Adjust columns in a form
EditForm1.Columns = If(IsPhone, 1, 2)

// Adapt gallery template size
Gallery1.TemplateSize = If(IsPhone, 80, 120)
```

### Responsive navigation pattern

| Screen size | Navigation style |
|---|---|
| Desktop | Persistent side menu with icons + labels |
| Tablet | Side menu icons only (collapsed) |
| Phone | Hidden menu, hamburger ☰ button opens overlay |

```powerfx
// Side menu visibility changes by breakpoint; width stays a deliberate fixed rail size.
SideNavContainer.Width = If(varMenuCollapsed, 56, 220)
SideNavContainer.Visible = !IsPhone || varMenuOpen

// Label visibility in nav items
navLabel.Visible = !varMenuCollapsed && !IsPhone
```

### Responsive forms

```powerfx
// Number of form columns
EditForm1.Columns = If(App.Width < 700, 1, 2)
```

### Responsive galleries

```powerfx
// Gallery fills the content container without width/height math
Gallery1.FlexibleWidth  = true
Gallery1.FlexibleHeight = true
Gallery1.FillPortions   = 1

// Template size adapts to screen
Gallery1.TemplateSize = If(IsPhone, 72, 96)
```

---

## 3. Modern Fluent UI Controls & Theming

**Rule: Use modern controls for new apps. Apply a theme. Don't style things manually that the theme handles for you.**

### Enabling modern controls

**Settings → Updates → Modern controls and themes** → turn on.

Modern controls include: Button, Text Input, Dropdown, Combo Box, Checkbox, Toggle, Date Picker, Slider, Radio Group, Badge, Progress Bar, Spinner.

### Why modern controls

- Consistent Fluent Design aesthetic out of the box
- Automatically inherit the app theme (colors, fonts)
- Built-in hover/focus/press states — no manual HoverFill needed
- Better accessibility (focus rings, ARIA attributes)
- Icon support built into Button

### Applying a theme

**Settings → Themes** → choose a preset or create a custom theme.

Custom theme approach:
```powerfx
// Define colors as named formulas for consistency
BrandColor    = ColorValue("#0078D4")
SurfaceColor  = ColorValue("#F3F2F1")
TextPrimary   = ColorValue("#201F1E")
TextSecondary = ColorValue("#605E5C")
SuccessColor  = ColorValue("#107C10")
ErrorColor    = ColorValue("#A4262C")
```

Use these everywhere instead of hardcoded hex values.

### Modern Button with icon

```powerfx
// Icon property — use built-in icon names
btnSave.Icon = Icon.Save
btnDelete.Icon = Icon.Trash
btnAdd.Icon = Icon.Add

// Icon position
btnSave.IconPosition = IconPosition.Leading   // icon left of text
```

### Fluent 2 typography ramp — use consistent text sizes

Fluent defines a standard set of text size roles. Use these instead of choosing random font sizes. Bigger = more important. Smaller = supporting info.

| Role | Font size (approx) | Use it for |
|---|---|---|
| **Display** | 40–68px | Hero headings, splash screens |
| **Title** | 24–28px | Screen titles, modal headings |
| **Subtitle** | 20px | Section headings, card titles |
| **Body** | 14–16px | Main readable content, labels |
| **Caption** | 10–12px | Metadata, timestamps, secondary info |

```powerfx
// Apply text roles consistently:
lblScreenTitle.FontSize = 24   // Title
lblSectionHeading.FontSize = 18  // Subtitle
lblBodyText.FontSize = 14     // Body
lblTimestamp.FontSize = 12    // Caption

// ❌ Never go all-caps for readability (Fluent guidance)
// ❌ Avoid hard-coding hex colours — use your theme named formulas
```

**Accessibility contrast rule:** Standard body text must meet **4.5:1 contrast ratio** against its background. Large text (18px+ or 14px+ bold) needs at least **3:1**.

### Theme tokens — the right way to think about colours

Power Apps modern themes work like "alias tokens" — you name a colour by what it *means* (e.g., "brand colour") not what it *is* (e.g., #0078D4). This way, if you change the theme, everything updates at once.

```powerfx
// Define once in App.Formulas — then use everywhere:
BrandColor    = ColorValue("#0078D4")   // your primary brand colour
SurfaceColor  = ColorValue("#F3F2F1")   // background for cards/panels
TextPrimary   = ColorValue("#201F1E")   // main readable text
TextSecondary = ColorValue("#605E5C")   // supporting/secondary text
SuccessColor  = ColorValue("#107C10")   // green for success states
ErrorColor    = ColorValue("#A4262C")   // red for errors
```

> Never hardcode a hex value in an individual control. Always reference a named formula. This is the "token" approach.

### Creator Kit — when to use it

**Creator Kit** is a free Microsoft component library that gives you 24+ Fluent UI controls (detailed datagrids, command bars, facepile, etc.) beyond what's built into Power Apps. Install it from AppSource.

**Use Creator Kit when:**
- You need a high-fidelity Fluent component that the built-in modern controls don't provide
- Your organisation allows "code components" (PCF controls) — check with your admin first
- You want ready-made templates to start from

**Stick to built-in modern controls when:**
- Your organisation doesn't allow code components
- The built-in controls cover your needs — keep things simple

To make custom SVG icons follow the app theme:
```powerfx
// In an Image control's Image property:
"data:image/svg+xml;utf8," &
EncodeUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
  <path fill='" & RGBA(0,120,212,1) & "' d='M12 2...'/>
</svg>")
```

Replace the hardcoded color with your named formula:
```powerfx
"data:image/svg+xml;utf8," &
EncodeUrl("<svg ...><path fill='" & Text(BrandColor) & "' .../></svg>")
```

### Adding a custom drop shadow to a container (HTML workaround)

> 💡 Only do this when `DropShadow.Light` isn't enough and you need precise control (e.g. coloured shadow, larger blur). For most cases, use the built-in `DropShadow` property above — and remember to set it to `None` on layout containers.

Power Apps' built-in shadow options are limited. For a fully custom shadow, place an HTML Text control *behind* your card at the same position:

```powerfx
// HtmlText property:
"<div style='
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  background: white;
'></div>"
```

Match its Width/Height/X/Y to the card container.

### Rounded corners and card style

```powerfx
// On containers/rectangles:
BorderRadius = 8     // subtle rounding
Fill = White
BorderColor = RGBA(0,0,0,0.08)   // very subtle border
BorderThickness = 1
```

---

## 4. Gallery & List Design

### List vs Grid — when to use each

| View | Best for |
|---|---|
| **List** | Text-heavy records, many details per item, task/ticket lists |
| **Grid** | Visual/image-rich content, quick scanning, catalogs, dashboards |

**Best UX: offer both and let users toggle.**

### Multi-view toggle

```powerfx
// Toggle button OnSelect:
Set(varGalleryView, If(varGalleryView = "Grid", "List", "Grid"))

// Show/hide galleries:
galleryList.Visible = varGalleryView = "List"
galleryGrid.Visible = varGalleryView = "Grid"

// Or: toggle button icon
btnToggleView.Icon = If(varGalleryView = "Grid", Icon.DetailList, Icon.Waffle)
```

### Card-style gallery item template

Build each gallery item as a styled card:

```
Gallery Item (Vertical Container)
├── BorderRadius: 8, Fill: White, Shadow: (HTML workaround)
├── Padding: 12
├── Image (thumbnail/avatar)          — optional
├── Title Label    — FontWeight: Bold, Size: 14
├── Subtitle Label — Color: TextSecondary, Size: 12
├── Status Badge   — colored pill
└── Action Row (Horizontal Container)
    └── Action buttons (icon-only)
```

### Status badge / pill pattern

```powerfx
// Rectangle used as badge background:
badgeBg.Fill = Switch(ThisItem.Status,
    "Active",   RGBA(16, 124, 16, 0.1),
    "Pending",  RGBA(255, 140, 0, 0.1),
    "Closed",   RGBA(100, 100, 100, 0.1)
)

// Badge label:
badgeLabel.Color = Switch(ThisItem.Status,
    "Active",   ColorValue("#107C10"),
    "Pending",  ColorValue("#FF8C00"),
    "Closed",   ColorValue("#646464")
)
```

### Delegation-aware gallery items — CRITICAL for real data

**Delegation** means the filter/search query runs on the data source (Dataverse/SharePoint) rather than locally in the browser. If a query is *non-delegable*, Power Apps silently processes only the first **500–2,000 records** — your gallery may show incomplete data without any error.

**Treat delegation warnings as release blockers for production apps with large data.**

```powerfx
// ✅ Delegation-aware gallery Items pattern:
galResults.Items =
    With(
        { q: Trim(txtSearch.Text) },
        If(
            IsBlank(q),
            // No search — return sorted results (SortByColumns is delegable)
            SortByColumns(YourTable, "ModifiedOn", SortOrder.Descending),
            // Search active — StartsWith IS delegable in Dataverse/SharePoint
            // (but Contains is NOT delegable — avoid it in large datasets)
            Filter(YourTable, StartsWith(Title, q))
        )
    )

// ❌ Avoid non-delegable patterns on large tables:
// Filter(YourTable, Title = "something")  — only works on first 2000 rows
// Search(YourTable, q, "Title")           — check delegation per data source
```

**Delegable functions (Dataverse):** `Filter`, `Search`, `SortByColumns`, `LookUp` — but only with supported column types and operators. Always check the yellow delegation warning triangle in the formula bar.

### Multi-view toggle (list ↔ grid)

```powerfx
// State variable — start in List mode
Set(varViewMode, "List")   // or "Grid"

// Toggle button OnSelect:
Set(varViewMode, If(varViewMode = "List", "Grid", "List"))

// Toggle button icon:
btnToggleView.Icon = If(varViewMode = "Grid", Icon.DetailList, Icon.Waffle)

// Gallery adjusts to show as list (1 column) or grid (3 columns):
galItems.WrapCount = If(varViewMode = "Grid", 3, 1)

// Or: use two separate galleries and show/hide them:
galList.Visible = varViewMode = "List"
galGrid.Visible = varViewMode = "Grid"
```

### Search bar pattern

```
Search Container (Horizontal Container)
├── Search Icon (Icon.Search) — color: TextSecondary
├── Text Input — Placeholder: "Search...", BorderNone, Fill: Transparent
└── Clear Button (Icon.Cancel) — Visible: !IsBlank(txtSearch.Text)
                                — OnSelect: Reset(txtSearch)
```

Gallery Items filtered:
```powerfx
Gallery1.Items = Search(DataSource, txtSearch.Text, "Title", "Description", "AssignedTo")
```

---

## 5. Modern Filter UI

### Filter panel structure

```
Filter Panel (Vertical Container) — slides in from side or drops from top
├── Header Row: "Filters" + Clear All button
├── Section: Status
│   └── Toggle buttons for each status value
├── Section: Date Range
│   └── Date Picker start + end
├── Section: Assigned To
│   └── Combo Box (multi-select)
└── Footer: Apply / Close
```

### Filter state as a collection — the maintainable approach

Instead of tracking each filter in its own variable, store all filter state in a single collection. This makes it easy to count active filters and reset them all at once.

```powerfx
// Initialise filter state collection (call this in App.OnStart or screen OnVisible):
ClearCollect(
    colFilterState,
    { Key: "StatusOpen",    Label: "Open",        IsActive: false },
    { Key: "StatusClosed",  Label: "Closed",       IsActive: false },
    { Key: "HighPriority",  Label: "High Priority", IsActive: false }
)

// Toggle a filter on/off when user taps a chip:
UpdateIf(colFilterState, Key = ThisItem.Key, { IsActive: !ThisItem.IsActive })

// Count active filters for the badge counter:
lblActiveFilters.Text = CountRows(Filter(colFilterState, IsActive))

// Clear all filters:
UpdateIf(colFilterState, true, { IsActive: false })
```

### Active filter counter

```powerfx
// Count how many filters are active:
varActiveFilters = 
    (If(!IsBlank(cboStatus.SelectedItems), CountRows(cboStatus.SelectedItems), 0)) +
    (If(!IsBlank(dtpFrom.SelectedDate), 1, 0)) +
    (If(!IsBlank(dtpTo.SelectedDate), 1, 0))

// Show in button:
btnFilter.Text = "Filters" & If(varActiveFilters > 0, " (" & varActiveFilters & ")", "")
btnFilter.Fill = If(varActiveFilters > 0, BrandColor, SurfaceColor)
```

### Filter chips / pill toggles

```powerfx
// Gallery of status options used as filter chips:
galleryFilterChips.Items = ["All", "Active", "Pending", "Closed"]

// Each item background (active = brand color, inactive = surface):
chipBg.Fill = If(ThisItem.Value = varSelectedStatus, BrandColor, SurfaceColor)
chipLabel.Color = If(ThisItem.Value = varSelectedStatus, White, TextPrimary)

// Chip OnSelect:
Set(varSelectedStatus, ThisItem.Value)
```

### Applying multiple filters to a gallery

```powerfx
Gallery1.Items = Filter(
    DataSource,
    // Text search
    (IsBlank(txtSearch.Text) || StartsWith(Title, txtSearch.Text)),
    // Status filter
    (varSelectedStatus = "All" || Status = varSelectedStatus),
    // Date filter
    (IsBlank(dtpFrom.SelectedDate) || Created >= dtpFrom.SelectedDate),
    (IsBlank(dtpTo.SelectedDate)   || Created <= dtpTo.SelectedDate)
)
```

### Responsive filter layout

```powerfx
// Wide screen: filter panel as sidebar
filterPanel.Visible = !IsPhone
filterPanel.Width = 240

// Phone: filter behind a modal overlay
filterOverlay.Visible = IsPhone && varShowFilters
btnOpenFilters.Visible = IsPhone
```

---

## 6. Navigation Patterns

### Collapsible side menu

```
SideMenu (Vertical Container)
├── Width: If(varMenuCollapsed, 48, 200)
├── Toggle Button — OnSelect: Set(varMenuCollapsed, !varMenuCollapsed)
└── Menu Gallery
    ├── Items: [
    │     {Icon: Icon.Home,    Label: "Home",     Screen: HomeScreen},
    │     {Icon: Icon.People,  Label: "Contacts", Screen: ContactsScreen},
    │     {Icon: Icon.Document,Label: "Reports",  Screen: ReportsScreen}
    │   ]
    ├── Item Template (Horizontal Container):
    │   ├── Icon Control — ThisItem.Icon
    │   └── Label — Visible: !varMenuCollapsed
    └── Selected highlight:
        itemBg.Fill = If(ThisItem.Screen = varCurrentScreen, BrandColor, Transparent)
```

Track current screen:
```powerfx
// On each screen's OnVisible:
Set(varCurrentScreen, HomeScreen)   // or use App.ActiveScreen
```

Navigate on item select:
```powerfx
Navigate(ThisItem.Screen, ScreenTransition.None)
```

### Top navigation bar

```
TopNav (Horizontal Container, full width, Height: 48)
├── App Logo/Title (left)
├── Spacer (FlexibleWidth: true)
└── Nav Icons (right — Horizontal Container)
    ├── Notifications icon
    ├── Search icon
    └── User avatar (Circle image)
```

### Hamburger menu for mobile

```powerfx
// Hamburger button (phone only):
btnHamburger.Visible = IsPhone
btnHamburger.OnSelect = Set(varMenuOpen, !varMenuOpen)

// Full-screen overlay menu:
menuOverlay.Visible = IsPhone && varMenuOpen
menuOverlay.ZIndex = 100  // above everything
```

---

## 7. Micro-interactions & Feedback

### Loading states

```powerfx
// Show spinner while data loads:
Spinner1.Visible = varLoading

// In OnSelect before async operation:
Set(varLoading, true);
Refresh(DataSource);
Set(varLoading, false)
```

### Success / error notifications

```powerfx
// Using built-in Notify:
Notify("Record saved!", NotificationType.Success)
Notify("Failed to save. Try again.", NotificationType.Error)

// Or: custom toast (label that auto-hides with a timer)
Set(varToast, "Saved ✓");
Set(varShowToast, true);
// Timer Duration=2000 AutoStart=true OnTimerEnd: Set(varShowToast, false)
```

### Button states

```powerfx
// Disable button while saving:
btnSave.DisplayMode = If(varSaving, DisplayMode.Disabled, DisplayMode.Edit)

// Change text during save:
btnSave.Text = If(varSaving, "Saving...", "Save")
```

---

## 8. Accessibility

**Rule: Every interactive control must have a meaningful `AccessibleLabel`. Every screen must be navigable by keyboard alone.**

Accessibility is not optional — it is a legal requirement in many organisations and a quality bar for any app going to production.

### Minimum accessibility checklist

- [ ] **Every interactive control has a meaningful `AccessibleLabel`** — screen readers read this aloud. Example: `btnSave.AccessibleLabel = "Save this record"` (not just "Button")
- [ ] **Don't use colour alone to convey meaning** — if a status is shown in red, also show a text label or icon. Users who are colour-blind must be able to understand the same information.
- [ ] **Contrast ratio ≥ 4.5:1** for standard body text; **≥ 3:1** for large text (18px+ or 14px+ bold). Use a colour contrast checker before finalising your palette.
- [ ] **Tab order is logical** — use `TabIndex` to control focus order. Enable **Simplified tab index** in app settings for cleaner keyboard navigation.
- [ ] **Test with a screen reader** — Power Apps supports JAWS, Narrator, NVDA (Windows), TalkBack (Android), VoiceOver (iOS/Mac).
- [ ] **Touch targets ≥ 44px tall/wide** — add padding to small buttons and icon-only controls.

```powerfx
// Set a meaningful label on every button and input control:
btnSave.AccessibleLabel           = "Save changes to this record"
txtSearch.AccessibleLabel         = "Search records by title"
galResults.AccessibleLabel        = "List of matching records"
btnToggleView.AccessibleLabel     = "Switch between list and grid view"

// ❌ Wrong — vague or missing labels confuse screen reader users:
btnSave.AccessibleLabel = "Button"
```

---

## 9. Agent-Skill Readiness

**Canvas apps built this way are ready for AI agents.** Microsoft's AI code generation tools (Canvas Authoring MCP server, Copilot Generative Pages) work by:

1. Discovering available controls/connectors via installed "canvas app skills"
2. Generating `.pa.yaml` for screens/controls/formulas
3. Validating via the Canvas Authoring MCP server
4. Syncing with Power Apps Studio coauthoring sessions

For this to work, your app structure must be **readable** — predictable regions, stable names, clean component boundaries.

### The canonical screen skeleton

Every screen should follow this structure. AI tools, new team members, and future you will all thank you.

```
Screen
└── conRoot (Vertical Container — fills the whole screen)
    ├── conHeader    ← branding + title + key action buttons
    ├── conBody      ← horizontal container (nav + content)
    │   ├── conNav   ← left navigation (collapsible)
    │   └── conMain  ← main content area (vertical)
    │       ├── conSearch   ← search bar
    │       ├── conFilters  ← filter panel or filter chips
    │       └── galResults  ← the main gallery or form
    └── conFooter    ← optional bottom bar
```

### Design rules that make an app agent-friendly

**1. Semantic component boundaries** — keep Header, Nav, Search, Filters, Results, Details, Commands as explicit named containers or components. Never merge them into one blob.

**2. Predictable naming** — use the naming convention from Section 1b. AI tools operate over control graphs and depend on stable, consistent names.

**3. Single-responsibility screens** — prefer a small number of canonical screen patterns:

| Pattern | When to use |
|---|---|
| **List-Detail** | Browse a list + see/edit one record (most business apps) |
| **Dashboard** | Overview metrics + charts + quick actions |
| **Wizard** | Multi-step data entry / guided process |
| **Settings** | Configuration options |

### Intent-to-action mapping

This table shows how agent intents map to specific controls and Power Fx — useful when building a canvas app that an AI agent will interact with.

| Agent intent | What user says | App surface | Power Fx target |
|---|---|---|---|
| `search_records` | "Find ticket 10293" / "Show orders from last week" | Search bar + gallery | `txtSearch.Text`, `galResults.Items` |
| `apply_filters` | "Only high priority" / "Hide closed items" | Filter panel | `colFilterState`, `lblActiveFilters` |
| `open_record` | "Open the top one" / "Show details for Acme" | Details pane | `galResults.Selected` → detail container |
| `update_record` | "Mark as resolved" / "Change owner to Sam" | Form + submit button | `Patch(...)` / `SubmitForm(frmDetails)` |
| `switch_view` | "Show grid view" / "Switch to list" | Multi-view toggle | `Set(varViewMode, ...)`, `galItems.WrapCount` |
| `create_record` | "Create a new request" | New record screen / dialog | `Defaults(...)`, `NewForm(frmDetails)` |
| `summarize_context` | "What's on this screen?" | Agent response panel | Reads filter/view/search state + selection |

### AI-assisted build prompt template

When using Copilot or another AI tool to generate a canvas app, use this prompt as a starting point:

```
Create a responsive Canvas app with:
- A header (branding + title + key actions)
- A left navigation bar (collapsible)
- A search bar
- A filter panel with an active filter counter
- A list-detail layout (gallery + detail/form pane)
Use modern controls and apply a modern theme with semantic colour tokens.
Ensure keyboard navigation and AccessibleLabel coverage on all interactive controls.
Follow the container-first layout approach throughout.
```

---

## 10. Design Checklist

Before publishing, verify:

### Visual system
- [ ] Modern controls enabled, modern theme applied
- [ ] Colour palette uses named formulas only — no hardcoded hex values
- [ ] Typography follows a consistent size ramp (Caption / Body / Subtitle / Title)
- [ ] Contrast ratio ≥ 4.5:1 for body text

### Layout
- [ ] All screens use containers — no manually positioned controls
- [ ] App tested on smallest target device — nothing cut off
- [ ] Drop shadows set explicitly on every container (None for layout, Light/Regular/Bold only for floating elements)

### Components
- [ ] Header / Nav / Search / Buttons implemented as reusable components (or per-screen with consistent naming)
- [ ] Control names follow the naming convention (Section 1b)

### Data
- [ ] All galleries have a `NoDataText` or empty state UI
- [ ] Gallery queries reviewed for delegation warnings — no silent data truncation
- [ ] Search + filter tested with empty results and large datasets

### Interaction
- [ ] Loading/saving states handled — no "frozen" buttons
- [ ] Navigation highlights the current section

### Accessibility
- [ ] Every interactive control has a meaningful `AccessibleLabel`
- [ ] Tab order is logical — tested with keyboard only
- [ ] Colour is not the only indicator of status/meaning
- [ ] Touch targets ≥ 44px

### Agent readiness
- [ ] Screen skeleton follows the canonical structure (Header / Nav / Search / Filters / Results / Details)
- [ ] Stable, consistent control names throughout
- [ ] Intents mapped to UI regions and Power Fx targets

---

## Quick Patterns Reference

### Responsive 2-column layout that stacks on phone
```powerfx
// Outer container: Horizontal, Wrap: true
// Each column: FlexibleWidth, MinWidth: If(IsPhone, Parent.Width, 300)
```

### Image aspect ratio lock
```powerfx
img.Width  = Parent.Width
img.Height = img.Width * 0.5625   // 16:9
img.ImagePosition = ImagePosition.Fill
```

### Scrollable section
```powerfx
// Use a Vertical Gallery with a single item (a container) or
// use Scroll property on a container (modern containers support scrolling)
scrollContainer.OverflowY = Overflow.Scroll
```

### Section with expand/collapse
```powerfx
sectionContent.Visible = varSectionExpanded
chevronIcon.Icon = If(varSectionExpanded, Icon.ChevronUp, Icon.ChevronDown)
// Header OnSelect: Set(varSectionExpanded, !varSectionExpanded)
```

### Zebra-striped list rows
```powerfx
rowBg.Fill = If(Mod(ThisItem.ItemNumber, 2) = 0, SurfaceColor, White)
```

---

## 11. Grid Container — Row/Column Layout

> **What is it?** Grid Container is a newer layout control that positions children on a precise row-and-column grid — like a spreadsheet or CSS Grid. It is NOT a replacement for Horizontal/Vertical Containers; it **complements** them. Use it for forms and card grids where you need precise multi-column placement.

### How to enable it

Go to **Settings → Support → Latest Authoring Version** in Power Apps Studio. Grid Container becomes available in the Insert panel once enabled.

### Key properties

| Property | What it does |
|---|---|
| `Rows` | Number of rows in the grid |
| `Columns` | Number of columns in the grid |
| `Gap` | Pixel spacing between every cell (both horizontal and vertical) |
| `PaddingTop / PaddingBottom / PaddingLeft / PaddingRight` | Inner padding around the whole grid |
| `Fill` | Background colour of the grid area |
| `BorderRadius` | Rounds the corners (set to 50 for a fully circular/pill shape on narrow containers) |
| `DropShadow` | Adds a card-like shadow (None / Light / Regular / Bold) |

### Grid Position — how children are placed

Every control **inside** a Grid Container has four Grid Position properties instead of the usual X/Y/Width/Height:

| Property | Meaning |
|---|---|
| `ColumnStart` | Which column the control starts in (1 = leftmost) |
| `ColumnEnd` | Which column the control ends **after** (so ColumnStart=1, ColumnEnd=3 spans 2 columns) |
| `RowStart` | Which row the control starts in (1 = topmost) |
| `RowEnd` | Which row the control ends **after** |

> The grid positions the control automatically — you do not need to set X, Y, Width, or Height on children of a Grid Container.

### Pattern 1 — Home screen card grid (2 × 2)

Use a Grid Container with 2 rows and 2 columns to create a dashboard-style home screen:

```
GridContainer (Rows=2, Columns=2, Gap=20, Padding=20)
├── conCard1 (VerticalContainer) → ColumnStart=1, ColumnEnd=2, RowStart=1, RowEnd=2
│   ├── imgCard1 (Image)
│   └── btnCard1 (Button)
├── conCard2 (VerticalContainer) → ColumnStart=2, ColumnEnd=3, RowStart=1, RowEnd=2
├── conCard3 (VerticalContainer) → ColumnStart=1, ColumnEnd=2, RowStart=2, RowEnd=3
└── conCard4 (VerticalContainer) → ColumnStart=2, ColumnEnd=3, RowStart=2, RowEnd=3
```

Each card container holds an icon/image and a label or button — no absolute positioning needed.

### Pattern 2 — Data entry form (2 columns × N rows)

A form with two-column layout, where some fields (like Notes) span both columns:

```
GridContainer (Rows=9, Columns=2, Gap=12, Padding=20)
│
├── [Row 1, Col 1-2] — Section header label (spans both columns)
│   ColumnStart=1, ColumnEnd=3, RowStart=1, RowEnd=2
│
├── [Row 2, Col 1] — First Name field
│   ColumnStart=1, ColumnEnd=2, RowStart=2, RowEnd=3
│
├── [Row 2, Col 2] — Last Name field
│   ColumnStart=2, ColumnEnd=3, RowStart=2, RowEnd=3
│
├── [Row 3, Col 1-2] — Notes (textarea, spans both columns + 2 rows)
│   ColumnStart=1, ColumnEnd=3, RowStart=3, RowEnd=5
│
└── [Row 5, Col 2] — Save button (right-aligned)
    ColumnStart=2, ColumnEnd=3, RowStart=5, RowEnd=6
```

### How Grid Container fits with H/V Containers

```
Screen
└── conRoot (Vertical Container — full screen)
    ├── conHeader (Horizontal Container — header bar)
    └── conBody (Vertical Container — scrollable main area)
        └── conFormGrid (Grid Container — the actual form layout)
            ├── [form controls placed by grid position]
```

Grid Container handles the **internal form layout**. Horizontal/Vertical Containers handle the **page structure** around it.

### Design tips

- Set the Grid Container's `OverflowY = Scroll` (on the parent Vertical Container) if the form is taller than the screen.
- Use `Gap = 16` for tight forms; `Gap = 32` for card-grid dashboards.
- Setting `BorderRadius = 8` on the Grid Container gives it a modern card look.
- To **test responsiveness** at design time: use the size picker in Power Apps Studio (Large / Medium / Small preview buttons at top right of the canvas).

---

## 12. Responsive Breakpoints — Screen.Size

> Power Apps has a built-in `Screen.Size` property that tells you how wide the screen is. Use it to show/hide controls or change layouts based on device size — without writing complex formulas.

### Screen.Size values

| Value | Meaning | Typical device |
|---|---|---|
| `1` | Small (< 600 px wide) | Phone / narrow browser |
| `2` | Medium (600–900 px) | Tablet portrait |
| `3` | Large (900–1400 px) | Tablet landscape / small laptop |
| `4` | Extra large (> 1400 px) | Desktop monitor |

### Prerequisites

- Use **Tablet** form factor (not Phone) — Tablet gives you access to more responsive features.
- Turn off **Scale to Fit**: go to **Settings → Display → Scale to Fit → Off**. This is required; without it, the app just scales up/down like a fixed image instead of reacting to screen width.

### Customising breakpoints

You can set your own breakpoint values in the `App` object under **Advanced properties**:

```powerfx
// App.SizeBreakpoints — override the default 600/900/1400 pixel values
// e.g., to add a 1600px breakpoint for extra-wide monitors:
App.SizeBreakpoints = [600, 900, 1400, 1600]
```

### Hiding controls on small screens

```powerfx
// Hide the sidebar navigation on phones (Screen.Size = 1):
conSideNav.Visible = HomeScreen.Size <> 1

// Show a hamburger menu icon only on phones:
btnHamburger.Visible = HomeScreen.Size = 1

// Change a gallery from 3 columns to 1 column on phone:
galItems.WrapCount = If(HomeScreen.Size = 1, 1, If(HomeScreen.Size = 2, 2, 3))
```

### Using FillPortions for proportional widths

Instead of setting fixed pixel widths on controls inside a Horizontal Container, use **FlexibleWidth = true** and **FillPortions** to set proportional sizes:

```powerfx
// Header bar: service desk label takes 2/3 of the width,
// welcome label takes 1/3 of the width.
// Both have FlexibleWidth = On.
lblServiceDesk.FillPortions = 2   // takes 2 portions of available space
lblWelcome.FillPortions     = 1   // takes 1 portion (half the size of lblServiceDesk)
```

This is how you build truly responsive headers and multi-column layouts without hardcoded widths.

---

## 13. Dynamic Tab Navigation — Gallery + Collection Pattern

> The cleanest way to build a tab bar in Power Apps is a **Horizontal Gallery** driven by a **collection** of tab definitions. The selected tab controls which content is visible. Tabs can be added or removed from the collection — the gallery adjusts automatically.

### Step 1 — Define the tabs in a collection

Put this in `App.OnStart`:

```powerfx
// Build the list of tabs the app will show.
// Each tab has an id (number), a display name, and an icon.
// Add or remove items here to change the tab bar.
ClearCollect(
    colTabs,
    {id: 1, name: "All Tickets",   logo: Icon.Tag},
    {id: 2, name: "My Tickets",    logo: Icon.Person},
    {id: 3, name: "Closed",        logo: Icon.Check},
    {id: 4, name: "Settings",      logo: Icon.Settings}
)
```

For role-based tabs (only show certain tabs to certain users):

```powerfx
// Start with common tabs, then add manager-only tabs if the user is a manager
ClearCollect(colTabs,
    {id: 1, name: "My Items", logo: Icon.Tag}
);
If(
    "Manager" in User().Groups,  // or check a Dataverse role
    Collect(colTabs, {id: 2, name: "Team View", logo: Icon.People})
)
```

### Step 2 — Build the tab gallery

Insert a **Gallery** (not a container):

| Property | Value | Why |
|---|---|---|
| `Items` | `colTabs` | Drives tabs from the collection |
| `Layout` | Horizontal | Tabs go left to right |
| `WrapCount` | `CountRows(colTabs)` | Forces all tabs into one row — no wrapping |
| `TemplateSize` | `Parent.Height` | Each tab fills the full height of the gallery |
| `Height` | 48 (or match your header height) | Standard tab bar height |

Inside each gallery template, add:
- A **Label** — `ThisItem.name`
- An **Icon** — `ThisItem.logo`
- A thin **Rectangle** at the bottom — acts as the selected tab indicator

### Step 3 — Track the selected tab

```powerfx
// When a tab is tapped, remember which one is active.
// Put this in the gallery template's OnSelect:
Set(varActiveTab, ThisItem.id)

// Initialise the default tab in App.OnStart (after ClearCollect):
Set(varActiveTab, 1)
```

### Step 4 — Show tab content based on selected tab

Each content area has a `Visible` formula:

```powerfx
// Container for "All Tickets" content:
conAllTickets.Visible = varActiveTab = 1

// Container for "My Tickets" content:
conMyTickets.Visible = varActiveTab = 2
```

### Step 5 — Highlight the active tab

In the gallery template, change the selected indicator rectangle's colour:

```powerfx
// Active indicator bar at the bottom of each tab:
rectTabIndicator.Fill    = If(ThisItem.id = varActiveTab, BrandColor, Transparent)
rectTabIndicator.Height  = 3
rectTabIndicator.Y       = Parent.TemplateHeight - 3   // stick to the bottom
```

### Full structure

```
conHeader (Horizontal Container)
├── lblAppTitle (Label)
└── galTabs (Horizontal Gallery — WrapCount=CountRows(colTabs))
    └── Template
        ├── icoTab    (Icon — ThisItem.logo)
        ├── lblTab    (Label — ThisItem.name)
        └── rectBar   (Rectangle — selected indicator)

conBody (Vertical Container — content area)
├── conAllTickets  (Visible = varActiveTab = 1)
├── conMyTickets   (Visible = varActiveTab = 2)
├── conClosed      (Visible = varActiveTab = 3)
└── conSettings    (Visible = varActiveTab = 4)
```

---

## 14. Modern vs Classic Form Control

> You have two form controls to choose from. Knowing which to pick saves hours of frustration.

| | Classic Form (`EditForm`) | Modern Form (Preview) |
|---|---|---|
| **Appearance** | Requires manual styling | Better out-of-the-box design |
| **Dark themes** | ✅ Full control over label colours | ❌ Label colour cannot be changed (as of 2024) |
| **Custom widths** | ✅ Snap to Columns + WidthFit | ✅ Available |
| **Border radius on inputs** | Requires unlocking data cards | Native on TextInput |
| **Status** | Stable | Preview — use Classic for production |
| **AI code generation** | Works with Canvas Authoring MCP | Works with Canvas Authoring MCP |

**Decision rule:** Use **Classic Form** whenever you need dark themes, custom label colours, or any deep visual customisation. Use **Modern Form** only for quick light-theme prototypes.

### Classic Form — data card tips

**Snap to Columns:**
- `SnapToColumns = On` → data cards snap to the column grid (good for quick layout)
- `SnapToColumns = Off` → set each data card width manually (needed for custom designs)

**WidthFit:**
- `WidthFit = On` on a data card → fills the remaining width of its row automatically. Combine with fixed-width cards for responsive columns.

**Bulk-select all inputs trick:**
1. Change the form's `Layout` to **Horizontal**
2. Immediately press **Ctrl+Z** to undo
3. This accidentally selects ALL field labels AND inputs in the form at once
4. Now set `X = 5` and `Width = Parent.Width - 30` on the entire selection — instant consistent widths

**Required field asterisk:**
Instead of a separate asterisk label, concatenate it into the field label's `Text` property:
```powerfx
// Show a red asterisk before the field name if it is required.
// DataCard.Required is automatically true for required Dataverse columns.
If(DataCard.Required, "* ", "") & "Field Name"
```

**Borders from data card level:**
Change border colour by selecting multiple data cards (Ctrl+Click in the tree view), not the individual inputs. This sets the same style on all cards at once.


---

## 15. Canvas Components

> A **component** is a reusable, self-contained group of controls you build once and drop into any screen — or any app. It is the Power Apps equivalent of a UI widget or custom control.

### Why use components?
- Change the component once → every screen using it updates automatically
- Keeps your tree view clean — one node instead of dozens
- Can be shared org-wide via a **component library**
- Consistent headers, footers, navigation bars, and tool strips across all apps

### Creating a component
1. Open the **Tree view** panel → switch to the **Components** tab
2. Click **New component** — a blank canvas appears (default 640×640)
3. **Always name your component first** — naming controls is a best practice before adding anything
4. Set the component's `Width` and `Height` to be **responsive**, not hard-coded:

```powerfx
// Make the component match the full height of whatever app it is inserted into.
// Max() picks the larger of the current runtime height vs the design height.
Component.Height = Max(App.Height, App.DesignHeight)

// For a left navigation (20% of screen width):
Component.Width  = Max(App.Width, App.DesignWidth) / 5
```

5. Add controls inside the component — use `Parent.Width` / `Parent.Height` for relative sizing
6. Use `Parent.TemplateWidth` / `Parent.TemplateHeight` inside gallery templates

### Custom Input Properties (send data IN to component)
Input properties let a screen pass values into the component, like a parameter.

```powerfx
// In the component property panel → New custom property → Input
// Data type: Text, Number, Boolean, Color, Screen, Record, Table, Image, etc.
// Access it in any control inside the component:
MyLabel.Text = ComponentName.MyInputProperty
```

Useful input property types:
| Type | Use case |
|---|---|
| **Text** | Title text, screen name string |
| **Number** | Badge count, size values |
| **Boolean** | Show/hide a section, dark mode flag |
| **Screen** | Which screen to navigate back to |
| **Table** | Navigation items, list data |
| **Color** | Theme colour from the parent screen |

### Custom Output Properties (send data OUT from component)
Output properties expose values from the component to its parent screen.

```powerfx
// In the component property panel → New custom property → Output
// Set its formula to whatever the component wants to emit, e.g. the current width:
MenuWidth = If(varMenuOpen, Parent.Width / 5, 70)

// On the screen, read the output:
Canvas.X     = MyNavComponent.MenuWidth
Canvas.Width = Parent.Width - MyNavComponent.MenuWidth
```

### AccessAppScope — sharing variables between component and screen
By default, a component cannot read or write app-level variables and collections.
Turn on **Access App Scope** on the component to remove this restriction:

```
Component properties panel → Advanced → Access App Scope = On
```

```powerfx
// With AccessAppScope ON, the component can now toggle an app variable:
HamburgerIcon.OnSelect = Set(varMenuOpen, !varMenuOpen)
```

> ⚠️ **Limitation:** If `AccessAppScope = On`, the component **cannot** be placed into a component library. If you need both — redesign using input/output properties instead of shared variables.

### Using `App.ActiveScreen.Name` in a component
```powerfx
// Auto-show the name of the current screen in a header label.
// Coalesce falls back to "Home" if the property is not passed in.
lblScreenTitle.Text = Coalesce(MyHeaderComponent.ScreenName, App.ActiveScreen.Name)
```

### Importing components between apps
- **Copy into app** (independent copy): Components tab → three dots → **Import components** → pick the source app. Changes to the source do NOT flow through automatically.
- **Component library** (live reference): Create a component library at `make.powerapps.com` → Apps → Component libraries. In any app, click **+** (Insert) → **Get more components** → import from the library. Library updates flow to all apps that reference it.

### Component library workflow
1. Go to `make.powerapps.com` → **Apps** → **Component libraries** → New
2. Build or import your components here (screens are only for testing — they are not part of the app)
3. In any canvas app → Insert panel → **Get more components** → pick your library
4. The component is now a **live reference** — update the library, then refresh in the app to get the latest version

---

## 16. Centralised Theme System

> Use a named formula in `App.Formulas` to define all colours in one place. Every control reads from this central object. Change a colour once → the whole app updates instantly, with no reload.

### Approach A — App.Formulas (Recommended)
```powerfx
// In App → Formulas property, define your theme as a record:
appTheme = {
    brandPrimary:   RGBA(98,  0, 238, 1),   // Purple — main action colour
    brandAccent:    RGBA(3, 218, 196, 1),    // Teal — secondary highlight
    bgPage:         RGBA(18,  18, 18, 1),    // Near-black background
    bgCard:         RGBA(30,  30, 30, 1),    // Slightly lighter card background
    textPrimary:    RGBA(255, 255, 255, 1),  // White text
    textSecondary:  RGBA(180, 180, 180, 1),  // Grey subtext
    danger:         RGBA(207,  53,  53, 1)   // Red for errors/delete
}

// Any control anywhere in the app reads it like this:
btnSave.Fill        = appTheme.brandPrimary
lblPageTitle.Color  = appTheme.textPrimary
conCard.Fill        = appTheme.bgCard
```

**Why App.Formulas is better than App.OnStart for themes:**
- Formula results update immediately — no need to restart the app after changing a colour value
- Named formulas are lazy (evaluated only when used), so no startup cost
- Cleaner separation: theme definition vs startup data loading

### Approach B — App.OnStart Variables (Alternative)
```powerfx
// In App → OnStart: set a global variable with two sub-records (light + dark)
Set(globalTheme, {
    light: {
        bg:       RGBA(255, 255, 255, 1),
        sidebar:  RGBA(240, 240, 240, 1),
        text:     RGBA(30,  30,  30,  1)
    },
    dark: {
        bg:       RGBA(18,  18,  18,  1),
        sidebar:  RGBA(30,  30,  30,  1),
        text:     RGBA(255, 255, 255, 1)
    }
})

// Controls reference based on mode flag:
Screen.Fill = If(varDarkMode, globalTheme.dark.bg, globalTheme.light.bg)
```

### Light / Dark mode toggle pattern
```powerfx
// A toggle button or icon sets the mode flag:
ToggleButton.OnSelect = Set(varDarkMode, !varDarkMode)

// All controls respond instantly because they reference the variable.
// With App.Formulas approach, replace the hard-coded colour values with If(varDarkMode, ...) inside the record.
```

---

## 17. Animated SVGs for UI

> SVG code can be used as the image source of a Power Apps **Image** control. Combine this with variables and layered real buttons to create smooth animations without any custom connectors.

For detailed QuickChart.io chart patterns, SVG fetching/sanitizing rules, and Power Apps Image control formulas, use `skills/canvas-image-visuals.md`.

### Pattern: animated tab bar / toggle

```
Container (Horizontal)
├── Image control        ← SVG code here (the animated background pill)
├── Button 1             ← real Power Apps button, layered on top
├── Button 2
└── Button N
```

```powerfx
// The image control's Image property receives raw SVG as a data URL.
// The SVG changes based on a variable, creating the animation effect.
imgTabBg.Image = "data:image/svg+xml;utf8," & EncodeUrl("<svg>...</svg>")

// Each button sets a variable when tapped:
btn1.OnSelect = Set(varActiveTab, 1)
btn2.OnSelect = Set(varActiveTab, 2)

// The SVG formula reads varActiveTab and shifts the pill position:
// (Build the SVG string in Power Fx using If() or Switch() to change x/y/fill)
```

### AI-assisted SVG customisation
When customising SVG-based components from YouTube or community sources:
- Give Claude (or another AI) the existing YAML component code AND the prompt to change colours or add tabs
- With full context provided, AI can generate working YAML on the first try
- Without context (just a description), the AI-generated YAML rarely works in Power Apps

### SVG icons in galleries
```powerfx
// Store the SVG string as a column value in your data source.
// Display as an image in a gallery using EncodeUrl():
galItems.Template.imgIcon.Image = EncodeUrl(ThisItem.iconSvg)
```

---

## 18. Editable Gallery Table with Horizontal & Vertical Scroll

> A fully editable, scrollable data table built entirely in Power Apps — no premium connectors needed. Uses a vertical gallery inside a container with overflow scroll on both axes.

### Overall structure
```
conTableWrapper (Vertical Container, HorizontalOverflow=Scroll, VerticalOverflow=Scroll)
├── conHeaders (Horizontal Container)        ← column headers row
│   ├── lblHeader1
│   ├── lblHeader2
│   └── lblHeader3
└── galInventory (Vertical Gallery, blank layout, ShowScrollBar=Off)
    └── Template (Horizontal Container)
        ├── txtName      (Text control — read only)
        ├── inpQty       (TextInput — editable)
        ├── cmbCategory  (ComboBox — choice column)
        └── numPrice     (NumberInput — numeric column)
```

### Gallery and template settings
```powerfx
// Template sizing — no padding, no shadow, flush rows:
galInventory.TemplatePadding = 0
galInventory.TemplateSize    = 40       // row height in pixels
galInventory.ShowScrollbar   = false    // parent container handles scrolling

// Template container: fill the full row, no extra padding:
galInventory.Template.X      = 0
galInventory.Template.Y      = 0
galInventory.Template.Width  = Parent.TemplateWidth
galInventory.Template.Height = Parent.TemplateHeight
```

### Horizontal scroll — make the gallery wider than the container
```powerfx
// Set MinimumWidth on the gallery to be wider than the screen.
// This forces horizontal scroll on the parent container.
galInventory.MinimumWidth = lastColumnControl.X + lastColumnControl.Width

// On the parent container:
conTableWrapper.HorizontalOverflow = Scroll
```

### Vertical scroll — let the container scroll, not the gallery
```powerfx
// Set the gallery height to exactly fit all its rows — no internal scrollbar.
galInventory.MinimumHeight = galInventory.AllItemsCount * 40   // 40 = TemplateSize

// On the parent container:
conTableWrapper.VerticalOverflow = Scroll
```

### Column headers — keep aligned with gallery columns
The header row must mirror the gallery column widths exactly.

```powerfx
// For each header label, point its width properties to the matching gallery control:
lblHeader1.FillPortions  = galControl1.FillPortions    // if using flexible-width columns
lblHeader1.Width         = galControl1.Width           // if using fixed-width columns
lblHeader1.MinimumWidth  = galControl1.MinimumWidth    // for flexible-width minimum

// Set the same Gap on the header container as on the gallery template container.
// Set the header container's MinimumWidth to the same value as galInventory.MinimumWidth.
```

### Fixed vs flexible column widths
- **Fixed width:** `FlexibleWidth = Off` + explicit `Width` value — use for columns that must not shrink (e.g. checkboxes, action buttons)
- **Flexible width:** `FlexibleWidth = On` + `FillPortions` — columns share remaining space proportionally

### Theme-based header colour
```powerfx
// Apply the app theme colour to the header row fill:
conHeaders.Fill = App.Theme.Colors.Primary
```

---

## 19. Left Navigation Component — Hamburger Expand/Collapse

> A professional collapsing left sidebar — similar to the Power Automate / Power Apps maker portal navigation. Built as a component library item for reuse across apps.

### Responsive component dimensions
```powerfx
// Component height = full app height (works for both phone and tablet):
LeftNavComponent.Height = Max(App.Height, App.DesignHeight)

// Component width = 20% of app width (closed state = 70px, set via output property):
LeftNavComponent.Width  = LeftNavComponent_1.MenuWidth
```

### Hamburger icon (toggle)
```powerfx
// Sets a local variable to open or close the menu:
hamburgerIcon.OnSelect = Set(varMenuOpen, !varMenuOpen)

// Output property reports the current width to the parent screen:
MenuWidth = If(varMenuOpen, Max(App.Width, App.DesignWidth) / 5 + 40, 70)
```

### Nav gallery inside the component
```powerfx
// Gallery Y: sits directly below the hamburger icon
galNav.Y      = hamburgerIcon.Y + hamburgerIcon.Height

// Gallery width: fill the component
galNav.Width  = Parent.Width

// Gallery height: fill remaining space below the hamburger
galNav.Height = Parent.Height - hamburgerIcon.Height
```

### Input property — nav items table
```powerfx
// Define input property of type Table with schema: {title, screen, icon}
// Default sample values (used at design time):
NavItems = Table(
    {title: "Home",    screen: App.ActiveScreen, icon: Icon.Home},
    {title: "Tasks",   screen: App.ActiveScreen, icon: Icon.DetailList}
)

// Gallery items:
galNav.Items = LeftNavComponent.NavItems

// Labels and icons inside the template:
icoNavItem.Icon      = ThisItem.icon
lblNavTitle.Text     = ThisItem.title
lblNavTitle.PaddingLeft = 70    // pushes text past the icon area (70px = closed width)

// Navigate on tap — also reset the menu to closed:
icoNavItem.OnSelect = Navigate(ThisItem.screen, CoverRight); Set(varMenuOpen, false)
```

### Selection highlight bar (rectangle in template)
```powerfx
// A thin rectangle on the left edge of each gallery row.
// Only shows when the item is the active screen.
rectIndicator.Fill   = If(ThisItem.screen = App.ActiveScreen, App.Theme.Colors.Primary, Transparent)
rectIndicator.Width  = 4
rectIndicator.Height = Parent.TemplateHeight
rectIndicator.X      = 0
```

### Connecting component output to screen layout
The screen canvas must move right when the menu opens.

```powerfx
// A Canvas control (from a Scrollable Screen template) holds all screen content.
// Its X and Width respond to the menu width output property:
conPageContent.X     = LeftNavComponent_1.MenuWidth
conPageContent.Width = Parent.Width - LeftNavComponent_1.MenuWidth
```

### Initialising nav data in App.OnStart
```powerfx
// Build the navigation collection once on app start.
// Use this collection as the NavItems input property on every screen.
App.OnStart = ClearCollect(colNav,
    {title: "Home",    screen: HomeScreen,    icon: Icon.Home},
    {title: "Tasks",   screen: TaskScreen,    icon: Icon.DetailList},
    {title: "Details", screen: DetailScreen,  icon: Icon.DocumentWithContent}
)

// On each screen, set the component's NavItems input property:
LeftNavComponent_1.NavItems = colNav
```

### Component library best practices
- Store all reusable navigation and header components in a dedicated **component library** (not inside individual apps)
- Test components using the screens inside the component library editor
- When using `AccessAppScope = On` on a component, it **cannot** be published to a component library — redesign using input/output properties instead

