# Project Ascension

A personal consistency operating system — a calendar, habit tracker, XP system,
and analytics dashboard in one. Tasks recur on configurable schedules, completions
earn XP, and everything syncs across devices through a Google Apps Script backend
with field-level, timestamp-based merging.

The original single-file implementation is preserved at `Ascension.html`
(kept for reference until the refactor is fully verified in production use).
`Code.gs` is the Google Apps Script backend source.

## Folder structure

```
├── index.html          # All markup: gate, sidebar, views, panels, modals
├── css/
│   └── styles.css      # Full design system (extracted verbatim from the original)
├── js/
│   ├── main.js         # Entry point: wiring, nav, PWA install, keyboard, boot,
│   │                   #   window globals for inline handlers
│   ├── config.js       # Constants: storage keys, palette, API URLs, intervals
│   ├── utils.js        # Pure helpers: uid, dates, HTML escaping, note shape
│   ├── i18n.js         # EN/TH strings + language switching
│   ├── store.js        # App state: load/save/normalize, persistence hook
│   ├── domain.js       # Business logic: recurrence, day stats, XP, records
│   ├── theme.js        # Dynamic accent color (red → green with completion %)
│   ├── ui-state.js     # Shared mutable UI state (calendar cursor, active ids)
│   ├── api.js          # Backend client: session storage, apiCall, retries
│   ├── sync.js         # Multi-device merge, polling, debounced push, indicator
│   ├── gate.js         # Login/register gate, session refresh, account deletion
│   ├── panels.js       # Slide-over panel + overlay helpers, About/Help
│   ├── today.js        # Today view: task list, categories, drag-sort, XP pop
│   ├── calendar.js     # Month calendar + day detail panel
│   ├── taskpanel.js    # Task & category forms, recurrence options, delete scopes
│   └── analytics.js    # Stats, heatmaps, scatter plot, period selectors
├── server.js           # Zero-dependency static dev server
├── package.json
└── Code.gs             # Google Apps Script backend (deploy separately)
```

### Module dependency notes

- `store.js`, `api.js`, and `i18n.js` cannot import the UI/sync modules without
  creating cycles, so they expose small registration hooks
  (`setOnPersist`, `setOnSessionChange`, `setAfterApply`) that `main.js` wires up.
- `calendar.js` ⇄ `taskpanel.js` and `today.js` ⇄ `taskpanel.js` have intentional
  circular imports — all cross-calls happen inside event handlers, never at
  module-evaluation time, which ES modules handle safely.
- Inline `onclick`/`onchange` handlers in `index.html` are preserved; `main.js`
  exposes the needed functions on `window`.

## Technologies

- Vanilla HTML/CSS/JavaScript (ES modules) — no build step, no framework
- SortableJS (CDN) for drag-to-reorder
- Google Apps Script (`Code.gs`) as the sync backend — plain `fetch` POSTs with
  `text/plain` bodies to avoid CORS preflight
- Browser `localStorage` for offline-first state + session cache

## Installation & development

Requires Node.js (any recent LTS).

```bash
npm start          # serves the app on http://localhost:8080
node server.js 3000   # or pick a port: node server.js <port> / PORT=3000
```

The app **must** be served over HTTP(S) — ES modules and the auth-gated fetch
calls do not work from `file://`. The old `Ascension.html` single-file version
was the only one usable directly from disk.

## Configuration

| Setting | Where | Notes |
|---|---|---|
| Backend URL | `js/config.js` → `DEFAULT_API_URL` | Points at the deployed Apps Script `/exec` URL. A legacy `ascend_api_url` localStorage override is auto-cleared on boot. |
| Local state key | `js/config.js` → `STORE_KEY` | `ascend_state_v1` |
| Session key | `js/config.js` → `LS_SESSION` | `ascend_session` |
| Poll interval | `js/config.js` → `POLL_INTERVAL_MS` | 10s multi-device sync |
| Language | `localStorage` `ascend_lang` | `en` / `th`, toggle in sidebar |

No secrets are stored in the frontend — only the session token returned by the
backend after login.

## Backend

`Code.gs` is deployed as a Google Apps Script web app ("Anyone" access). It
handles `register`, `login`, `logout`, `getState`, `saveState`, and
`deleteAccount` actions against a Google Sheet. Deploy it separately; the
frontend only needs the `/exec` URL.

## Removed vs. the original file

- **Chart.js** CDN script — loaded but never instantiated (all charts are
  hand-rolled DOM/SVG). Removed.
- Dead code: `renderPeriodChart`, `currentMonthChartPct/XP`, `computeStreaks`,
  `xpForLevel`, `levelFromXP`, `WEEKDAY_FULL_*`, `pullStateFromBackend`.
- The inline password-autofill `<script>` moved into `gate.js`
  (`initGateAutofill`).

All features, calculations, recurrence rules, merge semantics, and UI behavior
are otherwise unchanged.
