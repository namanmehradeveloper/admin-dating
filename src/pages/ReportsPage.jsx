// Moderation queue with status chips, search and type/reason filters.

import { useState } from 'react';
import { listReports } from '../api/reports.api.js';
import FilterSelect from '../components/FilterSelect.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import LinkRow from '../components/LinkRow.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { REPORT_REASONS, REPORT_TARGET_TYPES } from '../utils/constants.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open', tone: 'danger' },
  { value: 'IN_REVIEW', label: 'In review', tone: 'warning' },
  { value: 'ACTIONED', label: 'Actioned', tone: 'success' },
  { value: 'DISMISSED', label: 'Dismissed', tone: 'muted' },
];

export default function ReportsPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', status: 'OPEN', targetType: '', reason: '' });
  const list = usePaginatedList(listReports, filters);
  const setFilter = (field) => (value) => setFilters((current) => ({ ...current, [field]: value }));

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <div className="admin-page">
      <PageHeader title="Reports" subtitle="Reports filed by members about profiles, photos and messages." />
      <FilterToolbar
        label="Status"
        chips={STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.status}
            onSelect={setFilter('status')}
          />
        ))}
      >
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Search report, user, or target ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect label="Type" value={filters.targetType} options={REPORT_TARGET_TYPES} onChange={setFilter('targetType')} />
          <FilterSelect label="Reason" value={filters.reason} options={REPORT_REASONS} onChange={setFilter('reason')} />
        </form>
      </FilterToolbar>
      <DataTablePanel title="Reports" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No reports match these filters."
          columns={['Reason', 'Type', 'Reported user', 'Reported by', 'Assigned to', 'Status', 'Created']}
          renderRow={(report) => (
            <LinkRow key={report.id} to={`/reports/${report.id}`}>
              <td>{formatEnum(report.reason)}</td>
              <td>{formatEnum(report.targetType)}</td>
              <td>
                <UserCell user={report.reportedUser} link={false} />
              </td>
              <td>
                <UserCell user={report.reporter} link={false} />
              </td>
              <td>{report.assignedModerator?.displayName ?? <span className="muted">Unassigned</span>}</td>
              <td>
                <StatusBadge value={report.status} />
              </td>
              <td>{formatDateTime(report.createdAt)}</td>
            </LinkRow>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
