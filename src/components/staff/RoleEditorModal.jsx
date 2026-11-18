// Create or edit a custom role, including its permission matrix.
// Edit mode always reloads the role from the API so checkboxes match AdminRole in MongoDB.

import { useEffect, useState } from 'react';
import { createRole, getRole, updateRole, updateRolePermissions } from '../../api/staff.api.js';
import { getErrorMessage } from '../../utils/errors.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import LoadingState from '../LoadingState.jsx';
import PermissionMatrix from './PermissionMatrix.jsx';

export default function RoleEditorModal({ open, role, catalog, onClose, onSaved }) {
  const isEdit = Boolean(role);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rank, setRank] = useState(20);
  const [permissions, setPermissions] = useState([]);
  const [slug, setSlug] = useState('');
  const [isSystem, setIsSystem] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setError(null);
      if (!role?.id) {
        setName('');
        setDescription('');
        setRank(20);
        setPermissions([]);
        setSlug('');
        setIsSystem(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fresh = await getRole(role.id);
        if (cancelled) return;
        setName(fresh.name ?? '');
        setDescription(fresh.description ?? '');
        setRank(fresh.rank ?? 20);
        setPermissions(fresh.permissions ?? []);
        setSlug(fresh.slug ?? '');
        setIsSystem(Boolean(fresh.isSystem));
      } catch (loadError) {
        if (cancelled) return;
        setError(getErrorMessage(loadError));
        setName(role.name ?? '');
        setDescription(role.description ?? '');
        setRank(role.rank ?? 20);
        setPermissions(role.permissions ?? []);
        setSlug(role.slug ?? '');
        setIsSystem(Boolean(role.isSystem));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, role]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        rank: Number(rank),
        permissions,
      };
      if (isEdit) {
        await updateRole(role.id, {
          name: payload.name,
          description: payload.description,
          rank: isSystem ? undefined : payload.rank,
        });
        if (slug !== 'SUPER_ADMIN') {
          await updateRolePermissions(role.id, {
            permissions: payload.permissions,
          });
        }
      } else {
        await createRole(payload);
      }
      onSaved(isEdit ? 'Role updated.' : 'Role created.', { roleId: role?.id, slug });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      className="dialog--wide"
      title={isEdit ? `Edit role — ${name || role?.name}` : 'Create custom role'}
      confirmLabel={isEdit ? 'Save role' : 'Create role'}
      isBusy={isSaving}
      error={error}
      confirmDisabled={isLoading || name.trim().length < 2}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="drawer-stack">
          <label className="field">
            <span>Name</span>
            <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} disabled={slug === 'SUPER_ADMIN'} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea rows={2} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          {!isSystem && (
            <label className="field">
              <span>Rank (1–{catalog?.maxCustomRank ?? 30})</span>
              <input type="number" min={1} max={catalog?.maxCustomRank ?? 30} value={rank} onChange={(event) => setRank(event.target.value)} />
            </label>
          )}
          {slug === 'SUPER_ADMIN' ? (
            <p className="muted small">Super Admin permissions are fixed and cannot be reduced.</p>
          ) : (
            <PermissionMatrix modules={catalog?.modules} value={permissions} onChange={setPermissions} />
          )}
        </div>
      )}
    </ConfirmDialog>
  );
}
