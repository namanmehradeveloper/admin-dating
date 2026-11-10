// System monitoring: live API/DB/socket health, media, jobs, and honest stubs for gaps.

import {
  Activity,
  AlertTriangle,
  Database,
  HardDrive,
  HeartPulse,
  Phone,
  Server,
  Wallet,
  Wifi,
} from 'lucide-react';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getMonitoring } from '../api/monitoring.api.js';
import { useApi } from '../hooks/useApi.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

function formatBytes(bytes) {
  if (bytes == null) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatMs(value) {
  if (value == null) return '—';
  return `${formatNumber(value)} ms`;
}

function overallTone(overall) {
  if (overall === 'HEALTHY') return 'success';
  if (overall === 'WARNING') return 'warning';
  return 'danger';
}

function severityBadge(severity) {
  if (severity === 'critical') return 'BANNED';
  if (severity === 'warning') return 'SUSPENDED';
  return 'ACTIVE';
}

function MonitorCard({ title, badge, children, className = '' }) {
  return (
    <section className={`card monitoring-card ${className}`.trim()}>
      {(title || badge) && (
        <div className="card__header">
          {title ? <h2>{title}</h2> : <span />}
          {badge}
        </div>
      )}
      {children}
    </section>
  );
}

function CompactTable({ columns, rows, empty }) {
  if (!rows.length) return <p className="muted small monitoring-empty-inline">{empty}</p>;
  return (
    <div className="table-wrap monitoring-table-wrap">
      <table className="table monitoring-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default function MonitoringPage() {
  const { data, error, isLoading, reload } = useApi(() => getMonitoring(), []);

  if (isLoading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const api = data.api ?? {};
  const database = data.database ?? {};
  const sockets = data.sockets ?? {};
  const media = data.media ?? {};
  const jobs = data.jobs ?? {};
  const payments = data.payments ?? {};
  const calls = data.calls ?? {};
  const deployment = data.deployment ?? {};
  const cost = data.infrastructureCost ?? {};
  const alerts = data.alerts ?? [];
  const recentErrors = data.errors?.recent ?? [];
  const topRoutes = api.topRoutes ?? [];
  const purposeEntries = Object.entries(media.byPurpose ?? {});

  return (
    <div className="monitoring-page">
      <PageHeader
        title="System monitoring"
        subtitle={`Live process metrics · updated ${formatDateTime(data.generatedAt)}`}
      />

      {error && data && (
        <p className="drawer-notice" role="status">
          Could not refresh: {error}. Showing last loaded data.
        </p>
      )}

      <Notice>
        Current API, database, and connection metrics. Unavailable integrations are marked as not configured.
      </Notice>

      <div className="stat-grid stat-grid--kpi">
        <StatCard
          label="Overall"
          icon={HeartPulse}
          tone={overallTone(data.overall)}
          value={data.overall ?? '—'}
          hint={`${formatNumber(alerts.filter((a) => a.severity !== 'info').length)} active alerts`}
        />
        <StatCard
          label="API availability"
          icon={Activity}
          tone="primary"
          value={api.availabilityPercent != null ? `${api.availabilityPercent}%` : '—'}
          hint={`${formatNumber(api.sampleCount)} samples · ${api.windowMinutes ?? 15}m window`}
        />
        <StatCard
          label="API p95 latency"
          icon={Server}
          tone="violet"
          value={formatMs(api.latencyMs?.p95)}
          hint={`avg ${formatMs(api.latencyMs?.avg)} · p50 ${formatMs(api.latencyMs?.p50)}`}
        />
        <StatCard
          label="MongoDB"
          icon={Database}
          tone={database.ok ? 'success' : 'danger'}
          value={database.ok ? 'OK' : 'Down'}
          hint={database.latencyMs != null ? `ping ${formatMs(database.latencyMs)}` : data.mongoose?.state}
        />
        <StatCard
          label="Socket.IO"
          icon={Wifi}
          tone="teal"
          value={sockets.connected ?? '—'}
          hint={`${formatNumber(sockets.onlineMembers)} members online`}
        />
        <StatCard
          label="5xx errors"
          icon={AlertTriangle}
          tone={api.statusCounts?.['5xx'] ? 'warning' : 'success'}
          value={api.statusCounts?.['5xx'] ?? 0}
          hint={`4xx ${formatNumber(api.statusCounts?.['4xx'] ?? 0)} · error rate ${formatNumber(api.errorRatePercent ?? 0)}%`}
        />
      </div>

      <div className="monitoring-grid monitoring-grid--alerts">
        <MonitorCard
          title="Alerts"
          badge={<span className="muted small">{alerts.length ? `${alerts.length} open` : 'All clear'}</span>}
        >
          {alerts.length === 0 ? (
            <p className="muted small">No alerts right now.</p>
          ) : (
            <ul className="monitoring-alert-list">
              {alerts.map((alert, index) => (
                <li key={`${alert.source}-${index}`} className={`monitoring-alert monitoring-alert--${alert.severity || 'info'}`}>
                  <div className="monitoring-alert__meta">
                    <StatusBadge value={severityBadge(alert.severity)} />
                    <span className="muted small">{formatEnum(alert.severity)}</span>
                    <span className="monitoring-alert__source">{formatEnum(alert.source)}</span>
                  </div>
                  <p>{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </MonitorCard>

        <MonitorCard title={`Latency (last ${api.windowMinutes ?? 15}m)`}>
          <DetailList
            rows={[
              ['Samples', formatNumber(api.sampleCount)],
              ['Availability', api.availabilityPercent != null ? `${api.availabilityPercent}%` : '—'],
              ['Average', formatMs(api.latencyMs?.avg)],
              ['p50', formatMs(api.latencyMs?.p50)],
              ['p95', formatMs(api.latencyMs?.p95)],
              ['p99', formatMs(api.latencyMs?.p99)],
              ['Public health', api.healthEndpoint ?? '/api/v1/health'],
            ]}
          />
        </MonitorCard>
      </div>

      <div className="monitoring-grid monitoring-grid--system">
        <MonitorCard title="Process" badge={<StatusBadge value={data.env?.nodeEnv?.toUpperCase?.() ?? 'UNKNOWN'} />}>
          <DetailList
            rows={[
              ['Uptime', `${formatNumber(data.process?.uptimeSeconds)} s`],
              ['Node', data.process?.nodeVersion],
              ['PID', data.process?.pid],
              ['Platform', data.process?.platform],
              ['RSS', formatBytes(data.process?.memoryUsage?.rss)],
              ['Heap used', formatBytes(data.process?.memoryUsage?.heapUsed)],
              ['Heap total', formatBytes(data.process?.memoryUsage?.heapTotal)],
            ]}
          />
        </MonitorCard>

        <MonitorCard title="MongoDB" badge={<StatusBadge value={database.ok ? 'ACTIVE' : 'BANNED'} />}>
          <DetailList
            rows={[
              ['State', data.mongoose?.state ?? database.state],
              ['Ready state', data.mongoose?.readyState],
              ['Ping', database.ok ? formatMs(database.latencyMs) : 'Failed'],
              ['Database', database.name ?? '—'],
              ['Host', database.host ?? '—'],
            ]}
          />
        </MonitorCard>

        <MonitorCard title="Socket.IO">
          <DetailList
            rows={[
              ['Realtime attached', sockets.realtimeAttached ? 'Yes' : 'No (tests / REST-only)'],
              ['Connected sockets', sockets.connected ?? 'Unavailable'],
              ['Online members', formatNumber(sockets.onlineMembers)],
            ]}
          />
        </MonitorCard>

        <MonitorCard title="Media uploads">
          <DetailList
            rows={[
              ['Uploaded (24h)', formatNumber(media.uploadedLast24h)],
              ['Pending photo moderation', formatNumber(media.pendingPhotoModerationProfiles)],
              ['Pending verification selfies', formatNumber(media.pendingVerificationSelfies)],
              ['Queue', media.processing?.queueConfigured ? 'Configured' : 'Inline (no queue)'],
            ]}
          />
          {purposeEntries.length > 0 && (
            <div className="monitoring-chip-row">
              {purposeEntries.map(([key, value]) => (
                <span key={key} className="monitoring-chip">
                  <strong>{formatEnum(key)}</strong>
                  <span>{formatNumber(value)}</span>
                </span>
              ))}
            </div>
          )}
          {media.processing?.note && <p className="muted small monitoring-note">{media.processing.note}</p>}
        </MonitorCard>
      </div>

      <div className="monitoring-grid monitoring-grid--tables">
        <MonitorCard title="Top routes" badge={<span className="muted small">This process</span>}>
          <CompactTable
            columns={['Route', 'Count', 'Avg', '5xx']}
            empty="No traffic recorded yet. Use the admin panel, then this list updates on its own."
            rows={topRoutes.map((row) => (
              <tr key={row.route}>
                <td>
                  <code className="small">{row.route}</code>
                </td>
                <td>{formatNumber(row.count)}</td>
                <td>{formatMs(row.avgMs)}</td>
                <td>{formatNumber(row.errors)}</td>
              </tr>
            ))}
          />
        </MonitorCard>

        <MonitorCard title="Recent 5xx" badge={<span className="muted small">{recentErrors.length || 'None'}</span>}>
          <CompactTable
            columns={['When', 'Route', 'Status', 'Code']}
            empty="No 5xx responses in this process window."
            rows={recentErrors.map((entry, index) => (
              <tr key={`${entry.at}-${index}`}>
                <td className="nowrap">{formatDateTime(entry.at)}</td>
                <td>
                  <code className="small">
                    {entry.method} {entry.path}
                  </code>
                </td>
                <td>{entry.statusCode}</td>
                <td>{entry.code ?? '—'}</td>
              </tr>
            ))}
          />
        </MonitorCard>
      </div>

      <MonitorCard
        title="Background jobs"
        badge={<span className="muted small">{formatNumber(jobs.scheduledAccountDeletions)} scheduled deletions</span>}
        className="monitoring-card--wide"
      >
        {jobs.note && <p className="muted small monitoring-note">{jobs.note}</p>}
        <CompactTable
          columns={['Job', 'Schedule', 'Status', 'Last run', 'Runs', 'Result']}
          empty="No registered jobs."
          rows={(jobs.items ?? []).map((job) => (
            <tr key={job.id}>
              <td>{job.name}</td>
              <td className="muted small">{job.schedule}</td>
              <td>
                <StatusBadge value={job.lastStatus === 'OK' ? 'ACTIVE' : job.lastStatus === 'FAILED' ? 'BANNED' : 'PENDING'} />
                <span className="muted small"> {job.lastStatus}</span>
              </td>
              <td>{job.lastFinishedAt ? formatDateTime(job.lastFinishedAt) : '—'}</td>
              <td>{formatNumber(job.runCount)}</td>
              <td className="muted small">{job.lastError ?? (job.lastResult ? JSON.stringify(job.lastResult) : '—')}</td>
            </tr>
          ))}
        />
      </MonitorCard>

      <div className="monitoring-grid monitoring-grid--integrations">
        <MonitorCard
          title={
            <>
              <Phone size={16} aria-hidden /> Call signaling
            </>
          }
          badge={<StatusBadge value={calls.configured ? 'ACTIVE' : 'NONE'} />}
        >
          <DetailList
            rows={[
              ['Configured', calls.configured ? 'Yes' : 'No'],
              ['Signaling healthy', calls.signalingHealthy ? 'Yes' : 'n/a'],
              ['Active sessions', calls.activeSessions ?? '—'],
              ['Reason', calls.reason],
            ]}
          />
        </MonitorCard>

        <MonitorCard
          title={
            <>
              <Wallet size={16} aria-hidden /> Payments
            </>
          }
          badge={<StatusBadge value={payments.configured ? 'ACTIVE' : 'NONE'} />}
        >
          <DetailList
            rows={[
              ['Store billing', payments.storeBillingConfigured ? 'Configured' : 'Not configured'],
              ['Webhook failures', payments.webhookFailures ?? '—'],
              ['Reason', payments.reason],
              ['Note', payments.note],
            ]}
          />
        </MonitorCard>

        <MonitorCard
          title={
            <>
              <HardDrive size={16} aria-hidden /> Infra cost
            </>
          }
          badge={<StatusBadge value={cost.configured ? 'ACTIVE' : 'NONE'} />}
        >
          <DetailList
            rows={[
              ['Configured', cost.configured ? 'Yes' : 'No'],
              ['Provider', cost.provider ?? '—'],
              ['Amount', cost.amount ?? '—'],
              ['Note', cost.note],
            ]}
          />
        </MonitorCard>

        <MonitorCard title="Deployment / version">
          <DetailList
            rows={[
              ['API version', deployment.apiVersion ?? '—'],
              ['Node', deployment.nodeVersion],
              ['Environment', deployment.environment],
              ['Git SHA', deployment.gitSha ?? 'Not set'],
              ['Build ID', deployment.buildId ?? 'Not set'],
              ['Process started', deployment.startedAt ? formatDateTime(deployment.startedAt) : '—'],
              ['Push', data.pushConfigured ? 'Configured' : 'Not configured'],
            ]}
          />
        </MonitorCard>
      </div>
    </div>
  );
}
