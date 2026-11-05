import { useState } from 'react';
import { listLoginActivity } from '../api/loginActivity.api.js';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import UserCell from '../components/UserCell.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

const EMPTY_FILTERS = { q: '', fromDate: '', toDate: '' };

function locationFor(entry) {
  return [entry.city, entry.state, entry.country].filter(Boolean).join(', ') || 'Unavailable';
}

export default function LoginActivityPage() {
  const [form, setForm] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const list = usePaginatedList(listLoginActivity, filters);
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const hasFilters = Object.values(filters).some(Boolean);

  function applyFilters(event) {
    event.preventDefault();
    setFilters({ q: form.q.trim(), fromDate: form.fromDate, toDate: form.toDate });
  }

  function clearFilters() {
    setForm(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  }

  return (
    <div className="login-activity-page admin-page">
      <PageHeader
        title="Login activity"
        subtitle="Review successful sign-ins across user accounts."
      />

      <section className="users-toolbar card">
        <form className="users-toolbar__form" onSubmit={applyFilters}>
          <SearchField
            label="Search user"
            name="q"
            value={form.q}
            onChange={(value) => setForm((current) => ({ ...current, q: value }))}
            placeholder="Name, email, phone or user ID"
            maxLength={100}
          />
          <label className="field field--inline">
            <span>From date</span>
            <input type="date" value={form.fromDate} onChange={setField('fromDate')} />
          </label>
          <label className="field field--inline">
            <span>To date</span>
            <input type="date" value={form.toDate} onChange={setField('toDate')} />
          </label>
          <button type="submit" className="button button--primary">
            Apply
          </button>
          {hasFilters && (
            <button type="button" className="button button--secondary" onClick={clearFilters}>
              Clear
            </button>
          )}
        </form>
      </section>

      <DataTablePanel
        title="Login records"
        subtitle={
          list.isLoading
            ? 'Loading…'
            : `Page ${list.page} · ${formatNumber(list.items.length)} shown${hasFilters ? ' · filtered' : ''}`
        }
      >
        <ListView
          list={list}
          emptyMessage={hasFilters ? 'No login records match these filters.' : 'No login records yet.'}
          tableClassName="login-activity-table"
          columns={[
            { key: 'user', label: 'User' },
            { key: 'ip', label: 'IP address' },
            { key: 'location', label: 'Location' },
            { key: 'device', label: 'Device' },
            { key: 'browser', label: 'Browser & OS' },
            { key: 'when', label: 'Login date & time' },
          ]}
          renderRow={(entry) => (
            <tr key={entry.id}>
              <td><UserCell user={entry.user} link={false} subtitle={entry.user?.id} /></td>
              <td>{entry.ipAddress || '—'}</td>
              <td>{locationFor(entry)}</td>
              <td>{entry.deviceName || 'Unknown'} <span className="muted">· {formatEnum(entry.deviceType)}</span></td>
              <td>{entry.browser || 'Unknown'} <span className="muted">· {entry.operatingSystem || 'Unknown'}</span></td>
              <td>{formatDateTime(entry.loginAt)}</td>
            </tr>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
