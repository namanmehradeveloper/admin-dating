// Selfie verification queue — status chips, sort, selfie preview, paginated table.

import { useMemo, useState } from 'react';
import { listVerifications } from '../api/verifications.api.js';
import DataTablePanel from '../components/DataTablePanel.jsx';
import LinkRow from '../components/LinkRow.jsx';
import ListView from '../components/ListView.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { VERIFICATION_SORT_OPTIONS } from '../utils/constants.js';
import { formatDateTime, formatNumber } from '../utils/format.js';

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'APPROVED', label: 'Approved', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
];

function parseSort(value) {
  const [sortBy, sortDir] = String(value || 'createdAt:asc').split(':');
  return { sortBy: sortBy || 'createdAt', sortDir: sortDir || 'asc' };
}

export default function VerificationsPage() {
  const [status, setStatus] = useState('PENDING');
  const [sortValue, setSortValue] = useState('createdAt:asc');
  const [searchText, setSearchText] = useState('');
  const [q, setQ] = useState('');
  const filters = useMemo(() => {
    const { sortBy, sortDir } = parseSort(sortValue);
    return { status, sortBy, sortDir, q };
  }, [status, sortValue, q]);
  const list = usePaginatedList(listVerifications, filters);

  function handleSearch(event) {
    event.preventDefault();
    setQ(searchText.trim());
  }

  return (
    <div className="verifications-page admin-page">
      <PageHeader
        title="Verifications"
        subtitle="Compare each selfie with the member's profile photos, then approve or reject."
      />

      <section className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Verification status">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.value || 'all'}
              type="button"
              role="tab"
              aria-selected={status === chip.value}
              className={`users-chip ${chip.tone ? `users-chip--${chip.tone}` : ''} ${status === chip.value ? 'is-active' : ''}`}
              onClick={() => setStatus(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setQ('')}
            placeholder="Search name, email, user ID, or verification ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <label className="field field--inline">
            <span>Sort</span>
            <select value={sortValue} onChange={(event) => setSortValue(event.target.value)}>
              {VERIFICATION_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <DataTablePanel
        title="Verification queue"
        subtitle={
          list.isLoading
            ? 'Loading…'
            : `Page ${list.page} · ${formatNumber(list.items.length)} shown${status ? ` · ${status}` : ''}`
        }
      >
        <ListView
          list={list}
          emptyMessage={
            status === 'PENDING'
              ? 'No pending verification requests. Nice work.'
              : 'No verification requests match this filter.'
          }
          tableClassName="verifications-table"
          columns={[
            { key: 'selfie', label: 'Selfie', className: 'verifications-col verifications-col--selfie' },
            { key: 'member', label: 'Member', className: 'verifications-col verifications-col--member' },
            { key: 'status', label: 'Status', className: 'verifications-col verifications-col--status' },
            { key: 'submitted', label: 'Submitted', className: 'verifications-col verifications-col--date' },
            { key: 'reviewed', label: 'Reviewed', className: 'verifications-col verifications-col--date' },
          ]}
          renderRow={(request) => (
            <LinkRow key={request.id} to={`/verifications/${request.id}`}>
              <td className="verifications-col verifications-col--selfie">
                {request.selfieUrl ? (
                  <img src={request.selfieUrl} alt="" className="verifications-thumb" loading="lazy" />
                ) : (
                  <span className="verifications-thumb verifications-thumb--empty" aria-hidden>
                    —
                  </span>
                )}
              </td>
              <td className="verifications-col verifications-col--member">
                <UserCell user={request.user} link={false} />
              </td>
              <td className="verifications-col verifications-col--status">
                <StatusBadge value={request.status} />
              </td>
              <td className="verifications-col verifications-col--date">{formatDateTime(request.submittedAt)}</td>
              <td className="verifications-col verifications-col--date">
                {request.reviewedAt ? formatDateTime(request.reviewedAt) : <span className="muted">—</span>}
              </td>
            </LinkRow>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
