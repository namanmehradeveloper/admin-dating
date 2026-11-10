// Swipe & like management: volume charts, conversion, abuse, member investigation, entitlements.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getMemberSwipeReport,
  getSwipeAnalytics,
  getSwipeEntitlements,
  getSwipeStats,
  listSwipeAbuse,
  listSwipes,
  updateSwipeEntitlements,
} from '../api/swipes.api.js';
import { CHART_COLORS, formatDay, STATUS_COLORS } from '../components/charts/chartTheme.js';
import DonutChart from '../components/charts/DonutChart.jsx';
import HorizontalBarChart from '../components/charts/HorizontalBarChart.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { SETTING_LABELS, SWIPE_ACTIONS } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

const VIEWS = [
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Conversion' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'investigate', label: 'Investigate' },
  { value: 'entitlements', label: 'Entitlements' },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__label">{formatDay(label)}</span>
      {payload.map((entry) => (
        <strong key={entry.dataKey} className="chart-series-swatch" style={{ color: entry.color }}>
          {formatEnum(entry.dataKey)}: {formatNumber(entry.value)}
          {entry.dataKey === 'conversion' ? '%' : ''}
        </strong>
      ))}
    </div>
  );
}

function SwipeVolumeChart({ series, days }) {
  if (!series?.length) return <p className="muted">No swipe volume for this range.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="swipe-likes-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STATUS_COLORS.LIKE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={STATUS_COLORS.LIKE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="swipe-passes-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STATUS_COLORS.PASS} stopOpacity={0.3} />
            <stop offset="100%" stopColor={STATUS_COLORS.PASS} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="swipe-super-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STATUS_COLORS.SUPER_LIKE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={STATUS_COLORS.SUPER_LIKE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={formatDay}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          minTickGap={days > 30 ? 40 : 24}
        />
        <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Area type="monotone" dataKey="likes" name="Likes" stroke={STATUS_COLORS.LIKE} strokeWidth={2} fill="url(#swipe-likes-fill)" />
        <Area type="monotone" dataKey="passes" name="Passes" stroke={STATUS_COLORS.PASS} strokeWidth={2} fill="url(#swipe-passes-fill)" />
        <Area
          type="monotone"
          dataKey="superLikes"
          name="Super likes"
          stroke={STATUS_COLORS.SUPER_LIKE}
          strokeWidth={2}
          fill="url(#swipe-super-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ConversionTrendChart({ series }) {
  if (!series?.length) return <p className="muted">No conversion data for this range.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={formatDay}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={[0, 'auto']}
          tickFormatter={(value) => `${value}%`}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="matches" name="Matches" stroke={CHART_COLORS.teal} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="conversion" name="Conversion %" stroke={CHART_COLORS.amber} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DailyMixBarChart({ series }) {
  if (!series?.length) return <p className="muted">No daily mix for this range.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={formatDay}
          tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Bar dataKey="likes" name="Likes" stackId="mix" fill={STATUS_COLORS.LIKE} radius={[0, 0, 0, 0]} />
        <Bar dataKey="superLikes" name="Super likes" stackId="mix" fill={STATUS_COLORS.SUPER_LIKE} />
        <Bar dataKey="passes" name="Passes" stackId="mix" fill={STATUS_COLORS.PASS} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SwipeHistoryList({ filters }) {
  const list = usePaginatedList(listSwipes, filters);
  return (
    <section className="users-table-panel card users-table-panel--data">
      <header className="users-table-panel__header">
        <div>
          <h2>
            {formatEnum(filters.direction)} history
            {filters.action ? ` · ${formatEnum(filters.action)}` : ''}
          </h2>
          <p className="muted small">Each row is one swipe event (pass = dislike).</p>
        </div>
      </header>
      <ListView
        list={list}
        emptyMessage="No swipes for this member with the current filters."
        columns={['From', 'To', 'Action', 'Match', 'When']}
        renderRow={(swipe) => (
          <tr key={swipe.id}>
            <td>
              <UserCell user={swipe.user} />
            </td>
            <td>
              <UserCell user={swipe.targetUser} />
            </td>
            <td>
              <StatusBadge value={swipe.action} />
            </td>
            <td>{swipe.matchId ? <Link to={`/matches`}>{swipe.matchId}</Link> : '—'}</td>
            <td>{formatDateTime(swipe.createdAt)}</td>
          </tr>
        )}
      />
    </section>
  );
}

function EntitlementsPanel({ onSaved }) {
  const entitlements = useApi(() => getSwipeEntitlements(), [], { poll: false });
  const [values, setValues] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (entitlements.data?.settings) {
      setValues(Object.fromEntries(entitlements.data.settings.map((setting) => [setting.key, String(setting.value)])));
    }
  }, [entitlements.data]);

  if (entitlements.isLoading && !entitlements.data) return <LoadingState />;
  if (entitlements.error) return <ErrorState message={entitlements.error} onRetry={entitlements.reload} />;

  const changes = Object.fromEntries(
    (entitlements.data.settings ?? [])
      .filter((setting) => values[setting.key] !== String(setting.value))
      .map((setting) => [setting.key, Number(values[setting.key])]),
  );
  const hasChanges = Object.keys(changes).length > 0;

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const result = await updateSwipeEntitlements(changes);
      entitlements.setData({ ...entitlements.data, settings: result.settings });
      setConfirmOpen(false);
      onSaved('Swipe entitlements updated. Limits apply immediately.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-stack">
      <div className="stat-grid">
        <StatCard label="Premium members" value={entitlements.data.premiumActive} />
        <StatCard label="API rate limit" value="120/min" hint="Per member swipe endpoint" />
      </div>

      <section className="card">
        <h3>Quota & rewind settings</h3>
        <p className="muted small">{entitlements.data.notes?.rewind}</p>
        <p className="muted small">{entitlements.data.notes?.priorityLikes}</p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmOpen(true);
          }}
        >
          {(entitlements.data.settings ?? []).map((setting) => (
            <label key={setting.key} className="field">
              <span>{SETTING_LABELS[setting.key] ?? setting.key}</span>
              <input
                type="number"
                min={setting.min}
                max={setting.max}
                step={1}
                value={values[setting.key] ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, [setting.key]: event.target.value }))}
              />
              <span className="muted small">
                Default {setting.defaultValue} · range {setting.min}–{setting.max}
              </span>
            </label>
          ))}
          <div className="form-grid__actions">
            <button type="submit" className="button button--primary" disabled={!hasChanges}>
              Save entitlements
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Notes</h3>
        <DetailList
          rows={[
            ['Priority likes', entitlements.data.notes?.priorityLikes],
            ['Rate limiting', entitlements.data.notes?.rateLimit],
          ]}
        />
      </section>

      {confirmOpen && (
        <ConfirmDialog
          open
          title="Update swipe entitlements"
          message="These limits apply to free members immediately. The change is audited."
          confirmLabel="Save"
          isBusy={busy}
          error={error}
          onConfirm={handleSave}
          onCancel={() => {
            setConfirmOpen(false);
            setError(null);
          }}
        />
      )}
    </div>
  );
}

export default function SwipesPage() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState(7);
  const [view, setView] = useState('overview');
  const [userId, setUserId] = useState('');
  const [filters, setFilters] = useState({ userId: '', action: '', direction: 'sent' });
  const [notice, setNotice] = useState(null);

  const stats = useApi(() => getSwipeStats({ days }), [days]);
  const analytics = useApi(
    () => (view === 'analytics' || view === 'overview' ? getSwipeAnalytics({ days }) : Promise.resolve(null)),
    [days, view],
  );
  const abuse = useApi(() => (view === 'abuse' && isAdmin ? listSwipeAbuse() : Promise.resolve(null)), [view, isAdmin]);
  const report = useApi(
    () => (filters.userId && view === 'investigate' && isAdmin ? getMemberSwipeReport(filters.userId) : Promise.resolve(null)),
    [filters.userId, view, isAdmin],
  );

  function handleInvestigate(event) {
    event.preventDefault();
    const nextId = userId.trim();
    if (!nextId) return;
    setFilters((current) => ({ ...current, userId: nextId }));
    setView('investigate');
  }

  const adminViews = isAdmin ? VIEWS : VIEWS.filter((item) => item.value === 'overview' || item.value === 'analytics');
  const series = analytics.data?.series ?? [];
  const actionMix = analytics.data?.actionMix ?? {};
  const performanceItems = (analytics.data?.recommendationPerformance ?? []).map((row) => ({
    key: row.action,
    name: formatEnum(row.action),
    value: row.matches,
    color: STATUS_COLORS[row.action] ?? CHART_COLORS.primary,
  }));

  const memberActionMix = report.data
    ? {
        LIKE: report.data.totals.likesSent,
        PASS: report.data.totals.passesSent,
        SUPER_LIKE: report.data.totals.superLikesSent,
      }
    : null;

  return (
    <div className="swipes-page">
      <PageHeader
        title="Swipes & likes"
        subtitle="Volume, conversion charts, quotas, rewind entitlements and swipe-abuse detection."
        actions={<SegmentedControl label="Date range" options={RANGES} value={days} onChange={setDays} />}
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <div className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Swipes views">
          {adminViews.map((chip) => (
            <button
              key={chip.value}
              type="button"
              role="tab"
              aria-selected={view === chip.value}
              className={`users-chip ${view === chip.value ? 'is-active' : ''}`}
              onClick={() => setView(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.data && (view === 'overview' || view === 'analytics') ? (
        <div className="stat-grid">
          <StatCard
            label="Total swipes"
            value={stats.data.totalSwipes}
            hint={`Last ${stats.data.days} days · ${formatNumber(stats.data.uniqueSwingers)} active members`}
          />
          <StatCard label="Likes" value={stats.data.likes} hint={`${formatNumber(stats.data.likeRate)}% of all swipes`} />
          <StatCard label="Passes" value={stats.data.passes} hint={`${formatNumber(stats.data.passRate)}% of all swipes`} />
          <StatCard label="Super / priority likes" value={stats.data.superLikes} />
          <StatCard
            label="Like → match"
            value={`${formatNumber(stats.data.conversion)}%`}
            hint={`${formatNumber(stats.data.matchesCreated)} matches from likes`}
          />
          <StatCard label="Pending likes" value={stats.data.pendingLikes} hint="Likes not yet matched" />
          <StatCard
            label="Today"
            value={stats.data.today.likes + stats.data.today.passes + stats.data.today.superLikes}
            hint={`${stats.data.today.likes} likes · ${stats.data.today.passes} passes · ${stats.data.today.superLikes} super`}
          />
          <StatCard
            label="Free daily likes"
            value={stats.data.entitlements.freeDailyLikes}
            hint={`Super ${stats.data.entitlements.freeDailySuperLikes} · Rewinds ${
              stats.data.entitlements.rewindPremiumOnly ? 'premium only' : stats.data.entitlements.freeDailyRewinds
            } · Abuse ≥ ${stats.data.entitlements.abuseThreshold}/24h`}
          />
        </div>
      ) : null}

      {view === 'overview' && (
        <div className="stack">
          {analytics.isLoading && !analytics.data ? (
            <LoadingState />
          ) : analytics.error ? (
            <ErrorState message={analytics.error} onRetry={analytics.reload} />
          ) : analytics.data ? (
            <>
              <section className="card">
                <div className="card__header">
                  <div>
                    <h2>Swipe volume</h2>
                    <p className="muted small">Daily likes, passes and super likes over the selected range.</p>
                  </div>
                </div>
                <SwipeVolumeChart series={series} days={days} />
              </section>

              <div className="grid-2">
                <DonutChart title="Action mix" counts={actionMix} centerLabel="Swipes" />
                <section className="card">
                  <div className="card__header">
                    <div>
                      <h2>Conversion trend</h2>
                      <p className="muted small">Matches created and like → match % by day.</p>
                    </div>
                  </div>
                  <ConversionTrendChart series={series} />
                </section>
              </div>

              <section className="card">
                <h2>Entitlement snapshot</h2>
                <DetailList
                  rows={[
                    ['Premium members', formatNumber(stats.data?.entitlements.premiumActive)],
                    ['Free daily likes', stats.data?.entitlements.freeDailyLikes],
                    ['Free daily super likes', stats.data?.entitlements.freeDailySuperLikes],
                    [
                      'Rewinds',
                      stats.data?.entitlements.rewindPremiumOnly
                        ? 'Premium only'
                        : `${stats.data?.entitlements.freeDailyRewinds} free / day`,
                    ],
                    ['Abuse threshold / 24h', stats.data?.entitlements.abuseThreshold],
                    ['Unique members in range', formatNumber(stats.data?.uniqueSwingers)],
                  ]}
                />
              </section>
            </>
          ) : null}
        </div>
      )}

      {view === 'analytics' && (
        <div className="stack">
          {analytics.isLoading && !analytics.data ? (
            <LoadingState />
          ) : analytics.error ? (
            <ErrorState message={analytics.error} onRetry={analytics.reload} />
          ) : analytics.data ? (
            <>
              <section className="card">
                <div className="card__header">
                  <div>
                    <h2>Daily action mix</h2>
                    <p className="muted small">Stacked likes, super likes and passes per day.</p>
                  </div>
                </div>
                <DailyMixBarChart series={series} />
              </section>

              <div className="grid-2">
                <DonutChart title="Action share" counts={actionMix} centerLabel="Swipes" />
                <HorizontalBarChart
                  title="Matches by like type"
                  items={performanceItems}
                  emptyText="No matched likes in this range"
                />
              </div>

              <section className="card">
                <div className="card__header">
                  <div>
                    <h2>Conversion analytics</h2>
                    <p className="muted small">How each like type converts into a mutual match.</p>
                  </div>
                </div>
                <ConversionTrendChart series={series} />
              </section>

              <section className="users-table-panel card users-table-panel--data">
                <header className="users-table-panel__header">
                  <div>
                    <h2>Recommendation performance</h2>
                    <p className="muted small">Volume and conversion by action type.</p>
                  </div>
                </header>
                <div className="table-wrap">
                  <table className="table data-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Volume</th>
                        <th>Matches</th>
                        <th>Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics.data.recommendationPerformance ?? []).map((row) => (
                        <tr key={row.action}>
                          <td>
                            <StatusBadge value={row.action} />
                          </td>
                          <td>{formatNumber(row.likes)}</td>
                          <td>{formatNumber(row.matches)}</td>
                          <td>{formatNumber(row.conversion)}%</td>
                        </tr>
                      ))}
                      {(analytics.data.recommendationPerformance ?? []).length === 0 && (
                        <tr className="table__row--empty">
                          <td colSpan={4}>No like actions in this range.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="users-table-panel card users-table-panel--data">
                <header className="users-table-panel__header">
                  <div>
                    <h2>Daily series</h2>
                    <p className="muted small">Raw day-by-day breakdown for the selected range.</p>
                  </div>
                </header>
                <div className="table-wrap">
                  <table className="table data-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Likes</th>
                        <th>Passes</th>
                        <th>Super likes</th>
                        <th>Matches</th>
                        <th>Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {series.map((row) => (
                        <tr key={row.day}>
                          <td>{formatDay(row.day)}</td>
                          <td>{formatNumber(row.likes)}</td>
                          <td>{formatNumber(row.passes)}</td>
                          <td>{formatNumber(row.superLikes)}</td>
                          <td>{formatNumber(row.matches)}</td>
                          <td>{formatNumber(row.conversion)}%</td>
                        </tr>
                      ))}
                      {series.length === 0 && (
                        <tr className="table__row--empty">
                          <td colSpan={6}>No daily rows for this range.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>
      )}

      {view === 'abuse' && (
        <section className="users-table-panel card users-table-panel--data">
          <header className="users-table-panel__header">
            <div>
              <h2>Swipe abuse / rate-limit queue</h2>
              <p className="muted small">
                Members at or above the 24h swipe threshold (also used by fraud HIGH_SWIPE_VELOCITY). Hard API limit remains 120
                swipes/minute.
              </p>
            </div>
          </header>
          {!isAdmin ? (
            <div className="panel-pad">
              <Notice>Abuse investigation requires ADMIN.</Notice>
            </div>
          ) : abuse.error ? (
            <div className="panel-pad">
              <ErrorState message={abuse.error} onRetry={abuse.reload} />
            </div>
          ) : abuse.isLoading || !abuse.data ? (
            <LoadingState />
          ) : abuse.data.items.length === 0 ? (
            <p className="muted panel-pad--muted">
              No members over the threshold right now (threshold: {formatNumber(abuse.data.threshold)} swipes /{' '}
              {abuse.data.windowHours ?? 24}h). Lower the threshold under Entitlements or wait for high-volume swipers.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Swipes / 24h</th>
                    <th>Likes</th>
                    <th>Passes</th>
                    <th>Super</th>
                    <th>Over by</th>
                    <th>Plan</th>
                    <th>Last swipe</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {abuse.data.items.map((row) => (
                    <tr key={row.user?.id ?? row.userId}>
                      <td>{row.user ? <UserCell user={row.user} /> : <span className="muted">Unknown member</span>}</td>
                      <td>
                        <strong>{formatNumber(row.swipeCount)}</strong>
                        <span className="muted small"> / {formatNumber(abuse.data.threshold)}</span>
                      </td>
                      <td>{formatNumber(row.likes)}</td>
                      <td>{formatNumber(row.passes)}</td>
                      <td>{formatNumber(row.superLikes)}</td>
                      <td>
                        <span className="badge badge--danger">+{formatNumber(row.overBy)}</span>
                      </td>
                      <td>{row.isPremium ? <StatusBadge value="PLUS" /> : 'Free'}</td>
                      <td>{formatDateTime(row.lastSwipeAt)}</td>
                      <td>
                        {row.user?.id && (
                          <button
                            type="button"
                            className="button button--secondary button--small"
                            onClick={() => {
                              setUserId(row.user.id);
                              setFilters({ userId: row.user.id, action: '', direction: 'sent' });
                              setView('investigate');
                            }}
                          >
                            Investigate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {view === 'investigate' && (
        <>
          {!isAdmin ? (
            <Notice>Per-member swipe lists and pass history require ADMIN.</Notice>
          ) : (
            <>
              <form className="users-toolbar card" onSubmit={handleInvestigate}>
                <div className="users-toolbar__form">
                  <SearchField
                    value={userId}
                    onChange={setUserId}
                    placeholder="Enter user ID"
                    maxLength={64}
                  />
                  <label className="field field--inline">
                    <span>Direction</span>
                    <select
                      value={filters.direction}
                      onChange={(event) => setFilters((current) => ({ ...current, direction: event.target.value }))}
                    >
                      <option value="sent">Sent</option>
                      <option value="received">Received</option>
                    </select>
                  </label>
                  <FilterSelect
                    label="Action"
                    value={filters.action}
                    options={SWIPE_ACTIONS}
                    onChange={(action) => setFilters((current) => ({ ...current, action }))}
                  />
                  <button type="submit" className="button button--primary">
                    Load
                  </button>
                </div>
              </form>

              {filters.userId ? (
                <>
                  {report.isLoading && !report.data ? (
                    <LoadingState />
                  ) : report.error ? (
                    <ErrorState message={report.error} onRetry={report.reload} />
                  ) : report.data ? (
                    <div className="stack">
                      <section className="card">
                        <div className="stack-inline stack-inline--between">
                          <UserCell user={report.data.user} />
                          <Link className="button button--secondary button--small" to={`/users/${report.data.user.id}`}>
                            Open user
                          </Link>
                        </div>
                        <div className="stat-grid">
                          <StatCard label="Likes sent" value={report.data.totals.likesSent} />
                          <StatCard label="Passes sent" value={report.data.totals.passesSent} />
                          <StatCard label="Super likes" value={report.data.totals.superLikesSent} />
                          <StatCard
                            label="Like → match"
                            value={`${formatNumber(report.data.totals.conversion)}%`}
                            hint={`${formatNumber(report.data.totals.matchesFromLikes)} matches · ${formatNumber(report.data.totals.likesReceived)} likes received`}
                          />
                        </div>
                        <DetailList
                          rows={[
                            ['Plan', <StatusBadge key="tier" value={report.data.entitlement?.tier} />],
                            [
                              'Today remaining',
                              report.data.isPremium
                                ? 'Unlimited (premium)'
                                : `Likes ${report.data.today.likesRemaining} · Super ${report.data.today.superLikesRemaining} · Rewinds ${report.data.today.rewindsRemaining}`,
                            ],
                            [
                              'Rewind policy',
                              report.data.limits.rewindPremiumOnly
                                ? 'Premium only'
                                : `${report.data.limits.freeDailyRewinds} free / day`,
                            ],
                          ]}
                        />
                      </section>
                      <DonutChart title="Member sent mix" counts={memberActionMix} centerLabel="Sent" />
                    </div>
                  ) : null}

                  <SwipeHistoryList filters={filters} />
                </>
              ) : (
                <Notice>Enter a member user id to load sent/received swipes and disliked (PASS) history.</Notice>
              )}
            </>
          )}
        </>
      )}

      {view === 'entitlements' &&
        (isAdmin ? (
          <EntitlementsPanel
            onSaved={(message) => {
              setNotice(message);
              stats.reload();
            }}
          />
        ) : (
          <Notice>Entitlement settings require ADMIN.</Notice>
        ))}
    </div>
  );
}
