// Roles & Permissions: staff accounts, permission matrix, custom roles and sessions.

import { useEffect, useMemo, useState } from 'react';
import { Shield, UserCog, Users } from 'lucide-react';
import {
  createStaff,
  deleteRole,
  deleteStaff,
  getPermissionCatalog,
  getRole,
  getRoleStats,
  getStaffStats,
  listRoles,
  listStaff,
  updateRolePermissions,
} from '../api/staff.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import PermissionMatrix from '../components/staff/PermissionMatrix.jsx';
import RoleEditorModal from '../components/staff/RoleEditorModal.jsx';
import StaffDetailDrawer from '../components/staff/StaffDetailDrawer.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UserCell from '../components/UserCell.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { ACCOUNT_STATUSES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum, formatNumber } from '../utils/format.js';

const EMPTY_FILTERS = { q: '', role: '', status: '' };

function KpiCard({ label, value, icon: Icon, tone, selected, onClick }) {
  return (
    <button type="button" className={`users-kpi users-kpi--${tone} ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="users-kpi__icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="users-kpi__body">
        <span className="users-kpi__label">{label}</span>
        <strong className="users-kpi__value">{formatNumber(value)}</strong>
      </span>
    </button>
  );
}

function CreateStaffDialog({ open, roleOptions, onClose, onCreated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MODERATOR');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      await createStaff({
        email: email.trim(),
        password,
        role,
      });
      onCreated();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  const assignable = roleOptions.filter((item) => item.slug !== 'SUPER_ADMIN' && item.isActive !== false);

  return (
    <ConfirmDialog
      open={open}
      title="Create staff account"
      confirmLabel="Create"
      isBusy={isSaving}
      error={error}
      confirmDisabled={email.trim().length < 3 || password.length < 10}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" />
      </label>
      <label className="field">
        <span>Password (10–128 characters)</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} autoComplete="new-password" />
      </label>
      <label className="field">
        <span>Role</span>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {assignable.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </ConfirmDialog>
  );
}

export default function StaffPage() {
  const { user: me, hasPermission, refreshMe } = useAuth();
  const [view, setView] = useState('staff');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [notice, setNotice] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [roleEditor, setRoleEditor] = useState(null);
  const [matrixRoleId, setMatrixRoleId] = useState(null);
  const [matrixRole, setMatrixRole] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixError, setMatrixError] = useState(null);
  const [matrixEditing, setMatrixEditing] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState([]);
  const [matrixSaveError, setMatrixSaveError] = useState(null);
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [staffDeleteTarget, setStaffDeleteTarget] = useState(null);
  const [staffDeleteError, setStaffDeleteError] = useState(null);
  const [staffDeleteBusy, setStaffDeleteBusy] = useState(false);

  const canCreateStaff = hasPermission('STAFF', 'CREATE');
  const canDeleteStaff = hasPermission('STAFF', 'DELETE');
  const canCreateRole = hasPermission('ROLES', 'CREATE');
  const canEditRole = hasPermission('ROLES', 'EDIT');
  const canDeleteRole = hasPermission('ROLES', 'DELETE');

  const staffStats = useApi(() => getStaffStats(), []);
  const roleStats = useApi(() => getRoleStats(), []);
  const catalog = useApi(() => getPermissionCatalog(), []);
  const roles = useApi(() => listRoles(), []);
  const listFilters = useMemo(() => {
    const params = { ...filters };
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
    return params;
  }, [filters]);
  const list = usePaginatedList(listStaff, listFilters);

  const roleOptions = roles.data?.items ?? [];

  useEffect(() => {
    if (!matrixRoleId && roleOptions.length > 0) {
      setMatrixRoleId(roleOptions[0].id);
    }
  }, [matrixRoleId, roleOptions]);

  useEffect(() => {
    if (!matrixRoleId) {
      setMatrixRole(null);
      setMatrixEditing(false);
      setDraftPermissions([]);
      setMatrixSaveError(null);
      return undefined;
    }

    let cancelled = false;
    setMatrixLoading(true);
    setMatrixError(null);
    setMatrixEditing(false);
    setMatrixSaveError(null);

    getRole(matrixRoleId)
      .then((role) => {
        if (!cancelled) {
          setMatrixRole(role);
          setDraftPermissions(role.permissions ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMatrixError(getErrorMessage(err));
          setMatrixRole(null);
          setDraftPermissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMatrixLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [matrixRoleId, roles.data]);

  function startMatrixEdit() {
    if (!matrixRole || matrixRole.slug === 'SUPER_ADMIN') return;
    setDraftPermissions(matrixRole.permissions ?? []);
    setMatrixSaveError(null);
    setMatrixEditing(true);
  }

  function cancelMatrixEdit() {
    setDraftPermissions(matrixRole?.permissions ?? []);
    setMatrixSaveError(null);
    setMatrixEditing(false);
  }

  async function saveMatrixPermissions() {
    if (!matrixRole) return;
    setMatrixSaving(true);
    setMatrixSaveError(null);
    try {
      const saved = await updateRolePermissions(matrixRole.id, { permissions: draftPermissions });
      setMatrixRole(saved);
      setDraftPermissions(saved.permissions ?? []);
      setMatrixEditing(false);
      setNotice(`Permissions updated for ${saved.name}.`);
      await roles.reload();
      roleStats.reload();
      await refreshMe().catch(() => {});
    } catch (err) {
      setMatrixSaveError(getErrorMessage(err));
    } finally {
      setMatrixSaving(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  }

  async function confirmDeleteRole() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      setNotice('Role deleted.');
      if (matrixRoleId === deleteTarget.id) setMatrixRoleId(null);
      roles.reload();
      roleStats.reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function confirmDeleteStaff() {
    setStaffDeleteBusy(true);
    setStaffDeleteError(null);
    try {
      await deleteStaff(staffDeleteTarget.id);
      setStaffDeleteTarget(null);
      if (selectedStaffId === staffDeleteTarget.id) setSelectedStaffId(null);
      setNotice('Staff account deleted.');
      list.reload();
      staffStats.reload();
    } catch (err) {
      setStaffDeleteError(getErrorMessage(err));
    } finally {
      setStaffDeleteBusy(false);
    }
  }

  return (
    <div className="staff-page">
      <PageHeader
        title="Staff & roles"
        subtitle="Manage staff accounts, permission matrices and sessions."
        actions={
          <div className="stack-inline">
            {view === 'staff' && canCreateStaff && (
              <button type="button" className="button button--primary" onClick={() => setCreateOpen(true)}>
                Create staff
              </button>
            )}
            {view === 'roles' && canCreateRole && (
              <button type="button" className="button button--primary" onClick={() => setRoleEditor({ role: null })}>
                Create role
              </button>
            )}
          </div>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <div className="staff-kpi-grid">
        {staffStats.data && (
          <>
            <KpiCard label="Staff" value={staffStats.data.total} icon={Users} tone="primary" selected={view === 'staff'} onClick={() => setView('staff')} />
            <KpiCard
              label="Active"
              value={staffStats.data.active}
              icon={UserCog}
              tone="success"
              selected={false}
              onClick={() => {
                setView('staff');
                setFilters({ ...EMPTY_FILTERS, status: 'ACTIVE' });
              }}
            />
          </>
        )}
        {roleStats.data && (
          <>
            <KpiCard label="Roles" value={roleStats.data.roles} icon={Shield} tone="online" selected={view === 'roles'} onClick={() => setView('roles')} />
            <KpiCard label="Custom roles" value={roleStats.data.customRoles} icon={Shield} tone="muted" selected={false} onClick={() => setView('roles')} />
          </>
        )}
        {(staffStats.isLoading || roleStats.isLoading) && !staffStats.data && <LoadingState />}
      </div>

      <section className="users-toolbar card">
        <div className="users-toolbar__chips" role="tablist">
          {[
            { value: 'staff', label: 'Staff accounts' },
            { value: 'roles', label: 'Roles & matrix' },
          ].map((chip) => (
            <button
              key={chip.value}
              type="button"
              role="tab"
              aria-selected={view === chip.value}
              className={`users-chip ${view === chip.value ? 'is-active' : ''}`}
              onClick={() => setView(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {view === 'staff' && (
          <form className="users-toolbar__form" onSubmit={handleSearch}>
            <SearchField
              value={searchText}
              onChange={setSearchText}
              onClear={() => setFilters((current) => ({ ...current, q: '' }))}
              placeholder="Search staff email"
            />
            <button type="submit" className="button button--primary">
              Search
            </button>
            <FilterSelect
              label="Status"
              value={filters.status}
              options={ACCOUNT_STATUSES}
              onChange={(status) => setFilters((current) => ({ ...current, status }))}
            />
            <label className="field field--inline">
              <span>Role</span>
              <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}>
                <option value="">All roles</option>
                {roleOptions.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </form>
        )}
      </section>

      {view === 'staff' ? (
        <DataTablePanel
          title="Staff accounts"
          subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${formatNumber(list.items.length)} shown`}
        >
          <ListView
            list={list}
            emptyMessage="No staff accounts match these filters."
            columns={[
              { key: 'staff', label: 'Staff', className: 'staff-col staff-col--name' },
              { key: 'email', label: 'Email', className: 'staff-col staff-col--email' },
              { key: 'role', label: 'Role', className: 'staff-col staff-col--role' },
              { key: 'status', label: 'Status', className: 'staff-col staff-col--status' },
              { key: 'lastActive', label: 'Last active', className: 'staff-col staff-col--date' },
              { key: 'joined', label: 'Joined', className: 'staff-col staff-col--date' },
              ...(canDeleteStaff ? [{ key: 'actions', label: '', className: 'data-table__actions-col' }] : []),
            ]}
            renderRow={(staff) => (
              <tr
                key={staff.id}
                className={`users-row ${selectedStaffId === staff.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedStaffId(staff.id)}
              >
                <td className="staff-col staff-col--name">
                  <div className="staff-row__identity">
                    <UserCell user={staff} link={false} />
                    {staff.id === me?.id ? <span className="staff-you-chip">You</span> : null}
                  </div>
                </td>
                <td className="staff-col staff-col--email">
                  <span className="staff-row__email">{staff.email ?? '—'}</span>
                </td>
                <td className="staff-col staff-col--role">
                  <span className="staff-role-chip">{formatEnum(staff.role)}</span>
                </td>
                <td className="staff-col staff-col--status">
                  <StatusBadge value={staff.status} />
                </td>
                <td className="staff-col staff-col--date users-row__date">{formatDateTime(staff.lastActiveAt)}</td>
                <td className="staff-col staff-col--date users-row__date">{formatDateTime(staff.createdAt)}</td>
                {canDeleteStaff ? (
                  <td className="data-table__actions-col" onClick={(event) => event.stopPropagation()}>
                    {staff.id !== me?.id ? (
                      <button
                        type="button"
                        className="button button--danger button--small"
                        onClick={() => setStaffDeleteTarget(staff)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            )}
          />
        </DataTablePanel>
      ) : (
        <div className="staff-roles-layout">
          <DataTablePanel title="Roles" subtitle={`${formatNumber(roleOptions.length)} roles`}>
            <div className="table-wrap table-wrap--data">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Rank</th>
                    <th>Staff</th>
                    <th>Type</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {roleOptions.map((role) => (
                    <tr key={role.id} className={matrixRole?.id === role.id || matrixRoleId === role.id ? 'is-selected-row' : ''}>
                      <td>
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => {
                            if (matrixEditing && matrixRoleId !== role.id) cancelMatrixEdit();
                            setMatrixRoleId(role.id);
                          }}
                        >
                          <strong>{role.name}</strong>
                          <div className="muted small">{role.slug}</div>
                        </button>
                      </td>
                      <td>{role.rank}</td>
                      <td>{role.staffCount}</td>
                      <td>
                        <span className={`staff-role-chip ${role.isSystem ? 'staff-role-chip--system' : ''}`}>
                          {role.isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td>
                        <div className="stack-inline">
                          {canEditRole && (
                            <button type="button" className="button button--secondary button--small" onClick={() => setRoleEditor({ role })}>
                              Edit
                            </button>
                          )}
                          {canDeleteRole && !role.isSystem && (
                            <button type="button" className="button button--danger button--small" onClick={() => setDeleteTarget(role)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataTablePanel>
          <DataTablePanel
            title={matrixRole ? `Permissions — ${matrixRole.name}` : 'Permission matrix'}
            subtitle={
              matrixEditing
                ? 'Edit mode — toggle VIEW, CREATE, EDIT and DELETE, then save.'
                : matrixRole
                  ? matrixRole.description || formatEnum(matrixRole.slug)
                  : 'Select a role to inspect module access'
            }
            actions={
              matrixRole && canEditRole && matrixRole.slug !== 'SUPER_ADMIN' ? (
                matrixEditing ? (
                  <div className="stack-inline">
                    <button type="button" className="button button--secondary button--small" onClick={cancelMatrixEdit} disabled={matrixSaving}>
                      Cancel
                    </button>
                    <button type="button" className="button button--primary button--small" onClick={saveMatrixPermissions} disabled={matrixSaving}>
                      {matrixSaving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                ) : (
                  <button type="button" className="button button--primary button--small" onClick={startMatrixEdit}>
                    Edit permissions
                  </button>
                )
              ) : matrixRole?.slug === 'SUPER_ADMIN' ? (
                <span className="muted small">Fixed matrix</span>
              ) : null
            }
          >
            <div className="staff-matrix-body">
              {matrixLoading ? (
                <LoadingState />
              ) : matrixError ? (
                <p className="state state--error">{matrixError}</p>
              ) : matrixRole ? (
                <>
                  {matrixSaveError ? <p className="form-error" role="alert">{matrixSaveError}</p> : null}
                  {matrixRole.slug === 'SUPER_ADMIN' ? (
                    <p className="muted small">Super Admin permissions are fixed and cannot be reduced.</p>
                  ) : null}
                  <PermissionMatrix
                    modules={catalog.data?.modules}
                    value={matrixEditing ? draftPermissions : matrixRole.permissions}
                    readOnly={!matrixEditing}
                    onChange={matrixEditing ? setDraftPermissions : () => {}}
                  />
                </>
              ) : (
                <p className="muted">Select a role to inspect its module permissions.</p>
              )}
            </div>
          </DataTablePanel>
        </div>
      )}

      {selectedStaffId && (
        <StaffDetailDrawer
          userId={selectedStaffId}
          me={me}
          roleOptions={roleOptions.filter((item) => item.slug !== 'SUPER_ADMIN' || me?.role === 'SUPER_ADMIN')}
          onClose={() => setSelectedStaffId(null)}
          onChanged={(message) => {
            setNotice(message);
            list.reload();
            staffStats.reload();
          }}
        />
      )}

      {createOpen && canCreateStaff && (
        <CreateStaffDialog
          open
          roleOptions={roleOptions}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            setNotice('Staff account created.');
            list.reload();
            staffStats.reload();
          }}
        />
      )}

      {roleEditor && (
        <RoleEditorModal
          open
          role={roleEditor.role}
          catalog={catalog.data}
          onClose={() => setRoleEditor(null)}
          onSaved={async (message, meta) => {
            setRoleEditor(null);
            setNotice(message);
            await roles.reload();
            roleStats.reload();
            if (meta?.roleId) setMatrixRoleId(meta.roleId);
            else if (matrixRoleId) setMatrixRoleId(matrixRoleId);
            if (meta?.slug && me?.role === meta.slug) {
              await refreshMe().catch(() => {});
            } else {
              await refreshMe().catch(() => {});
            }
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title={`Delete role ${deleteTarget.name}?`}
          message="Staff must be reassigned first. This cannot be undone."
          confirmLabel="Delete role"
          tone="danger"
          isBusy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDeleteRole}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
        />
      )}

      {staffDeleteTarget && (
        <ConfirmDialog
          open
          title={`Delete ${staffDeleteTarget.email || staffDeleteTarget.displayName || 'staff'}?`}
          message="This permanently deletes the staff account and signs them out everywhere. This cannot be undone."
          confirmLabel="Delete"
          tone="danger"
          isBusy={staffDeleteBusy}
          error={staffDeleteError}
          onConfirm={confirmDeleteStaff}
          onCancel={() => {
            setStaffDeleteTarget(null);
            setStaffDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
