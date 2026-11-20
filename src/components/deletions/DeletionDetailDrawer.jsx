// Side panel: deletion ledger detail, attempts, audit trail, Retry / Cancel / Force purge.

import { RotateCcw, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  cancelDeletionRecord,
  forcePurgeDeletionRecord,
  getDeletionRecord,
  retryDeletionRecord,
} from '../../api/deletions.api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatDateTime, formatEnum } from '../../utils/format.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import DetailList from '../DetailList.jsx';
import ErrorState from '../ErrorState.jsx';
import LoadingState from '../LoadingState.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';

export default function DeletionDetailDrawer({ recordId, onClose, onChanged }) {
  const { hasPermission } = useAuth();
  const canRetry = hasPermission('DELETION_MANAGEMENT', 'EDIT');
  const canManageDelete = hasPermission('DELETION_MANAGEMENT', 'DELETE');
  const detail = useApi(() => (recordId ? getDeletionRecord(recordId) : Promise.resolve(null)), [recordId], {
    poll: false,
  });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  if (!recordId) return null;

  async function runAction(action) {
    setBusy(true);
    setActionError(null);
    try {
      let updated;
      if (action === 'retry') {
        updated = await retryDeletionRecord(recordId);
      } else if (action === 'cancel') {
        updated = await cancelDeletionRecord(recordId);
      } else if (action === 'purge') {
        updated = await forcePurgeDeletionRecord(recordId, { confirm: true });
      }
      detail.setData(updated);
      setConfirmAction(null);
      onChanged?.(updated, action);
    } catch (error) {
      setActionError(getErrorMessage(error));
      detail.reload();
    } finally {
      setBusy(false);
    }
  }

  const row = detail.data;
  const showRetry = canRetry && row?.canRetry;
  const showCancel = canManageDelete && row?.canCancel;
  const showForcePurge = canManageDelete && row?.canForcePurge;

  return (
    <aside className="drawer" aria-label="Deletion record detail">
      <header className="drawer__header">
        <div>
          <h2>Deletion record</h2>
          {row && <p className="muted small">{row.displayName}</p>}
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="drawer__body">
        {detail.isLoading && !row ? (
          <LoadingState />
        ) : detail.error && !row ? (
          <ErrorState message={detail.error} onRetry={detail.reload} />
        ) : row ? (
          <div className="drawer-stack">
            <div className="user-drawer__badges">
              <StatusBadge value={row.status} />
              <StatusBadge value={row.source} />
              {row.isDue && row.status !== 'PURGED' && row.status !== 'CANCELLED' && (
                <StatusBadge value="READY" />
              )}
            </div>

            <DetailList
              rows={[
                ['Record id', <code key="rid">{row.id}</code>],
                ['User id', <code key="uid">{row.userId}</code>],
                [
                  'Account',
                  row.liveAccount ? (
                    <Link
                      key="link"
                      to={row.liveAccount.role && row.liveAccount.role !== 'USER' ? '/staff' : `/users/${row.userId}`}
                    >
                      {row.displayName}
                    </Link>
                  ) : (
                    row.displayName
                  ),
                ],
                ['Role', row.liveAccount?.role ? <StatusBadge key="role" value={row.liveAccount.role} /> : '—'],
                ['Email', row.email],
                ['Phone', row.phoneNumber],
                ['Reason', row.reason],
                ['Feedback', row.feedback],
                [
                  'Scheduled by',
                  row.scheduledBy ? <UserCell key="by" user={row.scheduledBy} /> : row.source === 'ADMIN' ? 'Admin' : 'Member',
                ],
                ['Requested', formatDateTime(row.requestedAt)],
                ['Scheduled for', formatDateTime(row.scheduledFor)],
                ['Remaining', row.status === 'PURGED' || row.status === 'CANCELLED' ? '—' : row.remainingLabel],
                ['Cancelled', row.cancelledAt ? `${formatDateTime(row.cancelledAt)} (${formatEnum(row.cancelReason)})` : null],
                ['Purged', row.purgedAt ? formatDateTime(row.purgedAt) : null],
                ['Retry count', row.retryCount],
                ['Last error', row.lastError],
              ]}
            />

            {actionError && <p className="form-error">{actionError}</p>}

            {(showRetry || showCancel || showForcePurge) && (
              <div className="stack-inline">
                {showRetry && (
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={busy}
                    onClick={() => setConfirmAction('retry')}
                  >
                    <RotateCcw size={14} aria-hidden /> Retry purge
                  </button>
                )}
                {showCancel && (
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={busy}
                    onClick={() => setConfirmAction('cancel')}
                  >
                    Cancel deletion
                  </button>
                )}
                {showForcePurge && (
                  <button
                    type="button"
                    className="button button--danger"
                    disabled={busy}
                    onClick={() => setConfirmAction('purge')}
                  >
                    <Trash2 size={14} aria-hidden /> Force purge now
                  </button>
                )}
              </div>
            )}

            <section>
              <h3>Purge attempts</h3>
              {row.attempts?.length ? (
                <ul className="risk-flag-list">
                  {row.attempts.map((attempt, index) => (
                    <li key={`${attempt.at}-${index}`}>
                      <StatusBadge value={attempt.outcome} />{' '}
                      <span className="muted small">{formatDateTime(attempt.at)}</span>
                      <div className="muted small">
                        {formatEnum(attempt.triggeredBy)}
                        {attempt.actor ? ` · ${attempt.actor.displayName}` : ''}
                      </div>
                      {attempt.error && <div className="form-error">{attempt.error}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small">No purge attempts yet.</p>
              )}
            </section>

            <section>
              <h3>Related audit records</h3>
              {row.auditTrail?.length ? (
                <ul className="risk-flag-list">
                  {row.auditTrail.map((log) => (
                    <li key={log.id}>
                      <strong>{formatEnum(log.action)}</strong>
                      <div className="muted small">
                        {formatDateTime(log.createdAt)} · {log.actorRole} ({log.actorId})
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small">No deletion audit entries for this member.</p>
              )}
            </section>
          </div>
        ) : null}
      </div>

      {confirmAction && (
        <ConfirmDialog
          open
          title={
            confirmAction === 'retry'
              ? 'Retry failed purge?'
              : confirmAction === 'cancel'
                ? 'Cancel scheduled deletion?'
                : 'Force purge now?'
          }
          message={
            confirmAction === 'retry'
              ? 'Re-runs the erase job for this failed record. Only works after the grace period has ended.'
              : confirmAction === 'cancel'
                ? 'The account stays active and is removed from the deletion queue. This is audited.'
                : 'Immediately and permanently erases this account, bypassing any remaining grace period. This cannot be undone and is audited.'
          }
          confirmLabel={
            confirmAction === 'retry' ? 'Retry purge' : confirmAction === 'cancel' ? 'Cancel deletion' : 'Force purge'
          }
          tone={confirmAction === 'cancel' ? 'primary' : 'danger'}
          isBusy={busy}
          error={actionError}
          onConfirm={() => void runAction(confirmAction)}
          onCancel={() => {
            setConfirmAction(null);
            setActionError(null);
          }}
        />
      )}
    </aside>
  );
}
