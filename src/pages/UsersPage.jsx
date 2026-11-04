// User management: one list for accounts and dating profiles.

import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  Plus,
  XCircle,
} from 'lucide-react';
import { listUsers } from '../api/users.api.js';
import FilterSelect from '../components/FilterSelect.jsx';
import ListView from '../components/ListView.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import AddUserDialog from '../components/users/AddUserDialog.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ScheduleDeletionDialog from '../components/users/ScheduleDeletionDialog.jsx';
import UserActionsMenu from '../components/users/UserActionsMenu.jsx';
import UserDetailDrawer from '../components/users/UserDetailDrawer.jsx';
import UserStatusDialog, { allowedStatuses } from '../components/users/UserStatusDialog.jsx';
import UserCell from '../components/UserCell.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import {
  ROLES,
  USER_GENDER_FILTERS,
  USER_ONLINE_FILTERS,
  VERIFICATION_STATUSES,
} from '../utils/constants.js';
import { downloadCsv } from '../utils/exportCsv.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

const EMPTY_FILTERS = {
  q: '',
  status: '',
  role: '',
  verificationStatus: '',
  online: '',
  activity: '',
  visibility: '',
  photoModeration: '',
  onboardingComplete: '',
  gender: '',
  sortBy: 'createdAt',
  sortDir: 'desc',
};

const CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active', tone: 'success' },
  { value: 'inactive', label: 'Inactive', tone: 'muted' },
  { value: 'WARNED', label: 'Warned', tone: 'warning' },
  { value: 'SUSPENDED', label: 'Suspended', tone: 'warning' },
  { value: 'BANNED', label: 'Banned', tone: 'danger' },
  { value: 'VISIBLE', label: 'Visible', tone: 'success' },
  { value: 'HIDDEN', label: 'Hidden', tone: 'danger' },
  { value: 'incomplete', label: 'Incomplete', tone: 'muted' },
  { value: 'queue', label: 'Photo pending', tone: 'warning' },
];

function quickChipValue(filters) {
  if (filters.photoModeration === 'PENDING') return 'queue';
  if (filters.onboardingComplete === 'false') return 'incomplete';
  if (filters.visibility && !filters.status && !filters.activity) return filters.visibility;
  if (filters.activity === 'inactive' && filters.status === 'ACTIVE') return 'inactive';
  if (filters.status === 'ACTIVE' && (filters.activity === 'active' || !filters.activity)) return 'active';
  if (filters.status && ['WARNED', 'SUSPENDED', 'BANNED'].includes(filters.status) && !filters.activity) {
    return filters.status;
  }
  if (!filters.status && !filters.activity && !filters.online && !filters.visibility && !filters.photoModeration && !filters.onboardingComplete) {
    return 'all';
  }
  return '';
}

function patchForChip(value) {
  if (value === 'all') return {};
  if (value === 'active') return { status: 'ACTIVE', activity: 'active' };
  if (value === 'inactive') return { status: 'ACTIVE', activity: 'inactive' };
  if (value === 'incomplete') return { onboardingComplete: 'false' };
  if (value === 'queue') return { photoModeration: 'PENDING' };
  if (['VISIBLE', 'HIDDEN', 'PAUSED', 'SNOOZED'].includes(value)) return { visibility: value };
  return { status: value };
}

function isAccountOn(user) {
  return user.status === 'ACTIVE' || user.status === 'WARNED';
}

function formatGender(value) {
  if (value === 'MAN') return 'Male';
  if (value === 'WOMAN') return 'Female';
  return formatEnum(value);
}

export default function UsersPage() {
  const { user: staff } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const list = usePaginatedList(listUsers, filters);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusPreset, setStatusPreset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const quickChip = quickChipValue(filters);

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  const setFilter = (field) => (value) => setFilters((current) => ({ ...current, [field]: value }));

  function applyChip(value) {
    setFilters((current) => ({ ...EMPTY_FILTERS, q: current.q, gender: current.gender, ...patchForChip(value) }));
  }

  function openUser(user, tab = 'overview') {
    setDrawerTab(tab);
    setSelectedUserId(user.id);
  }

  function openStatus(account, preset) {
    setStatusTarget(account);
    setStatusPreset(preset);
  }

  function refreshAll() {
    list.reload();
  }

  function exportExcel() {
    const rows = list.items.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      status: user.status,
      verificationStatus: user.verificationStatus,
      gender: user.gender,
      visibilityStatus: user.visibilityStatus,
      photoCount: user.photoCount,
      pendingPhotoCount: user.pendingPhotoCount,
      role: user.role,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    }));
    downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, [
      'id',
      'displayName',
      'phoneNumber',
      'email',
      'gender',
      'status',
      'verificationStatus',
      'visibilityStatus',
      'photoCount',
      'pendingPhotoCount',
      'role',
      'createdAt',
      'lastActiveAt',
    ], rows);
    setNotice(`Exported ${rows.length} member row${rows.length === 1 ? '' : 's'} as CSV.`);
  }

  const columns = [
    { key: 'name', label: 'Name', className: 'users-col users-col--name' },
    { key: 'phone', label: 'Phone', className: 'users-col users-col--phone' },
    { key: 'gender', label: 'Gender', className: 'users-col users-col--gender' },
    { key: 'verification', label: 'Verification', className: 'users-col users-col--verification' },
    { key: 'photos', label: 'Photos', className: 'users-col users-col--photos' },
    { key: 'visibility', label: 'Visibility', className: 'users-col users-col--visibility' },
    { key: 'status', label: 'Status', className: 'users-col users-col--status' },
    { key: 'updated', label: 'Updated', className: 'users-col users-col--updated' },
    { key: 'actions', label: 'Actions', className: 'data-table__actions-col' },
  ];

  return (
    <div className="users-page">
      <PageHeader
        title="Users"
        subtitle="Members, dating cards and photo review in one list."
        actions={
          <>
            <button type="button" className="button button--secondary" onClick={exportExcel} disabled={!list.items.length}>
              <FileSpreadsheet size={15} aria-hidden />
              Download Excel
            </button>
            <button type="button" className="button button--primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} aria-hidden />
              Add user
            </button>
          </>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <section className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist" aria-label="Member filter">
          {CHIPS.map((chip) => {
            const active = (quickChip || 'all') === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                role="tab"
                aria-selected={active}
                className={`users-chip ${chip.tone ? `users-chip--${chip.tone}` : ''} ${active ? 'is-active' : ''}`}
                onClick={() => applyChip(chip.value)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <form className="users-toolbar__form" onSubmit={handleSearch}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Name, email, phone or usr_…"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect label="Role" value={filters.role} options={ROLES} onChange={setFilter('role')} />
          <FilterSelect
            label="Verification"
            value={filters.verificationStatus}
            options={VERIFICATION_STATUSES}
            onChange={setFilter('verificationStatus')}
          />
          <label className="field field--inline">
            <span>Presence</span>
            <select value={filters.online} onChange={(event) => setFilter('online')(event.target.value)}>
              {USER_ONLINE_FILTERS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--inline">
            <span>Gender</span>
            <select value={filters.gender} onChange={(event) => setFilter('gender')(event.target.value)}>
              {USER_GENDER_FILTERS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <section className="users-table-panel card users-table-panel--data">
        <header className="users-table-panel__header">
          <div>
            <h2>Members</h2>
            <p className="muted small">
              {list.isLoading ? 'Loading…' : `Page ${list.page} · ${formatNumber(list.items.length)} shown`}
              {filters.q ? ` · “${filters.q}”` : ''}
            </p>
          </div>
        </header>

        <ListView
          list={list}
          emptyMessage="No members match these filters."
          columns={columns}
          renderRow={(user) => {
            const on = isAccountOn(user);
            const canToggle = allowedStatuses(staff, user).some((status) => status === 'ACTIVE' || status === 'SUSPENDED');
            return (
              <tr
                key={user.id}
                className={`users-row ${selectedUserId === user.id ? 'is-selected' : ''}`}
                onClick={() => openUser(user, user.pendingPhotoCount > 0 ? 'profile' : 'overview')}
              >
                <td className="users-col users-col--name">
                  <div className="users-row__identity">
                    <span className={`users-row__state-icon ${on ? 'is-on' : 'is-off'}`} title={formatEnum(user.status)}>
                      {on ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
                    </span>
                    <UserCell user={user} link={false} />
                    {user.possibleDuplicate && (
                      <span className="risk-chip" title={user.riskFlags?.map((flag) => flag.label).join(' · ')}>
                        <Copy size={12} aria-hidden /> Duplicate
                      </span>
                    )}
                  </div>
                </td>
                <td className="users-col users-col--phone">
                  <div className="users-row__contact">
                    <span>{user.phoneNumber ?? '—'}</span>
                    <span className="muted small">{user.email ?? '—'}</span>
                  </div>
                </td>
                <td className="users-col users-col--gender">{formatGender(user.gender)}</td>
                <td className="users-col users-col--verification">
                  <StatusBadge value={user.verificationStatus} />
                </td>
                <td className="users-col users-col--photos">
                  {user.photoCount ?? 0}
                  {user.pendingPhotoCount > 0 && (
                    <span className="badge badge--warning badge--flush">{user.pendingPhotoCount} pending</span>
                  )}
                </td>
                <td className="users-col users-col--visibility">
                  {user.visibilityStatus ? <StatusBadge value={user.visibilityStatus} /> : <span className="muted">—</span>}
                </td>
                <td className="users-col users-col--status" onClick={(event) => event.stopPropagation()}>
                  <label className={`status-switch ${!canToggle ? 'is-disabled' : ''}`} title={formatEnum(user.status)}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!canToggle}
                      onChange={() => openStatus(user, on ? 'SUSPENDED' : 'ACTIVE')}
                    />
                    <span className="status-switch__track" aria-hidden>
                      <span className="status-switch__thumb" />
                    </span>
                    <span className="sr-only">{on ? 'Active' : 'Inactive'}</span>
                  </label>
                </td>
                <td className="users-col users-col--updated users-row__date">
                  {formatDateTime(user.lastActiveAt || user.createdAt)}
                </td>
                <td className="data-table__actions-col" onClick={(event) => event.stopPropagation()}>
                  <UserActionsMenu
                    account={user}
                    staff={staff}
                    onView={(account) => openUser(account)}
                    onStatusAction={(status) => openStatus(user, status)}
                    onDeleteAction={(account) => setDeleteTarget(account)}
                  />
                </td>
              </tr>
            );
          }}
        />
      </section>

      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          initialTab={drawerTab}
          onClose={() => setSelectedUserId(null)}
          onChanged={refreshAll}
        />
      )}

      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => {
          setAddOpen(false);
          setNotice(`Created ${created.displayName} (${created.phoneNumber ?? 'no phone'}).`);
          refreshAll();
          openUser(created);
        }}
      />

      {statusTarget && (
        <UserStatusDialog
          key={`${statusTarget.id}-${statusPreset ?? 'default'}`}
          open
          account={statusTarget}
          options={allowedStatuses(staff, statusTarget)}
          presetStatus={statusPreset}
          onClose={() => setStatusTarget(null)}
          onSaved={(updated) => {
            setStatusTarget(null);
            setNotice(`Status for ${updated.displayName} set to ${formatEnum(updated.status)}.`);
            refreshAll();
          }}
        />
      )}

      {deleteTarget && (
        <ScheduleDeletionDialog
          open
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(result) => {
            setDeleteTarget(null);
            setNotice(
              `Deletion scheduled for ${deleteTarget.displayName || deleteTarget.email}. Data erases after ${result.graceDays ?? 14} days unless they sign in again.`,
            );
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
