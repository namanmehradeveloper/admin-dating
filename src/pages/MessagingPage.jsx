// Messaging metadata: volume stats + who ↔ whom conversation list (never message text).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMessagingStats, listConversations } from '../api/messaging.api.js';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import SegmentedControl from '../components/SegmentedControl.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { formatDateTime, formatNumber } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function MessagingPage() {
  const [days, setDays] = useState(7);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '' });

  const stats = useApi(() => getMessagingStats({ days }), [days]);
  const list = usePaginatedList(listConversations, filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <div className="messaging-page">
      <PageHeader
        title="Chat & messaging"
        subtitle="Who is chatting with whom — metadata only. Message text is never shown."
        actions={<SegmentedControl label="Stats range" options={RANGES} value={days} onChange={setDays} />}
      />

      <Notice>
        Private conversation text stays private. To review a specific message, open a MESSAGE report in the{' '}
        <Link to="/reports">Reports</Link> queue.
      </Notice>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error && !stats.data ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.data ? (
        <div className="stat-grid">
          <StatCard label={`Conversations (${days}d)`} value={stats.data.conversationCount} />
          <StatCard label="Active conversations" value={stats.data.activeConversations} />
          <StatCard label={`Messages (${days}d)`} value={stats.data.messageCount} />
          <StatCard label="Avg messages / active match" value={formatNumber(stats.data.avgMessagesPerActiveMatch)} />
        </div>
      ) : null}

      <section className="users-toolbar card">
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Name, user id, cnv_… or mat_…"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <label className="field field--inline">
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <DataTablePanel
        title="Conversations"
        subtitle={
          list.isLoading
            ? 'Loading…'
            : `Page ${list.page} · ${formatNumber(list.items.length)} shown · Member A ↔ Member B`
        }
      >
        <ListView
          list={list}
          emptyMessage="No conversations match these filters."
          columns={['Member A', 'Member B', 'Messages', 'Last sender', 'Last activity', 'Status']}
          renderRow={(row) => (
            <tr key={row.id} className="table__row">
              <td>
                <UserCell user={row.memberA} />
              </td>
              <td>
                <UserCell user={row.memberB} />
              </td>
              <td>
                <strong>{formatNumber(row.messageCount)}</strong>
                {row.lastHadAttachment ? (
                  <span className="badge badge--neutral badge--flush">
                    Media
                  </span>
                ) : null}
              </td>
              <td>{row.lastSender ? <UserCell user={row.lastSender} /> : <span className="muted">—</span>}</td>
              <td className="users-row__date">{formatDateTime(row.lastActivityAt || row.lastMessageAt)}</td>
              <td>
                <StatusBadge value={row.status} />
              </td>
            </tr>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
