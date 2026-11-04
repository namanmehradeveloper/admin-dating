// Rule-based fraud signals. External AI providers are marked not configured.

import { useState } from 'react';
import { getFraudStatus, listFraudSignals, scanFraudUser, updateFraudSignal } from '../api/fraud.api.js';
import ErrorState from '../components/ErrorState.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open', tone: 'danger' },
  { value: 'REVIEWED', label: 'Reviewed', tone: 'warning' },
  { value: 'DISMISSED', label: 'Dismissed', tone: 'muted' },
];

export default function FraudPage() {
  const status = useApi(() => getFraudStatus(), []);
  const [filters, setFilters] = useState({ status: 'OPEN', userId: '' });
  const list = usePaginatedList(listFraudSignals, filters);
  const [scanUserId, setScanUserId] = useState('');
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function handleScan(event) {
    event.preventDefault();
    const userId = scanUserId.trim();
    if (!userId) return;
    setBusyId('scan');
    setNotice(null);
    try {
      const result = await scanFraudUser(userId);
      setNotice(`Scan complete. Score ${result.totalScore} with ${result.signals?.length ?? 0} signal(s).`);
      list.reload();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function setSignalStatus(id, nextStatus) {
    setBusyId(id);
    try {
      await updateFraudSignal(id, { status: nextStatus });
      setNotice(`Signal marked ${formatEnum(nextStatus)}.`);
      list.reload();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader title="AI & fraud detection" subtitle="Local rule-based risk scoring. Third-party AI is not invented or faked." />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      {status.isLoading && !status.data ? (
        <LoadingState />
      ) : status.error ? (
        <ErrorState message={status.error} onRetry={status.reload} />
      ) : (
        <Notice tone={status.data.configured ? 'success' : 'warning'}>
          Provider: {status.data.configured ? status.data.provider : 'Not configured'}. Active modes: {(status.data.modes ?? []).join(', ')}.
        </Notice>
      )}

      <FilterToolbar
        label="Status"
        chips={STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.status}
            onSelect={(next) => setFilters((current) => ({ ...current, status: next }))}
          />
        ))}
      >
        <form className="users-toolbar__form" onSubmit={handleScan}>
          <SearchField
            value={scanUserId}
            onChange={setScanUserId}
            onClear={() => setFilters((current) => ({ ...current, userId: '' }))}
            placeholder="usr_… to scan or filter"
            maxLength={64}
          />
          <button type="submit" className="button button--primary" disabled={busyId === 'scan'}>
            Run rules
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setFilters((current) => ({ ...current, userId: scanUserId.trim() }))}
          >
            Filter
          </button>
        </form>
      </FilterToolbar>

      <DataTablePanel title="Risk signals" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No risk signals match these filters."
          columns={['Member', 'Score', 'Signals', 'Status', 'Updated', 'Actions']}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>
                <UserCell user={item.user} />
              </td>
              <td>{item.totalScore}</td>
              <td>
                {(item.signals ?? []).map((signal) => (
                  <div key={signal.code} className="small">
                    {formatEnum(signal.code)} ({signal.score}) — {signal.detail}
                  </div>
                ))}
                {(item.signals ?? []).length === 0 && <span className="muted">None</span>}
              </td>
              <td>
                <StatusBadge value={item.status} />
              </td>
              <td>{formatDateTime(item.updatedAt)}</td>
              <td className="stack-inline">
                {item.status === 'OPEN' && (
                  <>
                    <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setSignalStatus(item.id, 'REVIEWED')}>
                      Reviewed
                    </button>
                    <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setSignalStatus(item.id, 'DISMISSED')}>
                      Dismiss
                    </button>
                  </>
                )}
              </td>
            </tr>
          )}
        />
      </DataTablePanel>
    </div>
  );
}
