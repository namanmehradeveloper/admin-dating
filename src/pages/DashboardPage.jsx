// Live admin overview — action queue, KPI deltas, charts, activity feed.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Flag,
  Heart,
  MessageSquare,
  ShieldCheck,
  Ticket,
  UserPlus,
} from 'lucide-react';
import { getDashboard } from '../api/dashboard.api.js';
import { CHART_COLORS, formatDay } from '../components/charts/chartTheme.js';
import DailyActivityChart from '../components/charts/DailyActivityChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import HorizontalBarChart from '../components/charts/HorizontalBarChart.jsx';
import SparkKpiCard from '../components/dashboard/SparkKpiCard.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatEnum, formatNumber, formatRelativeTime } from '../utils/format.js';

const RANGES = [
  { value: 1, label: 'Today' },
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

function localYmd(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rangeFromPreset(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: localYmd(from), to: localYmd(to), preset: days };
}

function seriesFromTrends(trends, key) {
  return (trends ?? []).map((day) => day[key] ?? 0);
}

function SummaryTrendCard({ title, stats, dataKey, color, trends, to }) {
  return (
    <section className="card summary-card">
      <div className="card__header">
        <div>
          <h2>{title}</h2>
          <span className="muted small">Last {trends?.length ?? 0} days</span>
        </div>
        {to && (
          <Link to={to} className="button button--secondary button--small">
            Open
          </Link>
        )}
      </div>
      <div className="summary-card__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="summary-card__stat">
            <span>{stat.label}</span>
            <strong>{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</strong>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={trends} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`summary-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDay} hide />
          <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="chart-tooltip">
                  <span className="chart-tooltip__label">{formatDay(label)}</span>
                  <strong>
                    {formatNumber(payload[0].value)} {title.toLowerCase()}
                  </strong>
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#summary-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

function ActionQueue({ moderation, support }) {
  const items = [
    {
      key: 'verifications',
      label: 'Pending verifications',
      value: moderation.pendingVerifications,
      to: '/verifications',
      icon: ShieldCheck,
      tone: 'warning',
    },
    {
      key: 'reports',
      label: 'Open reports',
      value: moderation.openReports,
      to: '/reports',
      icon: Flag,
      tone: 'danger',
    },
    {
      key: 'review',
      label: 'Reports in review',
      value: moderation.inReviewReports,
      to: '/reports',
      icon: Flag,
      tone: 'warning',
    },
    {
      key: 'tickets',
      label: 'Open tickets',
      value: support.openTickets,
      to: '/support',
      icon: Ticket,
      tone: 'teal',
    },
  ];

  return (
    <section className="action-queue" aria-label="Needs attention">
      {items.map((item) => {
        const Icon = item.icon;
        const isClear = !item.value;
        return (
          <Link
            key={item.key}
            to={item.to}
            className={`action-queue__card action-queue__card--${item.tone}${isClear ? ' is-clear' : ''}`}
          >
            <span className="action-queue__icon" aria-hidden>
              <Icon size={16} strokeWidth={2.2} />
            </span>
            <span className="action-queue__body">
              <strong>{formatNumber(item.value)}</strong>
              <span>{item.label}</span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function ActivityFeed({ users, reports, verifications, matches, tickets }) {
  const items = useMemo(() => {
    const rows = [
      ...(users ?? []).map((user) => ({
        id: `user-${user.id}`,
        kind: 'user',
        icon: UserPlus,
        title: `${user.displayName || 'Member'} joined`,
        detail: user.email || user.id,
        at: user.createdAt,
        to: `/users/${user.id}`,
      })),
      ...(reports ?? []).map((report) => ({
        id: `report-${report.id}`,
        kind: 'report',
        icon: Flag,
        title: `Report: ${formatEnum(report.reason)}`,
        detail: `${report.reportedUser?.displayName ?? 'Member'} · ${formatEnum(report.status)}`,
        at: report.createdAt,
        to: `/reports/${report.id}`,
      })),
      ...(verifications ?? []).map((request) => ({
        id: `verification-${request.id}`,
        kind: 'verification',
        icon: ShieldCheck,
        title: `Verification ${formatEnum(request.status).toLowerCase()}`,
        detail: request.user?.displayName || request.user?.id || 'Member',
        at: request.submittedAt,
        to: `/verifications/${request.id}`,
      })),
      ...(matches ?? []).map((match) => ({
        id: `match-${match.id}`,
        kind: 'match',
        icon: Heart,
        title: 'New match',
        detail: formatEnum(match.status),
        at: match.createdAt,
        to: '/matches',
      })),
      ...(tickets ?? []).map((ticket) => ({
        id: `ticket-${ticket.id}`,
        kind: 'ticket',
        icon: Ticket,
        title: ticket.subject || 'Support ticket',
        detail: `${ticket.user?.displayName ?? 'Member'} · ${formatEnum(ticket.status)}`,
        at: ticket.updatedAt || ticket.createdAt,
        to: `/support/${ticket.id}`,
      })),
    ];
    return rows.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 14);
  }, [users, reports, verifications, matches, tickets]);

  if (!items.length) return <p className="muted">No recent activity yet.</p>;

  return (
    <ul className="activity-feed">
      {items.map((item) => {
        const Icon = item.icon || MessageSquare;
        return (
          <li key={item.id} className="activity-feed__item">
            <span className={`activity-feed__dot activity-feed__dot--${item.kind}`} aria-hidden>
              <Icon size={13} strokeWidth={2.3} />
            </span>
            <div className="activity-feed__text">
              <strong>
                <Link to={item.to}>{item.title}</Link>
              </strong>
              <span>{item.detail}</span>
            </div>
            <time className="activity-feed__time" dateTime={item.at}>
              {formatRelativeTime(item.at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

function followUpPath(item) {
  if (item.kind === 'report') return `/reports/${item.targetId}`;
  if (item.kind === 'verification') return `/verifications/${item.targetId}`;
  if (item.kind === 'ticket') return `/support/${item.targetId}`;
  if (item.user?.id) return `/users/${item.user.id}`;
  return '/users';
}

function followUpSubtitle(item) {
  if (item.kind === 'report') return `Report: ${formatEnum(item.reason)}`;
  return item.label || formatEnum(item.reason);
}

function FollowUpList({ items }) {
  if (!items?.length) return <p className="muted">Queue is clear. No members need follow-up.</p>;
  return (
    <ol className="ranked-list">
      {items.map((item, index) => (
        <li key={item.id}>
          <Link to={followUpPath(item)} className="ranked-list__item ranked-list__item--link">
            <span className="ranked-list__rank">{index + 1}</span>
            <UserCell user={item.user} link={false} subtitle={followUpSubtitle(item)} />
            <div className="ranked-list__meta">
              <StatusBadge value={item.badge || item.reason} />
              <time dateTime={item.at}>{formatRelativeTime(item.at)}</time>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const initialRange = rangeFromPreset(7);
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [preset, setPreset] = useState(7);
  const [applied, setApplied] = useState({ from: initialRange.from, to: initialRange.to });

  const queryKey = `${applied.from}:${applied.to}`;
  const { data, error, isLoading, reload } = useApi(
    () => getDashboard({ from: applied.from, to: applied.to }),
    [queryKey],
  );

  const todayYmd = localYmd();
  const rangeInvalid = !fromDate || !toDate || fromDate > toDate;

  function applyPreset(days) {
    const next = rangeFromPreset(days);
    setPreset(days);
    setFromDate(next.from);
    setToDate(next.to);
    setApplied({ from: next.from, to: next.to });
  }

  function applyCustomRange(event) {
    event.preventDefault();
    if (rangeInvalid) return;
    setPreset(null);
    setApplied({ from: fromDate, to: toDate });
  }

  if (isLoading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const { users, moderation, matches, messages, support, subscriptions, breakdowns, revenue, recent, followUp, trends, changes } =
    data;
  const signupSpark = (data.signupsByDay ?? []).map((day) => day.count);
  const matchSpark = seriesFromTrends(trends, 'matches');
  const messageSpark = seriesFromTrends(trends, 'messages');
  const signupTrendSpark = seriesFromTrends(trends, 'signups');
  const rangeFrom = data.from ?? applied.from;
  const rangeTo = data.to ?? applied.to;
  const rangeDays = data.range ?? trends?.length ?? 0;
  const rangeLabel = rangeFrom === rangeTo ? rangeFrom : `${rangeFrom} → ${rangeTo}`;
  const rangeSpan = rangeDays === 1 ? 'today' : `${rangeDays}d`;

  const moderationQueue = [
    { key: 'openReports', name: 'Open reports', value: moderation.openReports, color: CHART_COLORS.red },
    { key: 'inReviewReports', name: 'Reports in review', value: moderation.inReviewReports, color: CHART_COLORS.amber },
    { key: 'pendingVerifications', name: 'Pending verifications', value: moderation.pendingVerifications, color: CHART_COLORS.primary },
    { key: 'openTickets', name: 'Open support tickets', value: support.openTickets, color: CHART_COLORS.teal },
  ];
  const reportReasons = Object.entries(breakdowns.reportsByReason).map(([key, value]) => ({ key, value }));
  const likeMatchRate =
    matches.createdInRange > 0 && users.newInRange > 0
      ? `${Math.round((matches.createdInRange / Math.max(users.newInRange, 1)) * 10) / 10}x`
      : '—';

  return (
    <div className={`dashboard-page${isLoading ? ' is-refreshing' : ''}`}>
      <PageHeader
        title="Dashboard"
        subtitle={`Live platform overview · ${rangeLabel} (${rangeSpan}) · updated ${formatRelativeTime(data.generatedAt)}`}
      />

      <section className="users-toolbar card dashboard-date-bar">
        <div className="users-toolbar__chips" role="tablist" aria-label="Quick date range">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={preset === option.value}
              className={`users-chip ${preset === option.value ? 'is-active' : ''}`}
              onClick={() => applyPreset(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <form className="users-toolbar__form dashboard-date-bar__form" onSubmit={applyCustomRange}>
          <label className="field field--inline">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || todayYmd}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPreset(null);
              }}
            />
          </label>
          <label className="field field--inline">
            <span>To</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              max={todayYmd}
              onChange={(event) => {
                setToDate(event.target.value);
                setPreset(null);
              }}
            />
          </label>
          <button type="submit" className="button button--primary" disabled={rangeInvalid || isLoading}>
            Apply
          </button>
          {rangeInvalid && <span className="form-error">Choose a valid from → to range.</span>}
        </form>
      </section>

      {error && data && (
        <p className="drawer-notice" role="status">
          Could not refresh: {error}. Showing last loaded data.
        </p>
      )}

      <ActionQueue moderation={moderation} support={support} />

      <div className="spark-kpi-grid spark-kpi-grid--hero">
        <SparkKpiCard
          size="hero"
          label="Users"
          value={users.total}
          hint={`${formatNumber(users.newToday)} today · ${formatNumber(users.onlineNow ?? 0)} online`}
          to="/users"
          sparkData={signupSpark.length ? signupSpark : signupTrendSpark}
          sparkColor={CHART_COLORS.primary}
          tone="primary"
        />
        <SparkKpiCard
          size="hero"
          label="Matches"
          value={matches.total}
          hint={`${formatNumber(matches.active)} active · ${formatNumber(matches.createdInRange)} in range`}
          delta={changes?.matches}
          to="/matches"
          sparkData={matchSpark}
          sparkColor={CHART_COLORS.pink}
          tone="danger"
        />
        <SparkKpiCard
          size="hero"
          label="Messages"
          value={messages.sentInRange ?? messages.sentLast7Days}
          hint={`${formatNumber(messages.sentToday)} today`}
          delta={changes?.messages}
          to="/messaging"
          sparkData={messageSpark}
          sparkColor={CHART_COLORS.teal}
          tone="teal"
        />
        <SparkKpiCard
          size="hero"
          label="Open reports"
          value={moderation.openReports}
          hint={`${formatNumber(moderation.inReviewReports)} in review · ${formatNumber(support.openTickets)} tickets`}
          to="/reports"
          sparkData={messageSpark}
          sparkColor={CHART_COLORS.red}
          tone="danger"
        />
      </div>

      <div className="dashboard-grid-2">
        <section className="card">
          <div className="card__header">
            <div>
              <h2>Top follow-up</h2>
              <span className="muted small">Members waiting on staff: reports, selfies, photos, tickets</span>
            </div>
            <Link to="/reports" className="button button--secondary button--small">
              Open queues
            </Link>
          </div>
          <FollowUpList items={followUp} />
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2>Log activities</h2>
              <span className="muted small">Joins, reports, verifications, matches, tickets</span>
            </div>
            {isAdmin ? (
              <Link to="/audit-logs" className="button button--secondary button--small">
                Audit logs
              </Link>
            ) : (
              <Link to="/users" className="button button--secondary button--small">
                View users
              </Link>
            )}
          </div>
          <ActivityFeed
            users={recent?.users}
            reports={recent?.reports}
            verifications={recent?.verifications}
            matches={recent?.matches}
            tickets={recent?.tickets}
          />
        </section>
      </div>

      <div className="spark-kpi-grid spark-kpi-grid--secondary" aria-label="More stats">
        <SparkKpiCard
          label="Active users"
          value={users.activeInRange ?? users.activeLast7Days}
          hint={`Active in selected range (${rangeDays}d)`}
          delta={changes?.activeUsers}
          to="/users"
          sparkData={signupTrendSpark}
          sparkColor={CHART_COLORS.green}
          tone="success"
        />
        <SparkKpiCard
          label="New registrations"
          value={users.newInRange ?? users.newLast7Days}
          hint={`${formatNumber(users.newToday)} today`}
          delta={changes?.newUsers}
          to="/users"
          sparkData={signupTrendSpark}
          sparkColor={CHART_COLORS.teal}
          tone="teal"
        />
        <SparkKpiCard
          label="Verified members"
          value={users.verified}
          hint={`${formatNumber(moderation.pendingVerifications)} pending review`}
          to="/verifications"
          sparkData={signupSpark}
          sparkColor={CHART_COLORS.primary}
          tone="primary"
        />
        <SparkKpiCard
          label="Plus subscribers"
          value={subscriptions.activePremium}
          hint={
            revenue?.billingConfigured
              ? `${revenue.currency ?? 'INR'} billing ready`
              : 'Billing ledger not configured'
          }
          to={isAdmin ? '/subscriptions' : undefined}
          sparkData={matchSpark}
          sparkColor={CHART_COLORS.amber}
          tone="warning"
        />
      </div>

      <div className="dashboard-grid-3">
        <DonutChart title="Account status" counts={breakdowns.accountStatus} centerLabel="Members" />
        <DonutChart title="Verification status" counts={breakdowns.verificationStatus} centerLabel="Members" />
        <HorizontalBarChart title="Needs attention" items={moderationQueue} emptyText="Queue is clear" />
        <HorizontalBarChart title="Open reports by reason" items={reportReasons} color={CHART_COLORS.red} emptyText="No open reports" />
      </div>

      <DailyActivityChart data={trends} days={data.range} />

      <div className="dashboard-summary-grid">
        <SummaryTrendCard
          title="Users"
          dataKey="signups"
          color={CHART_COLORS.primary}
          trends={trends}
          to="/users"
          stats={[
            { label: 'Total', value: users.total },
            { label: 'Today', value: users.newToday },
            { label: 'New in range', value: users.newInRange },
            { label: 'Active', value: users.activeInRange },
          ]}
        />
        <SummaryTrendCard
          title="Matches"
          dataKey="matches"
          color={CHART_COLORS.pink}
          trends={trends}
          to="/matches"
          stats={[
            { label: 'Total', value: matches.total },
            { label: 'Active', value: matches.active },
            { label: 'Today', value: matches.createdToday },
            { label: 'In range', value: matches.createdInRange },
          ]}
        />
        <SummaryTrendCard
          title="Messages"
          dataKey="messages"
          color={CHART_COLORS.teal}
          trends={trends}
          to="/messaging"
          stats={[
            { label: 'Today', value: messages.sentToday },
            { label: '7d', value: messages.sentLast7Days },
            { label: 'In range', value: messages.sentInRange },
            { label: 'Match intensity', value: likeMatchRate },
          ]}
        />
      </div>

      {revenue && !revenue.billingConfigured && (
        <p className="muted small">
          {revenue.note} Plus subscriber count is shown above until a payment ledger is available.
        </p>
      )}
    </div>
  );
}
