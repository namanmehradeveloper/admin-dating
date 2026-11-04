// Voice/video calling — honest not-configured status until the domain exists.

import { PhoneCall } from 'lucide-react';
import { getCallsStatus } from '../api/integrations.api.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';

export default function CallsPage() {
  const { data, error, isLoading, reload } = useApi(() => getCallsStatus(), []);

  if (isLoading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="integration-page">
      <PageHeader
        title="Voice & video calls"
        subtitle="Operational diagnostics for calling. No unauthorized recording or content access."
      />

      <Notice tone="warning">Integration blocked: calling is not implemented in this API yet.</Notice>

      <div className="grid-2">
        <section className="card">
          <div className="integration-hero">
            <span className="integration-hero__icon integration-hero__icon--calls" aria-hidden>
              <PhoneCall size={22} strokeWidth={2.1} />
            </span>
            <div>
              <h2>Calling provider</h2>
              <p>Connect a voice/video stack to unlock live call health, failure rates and abuse signals here.</p>
            </div>
          </div>
          <div className="section-gap">
            <DetailList
              rows={[
                ['Status', <StatusBadge key="status" value={data.configured ? 'ACTIVE' : 'PENDING'} />],
                ['Configured', data.configured ? 'Yes' : 'No'],
                ['Reason', data.reason || 'Not configured'],
              ]}
            />
          </div>
        </section>

        <section className="card">
          <h2>Coming online later</h2>
          <ul className="integration-checklist">
            <li>
              <span className="integration-checklist__mark" aria-hidden />
              <div>
                <strong>Call volume &amp; success rate</strong>
                <span>Daily answered, missed and failed calls</span>
              </div>
            </li>
            <li>
              <span className="integration-checklist__mark" aria-hidden />
              <div>
                <strong>Provider health</strong>
                <span>Latency, webhook delivery and outage flags</span>
              </div>
            </li>
            <li>
              <span className="integration-checklist__mark" aria-hidden />
              <div>
                <strong>Safety controls</strong>
                <span>Block lists and high-risk call patterns — never raw audio</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
