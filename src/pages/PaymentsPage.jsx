// Payment transactions ledger + demo/provider settings (ADMIN only).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPaymentsStats, getPaymentsStatus, listPayments } from '../api/payments.api.js';
import DetailList from '../components/DetailList.jsx';
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
import { formatDateTime, formatEnum, formatMoney, formatNumber } from '../utils/format.js';

const KIND_CHIPS = [
  { value: '', label: 'All' },
  { value: 'demo', label: 'Demo', tone: 'warning' },
  { value: 'real', label: 'Real', tone: 'success' },
];

export default function PaymentsPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', kind: '', status: '', provider: '' });
  const status = useApi(() => getPaymentsStatus(), []);
  const stats = useApi(() => getPaymentsStats({ days: 30 }), []);
  const list = usePaginatedList(listPayments, filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Payments & transactions"
        subtitle="Server-verified checkout ledger. Demo rows are labelled and excluded from revenue."
        actions={
          <Link className="button button--ghost" to="/subscriptions">
            Subscriptions
          </Link>
        }
      />

      {status.error ? <ErrorState message={status.error} onRetry={status.reload} /> : null}
      {stats.error ? <ErrorState message={stats.error} onRetry={stats.reload} /> : null}

      <div className="grid-2">
        <section className="card">
          <div className="card__header">
            <h2>Demo payment settings</h2>
            {status.data ? <StatusBadge value={status.data.demoPaymentsEnabled ? 'ACTIVE' : 'OFF'} /> : null}
          </div>
          {status.isLoading && !status.data ? (
            <LoadingState />
          ) : status.data ? (
            <DetailList
              rows={[
                ['DEMO_PAYMENTS_ENABLED', status.data.demoPaymentsEnabled ? 'true' : 'false'],
                ['Active provider', formatEnum(status.data.provider)],
                ['Provider environment', formatEnum(status.data.environment)],
                ['Demo webhook secret', status.data.demoWebhookConfigured ? 'Configured' : 'Not set'],
                ['Razorpay keys', status.data.razorpayConfigured ? `Configured (${status.data.razorpayEnvironment})` : 'Not configured'],
                ['Billing ready', status.data.configured ? 'Yes' : 'No'],
              ]}
            />
          ) : null}
          <p className="muted small section-gap">
            Toggle demo via backend env (`PAYMENT_PROVIDER`, `DEMO_PAYMENTS_ENABLED`). Secrets are never shown here.
          </p>
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Last 30 days</h2>
          </div>
          {stats.isLoading && !stats.data ? (
            <LoadingState />
          ) : stats.data ? (
            <div className="stat-grid stat-grid--compact">
              <StatCard label="Transactions" value={formatNumber(stats.data.total)} />
              <StatCard label="Succeeded" value={formatNumber(stats.data.byStatus.SUCCEEDED)} />
              <StatCard label="Failed" value={formatNumber(stats.data.byStatus.FAILED)} />
              <StatCard label="Pending" value={formatNumber(stats.data.byStatus.PENDING)} />
              <StatCard
                label="Real revenue"
                value={formatMoney(stats.data.revenue.amountMinor, stats.data.revenue.currency)}
                hint={`${formatNumber(stats.data.revenue.paymentCount)} payments · demo excluded`}
              />
              <StatCard
                label="Demo volume"
                value={formatMoney(stats.data.demoVolume.amountMinor, stats.data.demoVolume.currency)}
                hint="Simulated only — not revenue"
              />
            </div>
          ) : null}
        </section>
      </div>

      <Notice tone="info">
        Demo: {formatNumber(stats.data?.byKind?.demo || 0)} · Real: {formatNumber(stats.data?.byKind?.real || 0)}. Filter below to
        inspect either ledger.
      </Notice>

      <FilterToolbar
        label="Kind"
        chips={KIND_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.kind}
            onSelect={(kind) => setFilters((current) => ({ ...current, kind }))}
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
            placeholder="User, checkout ID, or transaction ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect
            label="Status"
            value={filters.status}
            options={['SUCCEEDED', 'FAILED', 'PENDING', 'CANCELLED', 'REFUNDED']}
            onChange={(status) => setFilters((current) => ({ ...current, status }))}
          />
          <FilterSelect
            label="Provider"
            value={filters.provider}
            options={['demo', 'razorpay']}
            onChange={(provider) => setFilters((current) => ({ ...current, provider }))}
          />
        </form>
      </FilterToolbar>

      <DataTablePanel title="Transactions" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No payments match these filters."
          columns={['Member', 'Amount', 'Status', 'Kind', 'Product', 'Transaction', 'When']}
          renderRow={(payment) => (
            <LinkRow key={payment.id} to={`/payments/${payment.id}`}>
              <td>
                <UserCell user={payment.user} link={false} />
              </td>
              <td>{formatMoney(payment.amountMinor, payment.currency)}</td>
              <td>
                <StatusBadge value={payment.status} />
              </td>
              <td>
                <StatusBadge value={payment.isDemo ? 'DEMO' : 'REAL'} />
              </td>
              <td>{payment.productId}</td>
              <td>
                <div className="stack-tight">
                  <code className="mono small">{payment.id}</code>
                  <span className="muted small">{payment.checkoutId}</span>
                </div>
              </td>
              <td>{formatDateTime(payment.verifiedAt || payment.createdAt)}</td>
            </LinkRow>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
