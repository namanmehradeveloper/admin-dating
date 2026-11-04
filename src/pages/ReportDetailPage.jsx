// One report: what was reported, who is involved, its history, and the moderation actions
// (take it, mark in review, action or dismiss). Closed reports are read-only.

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getReport, updateReport } from '../api/reports.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

const CLOSED = ['ACTIONED', 'DISMISSED'];

// Shows the reported profile, photo or message, or a note when it no longer exists.
function ReportedContent({ report }) {
  const { content } = report;
  if (!content) return <p className="muted">The reported content no longer exists.</p>;
  if (report.targetType === 'MESSAGE') {
    return (
      <blockquote className="quote">
        {content.photoUrl && <img className="reported-photo" src={content.photoUrl} alt="Photo in the reported message" />}
        {content.text}
        <footer className="muted small">Sent {formatDateTime(content.sentAt)}</footer>
      </blockquote>
    );
  }
  if (report.targetType === 'PHOTO') {
    return <img className="reported-photo" src={content.photoUrl} alt="Reported content" />;
  }
  return (
    <>
      <p>
        <strong>{content.displayName}</strong>
      </p>
      {content.bio && <p>{content.bio}</p>}
      <div className="photo-grid">
        {content.photos.map((photo) => (
          <img key={photo.id} src={photo.url} alt="Profile" loading="lazy" />
        ))}
      </div>
    </>
  );
}

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const { user: staff } = useAuth();
  const { data: report, setData, error, isLoading, reload } = useApi(() => getReport(reportId), [reportId], { poll: false });
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Sends an update and shows the refreshed report.
  async function applyUpdate(body, successMessage) {
    setIsSaving(true);
    setActionError(null);
    try {
      setData(await updateReport(reportId, body));
      setNotice(successMessage);
      setDecision(null);
      setNote('');
    } catch (saveError) {
      setActionError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const isClosed = CLOSED.includes(report.status);
  const isMine = report.assignedModerator?.id === staff.id;

  return (
    <div className="detail-page">
      <PageHeader
        title={`${formatEnum(report.reason)} report`}
        subtitle={report.id}
        backTo="/reports"
        backLabel="Reports"
        actions={
          !isClosed && (
            <>
              {!isMine && (
                <button type="button" className="button button--secondary" disabled={isSaving} onClick={() => applyUpdate({ assignToMe: true }, 'Assigned to you.')}>
                  Assign to me
                </button>
              )}
              {report.status === 'OPEN' && (
                <button type="button" className="button button--secondary" disabled={isSaving} onClick={() => applyUpdate({ status: 'IN_REVIEW' }, 'Marked as in review.')}>
                  Start review
                </button>
              )}
              <button type="button" className="button button--secondary" onClick={() => setDecision('DISMISSED')}>
                Dismiss
              </button>
              <button type="button" className="button button--primary" onClick={() => setDecision('ACTIONED')}>
                Mark actioned
              </button>
            </>
          )
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      {actionError && !decision && <Notice tone="error">{actionError}</Notice>}

      <div className="grid-2">
        <section className="card">
          <h2>Report</h2>
          <DetailList
            rows={[
              ['Status', <StatusBadge key="status" value={report.status} />],
              ['Type', formatEnum(report.targetType)],
              ['Reason', formatEnum(report.reason)],
              ['Details from reporter', report.details],
              ['Reported user', <UserCell key="reported" user={report.reportedUser} />],
              ['Reported by', <UserCell key="reporter" user={report.reporter} />],
              ['Other reports against this user', report.previousReportsAgainstUser],
              ['Assigned to', report.assignedModerator?.displayName ?? 'Unassigned'],
              ['Resolution note', report.resolutionNote],
              ['Created', formatDateTime(report.createdAt)],
              ['Resolved', formatDateTime(report.resolvedAt)],
            ]}
          />
          {report.reportedUser?.status !== 'DELETED' && (
            <p className="small">
              To warn, suspend or ban this member, open <Link to={`/users/${report.reportedUser.id}`}>their account</Link>.
            </p>
          )}
        </section>

        <section className="card">
          <h2>Reported content</h2>
          <ReportedContent report={report} />
        </section>
      </div>

      <section className="card">
        <h2>History</h2>
        <ol className="timeline">
          {report.history.map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <StatusBadge value={entry.status} /> <span className="muted">by {entry.actor?.displayName ?? 'system'}</span> <span className="muted small">{formatDateTime(entry.at)}</span>
              {entry.note && <p>{entry.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <ConfirmDialog
        open={Boolean(decision)}
        title={decision === 'ACTIONED' ? 'Mark report as actioned' : 'Dismiss report'}
        message="Closed reports cannot be reopened."
        confirmLabel={decision === 'ACTIONED' ? 'Mark actioned' : 'Dismiss'}
        tone={decision === 'ACTIONED' ? 'primary' : 'danger'}
        isBusy={isSaving}
        error={actionError}
        onConfirm={() => applyUpdate({ status: decision, ...(note.trim() ? { resolutionNote: note.trim() } : {}) }, `Report ${formatEnum(decision).toLowerCase()}.`)}
        onCancel={() => {
          setDecision(null);
          setActionError(null);
        }}
      >
        <label className="field">
          <span>Resolution note (optional, up to 1000 characters)</span>
          <textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
      </ConfirmDialog>
    </div>
  );
}
