// A/B experiment definitions (ADMIN only). No fabricated conversion metrics.

import { useState } from 'react';
import { createExperiment, listExperiments, updateExperiment } from '../api/experiments.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

function CreateExperimentDialog({ open, onClose, onCreated }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      onCreated(
        await createExperiment({
          key: key.trim(),
          name: name.trim(),
          status: 'DRAFT',
          variants: [
            { key: 'control', weight: 50 },
            { key: 'treatment', weight: 50 },
          ],
          audiencePercent: 100,
          metrics: '',
        }),
      );
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Create experiment"
      confirmLabel="Create draft"
      isBusy={isSaving}
      error={error}
      confirmDisabled={key.trim().length < 2 || name.trim().length < 2}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Key</span>
        <input value={key} onChange={(event) => setKey(event.target.value)} placeholder="onboarding_v2" maxLength={64} />
      </label>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
      </label>
    </ConfirmDialog>
  );
}

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft', tone: 'muted' },
  { value: 'RUNNING', label: 'Running', tone: 'success' },
  { value: 'PAUSED', label: 'Paused', tone: 'warning' },
  { value: 'COMPLETED', label: 'Completed', tone: 'primary' },
];

export default function ExperimentsPage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '' });
  const list = usePaginatedList(listExperiments, filters);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function setStatus(id, status) {
    setBusyId(id);
    try {
      await updateExperiment(id, { status });
      setNotice(`Experiment ${formatEnum(status).toLowerCase()}.`);
      list.reload();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Growth & experiments"
        subtitle="Experiment definitions and rollout controls. Conversion metrics appear only when a measurement pipeline is connected."
        actions={
          <button type="button" className="button button--primary" onClick={() => setIsCreateOpen(true)}>
            New experiment
          </button>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      <FilterToolbar
        label="Status"
        chips={STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.status}
            onSelect={(status) => setFilters((current) => ({ ...current, status }))}
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
            placeholder="Name or key…"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </form>
      </FilterToolbar>

      <DataTablePanel title="Experiments" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No experiments yet."
          columns={['Name', 'Key', 'Status', 'Audience', 'Variants', 'Updated', 'Actions']}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td className="muted">{item.key}</td>
              <td>
                <StatusBadge value={item.status} />
              </td>
              <td>{item.audiencePercent}%</td>
              <td>
                {(item.variants ?? []).map((variant) => `${variant.key}:${variant.weight}`).join(', ') || '—'}
              </td>
              <td>{formatDateTime(item.updatedAt)}</td>
              <td className="stack-inline">
                {item.status === 'DRAFT' && (
                  <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'RUNNING')}>
                    Start
                  </button>
                )}
                {item.status === 'RUNNING' && (
                  <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'PAUSED')}>
                    Pause
                  </button>
                )}
                {['RUNNING', 'PAUSED'].includes(item.status) && (
                  <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'COMPLETED')}>
                    Complete
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </DataTablePanel>

      {isCreateOpen && (
        <CreateExperimentDialog
          open
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            setNotice('Experiment draft created.');
            list.reload();
          }}
        />
      )}
    </div>
  );
}
