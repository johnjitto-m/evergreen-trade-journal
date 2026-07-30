## v32 — LTF trade comments

- Added LTF Question 5: **Comments about the trade**.
- Multi-select dropdown includes **Good Trade** and **Went TP Without Triggering the Adjusted RR**.
- Custom trade-comment options can be added and synced to Evergreen Supabase.
- Trade comments are preserved in Edit, View Trade, research search/filtering, JSON backup, and CSV export.
- No Supabase schema change is required because comments are stored inside the existing `ltf_analysis` JSON field.

## v31 — Unified footer alignment and final wizard fit

- Basic, HTF and LTF footers now use the same grid, route position and button sizes.
- Day Chart panel ends with the Day Bias Reason row.
- Added exclusive `None` option to Day Bias Reason.
- Removed the pair instrument icon from Basic Info.
- HTF Question 7 uses the remaining vertical space.
- LTF chart references fit without an internal scrollbar.
- LTF outcome columns align BE/Risk, SL/RR and TP/Calculated P/L.

# Evergreen Trade Journal

A static HTML/CSS/JavaScript trading journal with an isolated Supabase backend. It can run locally through VS Code Live Server and deploy directly to GitHub Pages.

## Current build

- Responsive Evergreen dashboard and full research database
- Weekly dashboard ordered Monday to Sunday, with newly added trades placed at the bottom of their day
- Basic Info → HTF Analysis → LTF Analysis trade workflow
- HTF Day Bias (Buy/Sell) plus “FVG mitigation or sweep?” tracking; Sweep auto-selects CISD on LTF
- Clean HTF CISD question with conditional Inside FVG / Outside FVG selection
- LTF answers are optional, so incomplete trades can be saved and completed later through Edit
- LTF trade comments use a multi-select dropdown with reusable custom options
- TradingView snapshot previews with separate Day time-frame, HTF, and LTF reference links
- Default HTF **1H**, automatic LTF **5m**, and editable **$50** risk
- JSON backup/import and CSV export
- Email magic-link sign-in through Supabase Auth
- Cloud trade Create, Read, Update, and Delete
- Cloud custom-option syncing
- Private Supabase Storage uploads for HTF/LTF screenshots
- Local-first saving: a trade remains in browser storage if cloud sync fails
- Installable Progressive Web App

## Evergreen data isolation

This app is configured for a separate Supabase project:

```text
Project reference: rugvuvmxmadzosbyvvoh
Table: evergreen_trades
Options table: evergreen_journal_options
Private image bucket: evergreen-trade-images
Browser namespace: evergreen_trade_journal_v1
```

It does not use the old journal's project, tables, bucket, or browser namespace.

## 1. Run the Supabase schema

1. Open the Evergreen Supabase project.
2. Go to **SQL Editor → New query**.
3. Open `supabase-schema.sql` from this project.
4. Copy the entire file into the SQL editor.
5. Click **Run**.

Verify that these resources exist:

```text
Table Editor
├── evergreen_trades
└── evergreen_journal_options

Storage
└── evergreen-trade-images
```

The SQL enables Row Level Security and grants the authenticated browser role the required table permissions.

## 2. Configure Supabase Auth URLs

In Supabase, open **Authentication → URL Configuration**.

Set the Site URL to:

```text
https://johnjitto-m.github.io/evergreen-trade-journal/
```

Add these Redirect URLs:

```text
https://johnjitto-m.github.io/evergreen-trade-journal/**
http://127.0.0.1:5500/**
http://localhost:5500/**
```

Email magic-link authentication is used. The first link can also create the Evergreen user account.

## 3. Run locally

1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.
5. Click **Sign In** in the Cloud Sync bar.
6. Enter your email and open the magic link Supabase sends.

No npm installation or build command is required. Supabase JavaScript v2 is loaded through its browser CDN.

## 4. Deploy to GitHub Pages

The repository should be:

```text
https://github.com/johnjitto-m/evergreen-trade-journal
```

In GitHub:

1. Open **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select branch `main` and folder `/(root)`.
4. Save.

The live site is:

```text
https://johnjitto-m.github.io/evergreen-trade-journal/
```

## 5. Push this updated cloud build

From the project folder:

```bash
git add .
git commit -m "Add clean HTF CISD question"
git push
```

GitHub Pages will redeploy automatically.

## Local-data migration

The app does not silently upload browser data. After signing in, the Cloud Sync bar displays how many trades exist only on the current device.

Click **Sync Local Data** to upload them. A confirmation warns that every local entry currently displayed—including any demo entries—will be uploaded. Delete unwanted demo trades before syncing, or export a JSON backup first.

New and edited trades sync automatically while signed in. If Supabase is unavailable, the trade remains saved locally and can be synced later.

## Public versus secret credentials

`supabase-config.js` contains only the browser-safe Project URL and publishable key. That file is expected to be public on GitHub Pages.

Never add any of these to the repository:

```text
Database password
Secret key
service_role key
JWT secret
```

## Entry-level multi-select update

The LTF entry option is a single choice between CISD, BREAKER BLOCK, and PCL CISD. Existing Spartan CISD and BB values are migrated to the new labels. If HTF FVG interaction is set to **Sweep**, **CISD** is automatically selected.

## Weekly table alignment fix

The dashboard action buttons now sit inside a normal table cell instead of turning the table cell itself into a flex container. This keeps the Actions header aligned and lets the weekly table use the full available width without a large dead area on the right.

## Full-screen trade review (v15)

The View action now opens a professional full-screen trade review dashboard. On desktop, Basic Information, HTF Analysis, LTF Execution, outcome metrics, and both chart-reference groups are visible together without vertical scrolling. Smaller screens automatically switch to a responsive scrollable layout.



## POI premium / discount update (v16)

The HTF Analysis step now records whether the selected POI is in **Premium** or **Discount**. The value is stored inside the existing `htf_analysis` JSON field, appears in full-screen Trade Review, research search and filters, strategy similarities, edge statistics, JSON backups, and CSV exports. No Supabase schema migration is required.


## v17 — Add-trade-style trade review

The View Trade screen now mirrors the Add Trade visual language in one full-screen, read-only page. Basic details, HTF questions, LTF questions, selected answers, chart previews, and links are visible without scrolling on normal desktop displays. Smaller screens fall back to a responsive scrollable layout.


## Centered trade-review popup (v18)

The View Trade screen now opens as a centered 1400px maximum-width popup instead of stretching edge-to-edge. Desktop layouts keep all saved Basic, HTF, LTF, and chart-reference information visible in a balanced Add Trade-style review. Smaller screens retain the responsive scroll fallback.


## Dashboard POI-zone update

- The weekly dashboard now shows Premium / Discount beside Direction instead of Status.
- New trades offer only Took Trade and Not Taken.
- Older Missed Trade records are treated as Not Taken when edited.


## Day time-frame chart and bias update (v23)

- The HTF Analysis page now starts with a dedicated **Day Time Frame Chart** link and preview panel.
- The original HTF chart panel appears directly below it.
- A new required **Day bias?** question records **Buy** or **Sell**.
- Day Bias is included in Trade Review, research search/filtering, strategy similarities, edge statistics, JSON backups, and CSV exports.
- Day chart links are stored inside the existing `htf_analysis` JSON field, so no Supabase SQL migration is required.

## Unified Add Trade dialogs (v24)

- Basic Info, HTF Analysis, and LTF Analysis now use the same desktop popup dimensions.
- HTF questions use a compact two-column layout so all eight questions remain visible on common laptop/desktop resolutions.
- Day and HTF chart panels are compacted without removing preview, link, upload, or open controls.
- LTF chart references and all four execution questions fit without internal scrolling at 1650×900 and 1365×768.
- Smaller screens retain a safe responsive scroll fallback.


## v25 — Basic + Day Analysis

- Day chart reference moved into Step 1 Basic Info.
- Day Bias now supports Buy, Sell, and No Bias.
- Added multi-select Day Bias Setups with persistent custom options.
- HTF page now focuses only on HTF chart and POI checklist.

## v30 — LTF closing layout and consolidated manual UI fixes

- LTF Question 1 and Question 2 share the first row.
- LTF Question 3 spans the complete second row.
- LTF Question 4 spans the complete third row with larger Risk, RR, and P/L controls.
- Day, HTF, and LTF chart areas use available vertical space.
- HTF duplicate chart-panel outline is removed.
- HTF analysis answers are optional and browser required-choice popovers are disabled.
- Wizard workflow stays bottom-left and navigation actions stay bottom-right.


## v33

- Replaced Day Bias Setups with split multi-select Pros and Cons dropdowns.
- Added HTF Question 8: HTF POI backed by?
- Added research, review, export, and cloud-option support for the new fields.
