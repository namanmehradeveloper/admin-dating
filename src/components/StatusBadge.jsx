// Coloured pill for enum values such as ACTIVE, BANNED, OPEN or APPROVED.

import { formatEnum } from '../utils/format.js';

const TONES = {
  ACTIVE: 'success', APPROVED: 'success', VERIFIED: 'success', ACTIONED: 'success', RESOLVED: 'success', PLUS: 'success', SENT: 'success', PUBLISHED: 'success', RUNNING: 'success', REVIEWED: 'success', VISIBLE: 'success', SUPER_ADMIN: 'success', ADMIN: 'success', ACCEPTED: 'success', AUDIO: 'success', VIDEO: 'success',
  WARNED: 'warning', PENDING: 'warning', IN_REVIEW: 'warning', IN_PROGRESS: 'warning', OPEN: 'warning', SCHEDULED: 'warning', FEATURE_NOT_CONFIGURED: 'warning', DRAFT: 'warning', PAUSED: 'warning', DUPLICATE: 'warning', EXPIRED: 'warning', SNOOZED: 'warning', UNMATCHED: 'warning', MODERATOR: 'warning', SUPPORT_AGENT: 'warning', FINANCE_MANAGER: 'warning', MARKETING_MANAGER: 'warning', ROTATED: 'warning', RINGING: 'warning', BUSY: 'warning', MISSED: 'warning', CANCELLED: 'warning',
  SUSPENDED: 'danger', BANNED: 'danger', REJECTED: 'danger', ENDED: 'danger', DELETED: 'danger', INACTIVE: 'danger', ARCHIVED: 'danger', HIDDEN: 'danger', DISMISSED: 'neutral', COMPLETED: 'neutral', REVOKED: 'neutral', ANALYST: 'neutral',
};

export default function StatusBadge({ value }) {
  const tone = TONES[String(value ?? '').toUpperCase()] ?? 'neutral';
  return <span className={`badge badge--${tone}`}><span className="badge__dot" aria-hidden />{formatEnum(value)}</span>;
}
