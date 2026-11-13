// Subscription dashboard + searchable entitlement management (ADMIN only).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubscriptionStats, listSubscriptions } from '../api/subscriptions.api.js';
import ErrorState from '../components/ErrorState.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import LinkRow from '../components/LinkRow.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { formatDate, formatEnum, formatNumber } from '../utils/format.js';

const STATE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active Plus', tone: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'warning' },
  { value: 'EXPIRED', label: 'Expired', tone: 'muted' },
];

export default function SubscriptionsPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', lifecycle: '', tier: '', provider: '' });
  const stats = useApi(() => getSubscriptionStats(), []);
  const list = usePaginatedList(listSubscriptions, filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Subscriptions"
        subtitle="Live Free / Plus counts and member entitlements from verified payments."
        actions={
          <div className="button-row">
            <Link className="button button--ghost" to="/subscriptions/analytics">
              Analytics
            </Link>
            <Link className="button button--ghost" to="/subscriptions/plans">
              Plans
            </Link>
            <Link className="button button--primary" to="/payments">
              Payments
            </Link>
          </div>
        }
      />

      {stats.error ? <ErrorState message={stats.error} onRetry={stats.reload} /> : null}
      {stats.isLoading && !stats.data ? <LoadingState /> : null}
      {stats.data ? (
        <div className="stat-grid">
          <StatCard label="Free members" value={formatNumber(stats.data.free)} hint={`of ${formatNumber(stats.data.totalMembers)} total`} />
          <StatCard label="Active Plus" value={formatNumber(stats.data.activePlus)} />
          <StatCard label="Expired" value={formatNumber(stats.data.expired)} />
          <StatCard label="Cancelled" value={formatNumber(stats.data.cancelled)} hint="Auto-renew turned off" />
        </div>
      ) : null}

      {stats.data?.billing?.configured ? (
        <Notice tone="info">
          Active provider: <strong>{formatEnum(stats.data.billing.provider)}</strong>
          {stats.data.billing.environment ? ` · ${formatEnum(stats.data.billing.environment)}` : ''}. Demo charges never count as revenue.
        </Notice>
      ) : (
        <Notice tone="warning">Payment provider is not configured. Entitlements stay read-only until checkout is enabled.</Notice>
      )}

      <FilterToolbar
        label="Lifecycle"
        chips={STATE_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.lifecycle}
            onSelect={(lifecycle) => setFilters((current) => ({ ...current, lifecycle }))}
          />
        ))}
      >
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => {
              setSearchText('');
              setFilters((current) => ({ ...current, q: '' }));
            }}
            placeholder="Search name, email, or user ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect
            label="Tier"
            value={filters.tier}
            options={['FREE', 'PLUS']}
            onChange={(tier) => setFilters((current) => ({ ...current, tier }))}
          />
          <FilterSelect
            label="Provider"
            value={filters.provider}
            options={['demo', 'razorpay', 'apple', 'google']}
            onChange={(provider) => setFilters((current) => ({ ...current, provider }))}
          />
        </form>
      </FilterToolbar>

      <DataTablePanel title="Members" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No subscription records match these filters."
          columns={['Member', 'Plan', 'Provider', 'Status', 'Activated', 'Expires', 'Demo']}
          renderRow={(entitlement) => (
            <LinkRow key={entitlement.userId} to={`/subscriptions/${entitlement.userId}`}>
              <td>
                <UserCell user={entitlement.user} link={false} />
              </td>
              <td>
                <div className="stack-tight">
                  <StatusBadge value={entitlement.tier} />
                  <span className="muted small">{entitlement.productId || '—'}</span>
                </div>
              </td>
              <td>{formatEnum(entitlement.provider)}</td>
              <td>
                <StatusBadge value={entitlement.lifecycleStatus || (entitlement.isActive ? 'ACTIVE' : 'INACTIVE')} />
              </td>
              <td>{formatDate(entitlement.activatedAt)}</td>
              <td>{formatDate(entitlement.expiresAt)}</td>
              <td>{entitlement.isDemo ? 'DEMO' : 'Real'}</td>
            </LinkRow>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
