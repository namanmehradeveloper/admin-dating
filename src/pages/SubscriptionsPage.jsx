// Stored subscription entitlements (ADMIN only, read-only).

import { useState } from 'react';
import { listSubscriptions } from '../api/subscriptions.api.js';
import FilterSelect from '../components/FilterSelect.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import LinkRow from '../components/LinkRow.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { formatDate, formatEnum } from '../utils/format.js';

const STATE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active', tone: 'success' },
  { value: 'false', label: 'Inactive', tone: 'muted' },
];

export default function SubscriptionsPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', isActive: '', tier: '' });
  const list = usePaginatedList(listSubscriptions, filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <div className="admin-page">
      <PageHeader title="Subscriptions" subtitle="Review member plans and entitlements from verified store purchases." />
      <Notice tone="warning">App Store / Google Play verification is not configured yet, so no new purchases can be recorded.</Notice>
      <FilterToolbar
        label="State"
        chips={STATE_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.isActive}
            onSelect={(isActive) => setFilters((current) => ({ ...current, isActive }))}
          />
        ))}
      >
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Search name, email, or user ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect label="Tier" value={filters.tier} options={['FREE', 'PLUS']} onChange={(tier) => setFilters((current) => ({ ...current, tier }))} />
        </form>
      </FilterToolbar>
      <DataTablePanel title="Subscriptions" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No subscriptions recorded yet."
          columns={['Member', 'Tier', 'Active', 'Product', 'Platform', 'Expires', 'Renews']}
          renderRow={(entitlement) => (
            <LinkRow key={entitlement.userId} to={`/subscriptions/${entitlement.userId}`}>
              <td>
                <UserCell user={entitlement.user} link={false} />
              </td>
              <td>
                <StatusBadge value={entitlement.tier} />
              </td>
              <td>{entitlement.isActive ? 'Yes' : 'No'}</td>
              <td>{entitlement.productId ?? '—'}</td>
              <td>{formatEnum(entitlement.platform)}</td>
              <td>{formatDate(entitlement.expiresAt)}</td>
              <td>{entitlement.willRenew ? 'Yes' : 'No'}</td>
            </LinkRow>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
