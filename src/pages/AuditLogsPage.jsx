// Audit trail of staff actions (ADMIN only). Filterable table + detail drawer.

import { useCallback, useState } from 'react';
import { listAuditLogs } from '../api/audit.api.js';
import AuditLogDrawer from '../components/audit/AuditLogDrawer.jsx';
import { AuditSummary, AuditTarget } from '../components/audit/auditFormat.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../utils/constants.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

const EMPTY_FILTERS = { action: '', targetType: '', actorId: '', targetId: '' };

const TARGET_CHIPS = [
  { value: '', label: 'All' },
  { value: 'USER', label: 'Members', tone: 'success' },
  { value: 'REPORT', label: 'Reports', tone: 'danger' },
  { value: 'VERIFICATION', label: 'Verifications', tone: 'warning' },
  { value: 'SUPPORT_TICKET', label: 'Support', tone: 'teal' },
  { value: 'ROLE', label: 'Roles', tone: 'primary' },
  { value: 'SETTINGS', label: 'Settings', tone: 'muted' },
];

export default function AuditLogsPage() {
  const [form, setForm] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openLog, setOpenLog] = useState(null);
  const list = usePaginatedList(listAuditLogs, filters);
  const setField = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));
  const closeDrawer = useCallback(() => setOpenLog(null), []);
  const hasFilters = Object.values(filters).some(Boolean);

  function applyFilters(event) {
    event?.preventDefault?.();
    setFilters({
      ...form,
      actorId: form.actorId.trim(),
      targetId: form.targetId.trim(),
    });
  }

  function applyTargetChip(targetType) {
    const next = { ...form, targetType };
    setForm(next);
    setFilters({
      ...next,
      actorId: next.actorId.trim(),
      targetId: next.targetId.trim(),
    });
  }

  function clearFilters() {
    setForm(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  }

  return (
    <div className="audit-logs-page admin-page">
      <PageHeader
        title="Audit logs"
        subtitle="Immutable trail of staff actions across the admin panel."
      />

      <section className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Target type">
          {TARGET_CHIPS.map((chip) => (
            <button
              key={chip.value || 'all'}
              type="button"
              role="tab"
              aria-selected={filters.targetType === chip.value}
              className={`users-chip ${chip.tone ? `users-chip--${chip.tone}` : ''} ${filters.targetType === chip.value ? 'is-active' : ''}`}
              onClick={() => applyTargetChip(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form className="users-toolbar__form" onSubmit={applyFilters}>
          <FilterSelect label="Action" value={form.action} options={AUDIT_ACTIONS} onChange={setField('action')} />
          <FilterSelect label="Target type" value={form.targetType} options={AUDIT_TARGET_TYPES} onChange={setField('targetType')} />
          <SearchField
            label="Staff id"
            name="actorId"
            grow={false}
            value={form.actorId}
            onChange={setField('actorId')}
            onClear={() => {
              setForm((current) => ({ ...current, actorId: '' }));
              setFilters((current) => ({ ...current, actorId: '' }));
            }}
            placeholder="Enter user ID"
            maxLength={64}
          />
          <SearchField
            label="Target id"
            name="targetId"
            grow={false}
            value={form.targetId}
            onChange={setField('targetId')}
            onClear={() => {
              setForm((current) => ({ ...current, targetId: '' }));
              setFilters((current) => ({ ...current, targetId: '' }));
            }}
            placeholder="Enter user or report ID"
            maxLength={64}
          />
          <button type="submit" className="button button--primary">
            Apply
          </button>
          {hasFilters && (
            <button type="button" className="button button--secondary" onClick={clearFilters}>
              Clear
            </button>
          )}
        </form>
      </section>

      <DataTablePanel
        title="Audit trail"
        subtitle={
          list.isLoading
            ? 'Loading…'
            : `Page ${list.page} · ${formatNumber(list.items.length)} shown${hasFilters ? ' · filtered' : ''}`
        }
      >
        <ListView
          list={list}
          emptyMessage={hasFilters ? 'No audit entries match these filters.' : 'No audit entries yet.'}
          tableClassName="audit-table"
          columns={[
            { key: 'when', label: 'When', className: 'audit-col audit-col--when' },
            { key: 'staff', label: 'Staff', className: 'audit-col audit-col--staff' },
            { key: 'action', label: 'Action', className: 'audit-col audit-col--action' },
            { key: 'target', label: 'Target', className: 'audit-col audit-col--target' },
            { key: 'summary', label: 'Summary', className: 'audit-col audit-col--summary' },
            { key: 'view', label: '', className: 'audit-col audit-col--view' },
          ]}
          renderRow={(log) => (
            <tr
              key={log.id}
              className={`table__row--link users-row${openLog?.id === log.id ? ' is-selected' : ''}`}
              onClick={(event) => {
                if (!event.target.closest('a, button')) setOpenLog(log);
              }}
            >
              <td className="audit-col audit-col--when">
                <span className="audit-when">{formatDateTime(log.createdAt)}</span>
              </td>
              <td className="audit-col audit-col--staff">
                <div className="audit-staff">
                  <UserCell user={log.actor} link={false} />
                  <StatusBadge value={log.actorRole} />
                </div>
              </td>
              <td className="audit-col audit-col--action">
                <span className="audit-action-chip">{formatEnum(log.action)}</span>
              </td>
              <td className="audit-col audit-col--target">
                <AuditTarget log={log} />
              </td>
              <td className="audit-col audit-col--summary">
                <AuditSummary log={log} />
              </td>
              <td className="audit-col audit-col--view">
                <button type="button" className="button button--secondary button--small" onClick={() => setOpenLog(log)}>
                  Details
                </button>
              </td>
            </tr>
          )}
        />
      </DataTablePanel>

      <AuditLogDrawer log={openLog} onClose={closeDrawer} />
    </div>
  );
}
