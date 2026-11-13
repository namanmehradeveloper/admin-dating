// One member's subscription + recent payments (ADMIN only, read-only).

import { Link, useParams } from 'react-router-dom';
import { getSubscription } from '../api/subscriptions.api.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDateTime, formatEnum, formatMoney } from '../utils/format.js';

export default function SubscriptionDetailPage() {
  const { userId } = useParams();
  const { data, error, isLoading, reload } = useApi(() => getSubscription(userId), [userId]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { entitlement } = data;
  return (
    <div className="detail-page">
      <PageHeader title="Subscription" subtitle={userId} backTo="/subscriptions" backLabel="Subscriptions" />

      {entitlement.isDemo ? (
        <Notice tone="warning">This entitlement was activated by a DEMO payment.</Notice>
      ) : null}

      <div className="detail-summary">
        <section className="card">
          <div className="card__header">
            <h2>Entitlement</h2>
            <StatusBadge value={entitlement.lifecycleStatus || entitlement.tier} />
          </div>
          <DetailList
            rows={[
              ['Member', <UserCell key="user" user={data.user} />],
              ['Tier', <StatusBadge key="tier" value={entitlement.tier} />],
              ['Active', entitlement.isActive ? 'Yes' : 'No'],
              ['Product / plan', entitlement.productId || '—'],
              ['Provider', formatEnum(entitlement.provider)],
              ['Environment', formatEnum(entitlement.environment)],
              ['Platform', formatEnum(entitlement.platform)],
              ['Activated', formatDateTime(entitlement.activatedAt)],
              ['Expires', formatDateTime(entitlement.expiresAt)],
              ['Cancelled', formatDateTime(entitlement.cancelledAt)],
              ['Renews automatically', entitlement.willRenew ? 'Yes' : 'No'],
              ['Original transaction', entitlement.originalTransactionId || '—'],
              ['Last updated', formatDateTime(entitlement.updatedAt)],
            ]}
          />
        </section>

        <section className="card">
          <h2>Billing provider</h2>
          <DetailList
            rows={[
              ['Configured', data.storeVerification.configured ? 'Yes' : 'No'],
              ['Status', <StatusBadge key="store" value={data.storeVerification.status} />],
              ['Provider', formatEnum(data.storeVerification.provider)],
              ['Environment', formatEnum(data.storeVerification.environment)],
            ]}
          />
          <p className="muted small section-gap">Card numbers and raw payment secrets are never stored in the admin console.</p>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <h2>Recent payments</h2>
          <Link className="button button--ghost" to={`/payments?q=${encodeURIComponent(userId)}`}>
            All payments
          </Link>
        </div>
        {data.recentPayments?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Kind</th>
                  <th>Product</th>
                  <th>ID</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatMoney(payment.amountMinor, payment.currency)}</td>
                    <td>
                      <StatusBadge value={payment.status} />
                    </td>
                    <td>
                      <StatusBadge value={payment.isDemo ? 'DEMO' : 'REAL'} />
                    </td>
                    <td>{payment.productId}</td>
                    <td>
                      <Link to={`/payments/${payment.id}`}>{payment.id}</Link>
                    </td>
                    <td>{formatDateTime(payment.verifiedAt || payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No payment transactions for this member.</p>
        )}
      </section>
    </div>
  );
}
