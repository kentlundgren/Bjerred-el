# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website (no build system, no package manager) that visualises electricity consumption for Bjerreds Saltsjöbad — a facility with a sauna, bath, and restaurant in Bjärred, Sweden. Published via GitHub Pages.

The site is written entirely in Swedish. All user-visible text, comments, variable names, and data labels should stay in Swedish.

## Running Locally

No build step. Open the files directly in a browser:

```bash
# Visualisation dashboard
open index.html

# Data management tool
open data.html
```

There are no tests, no linter, and no CI pipeline.

## Workflow: Adding a New Month of Data

Data is hard-coded in both files. The canonical workflow is:

1. Open `data.html` in a browser
2. Edit the editable table (add a new row or update an existing month's values)
3. Click **"Beräkna och generera kod"** — this produces a new `const monthlyData = [...]` block
4. Copy the generated code
5. In `index.html`, replace the existing `const monthlyData = [...]` block (starts at line ~965) with the copied code
6. Also update the `originalData` array in `data.html` to keep both files in sync

**Important:** `index.html` and `data.html` maintain parallel copies of the monthly data with slightly different schemas:

- `index.html`: `{ month: "Aug 2024", fullMonth: "Augusti 2024", ... }` — month is `"MMM YYYY"` string
- `data.html`: `{ month: "Aug", year: 2024, fullMonth: "Augusti 2024", ... }` — month and year are separate fields

`generateCode()` in `data.html` handles the conversion from the split format to the combined format for `index.html`.

## Architecture

### `index.html` — Visualisation Dashboard

All logic lives in a single `<script>` block at the bottom. Key globals and execution order:

| Symbol | Purpose |
|---|---|
| `const monthlyData` | Raw monthly records (Aug 2024 → present) |
| `const VAT_RATE = 1.25` | Applied to all cost calculations (25% VAT) |
| `let showExpectedValues` / `showTable` | UI toggle state |
| `const enrichedData` | `monthlyData` passed through `calculateExpectedValues()` — adds `expectedKWh`, `expectedCost`, `diffPercent`, `costExVAT`, etc. |
| `let chart1–chart4` | Chart.js instances for the four line charts |

**Key functions:**

- `calculateExpectedValues()` — computes predicted monthly kWh for each entry. It splits data into three operational segments by `type` field (`"Restaurang och bad"`, `"Bara restaurang"`, transition months), derives seasonal multipliers (winter/shoulder/summer) and per-calendar-month shape factors from actual data, then applies a pre/post-renovation baseline split at August 2025 (when the sauna was enlarged).
- `updateSummary()` — computes LÅT (Löpande Årstal = rolling 12-month window, always the last 12 entries in `enrichedData`). Also computes the previous LÅT for hover-comparison tooltips in summary cards.
- `createCharts()` — builds four Chart.js line charts: `consumptionChart`, `costChart`, `priceChart`, `distributionChart`. Charts are destroyed and recreated on every `toggleExpectedValues()` call.
- `toggleExpectedValues()` — flips `showExpectedValues`, destroys and recreates all four charts, then re-runs `populateTable()` if the table is visible.
- `populateTable()` — renders the detailed monthly data table including expected-vs-actual comparison columns.
- `positionLatTooltips()` — uses `position: fixed` to keep LÅT comparison tooltips visible (not clipped by overflow).

### `data.html` — Data Management Tool

An editable table that lets users modify `currentData` (a deep copy of `originalData`) and generate replacement JavaScript code for `index.html`.

**Key functions:**

- `initTable()` / `createTableRow()` — renders the editable `<table>` from `currentData`
- `updateData()` — syncs table input changes back to `currentData`; calls `autoCalculate()` to recompute `kwhPerDay` and `costPerKwh`
- `validateKwhSplit()` — checks that `bad + restaurant === totalKWh` for every row; shows a warning panel on mismatch
- `generateCode()` — serialises `currentData` into the `index.html` format and displays it for copying
- `addNewMonth()` / `deleteRow()` / `resetData()` — CRUD helpers

Input fields use `--input-bg: #fffacd` (yellow background) as a visual convention.

## Data Schema

Each monthly record in `monthlyData` (index.html format):

```js
{
  month: "Aug 2024",          // Short label used as chart x-axis tick
  fullMonth: "Augusti 2024",  // Full Swedish month name + year
  totalKWh: 19901,
  daysInMonth: 31,
  kwhPerDay: 642,             // totalKWh / daysInMonth (rounded)
  type: "Restaurang och bad", // Operational mode — drives expected-value logic
  bad: 8262,                  // kWh attributed to the bath/sauna
  restaurant: 11639,          // kWh attributed to the restaurant
  cost: 34472,                // Total cost incl. 25% VAT (SEK)
  costPerKwh: 1.73            // cost / totalKWh
}
```

Valid `type` values: `"Restaurang och bad"`, `"Bara restaurang"`, `"Badet stängde i februari"`, `"Badet öppnade igen i mitten av juli"`.

The sauna renovation boundary (mid-July 2025) is a hard-coded business rule inside `calculateExpectedValues()` — the pre- and post-renovation baselines are computed separately and blended for transition months.

## Deployment

Push to `main` on GitHub. GitHub Pages serves `index.html` automatically from the root. No build step required.
