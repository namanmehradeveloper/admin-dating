// Platform analytics: KPIs with deltas, conversion rates, mix charts and activity trends.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Percent, Sparkles, UserPlus } from 'lucide-react';
import { getAnalytics } from '../api/analytics.api.js';
import { CHART_COLORS } from '../components/charts/chartTheme.js';
import DailyActivityChart from '../components/charts/DailyActivityChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import HorizontalBarChart from '../components/charts/HorizontalBarChart.jsx';
import TrendChart from '../components/charts/TrendChart.jsx';
import SparkKpiCard from '../components/dashboard/SparkKpiCard.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatEnum, formatNumber, formatRelativeTime } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

function seriesFromTrends(trends, key) {
  return (trends ?? []).map((day) => day[key] ?? 0);
}

function formatRate(value, suffix = '%') {
  if (value === null || value === undefined) return '—';
  return `${value}${suffix}`;
}

function RateCard({ label, value, hint, to, icon: Icon, tone = 'primary' }) {
  const body = (
    <>
      <span className={`analytics-rate__icon analytics-rate__icon--${tone}`} aria-hidden>
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <span className="analytics-rate__body">
        <strong>{value}</strong>
        <span className="analytics-rate__label">{label}</span>
        {hint ? <span className="analytics-rate__hint">{hint}</span> : null}
      </span>
    </>
  );

  return to ? (
    <Link to={to} className="analytics-rate analytics-rate--link">
      {body}
    </Link>
  ) : (
    <div className="analytics-rate">{body}</div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const { data, error, isLoading, reload } = useApi(() => getAnalytics({ days }), [days]);

  const swipeMixItems = useMemo(() => {
    if (!data?.swipeMix) return [];
    return Object.entries(data.swipeMix).map(([key, value]) => ({
      key,
      name: formatEnum(key),
      value,
      color:
        key === 'LIKE' ? CHART_COLORS.pink : key === 'SUPER_LIKE' ? CHART_COLORS.amber : CHART_COLORS.teal,
    }));
  }, [data]);

  if (isLoading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const trends = data.dashboard?.trends ?? [];
  const signupSpark = seriesFromTrends(trends, 'signups');
  const matchSpark = seriesFromTrends(trends, 'matches');
  const messageSpark = seriesFromTrends(trends, 'messages');
  const swipeSpark = (data.swipeSeries ?? []).map((day) => (day.likes ?? 0) + (day.passes ?? 0) + (day.superLikes ?? 0));
  const breakdowns = data.dashboard?.breakdowns ?? {};

  return (
    <div className={`analytics-page${isLoading ? ' is-refreshing' : ''}`}>
      <PageHeader
        title="Analytics"
        subtitle={`Live aggregates · last ${days} days · updated ${formatRelativeTime(data.generatedAt)}`}
      />

      <section className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Date range">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={days === option.value}
              className={`users-chip ${days === option.value ? 'is-active' : ''}`}
              onClick={() => setDays(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="muted small analytics-toolbar-note">Compared with the previous equal period for % change.</p>
      </section>

      {error && data && (
        <p className="drawer-notice" role="status">
          Could not refresh: {error}. Showing last loaded data.
        </p>
      )}

      <div className="spark-kpi-grid">
        <SparkKpiCard
          label="Approx DAU"
          value={data.dauApprox}
          hint={`Active in last ${days}d`}
          delta={data.changes?.dau}
          to="/users"
          sparkData={signupSpark}
          sparkColor={CHART_COLORS.primary}
          tone="primary"
        />
        <SparkKpiCard
          label="New signups"
          value={data.newSignups}
          hint={`${formatNumber(data.dashboard?.users?.total ?? 0)} total members`}
          delta={data.changes?.newSignups}
          to="/users"
          sparkData={signupSpark}
          sparkColor={CHART_COLORS.teal}
          tone="teal"
        />
        <SparkKpiCard
          label="Swipes"
          value={data.swipeTotals}
          hint={`${formatNumber(data.rates?.likesInRange ?? 0)} likes / super likes`}
          delta={data.changes?.swipes}
          to="/swipes"
          sparkData={swipeSpark.length ? swipeSpark : matchSpark}
          sparkColor={CHART_COLORS.amber}
          tone="warning"
        />
        <SparkKpiCard
          label="Matches"
          value={data.matchTotals}
          hint={`${formatNumber(data.dashboard?.matches?.active ?? 0)} active now`}
          delta={data.changes?.matches}
          to="/matches"
          sparkData={matchSpark}
          sparkColor={CHART_COLORS.pink}
          tone="danger"
        />
        <SparkKpiCard
          label="Messages"
          value={data.messageTotals}
          hint={`${formatNumber(data.dashboard?.messages?.sentToday ?? 0)} today`}
          delta={data.changes?.messages}
          to="/messaging"
          sparkData={messageSpark}
          sparkColor={CHART_COLORS.teal}
          tone="teal"
        />
        <SparkKpiCard
          label="Active Plus"
          value={data.premiumActive}
          hint="Current entitlements"
          to="/subscriptions"
          sparkData={matchSpark}
          sparkColor={CHART_COLORS.green}
          tone="success"
        />
        <SparkKpiCard
          label="Open reports"
          value={data.openReports}
          hint={`${formatNumber(data.dashboard?.moderation?.pendingVerifications ?? 0)} pending verifications`}
          to="/reports"
          sparkData={messageSpark}
          sparkColor={CHART_COLORS.red}
          tone="danger"
        />
        <SparkKpiCard
          label="Open tickets"
          value={data.openTickets}
          hint="Support queue"
          to="/support"
          sparkData={signupSpark}
          sparkColor={CHART_COLORS.amber}
          tone="warning"
        />
      </div>

      <section className="analytics-rate-grid" aria-label="Conversion rates">
        <RateCard
          label="Swipe → match"
          value={formatRate(data.rates?.swipeToMatch)}
          hint="Matches / all swipes"
          icon={Percent}
          tone="primary"
          to="/swipes"
        />
        <RateCard
          label="Like → match"
          value={formatRate(data.rates?.likeToMatch)}
          hint={`${formatNumber(data.rates?.matchedLikes ?? 0)} matched likes`}
          icon={Sparkles}
          tone="warning"
          to="/swipes"
        />
        <RateCard
          label="Messages / match"
          value={formatRate(data.rates?.messagesPerMatch, 'x')}
          hint="Chat intensity in range"
          icon={MessageSquare}
          tone="teal"
          to="/messaging"
        />
        <RateCard
          label="New / DAU"
          value={
            data.dauApprox > 0 ? formatRate(Math.round((data.newSignups / data.dauApprox) * 1000) / 10) : '—'
          }
          hint="Signup share of active users"
          icon={UserPlus}
          tone="success"
          to="/users"
        />
      </section>

      <div className="dashboard-grid-3">
        <DonutChart title="Account status" counts={breakdowns.accountStatus ?? {}} centerLabel="Members" />
        <DonutChart title="Verification status" counts={breakdowns.verificationStatus ?? {}} centerLabel="Members" />
        <HorizontalBarChart title="Swipe mix" items={swipeMixItems} emptyText="No swipes in this range" />
      </div>

      {trends.length ? <DailyActivityChart data={trends} days={data.days} /> : null}

      {trends.length ? (
        <TrendChart data={trends} days={data.days} />
      ) : (
        <section className="card">
          <p className="muted">No trend data for this range yet.</p>
        </section>
      )}

      {(data.recommendationPerformance?.length ?? 0) > 0 && (
        <section className="card">
          <div className="card__header">
            <div>
              <h2>Like conversion by action</h2>
              <span className="muted small">How often likes and super likes become matches</span>
            </div>
            <Link to="/swipes" className="button button--secondary button--small">
              Open swipes
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table data-table analytics-conv-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Likes</th>
                  <th>Matches</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.recommendationPerformance.map((row) => (
                  <tr key={row.action}>
                    <td>
                      <span className="analytics-action">
                        {row.action === 'SUPER_LIKE' ? <Sparkles size={14} aria-hidden /> : <Heart size={14} aria-hidden />}
                        {formatEnum(row.action)}
                      </span>
                    </td>
                    <td>{formatNumber(row.likes)}</td>
                    <td>{formatNumber(row.matches)}</td>
                    <td>
                      <strong>{formatRate(row.conversion)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
