// Support tickets with status chips, search and category filter.

import { useState } from 'react';
import { listTickets } from '../api/support.api.js';
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
import { TICKET_CATEGORIES } from '../utils/constants.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open', tone: 'danger' },
  { value: 'IN_PROGRESS', label: 'In progress', tone: 'warning' },
  { value: 'RESOLVED', label: 'Resolved', tone: 'success' },
  { value: 'CLOSED', label: 'Closed', tone: 'muted' },
];

export default function SupportPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', category: '' });
  const list = usePaginatedList(listTickets, filters);
  const setFilter = (field) => (value) => setFilters((current) => ({ ...current, [field]: value }));

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <div className="admin-page">
      <PageHeader title="Support" subtitle="Review member requests and manage support conversations." />
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
            placeholder="Search subject, ticket ID, or user ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect label="Category" value={filters.category} options={TICKET_CATEGORIES} onChange={setFilter('category')} />
        </form>
      </FilterToolbar>
      <DataTablePanel title="Tickets" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No tickets match these filters."
          columns={['Subject', 'Member', 'Category', 'Status', 'Messages', 'Last message', 'Created']}
          renderRow={(ticket) => (
            <LinkRow key={ticket.id} to={`/support/${ticket.id}`}>
              <td>{ticket.subject}</td>
              <td>
                <UserCell user={ticket.user} link={false} />
              </td>
              <td>{formatEnum(ticket.category)}</td>
              <td>
                <StatusBadge value={ticket.status} />
              </td>
              <td>{ticket.messageCount}</td>
              <td>
                {formatDateTime(ticket.lastMessageAt)} <span className="muted small">({formatEnum(ticket.lastMessageAuthor)})</span>
              </td>
              <td>{formatDateTime(ticket.createdAt)}</td>
            </LinkRow>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
