// Deletion Management: ledger stats, tabbed queues, detail drawer, safe Retry for FAILED.

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Trash2 } from 'lucide-react';
import { getDeletionStats, listDeletionRecords } from '../api/deletions.api.js';
import DeletionDetailDrawer from '../components/deletions/DeletionDetailDrawer.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { formatDateTime } from '../utils/format.js';

const TABS = [
  { value: 'scheduled', label: 'Scheduled', tone: 'warning' },
  { value: 'ready', label: 'Ready to Purge', tone: 'danger' },
  { value: 'purged', label: 'Purged / History', tone: 'success' },
  { value: 'failed', label: 'Failed Jobs', tone: 'danger' },
];

const EMPTY_FILTERS = { tab: 'scheduled', q: '', source: '' };

const COLUMNS = {
  scheduled: ['Member', 'User ID', 'Reason', 'Scheduled by', 'Requested', 'Deletes on', 'Remaining', 'Status'],
  ready: ['Member', 'User ID', 'Reason', 'Scheduled by', 'Deletes on', 'Overdue', 'Status'],
  purged: ['Member', 'User ID', 'Reason', 'Scheduled by', 'Purged at', 'Retries', 'Status'],
  failed: ['Member', 'User ID', 'Failure reason', 'Last attempt', 'Retries', 'Status', ''],
};

export default function DeletionManagementPage() {
  const { hasPermission } = useAuth();
  const canRetry = hasPermission('DELETION_MANAGEMENT', 'EDIT');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState(null);

  const stats = useApi(() => getDeletionStats(), []);
  const list = usePaginatedList(listDeletionRecords, filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  function setTab(tab) {
    setSelectedId(null);
    setFilters((current) => ({ ...current, tab }));
  }

  function openRow(id) {
    setSelectedId(id);
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Deletion management"
        subtitle="Monitor scheduled deletions, cancel or retry failed jobs, and force-purge when authorized. Members are scheduled from Users; staff from Staff (Super Admin)."
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error && !stats.data ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.data ? (
        <div className="stat-grid stat-grid--kpi">
          <StatCard label="Scheduled" icon={Clock3} tone="warning" value={stats.data.scheduled} />
          <StatCard label="Ready to purge" icon={Trash2} tone="danger" value={stats.data.readyToPurge} />
          <StatCard
            label="Successfully purged"
            icon={CheckCircle2}
            tone="success"
            value={stats.data.successfullyPurged}
          />
          <StatCard label="Failed jobs" icon={AlertTriangle} tone="danger" value={stats.data.failedJobs} />
        </div>
      ) : null}

      <FilterToolbar
        label="Deletion tabs"
        chips={TABS.map((tab) => (
          <FilterChip
            key={tab.value}
            value={tab.value}
            selected={filters.tab}
            onSelect={setTab}
            label={tab.label}
            tone={tab.tone}
          />
        ))}
      >
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            placeholder="Search name, email, user id, reason"
          />
          <FilterSelect
            label="Source"
            value={filters.source}
            onChange={(source) => setFilters((current) => ({ ...current, source }))}
            allLabel="All sources"
            options={['ADMIN', 'MEMBER']}
          />
          <button type="submit" className="button button--secondary">
            Search
          </button>
        </form>
      </FilterToolbar>

      <ListView
        list={list}
        columns={COLUMNS[filters.tab] ?? COLUMNS.scheduled}
        emptyMessage={
          filters.tab === 'failed'
            ? 'No failed purge jobs.'
            : filters.tab === 'purged'
              ? 'No purged accounts in history yet.'
              : filters.tab === 'ready'
                ? 'No accounts are ready to purge.'
                : 'No scheduled deletions.'
        }
        renderRow={(row) => (
          <tr key={row.id} className="table__row--clickable" onClick={() => openRow(row.id)}>
            <td>
              <UserCell
                user={{
                  id: row.userId,
                  displayName: row.displayName,
                  email: row.email,
                  status: filters.tab === 'purged' || row.status === 'PURGED' ? 'DELETED' : undefined,
                }}
                subtitle={row.email}
              />
            </td>
            <td>
              <code className="small">{row.userId}</code>
            </td>
            {filters.tab === 'failed' ? (
              <>
                <td>{row.lastError || '—'}</td>
                <td>{row.lastAttemptAt ? formatDateTime(row.lastAttemptAt) : '—'}</td>
                <td>{row.retryCount}</td>
                <td>
                  <StatusBadge value={row.status} />
                </td>
                <td>
                  {canRetry && (
                    <button
                      type="button"
                      className="button button--secondary button--small"
                      onClick={(event) => {
                        event.stopPropagation();
                        openRow(row.id);
                      }}
                    >
                      Review
                    </button>
                  )}
                </td>
              </>
            ) : filters.tab === 'purged' ? (
              <>
                <td>{row.reason || '—'}</td>
                <td>{row.scheduledBy ? <UserCell user={row.scheduledBy} /> : row.source === 'ADMIN' ? 'Admin' : 'Member'}</td>
                <td>{row.purgedAt ? formatDateTime(row.purgedAt) : '—'}</td>
                <td>{row.retryCount}</td>
                <td>
                  <StatusBadge value={row.status} />
                </td>
              </>
            ) : filters.tab === 'ready' ? (
              <>
                <td>{row.reason || '—'}</td>
                <td>{row.scheduledBy ? <UserCell user={row.scheduledBy} /> : row.source === 'ADMIN' ? 'Admin' : 'Member'}</td>
                <td>{formatDateTime(row.scheduledFor)}</td>
                <td>{row.remainingLabel}</td>
                <td>
                  <StatusBadge value={row.status === 'SCHEDULED' ? 'READY' : row.status} />
                </td>
              </>
            ) : (
              <>
                <td>{row.reason || '—'}</td>
                <td>{row.scheduledBy ? <UserCell user={row.scheduledBy} /> : row.source === 'ADMIN' ? 'Admin' : 'Member'}</td>
                <td>{formatDateTime(row.requestedAt)}</td>
                <td>{formatDateTime(row.scheduledFor)}</td>
                <td>{row.remainingLabel}</td>
                <td>
                  <StatusBadge value={row.status} />
                </td>
              </>
            )}
          </tr>
        )}
      />

      {selectedId && (
        <DeletionDetailDrawer
          recordId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={(updated, action) => {
            const messages = {
              retry: updated.status === 'PURGED' ? 'Purge retry succeeded. Account erased.' : 'Purge retry finished.',
              cancel: 'Scheduled deletion cancelled.',
              purge: 'Account force-purged.',
            };
            setNotice(messages[action] ?? 'Deletion record updated.');
            list.reload();
            stats.reload();
          }}
        />
      )}
    </div>
  );
}
