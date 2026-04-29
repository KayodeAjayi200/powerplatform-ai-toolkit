---
name: PowerApps-Canvas-Accessibility-Skill
description: Comprehensive accessibility knowledge for Power Apps Canvas Apps — WCAG 2.1 AA standards, accessible property reference, DO/DON'T checklists, keyboard navigation, screen reader support, form/error patterns, live regions, known platform limitations, and testing guidance. Use this skill when building accessible canvas apps, evaluating compliance, or fixing accessibility issues.
license: MIT
metadata:
  author: KayodeAjayi200
  version: "1.0.0"
  organization: Veldarr
  date: May 2026
  abstract: Knowledge-base skill for Canvas App accessibility. Covers every WCAG 2.1 AA criterion mapped to Power Apps controls and properties, design patterns for labels/keyboard/screen-reader/forms, known platform limitations, and testing approach. Pairs with Canvas-Authoring-MCP-Skill.md which covers how to push changes via the Canvas Authoring MCP.
---

# AGENT SKILL: Power Apps Canvas — Accessibility (WCAG 2.1 AA)

> **Read this skill whenever:**
> - A user asks you to build an accessible Canvas App
> - You are evaluating or fixing accessibility errors
> - You need to understand *why* a fix is required and *which property* to set
>
> **Pair with** `skills/Canvas-Authoring-MCP-Skill.md` which covers **how** to push
> changes to a live app via the Canvas Authoring MCP.

---

## Key Accessibility Properties — Quick Reference

| Property | Control types | What it does | Rule |
|---|---|---|---|
| `AccessibleLabel` | All interactive + image controls | The name read aloud by a screen reader | Non-empty, descriptive string. Required on every interactive control. |
| `TabIndex` | All controls | Keyboard tab order | Only ever `0` (focusable) or `-1` (skip). Values > 0 are deprecated. |
| `AcceptsFocus` | Galleries | Whether the gallery can receive keyboard focus | Set to `true` on every Gallery |
| `FocusedBorderThickness` | All interactive controls | Width of the focus ring shown when keyboard-focused | Must be `> 0` (use `3` or `4`) |
| `FocusedBorderColor` | All interactive controls | Color of the focus ring | Must have ≥ 3:1 contrast ratio against the surrounding background |
| `Role` | Label controls | Semantic heading level | `Heading1`–`Heading4` or `Default`; every screen needs at least one `Heading1` |
| `Live` | Label controls | Announces label text to screen reader when it changes | `Polite` (wait for user pause) or `Assertive` (interrupt immediately) for dynamic content |
| `HintText` | Text input controls | Placeholder hint inside empty text fields | Descriptive, never used as a substitute for `AccessibleLabel` |
| `Tooltip` | All controls | Tooltip on hover | NOT read by screen readers — never use as the only label |
| `ClosedCaptionsUrl` | Video controls | URL to a `.vtt` captions file | Required for all video content with speech or sound |

---

## Quick DO/DON'T Checklist

### ✅ DO

- Set a non-empty, descriptive `AccessibleLabel` on **every** interactive control (buttons, inputs, galleries, checkboxes, dropdowns, icons, images, toggles)
- Set `AccessibleLabel = ""` (empty) AND `TabIndex = -1` on **purely decorative** controls (dividers, background shapes, logos that add no information)
- Use `TabIndex = 0` on every control you want to be keyboard-reachable; `-1` on everything else
- Set `FocusedBorderThickness = 3` or `4` on all interactive controls
- Set `FocusedBorderColor` to a color with ≥ 3:1 contrast against the control's background
- Use `Label.Role = Heading1` for the main page title on every screen; use `Heading2`–`Heading4` for sub-sections
- Use `Label.Live = Polite` on every label that shows a dynamic status message, error, or notification
- Use standard controls (Button, Toggle, Slider, ComboBox, DataTable, TabList) — not homemade containers that look like buttons
- Make text meet **4.5:1 contrast ratio** (small text) or **3:1** (large text ≥ 18 pt / 14 pt bold) against their background
- Make all non-text UI elements (icons, input borders, focus rings) meet **3:1 contrast ratio**
- Add meaningful `AccessibleLabel` text on every Gallery that reflects what it lists: `"Expense report list"`
- In Galleries, make `AccessibleLabel` on repeating item controls dynamic: `="Edit " & ThisItem.Title`
- When `Notify()` shows a message, **also** update a visible `Label.Live` — `Notify()` alone is unreliable for screen readers

### ❌ DON'T

- Don't use `Tooltip` as the only label — it is never read by screen readers
- Don't set `TabIndex` to any value other than `0` or `-1`
- Don't rely on `color alone` to convey information (e.g., "red = error") — always add text or an icon
- Don't build custom interactive widgets from shapes/containers — they cannot receive focus or be announced correctly
- Don't use `Label.Live = Assertive` unless the update is truly urgent — it interrupts the screen reader mid-sentence
- Don't add `AccessibleLabel` to `HtmlViewer`, `ModernText`, classic `Text` labels, `FluentV8/Label`, or the outer `CanvasComponent` wrapper — these controls don't support it and adding it causes a compile error
- Don't hide a live-region label (`Visible = false`) expecting it to still be announced — hidden labels may be silently skipped by screen readers; use opacity or color tricks if you need it visually invisible but still announced
- Don't use `SetFocus()` on controls inside a Gallery, Form, or Container — it only works on button, icon, image, label, and text input at screen level

---

## WCAG 2.1 AA Issue → Fix Map

This table maps every common Canvas App accessibility problem to its WCAG criteria,
impact, detection method, and the exact fix.

| Issue | WCAG Criteria | Impact if ignored | How to detect | Fix |
|---|---|---|---|---|
| **Missing accessible label** on interactive control | 4.1.2 (Name/Role/Value), 1.1.1 (Non-text Content) | Screen reader announces "button" with no context — user cannot understand the control | Accessibility Checker → "Missing accessible text" | Set non-empty `AccessibleLabel` |
| **Missing accessible label** on image | 1.1.1 (Non-text Content) | Decorative images announced as "image" with a file name; meaningful images are ignored | Accessibility Checker | `AccessibleLabel = ""` if decorative; meaningful description if informative |
| **No focus indicator** (`FocusedBorderThickness = 0`) | 2.4.7 (Focus Visible), 1.4.11 (Non-text Contrast) | Keyboard user cannot tell which control is active | Accessibility Checker | Set `FocusedBorderThickness = 3` and high-contrast `FocusedBorderColor` |
| **Low colour contrast** (text) | 1.4.3 (Contrast Minimum) | Text unreadable for low-vision users | Accessibility Insights / manual check — NOT caught by the built-in checker | Adjust `Color` or `Fill` to achieve 4.5:1 (normal text) or 3:1 (large text) |
| **Low colour contrast** (non-text) | 1.4.11 (Non-text Contrast) | Icons/borders invisible to low-vision users | Manual check | Adjust icon/border color to ≥ 3:1 |
| **Color used as only differentiator** | 1.4.1 (Use of Color) | Color-blind users miss the meaning entirely | Manual review | Add text label or icon alongside color |
| **Bad tab order** (controls visited in illogical sequence) | 2.4.3 (Focus Order), 2.1.2 (No Keyboard Trap) | Keyboard user cannot navigate the screen predictably | Tab through the screen manually | Use containers to control reading order; ensure every interactive control has `TabIndex = 0` |
| **Gallery not keyboard-reachable** | 2.1.1 (Keyboard) | Keyboard user cannot enter or navigate the gallery | Try tabbing to the gallery | Set `Gallery.AcceptsFocus = true` |
| **Non-scrollable-container not keyboard-reachable** | 2.1.1 (Keyboard) | Keyboard user cannot scroll to reach content | Try tabbing + arrow keys | This is a known platform limitation — document it; consider alternative layout |
| **Missing form field labels** | 3.3.2 (Labels or Instructions), 2.5.3 (Label in Name) | User doesn't know what to type in an input | Visual inspection | Set `AccessibleLabel` on every TextInput and set an adjacent visible Label |
| **Edit Form errors not announced** | 4.1.3 (Status Messages), 3.3.1 (Error Identification) | Screen reader user submits a broken form and gets no feedback | Test with screen reader | Add a `Label.Live = Polite` label bound to `Form.Error` or `Concat(Errors(DataSource, Form.LastSubmit), Message, ", ")` |
| **No headings on screen** | 2.4.6 (Headings and Labels), 2.4.1 (Bypass Blocks) | Screen reader user cannot jump to main content | Check all Label.Role settings | Add at least one `Label.Role = Heading1` per screen as the page title |
| **Video has no captions** | 1.2.2 (Captions Prerecorded) | Deaf/hard-of-hearing users miss audio content | Inspect Video controls | Set `ClosedCaptionsUrl` to a `.vtt` file URL |
| **Homemade interactive widget** (e.g., clickable rectangle) | 2.1.1 (Keyboard), 4.1.2 (Name/Role/Value) | Cannot be keyboard-activated; screen reader announces role as "group" | Inspect control type | Replace with a standard Button, Toggle, or ComboBox |
| **`Notify()` used for status messages without live region** | 4.1.3 (Status Messages) | Screen reader may not announce the notification | Test with screen reader | Pair with a `Label.Live = Polite` label that shows the same message |
| **`TabIndex > 0`** on any control | 2.4.3 (Focus Order) | Unpredictable focus order — older behaviour, now deprecated | Accessibility Checker → "Tip" | Change to `0` or `-1` |
| **Missing captions on video with speech** | 1.2.2, 1.2.3 | Deaf users miss content | Inspect Video controls | Provide a `.vtt` caption file via `ClosedCaptionsUrl` |

---

## Accessible Design Patterns

### 1 — Labelling controls

**Every interactive control needs a non-empty `AccessibleLabel`.** The label must describe
the control's *purpose*, not its appearance.

| Control | Bad label | Good label |
|---|---|---|
| Button that submits a report | `"Button"` | `"Submit expense report"` |
| Icon that opens a delete dialog | `"Icon"` | `"Delete this record"` |
| Gallery showing approvals | `""` | `"Pending approvals list"` |
| Image showing the company logo | `"Image1"` | `""` (decorative — leave blank) |
| TextInput for a title | `"Text1"` | `"Report title"` |

**Dynamic labels in galleries** — the label must identify the specific item, not just the control type:
```powerfx
// Give each Edit button a unique label that names the item being edited.
// Without this, a screen reader announces "Edit, Edit, Edit..." for every row.
="Edit " & ThisItem.Title
```

**Decorative controls** — shapes, dividers, background images that convey no information:
```powerfx
// Empty string = tell the screen reader "nothing to see here"
AccessibleLabel: =""
TabIndex: =-1
```

**Controls that do NOT support `AccessibleLabel`** — adding it causes compile errors:
- `HtmlViewer`
- `ModernText` (Fluent V2 text)
- Classic `Text` label (`FluentV8/Label`)
- The outer `CanvasComponent` wrapper of any component instance

---

### 2 — Keyboard navigation

Canvas Apps have one tab stop per interactive control, visited in the order controls appear
in the screen's tree (top-to-bottom in the left panel).

**Tab order rules:**
- `TabIndex = 0` → control is reachable by Tab key
- `TabIndex = -1` → control is skipped by Tab key (set on decorative/hidden controls)
- Never use any value other than `0` or `-1` — values > 0 are treated as `0` in modern apps

**Reading order** — Canvas Apps have no CSS or DOM reordering. The screen reader reads
controls in the order they appear in the left-panel tree. Two-column layouts are read
*left column top-to-bottom, then right column* — unless containers reorder them.
Use Vertical Containers in each column to keep reading order logical.

**`SetFocus()` limitations** — this function only works on:
- Button, Icon, Image, Label, TextInput **at the screen level**
- It does NOT work on controls inside a Gallery, Form, or Container

**No `OnKeyDown` in containers** — Canvas Apps cannot capture raw key events in containers.
Arrow-key navigation and Escape-key dismissal are only available on specific controls
(DataTable, TabList, Dropdown, ComboBox). Custom keyboard shortcuts are not possible
without PCF components.

**Focus ring visibility:**
```powerfx
// Every interactive control needs a visible focus ring.
// 3-4 px thickness is sufficient. Color must contrast 3:1 with the background.
FocusedBorderThickness: =3
FocusedBorderColor: =ColorValue("#005A9E")   // dark blue — works on white backgrounds
```

---

### 3 — Screen reader support

**Headings** — screen readers let users jump between headings like bookmarks.
Every screen must have a logical heading hierarchy:

```
Screen title            → Label.Role = Heading1   (one per screen)
Section title           → Label.Role = Heading2
Sub-section title       → Label.Role = Heading3
```

Canvas Apps only have the `main` landmark — there is no `nav`, `header`, or `footer`.
Headings are the **only** way a screen reader user can navigate the screen without tabbing
through every control.

**Announcing dynamic changes** — when the app updates content (status messages, search results,
error feedback), the screen reader user must be told. There are two mechanisms:

| Mechanism | How it works | When to use |
|---|---|---|
| `Label.Live = Polite` | Announces the label's text when it changes, after the user pauses | Status messages, form errors, loading states |
| `Label.Live = Assertive` | Interrupts the screen reader immediately | Critical errors only — use sparingly |

```powerfx
// This label announces its text whenever the errorMessage variable changes.
// Keep this label visible (use transparency or small font if needed visually).
Text: =errorMessage
Live: =LabelLive.Polite
AccessibleLabel: ="Form error"
```

**`Notify()` alone is unreliable for screen readers.** Always pair it with a live region:
```powerfx
// On button click: show a toast AND update the live region label
OnSelect: =
    Notify("Record saved", NotificationType.Success);
    Set(statusMessage, "Record saved successfully")
    // The Label bound to statusMessage with Live=Polite will announce this
```

---

### 4 — Forms and error messages

Edit Form's built-in red-border validation does **not** auto-announce to screen readers.
You must implement your own error announcement:

```powerfx
// Live region label — place this label visibly on the screen
Text: =Form1.Error   // or: Concat(Errors(DataSource, Form1.LastSubmit), Message, "; ")
Live: =LabelLive.Polite
AccessibleLabel: ="Form validation errors"
```

Also ensure each field has an accessible label:
```powerfx
// A TextInput inside an Edit Form card
AccessibleLabel: ="First name (required)"
```

**For required fields**, include "(required)" in the `AccessibleLabel` so screen reader users
know before they try to submit.

---

### 5 — Live regions

A live region is a Label control with `Live = Polite` or `Assertive`. The screen reader
announces its text whenever it changes, without the user needing to navigate to it.

**Rules:**
- The label must be `Visible = true` — hidden labels may be silently ignored
- If you want it invisible visually: set `Color = RGBA(0,0,0,0)` and `Fill = RGBA(0,0,0,0)` and position it off-screen using a small container — but `Visible` must remain `true`
- Text must change value — setting the same string twice does not re-announce
- Use `Polite` for almost everything; `Assertive` only for truly urgent errors that must interrupt

```powerfx
// Pattern: live region that announces search results count
// Place this Label on the screen, keep Visible=true
Text: =If(CountRows(filteredResults) = 0, "No results found", Text(CountRows(filteredResults)) & " results found")
Live: =LabelLive.Polite
AccessibleLabel: ="Search results count"
Color: =RGBA(0,0,0,0)     // visually invisible
Fill: =RGBA(0,0,0,0)
```

---

## Known Platform Limitations

These issues **cannot be fully fixed** in Canvas Apps without PCF (custom component) development.
Document them as accepted limitations. Tell the user which controls are affected.

| Issue | Affected control(s) | Root cause | Workaround |
|---|---|---|---|
| Keyboard focus jumps incorrectly | ComboBox | Platform bug | Prefer Dropdown over ComboBox for keyboard-heavy flows |
| Rating control doesn't accept keyboard input | Rating | Platform bug | Add visible +/- buttons as an alternative input |
| Spinner not announced by screen readers | Spinner | No ARIA live region | Use a `Label.Live = Polite` with loading text instead |
| Timer control has no visible focus outline | Timer | Platform limitation | Avoid focusable Timers; set `TabIndex = -1` |
| DataTable doesn't reflow on small screens | DataTable | No responsive reflow | Use a Gallery instead for responsive layouts |
| RichTextEditor not fully accessible | RichTextEditor | Incomplete ARIA implementation | Avoid for critical content; provide a plain TextInput alternative |
| Form control doesn't reflow on narrow screens | Edit Form | No responsive reflow | Use individual controls in containers instead |
| Video control: no keyboard nav for full-screen | Video | Platform limitation | Add instructions telling keyboard users to press F11 |
| No `nav`/`header`/`footer` ARIA landmarks | Entire app | Platform limitation | Use headings (`Label.Role`) as the only navigation aid |
| `SetFocus()` doesn't work inside containers | All | Platform limitation | Only use `SetFocus()` on top-level controls |
| No `OnKeyDown` for containers or custom widgets | All | Platform limitation | Use TabList or DataTable for keyboard-navigable lists |
| Custom ARIA roles/states | All | Platform limitation | Requires a PCF component for true ARIA role control |
| Non-scrollable containers not keyboard-reachable | Container | Platform limitation | Redesign layout so all content is reachable without scrolling a container |

---

## Accessibility Checker — What it Catches (and What it Misses)

The built-in **Accessibility Checker** (paintbrush icon in Studio, or
`powerapps-canvas-get_accessibility_errors` via MCP) catches:

| Caught | Not caught |
|---|---|
| Missing `AccessibleLabel` | Colour contrast ratios |
| Missing video captions (`ClosedCaptionsUrl`) | Reading order problems |
| `FocusedBorderThickness = 0` | Improper use of `Notify()` without live region |
| `TabIndex > 0` (flagged as Tip) | Forms that don't announce errors |
| Bad screen names (non-descriptive) | Homemade widgets that can't be keyboard-activated |

**For what the checker misses**, use:
- **[Accessibility Insights for Web](https://accessibilityinsights.io/)** — automated + guided manual tests; add `?useScreenReader=true` to your Studio URL to test screen reader mode in browser
- **Narrator** (Windows) or **NVDA** — free screen readers; test tab order and announcements manually
- **Colour Contrast Analyser** (free desktop tool) — for checking text/background contrast ratios

> **Testing URL trick:** Append `&useScreenReader=true` to the Power Apps Studio URL to enable
> screen reader mode in the browser without needing a real screen reader installed.

---

## WCAG 2.1 AA — Criteria Coverage Summary

| Criterion | Description | Canvas App property/pattern |
|---|---|---|
| 1.1.1 Non-text Content | Images and icons have a text alternative | `AccessibleLabel` |
| 1.2.2 Captions (Prerecorded) | Videos have captions | `ClosedCaptionsUrl` |
| 1.3.1 Info and Relationships | Structure is conveyed programmatically | `Label.Role` (headings) |
| 1.4.1 Use of Color | Color not used as the only conveyor of meaning | Text + icon alongside color |
| 1.4.3 Contrast Minimum | 4.5:1 for normal text, 3:1 for large text | `Color` / `Fill` properties |
| 1.4.11 Non-text Contrast | 3:1 for UI components and focus rings | `FocusedBorderColor`, icon fill |
| 2.1.1 Keyboard | All functionality available via keyboard | `TabIndex`, `AcceptsFocus` |
| 2.1.2 No Keyboard Trap | Focus can always leave a component | Avoid custom modal patterns |
| 2.4.1 Bypass Blocks | Skip navigation to main content | `Label.Role = Heading1` |
| 2.4.3 Focus Order | Focus visits controls in a logical order | Container structure, `TabIndex` |
| 2.4.6 Headings and Labels | Headings and labels are descriptive | `Label.Role`, `AccessibleLabel` |
| 2.4.7 Focus Visible | Keyboard focus is visually obvious | `FocusedBorderThickness ≥ 3` |
| 2.5.3 Label in Name | Interactive control's accessible name contains visible label text | `AccessibleLabel` matches visible text |
| 3.3.1 Error Identification | Errors are identified in text | `Label.Live` bound to `Form.Error` |
| 3.3.2 Labels or Instructions | Form fields have labels | `AccessibleLabel` on every input |
| 4.1.2 Name, Role, Value | Controls have name, role, state | `AccessibleLabel`, standard controls |
| 4.1.3 Status Messages | Status messages announced without focus move | `Label.Live = Polite/Assertive` |

---

## How This Skill Relates to Other Skill Files

| Task | Skill to read |
|---|---|
| **Understand** what to fix and why (WCAG, properties, patterns) | **This file** |
| **Push fixes** to a live app via the Canvas Authoring MCP | `skills/Canvas-Authoring-MCP-Skill.md` |
| Build canvas app layouts and controls (Power Fx formulas) | `skills/PowerApps-Canvas-Skill.md` |
| Design responsive layouts with containers | `skills/PowerApps-Canvas-Design-Skill.md` |
| Fix delegation warnings on galleries | `skills/PowerApps-Delegation-Skill.md` |

---

*This skill is part of the [Power Platform Dashboard](https://github.com/KayodeAjayi200/power-platform-dashboard) project.*
*Accessibility guidance sourced from the WCAG 2.1 specification and Microsoft Power Apps accessibility documentation.*
