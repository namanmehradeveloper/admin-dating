// Referral codes (ADMIN only).

import { useState } from 'react';
import { createReferral, getReferralStats, listReferrals, updateReferral } from '../api/referrals.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FilterToolbar from '../components/FilterToolbar.jsx';
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
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatNumber } from '../utils/format.js';

function CreateReferralDialog({ open, onClose, onCreated }) {
  const [code, setCode] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      onCreated(await createReferral({ code: code.trim().toUpperCase(), ownerUserId: ownerUserId.trim() }));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Create referral code"
      confirmLabel="Create"
      isBusy={isSaving}
      error={error}
      confirmDisabled={code.trim().length < 3 || !ownerUserId.trim().startsWith('usr_')}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Code</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} maxLength={40} />
      </label>
      <label className="field">
        <span>Owner user id</span>
        <input value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)} placeholder="Enter user ID" maxLength={64} />
      </label>
    </ConfirmDialog>
  );
}

export default function ReferralsPage() {
  const stats = useApi(() => getReferralStats(), []);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '' });
  const list = usePaginatedList(listReferrals, filters);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function handleSearch(event) {
    event.preventDefault();
    setFilters({ q: searchText.trim() });
  }

  async function deactivate(id) {
    setBusyId(id);
    try {
      await updateReferral(id, { isActive: false });
      setNotice('Referral deactivated.');
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
        title="Referrals & rewards"
        subtitle="Referral codes and conversion counts. Reward payouts are configuration only until billing is connected."
        actions={
          <button type="button" className="button button--primary" onClick={() => setIsCreateOpen(true)}>
            New code
          </button>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <FilterToolbar>
        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters({ q: '' })}
            placeholder="Search code, owner, email, or user ID"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </form>
      </FilterToolbar>

      {stats.isLoading && !stats.data ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : (
        <div className="stat-grid">
          <StatCard label="Codes" value={stats.data.total} />
          <StatCard label="Active" value={stats.data.active} />
          <StatCard label="Invites" value={formatNumber(stats.data.inviteCount)} />
          <StatCard label="Conversions" value={formatNumber(stats.data.conversionCount)} />
        </div>
      )}

      <DataTablePanel title="Referral codes" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No referral codes yet."
          columns={['Code', 'Owner', 'Invites', 'Conversions', 'Active', 'Created', 'Actions']}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.code}</strong>
              </td>
              <td>
                <UserCell user={item.owner} />
              </td>
              <td>{item.inviteCount}</td>
              <td>{item.conversionCount}</td>
              <td>
                <StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </td>
              <td>{formatDateTime(item.createdAt)}</td>
              <td>
                {item.isActive && (
                  <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => deactivate(item.id)}>
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </DataTablePanel>

      {isCreateOpen && (
        <CreateReferralDialog
          open
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            setNotice('Referral code created.');
            list.reload();
            stats.reload();
          }}
        />
      )}
    </div>
  );
}
