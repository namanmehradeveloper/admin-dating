// Reporting-only views over existing analytics and dashboard endpoints.
import { Activity, BarChart3, Crown, Flag, Heart, MessageSquare, Percent, ShieldCheck, Sparkles, Ticket, TrendingUp, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../api/analytics.api.js';
import { getDashboard } from '../api/dashboard.api.js';
import ErrorState from '../components/ErrorState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatEnum, formatRelativeTime } from '../utils/format.js';
import DateRange, { useInsightRange } from '../components/insights/DateRange.jsx';
import TimeChart from '../components/insights/TimeChart.jsx';
import MixChart from '../components/insights/MixChart.jsx';
import ConversionFunnel from '../components/insights/ConversionFunnel.jsx';
import ReportingAvailability from '../components/insights/ReportingAvailability.jsx';
import { ChartCard, ChartState, InsightsSkeleton, MetricCard, RefreshNotice } from '../components/insights/Primitives.jsx';
import { COLORS, analyticsRequest, checkedPayload, count, finite, number, datedSeries, signupSeries, subscriptionMix, rangeLabel } from '../components/insights/data.js';
import '../components/insights/insights.css';

const rate = (value, suffix = '%') => finite(value) === null ? '—' : `${number(value)}${suffix}`;
function RateCard({ label, value, hint, to, icon: Icon, tone = 'primary' }) {
  return <Link to={to} className="analytics-rate analytics-rate--link"><span className={`analytics-rate__icon analytics-rate__icon--${tone}`}><Icon size={18} aria-hidden /></span><span className="analytics-rate__body"><strong>{value}</strong><span className="analytics-rate__label">{label}</span><span className="analytics-rate__hint">{hint}</span></span></Link>;
}
export default function AnalyticsPage() {
  const { isAdmin } = useAuth();
  const range = useInsightRange();
  const { data: result, error, isLoading, reload } = useApi(async () => {
    const request = analyticsRequest(range.applied);
    const payload = checkedPayload(await (request.kind === 'analytics' ? getAnalytics(request.params) : getDashboard(request.params)));
    return { payload, period: { ...range.applied }, custom: request.kind === 'dashboard' };
  }, [range.key]);
  const data = result?.payload;
  const custom = result?.custom || false;
  const period = result?.period || range.applied;
  const label = rangeLabel(period);
  const dashboard = custom ? data || {} : data?.dashboard || {};
  const users = dashboard.users || {}, matches = dashboard.matches || {}, messages = dashboard.messages || {};
  const breakdowns = dashboard.breakdowns || {};
  const activeUsers = custom ? users.activeInRange : data?.dauApprox;
  const newMembers = custom ? users.newInRange : data?.newSignups;
  const plus = custom ? dashboard.subscriptions?.activePremium : data?.premiumActive;
  const trends = datedSeries(dashboard.trends, ['signups', 'matches', 'messages'], period);
  const swipes = datedSeries((Array.isArray(data?.swipeSeries) ? data.swipeSeries : []).map(row => ({ ...row, date: row.date ?? row.day })), ['likes', 'passes', 'superLikes'], period);
  const rates = !custom ? data?.rates || {} : {};
  const performance = !custom && Array.isArray(data?.recommendationPerformance) ? data.recommendationPerformance : [];
  const mix = (counts, colors = {}) => Object.entries(counts || {}).map(([key, value], index) => ({ key, name: formatEnum(key), value, color: colors[key] || Object.values(COLORS)[index % 6] }));
  return <div className="analytics-page insights-page">
    <PageHeader title="Analytics & insights" subtitle="Understand how your community grows, connects, and engages." />
    <DateRange range={range} loading={isLoading} onRefresh={reload} />
    {!data ? (isLoading ? <InsightsSkeleton /> : <ErrorState message={error || 'No reporting data is available.'} onRetry={reload} />) : <>
      <div className="insight-period"><span><i />Showing {label}</span><span>Updated {formatRelativeTime(data.generatedAt)}</span></div>
      <RefreshNotice error={error} loading={isLoading} onRetry={reload} label={label} />
      {custom && <div className="insight-notice" role="status"><span>Custom dates apply to registrations, active-user totals, matches, and messages. Swipe volume and conversion are available for 7, 30, and 90 days. Current snapshots remain unchanged.</span></div>}
      <div className="insight-metrics">
        <MetricCard label={custom ? 'Active users' : 'Active users (approx.)'} value={count(activeUsers)} hint="Members active in the selected period" delta={!custom ? data.changes?.dau : dashboard.changes?.activeUsers} icon={Activity} color="teal" to="/users" />
        <MetricCard label="New members" value={count(newMembers)} hint={`${number(users.total)} members in total`} delta={!custom ? data.changes?.newSignups : dashboard.changes?.newUsers} icon={UserPlus} to="/users" />
        <MetricCard label="Swipes" value={custom ? null : count(data.swipeTotals)} hint={custom ? 'Choose a 7-, 30-, or 90-day preset' : `${number(rates.likesInRange)} likes and super likes`} delta={!custom ? data.changes?.swipes : undefined} icon={Sparkles} color="amber" to="/swipes" />
        <MetricCard label="Matches" value={count(custom ? matches.createdInRange : data.matchTotals)} hint={`${number(matches.active)} active matches now`} delta={!custom ? data.changes?.matches : dashboard.changes?.matches} icon={Heart} color="pink" to="/matches" />
        <MetricCard label="Messages" value={count(custom ? messages.sentInRange : data.messageTotals)} hint={`${number(messages.sentToday)} messages today`} delta={!custom ? data.changes?.messages : dashboard.changes?.messages} icon={MessageSquare} color="teal" to="/messaging" />
        <MetricCard label="Active Plus" value={count(plus)} hint="Members with active Plus access" scope="Current total" icon={Crown} color="amber" to={isAdmin ? '/subscriptions' : undefined} />
        <MetricCard label="Open reports" value={count(custom ? dashboard.moderation?.openReports : data.openReports)} hint={`${number(dashboard.moderation?.pendingVerifications)} pending verifications`} scope="Current queue" icon={Flag} color="pink" to="/reports" />
        <MetricCard label="Open tickets" value={count(custom ? dashboard.support?.openTickets : data.openTickets)} hint="Support requests awaiting resolution" scope="Current queue" icon={Ticket} color="blue" to="/support" />
      </div>
      <div className="insight-grid insight-grid--growth">
        <TimeChart title="User growth" subtitle="New members joining each day" data={signupSeries(dashboard, period)} series={[{ key: 'signups', label: 'New members', color: COLORS.purple }]} icon={TrendingUp} />
        <MixChart title="Subscription mix" subtitle="Current member snapshot · unaffected by dates" items={subscriptionMix(users.total, plus)} centerLabel="Members" icon={Crown} footer="Other members = total members minus active Plus. Subscription history is not supplied." />
      </div>
      <TimeChart title="Engagement over time" subtitle="Daily matches and messages · toggle a legend to compare" data={trends} series={[{ key: 'matches', label: 'Matches', color: COLORS.pink }, { key: 'messages', label: 'Messages', color: COLORS.teal }]} defaultType="line" icon={Activity} />
      <div className="insight-section-heading"><div><h2>Discovery & conversion</h2><p>{custom ? 'Select a preset for swipe and conversion reporting' : 'Rates use the selected period; changes compare the previous equal period'}</p></div></div>
      <section className="analytics-rate-grid" aria-label="Conversion rates">
        <RateCard label="Swipe → match" value={rate(rates.swipeToMatch)} hint="Matches divided by all swipes" icon={Percent} to="/swipes" />
        <RateCard label="Like → match" value={rate(rates.likeToMatch)} hint={`${number(rates.matchedLikes)} matched likes`} icon={Sparkles} tone="warning" to="/swipes" />
        <RateCard label="Messages / match" value={rate(rates.messagesPerMatch, '×')} hint="Message intensity in the period" icon={MessageSquare} tone="teal" to="/messaging" />
        <RateCard label="New / active users" value={count(activeUsers) > 0 && count(newMembers) !== null ? rate(Math.round((newMembers / activeUsers) * 1000) / 10) : '—'} hint="Registrations divided by active users" icon={UserPlus} tone="success" to="/users" />
      </section>
      <div className="insight-grid">
        <ConversionFunnel performance={performance} custom={custom} />
        <MixChart title="Swipe mix" subtitle="Distribution of discovery actions in the period" items={custom ? [] : mix(data.swipeMix, { LIKE: COLORS.pink, SUPER_LIKE: COLORS.purple, PASS: COLORS.muted })} icon={Sparkles} footer={custom ? 'Swipe breakdowns are available for preset ranges.' : 'Select a legend item to highlight its share.'} />
      </div>
      {custom ? <ChartCard title="Daily swipes" subtitle="Likes, passes, and super likes" icon={BarChart3}><ChartState title="Choose a preset to see swipes" message="Daily swipe reporting is available for 7, 30, and 90 days." /></ChartCard> : <TimeChart title="Daily swipes" subtitle="Likes, passes, and super likes recorded each day" data={swipes} series={[{ key: 'likes', label: 'Likes', color: COLORS.pink }, { key: 'passes', label: 'Passes', color: COLORS.muted }, { key: 'superLikes', label: 'Super likes', color: COLORS.purple }]} defaultType="bar" icon={BarChart3} />}
      <TimeChart title="Daily activity" subtitle="Registrations, matches, and messages in the selected period" data={trends} series={[{ key: 'signups', label: 'New members', color: COLORS.purple }, { key: 'matches', label: 'Matches', color: COLORS.pink }, { key: 'messages', label: 'Messages', color: COLORS.teal }]} defaultType="bar" icon={BarChart3} />
      <div className="insight-grid">
        <MixChart title="Account status" subtitle="Current member accounts · unaffected by dates" items={mix(breakdowns.accountStatus, { ACTIVE: COLORS.teal, WARNED: COLORS.amber, SUSPENDED: COLORS.pink, BANNED: COLORS.muted })} icon={Users} />
        <MixChart title="Verification status" subtitle="Current verification coverage · unaffected by dates" items={mix(breakdowns.verificationStatus, { VERIFIED: COLORS.purple, PENDING: COLORS.amber, REJECTED: COLORS.pink, NONE: COLORS.muted })} icon={ShieldCheck} />
      </div>
      <ChartCard title="Like conversion by action" subtitle="How often likes and super likes become matches" icon={Percent} actions={<Link className="insight-text-link" to="/swipes">Open swipes</Link>}>
        {!performance.length ? <ChartState message={custom ? 'Choose a preset to view conversion by action.' : 'No conversion records were returned for this period.'} /> : <div className="table-wrap" tabIndex={0} role="region" aria-label="Conversion by action"><table className="table data-table analytics-conv-table"><thead><tr><th scope="col">Action</th><th scope="col">Likes</th><th scope="col">Matches</th><th scope="col">Conversion</th></tr></thead><tbody>{performance.map(row => <tr key={row.action}><th scope="row">{formatEnum(row.action)}</th><td>{number(row.likes)}</td><td>{number(row.matches)}</td><td><strong>{rate(row.conversion)}</strong></td></tr>)}</tbody></table></div>}
      </ChartCard>
      <ReportingAvailability revenue={dashboard.revenue} isAdmin={isAdmin} />
    </>}
  </div>;
}
