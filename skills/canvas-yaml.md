---
name: powerapps-canvas-yaml
description: Use when generating, editing, validating, or troubleshooting Power Apps Canvas `.pa.yaml` source files. Covers active schema structure, valid screen/control syntax, formula rules, component/data source shape, indentation, preflight checks, and common compile failures.
license: MIT
metadata:
  author: KayodeAjayi200
  version: "1.0.0"
  organization: Veldarr
  date: May 2026
  abstract: Practical validity guide for Power Apps Canvas source-code YAML (`*.pa.yaml`) used with Canvas Authoring MCP and Power Platform Git Integration.
---

# Power Apps Canvas YAML Validity Guide

Use this skill before generating or editing any `.pa.yaml` file for Canvas Authoring MCP.

The goal is to generate valid source YAML on the first pass, then use `powerapps-canvas-compile_canvas` as confirmation, not as the primary way to discover basic syntax mistakes.

Official references:
- Source-code YAML docs: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/power-apps-yaml
- Current static schema: https://raw.githubusercontent.com/microsoft/PowerApps-Tooling/refs/heads/master/schemas/pa-yaml/v3.0/pa.schema.yaml
- External tools workflow: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/create-canvas-external-tools

---

## Ground rules

- Use the active `*.pa.yaml` Source Code schema only.
- Do not generate retired `*.fx.yaml` or old copy/paste preview YAML.
- Prefer editing files that came from `powerapps-canvas-sync_canvas`; copied structure from a live app is safer than inventing every node.
- Keep one screen per `[ScreenName].pa.yaml` unless the MCP workflow or source sync has produced a combined file.
- Use `powerapps-canvas-compile_canvas` as the final authority before assuming YAML is valid.

Microsoft notes that `.pa.yaml` source files are actively evolving. Treat the static schema and synced examples as the source of truth for shape.

---

## Top-level structure

Valid top-level keys are limited. Do not invent new roots.

```yaml
App:
  Properties:
    StartScreen: =HomeScreen

Screens:
  HomeScreen:
    Properties:
      Fill: =ColorValue("#F8F9FB")
    Children:
      - conRoot:
          Control: GroupContainer
          Variant: verticalAutoLayoutContainer
          Properties:
            Fill: =ColorValue("#F8F9FB")
```

Common top-level keys:

| Key | Purpose |
|---|---|
| `App` | App-level properties |
| `Screens` | Map of screen names to screen definitions |
| `ComponentDefinitions` | Canvas component definitions |
| `DataSources` | Data source declarations |
| `EditorState` | Editor metadata such as screen/component order |

---

## Screen shape

A screen is a map entry under `Screens`.

```yaml
Screens:
  DashboardScreen:
    Properties:
      Fill: =App.Theme.Colors.Lighter80
    Children:
      - conDashboardRoot:
          Control: GroupContainer
          Variant: verticalAutoLayoutContainer
          Properties:
            FlexibleWidth: =true
            FlexibleHeight: =true
```

Rules:

- Screen names must be unique.
- Use `Properties` for screen formulas.
- Use `Children` for controls.
- `Children` must be an array.
- Each child item must contain exactly one control-name key.

---

## Control shape

Every control instance requires `Control`.

```yaml
      - lblTitle:
          Control: Text
          Properties:
            Text: ="Dashboard"
            Size: =24
            Weight: =FontWeight.Semibold
            AlignInContainer: =AlignInContainer.Stretch
```

Allowed control instance keys:

| Key | Rule |
|---|---|
| `Control` | Required. Invariant control type such as `Text`, `Button`, `Gallery`, `GroupContainer` |
| `Variant` | Optional. Plain string, not a formula |
| `Layout` | Optional. Plain string, not a formula |
| `MetadataKey` | Optional. Plain string |
| `IsLocked` | Optional boolean |
| `Group` | Optional grouping name |
| `Properties` | Map of property formulas |
| `Children` | Nested control array |

Do not put unsupported arbitrary keys beside `Control` unless the official schema allows them.

---

## Formula values

Property values are Power Fx formulas and must start with `=`.

```yaml
Properties:
  Text: ="Submit"
  Visible: =varCanSubmit
  Fill: =ColorValue("#FFFFFF")
  PaddingLeft: =16
  FlexibleWidth: =true
```

Valid:

```yaml
Text: ="Expense total"
Width: =Parent.Width
Visible: =true
OnSelect: =Set(varOpen, true)
```

Invalid:

```yaml
Text: "Expense total"
Visible: true
Width: 300
Control: =Text
Variant: =verticalAutoLayoutContainer
```

Exceptions:

- `Control`, `Variant`, `Layout`, `MetadataKey`, `Group`, `ComponentName`, and similar schema keywords are not Power Fx formulas.
- Formula properties may be `null` only when intentionally clearing a property and the schema allows it.

---

## Children indentation pattern

Indentation can become deep inside nested containers. Follow the actual parent indentation rather than guessing.

```yaml
    Children:
      - conBody:
          Control: GroupContainer
          Variant: horizontalAutoLayoutContainer
          Properties:
            FlexibleHeight: =true
            FillPortions: =1
          Children:
            - galExpenses:
                Control: Gallery
                Properties:
                  Items: =cr174_expense
                  FlexibleWidth: =true
                  FlexibleHeight: =true
```

Rules:

- `Children:` is followed by list items.
- Each list item starts with `- controlName:`.
- The control body is indented under that control name.
- `Control`, `Variant`, `Properties`, and nested `Children` are siblings.
- Property names are indented under `Properties`.

If adding a property to an existing control, detect that control's current indentation and match it. Do not assume a fixed number of spaces across the whole file.

---

## Component instances

Canvas component instances need `Control: CanvasComponent` and `ComponentName`.

```yaml
      - cmpHeader_1:
          Control: CanvasComponent
          ComponentName: cmpHeader
          Properties:
            Width: =Parent.Width
```

Rules:

- `ComponentName` is required for `CanvasComponent`.
- Do not edit component internals in a screen file. Edit the component definition file if it exists, or update the component in Studio.
- If compile fails with component not found, restore the component definition into the expected `Components` / `ComponentDefinitions` source area before compiling.

---

## Data sources

Use synced data source declarations when available. Do not invent connector IDs.

Example shape from the schema:

```yaml
DataSources:
  cr174_expense:
    Type: Table
    Parameters:
      TableLogicalName: cr174_expense
```

Rules:

- Table data sources need `Type: Table`.
- Dataverse table sources need `Parameters.TableLogicalName`.
- Confirm data source names with `list_data_sources` and schema with `get_data_source_schema`.
- Formulas must reference the actual source name returned by the app, not a guessed display name.

---

## Validity preflight before compile

Before running `powerapps-canvas-compile_canvas`, scan every changed `.pa.yaml` file:

1. Top-level keys are known: `App`, `Screens`, `ComponentDefinitions`, `DataSources`, `EditorState`.
2. Every control has `Control`.
3. `Children` entries are arrays of single-key objects.
4. Formula property values start with `=`.
5. `Control`, `Variant`, `Layout`, and `ComponentName` are plain values, not formulas.
6. Control names are unique in their screen/component.
7. Nested `Properties` and `Children` are siblings, not accidentally nested under each other.
8. Data source formulas reference sources returned by `list_data_sources`.
9. Component instances include `ComponentName`.
10. Layout review from `skills/canvas-design.md` has been applied.

Then compile:

```text
powerapps-canvas-compile_canvas directoryPath: "<sync-dir>"
```

---

## Common compile failures and first fixes

| Symptom | Likely cause | First fix |
|---|---|---|
| `PA1001` / parse error | Invalid YAML indentation or malformed key/value | Check the line/column, then validate nesting around `Children` and `Properties` |
| Property not supported | Property does not exist for that control type | Remove it or confirm control metadata with `describe_control` |
| Formula parse error | Missing leading `=` or invalid Power Fx | Add `=` and check separators, quotes, and function names |
| Component not found | Component definition missing from sync directory | Restore component definition or edit component in Studio |
| Data source not found | Formula references guessed source name | Run `list_data_sources` and use the exact name |
| Changes disappear after sync | Used `sync_canvas` after local edits | Remember: sync pulls from Studio; compile pushes to Studio |
| Layout compiles but clips | Over-fixed layout | Replace width/height math with flexible containers and `AlignInContainer.Stretch` |

---

## Generation strategy that reduces failures

Use this order when building or editing:

1. Run `sync_canvas` before every edit request so local YAML matches the current Studio app.
2. Copy a known-valid screen/container/control shape from the synced YAML.
3. Modify names, formulas, and children carefully.
4. Add only properties supported by that control type.
5. Run the validity preflight checklist.
6. Run `compile_canvas`.
7. Fix only the reported errors, then compile again.

Do not generate a large screen from scratch without first anchoring the structure in a synced valid example. The schema is strict enough that small structural mistakes can block the whole compile.

Do not reuse stale local YAML across turns. A user may have adjusted layout, formulas, data cards, or components directly in Studio. Pull first, preserve those manual changes, then add the new requested change.
