import { Link } from 'react-router-dom';
import { CreditCard, PhoneCall } from 'lucide-react';
import { getCallsStats, getCallsStatus } from '../../api/calls.api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatDuration, formatNumber } from '../../utils/format.js';
import { ChartCard, ChartState } from './Primitives.jsx';

export default function ReportingAvailability({ revenue, isAdmin }) {
  const status = useApi(() => (isAdmin ? getCallsStatus() : Promise.resolve(null)), [isAdmin]);
  const stats = useApi(() => (isAdmin && status.data?.configured ? getCallsStats({ days: 7 }) : Promise.resolve(null)), [
    isAdmin,
    status.data?.configured,
  ]);

  let callsBody;
  if (!isAdmin) {
    callsBody = (
      <ChartState
        title="Call reporting is unavailable"
        message="Call volume is not included in this reporting view."
        icon={PhoneCall}
      />
    );
  } else if (status.isLoading) {
    callsBody = (
      <div className="insight-availability-loading" role="status">
        Checking calling availability…
      </div>
    );
  } else if (status.error) {
    callsBody = (
      <ChartState title="Could not check calling availability" message={status.error} onRetry={status.reload} icon={PhoneCall} />
    );
  } else if (status.data?.configured === false) {
    callsBody = (
      <ChartState
        title="Calling is not connected"
        message={status.data.reason || 'Agora credentials are not configured.'}
        icon={PhoneCall}
      />
    );
  } else if (stats.isLoading && !stats.data) {
    callsBody = (
      <div className="insight-availability-loading" role="status">
        Loading call stats…
      </div>
    );
  } else if (stats.error) {
    callsBody = <ChartState title="Could not load call stats" message={stats.error} onRetry={stats.reload} icon={PhoneCall} />;
  } else if (stats.data) {
    callsBody = (
      <ChartState
        title={`${formatNumber(stats.data.total)} calls (7d)`}
        message={`Audio ${formatNumber(stats.data.audio)} · Video ${formatNumber(stats.data.video)} · Avg ${
          stats.data.avgDurationSeconds == null ? '—' : formatDuration(stats.data.avgDurationSeconds)
        }`}
        icon={PhoneCall}
      />
    );
  } else {
    callsBody = (
      <ChartState
        title="Call statistics are unavailable"
        message="Open Calls for the full history and filters."
        icon={PhoneCall}
      />
    );
  }

  return (
    <div className="insight-grid insight-availability">
      <ChartCard
        title="Revenue"
        subtitle="Billing performance"
        icon={CreditCard}
        actions={isAdmin && <Link className="insight-text-link" to="/payments">View payments</Link>}
      >
        <ChartState
          title={revenue?.billingConfigured === false ? 'Billing is not connected' : 'Revenue data is unavailable'}
          message={revenue?.note || 'The current reporting data does not include revenue amounts or a revenue history.'}
          icon={CreditCard}
        />
      </ChartCard>
      <ChartCard
        title="Calls"
        subtitle="Voice and video activity"
        icon={PhoneCall}
        actions={isAdmin && <Link className="insight-text-link" to="/calls">View calls</Link>}
      >
        {callsBody}
      </ChartCard>
    </div>
  );
}
