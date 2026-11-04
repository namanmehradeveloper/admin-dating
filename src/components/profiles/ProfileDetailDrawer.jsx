// Side panel for admin profile review: overview, photos, edit, visibility, privacy, history.

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getProfile,
  getProfileHistory,
  listInterests,
  moderateProfilePhoto,
  removeProfilePhoto,
  updateProfile,
  updateProfileAccount,
  updateProfileBoost,
  updateProfilePrivacy,
  updateProfileVisibility,
} from '../../api/profiles.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useApi } from '../../hooks/useApi.js';
import { usePaginatedList } from '../../hooks/usePaginatedList.js';
import { RELATIONSHIP_GOALS, PROFILE_VISIBILITY_STATUSES } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatDate, formatDateTime, formatEnum } from '../../utils/format.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import DetailList from '../DetailList.jsx';
import ErrorState from '../ErrorState.jsx';
import LoadingState from '../LoadingState.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'photos', label: 'Photos' },
  { id: 'edit', label: 'Edit' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'history', label: 'History' },
];

function CompletenessBar({ completeness }) {
  if (!completeness) return null;
  return (
    <div className="completeness">
      <div className="completeness__header">
        <span>Completeness</span>
        <strong>
          {completeness.score}/{completeness.max} ({completeness.percent}%)
        </strong>
      </div>
      <div className="completeness__track" role="progressbar" aria-valuenow={completeness.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="completeness__fill" style={{ width: `${completeness.percent}%` }} />
      </div>
      <ul className="completeness__list">
        {[
          ['Name', completeness.displayName],
          ['Photos', completeness.photos],
          ['Bio', completeness.bio],
          ['Interests', completeness.interests],
          ['Goal', completeness.relationshipGoal],
        ].map(([label, ok]) => (
          <li key={label} className={ok ? 'is-done' : ''}>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewTab({ profile }) {
  return (
    <div className="drawer-stack">
      <CompletenessBar completeness={profile.completeness} />
      <DetailList
        rows={[
          ['Member id', <code key="id">{profile.id}</code>],
          ['Display name', profile.displayName],
          ['Email', profile.email],
          ['Phone', profile.phoneNumber],
          ['Age', `${profile.age}${profile.ageEligible ? '' : ' (ineligible)'}`],
          ['Age eligibility', profile.ageEligible ? 'Eligible (18+)' : 'Under 18'],
          ['Verification', <StatusBadge key="v" value={profile.verificationStatus} />],
          ['Account status', <StatusBadge key="s" value={profile.status} />],
          ['Gender', formatEnum(profile.gender)],
          ['Looking for', formatEnum(profile.relationshipGoal)],
          ['City', profile.city],
          ['Occupation', profile.occupation],
          ['Bio', profile.bio],
          [
            'Prompt',
            profile.prompt ? `${formatEnum(profile.prompt.promptId)}: ${profile.prompt.answer}` : null,
          ],
          [
            'Lifestyle',
            profile.basics && Object.keys(profile.basics).length > 0
              ? Object.entries(profile.basics)
                  .map(([key, value]) => `${formatEnum(key)}: ${formatEnum(value)}`)
                  .join(' · ')
              : null,
          ],
          ['Interests', profile.interests?.join(', ') || null],
          [
            'Discovery prefs',
            profile.preferences
              ? `${profile.preferences.minAge}–${profile.preferences.maxAge} · ${profile.preferences.maxDistanceKm} km · ${formatEnum(profile.preferences.showMe)}`
              : null,
          ],
          ['Visibility', <StatusBadge key="vis" value={profile.visibilityStatus} />],
          ['Paused until', profile.pausedUntil ? formatDateTime(profile.pausedUntil) : null],
          ['Snoozed until', profile.snoozedUntil ? formatDateTime(profile.snoozedUntil) : null],
          [
            'Boost',
            profile.boost?.active
              ? `Active until ${formatDateTime(profile.boost.expiresAt)}`
              : profile.boost?.expired
                ? 'Expired'
                : 'Inactive',
          ],
          ['Location shared', profile.hasLocation ? 'Yes (coords hidden)' : 'No'],
          ['Created', formatDateTime(profile.createdAt)],
          ['Updated', formatDateTime(profile.updatedAt)],
        ]}
      />
    </div>
  );
}

function PhotosTab({ profile, onChanged }) {
  const [photoAction, setPhotoAction] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function confirmAction() {
    setIsSaving(true);
    setError(null);
    try {
      if (photoAction.type === 'remove') {
        await removeProfilePhoto(profile.id, photoAction.photo.id, { reason: reason.trim() });
      } else {
        await moderateProfilePhoto(profile.id, photoAction.photo.id, {
          status: photoAction.type === 'approve' ? 'APPROVED' : 'REJECTED',
          reason: reason.trim(),
        });
      }
      setPhotoAction(null);
      setReason('');
      onChanged(photoAction.type === 'remove' ? 'Photo removed.' : `Photo ${photoAction.type === 'approve' ? 'approved' : 'rejected'}.`);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile.photos?.length) return <p className="muted">No photos on this profile.</p>;

  return (
    <div className="drawer-stack">
      <div className="photo-grid photo-grid--moderation">
        {profile.photos.map((photo) => (
          <div key={photo.id} className="photo-mod-card">
            <a href={photo.url} target="_blank" rel="noreferrer">
              <img src={photo.url} alt={`Photo ${photo.order + 1}`} loading="lazy" />
            </a>
            <div className="photo-mod-card__meta">
              <StatusBadge value={photo.moderationStatus} />
              {photo.moderationReason && <p className="muted small">{photo.moderationReason}</p>}
            </div>
            <div className="photo-mod-card__actions">
              {photo.moderationStatus !== 'APPROVED' && (
                <button type="button" className="button button--primary button--small" onClick={() => setPhotoAction({ type: 'approve', photo })}>
                  Approve
                </button>
              )}
              {photo.moderationStatus !== 'REJECTED' && (
                <button type="button" className="button button--secondary button--small" onClick={() => setPhotoAction({ type: 'reject', photo })}>
                  Reject
                </button>
              )}
              <button type="button" className="button button--danger button--small" onClick={() => setPhotoAction({ type: 'remove', photo })}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {photoAction && (
        <ConfirmDialog
          open
          title={
            photoAction.type === 'remove'
              ? 'Remove profile photo'
              : photoAction.type === 'approve'
                ? 'Approve photo'
                : 'Reject photo'
          }
          message="This action is audited and requires a reason."
          confirmLabel={photoAction.type === 'remove' ? 'Remove' : photoAction.type === 'approve' ? 'Approve' : 'Reject'}
          tone={photoAction.type === 'approve' ? 'primary' : 'danger'}
          isBusy={isSaving}
          error={error}
          confirmDisabled={reason.trim().length < 3}
          onConfirm={confirmAction}
          onCancel={() => {
            setPhotoAction(null);
            setReason('');
            setError(null);
          }}
        >
          <div className="photo-preview">
            <img src={photoAction.photo.url} alt="Selected photo" />
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

function AccountCredentialsSection({ profile, onChanged }) {
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setPhoneNumber(profile.phoneNumber ?? '');
    setReason('');
  }, [profile]);

  const phoneChanged = phoneNumber.trim() !== (profile.phoneNumber ?? '');

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateProfileAccount(profile.id, {
        reason: reason.trim(),
        phoneNumber: phoneNumber.trim() || null,
      });
      setConfirmOpen(false);
      onChanged('Phone number updated.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="drawer-stack">
      <h3>Account access</h3>
      <p className="muted small">Members sign in with phone OTP. Update the E.164 number (e.g. +919876543210) if needed.</p>
      <label className="field">
        <span>Phone number</span>
        <input
          type="tel"
          value={phoneNumber}
          placeholder="+919876543210"
          autoComplete="off"
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
      </label>
      <button type="button" className="button button--secondary" disabled={!phoneChanged} onClick={() => setConfirmOpen(true)}>
        Update phone
      </button>

      {confirmOpen && (
        <ConfirmDialog
          open
          title="Update phone number"
          message="This is audited and updates the member phone number used for OTP login."
          confirmLabel="Save"
          isBusy={isSaving}
          error={error}
          confirmDisabled={reason.trim().length < 3 || !phoneChanged}
          onConfirm={handleSave}
          onCancel={() => {
            setConfirmOpen(false);
            setError(null);
          }}
        >
          <label className="field">
            <span>Reason (3–500 characters)</span>
            <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </ConfirmDialog>
      )}
    </div>
  );
}

export function EditTab({ profile, interestsCatalog, onChanged }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    displayName: profile.displayName ?? '',
    bio: profile.bio ?? '',
    city: profile.city ?? '',
    occupation: profile.occupation ?? '',
    relationshipGoal: profile.relationshipGoal ?? '',
    interestIds: profile.interestIds ?? [],
    promptId: profile.prompt?.promptId ?? '',
    promptAnswer: profile.prompt?.answer ?? '',
    reason: '',
  });
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setForm({
      displayName: profile.displayName ?? '',
      bio: profile.bio ?? '',
      city: profile.city ?? '',
      occupation: profile.occupation ?? '',
      relationshipGoal: profile.relationshipGoal ?? '',
      interestIds: profile.interestIds ?? [],
      promptId: profile.prompt?.promptId ?? '',
      promptAnswer: profile.prompt?.answer ?? '',
      reason: '',
    });
  }, [profile]);

  function toggleInterest(id) {
    setForm((current) => {
      const has = current.interestIds.includes(id);
      const interestIds = has ? current.interestIds.filter((item) => item !== id) : [...current.interestIds, id].slice(0, 10);
      return { ...current, interestIds };
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const body = {
        reason: form.reason.trim(),
        displayName: form.displayName.trim(),
        bio: form.bio,
        city: form.city,
        occupation: form.occupation,
        relationshipGoal: form.relationshipGoal || null,
        interestIds: form.interestIds,
      };
      if (form.promptId.trim() && form.promptAnswer.trim()) {
        body.prompt = { promptId: form.promptId.trim().toUpperCase(), answer: form.promptAnswer.trim() };
      } else if (!form.promptId.trim() && !form.promptAnswer.trim() && profile.prompt) {
        body.prompt = null;
      }
      await updateProfile(profile.id, body);
      setConfirmOpen(false);
      onChanged('Profile updated.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="drawer-stack">
      {isAdmin && (
        <>
          <AccountCredentialsSection profile={profile} onChanged={onChanged} />
          <hr className="drawer-divider" />
        </>
      )}
      <p className="muted small">Corrections are audited. Provide a reason before saving.</p>
      <label className="field">
        <span>Display name</span>
        <input value={form.displayName} maxLength={40} onChange={(event) => setForm((c) => ({ ...c, displayName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Bio</span>
        <textarea rows={4} maxLength={500} value={form.bio} onChange={(event) => setForm((c) => ({ ...c, bio: event.target.value }))} />
      </label>
      <div className="form-grid">
        <label className="field">
          <span>City</span>
          <input value={form.city} maxLength={80} onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))} />
        </label>
        <label className="field">
          <span>Occupation</span>
          <input value={form.occupation} maxLength={80} onChange={(event) => setForm((c) => ({ ...c, occupation: event.target.value }))} />
        </label>
      </div>
      <label className="field">
        <span>Relationship goal</span>
        <select value={form.relationshipGoal} onChange={(event) => setForm((c) => ({ ...c, relationshipGoal: event.target.value }))}>
          <option value="">Not set</option>
          {RELATIONSHIP_GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {formatEnum(goal)}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>Interests (max 10)</legend>
        <div className="interest-chip-grid">
          {(interestsCatalog ?? []).map((interest) => {
            const selected = form.interestIds.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                className={`interest-chip ${selected ? 'is-selected' : ''}`}
                onClick={() => toggleInterest(interest.id)}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="form-grid">
        <label className="field">
          <span>Prompt id</span>
          <input value={form.promptId} placeholder="e.g. WEEKEND_PLANS" onChange={(event) => setForm((c) => ({ ...c, promptId: event.target.value }))} />
        </label>
        <label className="field">
          <span>Prompt answer</span>
          <input value={form.promptAnswer} maxLength={150} onChange={(event) => setForm((c) => ({ ...c, promptAnswer: event.target.value }))} />
        </label>
      </div>
      {profile.basics && Object.keys(profile.basics).length > 0 && (
        <DetailList
          rows={Object.entries(profile.basics).map(([key, value]) => [formatEnum(key), formatEnum(value)])}
        />
      )}
      <button type="button" className="button button--primary" onClick={() => setConfirmOpen(true)}>
        Save corrections
      </button>

      {confirmOpen && (
        <ConfirmDialog
          open
          title="Save profile corrections"
          message="This writes an audit log entry with before/after values."
          confirmLabel="Save"
          isBusy={isSaving}
          error={error}
          confirmDisabled={form.reason.trim().length < 3 || !form.displayName.trim()}
          onConfirm={handleSave}
          onCancel={() => {
            setConfirmOpen(false);
            setError(null);
          }}
        >
          <label className="field">
            <span>Reason (3–500 characters)</span>
            <textarea rows={3} maxLength={500} value={form.reason} onChange={(event) => setForm((c) => ({ ...c, reason: event.target.value }))} />
          </label>
        </ConfirmDialog>
      )}
    </div>
  );
}

export function VisibilityTab({ profile, onChanged }) {
  const [visibilityStatus, setVisibilityStatus] = useState(profile.visibilityStored || profile.visibilityStatus || 'VISIBLE');
  const [until, setUntil] = useState('');
  const [note, setNote] = useState(profile.visibilityNote ?? '');
  const [boostActive, setBoostActive] = useState(Boolean(profile.boost?.active));
  const [boostExpires, setBoostExpires] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    setVisibilityStatus(profile.visibilityStored || profile.visibilityStatus || 'VISIBLE');
    setNote(profile.visibilityNote ?? '');
    setBoostActive(Boolean(profile.boost?.active));
    setUntil('');
    setBoostExpires('');
    setReason('');
  }, [profile]);

  async function saveVisibility() {
    setIsSaving(true);
    setError(null);
    try {
      const body = { visibilityStatus, reason: reason.trim(), visibilityNote: note };
      if (visibilityStatus === 'PAUSED' && until) body.pausedUntil = new Date(until).toISOString();
      if (visibilityStatus === 'SNOOZED' && until) body.snoozedUntil = new Date(until).toISOString();
      await updateProfileVisibility(profile.id, body);
      setMode(null);
      onChanged('Visibility updated.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveBoost() {
    setIsSaving(true);
    setError(null);
    try {
      const body = { active: boostActive, reason: reason.trim() };
      if (boostActive) {
        if (!boostExpires) throw new Error('Boost expiry is required when activating.');
        body.expiresAt = new Date(boostExpires).toISOString();
      }
      await updateProfileBoost(profile.id, body);
      setMode(null);
      onChanged(boostActive ? 'Boost activated.' : 'Boost cleared.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="drawer-stack">
      <DetailList
        rows={[
          ['Effective visibility', <StatusBadge key="ev" value={profile.visibilityStatus} />],
          ['Stored status', <StatusBadge key="sv" value={profile.visibilityStored} />],
          ['Paused until', profile.pausedUntil ? formatDateTime(profile.pausedUntil) : '—'],
          ['Snoozed until', profile.snoozedUntil ? formatDateTime(profile.snoozedUntil) : '—'],
          ['Note', profile.visibilityNote],
          [
            'Boost',
            profile.boost?.active
              ? `Active · expires ${formatDateTime(profile.boost.expiresAt)}`
              : 'Inactive',
          ],
        ]}
      />

      <label className="field">
        <span>Visibility</span>
        <select value={visibilityStatus} onChange={(event) => setVisibilityStatus(event.target.value)}>
          {PROFILE_VISIBILITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatEnum(status)}
            </option>
          ))}
        </select>
      </label>
      {(visibilityStatus === 'PAUSED' || visibilityStatus === 'SNOOZED') && (
        <label className="field">
          <span>{visibilityStatus === 'PAUSED' ? 'Pause until' : 'Snooze until'} (optional)</span>
          <input type="datetime-local" value={until} onChange={(event) => setUntil(event.target.value)} />
        </label>
      )}
      <label className="field">
        <span>Staff note</span>
        <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button type="button" className="button button--primary" onClick={() => setMode('visibility')}>
        Update visibility
      </button>

      <hr className="drawer-divider" />

      <label className="field field--checkbox">
        <input type="checkbox" checked={boostActive} onChange={(event) => setBoostActive(event.target.checked)} />
        <span>Boost active</span>
      </label>
      {boostActive && (
        <label className="field">
          <span>Boost expires</span>
          <input type="datetime-local" value={boostExpires} onChange={(event) => setBoostExpires(event.target.value)} required />
        </label>
      )}
      <button type="button" className="button button--secondary" onClick={() => setMode('boost')}>
        Update boost
      </button>

      {mode && (
        <ConfirmDialog
          open
          title={mode === 'visibility' ? 'Confirm visibility change' : 'Confirm boost change'}
          message="This action is audited."
          confirmLabel="Confirm"
          isBusy={isSaving}
          error={error}
          confirmDisabled={reason.trim().length < 3 || (mode === 'boost' && boostActive && !boostExpires)}
          onConfirm={mode === 'visibility' ? saveVisibility : saveBoost}
          onCancel={() => {
            setMode(null);
            setReason('');
            setError(null);
          }}
        >
          <label className="field">
            <span>Reason (3–500 characters)</span>
            <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </ConfirmDialog>
      )}
    </div>
  );
}

export function PrivacyTab({ profile, onChanged }) {
  const [privacy, setPrivacy] = useState(profile.privacy ?? {});
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setPrivacy(profile.privacy ?? {});
    setReason('');
  }, [profile]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateProfilePrivacy(profile.id, { ...privacy, reason: reason.trim() });
      setConfirmOpen(false);
      onChanged('Privacy settings updated.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  const toggles = [
    ['showAge', 'Show age on profile'],
    ['showDistance', 'Show distance in discovery'],
    ['showOnlineStatus', 'Show online status'],
    ['incognito', 'Incognito (hidden from discovery)'],
  ];

  return (
    <div className="drawer-stack">
      <p className="muted small">Discovery preferences (age range, distance, show me) are listed on Overview. These toggles control privacy.</p>
      {toggles.map(([key, label]) => (
        <label key={key} className="field field--checkbox">
          <input
            type="checkbox"
            checked={Boolean(privacy[key])}
            onChange={(event) => setPrivacy((current) => ({ ...current, [key]: event.target.checked }))}
          />
          <span>{label}</span>
        </label>
      ))}
      <DetailList
        rows={[
          [
            'Discovery preferences',
            profile.preferences
              ? `${profile.preferences.minAge}–${profile.preferences.maxAge} yrs · ${profile.preferences.maxDistanceKm} km · ${formatEnum(profile.preferences.showMe)}`
              : '—',
          ],
        ]}
      />
      <button type="button" className="button button--primary" onClick={() => setConfirmOpen(true)}>
        Save privacy
      </button>
      {confirmOpen && (
        <ConfirmDialog
          open
          title="Update privacy settings"
          message="This action is audited."
          confirmLabel="Save"
          isBusy={isSaving}
          error={error}
          confirmDisabled={reason.trim().length < 3}
          onConfirm={handleSave}
          onCancel={() => {
            setConfirmOpen(false);
            setError(null);
          }}
        >
          <label className="field">
            <span>Reason (3–500 characters)</span>
            <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </ConfirmDialog>
      )}
    </div>
  );
}

function HistoryTab({ userId }) {
  const fetch = useCallback((params) => getProfileHistory(userId, params), [userId]);
  const list = usePaginatedList(fetch, {}, { mode: 'append' });

  if (list.isLoading) return <LoadingState />;
  if (list.error && list.items.length === 0) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (list.items.length === 0) return <p className="muted">No profile moderation history yet.</p>;

  return (
    <div className="drawer-stack">
      <ol className="activity-timeline">
        {list.items.map((entry) => (
          <li key={entry.id}>
            <div className="activity-timeline__head">
              <StatusBadge value={entry.action.replace(/^PROFILE_/, '')} />
              <time className="muted small">{formatDateTime(entry.createdAt)}</time>
            </div>
            <div className="activity-timeline__body">
              <UserCell user={entry.actor} />
              {entry.metadata?.reason && <p className="muted small">Reason: {entry.metadata.reason}</p>}
              {entry.metadata?.to && typeof entry.metadata.to === 'string' && (
                <p className="muted small">
                  {entry.metadata.from ? `${formatEnum(entry.metadata.from)} → ` : ''}
                  {formatEnum(entry.metadata.to)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {list.hasMore && (
        <button type="button" className="button button--secondary" onClick={list.loadMore} disabled={list.isLoadingMore}>
          {list.isLoadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

export default function ProfileDetailDrawer({ userId, onClose, onChanged }) {
  const detail = useApi(() => getProfile(userId), [userId], { poll: false });
  const interests = useApi(() => listInterests(), [], { poll: false });
  const [tab, setTab] = useState('overview');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setTab('overview');
    setNotice(null);
  }, [userId]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleChanged(message) {
    setNotice(message);
    detail.reload();
    onChanged?.(message);
  }

  const profile = detail.data;

  return (
    <div className="side-panel-backdrop" onMouseDown={onClose}>
      <aside className="side-panel side-panel--wide" role="dialog" aria-modal="true" aria-labelledby="profile-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="side-panel__header">
          <div>
            <h2 id="profile-drawer-title">{profile?.displayName || 'Profile'}</h2>
            {profile && (
              <p className="muted">
                {profile.age} · <StatusBadge value={profile.visibilityStatus} /> · <StatusBadge value={profile.verificationStatus} />
              </p>
            )}
          </div>
          <div className="stack-inline">
            {userId && (
              <Link to={`/users/${userId}`} className="button button--secondary button--small" title="Open user record">
                <ExternalLink size={14} aria-hidden />
                User
              </Link>
            )}
            <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
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

        <div className="side-panel__body">
          {notice && <p className="drawer-notice">{notice}</p>}
          {detail.isLoading && !profile ? (
            <LoadingState />
          ) : detail.error && !profile ? (
            <ErrorState message={detail.error} onRetry={detail.reload} />
          ) : profile ? (
            <>
              {tab === 'overview' && <OverviewTab profile={profile} />}
              {tab === 'photos' && <PhotosTab profile={profile} onChanged={handleChanged} />}
              {tab === 'edit' && (
                <EditTab
                  profile={profile}
                  interestsCatalog={Array.isArray(interests.data) ? interests.data : interests.data?.items ?? []}
                  onChanged={handleChanged}
                />
              )}
              {tab === 'visibility' && <VisibilityTab profile={profile} onChanged={handleChanged} />}
              {tab === 'privacy' && <PrivacyTab profile={profile} onChanged={handleChanged} />}
              {tab === 'history' && <HistoryTab userId={userId} />}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
