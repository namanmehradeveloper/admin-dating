// Promo coupons (ADMIN only).

import { useState } from 'react';
import { createCoupon, getCouponStats, listCoupons, updateCoupon } from '../api/coupons.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { COUPON_TYPES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDate, formatEnum, formatNumber } from '../utils/format.js';

function CreateCouponDialog({ open, onClose, onCreated }) {
  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENT');
  const [value, setValue] = useState(10);
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const body = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        isActive: true,
        eligibleTiers: ['FREE', 'PLUS'],
      };
      if (maxRedemptions !== '') body.maxRedemptions = Number(maxRedemptions);
      onCreated(await createCoupon(body));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Create coupon"
      confirmLabel="Create"
      isBusy={isSaving}
      error={error}
      confirmDisabled={code.trim().length < 3 || !Number.isFinite(Number(value))}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Code</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} maxLength={40} />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          {COUPON_TYPES.map((option) => (
            <option key={option} value={option}>
              {formatEnum(option)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Value</span>
        <input type="number" value={value} onChange={(event) => setValue(event.target.value)} min={0} />
      </label>
      <label className="field">
        <span>Max redemptions (optional)</span>
        <input type="number" value={maxRedemptions} onChange={(event) => setMaxRedemptions(event.target.value)} min={1} />
      </label>
    </ConfirmDialog>
  );
}

const STATE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active', tone: 'success' },
  { value: 'false', label: 'Inactive', tone: 'muted' },
];

export default function CouponsPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', isActive: '' });
  const stats = useApi(() => getCouponStats(), []);
  const list = usePaginatedList(listCoupons, filters);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function deactivate(id) {
    setBusyId(id);
    try {
      await updateCoupon(id, { isActive: false });
      setNotice('Coupon deactivated.');
      list.reload();
      stats.reload();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Offers & coupons"
        subtitle="Promo codes for plan discounts. No card data is stored."
        actions={
          <button type="button" className="button button--primary" onClick={() => setIsCreateOpen(true)}>
            New coupon
          </button>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : (
        <div className="stat-grid">
          <StatCard label="Total coupons" value={stats.data.total} />
          <StatCard label="Active" value={stats.data.active} />
          <StatCard label="Redemptions" value={formatNumber(stats.data.redemptionCount)} />
        </div>
      )}

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
        <form
          className="users-toolbar__form"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({ ...current, q: searchText.trim() }));
          }}
        >
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Coupon code…"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </form>
      </FilterToolbar>

      <DataTablePanel title="Coupons" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No coupons yet."
          columns={['Code', 'Type', 'Value', 'Redeemed', 'Active', 'Ends', 'Actions']}
          renderRow={(coupon) => (
            <tr key={coupon.id}>
              <td>
                <strong>{coupon.code}</strong>
              </td>
              <td>{formatEnum(coupon.type)}</td>
              <td>{coupon.type === 'PERCENT' ? `${coupon.value}%` : coupon.value}</td>
              <td>
                {coupon.redemptionCount}
                {coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ''}
              </td>
              <td>
                <StatusBadge value={coupon.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </td>
              <td>{formatDate(coupon.endsAt)}</td>
              <td>
                {coupon.isActive && (
                  <button type="button" className="button button--secondary button--small" disabled={busyId === coupon.id} onClick={() => deactivate(coupon.id)}>
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </DataTablePanel>

      {isCreateOpen && (
        <CreateCouponDialog
          open
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            setNotice('Coupon created.');
            list.reload();
            stats.reload();
          }}
        />
      )}
    </div>
  );
}
