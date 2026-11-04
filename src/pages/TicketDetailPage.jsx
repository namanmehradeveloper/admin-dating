// One support ticket: the conversation, a reply box and status changes (closing asks for confirmation).

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTicket, replyToTicket, updateTicketStatus } from '../api/support.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { TICKET_STATUSES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { data: ticket, setData, error, isLoading, reload } = useApi(() => getTicket(ticketId), [ticketId], { poll: false });
  const [reply, setReply] = useState('');
  const [pendingStatus, setPendingStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Runs an action that returns the updated ticket.
  async function runAction(action, successMessage) {
    setIsSaving(true);
    setActionError(null);
    try {
      setData(await action());
      setNotice(successMessage);
      return true;
    } catch (saveError) {
      setActionError(getErrorMessage(saveError));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // Sends the staff reply.
  async function handleReply(event) {
    event.preventDefault();
    if (await runAction(() => replyToTicket(ticketId, reply.trim()), 'Reply sent. The member was notified.')) setReply('');
  }

  // Changes the status right away, except CLOSED which asks for confirmation first.
  function handleStatusChange(status) {
    if (status === 'CLOSED') setPendingStatus(status);
    else runAction(() => updateTicketStatus(ticketId, status), `Status set to ${formatEnum(status)}.`);
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="detail-page">
      <PageHeader
        title={ticket.subject}
        subtitle={`${formatEnum(ticket.category)} · ${ticket.id}`}
        backTo="/support"
        backLabel="Support"
        actions={
          <label className="field field--inline">
            <span>Status</span>
            <select value={ticket.status} disabled={isSaving} onChange={(event) => handleStatusChange(event.target.value)}>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatEnum(status)}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      {actionError && !pendingStatus && <Notice tone="error">{actionError}</Notice>}

      <section className="card">
        <div className="card__header">
          <UserCell user={ticket.user} />
          <StatusBadge value={ticket.status} />
        </div>
        <ol className="thread">
          {ticket.messages.map((message) => (
            <li key={message.id} className={message.author === 'STAFF' ? 'thread__message thread__message--staff' : 'thread__message'}>
              <div className="thread__meta">
                <strong>{message.author === 'STAFF' ? `Staff · ${message.authorUser?.displayName ?? ''}` : 'Member'}</strong>
                <span className="muted small">{formatDateTime(message.createdAt)}</span>
              </div>
              <p className="thread__body">{message.body}</p>
            </li>
          ))}
        </ol>

        {ticket.status === 'CLOSED' ? (
          <p className="muted">This ticket is closed. Change the status to reply.</p>
        ) : (
          <form onSubmit={handleReply} className="reply-form">
            <label className="field">
              <span>Reply to the member</span>
              <textarea rows={4} maxLength={5000} value={reply} onChange={(event) => setReply(event.target.value)} />
            </label>
            <button type="submit" className="button button--primary" disabled={isSaving || !reply.trim()}>
              {isSaving ? 'Sending…' : 'Send reply'}
            </button>
          </form>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="Close ticket"
        message="The member will not be able to get further replies unless the ticket is reopened."
        confirmLabel="Close ticket"
        tone="danger"
        isBusy={isSaving}
        error={actionError}
        onConfirm={async () => {
          if (await runAction(() => updateTicketStatus(ticketId, pendingStatus), 'Ticket closed.')) setPendingStatus(null);
        }}
        onCancel={() => {
          setPendingStatus(null);
          setActionError(null);
        }}
      />
    </div>
  );
}
