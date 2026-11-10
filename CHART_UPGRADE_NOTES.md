# Dashboard and Analytics chart upgrade

Updated November 10, 2026. This note covers the chart upgrade; UI_REDESIGN_NOTES.md describes the earlier general redesign.

## Included

- Responsive Recharts Area, Line, Bar, Donut, and Funnel visualizations with consistent light/dark colors, rounded cards, compact axes, tooltips, and animations that respect reduced-motion preferences.
- Area/Line/Bar switching, interactive series legends, keyboard tooltips, donut highlighting, funnel action selection, and accessible chart data tables.
- 7-, 30-, and 90-day presets, custom start/end dates, refresh, invalid-date prevention, loading skeletons, empty states, chart error boundaries, and retry feedback.
- Last successful data remains labelled with its actual loaded period when a new request fails.
- Existing operational queues, activity feed, follow-up links, status breakdowns, and conversion table are retained.

## Real data and available coverage

No production demo data, generated statistics, invented revenue values, or unrelated sparklines are included.

| Display | Existing data used |
| --- | --- |
| User growth | Dashboard `trends[].signups`, or `signupsByDay[].count` when signup trends are absent |
| Active users | Dashboard `users.activeInRange`; Analytics `dauApprox` is labelled approximate |
| Matches and messages | Existing dashboard trends and period totals; existing Analytics totals |
| Subscription mix | Active Plus count and total members; other members are total minus active Plus |
| Swipes | Analytics `swipeSeries`, `swipeMix`, `swipeTotals`, and `rates` |
| Like-to-match funnel | The selected `recommendationPerformance` action's actual `likes`, `matches`, and `conversion` |
| Revenue | Existing billing availability/note; the supplied contract has no numerical revenue history |
| Calls | Existing `/admin/calls/status`, requested only for admin users; the supplied status contract has no call-volume history |

Missing metrics display an em dash or an unavailable state. Zero remains a genuine zero. Active-user and subscription history are not fabricated from signup or match history. Revenue and calls show availability, not artificial charts or zero amounts.

## Date-filter compatibility

Dashboard requests retain their existing `{ from, to }` shape. Analytics presets retain `{ days: 7 | 30 | 90 }`.

The supplied Analytics contract demonstrates preset days, but not custom dates. Custom Analytics views therefore use the existing Dashboard endpoint's supported `{ from, to }` request for registrations, active-user totals, matches, and messages. Swipe totals, conversion rates, and the funnel are explicitly unavailable for custom dates; selecting a preset restores them. Current snapshot counts are clearly distinguished from selected-period totals.

No undocumented parameters or new endpoints were introduced. Full custom-date swipe conversion and numerical revenue/call history would require supported backend data that is not present in this archive.

## Scope and validation

Only two pre-existing files were edited: `src/pages/DashboardPage.jsx` and `src/pages/AnalyticsPage.jsx`. Shared reporting components/styles/tests were added under `src/components/insights/`.

All API modules, authentication, routes, existing hooks, utilities, configuration, package.json, and package-lock.json are unchanged. The installed Recharts dependency is reused; no packages were added. Backend and mutation workflows are unchanged.

Validation completed:

- Production build passed.
- All 17 tests passed: 5 existing API tests and 12 reporting integrity/date tests.
- 30 isolated browser layout checks passed: both pages at 320, 390, 768, 1280, and 1440 pixels in light/dark themes, plus empty, zero, partial, error, and non-admin states at 390 pixels.
- Checked chart-type changes, legend toggles, keyboard tooltips, funnel action selection, chart data disclosure, preset requests, custom request parameters, invalid-date blocking, initial-error retry, loading skeletons, and retained-data feedback after refresh errors.
- Original archive comparison confirmed that all existing files except the two page components are unchanged (Git metadata is copied unchanged into the output archive).

Visual QA used an isolated test harness with all API traffic intercepted. The harness and test data are excluded from the deliverable. Live authentication/backend end-to-end workflows were not exercised. The build retains its existing large-chunk warning.

## Run

From the `ADMIN` directory, use your existing environment configuration:

```sh
npm ci
npm run dev
```

Validation and production output:

```sh
npm test
npm run build
```
