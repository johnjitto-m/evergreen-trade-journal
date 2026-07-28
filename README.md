# Evergreen Trade Journal

A vanilla HTML/CSS/JavaScript web app that keeps the Evergreen setup journal separate from the old trading journal.

## Built in this version

### Dashboard

- Evergreen Trade Journal homepage matching the old journal style
- Current-week P/L, win rate, trade count, and average RR
- Weekly trade table with View, Edit, and Delete actions
- Consistent card heights, aligned controls, wrapped long labels, and responsive spacing
- JSON backup/import and CSV export
- Installable PWA files

### Full Research Journal

- Dedicated **View All Trades / Research Journal** screen
- Filtered P/L, win rate, trade count, and average RR
- Winning and losing setup similarity snapshots
- Best pair, session, SMT, POI support, mitigation, entry level, and BE logic cards
- Search plus filters for direction, status, pair, result, session, HTF, entry attempt, FVG status, formation day, SMT, SMT strength, POI support, third candle, mitigation, entry level, BE logic, and date range
- Sort by newest, oldest, P/L, or RR
- Desktop database table and responsive mobile trade cards
- Full trade-detail review modal
- Edit opens the selected trade back inside the three-step trade wizard

### Add Trade — Step 1: Basic Info

- Date and automatic weekday
- Pair, direction, session, HTF, and automatic LTF
- New trades default to **1H HTF** and **5m LTF**
- Took Trade / Missed Trade / Not Taken
- First Entry / Second Entry
- Fresh FVG / Partial FVG
- **When was the FVG formed?** — Today / Previous Day

### Step 2: HTF Analysis

- HTF TradingView/image link cards
- Add, preview, open, and remove chart links
- TradingView `/x/` snapshot links are converted to their direct chart image and displayed inside the HTF/LTF chart panel, matching the old journal
- Screenshot upload/drop fallback for local testing
- SMT Yes / No
- If SMT is Yes: Weak SMT / Strong SMT
- Automatic SMT comparison pair from the Basic Info pair
  - EURUSD ↔ GBPUSD
  - XAUUSD Gold ↔ XAGUSD Silver
  - Other included pairs also have comparison mappings
- POI support Yes / No
- If Yes: Previous FVG / Previous OB
- FVG third candle: Positive / Negative
- POI mitigation behaviour multi-select
- **Add More Option** saves a custom HTF option for later Evergreen trades

### Step 3: LTF Analysis

- LTF TradingView/image link cards
- Add, preview, open, and remove chart links
- Screenshot upload/drop fallback
- Entry level: Spartan CISD / BB
- **Add Option** saves a custom entry level for future Evergreen trades
- SL pips
- BE logic: BE Level / Counter FVG Mitigation / ERL
- Trade outcome: BE / SL / TP
- Risk amount prefilled at **$50** (still editable), RR, and automatic P/L calculation
- Save Trade writes the complete Basic + HTF + LTF record to the Evergreen-only local store

## Run in VS Code

1. Extract the project folder.
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html`.
5. Choose **Open with Live Server**.

No npm install or build command is required.

## Data separation from the old journal

The browser storage namespace is:

```text
evergreen_trade_journal_v1
```

Supabase uses separate Evergreen-only resources:

```text
Table: evergreen_trades
Custom options table: evergreen_journal_options
Storage bucket: evergreen-trade-images
```

The safest setup is a completely separate Supabase project for Evergreen Trade Journal. That prevents overlap in database tables, users, storage, keys, and backups.

Do not point this app at the old journal's table or image bucket. Run `supabase-schema.sql` only in the Supabase project selected for Evergreen.

## Custom option persistence

Supabase is not connected in this front-end version yet. The **Add Option** buttons currently persist in the Evergreen-only browser storage, so they survive future trades on the same browser.

The included `evergreen_journal_options` Supabase table is ready for the next step, when authentication and live cloud sync are connected.

## Screenshot storage note

During local testing, uploaded screenshots are stored inside the local draft and are limited to 2 MB. TradingView image links are better for now. After Supabase is connected, screenshots should upload to the private `evergreen-trade-images` bucket and only the storage path should be saved with the trade.

## GitHub Pages deployment

1. Create a new GitHub repository, such as `evergreen-trade-journal`.
2. Upload the project files to the repository root.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Select `main` and `/root`, then save.

## Next build stage

Connect Supabase authentication, save/load trades from `evergreen_trades`, sync custom options through `evergreen_journal_options`, and upload chart screenshots to `evergreen-trade-images`. The responsive research dashboard and local View/Edit workflow are already included.

## LTF chart reference presets

New LTF trades start with three separate link cards: LTF CISD setup, CISD entry setup, and BE / SL / TP setup. Older saved drafts are upgraded without deleting existing links.

## Latest layout adjustment

- Expanded the main application shell to use nearly the full browser width, leaving only a small responsive gutter.

## Inline chart preview

Clicking **Preview** on an HTF or LTF TradingView snapshot link now loads that chart directly into the large chart box on the left, just like the old journal. Clicking the displayed chart—or the **Open Active HTF/LTF Snapshot** button—opens the full-screen image viewer. TradingView `/x/.../` URLs are converted to their underlying snapshot PNG automatically. Uploaded screenshot fallbacks use the same inline panel.
