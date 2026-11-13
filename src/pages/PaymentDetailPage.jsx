// One payment transaction (ADMIN only).

import { Link, useParams } from 'react-router-dom';
import { getPayment } from '../api/payments.api.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDateTime, formatEnum, formatMoney } from '../utils/format.js';

export default function PaymentDetailPage() {
  const { paymentId } = useParams();
  const { data, error, isLoading, reload } = useApi(() => getPayment(paymentId), [paymentId]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="detail-page">
      <PageHeader title="Payment" subtitle={paymentId} backTo="/payments" backLabel="Payments" />

      {data.isDemo ? (
        <Notice tone="warning">DEMO transaction — simulated only. It must never be counted as real revenue.</Notice>
      ) : (
        <Notice tone="info">Real provider payment. Included in revenue when status is Succeeded.</Notice>
      )}

      <div className="detail-summary">
        <section className="card">
          <div className="card__header">
            <h2>Transaction</h2>
            <StatusBadge value={data.status} />
          </div>
          <DetailList
            rows={[
              ['Member', <UserCell key="user" user={data.user} />],
              ['Amount', formatMoney(data.amountMinor, data.currency)],
              ['Kind', <StatusBadge key="kind" value={data.isDemo ? 'DEMO' : 'REAL'} />],
              ['Provider', formatEnum(data.provider)],
              ['Environment', formatEnum(data.environment)],
              ['Product', data.productId],
              ['Platform', formatEnum(data.platform)],
              ['Checkout ID', data.checkoutId],
              ['Provider ref', data.providerRef || '—'],
              ['Original txn', data.originalTransactionId || '—'],
              ['Failure', data.failureReason || '—'],
              ['Created', formatDateTime(data.createdAt)],
              ['Verified', formatDateTime(data.verifiedAt)],
            ]}
          />
          <div className="button-row section-gap">
            <Link className="button button--ghost" to={`/subscriptions/${data.userId}`}>
              View subscription
            </Link>
          </div>
        </section>

        <section className="card">
          <h2>Lifecycle</h2>
          {data.lifecycleEvents?.length ? (
            <ul className="timeline-list">
              {data.lifecycleEvents.map((event, index) => (
                <li key={`${event.type}-${index}`}>
                  <strong>{formatEnum(event.type)}</strong>
                  <span className="muted small">{formatDateTime(event.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No lifecycle events recorded.</p>
          )}
        </section>
      </div>
    </div>
  );
}
