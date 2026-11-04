// Reviews one verification: selfie next to profile photos, then approve or reject with a reason.

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVerification, reviewVerification } from '../api/verifications.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime } from '../utils/format.js';

export default function VerificationDetailPage() {
  const { verificationId } = useParams();
  const { data: request, setData, error, isLoading, reload } = useApi(() => getVerification(verificationId), [verificationId], { poll: false });
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleConfirm() {
    setIsSaving(true);
    setActionError(null);
    try {
      const body = { status: decision, ...(reason.trim() ? { reason: reason.trim() } : {}) };
      setData(await reviewVerification(verificationId, body));
      setNotice(decision === 'APPROVED' ? 'Verification approved. The member was notified.' : 'Verification rejected. The member was notified.');
      setDecision(null);
      setReason('');
    } catch (saveError) {
      setActionError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const isPending = request.status === 'PENDING';
  const needsReason = decision === 'REJECTED';

  return (
    <div className="detail-page verification-detail-page">
      <PageHeader
        title={request.user?.displayName || 'Verification review'}
        subtitle={`${request.id} · submitted ${formatDateTime(request.submittedAt)}`}
        backTo="/verifications"
        backLabel="Verifications"
        actions={
          isPending ? (
            <>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  setDecision('REJECTED');
                  setReason('');
                  setActionError(null);
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  setDecision('APPROVED');
                  setReason('');
                  setActionError(null);
                }}
              >
                Approve
              </button>
            </>
          ) : (
            <StatusBadge value={request.status} />
          )
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <section className="card verification-detail__member">
        <div className="verification-detail__member-main">
          <UserCell user={request.user} />
          <StatusBadge value={request.status} />
        </div>
        {request.user?.id && (
          <Link to={`/users/${request.user.id}`} className="button button--secondary button--small">
            Open member
          </Link>
        )}
      </section>

      <div className="verification-compare">
        <section className="card verification-compare__panel">
          <header className="verification-compare__header">
            <h2>Selfie</h2>
            <span className="muted small">Submitted for verification</span>
          </header>
          {request.selfieUrl ? (
            <a href={request.selfieUrl} target="_blank" rel="noreferrer" className="verification-compare__selfie-link">
              <img className="verification-compare__selfie" src={request.selfieUrl} alt="Verification selfie" />
            </a>
          ) : (
            <p className="muted">The selfie file is no longer available.</p>
          )}
        </section>

        <section className="card verification-compare__panel">
          <header className="verification-compare__header">
            <h2>Profile photos</h2>
            <span className="muted small">{request.profilePhotos.length} photo{request.profilePhotos.length === 1 ? '' : 's'}</span>
          </header>
          {request.profilePhotos.length > 0 ? (
            <div className="verification-compare__photos">
              {request.profilePhotos.map((photo) => (
                <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="verification-compare__photo">
                  <img src={photo.url} alt="Profile" loading="lazy" />
                </a>
              ))}
            </div>
          ) : (
            <p className="muted">No profile photos.</p>
          )}
        </section>
      </div>

      <section className="card">
        <h2>Decision details</h2>
        <DetailList
          rows={[
            ['Submitted', formatDateTime(request.submittedAt)],
            ['Reviewed', formatDateTime(request.reviewedAt)],
            ['Reviewed by', request.reviewedBy ? <UserCell key="reviewer" user={request.reviewedBy} /> : '—'],
            ['Reason', request.reason || '—'],
          ]}
        />
      </section>

      <ConfirmDialog
        open={Boolean(decision)}
        title={decision === 'APPROVED' ? 'Approve verification' : 'Reject verification'}
        message={
          decision === 'APPROVED'
            ? 'The member will get the verified badge and a notification.'
            : 'The member will be told the selfie could not be verified.'
        }
        confirmLabel={decision === 'APPROVED' ? 'Approve' : 'Reject'}
        tone={decision === 'APPROVED' ? 'primary' : 'danger'}
        isBusy={isSaving}
        error={actionError}
        confirmDisabled={needsReason && reason.trim().length < 3}
        onConfirm={handleConfirm}
        onCancel={() => {
          setDecision(null);
          setReason('');
          setActionError(null);
        }}
      >
        <label className="field">
          <span>{needsReason ? 'Reason (required, 3–500 characters)' : 'Note (optional)'}</span>
          <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
      </ConfirmDialog>
    </div>
  );
}
