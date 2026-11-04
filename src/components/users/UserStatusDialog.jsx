// Dialog for PATCH /admin/users/:userId/status.

import { useState } from 'react';
import { changeUserStatus } from '../../api/users.api.js';
import { ACCOUNT_STATUSES } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatEnum, localInputToIso } from '../../utils/format.js';
import ConfirmDialog from '../ConfirmDialog.jsx';

// Returns the statuses the signed-in staff member may set on this account, or [] when none.
export function allowedStatuses(staff, account) {
  if (!staff || !account) return [];
  if (staff.id === account.id) return [];
  if (staff.role === 'ADMIN') return ACCOUNT_STATUSES;
  if (account.role !== 'USER' || account.status === 'BANNED') return [];
  return ACCOUNT_STATUSES.filter((status) => status !== 'BANNED');
}

export default function UserStatusDialog({ open, account, options, presetStatus, onClose, onSaved }) {
  const initial = presetStatus && options.includes(presetStatus)
    ? presetStatus
    : options.find((option) => option !== account.status) ?? options[0];
  const [status, setStatus] = useState(initial);
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDestructive = status === 'SUSPENDED' || status === 'BANNED';
  const confirmLabel =
    status === 'ACTIVE' ? 'Set Active' : status === 'SUSPENDED' ? 'Set Inactive' : `Set ${formatEnum(status)}`;
  const dialogTitle =
    status === 'ACTIVE' ? 'Activate account' : status === 'SUSPENDED' ? 'Deactivate account' : 'Change account status';
  const dialogMessage =
    status === 'SUSPENDED'
      ? 'Inactive (suspended) signs the member out on every device and ends all their matches.'
      : status === 'BANNED'
        ? 'Banning signs the member out on every device and ends all their matches.'
        : status === 'ACTIVE'
          ? 'The member will be able to use the app again.'
          : undefined;

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const body = { status, reason: reason.trim(), ...(status === 'SUSPENDED' && until ? { until: localInputToIso(until) } : {}) };
      onSaved(await changeUserStatus(account.id, body));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={dialogTitle}
      message={dialogMessage}
      confirmLabel={confirmLabel}
      tone={isDestructive ? 'danger' : 'primary'}
      isBusy={isSaving}
      error={error}
      confirmDisabled={reason.trim().length < 3}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>New status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {formatEnum(option)}
            </option>
          ))}
        </select>
      </label>
      {status === 'SUSPENDED' && (
        <label className="field">
          <span>Suspended until (leave empty for no end date)</span>
          <input type="datetime-local" value={until} onChange={(event) => setUntil(event.target.value)} />
        </label>
      )}
      <label className="field">
        <span>Reason (3–500 characters, kept in the audit log)</span>
        <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
    </ConfirmDialog>
  );
}
