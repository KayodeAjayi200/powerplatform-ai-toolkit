---
name: powerapps-canvas-image-visuals
description: Use when creating charts, iconography, SVG visuals, KPI graphics, sparklines, badges, or custom visual assets in Power Apps Canvas apps using Image controls, QuickChart.io, inline SVG, EncodeUrl, or data URI image formulas.
license: MIT
metadata:
  author: KayodeAjayi200
  version: "1.0.0"
  organization: Veldarr
  date: May 2026
  abstract: Practical guide for creating beautiful Power Apps Canvas charts and SVG visuals with Image controls, QuickChart.io URLs, and Power Apps-compatible SVG data URIs.
---

# Power Apps Image Visuals: QuickChart and SVG

Use this skill when a Canvas app needs polished charts, KPI visuals, icons, badges, sparklines, status graphics, or custom SVG-based UI.

Power Apps built-in chart controls are limited. For richer visuals:

- Use QuickChart.io when the visual is a chart image generated from Chart.js config.
- Use inline SVG in an Image control when the visual is an icon, badge, micro-chart, progress ring, sparkline, decorative divider, or custom vector UI.

Official references:
- QuickChart docs: https://quickchart.io/documentation/
- QuickChart API parameters: https://quickchart.io/documentation/usage/parameters/
- QuickChart POST/short URLs: https://quickchart.io/documentation/usage/post-endpoint/
- Power Fx `EncodeUrl`: https://learn.microsoft.com/en-us/power-platform/power-fx/reference/function-encode-decode

---

## Decision rule

| Need | Use |
|---|---|
| Bar, line, doughnut, pie, radar, stacked, grouped, axis labels, legends | QuickChart.io |
| Small inline icon, status badge, KPI sparkline, progress ring, layout accent | Inline SVG data URI |
| Fully interactive chart with drilldown/filtering | Native gallery/components, PCF, or embedded Power BI |
| Offline-first app where external requests are not allowed | Inline SVG or native controls |

QuickChart returns an image. It is excellent for display, export, email, PDFs, and dashboards, but it is not interactive inside the Image control.

---

## QuickChart basics

QuickChart renders Chart.js config as an image URL.

Endpoint:

```text
https://quickchart.io/chart
```

Important query parameters:

| Parameter | Purpose |
|---|---|
| `c` or `chart` | Chart.js configuration |
| `width` | Output image width |
| `height` | Output image height |
| `devicePixelRatio` | Output sharpness. Use `2` for crisp charts |
| `format` or `f` | `png`, `webp`, `jpg`, `svg`, `pdf`, or `base64` |
| `backgroundColor` | Chart background |
| `version` | Chart.js version |

For Power Apps Image controls, prefer `format=png` unless you specifically need SVG output. PNG is reliable and simple.

---

## Power Apps Image control pattern

Set the Image control's `Image` property to the QuickChart URL.

Simple static example:

```powerfx
imgSpendChart.Image =
"https://quickchart.io/chart?width=700&height=360&devicePixelRatio=2&format=png&c=" &
EncodeUrl(
    "{
      type: 'bar',
      data: {
        labels: ['HR', 'Finance', 'Ops', 'IT'],
        datasets: [{
          label: 'Spend',
          data: [12000, 18000, 9000, 15000],
          backgroundColor: ['#2563EB', '#0891B2', '#16A34A', '#F59E0B'],
          borderRadius: 6
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Spend by department',
            color: '#111827',
            font: { size: 18, weight: '600' }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value) { return '£' + value.toLocaleString(); }
            },
            grid: { color: '#E5E7EB' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    }"
)
```

Rules:

- Always wrap the chart config with `EncodeUrl(...)`.
- Keep the chart config string readable and indented.
- Use single quotes inside the Chart.js config so the Power Fx outer string can use double quotes.
- Use a fixed QuickChart output `width` and `height`, but let the Power Apps Image control itself use container layout (`FlexibleWidth`, `FlexibleHeight`, `AlignInContainer.Stretch`).
- Set `devicePixelRatio=2` for crisp dashboards.

---

## Dynamic chart from collections

Build chart labels and data from a collection, then concatenate them into the config string.

Example data:

```powerfx
ClearCollect(
    colSpendByDepartment,
    {Department: "HR", Spend: 12000, Color: "#2563EB"},
    {Department: "Finance", Spend: 18000, Color: "#0891B2"},
    {Department: "Ops", Spend: 9000, Color: "#16A34A"},
    {Department: "IT", Spend: 15000, Color: "#F59E0B"}
)
```

Image formula:

```powerfx
imgSpendByDepartment.Image =
With(
    {
        labelsJson:
            "[" &
            Concat(
                colSpendByDepartment,
                "'" & Substitute(Department, "'", "\'") & "'",
                ","
            ) &
            "]",
        dataJson:
            "[" &
            Concat(
                colSpendByDepartment,
                Text(Spend, "[$-en-US]0"),
                ","
            ) &
            "]",
        colorsJson:
            "[" &
            Concat(
                colSpendByDepartment,
                "'" & Color & "'",
                ","
            ) &
            "]"
    },
    "https://quickchart.io/chart?width=760&height=360&devicePixelRatio=2&format=png&c=" &
    EncodeUrl(
        "{
          type: 'bar',
          data: {
            labels: " & labelsJson & ",
            datasets: [{
              data: " & dataJson & ",
              backgroundColor: " & colorsJson & ",
              borderRadius: 8,
              maxBarThickness: 52
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#E5E7EB' } },
              x: { grid: { display: false } }
            }
          }
        }"
    )
)
```

Notes:

- Use `Text(number, "[$-en-US]0")` so numbers are sent with `.` decimal separators and no thousands commas.
- Escape apostrophes in labels with `Substitute`.
- For larger datasets, aggregate before charting. Do not send hundreds of bars to a dashboard chart.
- Use `FirstN(SortByColumns(...), 10)` for top-N visuals.

---

## Recommended chart styles

### KPI sparkline

Use line charts with hidden axes.

```powerfx
imgSparkline.Image =
"https://quickchart.io/chart?width=360&height=96&devicePixelRatio=2&format=png&c=" &
EncodeUrl(
    "{
      type: 'line',
      data: {
        labels: ['M1','M2','M3','M4','M5','M6'],
        datasets: [{
          data: [8, 10, 9, 14, 13, 17],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    }"
)
```

### Doughnut progress

```powerfx
imgComplianceRing.Image =
"https://quickchart.io/chart?width=240&height=240&devicePixelRatio=2&format=png&c=" &
EncodeUrl(
    "{
      type: 'doughnut',
      data: {
        datasets: [{
          data: [82, 18],
          backgroundColor: ['#16A34A', '#E5E7EB'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '72%',
        plugins: { legend: { display: false } }
      }
    }"
)
```

### Horizontal ranking bar chart

```powerfx
imgTopCategories.Image =
"https://quickchart.io/chart?width=700&height=340&devicePixelRatio=2&format=png&c=" &
EncodeUrl(
    "{
      type: 'bar',
      data: {
        labels: ['Travel', 'Meals', 'Software', 'Training'],
        datasets: [{
          data: [42000, 28000, 21000, 14000],
          backgroundColor: '#0F766E',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#E5E7EB' } },
          y: { grid: { display: false } }
        }
      }
    }"
)
```

---

## URL length and short URLs

GET URLs are convenient but can become long. If the generated QuickChart URL becomes unreliable:

- Reduce labels/datasets.
- Use shorter color arrays and options.
- Use a server-side flow or API to call QuickChart's POST endpoint.
- Use QuickChart short URL creation for stable links.

Do not store secrets in QuickChart URLs. Chart config is visible to anyone who can see the URL.

---

## Image control layout settings for charts

Use container layout for the Image control:

```powerfx
imgSpendChart.FlexibleWidth = true
imgSpendChart.FlexibleHeight = true
imgSpendChart.FillPortions = 1
imgSpendChart.AlignInContainer = AlignInContainer.Stretch
imgSpendChart.ImagePosition = ImagePosition.Fit
```

Avoid:

```powerfx
imgSpendChart.Width = Parent.Width - 32
imgSpendChart.Height = Parent.Height - Header.Height
```

For small KPI sparklines, fixed image height is acceptable:

```powerfx
imgSparkline.FlexibleWidth = true
imgSparkline.Height = 72
imgSparkline.ImagePosition = ImagePosition.Fit
```

---

## Accessibility for chart images

Charts in Image controls need text alternatives.

```powerfx
imgSpendChart.AccessibleLabel =
"Bar chart showing spend by department. Finance is highest at £18,000, then IT at £15,000, HR at £12,000, and Ops at £9,000."
```

Also provide visible summary text near important charts:

```powerfx
lblSpendInsight.Text =
"Finance has the highest spend this period, 20% above IT."
```

Do not rely on the chart image alone for critical business decisions.

---

# SVGs in Power Apps Image controls

Use inline SVG when you need crisp, themeable, lightweight visuals.

Power Apps Image control formula:

```powerfx
imgIcon.Image =
"data:image/svg+xml;utf8," &
EncodeUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
       <path fill='#2563EB' d='M12 2L3 7v10l9 5 9-5V7z'/>
     </svg>"
)
```

Rules:

- Always include `xmlns='http://www.w3.org/2000/svg'`.
- Always include a `viewBox`.
- Prefer single quotes inside SVG attributes so the Power Fx string can use double quotes.
- Always wrap the SVG markup in `EncodeUrl(...)`.
- Use `data:image/svg+xml;utf8,` as the prefix.
- Use `ImagePosition.Fit` unless you intentionally want crop/fill behavior.

---

## Fetching SVGs and making them compatible

When an agent fetches SVG from an icon library, brand system, GitHub, Figma export, or public URL, convert it before putting it in Power Apps.

Compatibility checklist:

1. Keep only the `<svg>...</svg>` markup.
2. Remove XML declarations such as `<?xml version='1.0'?>`.
3. Remove `<!DOCTYPE ...>`.
4. Remove `<script>`, event handlers such as `onclick`, external `<image href='https://...'>`, and remote fonts.
5. Ensure `xmlns` and `viewBox` exist.
6. Replace double quotes with single quotes inside SVG attributes.
7. Replace `currentColor` with a real hex color or a Power Fx-injected color.
8. Avoid CSS classes that depend on external stylesheets.
9. Keep gradients, masks, and clip paths only if their IDs are unique within the app.
10. Wrap the final SVG string with `EncodeUrl(...)`.

Power Apps-compatible result:

```powerfx
imgReceiptIcon.Image =
"data:image/svg+xml;utf8," &
EncodeUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
       <path fill='#0F766E' d='M7 2h10a2 2 0 0 1 2 2v18l-3-2-2 2-2-2-2 2-2-2-3 2V4a2 2 0 0 1 2-2z'/>
       <path fill='#FFFFFF' d='M8 7h8v2H8zm0 4h8v2H8zm0 4h5v2H8z'/>
     </svg>"
)
```

---

## Themeable SVG pattern

To make an SVG follow app theme colors, inject the color into the SVG string.

```powerfx
imgStatusBadge.Image =
With(
    {
        badgeColor: If(ThisItem.Status = "Approved", "#16A34A", If(ThisItem.Status = "Rejected", "#DC2626", "#F59E0B")),
        textColor: "#FFFFFF"
    },
    "data:image/svg+xml;utf8," &
    EncodeUrl(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 32'>
           <rect width='120' height='32' rx='8' fill='" & badgeColor & "'/>
           <text x='60' y='21' text-anchor='middle' font-family='Segoe UI, Arial' font-size='13' font-weight='600' fill='" & textColor & "'>" &
             ThisItem.Status &
           "</text>
         </svg>"
    )
)
```

Escape dynamic text if it can contain XML characters:

```powerfx
Substitute(
    Substitute(
        Substitute(ThisItem.Title, "&", "&amp;"),
        "<", "&lt;"
    ),
    ">", "&gt;"
)
```

---

## Inline SVG progress ring

```powerfx
imgProgressRing.Image =
With(
    {
        pct: 72,
        stroke: "#2563EB",
        bg: "#E5E7EB",
        circumference: 251.2
    },
    "data:image/svg+xml;utf8," &
    EncodeUrl(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
           <circle cx='50' cy='50' r='40' fill='none' stroke='" & bg & "' stroke-width='10'/>
           <circle cx='50' cy='50' r='40' fill='none' stroke='" & stroke & "' stroke-width='10'
             stroke-linecap='round'
             stroke-dasharray='" & Text(circumference * pct / 100, "[$-en-US]0.0") & " " & Text(circumference, "[$-en-US]0.0") & "'
             transform='rotate(-90 50 50)'/>
           <text x='50' y='56' text-anchor='middle' font-family='Segoe UI, Arial' font-size='18' font-weight='700' fill='#111827'>" & pct & "%</text>
         </svg>"
    )
)
```

---

## Inline SVG sparkline

For small trend lines, SVG can be faster than QuickChart.

```powerfx
imgInlineSparkline.Image =
"data:image/svg+xml;utf8," &
EncodeUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 48'>
       <rect width='160' height='48' rx='8' fill='#F8FAFC'/>
       <polyline points='0,38 25,30 50,34 75,18 100,22 125,12 160,8'
         fill='none' stroke='#2563EB' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
     </svg>"
)
```

Use QuickChart instead if the sparkline needs dynamic scaling, labels, tooltips exported as a high-quality static image, or multiple datasets.

---

## Common SVG failures

| Symptom | Cause | Fix |
|---|---|---|
| Image is blank | Missing data URI prefix or `EncodeUrl` | Use `"data:image/svg+xml;utf8," & EncodeUrl("<svg ...>")` |
| Icon is black or wrong color | SVG uses `currentColor` | Replace with hex color or injected Power Fx color |
| Image is clipped | Missing/wrong `viewBox` | Add a correct `viewBox` matching the paths |
| Formula breaks | Unescaped double quotes inside SVG | Use single quotes in SVG attributes |
| Text breaks SVG | Dynamic text includes `&`, `<`, `>` | XML-escape dynamic text |
| Works in editor, not app | External CSS/font/image/script | Inline all styles and remove external references |

---

## Security and governance

- Only fetch SVGs from trusted sources.
- Inspect SVG markup before embedding.
- Remove scripts, event handlers, external images, and remote fonts.
- Do not embed secrets or sensitive data in QuickChart URLs or SVG markup.
- If charts include sensitive data, confirm whether sending values to QuickChart.io is allowed by the organization.
- For sensitive production dashboards, consider a server-side chart service, Power BI, or self-hosted QuickChart.

---

## Agent workflow

When asked to add charts or SVG visuals:

1. Decide QuickChart vs inline SVG using the decision table.
2. For QuickChart, create a small representative config first, then bind it to real app data.
3. For SVG, fetch or generate SVG markup, sanitize it, ensure `xmlns` and `viewBox`, then wrap with `EncodeUrl`.
4. Use Image controls inside containers with `AlignInContainer.Stretch` and `ImagePosition.Fit`.
5. Add `AccessibleLabel` and nearby visible text summary for meaningful visuals.
6. Run Canvas YAML preflight and compile.
