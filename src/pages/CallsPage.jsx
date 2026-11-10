// Voice/video call ops: volume stats + call metadata. Never shows media or Agora tokens.

import { useState } from 'react';
import { getCallsStats, getCallsStatus, listCalls } from '../api/calls.api.js';
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
import { CALL_STATUSES, CALL_TYPES } from '../utils/constants.js';
import { formatDateTime, formatDuration, formatNumber } from '../utils/format.js';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  ...CALL_TYPES.map((type) => ({ value: type, label: type === 'AUDIO' ? 'Audio' : 'Video' })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...CALL_STATUSES.map((status) => ({ value: status, label: status.replaceAll('_', ' ') })),
];

export default function CallsPage() {
  const [days, setDays] = useState(7);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', type: '', status: '' });

  const status = useApi(() => getCallsStatus(), []);
  const stats = useApi(() => getCallsStats({ days }), [days]);
  const list = usePaginatedList(listCalls, filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  const configured = status.data?.configured === true;

  return (
    <div className="calls-page">
      <PageHeader
        title="Voice & video calls"
        subtitle="Call metadata and volume only. Admin never joins, listens, or records live media."
        actions={<SegmentedControl label="Stats range" options={RANGES} value={days} onChange={setDays} />}
      />

      {status.data && !configured ? (
        <Notice tone="warning">
          {status.data.reason || 'Agora voice/video calling credentials are not configured.'} History below
          still shows any past call records.
        </Notice>
      ) : (
        <Notice>
          Live audio/video streams stay private. This page shows who called whom, type, status, and duration —
          never raw media.
        </Notice>
      )}

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error && !stats.data ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.data ? (
        <div className="stat-grid">
          <StatCard label={`Total calls (${days}d)`} value={stats.data.total} />
          <StatCard label="Audio" value={stats.data.audio} />
          <StatCard label="Video" value={stats.data.video} />
          <StatCard label="Active now" value={stats.data.activeNow} />
          <StatCard label="Answered / ended" value={stats.data.answered} />
          <StatCard label="Missed" value={stats.data.missed} />
          <StatCard label="Rejected" value={stats.data.rejected} />
          <StatCard
            label="Avg duration"
            value={stats.data.avgDurationSeconds == null ? '—' : formatDuration(stats.data.avgDurationSeconds)}
          />
        </div>
      ) : null}

      <section className="users-toolbar card">
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Search member ID, name, email, or conversation ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <label className="field field--inline">
            <span>Type</span>
            <select
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value || 'all-types'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--inline">
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all-statuses'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <DataTablePanel
        title="Call history"
        subtitle={
          list.isLoading
            ? 'Loading…'
            : `Page ${list.page} · ${formatNumber(list.items.length)} shown · Caller ↔ Callee`
        }
      >
        <ListView
          list={list}
          emptyMessage="No calls match these filters."
          columns={['Type', 'Status', 'Caller', 'Callee', 'Started', 'Duration', 'Conversation']}
          renderRow={(row) => (
            <tr key={row.id} className="table__row">
              <td>
                <StatusBadge value={row.type} />
              </td>
              <td>
                <StatusBadge value={row.status} />
              </td>
              <td>
                <UserCell user={row.caller} />
              </td>
              <td>
                <UserCell user={row.callee} />
              </td>
              <td className="users-row__date">{formatDateTime(row.createdAt)}</td>
              <td>{formatDuration(row.durationSeconds)}</td>
              <td>
                <code className="mono">{row.conversationId}</code>
              </td>
            </tr>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
