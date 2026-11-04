// One account: identity, dating profile tools, reports, matches, activity and admin actions.

import { useCallback, useState } from 'react';
import { AlertTriangle, Download, Flag, Heart, ShieldCheck, Trash2, Wallet } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getProfile, listInterests, moderateProfilePhoto, removeProfilePhoto } from '../api/profiles.api.js';
import {
  exportUserData,
  getUser,
  listUserActivity,
  listUserMatches,
  listUserReports,
  listUserSessions,
  scheduleUserDeletion,
} from '../api/users.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import { EditTab, PrivacyTab, VisibilityTab } from '../components/profiles/ProfileDetailDrawer.jsx';
import PresenceDot from '../components/users/PresenceDot.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import UserStatusDialog, { allowedStatuses } from '../components/users/UserStatusDialog.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDate, formatDateTime, formatEnum } from '../utils/format.js';

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'edit', label: 'Edit' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'privacy', label: 'Privacy' },
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

function ProfileOverview({ profile, userId, onPhotoChanged }) {
  const [photoToRemove, setPhotoToRemove] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return <p className="muted">This account has no dating profile (staff account or onboarding not finished).</p>;

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
    <>
      {profile.photos?.length > 0 && (
        <div className="photo-grid">
          {profile.photos.map((photo) => (
            <div key={photo.id} className="photo-grid__item">
              <a href={photo.url} target="_blank" rel="noreferrer">
                <img src={photo.url} alt={`Profile photo ${photo.order + 1}`} loading="lazy" />
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
          ['Age', profile.age != null ? `${profile.age}${profile.ageEligible === false ? ' (ineligible)' : ''}` : null],
          ['Gender', formatEnum(profile.gender)],
          ['Looking for', formatEnum(profile.relationshipGoal)],
          ['City', profile.city],
          ['Occupation', profile.occupation],
          ['Bio', profile.bio],
          ['Visibility', profile.visibilityStatus ? <StatusBadge key="vis" value={profile.visibilityStatus} /> : null],
          [
            'Boost',
            profile.boost?.active
              ? `Active until ${formatDateTime(profile.boost.expiresAt)}`
              : profile.boost
                ? 'Inactive'
                : null,
          ],
          ['Interests', Array.isArray(profile.interests) ? profile.interests.join(', ') || '—' : null],
          [
            'Preferences',
            profile.preferences
              ? `Ages ${profile.preferences.minAge}–${profile.preferences.maxAge}, ${profile.preferences.maxDistanceKm} km, ${formatEnum(profile.preferences.showMe)}`
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
    </>
  );
}

function DatingTools({ tab, dating, interestsCatalog, accountProfile, userId, onPhotoChanged, onChanged }) {
  if (tab === 'overview') {
    return (
      <ProfileOverview
        profile={dating.data ?? accountProfile}
        userId={userId}
        onPhotoChanged={onPhotoChanged}
      />
    );
  }
  if (dating.isLoading && !dating.data) return <LoadingState />;
  if (dating.error && dating.data === null) return <ErrorState message={dating.error} onRetry={dating.reload} />;
  if (!dating.data) return <p className="muted">No dating profile (staff account or onboarding incomplete).</p>;
  if (tab === 'edit') return <EditTab profile={dating.data} interestsCatalog={interestsCatalog} onChanged={onChanged} />;
  if (tab === 'visibility') return <VisibilityTab profile={dating.data} onChanged={onChanged} />;
  return <PrivacyTab profile={dating.data} onChanged={onChanged} />;
}

export default function UserDetailPage() {
  const { userId } = useParams();
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [notice, setNotice] = useState(null);
  const [reportDirection, setReportDirection] = useState('against');
  const [profileTab, setProfileTab] = useState('overview');
  const [photoFailed, setPhotoFailed] = useState(false);

  const fetchReports = useCallback((params) => listUserReports(userId, params), [userId]);
  const fetchMatches = useCallback((params) => listUserMatches(userId, params), [userId]);
  const fetchActivity = useCallback((params) => listUserActivity(userId, params), [userId]);
  const fetchSessions = useCallback((params) => listUserSessions(userId, params), [userId]);
  const reports = usePaginatedList(fetchReports, { direction: reportDirection });
  const matches = usePaginatedList(fetchMatches);
  const activity = usePaginatedList(fetchActivity);
  const sessions = usePaginatedList(fetchSessions);
  const devices = useApi(() => listUserSessions(userId, { limit: 1 }).then((page) => page.devices ?? []), [userId]);

  if (isLoading && !account) return <LoadingState />;
  if (error && !account) return <ErrorState message={error} onRetry={reload} />;

  const statusOptions = allowedStatuses(staff, account);
  const profile = dating.data ?? account.profile;
  const interestsCatalog = Array.isArray(interests.data) ? interests.data : interests.data?.items ?? [];

  function refreshProfile(message) {
    if (message) setNotice(message);
    reload();
    dating.reload();
  }

  async function handleExport() {
    setBusyExport(true);
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
    <div className="detail-page user-detail-page">
      <header className="page-header user-detail-header">
        <div>
          <Link to="/users" className="back-link">
            ← Users
          </Link>
          <div className="user-drawer__identity">
            <div className="user-drawer__avatar-wrap">
              {account.photoUrl && !photoFailed ? (
                <img
                  src={account.photoUrl}
                  alt=""
                  className="user-drawer__avatar"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="user-drawer__avatar user-drawer__avatar--placeholder" aria-hidden>
                  {(account.displayName || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <PresenceDot online={account.isOnline} lastActiveAt={formatDateTime(account.lastActiveAt)} />
            </div>
            <div>
              <h1>{account.displayName}</h1>
              <p className="muted small">
                {account.phoneNumber || account.email || account.id}
                {account.phoneNumber && account.email ? ` · ${account.email}` : ''}
              </p>
              <p className="muted small">
                <code>{account.id}</code>
              </p>
              <div className="user-drawer__badges">
                <StatusBadge value={account.status} />
                <StatusBadge value={account.verificationStatus} />
                {profile?.visibilityStatus && <StatusBadge value={profile.visibilityStatus} />}
                {account.possibleDuplicate && <StatusBadge value="DUPLICATE" />}
                {account.deletion?.status === 'SCHEDULED' && <StatusBadge value="SCHEDULED" />}
              </div>
            </div>
          </div>
        </div>
        <div className="page-header__actions">
          {statusOptions.length > 0 && (
            <button type="button" className="button button--primary" onClick={() => setIsDialogOpen(true)}>
              Change status
            </button>
          )}
          {isAdmin && (
            <button type="button" className="button button--secondary" onClick={handleExport} disabled={busyExport}>
              <Download size={16} aria-hidden /> {busyExport ? 'Exporting…' : 'Export data'}
            </button>
          )}
          {isAdmin && account.role === 'USER' && account.deletion?.status !== 'SCHEDULED' && (
            <button type="button" className="button button--danger" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          )}
        </div>
      </header>
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <div className="stat-grid stat-grid--kpi">
        <StatCard
          label="Open reports"
          value={account.stats.openReportsAgainst}
          hint={`${account.stats.reportsAgainst} total against`}
          to="/reports"
          icon={Flag}
          tone="danger"
        />
        <StatCard
          label="Active matches"
          value={account.stats.activeMatches}
          hint={`${account.stats.reportsMade} reports made`}
          to="/matches"
          icon={Heart}
          tone="primary"
        />
        <StatCard
          label="Verification"
          value={formatEnum(account.verificationStatus)}
          hint={account.onboardingComplete ? 'Onboarding complete' : 'Onboarding incomplete'}
          to="/verifications"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Plan"
          value={formatEnum(account.entitlement.tier)}
          hint={account.entitlement.expiresAt ? `Expires ${formatDate(account.entitlement.expiresAt)}` : 'No expiry'}
          to={isAdmin ? `/subscriptions/${account.id}` : undefined}
          icon={Wallet}
          tone="warning"
        />
      </div>

      {(account.riskFlags?.length > 0 || account.possibleDuplicate) && (
        <section className="card card--warning">
          <h2>
            <AlertTriangle size={18} aria-hidden /> Risk &amp; duplicate indicators
          </h2>
          <ul className="risk-flag-list">
            {account.riskFlags.map((flag) => (
              <li key={flag.code}>
                <strong>{formatEnum(flag.code)}</strong>
                <span className="muted"> — {flag.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card__header">
            <h2>Account</h2>
          </div>
          <DetailList
            rows={[
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
              ['Onboarding', account.onboardingComplete ? 'Complete' : 'Incomplete'],
              [
                'Deletion',
                account.deletion.status === 'SCHEDULED' ? `Scheduled for ${formatDate(account.deletion.scheduledFor)}` : 'Not requested',
              ],
              ['Joined', formatDateTime(account.createdAt)],
              ['Last active', formatDateTime(account.lastActiveAt)],
            ]}
          />
          {!isAdmin && <p className="muted small">Phone numbers and emails are partly hidden for moderators.</p>}
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Dating profile</h2>
          </div>
          <div className="user-detail-tabs" role="tablist" aria-label="Dating profile">
            {PROFILE_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={profileTab === item.id}
                className={`drawer-tabs__tab ${profileTab === item.id ? 'is-active' : ''}`}
                onClick={() => setProfileTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <DatingTools
            tab={profileTab}
            dating={dating}
            interestsCatalog={interestsCatalog}
            accountProfile={account.profile}
            userId={account.id}
            onPhotoChanged={refreshProfile}
            onChanged={refreshProfile}
          />
        </section>
      </div>

      <DataTablePanel title="Activity timeline">
        <ListView
          list={activity}
          emptyMessage="No activity recorded."
          columns={['Event', 'Actor', 'Details', 'When']}
          renderRow={(event) => (
            <tr key={event.id}>
              <td>
                <StatusBadge value={event.type} /> {formatEnum(event.title)}
              </td>
              <td>{event.actor ? <UserCell user={event.actor} /> : '—'}</td>
              <td className="muted small">
                {event.metadata?.from && event.metadata?.to
                  ? `${formatEnum(event.metadata.from)} → ${formatEnum(event.metadata.to)}`
                  : event.metadata?.reason ?? event.metadata?.revokedReason ?? '—'}
              </td>
              <td>{formatDateTime(event.at)}</td>
            </tr>
          )}
        />
      </DataTablePanel>

      <DataTablePanel
        title="Login history & devices"
        subtitle={
          (devices.data?.length ?? 0) > 0
            ? devices.data.map((device) => `${formatEnum(device.platform)} · ${device.appVersion ?? 'Unknown version'}`).join(' · ')
            : undefined
        }
      >
        <ListView
          list={sessions}
          emptyMessage="No sign-in sessions recorded."
          columns={['Signed in', 'Status', 'Last used', 'Expires']}
          renderRow={(session) => (
            <tr key={session.id}>
              <td>{formatDateTime(session.signedInAt)}</td>
              <td>
                <StatusBadge value={session.status} />
                {session.revokedReason && <span className="muted small"> {formatEnum(session.revokedReason)}</span>}
              </td>
              <td>{formatDateTime(session.lastUsedAt)}</td>
              <td>{formatDateTime(session.expiresAt)}</td>
            </tr>
          )}
        />
      </DataTablePanel>

      <DataTablePanel
        title="Reports"
        actions={
          <div className="segmented">
            <button type="button" className={reportDirection === 'against' ? 'is-active' : ''} onClick={() => setReportDirection('against')}>
              Against this user
            </button>
            <button type="button" className={reportDirection === 'by' ? 'is-active' : ''} onClick={() => setReportDirection('by')}>
              Made by this user
            </button>
          </div>
        }
      >
        <ListView
          list={reports}
          emptyMessage="No reports."
          columns={['Reason', 'Type', reportDirection === 'against' ? 'Reported by' : 'Reported user', 'Status', 'Created']}
          renderRow={(report) => (
            <tr key={report.id}>
              <td>
                <Link to={`/reports/${report.id}`}>{formatEnum(report.reason)}</Link>
              </td>
              <td>{formatEnum(report.targetType)}</td>
              <td>
                <UserCell user={reportDirection === 'against' ? report.reporter : report.reportedUser} />
              </td>
              <td>
                <StatusBadge value={report.status} />
              </td>
              <td>{formatDateTime(report.createdAt)}</td>
            </tr>
          )}
        />
      </DataTablePanel>

      <DataTablePanel title="Matches">
        <ListView
          list={matches}
          emptyMessage="No matches."
          columns={['Matched with', 'Status', 'Messages', 'Matched', 'Ended']}
          renderRow={(match) => (
            <tr key={match.id}>
              <td>
                <UserCell user={match.otherUser} />
              </td>
              <td>
                <StatusBadge value={match.status} />
                {match.endedReason && <span className="muted small"> {formatEnum(match.endedReason)}</span>}
              </td>
              <td>{match.messageCount}</td>
              <td>{formatDate(match.matchedAt)}</td>
              <td>{formatDate(match.endedAt)}</td>
            </tr>
          )}
        />
      </DataTablePanel>

      {isDialogOpen && (
        <UserStatusDialog
          open
          account={account}
          options={statusOptions}
          onClose={() => setIsDialogOpen(false)}
          onSaved={(updated) => {
            setData(updated);
            setIsDialogOpen(false);
            setNotice(`Status changed to ${formatEnum(updated.status)}.`);
            matches.reload();
            activity.reload();
          }}
        />
      )}

      {isDeleteOpen && (
        <DeleteDialog
          open
          account={account}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={(result) => {
            setIsDeleteOpen(false);
            setNotice(`Deletion scheduled for ${formatDate(result.scheduledFor)}.`);
            reload();
            activity.reload();
          }}
        />
      )}
    </div>
  );
}
