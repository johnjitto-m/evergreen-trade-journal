# Evergreen Trade Journal

A static HTML/CSS/JavaScript trading journal with an isolated Supabase backend. It can run locally through VS Code Live Server and deploy directly to GitHub Pages.

## Current build

- Responsive Evergreen dashboard and full research database
- Weekly dashboard ordered Monday to Sunday, with newly added trades placed at the bottom of their day
- Basic Info → HTF Analysis → LTF Analysis trade workflow
- HTF “FVG mitigation or sweep?” tracking; Sweep auto-selects Spartan CISD on LTF
- Clean HTF CISD question with conditional Inside FVG / Outside FVG selection
- LTF answers are optional, so incomplete trades can be saved and completed later through Edit
- TradingView snapshot previews and separate HTF/LTF reference links
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

The LTF question **Which entry level was used?** now supports selecting multiple entry levels. Existing trades that stored one entry level remain compatible. If HTF FVG interaction is set to **Sweep**, **Spartan CISD** is automatically added without removing any other selected entry level.

## Weekly table alignment fix

The dashboard action buttons now sit inside a normal table cell instead of turning the table cell itself into a flex container. This keeps the Actions header aligned and lets the weekly table use the full available width without a large dead area on the right.

## Full-screen trade review (v15)

The View action now opens a professional full-screen trade review dashboard. On desktop, Basic Information, HTF Analysis, LTF Execution, outcome metrics, and both chart-reference groups are visible together without vertical scrolling. Smaller screens automatically switch to a responsive scrollable layout.



## POI premium / discount update (v16)

The HTF Analysis step now records whether the selected POI is in **Premium** or **Discount**. The value is stored inside the existing `htf_analysis` JSON field, appears in full-screen Trade Review, research search and filters, strategy similarities, edge statistics, JSON backups, and CSV exports. No Supabase schema migration is required.
