# BitFlow Stability & Connectivity Fixes Spec

This spec documents the issues reported, root causes, the changes made, and validation steps. It also includes rollout instructions and acceptance criteria.

## Reported Issues

- GLib-GObject-CRITICAL spam on startup (stderr noise)
- Node warning: Accessing non-existent property 'runBacktest' of module exports inside circular dependency
- Settings monitor showing values inconsistent with saved settings (e.g., monitor shows Enabled when files say OFF)
- API connections showing Disconnected for Alpaca/Polygon when configured
- Smart Model Manager displays "Not Ready" even after initialization

## Root Causes

- GLib logs come from underlying libraries writing to stderr; not actionable app errors.
- Circular dependency: `core/backtest.js` required `../BitFlow`, which requires `core/backtest.js` through the CLI flow -> property access warning.
- Settings files contained emojis/ANSI codes like `"\u001b[31m✗ OFF\u001b[39m"`, but the monitor only parsed literal `true/false`.
- System connections section used hardcoded flags instead of probing actual API connectivity.
- `SmartModelManager` readiness was inferred from the inner LLM instead of a clear `isInitialized` flag at the manager level.
- Minor bug: monitor interval name mismatch prevented proper cleanup.

## Changes Implemented

- direct_file_monitor.js
  - Added `stripAnsi()` and `parseBooleanish()` to robustly parse ON/OFF and emoji-laden values.
  - Monitor card now treats only `=== true` as enabled to avoid truthy strings misreporting.

- core/smartModelManager.js
  - Added `this.isInitialized` to the manager class.
  - Set/reset flag inside `initialize()` and on errors.
  - `getSystemStatus()` now returns the manager-level `isInitialized`.

- core/backtest.js
  - Removed circular dependency by eliminating `require('../BitFlow')`.
  - Implemented Yahoo Finance historical data fetch with timeframe mapping.
  - Kept the `runBacktest(symbol, timeframe, limit)` API unchanged.

- BitFlow.js
  - Removed nonexistent import `checkLlamaAPI` from `core/apiHelpers`.
  - Added `checkConnections()` method to probe Alpaca account and Polygon News.
  - Called `checkConnections()` from both CLI status section and `startMonitoring()`.
  - Fixed interval cleanup to use `this.monitorInterval` consistently.

## Files Touched

- `direct_file_monitor.js`
- `core/smartModelManager.js`
- `core/backtest.js`
- `BitFlow.js`

## Backwards Compatibility

- `runBacktest()` signature and return shape unchanged.
- CLI usage unchanged.
- Settings files remain simple `.txt`; parser is just more robust.

## Validation Steps

1) Install dependencies (ensure yahoo-finance2 present):
   - `npm install` (project already contains yahoo-finance2 in use)

2) Ensure `.env` contains:
   - `ALPACA_API_KEY_ID=...`
   - `ALPACA_SECRET_KEY=...`
   - `POLYGON_API_KEY=...`
   - `FINNHUB_API_KEY=...` (optional for current paths)

3) Prepare settings files in `user_settings/`:
   - `defaultTimeframe.txt` e.g. `1Min` or `1 Minute`
   - `enableCrossunderSignals.txt` with `ON`/`OFF`, `true`/`false`, or emoji-labeled strings

4) Run:
   - `node BitFlow.js BTC/USD`

5) Expected behavior:
   - No GLib spam on startup (filtered from stderr).
   - No circular dependency warning about `runBacktest`.
   - Monitor card reflects exact settings from text files (even if they contain emojis/ANSI codes).
   - System Connections now probe:
     - Alpaca: Connected if credentials valid; Disconnected otherwise.
     - Polygon: Connected if key valid and API reachable; Disconnected otherwise.
     - Yahoo Finance: Connected (pulls price or falls back to simulated price with a log).
   - Smart Model Manager status: `● Ready` after initialization completes.

6) Stop the process (Ctrl+C):
   - Should print `Market monitoring stopped` without lingering timers.

## Acceptance Criteria

- **GLib Filtering**: No GLib-GObject-CRITICAL spam appears in the console.
- **Circular Dependency**: Warning about `runBacktest` circular export does not appear.
- **Settings Accuracy**: Changing any `user_settings/*.txt` value is reflected correctly in the monitor card.
- **Connections Panel**: Accurately displays Alpaca/Polygon connectivity state.
- **Model Manager**: Shows `● Ready` when initialized; `○ Not Ready` otherwise.
- **Stability**: Process starts, shows current price polling every 10s, and terminates cleanly.

## Notes

- If Alpaca credentials are not set or are invalid, the status will show `○ Disconnected` by design.
- If Polygon API key is missing, the Polygon News check will show `○ Disconnected`.
- Yahoo Finance API is best-effort; on transient errors, the system falls back to simulated price to keep the monitor alive.
