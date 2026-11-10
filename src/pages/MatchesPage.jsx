// Match management: stats, trends, conversion, records, config, fraud and reported matches.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getMatchAnalytics,
  getMatchConfig,
  getMatchStats,
  listMatches,
  listReportedMatches,
  listSuspiciousMatches,
  updateMatchConfig,
} from '../api/matches.api.js';
import { CHART_COLORS, formatDay } from '../components/charts/chartTheme.js';
import DonutChart from '../components/charts/DonutChart.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import SearchField from '../components/SearchField.jsx';
import LoadingState from '../components/LoadingState.jsx';
import MatchDetailDrawer from '../components/matches/MatchDetailDrawer.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { MATCH_STATUSES, SETTING_LABELS } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

const VIEWS = [
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Trends' },
  { value: 'records', label: 'Records' },
  { value: 'suspicious', label: 'Fraud' },
  { value: 'reported', label: 'Reported' },
  { value: 'config', label: 'Config' },
];

const BUCKETS = [
  { value: '', label: 'All lifecycles' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'unmatched', label: 'Unmatched' },
  { value: 'expired', label: 'Expired' },
];

function MatchTrendChart({ series }) {
  if (!series?.length) return <p className="muted">No match trend data for this range.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="match-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.pink} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.pink} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="chart-tooltip">
                <span className="chart-tooltip__label">{formatDay(label)}</span>
                <strong>
                  {formatNumber(payload[0].value)} matches · {formatNumber(payload[0].payload.chatsStarted)} chats (
                  {formatNumber(payload[0].payload.conversion)}%)
                </strong>
              </div>
            ) : null
          }
        />
        <Area type="monotone" dataKey="matches" stroke={CHART_COLORS.pink} strokeWidth={2.5} fill="url(#match-trend-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrendBreakdownTable({ grain, rows }) {
  const items = rows ?? [];
  if (items.length === 0) {
    return <p className="muted">No {grain} match data for this range.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="table data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Matches</th>
            <th>Chats started</th>
            <th>Conversion</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.period}>
              <td>{row.period}</td>
              <td>{formatNumber(row.matches)}</td>
              <td>{formatNumber(row.chatsStarted)}</td>
              <td>{formatNumber(row.conversion)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigPanel({ onSaved }) {
  const config = useApi(() => getMatchConfig(), [], { poll: false });
  const [values, setValues] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (config.data?.settings) {
      setValues(Object.fromEntries(config.data.settings.map((setting) => [setting.key, String(setting.value)])));
    }
  }, [config.data]);

  if (config.isLoading && !config.data) return <LoadingState />;
  if (config.error) return <ErrorState message={config.error} onRetry={config.reload} />;
  if (!config.data) return <ErrorState message="Could not load match configuration." onRetry={config.reload} />;

  const changes = Object.fromEntries(
    (config.data.settings ?? [])
      .filter((setting) => {
        const next = Number(values[setting.key]);
        return Number.isFinite(next) && values[setting.key] !== '' && next !== Number(setting.value);
      })
      .map((setting) => [setting.key, Number(values[setting.key])]),
  );
  const hasChanges = Object.keys(changes).length > 0;

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const result = await updateMatchConfig(changes);
      config.setData({ ...config.data, settings: result.settings });
      setConfirmOpen(false);
      onSaved('Match configuration updated. New matches use the new algorithm/expiry rules.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-stack">
      <section className="card">
        <h3>Expiry, algorithm & fraud thresholds</h3>
        <p className="muted small">{config.data.notes?.expiry}</p>
        <p className="muted small">{config.data.notes?.scoring}</p>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmOpen(true);
          }}
        >
          {(config.data.settings ?? []).map((setting) => (
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
              Save configuration
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Notes</h3>
        <DetailList
          rows={[
            ['Inactive', config.data.notes?.inactive],
            ['Algorithm', config.data.notes?.algorithm],
            ['Fraud', config.data.notes?.fraud],
          ]}
        />
      </section>

      {confirmOpen && (
        <ConfirmDialog
          open
          title="Update match configuration"
          message="Changes apply to newly created matches and admin fraud/inactive thresholds. The update is audited."
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

export default function MatchesPage() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState(7);
  const [view, setView] = useState('overview');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ status: '', q: '', bucket: '' });
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [trendGrain, setTrendGrain] = useState('daily');

  const stats = useApi(() => getMatchStats({ days }), [days]);
  const analytics = useApi(() => (view === 'analytics' ? getMatchAnalytics({ days }) : Promise.resolve(null)), [days, view]);
  const suspicious = useApi(() => (view === 'suspicious' && isAdmin ? listSuspiciousMatches() : Promise.resolve(null)), [view, isAdmin]);
  const list = usePaginatedList(listMatches, filters);
  const reported = usePaginatedList(listReportedMatches, {});

  const adminViews = isAdmin ? VIEWS : VIEWS.filter((item) => !['suspicious', 'config'].includes(item.value));

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
    setView('records');
  }

  return (
    <div className="matches-page">
      <PageHeader
        title="Match management"
        subtitle="Mutual matches, chat conversion, algorithm performance, expiry rules and fraud signals. Conversation text is never shown."
        actions={<SegmentedControl label="Date range" options={RANGES} value={days} onChange={setDays} />}
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <div className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Matches views">
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
        {(view === 'overview' || view === 'records') && (
          <form className="users-toolbar__form" onSubmit={handleSearch}>
            <SearchField
              value={searchText}
              onChange={setSearchText}
              onClear={() => setFilters((current) => ({ ...current, q: '' }))}
              placeholder="Search name, email, user ID, or match ID"
            />
            <button type="submit" className="button button--primary">
              Search
            </button>
            <FilterSelect
              label="Status"
              value={filters.status}
              options={MATCH_STATUSES}
              onChange={(status) => setFilters((current) => ({ ...current, status }))}
            />
            <label className="field field--inline">
              <span>Lifecycle</span>
              <select
                value={filters.bucket}
                onChange={(event) => setFilters((current) => ({ ...current, bucket: event.target.value }))}
              >
                {BUCKETS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </form>
        )}
      </div>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.data && (view === 'overview' || view === 'analytics' || view === 'records') ? (
        <div className="stat-grid">
          <StatCard label="Total matches" value={stats.data.total} />
          <StatCard
            label="New today"
            value={stats.data.newToday}
            hint={
              stats.data.todayDelta === 0
                ? 'Same as yesterday'
                : `${stats.data.todayDelta > 0 ? '+' : ''}${formatNumber(stats.data.todayDelta)} vs yesterday`
            }
          />
          <StatCard label="Active" value={stats.data.active} />
          <StatCard label="Inactive" value={stats.data.inactive} hint={`No chat · ${stats.data.config.matchInactiveDays}d+`} />
          <StatCard label="Unmatched" value={stats.data.unmatched} />
          <StatCard label="Expired" value={stats.data.expired} />
          <StatCard
            label="Match → chat %"
            value={stats.data.matchToChatConversion}
            hint={`${formatNumber(stats.data.chatsStarted)} chats in ${days}d`}
          />
          <StatCard
            label="Algorithm version"
            value={stats.data.config.algorithmLabel ?? `v${stats.data.config.matchAlgorithmVersion}`}
            hint={
              stats.data.config.matchExpiryDays === 0
                ? 'No expiry on new matches'
                : `Expiry ${stats.data.config.matchExpiryDays}d on new matches`
            }
          />
        </div>
      ) : null}

      {view === 'analytics' && (
        <div className="stack">
          <section className="card">
            <div className="card__header">
              <div>
                <h3>Match trends</h3>
                <p className="muted small">Daily volume with match → chat conversion.</p>
              </div>
              <SegmentedControl
                label="Grain"
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
                value={trendGrain}
                onChange={setTrendGrain}
              />
            </div>
            {analytics.isLoading && !analytics.data ? (
              <LoadingState />
            ) : analytics.error ? (
              <ErrorState message={analytics.error} onRetry={analytics.reload} />
            ) : analytics.data ? (
              <>
                {trendGrain === 'daily' && <MatchTrendChart series={analytics.data.series} />}
                {trendGrain !== 'daily' && (
                  <TrendBreakdownTable
                    grain={trendGrain}
                    rows={trendGrain === 'weekly' ? analytics.data.weekly : analytics.data.monthly}
                  />
                )}
              </>
            ) : null}
          </section>

          {analytics.data && (
            <div className="ops-grid">
              <DonutChart title="Ended reasons" counts={analytics.data.endedReasons} centerLabel="Ended" />
              <section className="card">
                <h3>Algorithm performance</h3>
                {(analytics.data.algorithmPerformance ?? []).length === 0 ? (
                  <p className="muted">No algorithm data in range.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table data-table">
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Matches</th>
                          <th>Avg score</th>
                          <th>Chat %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.data.algorithmPerformance.map((row) => (
                          <tr key={row.version}>
                            <td>{row.version}</td>
                            <td>{formatNumber(row.matches)}</td>
                            <td>{row.avgCompatibility != null ? formatNumber(row.avgCompatibility) : '—'}</td>
                            <td>{formatNumber(row.conversion)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {(view === 'overview' || view === 'records') && (
        <>
          <DataTablePanel title="Matches" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
            <ListView
              list={list}
              emptyMessage="No matches match these filters."
              columns={['Members', 'Status', 'Score', 'Algo', 'Messages', 'Matched', '']}
              renderRow={(match) => (
                <tr key={match.id}>
                  <td>
                    <div className="stack-inline">
                      {(match.users ?? []).map((user, index) => (
                        <UserCell key={user?.id ?? index} user={user} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge value={match.status} />{' '}
                    <StatusBadge value={match.lifecycle} />
                    {match.endedReason && <span className="muted small"> {formatEnum(match.endedReason)}</span>}
                  </td>
                  <td>{match.compatibilityScore != null ? formatNumber(match.compatibilityScore) : '—'}</td>
                  <td>{match.algorithmVersion}</td>
                  <td>
                    {match.messageCount}
                    {match.chatStarted ? <span className="muted small"> · chat</span> : null}
                  </td>
                  <td>{formatDateTime(match.matchedAt)}</td>
                  <td>
                    <button type="button" className="button button--secondary button--small" onClick={() => setSelectedMatchId(match.id)}>
                      Details
                    </button>
                  </td>
                </tr>
              )}
            />
          </DataTablePanel>
        </>
      )}

      {view === 'suspicious' && (
        <DataTablePanel title="Suspicious matching activity" subtitle="High match velocity and rapid unmatches in the last 24 hours.">
          {!isAdmin ? (
            <Notice>Fraud investigation requires ADMIN.</Notice>
          ) : suspicious.isLoading && !suspicious.data ? (
            <LoadingState />
          ) : suspicious.error ? (
            <ErrorState message={suspicious.error} onRetry={suspicious.reload} />
          ) : !suspicious.data ? (
            <ErrorState message="Could not load the fraud queue." onRetry={suspicious.reload} />
          ) : (
            <>
              <h4 className="muted">High velocity (threshold {suspicious.data.threshold} / 24h)</h4>
              {(suspicious.data.velocity ?? []).length === 0 ? (
                <p className="muted">No members over the match-velocity threshold.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Matches / 24h</th>
                        <th>Over by</th>
                        <th>Last match</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {(suspicious.data.velocity ?? []).map((row, index) => (
                        <tr key={row.user?.id ?? index}>
                          <td>
                            <UserCell user={row.user} />
                          </td>
                          <td>
                            <strong>{row.matchCount}</strong>
                          </td>
                          <td>
                            <span className="badge badge--danger">+{row.overBy}</span>
                          </td>
                          <td>{formatDateTime(row.lastMatchedAt)}</td>
                          <td>
                            {row.user?.id ? (
                              <Link className="button button--secondary button--small" to={`/users/${row.user.id}`}>
                                Open user
                              </Link>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h4 className="muted heading-spaced">
                Quick unmatches (5 minutes or less)
              </h4>
              {(suspicious.data.quickUnmatches ?? []).length === 0 ? (
                <p className="muted">No rapid unmatches in the last 24 hours.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table data-table">
                    <thead>
                      <tr>
                        <th>Members</th>
                        <th>Duration</th>
                        <th>Matched</th>
                        <th>Ended</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {(suspicious.data.quickUnmatches ?? []).map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="stack-inline">
                              {(row.users ?? []).map((user, index) => (
                                <UserCell key={user?.id ?? index} user={user} />
                              ))}
                            </div>
                          </td>
                          <td>{row.durationSeconds}s</td>
                          <td>{formatDateTime(row.matchedAt)}</td>
                          <td>{formatDateTime(row.endedAt)}</td>
                          <td>
                            <button type="button" className="button button--secondary button--small" onClick={() => setSelectedMatchId(row.id)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </DataTablePanel>
      )}

      {view === 'reported' && (
        <DataTablePanel title="Reported matches" subtitle="Open / in-review reports between members who also share a match record.">
          <ListView
            list={reported}
            emptyMessage="No open reports linked to a mutual match."
            columns={['Members', 'Match status', 'Open reports', 'Matched', '']}
            renderRow={(match) => (
              <tr key={match.id}>
                <td>
                  <div className="stack-inline">
                    {(match.users ?? []).map((user, index) => (
                      <UserCell key={user?.id ?? index} user={user} />
                    ))}
                  </div>
                </td>
                <td>
                  <StatusBadge value={match.status} /> <StatusBadge value={match.lifecycle} />
                </td>
                <td>
                  {(match.reports ?? []).map((report) => (
                    <div key={report.id} className="muted small">
                      <StatusBadge value={report.status} /> {formatEnum(report.reason)}
                    </div>
                  ))}
                </td>
                <td>{formatDateTime(match.matchedAt)}</td>
                <td>
                  <button type="button" className="button button--secondary button--small" onClick={() => setSelectedMatchId(match.id)}>
                    Investigate
                  </button>
                </td>
              </tr>
            )}
          />
        </DataTablePanel>
      )}

      {view === 'config' &&
        (isAdmin ? (
          <ConfigPanel
            onSaved={(message) => {
              setNotice(message);
              stats.reload();
            }}
          />
        ) : (
          <Notice>Match configuration requires ADMIN.</Notice>
        ))}

      {selectedMatchId && (
        <MatchDetailDrawer
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
          onChanged={(message) => {
            setNotice(message);
            list.reload();
            stats.reload();
          }}
        />
      )}
    </div>
  );
}
