// Turns audit entries ({ action, targetType, targetId, metadata, relatedUsers }) into readable UI:
// a link to the target, a one-line summary, a before/after table and labelled extra fields.

import { Link } from 'react-router-dom';
import { SETTING_LABELS } from '../../utils/constants.js';
import { formatDateTime, formatEnum, formatNumber } from '../../utils/format.js';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';

// Label of the status field that `from`/`to` describe, per action.
const STATUS_FIELD_LABELS = {
  USER_STATUS_CHANGED: 'Account status',
  REPORT_UPDATED: 'Report status',
  TICKET_STATUS_CHANGED: 'Ticket status',
};

// Labels for metadata fields shown in the details section (from/to/changes are shown as changes).
const FIELD_LABELS = {
  reason: 'Reason',
  until: 'Suspended until',
  resolutionNote: 'Resolution note',
  assignedModeratorId: 'Assigned moderator',
  userId: 'Member',
  decision: 'Decision',
  status: 'Ticket status',
  campaignId: 'Campaign id',
  type: 'Notification type',
  audience: 'Audience',
  recipientCount: 'Recipients',
  scheduledFor: 'Deletion scheduled for',
  graceDays: 'Grace days',
  fields: 'Exported sections',
};

const BADGE_FIELDS = new Set(['decision', 'status', 'from', 'to']);
const ENUM_FIELDS = new Set(['type', 'audience']);
const DATE_FIELDS = new Set(['until', 'scheduledFor']);
const CHANGE_FIELDS = new Set(['from', 'to', 'changes']);

// Where each target type lives in the admin panel, with a readable name.
const TARGETS = {
  REPORT: { label: 'Report', path: (id) => `/reports/${id}` },
  VERIFICATION: { label: 'Verification', path: (id) => `/verifications/${id}` },
  SUPPORT_TICKET: { label: 'Support ticket', path: (id) => `/support/${id}` },
  NOTIFICATION_CAMPAIGN: { label: 'Notification campaign', path: () => '/notifications' },
  SETTINGS: { label: 'App settings', path: () => '/settings' },
  CMS: { label: 'CMS entry', path: () => '/cms' },
  COUPON: { label: 'Coupon', path: () => '/coupons' },
  REFERRAL: { label: 'Referral', path: () => '/referrals' },
  RISK_SIGNAL: { label: 'Fraud signal', path: () => '/fraud' },
  EXPERIMENT: { label: 'Experiment', path: () => '/experiments' },
  ROLE: { label: 'Role', path: () => '/staff' },
};

// Renders one metadata value: member ids as user cards, statuses as badges, dates and numbers formatted.
export function AuditValue({ field, value, log }) {
  if (value === null || value === undefined || value === '') return <span className="muted">—</span>;
  if (typeof value === 'string' && log.relatedUsers?.[value]) return <UserCell user={log.relatedUsers[value]} />;
  if (BADGE_FIELDS.has(field) && typeof value === 'string') return <StatusBadge value={value} />;
  if (ENUM_FIELDS.has(field)) return formatEnum(value);
  if (DATE_FIELDS.has(field)) return formatDateTime(value);
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return <code>{JSON.stringify(value)}</code>;
  return String(value);
}

// The target as a user card or a link to its page, with its id underneath.
export function AuditTarget({ log }) {
  if (log.targetType === 'USER') {
    return <UserCell user={log.relatedUsers?.[log.targetId] ?? { id: log.targetId, displayName: log.targetId }} />;
  }
  const target = TARGETS[log.targetType];
  return (
    <div>
      {target ? <Link to={target.path(log.targetId)}>{target.label}</Link> : formatEnum(log.targetType)}
      {log.targetType !== 'SETTINGS' && <div className="muted small mono">{log.targetId}</div>}
    </div>
  );
}

// Before/after rows: [{ field, label, from, to }] for status changes and settings updates.
export function getAuditChanges(log) {
  const metadata = log.metadata ?? {};
  if (metadata.changes && typeof metadata.changes === 'object') {
    return Object.entries(metadata.changes).map(([key, change]) => ({
      field: key,
      label: SETTING_LABELS[key] ?? key,
      from: change?.from,
      to: change?.to,
    }));
  }
  if ('from' in metadata || 'to' in metadata) {
    return [{ field: 'status', label: STATUS_FIELD_LABELS[log.action] ?? 'Status', from: metadata.from, to: metadata.to, isStatus: true }];
  }
  return [];
}

// Metadata fields other than the before/after values, as [label, rendered value] rows.
export function getAuditFields(log) {
  return Object.entries(log.metadata ?? {})
    .filter(([key]) => !CHANGE_FIELDS.has(key))
    .map(([key, value]) => [FIELD_LABELS[key] ?? formatEnum(key), <AuditValue key={key} field={key} value={value} log={log} />]);
}

function StatusChange({ from, to }) {
  return (
    <span className="audit-change">
      {from ? <StatusBadge value={from} /> : <span className="muted">—</span>}
      <span className="audit-change__arrow" aria-label="changed to">→</span>
      {to ? <StatusBadge value={to} /> : <span className="muted">—</span>}
    </span>
  );
}

// One-line description of what happened, shown in the table.
export function AuditSummary({ log }) {
  const metadata = log.metadata ?? {};
  switch (log.action) {
    case 'USER_STATUS_CHANGED':
    case 'TICKET_STATUS_CHANGED':
      return <StatusChange from={metadata.from} to={metadata.to} />;
    case 'REPORT_UPDATED':
      return metadata.from === metadata.to ? (
        <span>
          Updated · <StatusBadge value={metadata.to} />
        </span>
      ) : (
        <StatusChange from={metadata.from} to={metadata.to} />
      );
    case 'VERIFICATION_REVIEWED':
      return <StatusBadge value={metadata.decision} />;
    case 'TICKET_REPLIED':
      return (
        <span>
          Replied · ticket <StatusBadge value={metadata.status} />
        </span>
      );
    case 'NOTIFICATION_SENT':
      return (
        <span>
          {formatEnum(metadata.type)} to {formatNumber(metadata.recipientCount)} {metadata.recipientCount === 1 ? 'member' : 'members'}
          <div className="muted small">{formatEnum(metadata.audience)}</div>
        </span>
      );
    case 'SETTINGS_UPDATED': {
      const [first, ...rest] = getAuditChanges(log);
      if (!first) return <span className="muted">—</span>;
      return (
        <span>
          {first.label}: {formatNumber(first.from)} → <strong>{formatNumber(first.to)}</strong>
          {rest.length > 0 && <div className="muted small">+{rest.length} more</div>}
        </span>
      );
    }
    case 'USER_DATA_EXPORTED':
      return <span>Member data export downloaded</span>;
    case 'USER_DELETION_SCHEDULED':
      return (
        <span>
          Deletion scheduled
          {metadata.scheduledFor ? <div className="muted small">{formatDateTime(metadata.scheduledFor)}</div> : null}
        </span>
      );
    case 'USER_CREATED':
      return <span>Member account created</span>;
    case 'STAFF_CREATED':
      return <span>Staff account created</span>;
    case 'STAFF_ROLE_CHANGED':
    case 'STAFF_STATUS_CHANGED':
      return <StatusChange from={metadata.from} to={metadata.to} />;
    case 'STAFF_FORCE_LOGOUT':
      return <span>Forced logout{metadata.reason ? <div className="muted small">{metadata.reason}</div> : null}</span>;
    case 'ROLE_CREATED':
      return <span>Role created{metadata.name ? <div className="muted small">{metadata.name}</div> : null}</span>;
    case 'ROLE_UPDATED':
    case 'ROLE_PERMISSIONS_UPDATED':
      return <span>Role updated</span>;
    case 'ROLE_DELETED':
      return <span>Role deleted</span>;
    case 'PROFILE_PHOTO_MODERATED':
      return <StatusBadge value={metadata.status ?? metadata.decision ?? 'REVIEWED'} />;
    case 'PROFILE_PHOTO_REMOVED':
      return <span>Profile photo removed</span>;
    case 'PROFILE_UPDATED':
    case 'PROFILE_VISIBILITY_CHANGED':
    case 'PROFILE_BOOST_CHANGED':
    case 'PROFILE_PRIVACY_CHANGED':
      return <span>{formatEnum(log.action.replace(/^PROFILE_/, ''))}</span>;
    case 'MATCH_ENDED_BY_ADMIN':
      return <span>Match ended by staff</span>;
    case 'MATCH_CONFIG_UPDATED':
    case 'SWIPE_ENTITLEMENTS_UPDATED':
      return <span>Config updated</span>;
    case 'CMS_CREATED':
    case 'CMS_UPDATED':
    case 'COUPON_CREATED':
    case 'COUPON_UPDATED':
    case 'REFERRAL_CREATED':
    case 'REFERRAL_UPDATED':
    case 'EXPERIMENT_CREATED':
    case 'EXPERIMENT_UPDATED':
      return <span>{formatEnum(log.action)}</span>;
    case 'FRAUD_SCANNED':
      return <span>Fraud scan completed</span>;
    case 'FRAUD_SIGNAL_UPDATED':
      return metadata.from || metadata.to ? <StatusChange from={metadata.from} to={metadata.to} /> : <span>Signal updated</span>;
    default:
      return metadata.reason ? <span className="muted">{metadata.reason}</span> : <span className="muted">—</span>;
  }
}
