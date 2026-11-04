// Side panel for a staff account: overview, sessions, activity, force logout and status.

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  forceStaffLogout,
  getStaff,
  listStaffActivity,
  listStaffSessions,
  updateStaffRole,
  updateStaffStatus,
} from '../../api/staff.api.js';
import { useApi } from '../../hooks/useApi.js';
import { usePaginatedList } from '../../hooks/usePaginatedList.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatDateTime, formatEnum } from '../../utils/format.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import DetailList from '../DetailList.jsx';
import ErrorState from '../ErrorState.jsx';
import LoadingState from '../LoadingState.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'activity', label: 'Activity' },
];

export default function StaffDetailDrawer({ userId, me, roleOptions, onClose, onChanged }) {
  const detail = useApi(() => getStaff(userId), [userId], { poll: false });
  const [tab, setTab] = useState('overview');
  const [notice, setNotice] = useState(null);
  const [role, setRole] = useState('');
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const activityFetch = useCallback((params) => listStaffActivity(userId, params), [userId]);
  const activity = usePaginatedList(activityFetch, {}, { mode: 'append' });
  const sessions = useApi(() => listStaffSessions(userId), [userId], { poll: false });

  useEffect(() => {
    setTab('overview');
    setNotice(null);
  }, [userId]);

  useEffect(() => {
    if (detail.data) setRole(detail.data.role);
  }, [detail.data]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const staff = detail.data;
  const isSelf = staff?.id === me?.id;

  async function runDialog() {
    setIsBusy(true);
    setError(null);
    try {
      if (dialog === 'role') {
        await updateStaffRole(userId, { role });
        onChanged('Role updated.');
      } else if (dialog === 'suspend') {
        await updateStaffStatus(userId, { status: 'SUSPENDED', reason: reason.trim() });
        onChanged('Staff suspended.');
      } else if (dialog === 'activate') {
        await updateStaffStatus(userId, { status: 'ACTIVE', reason: reason.trim() || 'Reactivated' });
        onChanged('Staff activated.');
      } else if (dialog === 'logout') {
        await forceStaffLogout(userId, { reason: reason.trim() });
        onChanged('Forced logout completed.');
        sessions.reload();
      }
      setDialog(null);
      setReason('');
      detail.reload();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="side-panel-backdrop" onMouseDown={onClose}>
      <aside className="side-panel side-panel--wide" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="side-panel__header">
          <div>
            <h2>{staff?.displayName || staff?.email || 'Staff'}</h2>
            {staff && (
              <p className="muted">
                <StatusBadge value={staff.role} /> · <StatusBadge value={staff.status} />
              </p>
            )}
          </div>
          <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="drawer-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`drawer-tabs__tab ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="side-panel__body">
          {notice && <p className="drawer-notice">{notice}</p>}
          {detail.isLoading && !staff ? (
            <LoadingState />
          ) : detail.error && !staff ? (
            <ErrorState message={detail.error} onRetry={detail.reload} />
          ) : staff ? (
            <>
              {tab === 'overview' && (
                <div className="drawer-stack">
                  <DetailList
                    rows={[
                      ['Staff id', <code key="id">{staff.id}</code>],
                      ['Email', staff.email],
                      ['Role', <StatusBadge key="role" value={staff.role} />],
                      ['Rank', staff.rank],
                      ['Status', <StatusBadge key="status" value={staff.status} />],
                      ['Joined', formatDateTime(staff.createdAt)],
                      ['Last active', formatDateTime(staff.lastActiveAt)],
                    ]}
                  />
                  {!isSelf && (
                    <>
                      <label className="field">
                        <span>Assign role</span>
                        <select value={role} onChange={(event) => setRole(event.target.value)}>
                          {roleOptions.map((option) => (
                            <option key={option.slug} value={option.slug}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="stack-inline">
                        <button type="button" className="button button--primary" disabled={role === staff.role} onClick={() => setDialog('role')}>
                          Update role
                        </button>
                        {staff.status === 'ACTIVE' ? (
                          <button type="button" className="button button--danger" onClick={() => setDialog('suspend')}>
                            Suspend
                          </button>
                        ) : (
                          <button type="button" className="button button--secondary" onClick={() => setDialog('activate')}>
                            Activate
                          </button>
                        )}
                        <button type="button" className="button button--secondary" onClick={() => setDialog('logout')}>
                          Force logout
                        </button>
                      </div>
                    </>
                  )}
                  {isSelf && <p className="muted small">You cannot change your own role or status here.</p>}
                </div>
              )}

              {tab === 'sessions' && (
                <div className="drawer-stack">
                  {sessions.isLoading ? (
                    <LoadingState />
                  ) : sessions.error ? (
                    <ErrorState message={sessions.error} onRetry={sessions.reload} />
                  ) : (
                    <ListSessions items={sessions.data?.items ?? []} />
                  )}
                </div>
              )}

              {tab === 'activity' && (
                <div className="drawer-stack">
                  {activity.isLoading ? (
                    <LoadingState />
                  ) : activity.items.length === 0 ? (
                    <p className="muted">No staff activity yet.</p>
                  ) : (
                    <ol className="activity-timeline">
                      {activity.items.map((entry) => (
                        <li key={entry.id}>
                          <div className="activity-timeline__head">
                            <strong>{formatEnum(entry.action)}</strong>
                            <time className="muted small">{formatDateTime(entry.createdAt)}</time>
                          </div>
                          <UserCell user={entry.actor} />
                          {entry.metadata?.reason && <p className="muted small">Reason: {entry.metadata.reason}</p>}
                        </li>
                      ))}
                    </ol>
                  )}
                  {activity.hasMore && (
                    <button type="button" className="button button--secondary" onClick={activity.loadMore} disabled={activity.isLoadingMore}>
                      Load more
                    </button>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </aside>

      {dialog && (
        <ConfirmDialog
          open
          title={
            dialog === 'role'
              ? 'Change staff role'
              : dialog === 'suspend'
                ? 'Suspend staff account'
                : dialog === 'activate'
                  ? 'Activate staff account'
                  : 'Force logout'
          }
          message="This action is audited. Active sessions are revoked when suspending, demoting or forcing logout."
          confirmLabel="Confirm"
          tone={dialog === 'suspend' || dialog === 'logout' ? 'danger' : 'primary'}
          isBusy={isBusy}
          error={error}
          confirmDisabled={['suspend', 'logout'].includes(dialog) && reason.trim().length < 3}
          onConfirm={runDialog}
          onCancel={() => {
            setDialog(null);
            setReason('');
            setError(null);
          }}
        >
          {dialog !== 'role' && (
            <label className="field">
              <span>Reason{dialog === 'activate' ? ' (optional)' : ' (3–500 characters)'}</span>
              <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

function ListSessions({ items }) {
  if (!items.length) return <p className="muted">No sessions recorded.</p>;
  return (
    <div className="table-wrap">
      <table className="table data-table">
        <thead>
          <tr>
            <th>Family</th>
            <th>Status</th>
            <th>Signed in</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {items.map((session) => (
            <tr key={session.id}>
              <td>
                <code className="small">{session.familyId.slice(0, 8)}…</code>
              </td>
              <td>
                <StatusBadge value={session.status} />
              </td>
              <td>{formatDateTime(session.signedInAt)}</td>
              <td>{formatDateTime(session.expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
