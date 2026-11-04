// Create or edit a custom role, including its permission matrix.

import { useEffect, useState } from 'react';
import { createRole, updateRole, updateRolePermissions } from '../../api/staff.api.js';
import { getErrorMessage } from '../../utils/errors.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import PermissionMatrix from './PermissionMatrix.jsx';

export default function RoleEditorModal({ open, role, catalog, onClose, onSaved }) {
  const isEdit = Boolean(role);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rank, setRank] = useState(20);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? '');
    setDescription(role?.description ?? '');
    setRank(role?.rank ?? 20);
    setPermissions(role?.permissions ?? []);
    setError(null);
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
          rank: role.isSystem ? undefined : payload.rank,
        });
        if (!role.isSystem || role.slug !== 'SUPER_ADMIN') {
          await updateRolePermissions(role.id, {
            permissions: payload.permissions,
          });
        }
      } else {
        await createRole(payload);
      }
      onSaved(isEdit ? 'Role updated.' : 'Role created.');
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={isEdit ? `Edit role — ${role?.name}` : 'Create custom role'}
      confirmLabel={isEdit ? 'Save role' : 'Create role'}
      isBusy={isSaving}
      error={error}
      confirmDisabled={name.trim().length < 2}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      <div className="drawer-stack">
        <label className="field">
          <span>Name</span>
          <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} disabled={role?.slug === 'SUPER_ADMIN'} />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea rows={2} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        {!role?.isSystem && (
          <label className="field">
            <span>Rank (1–{catalog?.maxCustomRank ?? 30})</span>
            <input type="number" min={1} max={catalog?.maxCustomRank ?? 30} value={rank} onChange={(event) => setRank(event.target.value)} />
          </label>
        )}
        {role?.slug === 'SUPER_ADMIN' ? (
          <p className="muted small">Super Admin permissions are fixed and cannot be reduced.</p>
        ) : (
          <PermissionMatrix modules={catalog?.modules} value={permissions} onChange={setPermissions} />
        )}
      </div>
    </ConfirmDialog>
  );
}
