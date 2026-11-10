import { Link } from 'react-router-dom';
import { CreditCard, PhoneCall } from 'lucide-react';
import { getCallsStatus } from '../../api/integrations.api.js';
import { useApi } from '../../hooks/useApi.js';
import { ChartCard, ChartState } from './Primitives.jsx';

export default function ReportingAvailability({ revenue, isAdmin }) {
  const calls = useApi(() => isAdmin ? getCallsStatus() : Promise.resolve(null), [isAdmin]);
  return <div className="insight-grid insight-availability">
    <ChartCard title="Revenue" subtitle="Billing performance" icon={CreditCard} actions={isAdmin && <Link className="insight-text-link" to="/payments">View payments</Link>}>
      <ChartState title={revenue?.billingConfigured === false ? 'Billing is not connected' : 'Revenue data is unavailable'} message={revenue?.note || 'The current reporting data does not include revenue amounts or a revenue history.'} icon={CreditCard} />
    </ChartCard>
    <ChartCard title="Calls" subtitle="Voice and video activity" icon={PhoneCall} actions={isAdmin && <Link className="insight-text-link" to="/calls">View calls</Link>}>
      {calls.isLoading && isAdmin ? <div className="insight-availability-loading" role="status">Checking calling availability…</div> : calls.error ? <ChartState title="Could not check calling availability" message={calls.error} onRetry={calls.reload} icon={PhoneCall} /> : <ChartState title={!isAdmin ? 'Call reporting is unavailable' : calls.data?.configured === false ? 'Calling is not connected' : 'Call statistics are unavailable'} message={!isAdmin ? 'Call volume is not included in this reporting view.' : calls.data?.reason || 'The calling status does not include call counts or a call history.'} icon={PhoneCall} />}
    </ChartCard>
  </div>;
}
