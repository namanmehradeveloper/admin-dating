// Reporting presentation; existing API modules and operational links are retained.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, Flag, Heart, MessageSquare, ShieldCheck, Ticket, UserPlus, Users, Crown, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { getDashboard } from '../api/dashboard.api.js';
import PageHeader from '../components/PageHeader.jsx';
import ErrorState from '../components/ErrorState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatEnum, formatNumber, formatRelativeTime } from '../utils/format.js';
import DateRange, { useInsightRange } from '../components/insights/DateRange.jsx';
import TimeChart from '../components/insights/TimeChart.jsx';
import MixChart from '../components/insights/MixChart.jsx';
import CategoryChart from '../components/insights/CategoryChart.jsx';
import ReportingAvailability from '../components/insights/ReportingAvailability.jsx';
import { MetricCard, InsightsSkeleton, RefreshNotice } from '../components/insights/Primitives.jsx';
import { COLORS, count, number, datedSeries, signupSeries, subscriptionMix, rangeLabel, checkedPayload } from '../components/insights/data.js';
import '../components/insights/insights.css';

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
  const range = useInsightRange();
  const { data: result, error, isLoading, reload } = useApi(async () => ({
    payload: checkedPayload(await getDashboard({ from: range.applied.from, to: range.applied.to })),
    period: { ...range.applied },
  }), [range.key]);
  const data = result?.payload;
  const period = result?.period || range.applied;
  const label = rangeLabel(period);
  const { users = {}, moderation = {}, matches = {}, messages = {}, support = {}, subscriptions = {}, breakdowns = {}, revenue, recent, followUp, changes = {} } = data || {};
  const trends = datedSeries(data?.trends, ['signups', 'matches', 'messages'], period);
  const growth = signupSeries(data, period);
  const statusItems = (counts, colors) => Object.entries(counts || {}).map(([key, value], i) => ({ key, name: formatEnum(key), value, color: colors[key] || Object.values(COLORS)[i % 6] }));
  const queue = [
    { key: 'reports', name: 'Open reports', value: moderation.openReports, color: COLORS.pink },
    { key: 'review', name: 'Reports in review', value: moderation.inReviewReports, color: COLORS.amber },
    { key: 'verify', name: 'Pending verifications', value: moderation.pendingVerifications, color: COLORS.purple },
    { key: 'tickets', name: 'Open support tickets', value: support.openTickets, color: COLORS.teal },
  ];
  return <div className="dashboard-page insights-page">
    <PageHeader title="Platform overview" subtitle="A clear view of your community, growth, and daily activity." />
    <DateRange range={range} loading={isLoading} onRefresh={reload} todayOption />
    {!data ? (isLoading ? <InsightsSkeleton /> : <ErrorState message={error || 'No reporting data is available.'} onRetry={reload} />) : <>
      <div className="insight-period"><span><i />Showing {label}</span><span>Updated {formatRelativeTime(data.generatedAt)}</span></div>
      <RefreshNotice error={error} loading={isLoading} onRetry={reload} label={label} />
      <div className="insight-metrics">
        <MetricCard label="Total members" value={count(users.total)} scope="Current total" hint={`${number(users.newToday)} joined today · ${number(users.onlineNow)} online now`} icon={Users} to="/users" />
        <MetricCard label="New members" value={count(users.newInRange)} delta={changes.newUsers} hint="Registrations during the selected period" icon={UserPlus} color="blue" to="/users" />
        <MetricCard label="Active users" value={count(users.activeInRange ?? (period.preset === 7 ? users.activeLast7Days : undefined))} delta={changes.activeUsers} hint="Members active during the selected period" icon={Activity} color="teal" to="/users" />
        <MetricCard label="Active Plus" value={count(subscriptions.activePremium)} scope="Current total" hint="Members with active Plus access" icon={Crown} color="amber" to={isAdmin ? '/subscriptions' : undefined} />
        <MetricCard label="Matches created" value={count(matches.createdInRange)} delta={changes.matches} hint={`${number(matches.total)} total · ${number(matches.active)} active · ${number(matches.createdToday)} today`} icon={Heart} color="pink" to="/matches" />
        <MetricCard label="Messages sent" value={count(messages.sentInRange ?? (period.preset === 7 ? messages.sentLast7Days : undefined))} delta={changes.messages} hint={`${number(messages.sentToday)} today · ${number(messages.sentLast7Days)} in the last 7 days`} icon={MessageSquare} color="teal" to="/messaging" />
        <MetricCard label="Verified members" value={count(users.verified)} scope="Current total" hint={`${number(moderation.pendingVerifications)} awaiting verification`} icon={ShieldCheck} to="/verifications" />
        <MetricCard label="Open reports" value={count(moderation.openReports)} scope="Current queue" hint={`${number(moderation.inReviewReports)} in review · ${number(support.openTickets)} open tickets`} icon={Flag} color="pink" to="/reports" />
      </div>
      <div className="insight-grid insight-grid--growth">
        <TimeChart title="User growth" subtitle="New registrations each day" data={growth} series={[{ key: 'signups', label: 'New members', color: COLORS.purple }]} icon={TrendingUp} />
        <MixChart title="Subscription mix" subtitle="Current member snapshot · unaffected by dates" items={subscriptionMix(users.total, subscriptions.activePremium)} centerLabel="Members" icon={Crown} footer="Other members = total members minus active Plus. Subscription history is not supplied." />
      </div>
      <TimeChart title="Community engagement" subtitle="Matches and messages recorded each day" data={trends} series={[{ key: 'matches', label: 'Matches', color: COLORS.pink }, { key: 'messages', label: 'Messages', color: COLORS.teal }]} defaultType="line" icon={Activity} />
      <TimeChart title="Daily activity" subtitle="Compare registrations, matches, and messages" data={trends} series={[{ key: 'signups', label: 'New members', color: COLORS.purple }, { key: 'matches', label: 'Matches', color: COLORS.pink }, { key: 'messages', label: 'Messages', color: COLORS.teal }]} defaultType="bar" icon={BarChart3} />
      <div className="insight-section-heading"><div><h2>Community health</h2><p>Current account and moderation snapshots</p></div></div>
      <ActionQueue moderation={moderation} support={support} />
      <div className="insight-grid">
        <MixChart title="Account status" subtitle="Current member accounts" items={statusItems(breakdowns.accountStatus, { ACTIVE: COLORS.teal, WARNED: COLORS.amber, SUSPENDED: COLORS.pink, BANNED: COLORS.muted })} icon={Users} />
        <MixChart title="Verification status" subtitle="Current verification coverage" items={statusItems(breakdowns.verificationStatus, { VERIFIED: COLORS.purple, PENDING: COLORS.amber, REJECTED: COLORS.pink, NONE: COLORS.muted })} icon={ShieldCheck} />
        <CategoryChart title="Needs attention" subtitle="Current moderation and support queues" items={queue} icon={Flag} />
        <CategoryChart title="Open reports by reason" subtitle="Current report categories" items={statusItems(breakdowns.reportsByReason, {})} icon={PieIcon} />
      </div>
      <div className="dashboard-grid-2">
        <section className="card"><div className="card__header"><div><h2>Priority follow-ups</h2><span className="muted small">Members awaiting a review or response</span></div><Link to="/reports" className="button button--secondary button--small">Open queues</Link></div><FollowUpList items={followUp} /></section>
        <section className="card"><div className="card__header"><div><h2>Recent activity</h2><span className="muted small">The latest updates across your community</span></div>{isAdmin ? <Link to="/audit-logs" className="button button--secondary button--small">Audit logs</Link> : <Link to="/users" className="button button--secondary button--small">View users</Link>}</div><ActivityFeed users={recent?.users} reports={recent?.reports} verifications={recent?.verifications} matches={recent?.matches} tickets={recent?.tickets} /></section>
      </div>
      <ReportingAvailability revenue={revenue} isAdmin={isAdmin} />
    </>}
  </div>;
}
