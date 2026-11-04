// Notification campaigns: history for all staff, and a send form for admins (with confirmation).

import { useState } from 'react';
import { listCampaigns, sendCampaign } from '../api/notifications.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FilterToolbar from '../components/FilterToolbar.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { CAMPAIGN_AUDIENCES, CAMPAIGN_TYPES } from '../utils/constants.js';
import { getErrorMessage, getFieldErrors } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

const EMPTY_FORM = { title: '', body: '', type: 'ANNOUNCEMENT', audience: 'ALL_USERS', targetUserId: '' };

// Form for POST /admin/notifications.
function CampaignForm({ onSent }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const isComplete = form.title.trim() && form.body.trim() && (form.audience !== 'SINGLE_USER' || form.targetUserId.trim());

  // Sends the campaign after confirmation.
  async function handleSend() {
    setIsSending(true);
    setError(null);
    try {
      const body = { title: form.title.trim(), body: form.body.trim(), type: form.type, audience: form.audience };
      if (form.audience === 'SINGLE_USER') body.targetUserId = form.targetUserId.trim();
      const campaign = await sendCampaign(body);
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setIsConfirming(false);
      onSent(campaign);
    } catch (sendError) {
      setError(getErrorMessage(sendError));
      setFieldErrors(getFieldErrors(sendError));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="card">
      <h2>Send a notification</h2>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          setIsConfirming(true);
        }}
      >
        <label className="field">
          <span>Title (up to 80 characters)</span>
          <input value={form.title} maxLength={80} onChange={update('title')} aria-invalid={Boolean(fieldErrors.title)} />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={form.type} onChange={update('type')}>
            {CAMPAIGN_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatEnum(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="field field--wide">
          <span>Message (up to 500 characters)</span>
          <textarea rows={3} value={form.body} maxLength={500} onChange={update('body')} aria-invalid={Boolean(fieldErrors.body)} />
        </label>
        <label className="field">
          <span>Audience</span>
          <select value={form.audience} onChange={update('audience')}>
            {CAMPAIGN_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {formatEnum(audience)}
              </option>
            ))}
          </select>
        </label>
        {form.audience === 'SINGLE_USER' && (
          <label className="field">
            <span>Member id</span>
            <input value={form.targetUserId} placeholder="usr_…" onChange={update('targetUserId')} aria-invalid={Boolean(fieldErrors.targetUserId)} />
          </label>
        )}
        <p className="muted small field--wide">
          Members see this in their in-app inbox. Promotions only reach members who turned promotions on. Push delivery is not configured yet.
        </p>
        {error && !isConfirming && <p className="form-error field--wide">{error}</p>}
        <div className="field--wide">
          <button type="submit" className="button button--primary" disabled={!isComplete}>
            Review and send
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={isConfirming}
        title="Send notification?"
        message={`“${form.title.trim()}” will be sent to ${formatEnum(form.audience).toLowerCase()}. This cannot be undone.`}
        confirmLabel="Send"
        isBusy={isSending}
        error={error}
        onConfirm={handleSend}
        onCancel={() => setIsConfirming(false)}
      />
    </section>
  );
}

export default function NotificationsPage() {
  const { isAdmin } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '' });
  const list = usePaginatedList(listCampaigns, filters);
  const [notice, setNotice] = useState(null);

  function handleSearch(event) {
    event.preventDefault();
    setFilters({ q: searchText.trim() });
  }

  return (
    <div className="admin-page">
      <PageHeader title="Notifications" subtitle="Announcements and promotions sent to members." />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      <FilterToolbar>
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters({ q: '' })}
            placeholder="Title, message, campaign id or usr_…"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </form>
      </FilterToolbar>
      {isAdmin ? (
        <CampaignForm
          onSent={(campaign) => {
            setNotice(`Sent to ${campaign.recipientCount} member(s).`);
            list.reload();
          }}
        />
      ) : (
        <p className="muted">Only admins can send notifications.</p>
      )}

      <DataTablePanel title="Sent notifications" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No notifications sent yet."
          columns={['Title', 'Type', 'Audience', 'Recipients', 'Push', 'Sent by', 'Sent']}
          renderRow={(campaign) => (
            <tr key={campaign.id}>
              <td>
                <strong>{campaign.title}</strong>
                <div className="muted small">{campaign.body}</div>
              </td>
              <td>{formatEnum(campaign.type)}</td>
              <td>
                {formatEnum(campaign.audience)}
                {campaign.targetUserId && <div className="muted small">{campaign.targetUserId}</div>}
              </td>
              <td>{campaign.recipientCount}</td>
              <td>
                <StatusBadge value={campaign.pushStatus} />
              </td>
              <td>{campaign.createdBy?.displayName}</td>
              <td>{formatDateTime(campaign.createdAt)}</td>
            </tr>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
