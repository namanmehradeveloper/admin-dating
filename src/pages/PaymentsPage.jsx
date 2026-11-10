// Payments status — never stores card data; billing not configured yet.

import { CreditCard } from 'lucide-react';
import { getPaymentsStatus } from '../api/integrations.api.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';

export default function PaymentsPage() {
  const { data, error, isLoading, reload } = useApi(() => getPaymentsStatus(), []);

  if (isLoading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="integration-page">
      <PageHeader
        title="Payments & transactions"
        subtitle="Ledger and refunds will appear here when store billing is connected. Card numbers are never stored."
      />

      <Notice tone="warning">Store billing is not connected. Transaction data will appear once the integration is configured.</Notice>

      <div className="grid-2">
        <section className="card">
          <div className="integration-hero">
            <span className="integration-hero__icon integration-hero__icon--payments" aria-hidden>
              <CreditCard size={22} strokeWidth={2.1} />
            </span>
            <div>
              <h2>Store billing</h2>
              <p>Connect App Store or Google Play billing to review purchases, entitlements, and refunds.</p>
            </div>
          </div>
          <div className="section-gap">
            <DetailList
              rows={[
                ['Status', <StatusBadge key="status" value={data.configured ? 'ACTIVE' : 'PENDING'} />],
                ['Configured', data.configured ? 'Yes' : 'No'],
                ['Store billing', data.storeBillingConfigured ? 'Configured' : 'Not configured'],
                ['Reason', data.reason || 'Not configured'],
              ]}
            />
          </div>
        </section>

        <section className="card">
          <h2>Available after integration</h2>
          <ul className="integration-checklist">
            <li>
              <span className="integration-checklist__mark" aria-hidden />
              <div>
                <strong>Transaction ledger</strong>
                <span>Purchases, renewals and refunds without PAN/CVV</span>
              </div>
            </li>
            <li>
              <span className="integration-checklist__mark" aria-hidden />
              <div>
                <strong>Entitlement sync</strong>
                <span>Plus status tied to verified store receipts</span>
              </div>
            </li>
            <li>
              <span className="integration-checklist__mark" aria-hidden />
              <div>
                <strong>Chargeback watch</strong>
                <span>Dispute flags for fraud and support workflows</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
