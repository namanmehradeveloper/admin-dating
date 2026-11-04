// One member's subscription (ADMIN only, read-only).

import { useParams } from 'react-router-dom';
import { getSubscription } from '../api/subscriptions.api.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

export default function SubscriptionDetailPage() {
  const { userId } = useParams();
  const { data, error, isLoading, reload } = useApi(() => getSubscription(userId), [userId]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { entitlement } = data;
  return (
    <div className="detail-page">
      <PageHeader
        title="Subscription"
        subtitle={userId}
        backTo="/subscriptions"
        backLabel="Subscriptions"
      />

      {!data.storeVerification.configured && (
        <Notice tone="warning">Store purchase verification: {formatEnum(data.storeVerification.status)}.</Notice>
      )}

      <div className="detail-summary">
        <section className="card">
          <div className="card__header">
            <h2>Entitlement</h2>
            <StatusBadge value={entitlement.tier} />
          </div>
          <DetailList
            rows={[
              ['Member', <UserCell key="user" user={data.user} />],
              ['Active', entitlement.isActive ? 'Yes' : 'No'],
              ['Product', entitlement.productId || '—'],
              ['Platform', formatEnum(entitlement.platform)],
              ['Expires', formatDateTime(entitlement.expiresAt)],
              ['Renews automatically', entitlement.willRenew ? 'Yes' : 'No'],
              ['Last updated', formatDateTime(entitlement.updatedAt)],
            ]}
          />
        </section>

        <section className="card">
          <h2>Store verification</h2>
          <DetailList
            rows={[
              ['Configured', data.storeVerification.configured ? 'Yes' : 'No'],
              ['Status', <StatusBadge key="store" value={data.storeVerification.status} />],
            ]}
          />
          <p className="muted small section-gap">
            Card numbers and raw receipt secrets are never stored in the admin console.
          </p>
        </section>
      </div>
    </div>
  );
}
