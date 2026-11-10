// Block management: volume, trends, velocity, member investigation. No silent admin unblock.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Ban, ShieldAlert, UserMinus, Users } from 'lucide-react';
import {
  getBlockAnalytics,
  getBlockStats,
  getMemberBlockReport,
  listBlocks,
  listBlockVelocity,
} from '../api/blocks.api.js';
import BlockDetailDrawer from '../components/blocks/BlockDetailDrawer.jsx';
import { CHART_COLORS, formatDay } from '../components/charts/chartTheme.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import StatCard from '../components/StatCard.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { formatDateTime, formatNumber } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

const VIEWS = [
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Trends' },
  { value: 'records', label: 'Records' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'investigate', label: 'Investigate' },
];

function BlockTrendChart({ series, days }) {
  if (!series?.length || series.every((row) => row.blocks === 0)) {
    return <p className="muted">No blocks in this range yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="block-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
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
                  {formatNumber(payload[0].value)} blocks · last {days}d
                </strong>
              </div>
            ) : null
          }
        />
        <Area type="monotone" dataKey="blocks" stroke={CHART_COLORS.amber} strokeWidth={2.5} fill="url(#block-trend-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function BlocksPage() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState(7);
  const [view, setView] = useState('overview');
  const [searchText, setSearchText] = useState('');
  const [blockerId, setBlockerId] = useState('');
  const [blockedId, setBlockedId] = useState('');
  const [mutualOnly, setMutualOnly] = useState(false);
  const [filters, setFilters] = useState({ blockerId: '', blockedId: '', q: '', mutual: '' });
  const [investigateId, setInvestigateId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const stats = useApi(() => getBlockStats({ days }), [days]);
  const analytics = useApi(() => (view === 'analytics' ? getBlockAnalytics({ days }) : Promise.resolve(null)), [days, view]);
  const velocity = useApi(() => (view === 'velocity' && isAdmin ? listBlockVelocity() : Promise.resolve(null)), [view, isAdmin]);
  const report = useApi(
    () => (memberId && view === 'investigate' && isAdmin ? getMemberBlockReport(memberId) : Promise.resolve(null)),
    [memberId, view, isAdmin],
  );
  const list = usePaginatedList(listBlocks, filters);

  const adminViews = isAdmin ? VIEWS : VIEWS.filter((item) => !['velocity', 'investigate'].includes(item.value));

  function applyFilters(event) {
    event.preventDefault();
    setFilters({
      blockerId: blockerId.trim(),
      blockedId: blockedId.trim(),
      q: searchText.trim(),
      mutual: mutualOnly ? 'true' : '',
    });
    setView('records');
  }

  function handleInvestigate(event) {
    event.preventDefault();
    const nextId = investigateId.trim();
    if (!nextId) return;
    setMemberId(nextId);
    setView('investigate');
  }

  return (
    <div className="blocks-page">
      <PageHeader
        title="Block management"
        subtitle="Member-initiated blocks. Staff cannot silently override a safety block from this screen."
        actions={<SegmentedControl label="Date range" options={RANGES} value={days} onChange={setDays} />}
      />

      <Notice tone="warning">
        Unblocking is a user safety action. Use user status / moderation tools only when policy requires it, and always audit the
        reason.
      </Notice>

      <div className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Blocks views">
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
          <form className="users-toolbar__form" onSubmit={applyFilters}>
            <SearchField
              value={searchText}
              onChange={setSearchText}
              onClear={() => setFilters((current) => ({ ...current, q: '' }))}
              placeholder="Search name, user ID, or block ID"
            />
            <label className="field field--inline">
              <span>Blocker id</span>
              <input type="text" value={blockerId} onChange={(event) => setBlockerId(event.target.value)} placeholder="Enter user ID" maxLength={64} />
            </label>
            <label className="field field--inline">
              <span>Blocked id</span>
              <input type="text" value={blockedId} onChange={(event) => setBlockedId(event.target.value)} placeholder="Enter user ID" maxLength={64} />
            </label>
            <label className="field field--inline">
              <span>Mutual only</span>
              <input type="checkbox" checked={mutualOnly} onChange={(event) => setMutualOnly(event.target.checked)} />
            </label>
            <button type="submit" className="button button--primary">
              Search
            </button>
          </form>
        )}
      </div>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.data && (view === 'overview' || view === 'analytics' || view === 'records') ? (
        <div className="stat-grid stat-grid--kpi">
          <StatCard label="Total blocks" icon={Ban} tone="warning" value={stats.data.total} />
          <StatCard
            label="New today"
            icon={ShieldAlert}
            tone="danger"
            value={stats.data.newToday}
            hint={
              stats.data.todayDelta === 0
                ? 'Same as yesterday'
                : `${stats.data.todayDelta > 0 ? '+' : ''}${formatNumber(stats.data.todayDelta)} vs yesterday`
            }
          />
          <StatCard label={`New (${days}d)`} icon={UserMinus} tone="violet" value={stats.data.newInRange} />
          <StatCard label="Unique blockers" icon={Users} tone="primary" value={stats.data.uniqueBlockers} />
          <StatCard label="Unique blocked" icon={Users} tone="teal" value={stats.data.uniqueBlocked} />
          <StatCard
            label="Mutual blocks"
            icon={Ban}
            tone="warning"
            value={stats.data.mutualBlocks}
            hint={`Velocity queue: ${formatNumber(stats.data.highVelocityBlockers)} (≥${stats.data.abuseThreshold}/24h)`}
          />
        </div>
      ) : null}

      {view === 'analytics' && (
        <section className="card">
          <h3>Block trends</h3>
          {analytics.isLoading && !analytics.data ? (
            <LoadingState />
          ) : analytics.error ? (
            <ErrorState message={analytics.error} onRetry={analytics.reload} />
          ) : analytics.data ? (
            <>
              <BlockTrendChart series={analytics.data.series} days={analytics.data.days} />
              <div className="grid-2 section-gap">
                <div>
                  <h4 className="muted">Top blockers</h4>
                  {(analytics.data.topBlockers ?? []).length === 0 ? (
                    <p className="muted">No blockers in range.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table data-table">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Blocks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.data.topBlockers.map((row) => (
                            <tr key={row.user.id}>
                              <td>
                                <UserCell user={row.user} />
                              </td>
                              <td>{formatNumber(row.count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="muted">Most blocked</h4>
                  {(analytics.data.topBlocked ?? []).length === 0 ? (
                    <p className="muted">No blocked members in range.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table data-table">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Times blocked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.data.topBlocked.map((row) => (
                            <tr key={row.user.id}>
                              <td>
                                <UserCell user={row.user} />
                              </td>
                              <td>{formatNumber(row.count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </section>
      )}

      {(view === 'overview' || view === 'records') && (
        <>
          <DataTablePanel title="Blocks" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
            <ListView
              list={list}
              emptyMessage="No blocks match these filters."
              columns={['Blocker', 'Blocked', 'Mutual', 'Reports', 'Created', '']}
              renderRow={(block) => (
                <tr key={block.id}>
                  <td>
                    <UserCell user={block.blocker} />
                  </td>
                  <td>
                    <UserCell user={block.blocked} />
                  </td>
                  <td>{block.mutual ? <span className="badge badge--warning">Mutual</span> : '—'}</td>
                  <td>{block.openReportsBetween ?? 0}</td>
                  <td>{formatDateTime(block.createdAt)}</td>
                  <td>
                    <button type="button" className="button button--secondary button--small" onClick={() => setSelectedBlockId(block.id)}>
                      Details
                    </button>
                  </td>
                </tr>
              )}
            />
          </DataTablePanel>
        </>
      )}

      {view === 'velocity' && (
        <DataTablePanel title="Block velocity queue" subtitle="Members who created many blocks in the last 24 hours (possible spam or harassment patterns).">
          {!isAdmin ? (
            <Notice>Velocity investigation requires ADMIN.</Notice>
          ) : velocity.isLoading && !velocity.data ? (
            <LoadingState />
          ) : velocity.error ? (
            <ErrorState message={velocity.error} onRetry={velocity.reload} />
          ) : velocity.data?.items?.length === 0 ? (
            <p className="muted">No members over the threshold ({velocity.data.threshold} blocks / 24h).</p>
          ) : (
            <div className="table-wrap table-wrap--data">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Blocks / 24h</th>
                    <th>Over by</th>
                    <th>Recent targets</th>
                    <th>Last block</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {velocity.data.items.map((row) => (
                    <tr key={row.user.id}>
                      <td>
                        <UserCell user={row.user} />
                      </td>
                      <td>
                        <strong>{row.blockCount}</strong>
                      </td>
                      <td>
                        <span className="badge badge--danger">+{row.overBy}</span>
                      </td>
                      <td>
                        <div className="stack-inline">
                          {row.recentBlocked.map((user) => (
                            <UserCell key={user.id} user={user} />
                          ))}
                        </div>
                      </td>
                      <td>{formatDateTime(row.lastBlockedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="button button--secondary button--small"
                          onClick={() => {
                            setInvestigateId(row.user.id);
                            setMemberId(row.user.id);
                            setView('investigate');
                          }}
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataTablePanel>
      )}

      {view === 'investigate' && (
        <>
          {!isAdmin ? (
            <Notice>Per-member block reports require ADMIN.</Notice>
          ) : (
            <>
              <form className="users-toolbar card" onSubmit={handleInvestigate}>
                <div className="users-toolbar__form">
                  <SearchField
                    value={investigateId}
                    onChange={setInvestigateId}
                    placeholder="Enter user ID"
                    maxLength={64}
                  />
                  <button type="submit" className="button button--primary">
                    Load
                  </button>
                </div>
              </form>

              {memberId ? (
                report.isLoading && !report.data ? (
                  <LoadingState />
                ) : report.error ? (
                  <ErrorState message={report.error} onRetry={report.reload} />
                ) : report.data ? (
                  <section className="card">
                    <div className="stack-inline stack-inline--between">
                      <UserCell user={report.data.user} />
                      <Link className="button button--secondary button--small" to={`/users/${report.data.user.id}`}>
                        Open user
                      </Link>
                    </div>
                    <DetailList
                      rows={[
                        ['Blocks sent', report.data.totals.blocksSent],
                        ['Blocks received', report.data.totals.blocksReceived],
                      ]}
                    />
                    <div className="grid-2 section-gap">
                      <div>
                        <h4 className="muted">Recent sent</h4>
                        {(report.data.recentSent ?? []).length === 0 ? (
                          <p className="muted">None</p>
                        ) : (
                          <div className="table-wrap">
                            <table className="table data-table">
                              <thead>
                                <tr>
                                  <th>Blocked</th>
                                  <th>When</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {report.data.recentSent.map((row) => (
                                  <tr key={row.id}>
                                    <td>
                                      <UserCell user={row.user} />
                                    </td>
                                    <td>{formatDateTime(row.createdAt)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="button button--secondary button--small"
                                        onClick={() => setSelectedBlockId(row.id)}
                                      >
                                        Details
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="muted">Recent received</h4>
                        {(report.data.recentReceived ?? []).length === 0 ? (
                          <p className="muted">None</p>
                        ) : (
                          <div className="table-wrap">
                            <table className="table data-table">
                              <thead>
                                <tr>
                                  <th>Blocker</th>
                                  <th>When</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {report.data.recentReceived.map((row) => (
                                  <tr key={row.id}>
                                    <td>
                                      <UserCell user={row.user} />
                                    </td>
                                    <td>{formatDateTime(row.createdAt)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="button button--secondary button--small"
                                        onClick={() => setSelectedBlockId(row.id)}
                                      >
                                        Details
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                ) : null
              ) : (
                <Notice>Enter a member user id to load blocks sent and received.</Notice>
              )}
            </>
          )}
        </>
      )}

      {selectedBlockId && <BlockDetailDrawer blockId={selectedBlockId} onClose={() => setSelectedBlockId(null)} />}
    </div>
  );
}
