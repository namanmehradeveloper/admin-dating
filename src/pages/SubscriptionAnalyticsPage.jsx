// Subscription growth, conversion, renewals and real revenue (ADMIN only).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubscriptionAnalytics } from '../api/subscriptions.api.js';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatMoney, formatNumber } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

export default function SubscriptionAnalyticsPage() {
  const [days, setDays] = useState(30);
  const analytics = useApi(() => getSubscriptionAnalytics({ days }), [days]);

  if (analytics.isLoading && !analytics.data) return <LoadingState />;
  if (analytics.error) return <ErrorState message={analytics.error} onRetry={analytics.reload} />;

  const data = analytics.data;

  return (
    <div className="admin-page">
      <PageHeader
        title="Subscription analytics"
        subtitle="Growth and monetization from the live payment ledger. Demo volume is shown separately and never counted as revenue."
        backTo="/subscriptions"
        backLabel="Subscriptions"
        actions={<SegmentedControl label="Range" options={RANGES} value={days} onChange={setDays} />}
      />

      <Notice tone="info">
        Real revenue excludes every `demo` provider/environment payment. Demo activations remain visible for QA.
      </Notice>

      <div className="stat-grid">
        <StatCard label="Active Plus" value={data.totals.activePlus} hint={`${data.totals.plusPenetration}% of members`} />
        <StatCard label="Activations" value={data.totals.activations} hint={`Previous period ${formatNumber(data.totals.activationsPrevious)}`} />
        <StatCard label="Conversion" value={`${data.totals.conversionRate}%`} hint={`${formatNumber(data.totals.checkouts)} checkouts`} />
        <StatCard
          label="Renewals"
          value={data.renewals.total}
          hint={`Real ${formatNumber(data.renewals.real)} · Demo ${formatNumber(data.renewals.demo)}`}
        />
        <StatCard
          label="Real revenue"
          value={formatMoney(data.revenue.amountMinor, data.revenue.currency)}
          hint={`${formatNumber(data.revenue.paymentCount)} real payments`}
        />
        <StatCard
          label="Demo volume"
          value={formatMoney(data.revenue.demoVolumeMinor, data.revenue.currency)}
          hint={`${formatNumber(data.revenue.demoPaymentCount)} simulated · not revenue`}
        />
      </div>

      <section className="card">
        <div className="card__header">
          <h2>Activation growth</h2>
          <Link className="button button--ghost" to="/payments">
            Open ledger
          </Link>
        </div>
        {data.growth?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Real</th>
                  <th>Demo</th>
                </tr>
              </thead>
              <tbody>
                {data.growth.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{formatNumber(row.activations)}</td>
                    <td>{formatNumber(row.realActivations)}</td>
                    <td>{formatNumber(row.demoActivations)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No successful activations in this range yet.</p>
        )}
      </section>
    </div>
  );
}
