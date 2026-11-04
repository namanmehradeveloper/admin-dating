// Side panel with tabbed member details: overview, profile, activity, sessions, moderation.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, ExternalLink, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfile, listInterests, moderateProfilePhoto, removeProfilePhoto } from '../../api/profiles.api.js';
import { EditTab, PrivacyTab, VisibilityTab } from '../profiles/ProfileDetailDrawer.jsx';
import {
  exportUserData,
  getUser,
  listUserActivity,
  listUserMatches,
  listUserReports,
  listUserSessions,
  scheduleUserDeletion,
} from '../../api/users.api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { usePaginatedList } from '../../hooks/usePaginatedList.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatDate, formatDateTime, formatEnum } from '../../utils/format.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import DetailList from '../DetailList.jsx';
import ErrorState from '../ErrorState.jsx';
import LoadingState from '../LoadingState.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';
import PresenceDot from './PresenceDot.jsx';
import UserActionsMenu from './UserActionsMenu.jsx';
import UserStatusDialog, { allowedStatuses } from './UserStatusDialog.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'edit', label: 'Edit' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'activity', label: 'Activity' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'moderation', label: 'Moderation' },
];

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function RiskFlags({ flags }) {
  if (!flags?.length) return <p className="muted small">No duplicate or fraud indicators.</p>;
  return (
    <ul className="risk-flag-list">
      {flags.map((flag) => (
        <li key={flag.code}>
          <AlertTriangle size={14} aria-hidden />
          <span>
            <strong>{formatEnum(flag.code)}</strong>
            <span className="muted"> — {flag.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function OverviewTab({ account }) {
  return (
    <div className="drawer-stack">
      <DetailList
        rows={[
          ['User id', <code key="id">{account.id}</code>],
          [
            'Presence',
            <span key="presence" className="presence-inline">
              <PresenceDot online={account.isOnline} />
              {account.isOnline ? 'Online' : 'Offline'}
            </span>,
          ],
          ['Status', <StatusBadge key="status" value={account.status} />],
          ['Status reason', account.statusReason],
          ['Suspended until', account.suspendedUntil ? formatDateTime(account.suspendedUntil) : null],
          ['Role', formatEnum(account.role)],
          ['Email', account.email],
          ['Phone', account.phoneNumber],
          ['Verification', <StatusBadge key="verification" value={account.verificationStatus} />],
          ['Onboarding', account.onboardingComplete ? 'Complete' : 'Incomplete'],
          [
            'Deletion',
            account.deletion?.status === 'SCHEDULED'
              ? `Scheduled for ${formatDate(account.deletion.scheduledFor)}`
              : 'Not requested',
          ],
          ['Registered', formatDateTime(account.createdAt)],
          ['Last active', formatDateTime(account.lastActiveAt)],
          ['Plan', <StatusBadge key="tier" value={account.entitlement?.tier} />],
        ]}
      />
      <section>
        <h3>Risk indicators</h3>
        <RiskFlags flags={account.riskFlags} />
      </section>
    </div>
  );
}

function ProfileTab({ profile, userId, onPhotoChanged }) {
  const [photoToRemove, setPhotoToRemove] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return <p className="muted">No dating profile (staff account or onboarding incomplete).</p>;

  async function handleRemove() {
    setIsSaving(true);
    setError(null);
    try {
      await removeProfilePhoto(userId, photoToRemove.id, { reason: reason.trim() });
      setPhotoToRemove(null);
      setReason('');
      onPhotoChanged('Profile photo removed.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleModerate() {
    setIsSaving(true);
    setError(null);
    try {
      await moderateProfilePhoto(userId, moderation.photo.id, {
        status: moderation.status,
        reason: reason.trim(),
      });
      setModeration(null);
      setReason('');
      onPhotoChanged(`Photo ${moderation.status === 'APPROVED' ? 'approved' : 'rejected'}.`);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="drawer-stack">
      {profile.photos?.length > 0 && (
        <div className="photo-grid photo-grid--compact">
          {profile.photos.map((photo) => (
            <div key={photo.id} className="photo-grid__item">
              <a href={photo.url} target="_blank" rel="noreferrer">
                <img src={photo.url} alt={`Photo ${photo.order + 1}`} loading="lazy" />
              </a>
              {photo.moderationStatus && <StatusBadge value={photo.moderationStatus} />}
              {photo.moderationStatus === 'PENDING' && (
                <div className="stack-inline">
                  <button type="button" className="button button--primary button--small" onClick={() => setModeration({ photo, status: 'APPROVED' })}>
                    Approve
                  </button>
                  <button type="button" className="button button--danger button--small" onClick={() => setModeration({ photo, status: 'REJECTED' })}>
                    Reject
                  </button>
                </div>
              )}
              <button type="button" className="button button--danger button--small" onClick={() => setPhotoToRemove(photo)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <DetailList
        rows={[
          ['Name', profile.displayName],
          ['Age', profile.age],
          ['Gender', formatEnum(profile.gender)],
          ['Looking for', formatEnum(profile.relationshipGoal)],
          ['City', profile.city],
          ['Occupation', profile.occupation],
          ['Bio', profile.bio],
          ['Visibility', profile.visibilityStatus ? <StatusBadge key="vis" value={profile.visibilityStatus} /> : '—'],
          ['Interests', profile.interests?.join(', ') || '—'],
          [
            'Preferences',
            profile.preferences
              ? `${profile.preferences.minAge}–${profile.preferences.maxAge} · ${profile.preferences.maxDistanceKm} km · ${formatEnum(profile.preferences.showMe)}`
              : '—',
          ],
        ]}
      />
      {photoToRemove && (
        <ConfirmDialog
          open
          title="Remove profile photo"
          message="This removes the photo from the member's profile. The action is audited."
          confirmLabel="Remove photo"
          tone="danger"
          isBusy={isSaving}
          error={error}
          confirmDisabled={reason.trim().length < 3}
          onConfirm={handleRemove}
          onCancel={() => {
            setPhotoToRemove(null);
            setReason('');
            setError(null);
          }}
        >
          <div className="photo-preview">
            <img src={photoToRemove.url} alt="Photo to remove" />
          </div>
          <label className="field">
            <span>Reason (3–500 characters)</span>
            <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </ConfirmDialog>
      )}
      {moderation && (
        <ConfirmDialog
          open
          title={moderation.status === 'APPROVED' ? 'Approve photo' : 'Reject photo'}
          message="This action is audited and requires a reason."
          confirmLabel={moderation.status === 'APPROVED' ? 'Approve' : 'Reject'}
          tone={moderation.status === 'APPROVED' ? 'primary' : 'danger'}
          isBusy={isSaving}
          error={error}
          confirmDisabled={reason.trim().length < 3}
          onConfirm={handleModerate}
          onCancel={() => {
            setModeration(null);
            setReason('');
            setError(null);
          }}
        >
          <div className="photo-preview">
            <img src={moderation.photo.url} alt="Photo under review" />
          </div>
          <label className="field">
            <span>Reason (3–500 characters)</span>
            <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </ConfirmDialog>
      )}
    </div>
  );
}

function ActivityTab({ userId }) {
  const fetch = useCallback((params) => listUserActivity(userId, params), [userId]);
  const list = usePaginatedList(fetch, {}, { mode: 'append' });

  if (list.isLoading) return <LoadingState />;
  if (list.error && list.items.length === 0) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (list.items.length === 0) return <p className="muted">No activity yet.</p>;

  return (
    <div className="timeline">
      {list.items.map((event) => (
        <article key={event.id} className="timeline__item">
          <div className={`timeline__dot timeline__dot--${event.type.toLowerCase()}`} />
          <div className="timeline__body">
            <header className="timeline__header">
              <strong>{formatEnum(event.title)}</strong>
              <time className="muted small">{formatDateTime(event.at)}</time>
            </header>
            {event.actor && (
              <p className="small">
                By <UserCell user={event.actor} /> {event.actorRole && <StatusBadge value={event.actorRole} />}
              </p>
            )}
            {event.metadata?.from && event.metadata?.to && (
              <p className="small muted">
                {formatEnum(event.metadata.from)} → {formatEnum(event.metadata.to)}
                {event.metadata.reason ? ` · ${event.metadata.reason}` : ''}
              </p>
            )}
            {event.type === 'LOGIN' && event.metadata?.revokedReason && (
              <p className="small muted">Ended: {formatEnum(event.metadata.revokedReason)}</p>
            )}
          </div>
        </article>
      ))}
      {list.hasMore && (
        <button type="button" className="button button--secondary button--small" onClick={list.loadMore} disabled={list.isLoadingMore}>
          {list.isLoadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

function SessionsTab({ userId }) {
  const fetch = useCallback((params) => listUserSessions(userId, params), [userId]);
  const list = usePaginatedList(fetch, {}, { mode: 'append' });
  const devices = useApi(() => listUserSessions(userId, { limit: 1 }).then((page) => page.devices ?? []), [userId], { poll: false });

  if (list.isLoading) return <LoadingState />;
  if (list.error && list.items.length === 0) return <ErrorState message={list.error} onRetry={list.reload} />;

  return (
    <div className="drawer-stack">
      <section>
        <h3>Devices</h3>
        {devices.isLoading && <LoadingState />}
        {!devices.isLoading && (devices.data?.length ?? 0) === 0 && <p className="muted small">No push devices registered.</p>}
        <ul className="plain-list">
          {(devices.data ?? []).map((device) => (
            <li key={device.id}>
              <StatusBadge value={device.platform} /> {device.appVersion ?? 'Unknown version'}
              <span className="muted small"> · last seen {formatDateTime(device.lastSeenAt)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Login history</h3>
        {list.items.length === 0 ? (
          <p className="muted small">No sign-in sessions recorded.</p>
        ) : (
          <div className="table-wrap">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Signed in</th>
                  <th>Status</th>
                  <th>Last used</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((session) => (
                  <tr key={session.id}>
                    <td>{formatDateTime(session.signedInAt)}</td>
                    <td>
                      <StatusBadge value={session.status} />
                      {session.revokedReason && <span className="muted small"> {formatEnum(session.revokedReason)}</span>}
                    </td>
                    <td>{formatDateTime(session.lastUsedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.hasMore && (
          <button type="button" className="button button--secondary button--small" onClick={list.loadMore} disabled={list.isLoadingMore}>
            {list.isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
        )}
      </section>
    </div>
  );
}

function ModerationTab({ userId }) {
  const [direction, setDirection] = useState('against');
  const fetchReports = useCallback((params) => listUserReports(userId, params), [userId]);
  const fetchMatches = useCallback((params) => listUserMatches(userId, params), [userId]);
  const reports = usePaginatedList(fetchReports, { direction }, { mode: 'append' });
  const matches = usePaginatedList(fetchMatches, {}, { mode: 'append' });

  return (
    <div className="drawer-stack">
      <section>
        <div className="card__header">
          <h3>Reports</h3>
          <div className="segmented">
            <button type="button" className={direction === 'against' ? 'is-active' : ''} onClick={() => setDirection('against')}>
              Against
            </button>
            <button type="button" className={direction === 'by' ? 'is-active' : ''} onClick={() => setDirection('by')}>
              By user
            </button>
          </div>
        </div>
        {reports.isLoading && <LoadingState />}
        {!reports.isLoading && reports.items.length === 0 && <p className="muted small">No reports.</p>}
        <ul className="plain-list">
          {reports.items.map((report) => (
            <li key={report.id}>
              <Link to={`/reports/${report.id}`}>{formatEnum(report.reason)}</Link>
              <StatusBadge value={report.status} />
              <span className="muted small">{formatDate(report.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Matches</h3>
        {matches.isLoading && <LoadingState />}
        {!matches.isLoading && matches.items.length === 0 && <p className="muted small">No matches.</p>}
        <ul className="plain-list">
          {matches.items.map((match) => (
            <li key={match.id}>
              <UserCell user={match.otherUser} />
              <StatusBadge value={match.status} />
              <span className="muted small">{match.messageCount} messages</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function DeleteDialog({ open, account, onClose, onDeleted }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      onDeleted(await scheduleUserDeletion(account.id, { reason: reason.trim() }));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Schedule account deletion"
      message="The member is signed out immediately. Data is erased after the 14-day grace period unless they sign in again."
      confirmLabel="Schedule deletion"
      tone="danger"
      isBusy={isSaving}
      error={error}
      confirmDisabled={reason.trim().length < 3}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Reason (3–500 characters, audited)</span>
        <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
    </ConfirmDialog>
  );
}

function DatingEditSection({ tab, dating, interestsCatalog, onChanged }) {
  if (dating.isLoading && !dating.data) return <LoadingState />;
  if (dating.error && dating.data === null) return <ErrorState message={dating.error} onRetry={dating.reload} />;
  if (!dating.data) return <p className="muted">No dating profile (staff account or onboarding incomplete).</p>;

  if (tab === 'edit') {
    return <EditTab profile={dating.data} interestsCatalog={interestsCatalog} onChanged={onChanged} />;
  }
  if (tab === 'visibility') {
    return <VisibilityTab profile={dating.data} onChanged={onChanged} />;
  }
  return <PrivacyTab profile={dating.data} onChanged={onChanged} />;
}

export default function UserDetailDrawer({ userId, initialTab = 'overview', onClose, onChanged }) {
  const panelRef = useRef(null);
  const { user: staff, isAdmin } = useAuth();
  const { data: account, setData, error, isLoading, reload } = useApi(() => getUser(userId), [userId], { poll: false });
  const dating = useApi(
    () =>
      getProfile(userId).catch((loadError) => {
        if (loadError.response?.status === 404) return null;
        throw loadError;
      }),
    [userId],
    { poll: false },
  );
  const interests = useApi(() => listInterests(), [], { poll: false });
  const [tab, setTab] = useState(initialTab);
  const [statusPreset, setStatusPreset] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!userId || isStatusOpen || isDeleteOpen) return undefined;
    panelRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [userId, onClose, isStatusOpen, isDeleteOpen]);

  useEffect(() => {
    setTab(initialTab);
    setNotice(null);
  }, [userId, initialTab]);

  if (!userId) return null;

  const statusOptions = account ? allowedStatuses(staff, account) : [];

  async function handleExport() {
    setBusyExport(true);
    setNotice(null);
    try {
      const payload = await exportUserData(userId);
      downloadJson(`user-${userId}-export.json`, payload);
      setNotice('Export downloaded. This action was audited.');
    } catch (exportError) {
      setNotice(getErrorMessage(exportError));
    } finally {
      setBusyExport(false);
    }
  }

  return (
    <div className="side-panel-backdrop" onMouseDown={onClose}>
      <aside
        className="side-panel side-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
        tabIndex={-1}
        ref={panelRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {isLoading && <LoadingState />}
        {error && !account && <ErrorState message={error} onRetry={reload} />}
        {account && (
          <>
            <header className="side-panel__header">
              <div className="user-drawer__identity">
                <div className="user-drawer__avatar-wrap">
                  {account.photoUrl ? (
                    <img src={account.photoUrl} alt="" className="user-drawer__avatar" />
                  ) : (
                    <div className="user-drawer__avatar user-drawer__avatar--placeholder" />
                  )}
                  <PresenceDot online={account.isOnline} lastActiveAt={formatDateTime(account.lastActiveAt)} />
                </div>
                <div>
                  <h2 id="user-drawer-title">{account.displayName}</h2>
                  <p className="muted small">{account.id}</p>
                  <div className="user-drawer__badges">
                    <StatusBadge value={account.status} />
                    <StatusBadge value={account.verificationStatus} />
                    {account.possibleDuplicate && <StatusBadge value="DUPLICATE" />}
                    {account.deletion?.status === 'SCHEDULED' && <StatusBadge value="SCHEDULED" />}
                  </div>
                </div>
              </div>
              <div className="user-drawer__header-actions">
                <UserActionsMenu
                  account={account}
                  staff={staff}
                  onStatusAction={(status) => {
                    setStatusPreset(status);
                    setIsStatusOpen(true);
                  }}
                  onDeleteAction={() => setIsDeleteOpen(true)}
                />
                <Link to={`/users/${account.id}`} className="button button--secondary button--small" title="Open full page">
                  <ExternalLink size={14} aria-hidden />
                </Link>
                <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close details">
                  <X size={18} />
                </button>
              </div>
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

            {notice && <p className="drawer-notice">{notice}</p>}

            <div className="side-panel__body">
              {tab === 'overview' && <OverviewTab account={account} />}
              {tab === 'profile' && (
                <ProfileTab
                  profile={account.profile}
                  userId={account.id}
                  onPhotoChanged={(message) => {
                    setNotice(message);
                    reload();
                    dating.reload();
                    onChanged?.();
                  }}
                />
              )}
              {['edit', 'visibility', 'privacy'].includes(tab) && (
                <DatingEditSection
                  tab={tab}
                  dating={dating}
                  interestsCatalog={Array.isArray(interests.data) ? interests.data : interests.data?.items ?? []}
                  onChanged={(message) => {
                    setNotice(message);
                    reload();
                    dating.reload();
                    onChanged?.();
                  }}
                />
              )}
              {tab === 'activity' && <ActivityTab userId={account.id} />}
              {tab === 'sessions' && <SessionsTab userId={account.id} />}
              {tab === 'moderation' && <ModerationTab userId={account.id} />}
            </div>

            <footer className="user-drawer__footer">
              {statusOptions.length > 0 && (
                <button
                  type="button"
                  className="button button--primary button--small"
                  onClick={() => {
                    setStatusPreset(null);
                    setIsStatusOpen(true);
                  }}
                >
                  Change status
                </button>
              )}
              {isAdmin && (
                <>
                  <button type="button" className="button button--secondary button--small" onClick={handleExport} disabled={busyExport}>
                    <Download size={14} aria-hidden /> {busyExport ? 'Exporting…' : 'Export data'}
                  </button>
                  {account.role === 'USER' && account.deletion?.status !== 'SCHEDULED' && (
                    <button type="button" className="button button--danger button--small" onClick={() => setIsDeleteOpen(true)}>
                      <Trash2 size={14} aria-hidden /> Delete
                    </button>
                  )}
                </>
              )}
            </footer>
          </>
        )}
      </aside>

      {isStatusOpen && account && (
        <UserStatusDialog
          key={`${account.id}-${statusPreset ?? 'default'}`}
          open
          account={account}
          options={statusOptions}
          presetStatus={statusPreset}
          onClose={() => setIsStatusOpen(false)}
          onSaved={(updated) => {
            setData(updated);
            setIsStatusOpen(false);
            setNotice(`Status changed to ${formatEnum(updated.status)}.`);
            onChanged?.();
          }}
        />
      )}

      {isDeleteOpen && account && (
        <DeleteDialog
          open
          account={account}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={(result) => {
            setIsDeleteOpen(false);
            setNotice(`Deletion scheduled for ${formatDate(result.scheduledFor)}.`);
            reload();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
